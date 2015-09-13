'use strict';

var util = require('../../util');

function supportsGeolocation() {
  return 'geolocation' in navigator;
}
supportsGeolocation.message = 'Geolocation';

describe('Geolocation', util.ifEnvSupports(supportsGeolocation, function () {
  var testZone = zone.fork();

  it('should work for getCurrentPosition', function(done) {
    testZone.run(function() {
      navigator.geolocation.getCurrentPosition(
        function(pos) {
          expect(zone).toBeDirectChildOf(testZone);
          done();
        }
      );
    });
  });

  it('should work for watchPosition', function(done) {
    testZone.run(function() {
      var watchId;
      watchId = navigator.geolocation.watchPosition(
        function(pos) {
          expect(zone).toBeDirectChildOf(testZone);
          navigator.geolocation.clearWatch(watchId);
          done();
        }
      );
    });
  });
}));
