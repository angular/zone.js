'use strict';

describe('setTimeout', function () {

  beforeEach(function () {
    zone.mark = 'root';
    jasmine.Clock.useMock();
  });

  it('should work with setTimeout', function () {

    var childZone = window.zone.fork({
      mark: 'child'
    });

    expect(zone.mark).toEqual('root');

    childZone.run(function() {
      expect(zone.mark).toEqual('child');
      expect(zone).toEqual(childZone);

      window.setTimeout(function() {
        // creates implied zone in all callbacks.
        expect(zone).not.toEqual(childZone);
        expect(zone.parent).toEqual(childZone);
        expect(zone.mark).toEqual('child'); // proto inherited
      }, 0);

      expect(zone.mark).toEqual('child');
    });

    expect(zone.mark).toEqual('root');
  });

  it('should allow canceling of fns registered with setTimeout', function () {
    var spy = jasmine.createSpy();
    var cancelId = window.setTimeout(spy, 0);
    window.clearTimeout(cancelId);

    jasmine.Clock.tick(1);

    expect(spy).not.toHaveBeenCalled();
  });

});
