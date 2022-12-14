(function (back) {
  var systemsettings = require("Storage").readJSON("setting.json") || {};

  function writeSettings(key, value) {
    var s = require('Storage').readJSON(FILE, true) || {};
    s[key] = value;
    require('Storage').writeJSON(FILE, s);
    readSettings();
  }

  function readSettings() {
    settings = Object.assign(
      require('Storage').readJSON("powermanager.default.json", true) || {},
      require('Storage').readJSON(FILE, true) || {}
    );
  }

  var FILE = "powermanager.json";
  var settings;
  readSettings();

  var mainmenu = {
    '': {
      'title': 'Power Manager'
    },
    'Monotonic percentage': {
      value: !!settings.forceMonoPercentage,
      onchange: v => {
        writeSettings("forceMonoPercentage", v);
      }
    },
    'Monotonic voltage': {
      value: !!settings.forceMonoVoltage,
      onchange: v => {
        writeSettings("forceMonoVoltage", v);
      }
    },
    'Charge warning': function () {
      E.showMenu(submenu_chargewarn);
    },
    'Discharge warning': function () {
      E.showMenu(submenu_dischargewarn);
    },
    'Calibrate': function () {
      E.showMenu(submenu_calibrate);
    }
  };

  function roundToDigits(number, stepsize) {
    return Math.round(number / stepsize) * stepsize;
  }

  var stepsize = 0.0002;
  var full = 0.3144;

  function getInitialCalibrationOffset() {
    return roundToDigits(systemsettings.batFullVoltage - full, stepsize) || 0;
  }

  var submenu_calibrate = {
    '': {
      title: "Calibrate",
      back: function () {
        E.showMenu(mainmenu);
      },
    },
    'Autodetect': {
      value: !!settings.autoCalibration,
      onchange: v => {
        writeSettings("autoCalibration", v);
      }
    },
    'Offset': {
      min: -0.05,
      max: 0.05,
      step: stepsize,
      value: getInitialCalibrationOffset(),
      format: v => roundToDigits(v, stepsize).toFixed(("" + stepsize).length - 2),
      onchange: v => {
        require("powermanager").setCalibration(v + full);
      }
    },
    'Clear': function () {
      E.showPrompt("Clear charging offset?").then((r) => {
        if (r) {
          delete systemsettings.batFullVoltage;
          require("Storage").writeJSON("setting.json", systemsettings);
          //reset value shown in menu to the newly set one
          submenu_calibrate.Offset.value = getInitialCalibrationOffset();
          E.showMenu(mainmenu);
        }
      });
    }
  };

  var submenu_chargewarn = {
    '': {
      title: "Charge warning",
      back: function () {
        E.showMenu(mainmenu);
      },
    },
    'Enabled': {
      value: !!settings.warnHighEnabled,
      format: v => settings.warnHighEnabled ? "On" : "Off",
      onchange: v => {
        writeSettings("warnHighEnabled", v);
      }
    },
    'Percentage': {
      min: 60,
      max: 100,
      step: 2,
      value: settings.warnHigh,
      format: v => v + "%",
      onchange: v => {
        writeSettings("warnHigh", v);
      }
    }
  };

  var submenu_dischargewarn = {
    '': {
      title: "Discharge warning"
    },
    '< Back': function () {
      E.showMenu(mainmenu);
    },
    'Enabled': {
      value: !!settings.warnLowEnabled,
      format: v => settings.warnLowEnabled ? "On" : "Off",
      onchange: v => {
        writeSettings("warnLowEnabled", v);
      }
    },
    'Percentage': {
      min: 0,
      max: 50,
      step: 2,
      value: settings.warnLow,
      format: v => v + "%",
      onchange: v => {
        writeSettings("warnLow", v);
      }
    }
  };

  E.showMenu(mainmenu);
});