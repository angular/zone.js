'use strict';

// run() call depth
var nestedRun = 0;
// Pending microtasks
var microtaskQueue = [];
// Whether we are currently draining the microtask queue
var drainingMicrotasks = false;

function scheduleMicrotask(fn) {
  microtaskQueue.push(fn);
}

function beforeTask() {
  nestedRun++;
}

function afterTask() {
  nestedRun--;
  // Check if there are microtasks to execute unless:
  // - we are already executing them (drainingMicrotasks is true),
  // - we are in a recursive call to run (nesetdRun > 0)
  if (!drainingMicrotasks && nestedRun == 0) {
    this.runMicrotasks();
  }
}

function runMicrotasks() {
  drainingMicrotasks = true;
  do {
    // Drain the microtask queue
    while (microtaskQueue.length > 0) {
      var microtask = microtaskQueue.shift();
      microtask();
    }
    this.afterTurn();
    // Check the queue length again as afterTurn might have enqueued more microtasks
  } while (microtaskQueue.length > 0)
  drainingMicrotasks = false;
}

function addMicrotaskSupport(zoneClass) {
  zoneClass.prototype.beforeTask = beforeTask;
  zoneClass.prototype.afterTask = afterTask;
  zoneClass.prototype.runMicrotasks = runMicrotasks;
  zoneClass.prototype.afterTurn = function() {};
  zoneClass.scheduleMicrotask = scheduleMicrotask;
  return zoneClass;
}

module.exports = {
  addMicrotaskSupport: addMicrotaskSupport
};
