{
    var storage_1 = require("Storage");
    var keyboard = require("textinput");
    var SETTINGS_FILE_1 = "rgbvest.json";
    var WHITE_1 = '#fff';
    var RED_1 = '#f00';
    var ORANGE_1 = '#f70';
    var WIDGET_BOTTOM_1 = 24;
    var WHITE_AREA_BOTTOM_1 = g.getHeight() / 4;
    var BRAKE_AREA_TOP_1 = g.getHeight() * 3 / 4;
    var HAZARD_AREA_LEFT_1 = g.getWidth() * 3 / 8;
    var HAZARD_AREA_RIGHT_1 = g.getWidth() * 5 / 8;
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
    var handlerMode_1 = '';
    var handlerOptions_1;
    var handlerUrl_1;
    var showCyclingMenu_1 = function (options, _title, url) {
        E.showMenu();
        setUI_1();
        handlerOptions_1 = options;
        handlerUrl_1 = url;
        handlerMode_1 = 'cycling';
        g.setColor(WHITE_1).fillRect(0, WIDGET_BOTTOM_1, g.getWidth(), WHITE_AREA_BOTTOM_1)
            .setColor(ORANGE_1).fillRect(0, WHITE_AREA_BOTTOM_1, HAZARD_AREA_LEFT_1, BRAKE_AREA_TOP_1).fillRect(HAZARD_AREA_RIGHT_1, WHITE_AREA_BOTTOM_1, g.getWidth(), BRAKE_AREA_TOP_1)
            .setColor(RED_1).fillRect(HAZARD_AREA_LEFT_1, WHITE_AREA_BOTTOM_1, HAZARD_AREA_RIGHT_1, BRAKE_AREA_TOP_1).fillRect(0, BRAKE_AREA_TOP_1, g.getWidth(), g.getHeight());
    };
    var byPeriod_1 = false;
    var useMinutes_1 = false;
    var tapTimes_1 = [];
    var showOptions_1 = function (options, title, url) {
        if (options[''] == 'cycling')
            showCyclingMenu_1(options, title, url);
        else {
            var menu = {
                '': {
                    'title': title,
                    'back': showMainMenu_1,
                    'remove': setUI_1
                }
            };
            var createMenuClosure = function (func, key) {
                return function () {
                    func(key);
                };
            };
            var frequencyMenu_1 = function (key) {
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
                            },
                            'remove': setUI_1
                        },
                        'Showing': {
                            value: byPeriod_1,
                            format: function (value) { return value ? 'Period' : 'Frequency'; },
                            onchange: function (value) {
                                byPeriod_1 = value;
                                frequencyMenu_1(key);
                            }
                        },
                        'Unit': {
                            value: useMinutes_1,
                            format: function (value) { return byPeriod_1 ?
                                (value ? 'Minutes' : 'Seconds') :
                                (value ? 'Per minute' : 'Per second'); },
                            onchange: function (value) {
                                useMinutes_1 = value;
                                frequencyMenu_1(key);
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
                                frequencyMenu_1(key);
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
                            Bangle.http(getQueryUrl_1(url, { body: JSON.stringify(options) })).then(function () {
                                showOptions_1(options, title, url);
                            });
                        },
                        'remove': setUI_1
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
                    menu[jsonOption.name] = createMenuClosure(frequencyMenu_1, key);
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
        }
    };
    var indexOfDict_1 = function (dict, index) {
        return dict[Object.keys(dict)[index]];
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
            colorScheme = data.resp;
            showGetting('Effect');
            return Bangle.http(getQueryUrl_1(baseURL_1, { op: 'effect' }));
        }).then(function (data) {
            effect = data.resp;
            showGetting('Interpolator');
            return Bangle.http(getQueryUrl_1(baseURL_1, { op: 'interpolator' }));
        }).then(function (data) {
            interpolator = data.resp;
            showGetting('Color schemes');
            return Bangle.http(getQueryUrl_1(baseURL_1, { op: 'colorSchemes' }));
        }).then(function (data) {
            colorSchemes = JSON.parse(data.resp);
            showGetting('Effects');
            return Bangle.http(getQueryUrl_1(baseURL_1, { op: 'effects' }));
        }).then(function (data) {
            effects = JSON.parse(data.resp);
            showGetting('Interpolators');
            return Bangle.http(getQueryUrl_1(baseURL_1, { op: 'interpolators' }));
        }).then(function (data) {
            interpolators = JSON.parse(data.resp);
            return;
        }).catch(function (error) {
            console.log(error);
            E.showMessage(error);
            throw false;
        }).then(function () {
            E.showMenu({
                '': {
                    'title': 'RGB vest control',
                    'remove': setUI_1
                },
                'Color scheme': {
                    value: Object.keys(colorSchemes).indexOf(colorScheme),
                    format: function (value) { return indexOfDict_1(colorSchemes, value).name; },
                    min: 0,
                    max: Object.keys(colorSchemes).length - 1,
                    wrap: true,
                    onchange: function (value) {
                        colorScheme = Object.keys(colorSchemes)[value];
                        Bangle.http(getQueryUrl_1(baseURL_1, { op: 'colorScheme', val: colorScheme }));
                    }
                },
                'Color scheme options': function () {
                    var url = getQueryUrl_1(baseURL_1, { op: 'colorScheme-options' });
                    Bangle.http(url).then(function (data) {
                        showOptions_1(JSON.parse(data.resp), 'Color scheme options', url);
                    });
                },
                'Effect': {
                    value: Object.keys(effects).indexOf(effect),
                    format: function (value) { return indexOfDict_1(effects, value).name; },
                    min: 0,
                    max: Object.keys(effects).length - 1,
                    wrap: true,
                    onchange: function (value) {
                        effect = Object.keys(effects)[value];
                        Bangle.http(getQueryUrl_1(baseURL_1, { op: 'effect', val: effect }));
                    }
                },
                'Effect options': function () {
                    var url = getQueryUrl_1(baseURL_1, { op: 'effect-options' });
                    Bangle.http(url).then(function (data) {
                        showOptions_1(JSON.parse(data.resp), 'Effect options', url);
                    });
                },
                'Interpolator': {
                    value: Object.keys(interpolators).indexOf(interpolator),
                    format: function (value) { return indexOfDict_1(interpolators, value).name; },
                    min: 0,
                    max: Object.keys(interpolators).length - 1,
                    wrap: true,
                    onchange: function (value) {
                        interpolator = Object.keys(interpolators)[value];
                        Bangle.http(getQueryUrl_1(baseURL_1, { op: 'interpolator', val: interpolator }));
                    }
                },
                'Interpolator options': function () {
                    var url = getQueryUrl_1(baseURL_1, { op: 'interpolator-options' });
                    Bangle.http(url).then(function (data) {
                        showOptions_1(JSON.parse(data.resp), 'Interpolator options', url);
                    });
                },
                'General options': function () {
                    var url = getQueryUrl_1(baseURL_1, { op: 'options' });
                    Bangle.http(url).then(function (data) {
                        showOptions_1(JSON.parse(data.resp), 'General options', url);
                    });
                }
            });
        });
    };
    Bangle.loadWidgets();
    Bangle.drawWidgets();
    var setUI_1 = function () {
        Bangle.setUI({
            mode: 'custom',
            touch: function (_button, xy) {
                console.log('touch');
                if (handlerMode_1 == 'cycling') {
                    if (xy.y < WHITE_AREA_BOTTOM_1) {
                        handlerOptions_1.frontAndBack.value = !handlerOptions_1.frontAndBack.value;
                    }
                    else if (xy.y < BRAKE_AREA_TOP_1) {
                        if (xy.x < HAZARD_AREA_LEFT_1) {
                            if (handlerOptions_1.signal.value == 'left')
                                handlerOptions_1.signal.value = 'off';
                            else
                                handlerOptions_1.signal.value = 'left';
                        }
                        else if (xy.x < HAZARD_AREA_RIGHT_1) {
                            if (handlerOptions_1.signal.value == 'hazards')
                                handlerOptions_1.signal.value = 'off';
                            else
                                handlerOptions_1.signal.value = 'hazards';
                        }
                        else {
                            if (handlerOptions_1.signal.value == 'right')
                                handlerOptions_1.signal.value = 'off';
                            else
                                handlerOptions_1.signal.value = 'right';
                        }
                    }
                    else {
                        handlerOptions_1.brake.value = !handlerOptions_1.brake.value;
                    }
                    Bangle.http(getQueryUrl_1(handlerUrl_1, { body: JSON.stringify(handlerOptions_1) })).then(function () {
                        Bangle.buzz();
                    });
                }
            },
            swipe: function (_lr, ud) {
                if (handlerMode_1 == 'cycling') {
                    if (ud == 1) {
                        handlerOptions_1.redSignal.value = !handlerOptions_1.redSignal.value;
                        Bangle.http(getQueryUrl_1(handlerUrl_1, { body: JSON.stringify(handlerOptions_1) })).then(function () {
                            Bangle.buzz();
                        });
                    }
                }
            },
            btn: function (_n) {
                if (handlerMode_1 == 'cycling') {
                    handlerMode_1 = '';
                    showMainMenu_1();
                }
            },
            remove: function () { },
        });
    };
    setUI_1();
    var baseURL_1 = config_1.defaultURL;
    if (config_1.promptURL) {
        keyboard.input({ text: config_1.defaultURL }).then(function (text) {
            baseURL_1 = text;
            if (config_1.saveURL) {
                config_1.defaultURL = text;
                config_1.promptURL = false;
                storage_1.writeJSON(SETTINGS_FILE_1, config_1);
            }
            baseURL_1 = "https://".concat(baseURL_1, ":").concat(config_1.port, "/api?");
            showMainMenu_1();
        });
    }
    else {
        baseURL_1 = "https://".concat(baseURL_1, ":").concat(config_1.port, "/api?");
        showMainMenu_1();
    }
}
