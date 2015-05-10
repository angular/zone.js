'use strict';

describe('setTimeout', function () {

  it('should work with setTimeout', function (done) {

    var testZone = window.zone.fork();

    testZone.run(function() {

      window.setTimeout(function() {
        // creates implied zone in all callbacks.
        expect(window.zone).toBeDirectChildOf(testZone);
        done();
      }, 0);
    });
  });

  it('should allow canceling of fns registered with setTimeout', function (done) {
    var spy = jasmine.createSpy();
    var cancelId = window.setTimeout(spy, 0);
    window.clearTimeout(cancelId);
    setTimeout(function () {
      expect(spy).not.toHaveBeenCalled();
      done();
    });
  });

});
