'use strict';

describe('Microtasks', function () {
  it('should execute microtasks enqueued in the root zone', function(done) {
    var log = [];

    global.zone.scheduleMicrotask(function() {
      log.push(1);
    });
    global.zone.scheduleMicrotask(function() {
      log.push(2);
    });
    global.zone.scheduleMicrotask(function() {
      log.push(3);
    });

    setTimeout(function() {
      expect(log).toEqual([1, 2, 3]);
      done();
    }, 10);
  });

  it('should correctly schedule microtasks vs macrotasks', function(done) {
    var log = ['+root'];

    global.zone.scheduleMicrotask(function() {
      log.push('root.mit');
    });

    setTimeout(function() {
      log.push('+mat1');
      global.zone.scheduleMicrotask(function() {
        log.push('mat1.mit');
      });
      log.push('-mat1');
    }, 10);

    setTimeout(function() {
      log.push('mat2');
    }, 30);

    setTimeout(function() {
      expect(log).toEqual([
        '+root', '-root', 'root.mit',
        '+mat1', '-mat1', 'mat1.mit',
        'mat2']);
      done();
    }, 40);

    log.push('-root');
  });

  it('should execute Promise callback in the zone where they are scheduled', function(done) {
    var resolvedPromise = Promise.resolve(null);

    var testZone = global.zone.fork();

    testZone.run(function() {
      resolvedPromise.then(function() {
        expect(global.zone).toBeDirectChildOf(testZone);
        done();
      });
    });
  });

  it('should execute Promise callback in the zone where they are scheduled', function(done) {
    var resolve;
    var promise = new Promise(function (rs) {
      resolve = rs;
    });

    var testZone = global.zone.fork();

    testZone.run(function() {
      promise.then(function() {
        expect(global.zone).toBeDirectChildOf(testZone);
        done();
      });
    });

    global.zone.fork().run(function() {
      resolve(null);
    });
  });

  describe('Promise', function() {
    it('should go through scheduleMicrotask', function(done) {
      var called = false;
      var testZone = global.zone.fork({
        '$scheduleMicrotask': function (parentScheduleMicrotask) {
          return function(microtask) {
            called = true;
            parentScheduleMicrotask.call(this, microtask);
          }
        }
      });

      testZone.run(function() {
        Promise.resolve('value').then(function() {
          expect(called).toEqual(true);
          done();
        });
      });
    });
  });
});
