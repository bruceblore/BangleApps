{
  const storage = require("Storage");
  const keyboard = require("textinput");

  const SETTINGS_FILE: string = "rgbvest.json";
  const WHITE: ColorResolvable = '#fff';
  const RED: ColorResolvable = '#f00';
  const ORANGE: ColorResolvable = '#f70';

  const WIDGET_BOTTOM: number = 24;
  const WHITE_AREA_BOTTOM = g.getHeight() / 4;
  const BRAKE_AREA_TOP = g.getHeight() * 3 / 4;
  const HAZARD_AREA_LEFT = g.getWidth() * 3 / 8;
  const HAZARD_AREA_RIGHT = g.getWidth() * 5 / 8;

  let config: AppConfig = (storage.readJSON(SETTINGS_FILE) || {
    port: 8443,
    defaultURL: 'localhost',
    promptURL: true,
    saveURL: true,
    numTaps: 5
  }) as AppConfig;

  let getQueryUrl = function (baseURL: string, query: Query) {
    let result: string = baseURL;
    for (let key in query) {
      result += `${key}=${query[key]}&`
    }
    return result;
  }

  let handlerMode: '' | 'cycling' = '';
  let handlerOptions: Options;
  let handlerUrl: string;
  let showCyclingMenu = function (options: Options, _title: string, url: string) {
    E.showMenu();
    setUI();

    handlerOptions = options;
    handlerUrl = url;
    handlerMode = 'cycling';

    g.setColor(WHITE).fillRect(0, WIDGET_BOTTOM, g.getWidth(), WHITE_AREA_BOTTOM)
      .setColor(ORANGE).fillRect(0, WHITE_AREA_BOTTOM, HAZARD_AREA_LEFT, BRAKE_AREA_TOP).fillRect(HAZARD_AREA_RIGHT, WHITE_AREA_BOTTOM, g.getWidth(), BRAKE_AREA_TOP)
      .setColor(RED).fillRect(HAZARD_AREA_LEFT, WHITE_AREA_BOTTOM, HAZARD_AREA_RIGHT, BRAKE_AREA_TOP).fillRect(0, BRAKE_AREA_TOP, g.getWidth(), g.getHeight());
  }

  let byPeriod: boolean = false;
  let useMinutes: boolean = false;
  let tapTimes: Array<number> = [];
  let showOptions = function (options: Options, title: string, url: string) {
    if (options[''] == 'cycling') showCyclingMenu(options, title, url);
    else {
      let menu: Menu = {
        '': {
          'title': title,
          'back': showMainMenu,
          'remove': setUI
        }
      };

      // Store a call to open a settings menu along with the key that it is to be opened with, to avoid the use of eval.
      let createMenuClosure = function (func: (key: string) => void, key: string) {
        return function () {
          func(key);
        }
      }

      let frequencyMenu = function (key: string) {
        let displayedValue: number = (options[key]! as FrequencyOption).value;
        if (byPeriod) {
          displayedValue = 1 / displayedValue;
          if (useMinutes) displayedValue /= 60; // seconds -> minutes
        } else if (useMinutes) displayedValue *= 60; // per second -> per minute

        E.showMenu({
          '': {
            'title': (options[key]! as FrequencyOption).name,
            'back': () => {
              // Should be the opposite of the conversion above
              if (byPeriod) {
                if (useMinutes) displayedValue *= 60 //minutes -> seconds
                displayedValue = 1 / displayedValue;
              } else if (useMinutes) displayedValue /= 60; // per minute -> per second
              (options[key]! as FrequencyOption).value = displayedValue;
              tapTimes = [];
              Bangle.http(getQueryUrl(url, { body: JSON.stringify(options) })).then(() => {
                showOptions(options, title, url);
              });
            },
            'remove': setUI
          },
          'Showing': {
            value: byPeriod,
            format: value => value ? 'Period' : 'Frequency',
            onchange: value => {
              byPeriod = value;
              frequencyMenu(key);
            }
          },
          'Unit': {
            value: useMinutes,
            format: value => byPeriod ?
              (value ? 'Minutes' : 'Seconds') :
              (value ? 'Per minute' : 'Per second'),
            onchange: value => {
              useMinutes = value;
              frequencyMenu(key);
            }
          },
          [byPeriod ? 'Period' : 'Frequency']: {
            value: displayedValue,
            min: 0,
            step: 0.1,
            onchange: value => displayedValue = value
          },
          'Tap to set frequency': () => {
            tapTimes.push((new Date()).getTime());
            if (tapTimes.length == config.numTaps) {
              let average = tapTimes.reduce((acc, item) => { return acc += item }) / tapTimes.length;
              (options[key] as FrequencyOption).value = 1 / (average / 1000);
              Bangle.http(getQueryUrl(url, { body: JSON.stringify(options) })).then(() => {
                Bangle.buzz(200);
                tapTimes = [];
                frequencyMenu(key);
              });
            }
          },
          'Clear taps': () => {
            tapTimes = [];
            Bangle.buzz(200);
          }
        });
      }

      let colorMenu = function (key: string) {
        const HEXITS = [
          '0', '1', '2', '3', '4', '5', '6', '7',
          '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'
        ];

        let red: number = (options[key]! as ColorOption).value[0];
        let green: number = (options[key]! as ColorOption).value[1];
        let blue: number = (options[key]! as ColorOption).value[2];

        let red16: number = Math.floor(red / 16);
        let green16: number = Math.floor(green / 16);
        let blue16: number = Math.floor(blue / 16);

        let red1: number = red % 16;
        let green1: number = green % 16;
        let blue1: number = blue % 16;

        E.showMenu({
          '': {
            'title': (options[key]! as ColorOption).name,
            'back': () => {
              (options[key]! as ColorOption).value[0] = red;
              (options[key]! as ColorOption).value[1] = green;
              (options[key]! as ColorOption).value[2] = blue;
              Bangle.http(getQueryUrl(url, { body: JSON.stringify(options) })).then(() => {
                showOptions(options, title, url);
              });
            },
            'remove': setUI
          },
          'Red 16': {
            value: red16,
            min: 0,
            max: 15,
            step: 1,
            format: (value: number) => HEXITS[value]!,
            onchange: (value: number) => {
              red16 = value;
              red = 16 * red16 + red1;
            }
          },
          'Red 1': {
            value: red1,
            min: 0,
            max: 15,
            step: 1,
            format: (value: number) => HEXITS[value]!,
            onchange: (value: number) => {
              red1 = value;
              red = 16 * red16 + red1;
            }
          },
          'Green 16': {
            value: green16,
            min: 0,
            max: 15,
            step: 1,
            format: (value: number) => HEXITS[value]!,
            onchange: (value: number) => {
              green16 = value;
              green = 16 * green16 + green1;
            }
          },
          'Green 1': {
            value: green1,
            min: 0,
            max: 15,
            step: 1,
            format: (value: number) => HEXITS[value]!,
            onchange: (value: number) => {
              green1 = value;
              green = 16 * green16 + green1;
            }
          },
          'Blue 16': {
            value: blue16,
            min: 0,
            max: 15,
            step: 1,
            format: (value: number) => HEXITS[value]!,
            onchange: (value: number) => {
              blue16 = value;
              blue = 16 * blue16 + blue1;
            }
          },
          'Blue 1': {
            value: blue1,
            min: 0,
            max: 15,
            step: 1,
            format: (value: number) => HEXITS[value]!,
            onchange: (value: number) => {
              blue1 = value;
              blue = 16 * blue16 + blue1;
            }
          },
        });
      }

      // Create a closure to store a value into the current position of options[key]
      let createSaveClosure = function (key: string) {
        return function (value: any) {
          (options[key]! as NumberOption).value = value;
          Bangle.http(getQueryUrl(url, { body: JSON.stringify(options) })).then(() => {
            showOptions(options, title, url);
          });
        };
      }

      let createListSaveClosure = function (key: string, jsonOption: ListOption) {
        return function (value: number) {
          (options[key]! as ListOption).value = jsonOption.choices[value]!.id;
          Bangle.http(getQueryUrl(url, { body: JSON.stringify(options) })).then(() => {
            showOptions(options, title, url);
          });
        };
      }

      let createButtonClosure = function (key: string) {
        return () => {
          (options[key]! as ButtonOption).value = true;
          Bangle.http(getQueryUrl(url, { body: JSON.stringify(options) })).then(() => {
            (options[key]! as ButtonOption).value = false;
            showOptions(options, title, url);
          });
        }
      }

      for (let key in options) {
        let jsonOption: Option = options[key]! as Option;
        let option = {};

        //TODO think of a way to include .detail hints
        if (jsonOption.type == 'frequency') {
          menu[jsonOption.name] = createMenuClosure(frequencyMenu, key);
        } else if (jsonOption.type == 'color') {
          menu[jsonOption.name] = createMenuClosure(colorMenu, key);
        } else if (jsonOption.type == 'number') {
          option = {
            value: jsonOption.value,
            onchange: createSaveClosure(key)
          }
          if (jsonOption.hasOwnProperty('min')) (option as NumberOption).min = (jsonOption as NumberOption).min!;
          if (jsonOption.hasOwnProperty('max')) (option as NumberOption).max = (jsonOption as NumberOption).max!;
          if (jsonOption.hasOwnProperty('step')) (option as NumberOption).step = (jsonOption as NumberOption).step!;
          menu[jsonOption.name] = option;
        } else if (jsonOption.type == 'list') {
          option = {
            value: (jsonOption as ListOption).choices.map(choice => choice.id).indexOf(jsonOption.value),
            format: (value: number) => (jsonOption as ListOption).choices[value]!.name,
            min: 0,
            max: (jsonOption as ListOption).choices.length - 1,
            wrap: false,
            onchange: createListSaveClosure(key, (jsonOption as ListOption))
          };
          menu[jsonOption.name] = option;
        } else if (jsonOption.type == 'bool') {
          option = {
            value: jsonOption.value,
            onchange: createSaveClosure(key)
          };
          menu[jsonOption.name] = option;
        } else if (jsonOption.type == 'button') {
          menu[jsonOption.name] = createButtonClosure(key);
        } else {
          Bangle.buzz(750);
          console.log(`Warning! Unsupported option type ${jsonOption.type}`);
        }
      }

      E.showMenu(menu);
    }
  }

  let indexOfDict = function (dict: { [key: string]: any }, index: number) {
    return dict[Object.keys(dict)[index]];
  }

  // Display the main menu
  let showMainMenu = function () {
    let colorScheme: string;
    let effect: string;
    let interpolator: string;
    let colorSchemes: NameDescriptionList;
    let effects: NameDescriptionList;
    let interpolators: NameDescriptionList;

    let showGetting = function (content: string) {
      E.showMessage(`Getting data...\n${content}`);
    }

    showGetting('Color scheme');
    Bangle.http(getQueryUrl(baseURL, { op: 'colorScheme' })).then(data => {
      colorScheme = data.resp;
      showGetting('Effect')
      return Bangle.http(getQueryUrl(baseURL, { op: 'effect' }));
    }).then(data => {
      effect = data.resp;
      showGetting('Interpolator')
      return Bangle.http(getQueryUrl(baseURL, { op: 'interpolator' }));
    }).then(data => {
      interpolator = data.resp;
      showGetting('Color schemes')
      return Bangle.http(getQueryUrl(baseURL, { op: 'colorSchemes' }));
    }).then(data => {
      colorSchemes = JSON.parse(data.resp);
      showGetting('Effects')
      return Bangle.http(getQueryUrl(baseURL, { op: 'effects' }));
    }).then(data => {
      effects = JSON.parse(data.resp);
      showGetting('Interpolators')
      return Bangle.http(getQueryUrl(baseURL, { op: 'interpolators' }));
    }).then(data => {
      interpolators = JSON.parse(data.resp);
      return;
    }).catch((error: string) => {
      console.log(error);
      E.showMessage(error);
      throw false;  // Break the chain and do not display the menu if there was an error
    }).then(function () {
      E.showMenu({
        '': {
          'title': 'RGB vest control',
          'remove': setUI
        },
        'Color scheme': {
          value: Object.keys(colorSchemes).indexOf(colorScheme),
          format: (value: number) => indexOfDict(colorSchemes, value).name,
          min: 0,
          max: Object.keys(colorSchemes).length - 1,
          wrap: true,
          onchange: (value: number) => {
            colorScheme = Object.keys(colorSchemes)[value];
            Bangle.http(getQueryUrl(baseURL, { op: 'colorScheme', val: colorScheme }));
          }
        },
        'Color scheme options': () => {
          let url = getQueryUrl(baseURL, { op: 'colorScheme-options' });
          Bangle.http(url).then(data => {
            showOptions(JSON.parse(data.resp), 'Color scheme options', url);
          });
        },
        'Effect': {
          value: Object.keys(effects).indexOf(effect),
          format: (value: number) => indexOfDict(effects, value).name,
          min: 0,
          max: Object.keys(effects).length - 1,
          wrap: true,
          onchange: (value: number) => {
            effect = Object.keys(effects)[value];
            Bangle.http(getQueryUrl(baseURL, { op: 'effect', val: effect }));
          }
        },
        'Effect options': () => {
          let url = getQueryUrl(baseURL, { op: 'effect-options' });
          Bangle.http(url).then(data => {
            showOptions(JSON.parse(data.resp), 'Effect options', url);
          });
        },
        'Interpolator': {
          value: Object.keys(interpolators).indexOf(interpolator),
          format: (value: number) => indexOfDict(interpolators, value).name,
          min: 0,
          max: Object.keys(interpolators).length - 1,
          wrap: true,
          onchange: (value: number) => {
            interpolator = Object.keys(interpolators)[value];
            Bangle.http(getQueryUrl(baseURL, { op: 'interpolator', val: interpolator }));
          }
        },
        'Interpolator options': () => {
          let url = getQueryUrl(baseURL, { op: 'interpolator-options' });
          Bangle.http(url).then(data => {
            showOptions(JSON.parse(data.resp), 'Interpolator options', url);
          });
        },
        'General options': () => {
          let url = getQueryUrl(baseURL, { op: 'options' });
          Bangle.http(url).then(data => {
            showOptions(JSON.parse(data.resp), 'General options', url);
          });
        }
      });
    });
  }

  // Fast loading support
  Bangle.loadWidgets();
  Bangle.drawWidgets();
  let setUI = function (): void {
    Bangle.setUI({
      mode: 'custom',
      touch: function (_button, xy) {
        console.log('touch')
        if (handlerMode == 'cycling') {
          if (xy!.y < WHITE_AREA_BOTTOM) {
            (handlerOptions as CyclingOptions).frontAndBack.value = !(handlerOptions as CyclingOptions).frontAndBack.value;
          } else if (xy!.y < BRAKE_AREA_TOP) {
            if (xy!.x < HAZARD_AREA_LEFT) {
              if ((handlerOptions as CyclingOptions).signal.value == 'left') (handlerOptions as CyclingOptions).signal.value = 'off';
              else (handlerOptions as CyclingOptions).signal.value = 'left';
            } else if (xy!.x < HAZARD_AREA_RIGHT) {
              if ((handlerOptions as CyclingOptions).signal.value == 'hazards') (handlerOptions as CyclingOptions).signal.value = 'off';
              else (handlerOptions as CyclingOptions).signal.value = 'hazards';
            } else {
              if ((handlerOptions as CyclingOptions).signal.value == 'right') (handlerOptions as CyclingOptions).signal.value = 'off';
              else (handlerOptions as CyclingOptions).signal.value = 'right';
            }
          } else {
            (handlerOptions as CyclingOptions).brake.value = !(handlerOptions as CyclingOptions).brake.value;
          }

          Bangle.http(getQueryUrl(handlerUrl, { body: JSON.stringify(handlerOptions) })).then(() => {
            Bangle.buzz();
          });
        }
      },
      swipe: function (_lr, ud) {
        if (handlerMode == 'cycling') {
          if (ud == 1) {
            (handlerOptions as CyclingOptions).redSignal.value = !(handlerOptions as CyclingOptions).redSignal.value;
            Bangle.http(getQueryUrl(handlerUrl, { body: JSON.stringify(handlerOptions) })).then(() => {
              Bangle.buzz();
            });
          }
        }
      },
      btn: function (_n) {
        if (handlerMode == 'cycling') {
          handlerMode = '';
          showMainMenu();
        }
      },
      remove: () => { },
    });
  }
  setUI();

  // Get and save the URL from the user if necessary, then launch the main menu
  let baseURL: string = config.defaultURL;
  if (config.promptURL) {
    keyboard.input({ text: config.defaultURL }).then((text: string) => {
      baseURL = text;
      if (config.saveURL) {
        config.defaultURL = text;
        config.promptURL = false;
        storage.writeJSON(SETTINGS_FILE, config);
      }
      baseURL = `https://${baseURL}:${config.port}/api?`;
      showMainMenu();
    });
  } else {
    baseURL = `https://${baseURL}:${config.port}/api?`;
    showMainMenu();
  }
}