'use strict';

describe('Microtasks', function () {
  // TODO(vicb): using JS for scheduling microtasks ?
  // see https://github.com/angular/zone.js/issues/97
  xit('should execute microtasks enqueued in the root zone', function(done) {
    var microtaskExecuted = false;

    Zone.scheduleMicrotask(function() {
      microtaskExecuted = true;
    });

    setTimeout(function() {
      expect(microtaskExecuted).toEqual(true);
      done();
    });
  });

  it('should executed Promise callback in the zone where they are scheduled', function(done) {
    var resolvedPromise = Promise.resolve(null);

    zone.fork({_name: 'foo'}).run(function() {
      resolvedPromise.then(function() {
        expect(zone._name).toBe('foo');
        done();
      });
    });
  });

  it('should executed Promise callback in the zone where they are scheduled', function(done) {
    var resolve;
    var promise = new Promise(function (rs) {
      resolve = rs;
    })

    zone.fork({_name: 'foo'}).run(function() {
      promise.then(function() {
        expect(zone._name).toBe('foo');
        done();
      });
    });

    zone.fork({_name: 'bar'}).run(function() {
      resolve(null);
    });
  });

  // TODO(vicb): setImmediate should schedule a microtask (in the zone where it is called)
  // TODO(vicb): create a "-sauce" version of this file, add to Travis
});
