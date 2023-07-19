(function (back) {
    var SETTINGS_FILE = "rgbvest.json";
    var storage = require('Storage');
    var keyboard = require('textinput');
    var config = storage.readJSON(SETTINGS_FILE) || {
        port: 8443,
        defaultURL: 'localhost',
        promptURL: true,
        saveURL: true,
        numTaps: 5
    };
    function saveSettings() {
        storage.writeJSON(SETTINGS_FILE, config);
    }
    function showMainMenu() {
        var _a;
        E.showMenu((_a = {
                '': {
                    'title': 'RGB Vest',
                    'back': back
                }
            },
            _a["Port: ".concat(config.port)] = function () {
                E.showMenu();
                var getText = function () {
                    keyboard.input({ text: '' + config.port }).then(function (text) {
                        var int = Math.abs(parseInt(text));
                        if ('' + int == text && 1 <= int && int <= 65535) {
                            config.port = int;
                            saveSettings();
                            showMainMenu();
                        }
                        else {
                            E.showMessage('Invalid port!');
                            setTimeout(function () { getText(); }, 500);
                        }
                    });
                };
                getText();
            },
            _a["Default URL: ".concat(config.defaultURL)] = function () {
                E.showMenu();
                keyboard.input({ text: config.defaultURL }).then(function (text) {
                    config.defaultURL = text;
                    saveSettings();
                    showMainMenu();
                });
            },
            _a['Prompt URL'] = {
                value: config.promptURL,
                format: function (promptURL) { return promptURL ? 'Yes' : 'No'; },
                onchange: function (value) {
                    config.promptURL = value;
                    saveSettings();
                }
            },
            _a['Save URL'] = {
                value: config.promptURL,
                format: function (promptURL) { return promptURL ? 'Yes' : 'No'; },
                onchange: function (value) {
                    config.saveURL = value;
                    saveSettings();
                }
            },
            _a['Number of taps'] = {
                value: config.numTaps,
                min: 2,
                step: 1,
                onchange: function (value) {
                    config.numTaps = value;
                    saveSettings();
                }
            },
            _a));
    }
    showMainMenu();
});
