Bangle.POMOPLUS_ACTIVE = true;  //Prevent the boot code from running. To avoid having to reload on every interaction, we'll control the vibrations from here when the user is in the app.

const storage = require("Storage");
const graphics = require("Graphics");
const common = require("pomoplus-com.js")

//Expire the state if necessary
if (
  !common.state.running &&
  (new Date()).getTime() - common.state.pausedTime > common.settings.pausedTimerExpireTime * 1000
) {
  common.state = common.STATE_DEFAULT;
}

function drawButtons() {
  //Draw the backdrop
  const BAR_TOP = graphics.getHeight() - 24;
  graphics.setColor(0, 0, 1).setAlign(0, -1)
    .fillRect(0, BAR_TOP, graphics.getWidth(), graphics.getHeight())
    .setColor(1, 1, 1);

  if (!common.state.wasRunning) {  //If the timer was never started, only show a play button
    graphics.drawImage(common.BUTTON_ICONS.play, graphics.getWidth() / 2, BAR_TOP);
  } else {
    graphics.drawLine(graphics.getWidth() / 2, BAR_TOP, graphics.getWidth() / 2, graphics.getHeight());
    if (common.state.running) {
      graphics.drawImage(common.BUTTON_ICONS.pause, graphics.getWidth() / 4, BAR_TOP)
        .drawImage(common.BUTTON_ICONS.skip, graphics.getWidth() * 3 / 4, BAR_TOP);
    } else {
      graphics.drawImage(common.BUTTON_ICONS.reset, graphics.getWidth() / 4, BAR_TOP)
        .drawImage(common.BUTTON_ICONS.play, graphics.getWidth() * 3 / 4, BAR_TOP);
    }
  }
}

function drawTimerAndMessage() {
  if (!common.state.wasRunning) {
    var timeLeft = common.settings.workTime;
  } else if (common.state.running) {
    var timeLeft = snapshot.nextChangeTime - (new Date()).getTime();
  } else {
    var timeLeft = snapshot.nextChangeTime - common.state.pausedTime;
  }

  graphics.setColor(0, 0, 0)
    .setAlign(0, 0)
    .setFont("Vector", 36)

    //Draw the timer
    .drawString((() => {
      let hours = timeLeft / 3600000;
      let minutes = (timeLeft % 3600000) / 60000;
      let seconds = (timeLeft % 60000) / 1000;

      if (hours > 0) return `${parseInt(hours)}:${parseInt(minutes)}:${parseInt(seconds)}`;
      else return `${parseInt(minutes)}:${parseInt(seconds)}`
    })(), graphics.getWidth() / 2, graphics.getHeight() / 2)

    //Draw the phase label
    .drawString(((currentPhase, numShortBreaks) => {
      if (!common.state.wasRunning) return "Not started"
      else if (currentPhase == common.PHASE_LONG_BREAK) return "Long break!";
      else return `${currentPhase == common.PHASE_WORKING ? "Work" : "Short break"} ${numShortBreaks + 1}/${common.settings.numShortBreaks}`;
    })(snapshot.currentPhase, snapshot.numShortBreaks),
      graphics.getWidth() / 2, graphics.getHeight() / 2 + 18);

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
  if (xy !== undefined && xy.y <= graphics.getHeight() - 24) return;

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
    timerInterval = setInterval(drawTimerAndMessage, 1000)
    drawTimerAndMessage();
  }, 1000 - ((snapshot.nextChangeTimer - (new Date()).getTime()) % 1000));
}
drawTimerAndMessage();

//Save our state when the app is closed
E.on('kill', () => {
  storage.writeJSON(common.STATE_PATH, common.state);
});