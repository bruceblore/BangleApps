const storage = require("Storage");
const heatshrink = require("heatshrink");

exports.STATE_PATH = "pomoplus.state.json"
exports.SETTINGS_PATH = "pomoplus.json"

exports.PHASE_WORKING = 0;
exports.PHASE_SHORT_BREAK = 1;
exports.PHASE_LONG_BREAK = 2;

exports.BUTTON_ICONS = {
    play: heatshrink.decompress(atob("jEYwMAkAGBnACBnwCBn+AAQPgAQPwAQP8AQP/AQXAAQPwAQP8AQP+AQgICBwQUCEAn4FggyBHAQ+CIgQ")),
    pause: heatshrink.decompress(atob("jEYwMA/4BBAX4CEA")),
    reset: heatshrink.decompress(atob("jEYwMA/4BB/+BAQPDAQPnAQIAKv///0///8j///EP//wAQQICBwQUCEhgyCHAQ+CIgI=")),
    skip: heatshrink.decompress(atob("jEYwMAwEIgHAhkA8EOgHwh8A/EPwH8h/A/0P8H/h/w/+P/H/5/8//v/3/AAoICBwQUCDQIgCEwQsCGQQ4CHwRECA"))
}

let settings = storage.readJSON(SETTINGS_PATH);
if (settings === undefined) {
    settings = {
        workTime: 1500000,                  //Work for 25 minutes
        shortBreak: 300000,                 //5 minute short break
        longBreak: 900000,                  //15 minute long break
        numShortBreaks: 3,                  //3 short breaks for every long break
        pausedTimerExpireTime: 21600000,    //If the timer was left paused for >6 hours, reset it on next launch
        widget: false                       //If a widget is added in the future, whether the user wants it
    }
}
exports.settings = settings;

//Store the minimal amount of information to be able to reconstruct the state of the timer at any given time.
//This is necessary because it is necessary to write to flash to let the timer run in the background, so minimizing the writes is necessary.
exports.STATE_DEFAULT = {
    wasRunning: false,      //If the timer ever was running. Used to determine whether to display a reset button
    running: false,         //Whether the timer is currently running
    startTime: 0,           //When the timer was last started. Difference between this and now is how long timer has run continuously.
    pausedTime: 0,          //When the timer was last paused. Used for expiration and displaying timer while paused.
    elapsedTime: 0          //How much time the timer had spent running before the current start time. Update on pause or user skipping stages.
}
let state = storage.readJSON(STATE_PATH);
if (state === undefined) {
    state = STATE_DEFAULT
}
exports.state = state

//Given a timer state, generate a snapshot, which contains all of the information one would normally expect in the state.
exports.getSnapshot = function (state) {
    //Calculate how long the timer has been running overall
    if (state.running) var totalRunningTime = (new Date()).getTime() - state.startTime + state.elapsedTime;
    else var totalRunningTime = pausedTime - state.startTime + state.elapsedTime;

    //Calculate how long the timer has been running in the current cycle
    let timeBeforeLongBreak = (settings.workTime + shortBreakTime) * settings.numShortBreaks;
    let fullCycleTime = timeBeforeLongBreak + settings.longBreak;
    let timeInCycle = totalRunningTime % fullCycleTime;

    if (timeInCycle < timeBeforeLongBreak) {
        //I have decided to call the work / short break cycles "subcycles", while the overall cycle involves some number of subcycles and a long break.
        let timeInSubCycle = timeInCycle % settings.numShortBreaks;
        var currentPhase = timeInSubCycle < settings.workTime ? exports.PHASE_WORKING : exports.PHASE_SHORT_BREAK;
        var numShortBreaks = timeInCycle / settings.numShortBreaks;

        //The change time is the amount of time left plus the current time.
        if (currentPhase == exports.PHASE_WORKING) var nextChangeTime = (settings.workTime - timeInSubCycle) + (new Date()).getTime()
        else var nextChangeTime = (settings.shortBreak - (timeInSubCycle - settings.workTime)) + (new Date()).getTime()

    } else {
        var nextChangeTime = (settimgs.longBreak - (timeInCycle - timeBeforeLongBreak)) + (new Date()).getTime();
        var currentPhase = exports.PHASE_LONG_BREAK;
        var numShortBreaks = settings.numShortBreaks;
    }

    return {
        nextChangeTime: nextChangeTime, //Epoch time of when the phase will change next
        currentPhase: currentPhase,     //What phase we are in now: work, short break, or long break
        numShortBreaks: numShortBreaks  //How many short breaks have we had since the last long break?
    }
}

exports.vibrate = function (snapshot) {
    //Vibrate for the next phase.
    if (snapshot.currentPhase == PHASE_WORKING) {
        if (snapshot.numShortBreaks < exports.settings.numShortBreaks) {
            Bangle.buzz();
            setTimeout(Bangle.buzz, 400);
        } else {
            Bangle.buzz();
            setTimeout(Bangle.buzz, 400);
            setTimeout(Bangle.buzz, 600);
        }
    } else Bangle.buzz(750, 1);
}

//Clean up after ourselves, as this code may be run on every boot and therefore has the potential to pollute the global scope for other apps.
delete settings;
delete state;
delete storage;