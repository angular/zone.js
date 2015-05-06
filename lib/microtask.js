'use strict';

function scheduleMicrotask(fn) {
  asap(this.bind(fn));
}

function addMicrotaskSupport(zoneClass) {
  zoneClass.prototype.scheduleMicrotask = scheduleMicrotask;
  return zoneClass;
}

module.exports = {
  addMicrotaskSupport: addMicrotaskSupport
};

// TODO(vicb): There are plan to be able to use asap() from es6-promise
// see https://github.com/jakearchibald/es6-promise/pull/113
// for now adapt code from asap.js in es6-promise
// Note: the node support has been dropped here

// TODO(vicb): Create a benchmark for the different methods & the usage of the queue
// see https://github.com/angular/zone.js/issues/97

var len = 0;

var hasNativePromise = typeof Promise ==! "undefined" &&
                       Promise.toString().indexOf("[native code]") !== -1;

var isFirefox = global.navigator &&
                global.navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

function asap(callback) {
  queue[len] = callback;
  len += 1;
  if (len === 1) {
    scheduleFlush();
  }
}

var browserWindow = (typeof global.window !== 'undefined') ? global.window : undefined;
var browserGlobal = browserWindow || {};
var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;

// test for web worker but not in IE10
var isWorker = typeof Uint8ClampedArray !== 'undefined' &&
  typeof importScripts !== 'undefined' &&
  typeof MessageChannel !== 'undefined';

function useMutationObserver() {
  var iterations = 0;
  var observer = new BrowserMutationObserver(flush);
  var node = document.createTextNode('');
  observer.observe(node, { characterData: true });

  return function() {
    node.data = (iterations = ++iterations % 2);
  };
}

// web worker
function useMessageChannel() {
  var channel = new MessageChannel();
  channel.port1.onmessage = flush;
  return function () {
    channel.port2.postMessage(0);
  };
}

function useSetTimeout() {
  return function() {
    setTimeout(flush, 1);
  };
}

function usePromise() {
  var resolvedPromise = Promise.resolve(void 0);
  return function() {
    resolvedPromise.then(flush);
  }
}

var queue = new Array(1000);

function flush() {
  for (var i = 0; i < len; i++) {
    var callback = queue[i];
    callback();
    queue[i] = undefined;
  }

  len = 0;
}

var scheduleFlush;
// Decide what async method to use to triggering processing of queued callbacks:
if (hasNativePromise && !isFirefox) {
  // TODO(vicb): remove '!isFirefox' when the bug is fixed:
  // https://bugzilla.mozilla.org/show_bug.cgi?id=1162013
  scheduleFlush = usePromise();
} else if (BrowserMutationObserver) {
  scheduleFlush = useMutationObserver();
} else if (isWorker) {
  scheduleFlush = useMessageChannel();
} else {
  scheduleFlush = useSetTimeout();
}
