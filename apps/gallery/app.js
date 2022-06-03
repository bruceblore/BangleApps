const storage = require('Storage');

let imageFiles = storage.list(/^gal-.*\.img/).sort();

let imageMenu = { '': { 'title': 'Gallery' } };

for (let fileName of imageFiles) {
    let displayName = fileName.substr(4, fileName.length - 8);          // Trim off the 'gal-' and '.img' for a friendly display name
    imageMenu[displayName] = eval(`() => { drawImage("${fileName}"); }`);    // Unfortunately, eval is the only reasonable way to do this
}

let cachedOptions = Bangle.getOptions();    // We will change the backlight and timeouts later, and need to restore them when displaying the menu
let backlightSetting = storage.readJSON('setting.json').brightness; // LCD brightness is not included in there for some reason

function drawMenu() {
    Bangle.removeListener('touch', drawMenu);   // We no longer want touching to reload the menu
    Bangle.setOptions(cachedOptions);           // The drawImage function set no timeout, undo that
    Bangle.setLCDBrightness(backlightSetting);  // Restore backlight

    E.showMenu(imageMenu);
}

function drawImage(fileName) {
    E.showMenu();   // Remove the menu to prevent it from breaking things
    setTimeout(() => { Bangle.on('touch', drawMenu); }, 300);   // Touch the screen to go back to the image menu (300ms timeout to allow user to lift finger)
    Bangle.setOptions({             // Disable display power saving while showing the image
        lockTimeout: 0,
        lcdPowerTimeout: 0,
        backlightTimeout: 0
    });
    Bangle.setLCDBrightness(1);     // Full brightness

    let image = eval(storage.read(fileName));   // Sadly, the only reasonable way to do this
    g.clear().reset().drawImage(image, 0, 0);
}

// We don't load the widgets because there is no reasonable way to unload them
drawMenu();