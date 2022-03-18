//The apps to launch. Include only the ID. Executable and icon file names will be determined from that.
//4 apps in the order of top left, top right, bottom left, bottom right
const APPS = ["stopwatch", "qalarm", "calculator", "dtlaunch"];

const Storage = require("Storage");

//Render the apps
g.clear();
for (let i = 0; i < 4; i++) {
    let app = APPS[i];
    let x = [0, 88, 0, 88][i];
    let y = [0, 0, 88, 88][i];
    appInfo = Storage.readJSON(app + ".info", 1);
    icon = Storage.read(appInfo.icon);
    g.drawImage(icon, x, y, { scale: 1.8333 });
}


// Button to go back to clock
setWatch(_ => load(), BTN1);

//Swipe to go back to clock
Bangle.on("swipe", _ => load());

//Launch an app on touch
Bangle.on("touch", function (button, xy) {
    let x = xy.x;
    let y = xy.y;

    if (x < g.getWidth() / 2 && y < g.getHeight() / 2) {
        load(APPS[0] + '.app.js');
    } else if (x >= g.getWidth() / 2 && y < g.getHeight() / 2) {
        load(APPS[1] + '.app.js');
    } else if (x < g.getWidth() / 2 && y >= g.getHeight() / 2) {
        load(APPS[2] + '.app.js');
    } else {
        load(APPS[3] + '.app.js');
    }
});