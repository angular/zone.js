'use strict';

describe('Promise', function () {

  it('should work with .then', function (done) {
    if (!window.Promise) {
      console.log('WARNING: skipping Promise test (missing this API)');
      return;
    }

    new Promise(function (resolve) {
      resolve();
    }).then(function () {
      expect(window.zone.parent).toBeDefined();
      done();
    });
  });

  it('should work with .catch', function (done) {
    if (!window.Promise) {
      return;
    }

    new Promise(function (resolve, reject) {
      reject();
    }).catch(function () {
      expect(window.zone.parent).toBeDefined();
      done();
    });
  });

});
