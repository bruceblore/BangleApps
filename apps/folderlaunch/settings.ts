(function (back: Function) {
    const loader = require('folderlaunch-configLoad.js');
    const storage = require('Storage');
    const textinput = require('textinput');

    let config: Config = loader.getConfig();
    let changed: boolean = false;

    let hiddenAppsMenu = () => {
        let menu: Menu = {
            '': {
                'title': 'Hide?',
                'back': showMainMenu
            }
        }

        let onchange = (value: boolean, appId: string) => {
            if (value && !config.hidden.includes(appId)) // Hiding, not already hidden
                config.hidden.push(appId);
            else if (!value && config.hidden.includes(appId)) // Unhiding, already hidden
                config.hidden.filter(item => item != appId)
            changed = true;
        }

        for (let app in config.apps) {
            let appInfo: AppInfoFile = storage.readJSON(app + '.info', false);
            menu[appInfo.name] = {
                value: config.hidden.includes(app),
                format: (value: boolean) => (value ? 'Yes' : 'No'),
                onchange: eval(`(value) => { onchange(value, "${app}"); }`)
            }
        }

        E.showMenu(menu);
    };

    let showFolderMenu = (path: Array<string>) => {
        E.showMenu();
        let folder: Folder = config.rootFolder;
        for (let folderName of path)
            try {
                folder = folder.folders[folderName]!;
            } catch {
                E.showAlert(/*LANG*/'BUG: Nonexistent folder ' + path);
            }

        let back = () => {
            if (path.length) {
                path.pop();
                showFolderMenu(path);
            } else showMainMenu();
        };

        let menu: Menu = {
            '': {
                'title': path.length ? path[path.length - 1]! : /*LANG*/ 'Root folder',
                'back': back
            },
            'New subfolder': () => {
                textinput.input({ text: '' }).then((result: string) => {
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
                format: (value: number) => (value == -1) ? '' : storage.readJSON(Object.keys(config.apps)[value] + '.info', false).name,
                onchange: (value: number) => {
                    if (value == -1) return;

                    // Delete app from old folder
                    let appId = Object.keys(config.apps)[value];
                    let app = Object.values(config.apps)[value];

                    let folder: Folder = config.rootFolder;
                    for (let folderName of app.folder)
                        folder = folder.folders[folderName]!;
                    folder.apps.filter((item: string) => item != appId);

                    // Change folder in app info
                    app.folder.path = path;

                    // Place app in new folder
                    folder = config.rootFolder;
                    for (let folderName of app.folder)
                        folder = folder.folders[folderName]!;
                    folder.apps.push(appId);

                    // Mark changed and refresh menu
                    changed = true;
                    showFolderMenu(path);
                }
            }
        };

        if (Object.keys(folder.folders).length) menu['View subfolder'] = {
            value: -1,
            min: 0,
            max: folder.folders.length - 1,
            wrap: true,
            format: (value: number) => (value == -1) ? '' : Object.keys(folder.folders)[value],
            onchange: (value: number) => {
                if (value == -1) return;
                path.push(Object.keys(folder.folders)[value]);
                showFolderMenu(path);
            }
        }

        if (folder.apps.length) menu['View apps'] = () => {
            let menu: Menu = {
                '': {
                    'title': path[path.length - 1]!,
                    'back': () => { showFolderMenu(path); }
                }
            }
            for (let appId of folder.apps) {
                menu[storage.readJSON(appId + '.info', false).name] = () => { };
            }
            E.showMenu(menu);
        }

        if (path.length) menu['Delete folder'] = () => {
            // Cache apps for changing the folder reference
            let apps: Array<string> = folder.apps;
            let subfolders = folder.folders;

            // Move up to the parent folder
            let toDelete: string = path.pop()!;
            folder = config.rootFolder;
            for (let folderName of path)
                folder = folder.folders[folderName]!;

            // Move all apps and folders to the parent folder, then delete this one
            for (let appId of apps) {
                config.apps[appId]!.folder.pop();
                folder.apps.push(appId);
            }
            for (let subfolder of Object.keys(subfolders))
                folder.folders[subfolder] = subfolders[subfolder]!;
            delete folder.folders[toDelete];

            // Mark as modified and go back
            changed = true;
            showFolderMenu(path);
        }

        E.showMenu(menu);
    };

    let exit = () => {
        if (changed) {
            E.showMessage(/*LANG*/'Saving...');
            config.hash = 0;    // Invalidate the cache so changes to hidden apps or folders actually get reflected
            loader.cleanAndSave(config);
        }
        back();
    };

    let showMainMenu = () => {
        E.showMenu({
            '': {
                'title': 'Folder launcher',
                'back': exit
            },
            'Show clocks': {
                value: config.showClocks,
                format: value => (value ? 'Yes' : 'No'),
                onchange: value => {
                    config.showClocks = value;
                    changed = true;
                }
            },
            'Show launchers': {
                value: config.showLaunchers,
                format: value => (value ? 'Yes' : 'No'),
                onchange: value => {
                    config.showLaunchers = value;
                    changed = true;
                }
            },
            'Hidden apps': hiddenAppsMenu,
            'Display': () => {
                E.showMenu({
                    '': {
                        'title': 'Display',
                        'back': showMainMenu
                    },
                    'Rows': {
                        value: config.display.rows,
                        min: 1,
                        onchange: value => {
                            config.display.rows = value;
                            changed = true;
                        }
                    },
                    'Show icons?': {
                        value: config.display.icon,
                        format: value => (value ? 'Yes' : 'No'),
                        onchange: value => {
                            config.display.icon = value;
                            changed = true;
                        }
                    },
                    'Font size': {
                        value: config.display.font as any,
                        min: 0,
                        format: (value: any) => (value ? value : 'Icon only'),
                        onchange: (value: any) => {
                            if (value == 0) value = false;
                            config.display.font = value;
                            changed = true;
                        }
                    }
                });
            },
            'Prompt for fast launch': {
                value: config.fastNag,
                format: value => (value ? 'Yes' : 'No'),
                onchange: value => {
                    config.fastNag = value;
                    changed = true;
                }
            },
            'Timeout': {
                value: config.timeout,
                format: value => `${value / 1000} sec`,
                min: 0,
                step: 1000,
                onchange: value => {
                    config.timeout = value;
                    changed = true;
                }
            },
            'Folder management': () => {
                showFolderMenu([]);
            }
        });
    };
    showMainMenu();
});