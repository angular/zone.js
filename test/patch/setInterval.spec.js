'use strict';

describe('setInterval', function () {

  it('should work with setInterval', function (done) {
    var testZone = global.zone.fork();

    testZone.run(function() {
      var cancelId = setInterval(function() {
        // creates implied zone in all callbacks.
        expect(global.zone).toBeDirectChildOf(testZone);

        clearInterval(cancelId);
        done();
      }, 10);
    });
  });

});
