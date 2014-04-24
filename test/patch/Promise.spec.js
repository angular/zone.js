'use strict';

describe('Promise', function () {
  var flag, hasParent;

  beforeEach(function () {
    jasmine.Clock.useMock();
    flag = false;
    hasParent = false;
  });

  it('should work with .then', function () {
    if (!window.Promise) {
      console.log('WARNING: skipping Promise test (missing this API)');
      return;
    }

    runs(function () {
      new Promise(function (resolve) {
        setTimeout(resolve, 0);
      }).then(function () {
        hasParent = !!window.zone.parent;
        flag = true;
      });
      jasmine.Clock.tick(1);
    });


    waitsFor(function() {
      return flag;
    }, 'promise to resolve', 100);

    runs(function() {
      expect(hasParent).toBe(true);
    });
  });

  it('should work with .catch', function () {
    if (!window.Promise) {
      return;
    }

    runs(function() {
      new Promise(function (resolve, reject) {
        setTimeout(reject, 0);
      }).catch(function () {
        hasParent = !!window.zone.parent;
        flag = true;
      });
      jasmine.Clock.tick(1);
    });

    waitsFor(function() {
      return flag;
    }, 'promise to reject', 100);

    runs(function() {
      expect(hasParent).toBe(true);
    });
  });

});
