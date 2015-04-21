'use strict';

var _global = typeof window === 'undefined' ? global : window;

describe('Promise', _global.ifEnvSupports('Promise', function () {

  it('should work with .then', function (done) {
    new Promise(function (resolve) {
      resolve();
    }).then(function () {
      expect(_global.zone.parent).toBeDefined();
      done();
    });
  });

  it('should work with .catch', function (done) {
    new Promise(function (resolve, reject) {
      reject();
    }).catch(function () {
      expect(_global.zone.parent).toBeDefined();
      done();
    });
  });

}));
