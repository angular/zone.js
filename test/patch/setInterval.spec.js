'use strict';

describe('setInterval', function () {

  beforeEach(function () {
    zone.mark = 'root';
    jasmine.Clock.useMock();
  });

  it('should work with setInterval', function () {
    var childZone = window.zone.fork({
      mark: 'child'
    });

    expect(zone.mark).toEqual('root');

    childZone.run(function() {
      expect(zone.mark).toEqual('child');
      expect(zone).toEqual(childZone);

      var cancelId = window.setInterval(function() {
        // creates implied zone in all callbacks.
        expect(zone).not.toEqual(childZone);
        expect(zone.parent).toEqual(childZone);
        expect(zone.mark).toEqual('child'); // proto inherited
      }, 10);

      jasmine.Clock.tick(11);

      expect(zone.mark).toEqual('child');

      clearInterval(cancelId);
    });

    expect(zone.mark).toEqual('root');
  });

});
