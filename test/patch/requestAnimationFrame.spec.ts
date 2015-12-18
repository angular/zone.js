import {ifEnvSupports} from '../util';

describe('requestAnimationFrame', function () {
  var testZone = global.zone.fork();

  var functions = [
    'requestAnimationFrame',
    'webkitRequestAnimationFrame',
    'mozRequestAnimationFrame'
  ];

  functions.forEach(function (fnName) {
    describe(fnName, ifEnvSupports(fnName, function () {
      var rAF = window[fnName];

      it('should be tolerant of invalid arguments', function (done) {
        testZone.run(function () {
          // rAF throws an error on invalid arguments, so expect that.
          expect(function () {
            rAF(null);
          }).toThrow();
          done();
        });
      });

      it('should bind to same zone when called recursively', function (done) {
        testZone.run(function () {
          var frames = 0;
          var previousTimeStamp = 0;

          function frameCallback(timestamp) {
            expect(global.zone).toBe(testZone);

            expect(timestamp).toMatch(/^[\d.]+$/);
            // expect previous <= current
            expect(previousTimeStamp).not.toBeGreaterThan(timestamp);
            previousTimeStamp = timestamp;

            if (frames++ > 15) {
              return done();
            }
            rAF(frameCallback);
          }

          rAF(frameCallback);
        });
      });
    }));
  });
});
