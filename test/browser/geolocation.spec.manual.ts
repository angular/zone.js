import {ifEnvSupports} from '../util';

function supportsGeolocation() {
  return 'geolocation' in navigator;
}
(<any>supportsGeolocation).message = 'Geolocation';

describe('Geolocation', ifEnvSupports(supportsGeolocation, function () {
  var testZone = Zone.current.fork({name: 'geotest'});

  it('should work for getCurrentPosition', function(done) {
    testZone.run(function() {
      navigator.geolocation.getCurrentPosition(
        function(pos) {
          expect(Zone.current).toBe(testZone);
          done();
        }
      );
    });
  }, 10000);

  it('should work for watchPosition', function(done) {
    testZone.run(function() {
      var watchId;
      watchId = navigator.geolocation.watchPosition(
        function(pos) {
          expect(Zone.current).toBe(testZone);
          navigator.geolocation.clearWatch(watchId);
          done();
        }
      );
    });
  }, 10000);
}));
