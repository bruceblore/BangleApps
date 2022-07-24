(function (back) {
    const storage = require('Storage');
    const SETTINGS_FILE = 'maintanance.json';

    const COMPACT_INTERVALS = [
        0,          // Always
        1800000,    // 30 minutes
        3600000,    // 1 hour
        86400000,   // 1 day
        172800000,  // 2 days
        259200000,  // 3 days
        345600000,  // 4 days
        432000000,  // 5 days
        518400000,  // 6 days
        604800000,  // 1 week
        1209600000, // 2 weeks
        1814400000, // 3 weeks
        2592000000, // 30 days
        5184000000, // 60 days
        7776000000, // 90 days
        Infinity    // Never
    ]

    let config = Object.assign({
        runGPS: true,                   // If true, run the GPS
        gpsTime: false,                 // If true, set the time from the GPS
        noLock: false,                  // If true, keep the screen unlocked
        blStayOn: true,                 // If true, keep the backlight on
        compactInterval: 2592000000,    // How often to compact storage (30 days by default)
        lastCompact: 0,                 // When the last compact was
        displayUI: true,                // Show a UI when charging
    }, storage.readJSON(SETTINGS_FILE));

    function saveSettings() {
        storage.writeJSON(SETTINGS_FILE, config);
    }

    function showMainMenu() {
        E.showMenu({
            '': {
                'title': 'Maintanance',
                'back': back
            },

            'Run the GPS': {
                value: config.runGPS,
                onChange: value => {
                    config.runGPS = value;
                    saveSettings();
                }
            },
            'Set time with GPS (if enabled)': {
                value: config.gpsTime,
                onchange: value => {
                    config.gpsTime = value;
                    saveSettings();
                }
            },
            'Keep unlocked': {
                value: config.noLock,
                onchange: value => {
                    config.noLock = value;
                    saveSettings();
                }
            },
            'Keep backlight on': {
                value: config.blStayOn,
                onchange: value => {
                    config.blStayOn = value;
                    saveSettings();
                }
            },
            'Compact interval': {
                value: COMPACT_INTERVALS.indexOf(config.compactInterval),
                format: value => {
                    if (COMPACT_INTERVALS[value] == 0) return 'Always';
                    else if (COMPACT_INTERVALS[value] == Infinity) return 'Never';

                    else if (COMPACT_INTERVALS[value] < 60000) return `${Math.round(COMPACT_INTERVALS[value] / 1000)} seconds`;
                    else if (COMPACT_INTERVALS[value] < 3600000) return `${Math.round(COMPACT_INTERVALS[value] / 60000)} minutes`;
                    else if (COMPACT_INTERVALS[value] < 86400000) return `${Math.round(COMPACT_INTERVALS[value] / 3600000)} minutes`;
                    else {
                        days = Math.round(COMPACT_INTERVALS[value] / 86400000);
                        if (days % 7 == 0) return `${days / 7} weeks`;
                        else return `${days} days`;
                    }
                },
                min: 0,
                max: COMPACT_INTERVALS.length - 1,
                wrap: true,
                onchange: value => {
                    config.compactInterval = COMPACT_INTERVALS[value];
                    saveSettings();
                }
            },
            'Compact on next charge (if interval != never)': () => {
                config.lastCompact = 0;
                saveSettings();
            },
            'Display UI': {
                value: config.displayUI,
                onchange: value => {
                    config.displayUI = value;
                    saveSettings();
                }
            }
        });
    }

    showMainMenu();
});