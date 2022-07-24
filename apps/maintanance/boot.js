// Run the maintanance routine and the optional interface if requested when the watch is plugged in

const storage = require('Storage');

Bangle.MAINTANANCE_CONFIG = Object.assign({
    runGPS: true,
    gpsTime: false,
    noLock: false,                  // Do not disable the screen lock timer
    blStayOn: true,                 // Disable the backlight timer
    compactInterval: 2592000000,    // 30 days
    lastCompact: 0,
    displayUI: true,                // Show a UI when charging
}, storage.readJSON('maintanance.json'));

Bangle.MAINTANANCE_USER_OPTIONS = Bangle.getOptions();

// GPS gets turned off and timeouts get reset on reset and therefore must be set up again if we are still charging
// If we want to set GPS time, set a handler
function onReset() {
    if (Bangle.isCharging()) {
        if (Bangle.MAINTANANCE_CONFIG.runGPS) {
            Bangle.setGPSPower(true, 'maintanance');
            if (Bangle.MAINTANANCE_CONFIG.gpsTime) {
                Bangle.on('GPS', fix => {
                    // Because the setTime function only takes the time to the nearest second, while the fix object provides the time to the nearest ms, we must wait for the next full second and then set the time to the fix time ceiled to the next full second.
                    setTimeout(() => {
                        setTime(Math.ceil(fix.time.getTime() / 1000));
                    }, 1000 - (fix.time.getTime() % 1000));
                })
            }
        }

        if (Bangle.MAINTANANCE_CONFIG.noLock) {
            Bangle.setOptions({ lockTimeout: 0 });
        }

        if (Bangle.MAINTANANCE_CONFIG.blStayOn) {
            Bangle.setOptions({ backlightTimeout: 0 });
        }

    } else {
        // Turn the GPS off when the watch is unplugged so we don't run down the battery
        Bangle.setGPSPower(false, 'maintanance');

        // Set the timeout options back to what they were, again to avoid running down the battery
        // Don't change the other options, in case something changed them in the background. We don't want to mess with more stuff than necessary
        Bangle.setOptions({
            lockTimout: Bangle.MAINTANANCE_USER_OPTIONS.lockTimeout,
            backlightTimeout: Bangle.MAINTANANCE_USER_OPTIONS.backlightTimeout
        });
    }
}

onReset();

Bangle.on('charging', charging => {
    onReset();

    if (charging && (((new Date()).getTime() - Bangle.MAINTANANCE_CONFIG.lastCompact) > Bangle.MAINTANANCE_CONFIG.compactInterval)) {
        E.showMessage('Compacting...');
        Bangle.MAINTANANCE_CONFIG.lastCompact = (new Date()).getTime();
        storage.writeJSON('maintanance.json', Bangle.MAINTANANCE_CONFIG);
    }

    if (Bangle.MAINTANANCE_CONFIG.displayUI) {
        load('maintanance.app.js');
    }
})