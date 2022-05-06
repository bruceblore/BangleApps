const storage = require("Storage");
const heatshrink = require("heatshrink");
const STATE_PATH = "stlap.state.json";
g.setFont("Vector", 24)
const BUTTON_ICONS = {
  play: heatshrink.decompress(atob("jEYwMAkAGBnACBnwCBn+AAQPgAQPwAQP8AQP/AQXAAQPwAQP8AQP+AQgICBwQUCEAn4FggyBHAQ+CIgQ")),
  pause: heatshrink.decompress(atob("jEYwMA/4BBAX4CEA")),
  reset: heatshrink.decompress(atob("jEYwMA/4BB/+BAQPDAQPnAQIAKv///0///8j///EP//wAQQICBwQUCEhgyCHAQ+CIgI="))
};

let state = storage.readJSON(STATE_PATH);
const STATE_DEFAULT = {
  wasRunning: false,              //If the stopwatch was ever running since being reset
  sessionStart: 0,                //When the stopwatch was first started
  running: false,                 //Whether the stopwatch is currently running
  startTime: 0,                   //When the stopwatch was last started.
  pausedTime: 0,                  //When the stopwatch was last paused.
  elapsedTime: 0                  //How much time was spent running before the current start time. Update on pause.
};
if (!state) {
  state = STATE_DEFAULT
}

let lapFile;
let lapHistory;
if (state.wasRunning) {
  lapFile = 'stlap-' + state.sessionStart + '.json';
  lapHistory = storage.readJSON(lapFile)
  if (!lapHistory) {
    lapHistory = {
      final: false, //Whether the stopwatch has been reset. It is expected that the stopwatch app will create a final split when reset. If this is false, it is expected that this hasn't been done, and that the current time should be used as the "final split"
      splits: []  //List of times when the Lap button was pressed
    }
  }
} else {
  lapHistory = {
    final: false, //Whether the stopwatch has been reset. It is expected that the stopwatch app will create a final split when reset. If this is false, it is expected that this hasn't been done, and that the current time should be used as the "final split"
    splits: []  //List of times when the Lap button was pressed
  }
}

//Get the number of milliseconds that stopwatch has run for
function getTime() {
  if (!state.wasRunning) {
    //If the timer never ran, zero ms have passed
    return 0;
  } else if (state.running) {
    //If the timer is running, the time left is current time - start time + preexisting time
    return (new Date()).getTime() - state.startTime + state.elapsedTime;
  } else {
    //If the timer is not running, the same as above but use when the timer was paused instead of now.
    return state.pausedTime - state.startTime + state.elapsedTime;
  }
}

let gestureMode = false;

function drawButtons() {
  //Draw the backdrop
  const BAR_TOP = g.getHeight() - 48;
  g.setColor(0, 0, 1).setFontAlign(0, -1)
    .clearRect(0, BAR_TOP, g.getWidth(), g.getHeight())
    .fillRect(0, BAR_TOP, g.getWidth(), g.getHeight())
    .setColor(1, 1, 1);

  if (!state.wasRunning) {  //If the timer was never started, only show a play button
    g.drawImage(BUTTON_ICONS.play, g.getWidth() / 2, BAR_TOP + 12);
  } else {
    g.drawLine(g.getWidth() / 2, BAR_TOP, g.getWidth() / 2, g.getHeight());
    if (state.running) {
      g.setFont("Vector", 24)
        .drawString("LAP", g.getWidth() / 4, BAR_TOP + 12)
        .drawImage(BUTTON_ICONS.pause, g.getWidth() * 3 / 4, BAR_TOP + 12);
    } else {
      g.drawImage(BUTTON_ICONS.reset, g.getWidth() / 4, BAR_TOP + 12)
        .drawImage(BUTTON_ICONS.play, g.getWidth() * 3 / 4, BAR_TOP + 12);
    }
  }
}

