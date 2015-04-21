'use strict';

var _global = typeof window === 'undefined' ? global : window;

describe('requestAnimationFrame', function () {
  it('should run the passed callback in a zone', function (done) {
    if (!_global.requestAnimationFrame) {
      console.log('WARNING: skipping requestAnimationFrame test (missing this API)');
      return done();
    }

    // Some browsers (especially Safari) do not fire requestAnimationFrame
    // if they are offscreen. We can disable this test for those browsers and
    // assume the patch works if setTimeout works, since they are mechanically
    // the same
    _global.requestAnimationFrame(function () {
      expect(_global.zone.parent).toBeDefined();
      done();
    });
  });
});

describe('mozRequestAnimationFrame', function () {
  it('should run the passed callback in a zone', function (done) {
    if (!_global.mozRequestAnimationFrame) {
      console.log('WARNING: skipping mozRequestAnimationFrame test (missing this API)');
      return done();
    }

    // Some browsers (especially Safari) do not fire mozRequestAnimationFrame
    // if they are offscreen. We can disable this test for those browsers and
    // assume the patch works if setTimeout works, since they are mechanically
    // the same
    _global.mozRequestAnimationFrame(function () {
      expect(_global.zone.parent).toBeDefined();
      done();
    });
  });
});

describe('webkitRequestAnimationFrame', function () {
  it('should run the passed callback in a zone', function (done) {
    if (!_global.webkitRequestAnimationFrame) {
      console.log('WARNING: skipping webkitRequestAnimationFrame test (missing this API)');
      return done();
    }

    // Some browsers (especially Safari) do not fire webkitRequestAnimationFrame
    // if they are offscreen. We can disable this test for those browsers and
    // assume the patch works if setTimeout works, since they are mechanically
    // the same
    _global.webkitRequestAnimationFrame(function () {
      expect(_global.zone.parent).toBeDefined();
      done();
    });
  });
});
