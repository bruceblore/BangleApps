(function () {
  var settings = Object.assign(
    require('Storage').readJSON("powermanager.default.json", true) || {},
    require('Storage').readJSON("powermanager.json", true) || {}
  );

  if (settings.warnHighEnabled) {
    print("High charge warning enabled");
    var chargingInterval;

    function handleCharging(charging) {
      if (charging) {
        if (chargingInterval) clearInterval(chargingInterval);
        chargingInterval = setInterval(() => {
          if (E.getBattery() >= settings.warnHigh) {
            Bangle.buzz(1000);
          }
        }, 10000);
      }
      if (chargingInterval && !charging) {
        clearInterval(chargingInterval);
        chargingInterval = undefined;
      }
    }

    Bangle.on("charging", handleCharging);
    handleCharging(Bangle.isCharging());
  }

  if (settings.warnLowEnabled) {
    print("Low charge warning enabled");
    var dischargingInterval;

    function handleDischarging(charging) {
      if (!charging) {
        if (dischargingInterval) clearInterval(dischargingInterval);
        dischargingInterval = setInterval(() => {
          if (E.getBattery() <= settings.warnLow) {
            //One long vibration, because infinite shorter ones will use the small amount of power left quickly.
            Bangle.buzz(2000);
            clearInterval(dischargingInterval);
            dischargingInterval = undefined;
          }
        }, 10000);
      }
      if (dischargingInterval && charging) {
        clearInterval(dischargingInterval);
        dischargingInterval = undefined;
      }
    }

    Bangle.on("charging", handleDischarging);
    handleDischarging(Bangle.isCharging());
  }



  if (settings.forceMonoPercentage) {
    var p = Math.round((E.getBattery() + E.getBattery() + E.getBattery() + E.getBattery()) / 4);
    var op = E.getBattery;
    E.getBattery = function () {
      var current = Math.round((op() + op() + op() + op()) / 4);
      if (Bangle.isCharging() && current > p) p = current;
      if (!Bangle.isCharging() && current < p) p = current;
      return p;
    };
  }

  if (settings.forceMonoVoltage) {
    var v = (NRF.getBattery() + NRF.getBattery() + NRF.getBattery() + NRF.getBattery()) / 4;
    var ov = NRF.getBattery;
    NRF.getBattery = function () {
      var current = (ov() + ov() + ov() + ov()) / 4;
      if (Bangle.isCharging() && current > v) v = current;
      if (!Bangle.isCharging() && current < v) v = current;
      return v;
    };
  }
})();
