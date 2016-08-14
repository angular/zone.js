'use strict';
// Patch jasmine's it and fit functions so that the `done` wrapCallback always resets the zone
// to the jasmine zone, which should be the root zone. (angular/zone.js#91)
if (!Zone) {
  throw new Error('zone.js does not seem to be installed');
}
// When you have in async test (test with `done` argument) jasmine will
// execute the next test synchronously in the done handler. This makes sense
// for most tests, but now with zones. With zones running next test
// synchronously means that the current zone does not get cleared. This
// results in a chain of nested zones, which makes it hard to reason about
// it. We override the `clearStack` method which forces jasmine to always
// drain the stack before next test gets executed.
(<any>jasmine).QueueRunner = (function (SuperQueueRunner) {
  const originalZone = Zone.current;
  // Subclass the `QueueRunner` and override the `clearStack` method.

  function alwaysClearStack(fn) {
    const zone: Zone = Zone.current.getZoneWith('JasmineClearStackZone')
        || Zone.current.getZoneWith('ProxyZoneSpec')
        || originalZone;
    zone.scheduleMicroTask('jasmineCleanStack', fn);
  }

  function QueueRunner(options) {
    options.clearStack = alwaysClearStack;
    SuperQueueRunner.call(this, options);
  }
  QueueRunner.prototype = SuperQueueRunner.prototype;
  return QueueRunner;
})((<any>jasmine).QueueRunner);

