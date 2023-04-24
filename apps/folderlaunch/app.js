{
    var loader_1 = require('folderlaunch-configLoad.js');
    var FOLDER_ICON_1 = require("heatshrink").decompress(atob("mEwwMA///wAJCAoPAAongAonwAon4Aon8Aon+Aon/AooA/AH4A/AFgA="));
    var config_1 = loader_1.getConfig();
    var timeout_1;
    function resetTimeout() {
        if (timeout_1) {
            clearTimeout(timeout_1);
        }
        if (config_1.timeout != 0) {
            timeout_1 = setTimeout(function () {
                Bangle.showClock();
            }, config_1.timeout);
        }
    }
    var folderPath_1 = [];
    var folder_1 = getFolder(folderPath_1);
    function getFolder(folderPath) {
        var result = config_1.rootFolder;
        for (var _i = 0, folderPath_2 = folderPath; _i < folderPath_2.length; _i++) {
            var folderName = folderPath_2[_i];
            result = folder_1.folders[folderName];
        }
        return result;
    }
    var grid_1 = [];
    for (var x = 0; x < config_1.display.rows; x++) {
        grid_1.push([]);
        for (var y = 0; y < config_1.display.rows; y++) {
            grid_1[x].push({
                type: 'empty',
                id: ''
            });
        }
    }
    function render() {
        var gridSize = config_1.display.rows * config_1.display.rows;
        var startIndex = page_1 * gridSize;
        for (var i = 0; i < gridSize; i++) {
            var y = Math.floor(i / config_1.display.rows);
            var x = i % config_1.display.rows;
            var folderIndex = startIndex + i;
            if (folderIndex < folder_1.folders.length) {
                grid_1[x][y].type = 'folder';
                grid_1[x][y].id = Object.keys(folder_1.folders)[i];
                continue;
            }
            var appIndex = folderIndex - folder_1.folders.length;
            if (appIndex < folder_1.apps.length) {
                grid_1[x][y].type = 'app';
                grid_1[x][y].id = folder_1.apps[appIndex];
                continue;
            }
            grid_1[x][y].type = 'empty';
        }
        g.clearRect(0, 24, g.getWidth(), g.getHeight())
            .reset()
            .setFontAlign(0, -1);
        var squareSize = (g.getHeight() - 24) / config_1.display.rows;
        var iconSize = config_1.display.icon ? squareSize : 0;
        if (config_1.display.font) {
            g.setFont(config_1.display.font);
            iconSize = Math.max(0, iconSize - g.getFontHeight());
        }
        var iconScale = iconSize / 48;
        for (var x = 0; x < config_1.display.rows; x++) {
            for (var y = 0; y < config_1.display.rows; y++) {
                var entry = grid_1[x][y];
                var icon = void 0;
                var text = void 0;
                switch (entry.type) {
                    case 'app':
                        icon = config_1.apps[entry.id].icon;
                        text = config_1.apps[entry.id].name;
                        break;
                    case 'folder':
                        icon = FOLDER_ICON_1;
                        text = entry.id;
                        break;
                    default:
                        continue;
                }
                var posX = 12 + (x * squareSize);
                var posY = 24 + (y * squareSize);
                if (config_1.display.icon && iconSize != 0)
                    g.drawImage(icon, posX + (squareSize - iconSize) / 2, posY, { scale: iconScale });
                if (config_1.display.font)
                    g.drawString(text, posX + (squareSize / 2), posY + iconSize);
            }
        }
    }
    function onTouch(button, xy) {
        var x = (xy.x - 12) / ((g.getWidth() - 24) / config_1.display.rows);
        if (x < 0)
            x = 0;
        else if (x >= config_1.display.rows)
            x = config_1.display.rows - 1;
        var y = (xy.y - 24) / ((g.getWidth() - 24) / config_1.display.rows);
        if (y < 0)
            y = 0;
        else if (y >= config_1.display.rows)
            y = config_1.display.rows - 1;
        var entry = grid_1[x][y];
        switch (entry.type) {
            case "app":
                Bangle.buzz();
                var app_1 = config_1.apps[entry.id];
                if (app_1.fast)
                    Bangle.load(app_1.src);
                else if (config_1.fastNag && !app_1.nagged)
                    E.showPrompt('Would you like to fast load?', {
                        title: 'Fast load?',
                        buttons: {
                            "Yes": 0,
                            "Not now": 1,
                            "Never": 2
                        }
                    }).then(function (value) {
                        switch (value) {
                            case 0:
                                app_1.nagged = true;
                                app_1.fast = true;
                                loader_1.cleanAndSave(config_1);
                                Bangle.load(app_1.src);
                                break;
                            case 1:
                                load(app_1.src);
                                break;
                            default:
                                app_1.nagged = true;
                                loader_1.cleanAndSave(config_1);
                                load(app_1.src);
                                break;
                        }
                    });
                else
                    load(app_1.src);
                break;
            case "folder":
                Bangle.buzz();
                resetTimeout();
                page_1 = 0;
                folderPath_1.push(entry.id);
                folder_1 = getFolder(folderPath_1);
                render();
                break;
            default:
                resetTimeout();
                break;
        }
    }
    var page_1 = 0;
    function onSwipe(lr, ud) {
        if (lr == -1 && ud == 0) {
            onBackButton();
            return;
        }
        else if (ud == -1) {
            resetTimeout();
            if (page_1 == 0) {
                Bangle.buzz(200);
                return;
            }
            else
                page_1--;
        }
        else if (ud == 1) {
            resetTimeout();
            var maxPage = Math.ceil((folder_1.apps.length + folder_1.folders.length) / (config_1.display.rows * config_1.display.rows));
            if (page_1 == maxPage) {
                Bangle.buzz(200);
                return;
            }
            else
                page_1++;
        }
        Bangle.buzz();
        render();
    }
    function onBackButton() {
        Bangle.buzz();
        if (folderPath_1.length == 0)
            Bangle.showClock();
        else {
            folderPath_1.pop();
            folder_1 = getFolder(folderPath_1);
            resetTimeout();
            page_1 = 0;
            render();
        }
    }
    Bangle.loadWidgets();
    Bangle.drawWidgets();
    Bangle.setUI({
        mode: 'custom',
        back: onBackButton,
        btn: onBackButton,
        swipe: onSwipe,
        touch: onTouch,
        remove: function () { if (timeout_1)
            clearTimeout(timeout_1); }
    });
    resetTimeout();
    render();
}
