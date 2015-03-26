'use strict';

describe('Promise', ifEnvSupports('Promise', function () {

  it('should work with .then', function (done) {
    new Promise(function (resolve) {
      resolve();
    }).then(function () {
      expect(window.zone.parent).toBeDefined();
      done();
    });
  });

  it('should work with .catch', function (done) {
    new Promise(function (resolve, reject) {
      reject();
    }).catch(function () {
      expect(window.zone.parent).toBeDefined();
      done();
    });
  });

}));
