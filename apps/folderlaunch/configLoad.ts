const storage = require("Storage");

const SETTINGS_FILE: string = "folderlaunch.json";

const DEFAULT_CONFIG: Config = {
    showClocks: false,
    showLaunchers: false,
    hidden: [],
    display: {
        rows: 2,
        icon: true,
        font: 'Vector:8'
    },
    fastNag: true,
    timeout: 30000,
    rootFolder: {
        folders: {},
        apps: []
    },
    apps: {},
    hash: 0
}

/**
 * Recursively remove all apps from a folder
 *
 * @param folder the folder to clean
 * @return the folder with all apps removed
 */
function clearFolder(folder: Folder): Folder {
    for (let childName in folder.folders)
        folder.folders[childName] = clearFolder(folder.folders[childName]!);
    folder.apps = [];
    return folder;
}

/**
 * Clean and save the configuration.
 *
 * Assume that:
 *  - All installed apps have an appInfo entry
 *  - References to nonexistent folders have been removed from appInfo
 * And therefore we do not need to do this ourselves.
 * Note: It is not a real problem if the assumptions are not true. If this was called by getConfig, the assumptions are already taken care of. If this was called somewhere else, they will be taken care of the next time getConfig is called.
 *
 * Perform the following cleanup:
 *  - Remove appInfo entries for nonexistent apps, to prevent irrelevant data invisible to the user from accumulating
 *
 * @param config the configuration to be cleaned
 * @return the cleaned configuration
 */
function cleanAndSave(config: Config): Config {
    // Get the list of installed apps
    let infoFiles: Array<string> = storage.list(/\.info$/);
    let installedAppIds: Array<string> = [];
    for (let infoFile of infoFiles)
        installedAppIds.push(storage.readJSON(infoFile, true).id);

    // Remove nonexistent apps from appInfo
    let toRemove: Array<string> = [];
    for (let appId in config.apps)
        if (!installedAppIds.includes(appId))
            toRemove.push(appId);
    for (let appId of toRemove)
        delete config.apps[appId];

    // Save and return
    storage.writeJSON(SETTINGS_FILE, config);
    return config;
}

export = {
    cleanAndSave: cleanAndSave,

    /**
     * Get the configuration for the launcher. Perform a cleanup if any new apps were installed or any apps refer to nonexistent folders.
     *
     * @param keepHidden if true, don't exclude apps that would otherwise be hidden
     * @return the loaded configuration
     */
    getConfig: (): Config => {
        let config = storage.readJSON(SETTINGS_FILE, true) || DEFAULT_CONFIG;

        // We only need to load data from the filesystem if there is a change
        if (config.hash == storage.hash(/\.info$/)) {
            return config;
        }

        E.showMessage('Rebuilding cache...')
        let infoFiles: Array<string> = storage.list(/\.info$/);
        for (let infoFile of infoFiles) {
            let app: AppInfoFile = storage.readJSON(infoFile, false);

            // Creates the apps entry if it doesn't exist yet.
            if (!config.apps.hasOwnProperty(app.id)) {
                config.apps[app.id] = {
                    folder: [],
                    fast: false,
                    nagged: false
                };
            }

            // Update parts of the apps entry that may have changed
            config.apps[app.id].name = app.name;
            config.apps[app.id].type = app.hasOwnProperty('type') ? app.type : '';
            config.apps[app.id].src = app.src;
            config.apps[app.id].icon = storage.read(app.icon);

            // Clear the folders
            config.folder = clearFolder(config.rootFolder);

            // Place apps in folders, deleting references to folders that no longer exist
            // Note: Relies on curFolder secretly being a reference rather than a copy
            let curFolder: Folder = config.rootFolder;
            let depth = 0;
            for (let folderName of config.apps[app.id].folder) {
                if (curFolder.folders.hasOwnProperty(folderName)) {
                    curFolder = curFolder.folders[folderName]!;
                    depth++;
                } else {
                    config.apps[app.id].folder = config.apps[app.id].folder.slice(0, depth);
                    break;
                }
            }
            curFolder.apps.push(app.id);
        }

        return cleanAndSave(config);
    }
}