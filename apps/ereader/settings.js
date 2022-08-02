(function (back) {
  const storage = require('Storage');

  const SETTINGS_FILE = "ereader.json";

  let settings = Object.assign({
    backlight: false,
    forceBrightness: false,
    brightness: 1,
    forceBacklightTimeout: true,
    backlightTimeout: 0,
    fontSize: 12,
    widgets: true
  }, storage.readJSON(SETTINGS_FILE, true));

  function write() {
    storage.writeJSON(SETTINGS_FILE, settings);
  }

  E.showMenu({
    '': {
      'title': 'ereader',
      'back': back
    },
    "Backlight enabled": {
      value: settings.backlight,
      onchange: value => { settings.backlight = value; write(); }
    },
    "Override system brightness (if backlight on)": {
      value: settings.forceBrightness,
      onchange: value => { settings.forceBrightness = value; write(); }
    },
    "Brightness (if override enabled)": {
      value: settings.brightness,
      min: 0,
      max: 1,
      step: 0.1,
      onchange: value => { settings.brightness = value; write(); }
    },
    "Override backlight timeout": {
      value: settings.forceBacklightTimeout,
      onchange: value => { settings.forceBacklightTimeout = value; write(); }
    },
    "Backlight timeout (if override on, 0=forever)": {
      value: settings.backlightTimeout,
      min: 0,
      max: 120,
      step: 1,
      onchange: value => { settings.backlightTimeout = value; write(); }
    },
    "Font size": {
      value: settings.fontSize,
      min: 1,
      max: g.getHeight() - 24,
      step: 1,
      onchange: value => { settings.fontSize = value; write(); }
    },
    "Display widgets": {
      value: settings.widgets,
      onchange: value => { settings.widgets = value; write(); }
    },
  });
})
