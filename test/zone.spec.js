describe('Zone', function () {

  beforeEach(function () {
    window.zone = new Zone();
    zone.mark = 'root';
  });


  it('should work with setTimeout', function () {

    var childZone = window.zone.createChild({
      mark: 'child'
    });

    expect(zone.mark).toEqual('root');

    runs(function () {
      childZone.run(function() {
        expect(zone.mark).toEqual('child');
        expect(zone).toEqual(childZone);

        window.setTimeout(function() {
          // creates implied zone in all callbacks.
          expect(zone).not.toEqual(childZone);
          expect(zone.parent).toEqual(childZone);
          expect(zone.mark).toEqual('child'); // proto inherited
        }, 0);

        waits(1);

        expect(zone.mark).toEqual('child');
      });
    });

    expect(zone.mark).toEqual('root');
  });


});


