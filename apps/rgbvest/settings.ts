(function (back) {
    const SETTINGS_FILE = "rgbvest.json";
    const storage = require('Storage');
    const keyboard = require('textinput');

    let config: AppConfig = (storage.readJSON(SETTINGS_FILE) as AppConfig) || {
        port: 8443,
        defaultURL: 'localhost',
        promptURL: true,
        saveURL: true,
        numTaps: 5
    }

    function saveSettings() {
        storage.writeJSON(SETTINGS_FILE, config);
    }

    function showMainMenu() {
        E.showMenu({
            '': {
                'title': 'RGB Vest',
                'back': back
            },
            [`Port: ${config.port}`]: () => {
                E.showMenu();
                let getText = () => {
                    keyboard.input({ text: '' + config.port }).then((text: string) => {
                        let int = Math.abs(parseInt(text));
                        if ('' + int == text && 1 <= int && int <= 65535) {
                            config.port = int;
                            saveSettings();
                            showMainMenu();
                        } else {
                            E.showMessage('Invalid port!');
                            setTimeout(() => { getText(); }, 500);
                        }
                    });
                };
                getText();
            },
            [`Default URL: ${config.defaultURL}`]: () => {
                E.showMenu();
                keyboard.input({ text: config.defaultURL }).then((text: string) => {
                    //TODO add validation
                    config.defaultURL = text;
                    saveSettings();
                    showMainMenu();
                });
            },
            'Prompt URL next time': {
                value: config.promptURL,
                format: promptURL => promptURL ? 'Yes' : 'No',
                onchange: value => {
                    config.promptURL = value;
                    saveSettings();
                }
            },
            'Save URL, then don\'t prompt': {
                value: config.promptURL,
                format: promptURL => promptURL ? 'Yes' : 'No',
                onchange: value => {
                    config.saveURL = value;
                    saveSettings();
                }
            },
            'Number of taps': {
                value: config.numTaps,
                min: 2,
                step: 1,
                onchange: value => {
                    config.numTaps = value;
                    saveSettings();
                }
            }
        });
    }

    showMainMenu();
} satisfies SettingsFunc);