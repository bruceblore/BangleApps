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
    "< Back": back,
    'Widget': function () {
      E.showMenu(submenu_widget);
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
    },
    'Logging': function () {
      E.showMenu(submenu_logging);
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
      value: !!settings.warnEnabled,
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

  var submenu_logging = {
    '': {
      title: "Logging",
      back: function () {
        E.showMenu(mainmenu);
      },
    },
    'Enabled': {
      value: !!settings.log,
      onchange: v => {
        writeSettings("log", v);
      }
    },
    'Trace': {
      value: !!settings.logDetails,
      onchange: v => {
        writeSettings("logDetails", v);
      }
    },
    'Clear logs': function (){
      E.showPrompt("Delete logs and reload?").then((v)=>{
        if (v) {
          require('Storage').open("powermanager.log","w").erase();
          require("Storage").erase("powermanager.def.json");
          require("Storage").erase("powermanager.hw.json");
          load();
        } else 
          E.showMenu(submenu_logging); 
       }).catch(()=>{
        E.showMenu(submenu_logging);
      });
    }
  }

  var submenu_widget = {
    '': {
      title: "Widget",
      back: function () {
        E.showMenu(mainmenu);
      },
    },
    'Enabled': {
      value: !!settings.widget,
      onchange: v => {
        writeSettings("widget", v);
      }
    },
    'Refresh': {
      min: 0.5,
      max: 60,
      step: 0.5,
      value: settings.refreshUnlocked || 1,
      format: v => v + "s",
      onchange: v => {
        writeSettings("refreshUnlocked", v);
      }
    },
    'Refresh locked': {
      min: 5,
      max: 120,
      step: 5,
      value: settings.refreshLocked || 60,
      format: v => v + "s",
      onchange: v => {
        writeSettings("refreshLocked", v);
      }
    }
  }

  E.showMenu(mainmenu);
});