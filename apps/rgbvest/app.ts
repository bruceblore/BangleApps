const SETTINGS_FILE: string = "rgbvest.json";
const storage = require("Storage");
const keyboard = require("textinput");

let config: AppConfig = (storage.readJSON(SETTINGS_FILE) || {
  port: 8443,
  defaultURL: 'localhost',
  promptURL: true,
  saveURL: true,
  numTaps: 5
}) as AppConfig;

function getQueryUrl(baseURL: string, query: Query) {
  let result: string = baseURL;
  for (let key in query) {
    result += `${key}=${query[key]}&`
  }
  return result;
}

let byPeriod: boolean = false;
let useMinutes: boolean = false;
let tapTimes: Array<number> = [];
function showOptions(options: Options, title: string, url: string) {
  let menu: Menu = {
    '': {
      'title': title,
      'back': showMainMenu
    }
  };

  function frequencyMenu(key: string) {
    let displayedValue: number = (options[key]! as Option).value as number;
    if (byPeriod) {
      displayedValue = 1 / displayedValue;
      if (useMinutes) displayedValue /= 60; // seconds -> minutes
    } else if (useMinutes) displayedValue *= 60; // per second -> per minute

    E.showMenu({
      '': {
        'title': (options[key]! as Option).name,
        'back': () => {
          // Should be the opposite of the conversion above
          if (byPeriod) {
            if (useMinutes) displayedValue *= 60 //minutes -> seconds
            displayedValue = 1 / displayedValue;
          } else if (useMinutes) displayedValue /= 60; // per minute -> per second
          (options[key]! as FrequencyOption).value = displayedValue;
          tapTimes = [];
          Bangle.http(url + `&body=${JSON.stringify(options)}`).then(data => {
            showOptions(options, title, url);
          });
        }
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
          (options[key]! as FrequencyOption).value = average / 1000;
          Bangle.http(url + `&body=${JSON.stringify(options)}`).then(data => {
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

  function colorMenu(key: string) {
    let r: number = (options[key]! as ColorOption).value[0];
    let g: number = (options[key]! as ColorOption).value[1];
    let b: number = (options[key]! as ColorOption).value[2];
    E.showMenu({
      '': {
        'title': (options[key]! as ColorOption).name,
        'back': () => {
          (options[key]! as ColorOption).value[0] = r;
          (options[key]! as ColorOption).value[1] = g;
          (options[key]! as ColorOption).value[2] = b;
          Bangle.http(url + `&body=${JSON.stringify(options)}`).then(data => {
            showOptions(options, title, url);
          });
        }
      },
      'Red': {
        value: r,
        min: 0,
        max: 255,
        step: 1,
        onchange: value => r = value
      },
      'Green': {
        value: g,
        min: 0,
        max: 255,
        step: 1,
        onchange: value => g = value
      },
      'Blue': {
        value: b,
        min: 0,
        max: 255,
        step: 1,
        onchange: value => b = value
      },
    });
  }

  for (let key in options) {
    let jsonOption: Option = options[key]! as Option;
    let option = {};

    //TODO think of a way to include .detail hints
    if (jsonOption.type == 'frequency') {
      //Sorry, I don't know of a better way to do this than eval. Shouldn't be super bad because the keys all come from the repo
      //TODO think of something less disgusting than eval
      menu[jsonOption.name] = eval(`() => { frequencyMenu('${key}', false, false); }`);
    } else if (jsonOption.type == 'color') {
      menu[jsonOption.name] = eval(`()=>{colorMenu('${key}')}`);
    } else if (jsonOption.type == 'number') {
      option = {
        value: jsonOption.value,
        onchange: (value: number) => {
          eval(`options['${key}'].value = value`);
          Bangle.http(url + `&body=${JSON.stringify(options)}`).then(data => {
            showOptions(options, title, url);
          });
        }
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
        onchange: (value: number) => {
          eval(`options['${key}'].value = jsonOption.choices[value].id`);
          Bangle.http(url + `&body=${JSON.stringify(options)}`).then(data => {
            showOptions(options, title, url);
          });
        }
      };
      menu[jsonOption.name] = option;
    } else if (jsonOption.type == 'bool') {
      option = {
        value: jsonOption.value,
        onchange: (value: boolean) => {
          eval(`options['${key}'].value = value`);
          Bangle.http(url + `&body=${JSON.stringify(options)}`).then(data => {
            showOptions(options, title, url);
          });
        }
      };
      menu[jsonOption.name] = option;
    } else if (jsonOption.type == 'button') {
      menu[jsonOption.name] = () => {
        eval(`options['${key}'].value = true`);
        Bangle.http(url + `&body=${JSON.stringify(options)}`).then(data => {
          eval(`options['${key}'].value = false`);
          showOptions(options, title, url);
        });
      }
    } else {
      Bangle.buzz(750);
      console.log(`Warning! Unsupported option type ${jsonOption.type}`);
    }
  }
}

// Display the main menu
function showMainMenu() {
  let colorScheme: string;
  let effect: string;
  let interpolator: string;
  let colorSchemes: NameDescriptionList;
  let effects: NameDescriptionList;
  let interpolators: NameDescriptionList;

  E.showMessage('Getting data...');
  Bangle.http(getQueryUrl(baseURL, { op: 'colorScheme' })).then(data => {
    colorScheme = data;
    return Bangle.http(getQueryUrl(baseURL, { op: 'effect' }));
  }).then(data => {
    effect = data;
    return Bangle.http(getQueryUrl(baseURL, { op: 'interpolator' }));
  }).then(data => {
    interpolator = data;
    return Bangle.http(getQueryUrl(baseURL, { op: 'colorSchemes' }));
  }).then(data => {
    colorSchemes = JSON.parse(data);
    return Bangle.http(getQueryUrl(baseURL, { op: 'effects' }));
  }).then(data => {
    effects = JSON.parse(data);
    return Bangle.http(getQueryUrl(baseURL, { op: 'interpolators' }));
  }).then(data => {
    interpolators = JSON.parse(data);

    E.showMenu({
      '': {
        'title': 'RGB vest control'
      },
      'Color scheme': {
        value: Object.keys(colorSchemes).indexOf(colorScheme),
        format: (value: number) => colorSchemes[value]!.name,
        min: 0,
        max: colorSchemes.length - 1,
        wrap: true,
        onchange: (value: number) => {
          colorScheme = Object.keys(colorSchemes)[value];
          Bangle.http(getQueryUrl(baseURL, { op: 'colorScheme', val: colorScheme }));
        }
      },
      'Color scheme options': () => {
        let url = getQueryUrl(baseURL, { op: 'colorScheme-options' });
        Bangle.http(url).then(data => {
          showOptions(JSON.parse(data), 'Color scheme options', url);
        });
      },
      'Effect': {
        value: Object.keys(effects).indexOf(effect),
        format: (value: number) => effects[value]!.name,
        min: 0,
        max: effects.length - 1,
        wrap: true,
        onchange: (value: number) => {
          effect = Object.keys(effects)[value];
          Bangle.http(getQueryUrl(baseURL, { op: 'effect', val: effect }));
        }
      },
      'Effect options': () => {
        let url = getQueryUrl(baseURL, { op: 'effect-options' });
        Bangle.http(url).then(data => {
          showOptions(JSON.parse(data), 'Effect options', url);
        });
      },
      'Interpolator': {
        value: Object.keys(interpolators).indexOf(interpolator),
        format: (value: number) => interpolators[value]!.name,
        min: 0,
        max: interpolators.length - 1,
        wrap: true,
        onchange: (value: number) => {
          interpolator = Object.keys(interpolators)[value];
          Bangle.http(getQueryUrl(baseURL, { op: 'interpolator', val: interpolator }));
        }
      },
      'Interpolator options': () => {
        let url = getQueryUrl(baseURL, { op: 'interpolator-options' });
        Bangle.http(url).then(data => {
          showOptions(JSON.parse(data), 'Interpolator options', url);
        });
      },
      'General options': () => {
        let url = getQueryUrl(baseURL, { op: 'options' });
        Bangle.http(url).then(data => {
          showOptions(JSON.parse(data), 'General options', url);
        });
      }
    });
  })
}

// Get and save the URL from the user if necessary, then launch the main menu
let baseURL: string;
function getURL() {
  if (config.promptURL) {
    keyboard.input({ text: config.defaultURL }).then((text: string) => {
      baseURL = text;
      if (config.saveURL) {
        config.defaultURL = text;
        storage.writeJSON(SETTINGS_FILE, config);
      }
    });
  } else baseURL = config.defaultURL;

  baseURL = `https://${baseURL}:${config.port}/api?`;
  showMainMenu();
}

getURL();