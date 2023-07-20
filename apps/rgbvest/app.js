var SETTINGS_FILE = "rgbvest.json";
var storage = require("Storage");
var keyboard = require("textinput");
var config = (storage.readJSON(SETTINGS_FILE) || {
    port: 8443,
    defaultURL: 'localhost',
    promptURL: true,
    saveURL: true,
    numTaps: 5
});
var getQueryUrl = function (baseURL, query) {
    var result = baseURL;
    for (var key in query) {
        result += "".concat(key, "=").concat(query[key], "&");
    }
    return result;
};
var byPeriod = false;
var useMinutes = false;
var tapTimes = [];
var showOptions = function (options, title, url) {
    var menu = {
        '': {
            'title': title,
            'back': showMainMenu
        }
    };
    var createMenuClosure = function (func, key) {
        return function () {
            func(key);
        };
    };
    var frequencyMenu = function (key) {
        var _a;
        var displayedValue = options[key].value;
        if (byPeriod) {
            displayedValue = 1 / displayedValue;
            if (useMinutes)
                displayedValue /= 60;
        }
        else if (useMinutes)
            displayedValue *= 60;
        E.showMenu((_a = {
                '': {
                    'title': options[key].name,
                    'back': function () {
                        if (byPeriod) {
                            if (useMinutes)
                                displayedValue *= 60;
                            displayedValue = 1 / displayedValue;
                        }
                        else if (useMinutes)
                            displayedValue /= 60;
                        options[key].value = displayedValue;
                        tapTimes = [];
                        Bangle.http(getQueryUrl(url, { body: JSON.stringify(options) })).then(function () {
                            showOptions(options, title, url);
                        });
                    }
                },
                'Showing': {
                    value: byPeriod,
                    format: function (value) { return value ? 'Period' : 'Frequency'; },
                    onchange: function (value) {
                        byPeriod = value;
                        frequencyMenu(key);
                    }
                },
                'Unit': {
                    value: useMinutes,
                    format: function (value) { return byPeriod ?
                        (value ? 'Minutes' : 'Seconds') :
                        (value ? 'Per minute' : 'Per second'); },
                    onchange: function (value) {
                        useMinutes = value;
                        frequencyMenu(key);
                    }
                }
            },
            _a[byPeriod ? 'Period' : 'Frequency'] = {
                value: displayedValue,
                min: 0,
                step: 0.1,
                onchange: function (value) { return displayedValue = value; }
            },
            _a['Tap to set frequency'] = function () {
                tapTimes.push((new Date()).getTime());
                if (tapTimes.length == config.numTaps) {
                    var average = tapTimes.reduce(function (acc, item) { return acc += item; }) / tapTimes.length;
                    options[key].value = 1 / (average / 1000);
                    Bangle.http(getQueryUrl(url, { body: JSON.stringify(options) })).then(function () {
                        Bangle.buzz(200);
                        tapTimes = [];
                        frequencyMenu(key);
                    });
                }
            },
            _a['Clear taps'] = function () {
                tapTimes = [];
                Bangle.buzz(200);
            },
            _a));
    };
    var colorMenu = function (key) {
        var HEXITS = [
            '0', '1', '2', '3', '4', '5', '6', '7',
            '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'
        ];
        var red = options[key].value[0];
        var green = options[key].value[1];
        var blue = options[key].value[2];
        var red16 = Math.floor(red / 16);
        var green16 = Math.floor(green / 16);
        var blue16 = Math.floor(blue / 16);
        var red1 = red % 16;
        var green1 = green % 16;
        var blue1 = blue % 16;
        E.showMenu({
            '': {
                'title': options[key].name,
                'back': function () {
                    options[key].value[0] = red;
                    options[key].value[1] = green;
                    options[key].value[2] = blue;
                    Bangle.http(getQueryUrl(url, { body: JSON.stringify(options) })).then(function () {
                        showOptions(options, title, url);
                    });
                }
            },
            'Red 16': {
                value: red16,
                min: 0,
                max: 15,
                step: 1,
                format: function (value) { return HEXITS[value]; },
                onchange: function (value) {
                    red16 = value;
                    red = 16 * red16 + red1;
                }
            },
            'Red 1': {
                value: red1,
                min: 0,
                max: 15,
                step: 1,
                format: function (value) { return HEXITS[value]; },
                onchange: function (value) {
                    red1 = value;
                    red = 16 * red16 + red1;
                }
            },
            'Green 16': {
                value: green16,
                min: 0,
                max: 15,
                step: 1,
                format: function (value) { return HEXITS[value]; },
                onchange: function (value) {
                    green16 = value;
                    green = 16 * green16 + green1;
                }
            },
            'Green 1': {
                value: green1,
                min: 0,
                max: 15,
                step: 1,
                format: function (value) { return HEXITS[value]; },
                onchange: function (value) {
                    green1 = value;
                    green = 16 * green16 + green1;
                }
            },
            'Blue 16': {
                value: blue16,
                min: 0,
                max: 15,
                step: 1,
                format: function (value) { return HEXITS[value]; },
                onchange: function (value) {
                    blue16 = value;
                    blue = 16 * blue16 + blue1;
                }
            },
            'Blue 1': {
                value: blue1,
                min: 0,
                max: 15,
                step: 1,
                format: function (value) { return HEXITS[value]; },
                onchange: function (value) {
                    blue1 = value;
                    blue = 16 * blue16 + blue1;
                }
            },
        });
    };
    var createSaveClosure = function (key) {
        return function (value) {
            options[key].value = value;
            Bangle.http(getQueryUrl(url, { body: JSON.stringify(options) })).then(function () {
                showOptions(options, title, url);
            });
        };
    };
    var createListSaveClosure = function (key, jsonOption) {
        return function (value) {
            options[key].value = jsonOption.choices[value].id;
            Bangle.http(getQueryUrl(url, { body: JSON.stringify(options) })).then(function () {
                showOptions(options, title, url);
            });
        };
    };
    var createButtonClosure = function (key) {
        return function () {
            options[key].value = true;
            Bangle.http(getQueryUrl(url, { body: JSON.stringify(options) })).then(function () {
                options[key].value = false;
                showOptions(options, title, url);
            });
        };
    };
    var _loop_1 = function (key) {
        var jsonOption = options[key];
        var option = {};
        if (jsonOption.type == 'frequency') {
            menu[jsonOption.name] = createMenuClosure(frequencyMenu, key);
        }
        else if (jsonOption.type == 'color') {
            menu[jsonOption.name] = createMenuClosure(colorMenu, key);
        }
        else if (jsonOption.type == 'number') {
            option = {
                value: jsonOption.value,
                onchange: createSaveClosure(key)
            };
            if (jsonOption.hasOwnProperty('min'))
                option.min = jsonOption.min;
            if (jsonOption.hasOwnProperty('max'))
                option.max = jsonOption.max;
            if (jsonOption.hasOwnProperty('step'))
                option.step = jsonOption.step;
            menu[jsonOption.name] = option;
        }
        else if (jsonOption.type == 'list') {
            option = {
                value: jsonOption.choices.map(function (choice) { return choice.id; }).indexOf(jsonOption.value),
                format: function (value) { return jsonOption.choices[value].name; },
                min: 0,
                max: jsonOption.choices.length - 1,
                wrap: false,
                onchange: createListSaveClosure(key, jsonOption)
            };
            menu[jsonOption.name] = option;
        }
        else if (jsonOption.type == 'bool') {
            option = {
                value: jsonOption.value,
                onchange: createSaveClosure(key)
            };
            menu[jsonOption.name] = option;
        }
        else if (jsonOption.type == 'button') {
            menu[jsonOption.name] = createButtonClosure(key);
        }
        else {
            Bangle.buzz(750);
            console.log("Warning! Unsupported option type ".concat(jsonOption.type));
        }
    };
    for (var key in options) {
        _loop_1(key);
    }
    E.showMenu(menu);
};
var indexOfDict = function (dict, index) {
    return dict[Object.keys(dict)[index]];
};
var showMainMenu = function () {
    var colorScheme;
    var effect;
    var interpolator;
    var colorSchemes;
    var effects;
    var interpolators;
    var showGetting = function (content) {
        E.showMessage("Getting data...\n".concat(content));
    };
    showGetting('Color scheme');
    Bangle.http(getQueryUrl(baseURL, { op: 'colorScheme' })).then(function (data) {
        colorScheme = data.resp;
        showGetting('Effect');
        return Bangle.http(getQueryUrl(baseURL, { op: 'effect' }));
    }).then(function (data) {
        effect = data.resp;
        showGetting('Interpolator');
        return Bangle.http(getQueryUrl(baseURL, { op: 'interpolator' }));
    }).then(function (data) {
        interpolator = data.resp;
        showGetting('Color schemes');
        return Bangle.http(getQueryUrl(baseURL, { op: 'colorSchemes' }));
    }).then(function (data) {
        colorSchemes = JSON.parse(data.resp);
        showGetting('Effects');
        return Bangle.http(getQueryUrl(baseURL, { op: 'effects' }));
    }).then(function (data) {
        effects = JSON.parse(data.resp);
        showGetting('Interpolators');
        return Bangle.http(getQueryUrl(baseURL, { op: 'interpolators' }));
    }).then(function (data) {
        interpolators = JSON.parse(data.resp);
        return;
    }).catch(function (error) {
        console.log(error);
        E.showMessage(error);
    }).then(function () {
        E.showMenu({
            '': {
                'title': 'RGB vest control'
            },
            'Color scheme': {
                value: Object.keys(colorSchemes).indexOf(colorScheme),
                format: function (value) { return indexOfDict(colorSchemes, value).name; },
                min: 0,
                max: Object.keys(colorSchemes).length - 1,
                wrap: true,
                onchange: function (value) {
                    colorScheme = Object.keys(colorSchemes)[value];
                    Bangle.http(getQueryUrl(baseURL, { op: 'colorScheme', val: colorScheme }));
                }
            },
            'Color scheme options': function () {
                var url = getQueryUrl(baseURL, { op: 'colorScheme-options' });
                Bangle.http(url).then(function (data) {
                    showOptions(JSON.parse(data.resp), 'Color scheme options', url);
                });
            },
            'Effect': {
                value: Object.keys(effects).indexOf(effect),
                format: function (value) { return indexOfDict(effects, value).name; },
                min: 0,
                max: Object.keys(effects).length - 1,
                wrap: true,
                onchange: function (value) {
                    effect = Object.keys(effects)[value];
                    Bangle.http(getQueryUrl(baseURL, { op: 'effect', val: effect }));
                }
            },
            'Effect options': function () {
                var url = getQueryUrl(baseURL, { op: 'effect-options' });
                Bangle.http(url).then(function (data) {
                    showOptions(JSON.parse(data.resp), 'Effect options', url);
                });
            },
            'Interpolator': {
                value: Object.keys(interpolators).indexOf(interpolator),
                format: function (value) { return indexOfDict(interpolators, value).name; },
                min: 0,
                max: Object.keys(interpolators).length - 1,
                wrap: true,
                onchange: function (value) {
                    interpolator = Object.keys(interpolators)[value];
                    Bangle.http(getQueryUrl(baseURL, { op: 'interpolator', val: interpolator }));
                }
            },
            'Interpolator options': function () {
                var url = getQueryUrl(baseURL, { op: 'interpolator-options' });
                Bangle.http(url).then(function (data) {
                    showOptions(JSON.parse(data.resp), 'Interpolator options', url);
                });
            },
            'General options': function () {
                var url = getQueryUrl(baseURL, { op: 'options' });
                Bangle.http(url).then(function (data) {
                    showOptions(JSON.parse(data.resp), 'General options', url);
                });
            }
        });
    });
};
Bangle.loadWidgets();
Bangle.drawWidgets();
var baseURL = config.defaultURL;
if (config.promptURL) {
    keyboard.input({ text: config.defaultURL }).then(function (text) {
        baseURL = text;
        if (config.saveURL) {
            config.defaultURL = text;
            config.promptURL = false;
            storage.writeJSON(SETTINGS_FILE, config);
        }
        baseURL = "https://".concat(baseURL, ":").concat(config.port, "/api?");
        showMainMenu();
    });
}
else {
    baseURL = "https://".concat(baseURL, ":").concat(config.port, "/api?");
    showMainMenu();
}
