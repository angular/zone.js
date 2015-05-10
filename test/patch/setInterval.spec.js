'use strict';

describe('setInterval', function () {

  it('should work with setInterval', function (done) {
    var testZone = window.zone.fork();

    testZone.run(function() {
      var cancelId = window.setInterval(function() {
        // creates implied zone in all callbacks.
        expect(window.zone).toBeDirectChildOf(testZone);

        clearInterval(cancelId);
        done();
      }, 10);
    });
  });

});
