'use strict';

var util = require('../../util');

describe('requestAnimationFrame', function () {
  var testZone = zone.fork();

  var functions = [
    'requestAnimationFrame',
    'webkitRequestAnimationFrame',
    'mozRequestAnimationFrame'
  ];

  functions.forEach(function (fnName) {
    describe(fnName, util.ifEnvSupports(fnName, function () {
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
    }));
  });
});
