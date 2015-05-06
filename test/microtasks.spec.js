'use strict';

describe('Microtasks', function () {
  it('should execute microtasks enqueued in the root zone', function(done) {
    var microtaskExecuted = false;

    zone.scheduleMicrotask(function() {
      microtaskExecuted = true;
    });

    setTimeout(function() {
      expect(microtaskExecuted).toEqual(true);
      done();
    });
  });

  // For some reason this test does not work in Jasmine ('mat1.mit' is scheduled after the last
  // setTimeout) everything is fine when executed from a browser window with zone-microtask.js
  // loaded
  xit('should correctly schedule microtasks vs macrotasks', function(done) {
    var log = ['+root'];

    zone.scheduleMicrotask(function() {
      log.push('root.mit');
    });

    setTimeout(function() {
      log.push('+mat1');
      zone.scheduleMicrotask(function() {
        log.push('mat1.mit');
      });
      log.push('-mat1');
    });

    setTimeout(function() {
      log.push('mat2');
    });

    setTimeout(function() {
      expect(log).toEqual([
        '+root', '-root', 'root.mit',
        '+mat1', '-mat1', 'mat1.mit',
        'mat2']);
      done();
    });

    log.push('-root');
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
});
