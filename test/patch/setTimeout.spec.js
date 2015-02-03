'use strict';

describe('setTimeout', function () {

  beforeEach(function () {
    zone.mark = 'root';
  });

  it('should work with setTimeout', function (done) {

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
        done();
      }, 0);

      expect(zone.mark).toEqual('child');
    });

    expect(zone.mark).toEqual('root');
  });

  it('should allow canceling of fns registered with setTimeout', function (done) {
    var spy = jasmine.createSpy();
    var cancelId = window.setTimeout(spy, 0);
    window.clearTimeout(cancelId);
    setTimeout(function () {
      expect(spy).not.toHaveBeenCalled();
      done();
    });
  });

});
