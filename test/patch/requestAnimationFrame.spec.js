'use strict';

describe('requestAnimationFrame', function () {
  var testZone = zone.fork();

  var functions = [
    'requestAnimationFrame',
    'webkitRequestAnimationFrame',
    'mozRequestAnimationFrame'
  ];

  functions.forEach(function (fnName) {
    var rAF = window[fnName];
    describe(fnName, function () {
      if (typeof rAF === 'undefined') {
        console.log('WARNING: skipping ' + fnName + ' test (missing this API)');
        return;
      }

      it('should be tolerant of invalid arguments', function (done) {
        testZone.run(function () {
          // rAF throws an error on invalid arguments, so expect that.
          expect(function () {
            rAF(null);
          }).toThrow();
          done();
        });
      });
      it('should execute callback function in a zone', function (done) {
        testZone.run(function () {
          rAF(function () {
            expect(zone === testZone).toBe(true);
            done();
          });
        });
      });

      it('should bind to same zone when called recursively', function (done) {
        testZone.run(function () {
          var frames = 0;

          function frameCallback() {
            expect(zone === testZone).toBe(true);
            if (frames++ > 15) {
              return done();
            }
            rAF(frameCallback);
          }

          rAF(frameCallback);
        });
      });
    });
  });
});
