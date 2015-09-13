'use strict';

var util = require('../../util');

describe('process', function () {
  var testZone = global.zone.fork();

  describe('nextTick', function () {

    it('should zone-bind its callback', function (done) {
      testZone.run(function () {
        process.nextTick(function () {
          expect(global.zone).toBeDirectChildOf(testZone);
          done();
        });
      });
    });

    it('should have a hook', function () {
      testZone.fork({
        nextTick: jasmine.createSpy()
      }).run(function () {
        process.nextTick(function () {});

        expect(global.zone.nextTick).toHaveBeenCalled();
      })
    });

  });
});