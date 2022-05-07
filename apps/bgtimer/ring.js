const common = require('bgtimer-com.js');

Bangle.loadWidgets()
Bangle.drawWidgets()

setInterval(() => { Bangle.buzz(200) }, 400);
Bangle.buzz(200);

function stopTimer() {
    common.state.wasRunning = false;
    common.state.running = false;
    require("Storage").writeJSON(common.STATE_PATH, common.state);
}

E.showAlert("Timer expired!").then(() => {
    stopTimer();
    load();
});
E.on('kill', stopTimer);