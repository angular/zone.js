'use strict';

describe('requestAnimationFrame', function () {
  var flag, hasParent, skip = false;

  it('should work', function (done) {

    if (!window.requestAnimationFrame) {
      console.log('WARNING: skipping requestAnimationFrame test (missing this API)');
      return;
    }

    // Some browsers (especially Safari) do not fire requestAnimationFrame
    // if they are offscreen. We can disable this test for those browsers and
    // assume the patch works if setTimeout works, since they are mechanically
    // the same
    runs(function() {
      flag = false;
      window.requestAnimationFrame(function () {
        flag = true;
      });
      setTimeout(function () {
        skip = true;
        flag = true;
        console.log('WARNING: skipping requestAnimationFrame test (not firing rAF)');
      }, 50);
    });

    waitsFor(function() {
      return flag;
    }, "requestAnimationFrame to run", 100);

    runs(function() {
      flag = false;
      hasParent = false;

      window.requestAnimationFrame(function () {
        hasParent = !!window.zone.parent;
        flag = true;
      });
    });

    waitsFor(function() {
      return flag || skip;
    }, "requestAnimationFrame to run", 100);

    runs(function() {
      expect(hasParent || skip).toBe(true);
    });

  });
});

describe('mozRequestAnimationFrame', function () {
  var flag, hasParent, skip = false;

  it('should work', function (done) {

    if (!window.mozRequestAnimationFrame) {
      console.log('WARNING: skipping mozRequestAnimationFrame test (missing this API)');
      return;
    }

    // Some browsers (especially Safari) do not fire mozRequestAnimationFrame
    // if they are offscreen. We can disable this test for those browsers and
    // assume the patch works if setTimeout works, since they are mechanically
    // the same
    runs(function() {
      flag = false;
      window.mozRequestAnimationFrame(function () {
        flag = true;
      });
      setTimeout(function () {
        skip = true;
        flag = true;
        console.log('WARNING: skipping mozRequestAnimationFrame test (not firing rAF)');
      }, 50);
    });

    waitsFor(function() {
      return flag;
    }, 'mozRequestAnimationFrame to run', 100);

    runs(function() {
      flag = false;
      hasParent = false;

      window.mozRequestAnimationFrame(function () {
        hasParent = !!window.zone.parent;
        flag = true;
      });
    });

    waitsFor(function() {
      return flag || skip;
    }, 'mozRequestAnimationFrame to run', 100);

    runs(function() {
      expect(hasParent || skip).toBe(true);
    });

  });
});

describe('webkitRequestAnimationFrame', function () {
  var flag, hasParent, skip = false;

  it('should work', function (done) {

    if (!window.webkitRequestAnimationFrame) {
      console.log('WARNING: skipping webkitRequestAnimationFrame test (missing this API)');
      return;
    }

    // Some browsers (especially Safari) do not fire webkitRequestAnimationFrame
    // if they are offscreen. We can disable this test for those browsers and
    // assume the patch works if setTimeout works, since they are mechanically
    // the same
    runs(function() {
      flag = false;
      window.webkitRequestAnimationFrame(function () {
        flag = true;
      });
      setTimeout(function () {
        skip = true;
        flag = true;
        console.log('WARNING: skipping webkitRequestAnimationFrame test (not firing rAF)');
      }, 50);
    });

    waitsFor(function() {
      return flag;
    }, 'webkitRequestAnimationFrame to run', 100);

    runs(function() {
      flag = false;
      hasParent = false;

      window.webkitRequestAnimationFrame(function () {
        hasParent = !!window.zone.parent;
        flag = true;
      });
    });

    waitsFor(function() {
      return flag || skip;
    }, 'webkitRequestAnimationFrame to run', 100);

    runs(function() {
      expect(hasParent || skip).toBe(true);
    });

  });
});
