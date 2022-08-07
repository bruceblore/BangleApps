/**
 * How does this work?
 *
 * Every *boot.js file is executed everytime any app is loaded, including this one.
 *
 * We store a copy of Bangle.on() and override the main one with our own version. Our version can do one of two things:
 *    1. If the event type is not swipe, we pass the arguments to the original on() function
 *    2. If the event type is swipe, we store the function in our own array
 *
 * Then, we call unmodified Bangle.on('swipe') with our own function. When called, this function will call all of the funtions stored in our array. If there are no functions stored in our array, then it will call load()
 *
 * For the sake of completeness, we also need to implement a Bangle.removeListener() function which reverses our Bangle.on() function: pass through events other than swipe to the real Bangle.removeListener(), and remove a function from our list if the event is swipe. We also implement a similar removeAllListeners function
 *
 * Effectively, this allows applications to manage events as they usually do, but creates a "default" listener for swipe to load the clock that only gets called if the application never set a listener for swipe. From the perspective of the user, apps that use swipes can use their swipes, and apps that don't use swipes will have swipes go back to the clock.
 */

const AUTOSWP2CLK = {
  on: Bangle.on,                                  // Original, unmodified Bangle.on()
  removeListener: Bangle.removeListener,          // Original Bangle.removeListener()
  removeAllListeners: Bangle.removeAllListeners,  // Original Bangle.removeAllListeners()
  swipeHandlers: []                               // Array of swipe handlers
};

Bangle.on = (eventName, func) => {
  if (eventName == 'swipe') {
    AUTOSWP2CLK.swipeHandlers.push(func);
  } else {
    AUTOSWP2CLK.on(eventName, func);
  }
};

Bangle.removeListener = (eventName, func) => {
  if (eventName == 'swipe') {
    AUTOSWP2CLK.swipeHandlers.splice(AUTOSWP2CLK.swipeHandlers.indexOf(func), 1);
  } else {
    AUTOSWP2CLK.removeListener(eventName, func);
  }
};

Bangle.removeAllListeners = (eventName) => {
  if (eventName == 'swipe') {
    AUTOSWP2CLK.swipeHandlers = [];
  } else {
    AUTOSWP2CLK.removeAllListeners(eventName);
  }
};

// Using the old Bangle.on rather than the new one
AUTOSWP2CLK.on('swipe', (dirLR, dirUD) => {
  if (AUTOSWP2CLK.swipeHandlers.length == 0) {
    load();
  } else {
    for (let func of AUTOSWP2CLK.swipeHandlers) {
      func(dirLR, dirUD);
    }
  }
});