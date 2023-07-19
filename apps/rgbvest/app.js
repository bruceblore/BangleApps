{
    var SETTINGS_FILE_1 = "rgbvest.json";
    var storage_1 = require("Storage");
    var keyboard = require("textinput");
    var config_1 = (storage_1.readJSON(SETTINGS_FILE_1) || {
        port: 8443,
        defaultURL: 'localhost',
        promptURL: true,
        saveURL: true,
        numTaps: 5
    });
    var getQueryUrl_1 = function (baseURL, query) {
        var result = baseURL;
        for (var key in query) {
            result += "".concat(key, "=").concat(query[key], "&");
        }
        return result;
    };
    var byPeriod_1 = false;
    var useMinutes_1 = false;
    var tapTimes_1 = [];
    var showOptions_1 = function (options, title, url) {
        var menu = {
            '': {
                'title': title,
                'back': showMainMenu_1
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
            if (byPeriod_1) {
                displayedValue = 1 / displayedValue;
                if (useMinutes_1)
                    displayedValue /= 60;
            }
            else if (useMinutes_1)
                displayedValue *= 60;
            E.showMenu((_a = {
                    '': {
                        'title': options[key].name,
                        'back': function () {
                            if (byPeriod_1) {
                                if (useMinutes_1)
                                    displayedValue *= 60;
                                displayedValue = 1 / displayedValue;
                            }
                            else if (useMinutes_1)
                                displayedValue /= 60;
                            options[key].value = displayedValue;
                            tapTimes_1 = [];
                            Bangle.http(getQueryUrl_1(url, { body: JSON.stringify(options) })).then(function () {
                                showOptions_1(options, title, url);
                            });
                        }
                    },
                    'Showing': {
                        value: byPeriod_1,
                        format: function (value) { return value ? 'Period' : 'Frequency'; },
                        onchange: function (value) {
                            byPeriod_1 = value;
                            frequencyMenu(key);
                        }
                    },
                    'Unit': {
                        value: useMinutes_1,
                        format: function (value) { return byPeriod_1 ?
                            (value ? 'Minutes' : 'Seconds') :
                            (value ? 'Per minute' : 'Per second'); },
                        onchange: function (value) {
                            useMinutes_1 = value;
                            frequencyMenu(key);
                        }
                    }
                },
                _a[byPeriod_1 ? 'Period' : 'Frequency'] = {
                    value: displayedValue,
                    min: 0,
                    step: 0.1,
                    onchange: function (value) { return displayedValue = value; }
                },
                _a['Tap to set frequency'] = function () {
                    tapTimes_1.push((new Date()).getTime());
                    if (tapTimes_1.length == config_1.numTaps) {
                        var average = tapTimes_1.reduce(function (acc, item) { return acc += item; }) / tapTimes_1.length;
                        options[key].value = 1 / (average / 1000);
                        Bangle.http(getQueryUrl_1(url, { body: JSON.stringify(options) })).then(function () {
                            Bangle.buzz(200);
                            tapTimes_1 = [];
                            frequencyMenu(key);
                        });
                    }
                },
                _a['Clear taps'] = function () {
                    tapTimes_1 = [];
                    Bangle.buzz(200);
                },
                _a));
        };
        var colorMenu = function (key) {
            var r = options[key].value[0];
            var g = options[key].value[1];
            var b = options[key].value[2];
            E.showMenu({
                '': {
                    'title': options[key].name,
                    'back': function () {
                        options[key].value[0] = r;
                        options[key].value[1] = g;
                        options[key].value[2] = b;
                        Bangle.http(getQueryUrl_1(url, { body: JSON.stringify(options) })).then(function () {
                            showOptions_1(options, title, url);
                        });
                    }
                },
                'Red': {
                    value: r,
                    min: 0,
                    max: 255,
                    step: 1,
                    onchange: function (value) { return r = value; }
                },
                'Green': {
                    value: g,
                    min: 0,
                    max: 255,
                    step: 1,
                    onchange: function (value) { return g = value; }
                },
                'Blue': {
                    value: b,
                    min: 0,
                    max: 255,
                    step: 1,
                    onchange: function (value) { return b = value; }
                },
            });
        };
        var createSaveClosure = function (key) {
            return function (value) {
                options[key].value = value;
                Bangle.http(getQueryUrl_1(url, { body: JSON.stringify(options) })).then(function () {
                    showOptions_1(options, title, url);
                });
            };
        };
        var createListSaveClosure = function (key, jsonOption) {
            return function (value) {
                options[key].value = jsonOption.choices[value].id;
                Bangle.http(getQueryUrl_1(url, { body: JSON.stringify(options) })).then(function () {
                    showOptions_1(options, title, url);
                });
            };
        };
        var createButtonClosure = function (key) {
            return function () {
                options[key].value = true;
                Bangle.http(getQueryUrl_1(url, { body: JSON.stringify(options) })).then(function () {
                    options[key].value = false;
                    showOptions_1(options, title, url);
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
    };
    var showMainMenu_1 = function () {
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
        Bangle.http(getQueryUrl_1(baseURL_1, { op: 'colorScheme' })).then(function (data) {
            colorScheme = data;
            showGetting('Effect');
            return Bangle.http(getQueryUrl_1(baseURL_1, { op: 'effect' }));
        }).then(function (data) {
            effect = data;
            showGetting('Interpolator');
            return Bangle.http(getQueryUrl_1(baseURL_1, { op: 'interpolator' }));
        }).then(function (data) {
            interpolator = data;
            showGetting('Color schemes');
            return Bangle.http(getQueryUrl_1(baseURL_1, { op: 'colorSchemes' }));
        }).then(function (data) {
            colorSchemes = JSON.parse(data);
            showGetting('Effects');
            return Bangle.http(getQueryUrl_1(baseURL_1, { op: 'effects' }));
        }).then(function (data) {
            effects = JSON.parse(data);
            showGetting('Interpolators');
            return Bangle.http(getQueryUrl_1(baseURL_1, { op: 'interpolators' }));
        }).then(function (data) {
            interpolators = JSON.parse(data);
            E.showMenu({
                '': {
                    'title': 'RGB vest control'
                },
                'Color scheme': {
                    value: Object.keys(colorSchemes).indexOf(colorScheme),
                    format: function (value) { return colorSchemes[value].name; },
                    min: 0,
                    max: colorSchemes.length - 1,
                    wrap: true,
                    onchange: function (value) {
                        colorScheme = Object.keys(colorSchemes)[value];
                        Bangle.http(getQueryUrl_1(baseURL_1, { op: 'colorScheme', val: colorScheme }));
                    }
                },
                'Color scheme options': function () {
                    var url = getQueryUrl_1(baseURL_1, { op: 'colorScheme-options' });
                    Bangle.http(url).then(function (data) {
                        showOptions_1(JSON.parse(data), 'Color scheme options', url);
                    });
                },
                'Effect': {
                    value: Object.keys(effects).indexOf(effect),
                    format: function (value) { return effects[value].name; },
                    min: 0,
                    max: effects.length - 1,
                    wrap: true,
                    onchange: function (value) {
                        effect = Object.keys(effects)[value];
                        Bangle.http(getQueryUrl_1(baseURL_1, { op: 'effect', val: effect }));
                    }
                },
                'Effect options': function () {
                    var url = getQueryUrl_1(baseURL_1, { op: 'effect-options' });
                    Bangle.http(url).then(function (data) {
                        showOptions_1(JSON.parse(data), 'Effect options', url);
                    });
                },
                'Interpolator': {
                    value: Object.keys(interpolators).indexOf(interpolator),
                    format: function (value) { return interpolators[value].name; },
                    min: 0,
                    max: interpolators.length - 1,
                    wrap: true,
                    onchange: function (value) {
                        interpolator = Object.keys(interpolators)[value];
                        Bangle.http(getQueryUrl_1(baseURL_1, { op: 'interpolator', val: interpolator }));
                    }
                },
                'Interpolator options': function () {
                    var url = getQueryUrl_1(baseURL_1, { op: 'interpolator-options' });
                    Bangle.http(url).then(function (data) {
                        showOptions_1(JSON.parse(data), 'Interpolator options', url);
                    });
                },
                'General options': function () {
                    var url = getQueryUrl_1(baseURL_1, { op: 'options' });
                    Bangle.http(url).then(function (data) {
                        showOptions_1(JSON.parse(data), 'General options', url);
                    });
                }
            });
        }).catch(function (error) {
            console.log(error);
            E.showMessage(error);
        });
    };
    Bangle.loadWidgets();
    Bangle.drawWidgets();
    Bangle.setUI({ mode: 'custom', remove: function () { } });
    var baseURL_1 = config_1.defaultURL;
    if (config_1.promptURL) {
        keyboard.input({ text: config_1.defaultURL }).then(function (text) {
            baseURL_1 = text;
            if (config_1.saveURL) {
                config_1.defaultURL = text;
                storage_1.writeJSON(SETTINGS_FILE_1, config_1);
            }
        });
    }
    baseURL_1 = "https://".concat(baseURL_1, ":").concat(config_1.port, "/api?");
    console.log("Base URL is ".concat(baseURL_1));
    showMainMenu_1();
}
