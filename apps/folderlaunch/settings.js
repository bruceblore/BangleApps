(function (back) {
    var loader = require('folderlaunch-configLoad.js');
    var storage = require('Storage');
    var textinput = require('textinput');
    var config = loader.getConfig();
    var changed = false;
    var hiddenAppsMenu = function () {
        var menu = {
            '': {
                'title': 'Hide?',
                'back': showMainMenu
            }
        };
        var onchange = function (value, appId) {
            if (value && !config.hidden.includes(appId))
                config.hidden.push(appId);
            else if (!value && config.hidden.includes(appId))
                config.hidden.filter(function (item) { return item != appId; });
            changed = true;
        };
        for (var app_1 in config.apps) {
            var appInfo = storage.readJSON(app_1 + '.info', false);
            menu[appInfo.name] = {
                value: config.hidden.includes(app_1),
                format: function (value) { return (value ? 'Yes' : 'No'); },
                onchange: eval("(value) => { onchange(value, \"".concat(app_1, "\"); }"))
            };
        }
        E.showMenu(menu);
    };
    var showFolderMenu = function (path) {
        E.showMenu();
        var folder = config.rootFolder;
        for (var _i = 0, path_1 = path; _i < path_1.length; _i++) {
            var folderName = path_1[_i];
            try {
                folder = folder.folders[folderName];
            }
            catch (_a) {
                E.showAlert('BUG: Nonexistent folder ' + path);
            }
        }
        var back = function () {
            if (path.length) {
                path.pop();
                showFolderMenu(path);
            }
            else
                showMainMenu();
        };
        var menu = {
            '': {
                'title': path.length ? path[path.length - 1] : 'Root folder',
                'back': back
            },
            'New subfolder': function () {
                textinput.input({ text: '' }).then(function (result) {
                    folder.folders[result] = {
                        folders: {},
                        apps: []
                    };
                    changed = true;
                    path.push(result);
                    showFolderMenu(path);
                });
            },
            'Move app here': {
                value: -1,
                min: 0,
                max: Object.keys(config.apps).length - 1,
                wrap: true,
                format: function (value) { return (value == -1) ? '' : storage.readJSON(Object.keys(config.apps)[value] + '.info', false).name; },
                onchange: function (value) {
                    if (value == -1)
                        return;
                    var appId = Object.keys(config.apps)[value];
                    var app = Object.values(config.apps)[value];
                    var folder = config.rootFolder;
                    for (var _i = 0, _a = app.folder; _i < _a.length; _i++) {
                        var folderName = _a[_i];
                        folder = folder.folders[folderName];
                    }
                    folder.apps.filter(function (item) { return item != appId; });
                    app.folder.path = path;
                    folder = config.rootFolder;
                    for (var _b = 0, _c = app.folder; _b < _c.length; _b++) {
                        var folderName = _c[_b];
                        folder = folder.folders[folderName];
                    }
                    folder.apps.push(appId);
                    changed = true;
                    showFolderMenu(path);
                }
            }
        };
        if (Object.keys(folder.folders).length)
            menu['View subfolder'] = {
                value: -1,
                min: 0,
                max: folder.folders.length - 1,
                wrap: true,
                format: function (value) { return (value == -1) ? '' : Object.keys(folder.folders)[value]; },
                onchange: function (value) {
                    if (value == -1)
                        return;
                    path.push(Object.keys(folder.folders)[value]);
                    showFolderMenu(path);
                }
            };
        if (folder.apps.length)
            menu['View apps'] = function () {
                var menu = {
                    '': {
                        'title': path[path.length - 1],
                        'back': function () { showFolderMenu(path); }
                    }
                };
                for (var _i = 0, _a = folder.apps; _i < _a.length; _i++) {
                    var appId = _a[_i];
                    menu[storage.readJSON(appId + '.info', false).name] = function () { };
                }
                E.showMenu(menu);
            };
        if (path.length)
            menu['Delete folder'] = function () {
                var apps = folder.apps;
                var subfolders = folder.folders;
                var toDelete = path.pop();
                folder = config.rootFolder;
                for (var _i = 0, path_2 = path; _i < path_2.length; _i++) {
                    var folderName = path_2[_i];
                    folder = folder.folders[folderName];
                }
                for (var _a = 0, apps_1 = apps; _a < apps_1.length; _a++) {
                    var appId = apps_1[_a];
                    config.apps[appId].folder.pop();
                    folder.apps.push(appId);
                }
                for (var _b = 0, _c = Object.keys(subfolders); _b < _c.length; _b++) {
                    var subfolder = _c[_b];
                    folder.folders[subfolder] = subfolders[subfolder];
                }
                delete folder.folders[toDelete];
                changed = true;
                showFolderMenu(path);
            };
        E.showMenu(menu);
    };
    var exit = function () {
        if (changed) {
            E.showMessage('Saving...');
            config.hash = 0;
            loader.cleanAndSave(config);
        }
        back();
    };
    var showMainMenu = function () {
        E.showMenu({
            '': {
                'title': 'Folder launcher',
                'back': exit
            },
            'Show clocks': {
                value: config.showClocks,
                format: function (value) { return (value ? 'Yes' : 'No'); },
                onchange: function (value) {
                    config.showClocks = value;
                    changed = true;
                }
            },
            'Show launchers': {
                value: config.showLaunchers,
                format: function (value) { return (value ? 'Yes' : 'No'); },
                onchange: function (value) {
                    config.showLaunchers = value;
                    changed = true;
                }
            },
            'Hidden apps': hiddenAppsMenu,
            'Display': function () {
                E.showMenu({
                    '': {
                        'title': 'Display',
                        'back': showMainMenu
                    },
                    'Rows': {
                        value: config.display.rows,
                        min: 1,
                        onchange: function (value) {
                            config.display.rows = value;
                            changed = true;
                        }
                    },
                    'Show icons?': {
                        value: config.display.icon,
                        format: function (value) { return (value ? 'Yes' : 'No'); },
                        onchange: function (value) {
                            config.display.icon = value;
                            changed = true;
                        }
                    },
                    'Font size': {
                        value: config.display.font,
                        min: 0,
                        format: function (value) { return (value ? value : 'Icon only'); },
                        onchange: function (value) {
                            if (value == 0)
                                value = false;
                            config.display.font = value;
                            changed = true;
                        }
                    }
                });
            },
            'Prompt for fast launch': {
                value: config.fastNag,
                format: function (value) { return (value ? 'Yes' : 'No'); },
                onchange: function (value) {
                    config.fastNag = value;
                    changed = true;
                }
            },
            'Timeout': {
                value: config.timeout,
                format: function (value) { return "".concat(value / 1000, " sec"); },
                min: 0,
                step: 1000,
                onchange: function (value) {
                    config.timeout = value;
                    changed = true;
                }
            },
            'Folder management': function () {
                showFolderMenu([]);
            }
        });
    };
    showMainMenu();
});
