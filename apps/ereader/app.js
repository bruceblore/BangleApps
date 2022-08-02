const storage = require('Storage')

const DATA_FILE = "ereader.json";
const CHUNK_SIZE = 8192;  // How many characters to load into memory at once. = Maximum length of title and maximum number of characters on screen

let data = Object.assign({
  backlight: false,
  forceBrightness: false,
  brightness: 1,
  forceBacklightTimeout: true,
  backlightTimeout: 0,
  fontSize: 12,
  widgets: true,
  books: [
    // This would not be found automatically
    {
      fileName: "ereader.example",      // Name of the file that contains information about this book, must be unique
      title: 'ereader app tutorial',    // The title of the book contained within the metadata (can be up to 8192 characters long, must be unique)
      position: 21,                     // The index of the first character of the text that should appear on-screen
      minPos: 21,                       // Where the title ends and the book begins
      lastRead: (new Date()).getTime()  // The last tfime the user chose to read this book
    }
  ]
}, storage.readJSON(DATA_FILE, true));

E.showMessage('Scanning...');

// Build a list of the names of files we're currently keeping track of. If they do exist, we don't have to add them to the database again in the next step. If they don't exist, we have to remove them from our index
let trackedFilenames = [];
let booksToRemove = []; // Avoid concurrent modification
for (let book of data.books) {
  if (storage.read(book.fileName) != undefined) trackedFilenames.push(book.fileName);
  else booksToRemove.push(book);
}
data.books.filter(book => !booksToRemove.includes(book));

// Scan for new books and add them to the database
for (fileName of storage.list(/\.book$/)) {
  if (trackedFilenames.includes(fileName)) continue;

  let txt = storage.read(fileName, 0, CHUNK_SIZE);
  let newlineIndex = txt.indexOf('\n');
  let title = txt.substr(0, newlineIndex);
  data.books.push({
    fileName: fileName,
    title: title,
    position: newlineIndex + 1,
    minPos: newlineIndex + 1,
    lastRead: (new Date()).getTime()
  });
}

// Write state information to SPI flash only when closing tha application, because otherwise there would be a lot of writes. This both reduces wear on the flash and prevents me from having to figure out when exactly to write the state info.
E.on('kill', () => {
  storage.writeJSON(DATA_FILE, data);
});

// Try to render the given text and return the number of characters that were actually rendered
function renderText(text, topY, fontHeight) {
  let lines = g.reset().setFont('Vector', fontHeight).wrapString(text, g.getWidth()).slice(0, (g.geteight() - topY) / fontHeight);
  g.drawString(lines.join('\n'), 0, topY);
  return lines.reduce((previousValue, line) => previousValue + line.length, 0);
}

// Set up the reader and load the book
function openBook(title) {
  let systemSettings = storage.readJSON('setting.json');
  let brightness = data.forceBrightness ? data.brightness : systemSettings.brightness;
  Bangle.setLCDBrightness(data.backlight ? brightness : 0);
  setWatch(() => {
    data.backlight = !data.backlight;
    Bangle.setLCDBrightness(data.backlight ? brightness : 0);
  }, BTN1, { repeat: true });

  Bangle.setOptions({
    lockTimeout: 0,
    backlightTimeout: forceBacklightTimeout ? (data.backlightTimeout * 1000) : systemSettings.options.backlightTimeout
  });

  let topY = data.widgets ? 24 : 0;
  let book = booksByTitle[title];

  let renderedChars = renderText(storage.read(book.fileName, book.position, CHUNK_SIZE), topY, data.fontSize);

  Bangle.on('touch', (button, xy) => {
    if (button == 1) book.position = Math.max(book.position - 1024, book.minPos);
    else book.position += renderedChars;
    renderedChars = renderText(storage.read(book.fileName, book.position, CHUNK_SIZE), topY, data.fontSize);
  });
}

// Build and show the menu of books
E.showMenu('Rendering menu...')
let booksByTitle = {};
let menu = {
  '': { 'title': 'Books' },
}
for (book of data.books) {
  booksByTitle[book.title] = book;
  menu[book.title] = eval(`() => { openBook(${book.title}); }`);
}
if (data.widgets) {
  Bangle.loadWidgets();
  Bangle.drawWidgets();
}
E.showMenu(menu);