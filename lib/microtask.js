'use strict';

// TODO(vicb) asap implementation should work if Promise is not available
// es6-promise has fallbacks

if (typeof Promise === "undefined" || Promise.toString().indexOf("[native code]") === -1) {
  throw new Error('Promise is not available natively !')
}

var resolvedPromise = Promise.resolve(void 0);

function asap(fn) {
  resolvedPromise.then(fn);
}

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
