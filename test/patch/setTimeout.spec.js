'use strict';

describe('setTimeout', function () {
  var _global = typeof window === 'undefined' ? global : window;

  beforeEach(function () {
    zone.mark = 'root';
  });

  it('should work with setTimeout', function (done) {

    var childZone = _global.zone.fork({
      mark: 'child'
    });

    expect(zone.mark).toEqual('root');

    childZone.run(function() {
      expect(zone.mark).toEqual('child');
      expect(zone).toEqual(childZone);

      _global.setTimeout(function() {
        // creates implied zone in all callbacks.
        expect(zone).not.toEqual(childZone);
        expect(zone.parent).toEqual(childZone);
        expect(zone.mark).toEqual('child'); // proto inherited
        done();
      }, 0);

      expect(zone.mark).toEqual('child');
    });

    expect(zone.mark).toEqual('root');
  });

  it('should allow canceling of fns registered with setTimeout', function (done) {
    var spy = jasmine.createSpy();
    var cancelId = _global.setTimeout(spy, 0);
    _global.clearTimeout(cancelId);
    setTimeout(function () {
      expect(spy).not.toHaveBeenCalled();
      done();
    });
  });

});
