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

      var cancelId = setInterval(function() {
        // the callback runs in the same zone
        expect(zone).toBe(childZone);
        clearInterval(cancelId);
        done();
      }, 10);

      expect(zone.mark).toEqual('child');
    });

    expect(zone.mark).toEqual('root');
  });

});
