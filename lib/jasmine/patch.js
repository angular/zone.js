'use strict';
// Patch jasmine's it and fit functions so that spec excutes in the root zone with a drained
// microtask queue

function apply() {
  if (!global.zone) {
    throw new Error('zone.js does not seem to be installed');
  }

  if (!global.zone.isRootZone()) {
    throw new Error('The jasmine patch should be called from the root zone');
  }

  var jasmineZone = global.zone;
  var originalIt = global.it;
  var originalFit = global.fit;

  global.it = function zoneResettingIt(description, specFn) {
    originalIt(description, function (done) {
      var jasmineThis = this;
      // Wrap the spec in a set timeout so that the microtasks queue is drained before the test runs.
      setTimeout(function() {
        jasmineZone.run(specFn, jasmineThis, [done]);
        if (specFn.length == 0) {
          // Need to manually call done() when the test is sync due to the setTimeout
          done();
        }
      }, 0);
    });
  };

  global.fit = function zoneResettingFit(description, specFn) {
    originalFit(description, function (done) {
      var jasmineThis = this;
      // Wrap the spec in a set timeout so that the microtasks queue is drained before the test runs.
      setTimeout(function() {
        jasmineZone.run(specFn, jasmineThis, [done]);
        if (specFn.length == 0) {
          // Need to manually call done() when the test is sync due to the setTimeout
          done();
        }
      }, 0);
    });
  };
}

if (global.jasmine) {
  module.exports = {
    apply: apply
  };
} else {
  module.exports = {
    apply: function() { }
  };
}
