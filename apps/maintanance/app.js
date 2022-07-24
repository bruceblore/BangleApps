// Provide the optional interface to display during charging

const locale = require('locale')

// Display the GPS status
function handleGPS(fix) {
    let text;

    if (!Bangle.MAINTANANCE_CONFIG.runGPS) text = '';                // If the GPS should not be used, don't display anything

    // Below this point, it is assumed that the GPS is configured to be used

    else if (fix == undefined) text = '!!! GPS OFF !!!';             // If the GPS should be used but is off, this is an error condition. It should not be possible.
    else if (fix.fix == 0) text = `No fix (${fix.satellites} sats)`; // If there is no fix, indicate so

    // Below this point, it is assumed that there is a fix

    else if (Bangle.MAINTANANCE_CONFIG.gpsTime) {
        if (fix.time == undefined) text = `No time (${fix.satellites} sats)`;
        else text = `Time set (${fix.satellites} sats)`;
    } else text = `GPS fix (${fix.satellites} sats)`;

    g.reset().setFont('Vector', 24).setAlign(0, -1).drawString(text, 88, 24);
}

handleGPS(Bangle.getGPSFix());
Bangle.on('GPS', handleGPS);

// Display the status line and full screen battery bar
function statusAndBattBar() {
    g.reset().setFont('Vector', 24).setAlign(-1, -1).drawString(`${E.getBattery()}% ${locale.time(new Date())}`, 0, 152);

    if (E.getBattery() == 100) {
        g.setColor(0, 1, 0);
    } else {
        g.setColor(1, 0, 0);
    }

    g.fillRect(0, 48, 176 * E.getBattery() / 100, 152);
}

setTimeout(() => {
    setInterval(statusAndBattBar, 1000);
    statusAndBattBar();
}, 1000 - ((new Date()).getTime() % 1000));
statusAndBattBar();

// Exit the UI on interaction or unplug
Bangle.on('charging', charging => {
    if (!charging) load();
});
Bangle.on('touch', (button, xy) => { load(); });
Bangle.on('swipe', (dirLR, dirUD) => { load(); });

Bangle.loadWidgets();
Bangle.drawWidgets();