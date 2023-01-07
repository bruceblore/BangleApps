(function (back) {
    const CONFIG_FILE = "rpnsci.json";
    const storage = require('Storage');

    let config = storage.readJSON(CONFIG_FILE) || {
        saveState: false,
        x: '0',
        y: 0,
        z: 0,
        t: 0,
        mode: 'number',
        entryTerminated: false,
        liftOnNumberPress: false,
        memory: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    }

    E.showMenu({
        '': {
            'title': 'RPN Scientific calculator',
            'back': back
        },
        'Save state on close': {
            value: config.saveState,
            onchange: value => {
                config.saveState = value;
                storage.writeJSON(CONFIG_FILE, config);
            }
        }
    });
});