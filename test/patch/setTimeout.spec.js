'use strict';

describe('setTimeout', function () {

  it('should work with setTimeout', function (done) {

    var testZone = zone.fork();

    testZone.run(function() {

      setTimeout(function() {
        // creates implied zone in all callbacks.
        expect(zone).toBeDirectChildOf(testZone);
        done();
      }, 0);
    });
  });

  it('should allow canceling of fns registered with setTimeout', function (done) {
    var spy = jasmine.createSpy();
    var cancelId = setTimeout(spy, 0);
    clearTimeout(cancelId);
    setTimeout(function () {
      expect(spy).not.toHaveBeenCalled();
      done();
    });
  });

});
