{
  const loader = require('folderlaunch-configLoad.js')

  const FOLDER_ICON = require("heatshrink").decompress(atob("mEwwMA///wAJCAoPAAongAonwAon4Aon8Aon+Aon/AooA/AH4A/AFgA="))

  let config: Config = loader.getConfig();

  let timeout: any;
  /**
   * If a timeout to return to the clock is set, reset it.
   */
  function resetTimeout() {
    if (timeout) {
      clearTimeout(timeout);
    }

    if (config.timeout != 0) {
      timeout = setTimeout(() => {
        Bangle.showClock();
      }, config.timeout);
    }
  }

  let folderPath: Array<string> = [];
  let folder: Folder = getFolder(folderPath);
  /**
   * Get the folder at the provided path
   *
   * @param folderPath a path for the desired folder
   * @return the folder that was found
   */
  function getFolder(folderPath: Array<string>): Folder {
    let result: Folder = config.rootFolder;
    for (let folderName of folderPath)
      result = folder.folders[folderName]!;
    return result;
  }

  // grid[x][y] = id of app at column x row y, or undefined if no app displayed there
  let grid: Array<Array<GridEntry>> = [];
  for (let x = 0; x < config.display.rows; x++) {
    grid.push([]);
    for (let y = 0; y < config.display.rows; y++) {
      grid[x]!.push({
        type: 'empty',
        id: ''
      });
    }
  }
  function render() {
    let gridSize: number = config.display.rows * config.display.rows;
    let startIndex: number = page * gridSize; // Start at this position in the folders

    // Populate the grid
    for (let i = 0; i < gridSize; i++) {
      // Calculate coordinates
      let y = Math.floor(i / config.display.rows);
      let x = i % config.display.rows;

      // Try to place a folder
      let folderIndex = startIndex + i;
      if (folderIndex < folder.folders.length) {
        grid[x]![y]!.type = 'folder';
        grid[x]![y]!.id = Object.keys(folder.folders)[i];
        continue;
      }

      // If that fails, try to place an app
      let appIndex = folderIndex - folder.folders.length;
      if (appIndex < folder.apps.length) {
        grid[x]![y]!.type = 'app';
        grid[x]![y]!.id = folder.apps[appIndex]!;
        continue;
      }

      // If that also fails, make the space empty
      grid[x]![y]!.type = 'empty';
    }

    // Prepare to draw the grid
    g.clearRect(0, 24, g.getWidth(), g.getHeight())
      .reset()
      .setFontAlign(0, -1);
    let squareSize: number = (g.getHeight() - 24) / config.display.rows;
    let iconSize: number = config.display.icon ? squareSize : 0;
    if (config.display.font) {
      g.setFont(config.display.font as FontNameWithScaleFactor);
      iconSize = Math.max(0, iconSize - g.getFontHeight());
    }
    let iconScale: number = iconSize / 48;

    // Actually draw the grid
    for (let x = 0; x < config.display.rows; x++) {
      for (let y = 0; y < config.display.rows; y++) {
        let entry: GridEntry = grid[x]![y]!;
        let icon: string | ArrayBuffer;
        let text: string;

        switch (entry.type) {
          case 'app':
            icon = config.apps[entry.id]!.icon;
            text = config.apps[entry.id]!.name;
            break;
          case 'folder':
            icon = FOLDER_ICON;
            text = entry.id;
            break;
          default:
            continue;
        }

        let posX = 12 + (x * squareSize);
        let posY = 24 + (y * squareSize);

        if (config.display.icon && iconSize != 0)
          g.drawImage(icon, posX + (squareSize - iconSize) / 2, posY, { scale: iconScale });

        if (config.display.font)
          g.drawString(text, posX + (squareSize / 2), posY + iconSize);
      }
    }
  }

  /**
   * Handle a touch
   *
   * @param button 1 for left half, 2 for right half
   * @param xy postion on screen
   */
  function onTouch(button: number, xy: { x: number, y: number } | undefined) {
    // Determine which grid cell was tapped
    let x: number = (xy!.x - 12) / ((g.getWidth() - 24) / config.display.rows);
    if (x < 0) x = 0;
    else if (x >= config.display.rows) x = config.display.rows - 1;
    let y: number = (xy!.y - 24) / ((g.getWidth() - 24) / config.display.rows);
    if (y < 0) y = 0;
    else if (y >= config.display.rows) y = config.display.rows - 1;

    // Handle the grid cell
    let entry: GridEntry = grid[x]![y]!;
    switch (entry.type) {
      case "app":
        Bangle.buzz();
        let app = config.apps[entry.id]!;
        if (app.fast) Bangle.load(app.src);
        else if (config.fastNag && !app.nagged)
          E.showPrompt(/*LANG*/ 'Would you like to fast load?', {
            title: /*LANG*/ 'Fast load?',
            buttons: {
              "Yes": 0,
              "Not now": 1,
              "Never": 2
            }
          }).then((value: number) => {
            switch (value) {
              case 0:
                app.nagged = true;
                app.fast = true;
                loader.cleanAndSave(config);
                Bangle.load(app.src);
                break;
              case 1:
                load(app.src);
                break;
              default:
                app.nagged = true;
                loader.cleanAndSave(config);
                load(app.src);
                break;
            }
          });
        else load(app.src);
        break;
      case "folder":
        Bangle.buzz();
        resetTimeout();
        page = 0;
        folderPath.push(entry.id);
        folder = getFolder(folderPath);
        render();
        break;
      default:
        resetTimeout();
        break;
    }
  }

  let page = 0;
  /**
   * Handle a swipe
   *
   * A left swipe is treated as the back button. Up and down swipes change pages
   *
   * @param lr -1 if left, 0 if pure up/down, 1 if right
   * @param ud -1 if up, 0 if pure left/right, 1 if down
   */
  function onSwipe(lr: -1 | 0 | 1 | undefined, ud: -1 | 0 | 1 | undefined) {
    if (lr == -1 && ud == 0) {
      onBackButton();
      return;
    } else if (ud == -1) {
      resetTimeout();
      if (page == 0) {
        Bangle.buzz(200);
        return;
      } else page--;
    } else if (ud == 1) {
      resetTimeout();
      let maxPage = Math.ceil((folder.apps.length + folder.folders.length) / (config.display.rows * config.display.rows));
      if (page == maxPage) {
        Bangle.buzz(200);
        return;
      } else page++;
    }

    // If we reached this point, the page number has been changed and is valid.
    Bangle.buzz();
    render();
  }

  /**
   * Go back up a level. If already at the root folder, exit the launcher
   */
  function onBackButton() {
    Bangle.buzz();
    if (folderPath.length == 0)
      Bangle.showClock();
    else {
      folderPath.pop();
      folder = getFolder(folderPath);
      resetTimeout();
      page = 0;
      render();
    }
  }


  Bangle.loadWidgets();
  Bangle.drawWidgets(); // To immediately update widget field to follow current theme - remove leftovers if previous app set custom theme.

  Bangle.setUI({
    mode: 'custom',
    back: onBackButton,
    btn: onBackButton,
    swipe: onSwipe,
    touch: onTouch,
    remove: () => { if (timeout) clearTimeout(timeout); }
  });

  resetTimeout();
  render();

}
