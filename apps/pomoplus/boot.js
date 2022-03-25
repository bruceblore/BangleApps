let POMOPLUS_common = require("pomoplus-com.js");
let POMOPLUS_lastPhase;

function setNextTimeout() {
    let snapshot = POMOPLUS_common.getSnapshot(POMOPLUS_common.state);
    POMOPLUS_lastPhase = snapshot.currentPhase;
    setTimeout(() => {
        POMOPLUS_common.vibrate(snapshot);
        setNextTimeout();
    }, snapshot.nextChangeTime - (new Date()).getTime());
}

//Make sure that the pomoplus app isn't in the foreground. The pomoplus app handles the vibrations when it is in the foreground in order to avoid having to reload every time the user changes state. That means that when the app is in the foreground, we shouldn't do anything here.
if (Bangle.POMOPLUS_ACTIVE !== undefined) {
    setNextTimeout();
}