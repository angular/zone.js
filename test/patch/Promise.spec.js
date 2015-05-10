'use strict';

describe('Promise', ifEnvSupports('Promise', function () {
  var testZone = window.zone.fork();

  it('should work with .then', function (done) {
    var resolve;

    testZone.run(function() {
      new Promise(function (resolveFn) {
        resolve = resolveFn;
      }).then(function () {
        expect(window.zone).toBeDirectChildOf(testZone);
        done();
      });
    });

    resolve();
  });

  it('should work with .catch', function (done) {
    var reject;

    testZone.run(function() {
      new Promise(function (resolveFn, rejectFn) {
        reject = rejectFn;
      }).catch(function () {
        expect(window.zone).toBeDirectChildOf(testZone);
        done();
      });
    });

    reject();
  });

}));
