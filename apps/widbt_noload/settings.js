(function (back) {
  const storage = require('Storage');

  const FILE = "widbt_noload.json";

  let settings = Object.assign({
    showWidget: true,
    buzzOnConnect: false,
    buzzOnLoss: true,
    lossDelay: true,
    hideConnected: false,
  }, storage.readJSON(FILE, true));

  function save() {
    storage.writeJSON(FILE, settings);
  }

  E.showMenu({
    "": {
      "title": "Bluetooth Widget",
      'back': back,
    },
    "Show Widget": {
      value: settings.showWidget,
      onchange: v => {
        settings.showWidget = v;
        save();
      }
    },
    "Buzz on Connect": {
      value: settings.buzzOnConnect,
      onchange: v => {
        settings.buzzOnConnect = v;
        save();
      }
    },
    "Buzz on loss": {
      value: settings.buzzOnLoss,
      onchange: v => {
        settings.buzzOnLoss = v;
        save();
      }
    },
    "Delay before loss buzz": {
      value: settings.lossDelay,
      onchange: v => {
        settings.lossDelay = v;
        save();
      }
    },
    "Hide connected": {
      value: settings.hideConnected,
      onchange: v => {
        settings.hideConnected = v;
        save();
      }
    }
  });

});
