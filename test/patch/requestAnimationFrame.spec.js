'use strict';

describe('requestAnimationFrame', function () {
  it('should run the passed callback in a zone', function (done) {
    if (!window.requestAnimationFrame) {
      console.log('WARNING: skipping requestAnimationFrame test (missing this API)');
      return done();
    }

    // Some browsers (especially Safari) do not fire requestAnimationFrame
    // if they are offscreen. We can disable this test for those browsers and
    // assume the patch works if setTimeout works, since they are mechanically
    // the same
    window.requestAnimationFrame(function () {
      expect(window.zone.parent).toBeDefined();
      done();
    });
  });
});

describe('mozRequestAnimationFrame', function () {
  it('should run the passed callback in a zone', function (done) {
    if (!window.mozRequestAnimationFrame) {
      console.log('WARNING: skipping mozRequestAnimationFrame test (missing this API)');
      return done();
    }

    // Some browsers (especially Safari) do not fire mozRequestAnimationFrame
    // if they are offscreen. We can disable this test for those browsers and
    // assume the patch works if setTimeout works, since they are mechanically
    // the same
    window.mozRequestAnimationFrame(function () {
      expect(window.zone.parent).toBeDefined();
      done();
    });
  });
});

describe('webkitRequestAnimationFrame', function () {
  it('should run the passed callback in a zone', function (done) {
    if (!window.webkitRequestAnimationFrame) {
      console.log('WARNING: skipping webkitRequestAnimationFrame test (missing this API)');
      return done();
    }

    // Some browsers (especially Safari) do not fire webkitRequestAnimationFrame
    // if they are offscreen. We can disable this test for those browsers and
    // assume the patch works if setTimeout works, since they are mechanically
    // the same
    window.webkitRequestAnimationFrame(function () {
      expect(window.zone.parent).toBeDefined();
      done();
    });
  });
});
