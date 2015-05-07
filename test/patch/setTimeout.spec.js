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

      setTimeout(function() {
        // the callback runs in the same zone
        expect(zone).toEqual(childZone);
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
