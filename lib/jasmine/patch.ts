'use strict';
// Patch jasmine's it and fit functions so that the `done` callback always resets the zone
// to the jasmine zone, which should be the root zone. (angular/zone.js#91)

export function apply() {
  if (!global.zone) {
    throw new Error('zone.js does not seem to be installed');
  }

  if (!global.zone.isRootZone()) {
    throw new Error('The jasmine patch should be called from the root zone');
  }

  // When you have in async test (test with `done` argument) jasmine will
  // execute the next test synchronously in the done handle. This makes sense
  // for most tests, but now with zones. With zones running next test
  // synchronously means that the current zone does not get cleared. This
  // results in a chain of nested zones, which makes it hard to reason about
  // it. We override the `clearStack` method which forces jasmine to always
  // drain the stack before next test gets executed.
  (<any>jasmine).QueueRunner = (function (SuperQueueRunner) {
    // Subclass the `QueueRunner` and override the `clearStack` mothed.

    function alwaysClearStack(fn) {
      global.zone.setTimeoutUnpatched(fn, 0);
    }

    function QueueRunner(options) {
      options.clearStack = alwaysClearStack;
      SuperQueueRunner.call(this, options);
    }
    QueueRunner.prototype = SuperQueueRunner.prototype;
    return QueueRunner;
  })((<any>jasmine).QueueRunner);

}

if ((<any>global).jasmine) {
  module.exports = {
    apply: apply
  };
} else {
  module.exports = {
    apply: function() { }
  };
}
