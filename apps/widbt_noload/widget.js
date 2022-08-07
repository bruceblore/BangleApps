WIDGETS.bluetooth_notify = {
    area: "tr",
    width: 15,
    warningEnabled: true,
    icon: atob("CxQBBgDgFgJgR4jZMawfAcA4D4NYybEYIwTAsBwDAA=="),
    settings: Object.assign({
        showWidget: true,
        buzzOnConnect: false,
        buzzOnLoss: true,
        lossDelay: true,
        hideConnected: false,
    }, require('Storage').readJSON("widbt_noload.json", true)),

    draw: function () {
        if (WIDGETS.bluetooth_notify.settings.showWidget) {
            g.reset();
            if (NRF.getSecurityStatus().connected) {
                if (!WIDGETS.bluetooth_notify.settings.hideConnected) {
                    g.setColor((g.getBPP() > 8) ? "#07f" : (g.theme.dark ? "#0ff" : "#00f"));
                    g.drawImage(WIDGETS.bluetooth_notify.icon, 2 + this.x, 2 + this.y);
                }
            } else {
                // g.setColor(g.theme.dark ? "#666" : "#999");
                g.setColor("#f00"); // red is easier to distinguish from blue
                g.drawImage(WIDGETS.bluetooth_notify.icon, 2 + this.x, 2 + this.y);
            }
        }
    },

    // Check whether we should buzz: this is true when buzzing is not blocked by a previous buzz, and when the quiet mode setting permits it
    shouldBuzz: function () {
        return WIDGETS.bluetooth_notify.warningEnabled && !(require('Storage').readJSON('setting.json', 1) || {}).quiet;
    },

    // don't buzz for the next 30 seconds.
    blockBuzz: function () {
        WIDGETS.bluetooth_notify.warningEnabled = false;
        setTimeout(() => { WIDGETS.bluetooth_notify.warningEnabled = true; }, 30000);
    }
};

NRF.on('connect', function () {
    if (WIDGETS.bluetooth_notify.shouldBuzz() && WIDGETS.bluetooth_notify.settings.buzzOnConnect) {
        WIDGETS.bluetooth_notify.blockBuzz();
        Bangle.buzz(700, 1);
    }
    WIDGETS.bluetooth_notify.draw();
});

NRF.on('disconnect', function () {
    if (WIDGETS.bluetooth_notify.shouldBuzz() && WIDGETS.bluetooth_notify.settings.buzzOnLoss) {
        if (WIDGETS.bluetooth_notify.settings.lossDelay) {
            setTimeout(() => {
                if (!NRF.getSecurityStatus().connected) {
                    WIDGETS.bluetooth_notify.blockBuzz();
                    Bangle.buzz(700, 1);
                }
            }, 5000);
        } else {
            WIDGETS.bluetooth_notify.blockBuzz();
            Bangle.buzz(700, 1);
        }
    }

    WIDGETS.bluetooth_notify.draw();
});
