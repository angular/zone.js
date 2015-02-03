'use strict';

describe('setInterval', function () {

  beforeEach(function () {
    zone.mark = 'root';
  });

  it('should work with setInterval', function (done) {
    var childZone = window.zone.fork({
      mark: 'child'
    });

    expect(zone.mark).toEqual('root');

    childZone.run(function() {
      expect(zone.mark).toEqual('child');
      expect(zone).toEqual(childZone);

      var cancelId = window.setInterval(function() {
        // creates implied zone in all callbacks.
        expect(zone).not.toBe(childZone);
        expect(zone.parent).toBe(childZone);
        expect(zone.mark).toBe('child'); // proto inherited

        clearInterval(cancelId);
        done();
      }, 10);

      expect(zone.mark).toEqual('child');
    });

    expect(zone.mark).toEqual('root');
  });

});