function drawTime() {
  function pad(number) {
    return ('00' + parseInt(number)).slice(-2);
  }

  let time = getTime();
  g.setColor(0, 0, 0)
    .setFontAlign(0, 0)
    .setFont("Vector", 36)
    .clearRect(0, 24, g.getWidth(), g.getHeight() - 48)

    //Draw the time
    .drawString((() => {
      let hours = Math.floor(time / 3600000);
      let minutes = Math.floor((time % 3600000) / 60000);
      let seconds = Math.floor((time % 60000) / 1000);
      let hundredths = Math.floor((time % 1000) / 10);

      if (hours >= 1) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
      else return `${minutes}:${pad(seconds)}:${pad(hundredths)}`;
    })(), g.getWidth() / 2, g.getHeight() / 2)

  //Draw the lap labels if necessary
  if (lapHistory.splits.length >= 1) {
    let lastLap = lapHistory.splits.length;
    let curLap = lastLap + 1;

    g.setFont("Vector", 12)
      .drawString((() => {
        let lapTime = time - lapHistory.splits[lastLap - 1];
        let hours = Math.floor(lapTime / 3600000);
        let minutes = Math.floor((lapTime % 3600000) / 60000);
        let seconds = Math.floor((lapTime % 60000) / 1000);
        let hundredths = Math.floor((lapTime % 1000) / 10);

        if (hours == 0) return `Lap ${curLap}: ${pad(minutes)}:${pad(seconds)}:${pad(hundredths)}`;
        else return `Lap ${curLap}: ${hours}:${pad(minutes)}:${pad(seconds)}:${pad(hundredths)}`;
      })(), g.getWidth() / 2, g.getHeight() / 2 + 18)
      .drawString((() => {
        let lapTime
        if (lastLap == 1) lapTime = lapHistory.splits[lastLap - 1];
        else lapTime = lapHistory.splits[lastLap - 1] - lapHistory.splits[lastLap - 2];
        let hours = Math.floor(lapTime / 3600000);
        let minutes = Math.floor((lapTime % 3600000) / 60000);
        let seconds = Math.floor((lapTime % 60000) / 1000);
        let hundredths = Math.floor((lapTime % 1000) / 10);

        if (hours == 0) return `Lap ${lastLap}: ${pad(minutes)}:${pad(seconds)}:${pad(hundredths)}`;
        else return `Lap ${lastLap}: ${hours}:${pad(minutes)}:${pad(seconds)}:${pad(hundredths)}`;
      })(), g.getWidth() / 2, g.getHeight() / 2 + 30);
  }
}

drawButtons();
Bangle.on("touch", (button, xy) => {
  //If we support full touch and we're not touching the keys, ignore.
  //If we don't support full touch, we can't tell so just assume we are.
  if (xy !== undefined && xy.y <= g.getHeight() - 48) return;

  //In gesture mode, just turn on the light and then return
  if (gestureMode) {
    Bangle.setLCDPower(true);
    return;
  }

  let now = (new Date()).getTime();
  let time = getTime();

  if (!state.wasRunning) {
    //If we were never running, there is only one button: the start button
    state = {
      wasRunning: true,
      sessionStart: Math.floor(now),
      running: true,
      startTime: now,
      pausedTime: 0,
      elapsedTime: 0,
    };
    lapFile = 'stlap-' + state.sessionStart + '.json';
    setupTimerInterval();
    Bangle.buzz(200);
    drawButtons();

  } else if (state.running) {
    //If we are running, there are two buttons: lap and pause
    if (button == 1) {
      lapHistory.splits.push(time);
      Bangle.buzz();
    } else {
      //Record the exact moment that we paused
      state.pausedTime = now;

      //Stop the timer
      state.running = false;
      stopTimerInterval();
      Bangle.buzz(200);
      drawTime();
      drawButtons();
    }

  } else {
    //If we are stopped, there are two buttons: reset and continue
    if (button == 1) {
      //Record the time
      lapHistory.splits.push(time);
      lapHistory.final = true;
      storage.writeJSON(lapFile, lapHistory);

      //Reset the timer
      state = STATE_DEFAULT;
      lapHistory = {
        final: false,
        splits: []
      };
      Bangle.buzz(500);
      drawTime();
      drawButtons();

    } else {
      //Start the timer and record when we started
      state.elapsedTime += (state.pausedTime - state.startTime);
      state.startTime = now;
      state.running = true;
      setupTimerInterval();
      Bangle.buzz(200);
      drawTime();
      drawButtons();
    }
  }
});

let timerInterval;

function setupTimerInterval() {
  if (timerInterval !== undefined) {
    clearInterval(timerInterval);
  }
  timerInterval = setInterval(drawTime, 10);
}

function stopTimerInterval() {
  if (timerInterval !== undefined) {
    clearInterval(timerInterval);
    timerInterval = undefined;
  }
}

drawTime();
if (state.running) {
  setupTimerInterval();
}

//Save our state when the app is closed
E.on('kill', () => {
  storage.writeJSON(STATE_PATH, state);
  if (state.wasRunning) {
    storage.writeJSON(lapFile, lapHistory);
  }
});

Bangle.loadWidgets();
Bangle.drawWidgets();