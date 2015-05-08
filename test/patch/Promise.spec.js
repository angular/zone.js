'use strict';

describe('Promise', ifEnvSupports('Promise', function () {
  var testZone = window.zone.fork();

  it('should work with .then', function (done) {
    testZone.run(function() {
      new Promise(function (resolve) {
        resolve();
      }).then(function () {
        assertInChildOf(testZone);
        done();
      });
    });
  });

  it('should work with .catch', function (done) {
    testZone.run(function() {
      new Promise(function (resolve, reject) {
        reject();
      }).catch(function () {
        assertInChildOf(testZone);
        done();
      });
    });
  });

}));
