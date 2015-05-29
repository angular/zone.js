'use strict';

describe('requestAnimationFrame', function () {
  var testZone = zone.fork();

  describe('requestAnimationFrame', function () {
    it('should run the passed callback in a zone', function (done) {
      testZone.run(function() {
        if (typeof requestAnimationFrame === 'undefined') {
          console.log('WARNING: skipping requestAnimationFrame test (missing this API)');
          return done();
        }

        // Some browsers (especially Safari) do not fire requestAnimationFrame
        // if they are offscreen. We can disable this test for those browsers and
        // assume the patch works if setTimeout works, since they are mechanically
        // the same
        requestAnimationFrame(function () {
          expect(zone).toBeDirectChildOf(testZone);
          done();
        });
      });
    });
  });

  describe('mozRequestAnimationFrame', function () {
    it('should run the passed callback in a zone', function (done) {
      testZone.run(function() {
        if (typeof mozRequestAnimationFrame === 'undefined') {
          console.log('WARNING: skipping mozRequestAnimationFrame test (missing this API)');
          return done();
        }

        // Some browsers (especially Safari) do not fire mozRequestAnimationFrame
        // if they are offscreen. We can disable this test for those browsers and
        // assume the patch works if setTimeout works, since they are mechanically
        // the same
        mozRequestAnimationFrame(function () {
          expect(zone).toBeDirectChildOf(testZone);
          done();
        });
      });
    });
  });

  describe('webkitRequestAnimationFrame', function () {
    it('should run the passed callback in a zone', function (done) {
      testZone.run(function() {
        if (typeof webkitRequestAnimationFrame === 'undefined') {
          console.log('WARNING: skipping webkitRequestAnimationFrame test (missing this API)');
          return done();
        }

        // Some browsers (especially Safari) do not fire webkitRequestAnimationFrame
        // if they are offscreen. We can disable this test for those browsers and
        // assume the patch works if setTimeout works, since they are mechanically
        // the same
        webkitRequestAnimationFrame(function () {
          expect(zone).toBeDirectChildOf(testZone);
          done();
        });
      });
    });
  });
});
