Bangle.POMOPLUS_ACTIVE = true;  //Prevent the boot code from running. To avoid having to reload on every interaction, we'll control the vibrations from here when the user is in the app.

const storage = require("Storage");
const common = require("pomoplus-com.js");

//Expire the state if necessary
if (
  !common.state.running &&
  (new Date()).getTime() - common.state.pausedTime > common.settings.pausedTimerExpireTime * 1000
) {
  common.state = common.STATE_DEFAULT;
}

function drawButtons() {
  //Draw the backdrop
  const BAR_TOP = g.getHeight() - 24;
  g.setColor(0, 0, 1).setFontAlign(0, -1)
    .fillRect(0, BAR_TOP, g.getWidth(), g.getHeight())
    .setColor(1, 1, 1);

  if (!common.state.wasRunning) {  //If the timer was never started, only show a play button
    g.drawImage(common.BUTTON_ICONS.play, g.getWidth() / 2, BAR_TOP);
  } else {
    g.drawLine(g.getWidth() / 2, BAR_TOP, g.getWidth() / 2, g.getHeight());
    if (common.state.running) {
      g.drawImage(common.BUTTON_ICONS.pause, g.getWidth() / 4, BAR_TOP)
        .drawImage(common.BUTTON_ICONS.skip, g.getWidth() * 3 / 4, BAR_TOP);
    } else {
      g.drawImage(common.BUTTON_ICONS.reset, g.getWidth() / 4, BAR_TOP)
        .drawImage(common.BUTTON_ICONS.play, g.getWidth() * 3 / 4, BAR_TOP);
    }
  }
}

function drawTimerAndMessage() {
  let timeLeft;
  if (!common.state.wasRunning) {
    timeLeft = common.settings.workTime;
  } else if (common.state.running) {
    timeLeft = snapshot.nextChangeTime - (new Date()).getTime();
  } else {
    timeLeft = snapshot.nextChangeTime - common.state.pausedTime;
  }

  g.setColor(0, 0, 0)
    .setFontAlign(0, 0)
    .setFont("Vector", 36)

    //Draw the timer
    .drawString((() => {
      let hours = timeLeft / 3600000;
      let minutes = (timeLeft % 3600000) / 60000;
      let seconds = (timeLeft % 60000) / 1000;

      if (hours > 0) return `${parseInt(hours)}:${parseInt(minutes)}:${parseInt(seconds)}`;
      else return `${parseInt(minutes)}:${parseInt(seconds)}`;
    })(), g.getWidth() / 2, g.getHeight() / 2)

    //Draw the phase label
    .drawString(((currentPhase, numShortBreaks) => {
      if (!common.state.wasRunning) return "Not started";
      else if (currentPhase == common.PHASE_LONG_BREAK) return "Long break!";
      else return `${currentPhase == common.PHASE_WORKING ? "Work" : "Short break"} ${numShortBreaks + 1}/${common.settings.numShortBreaks}`;
    })(snapshot.currentPhase, snapshot.numShortBreaks),
      g.getWidth() / 2, g.getHeight() / 2 + 18);

  //Perform vibrations and update the snapshot if needed
  if (timeLeft <= 0) {
    common.vibrate(snapshot);
    snapshot = common.getSnapshot(common.state);
  }
}

drawButtons();
Bangle.on("touch", (button, xy) => {
  //If we support full touch and we're not touching the keys, ignore.
  //If we don't support full touch, we can't tell so just assume we are.
  if (xy !== undefined && xy.y <= g.getHeight() - 24) return;

  if (!common.state.wasRunning) {
    //If we were never running, there is only one button: the start button
    common.state.wasRunning = true;
    common.state.running = true;
    snapshot = common.getSnapshot();
    setupTimerInterval();
  } else if (common.state.running) {
    //If we are running, there are two buttons: pause and skip
    if (button == 1) {
      //Record the exact moment that we paused, and the current elapsed time
      let now = (new Date()).getTime();
      common.state.pausedTime = now;
      common.state.elapsedTime += now - common.state.startTime;

      //Stop the timer
      common.state.running = false;
      snapshot = common.getSnapshot(common.state);
      clearInterval(timerInterval);
      timerInterval = undefined;
      drawTimerAndMessage();
    } else {
      //Skip ahead by figuring out how much time until the next phase transition, then add that to the elpsed time
      let now = (new Date()).getTime();
      let timeLeft = snapshot.nextChangeTime - now;
      common.state.elapsedTime += timeLeft;
      snapshot = common.getSnapshot(common.state);
      drawTimerAndMessage();
      setupTimerInterval();
    }
  } else {
    //If we are stopped, there are two buttons: Reset and continue
    if (button == 1) {
      //Reset the timer
      common.state = common.STATE_DEFAULT;
      drawTimerAndMessage();
      clearInterval(timerInterval);
      timerInterval = undefined;
    } else {
      //Start the timer and record when we started
      common.state.startTime = (new Date()).getTime();
      common.state.running = true;
      snapshot = common.getSnapshot(common.state);
      drawTimerAndMessage();
      setupTimerInterval();
    }
  }
});

let snapshot = common.getSnapshot(common.state);
let timerInterval;

function setupTimerInterval() {
  if (timerInterval !== undefined) {
    clearInterval(timerInterval);
  }
  setTimeout(() => {
    timerInterval = setInterval(drawTimerAndMessage, 1000);
    drawTimerAndMessage();
  }, 1000 - ((snapshot.nextChangeTimer - (new Date()).getTime()) % 1000));
}
drawTimerAndMessage();

//Save our state when the app is closed
E.on('kill', () => {
  storage.writeJSON(common.STATE_PATH, common.state);
});