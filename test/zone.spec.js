describe('Zone.patch', function () {

  beforeEach(function () {
    zone.mark = 'root';
  });


  it('should work with setTimeout', function () {

    var childZone = window.zone.createChild({
      mark: 'child'
    });

    expect(zone.mark).toEqual('root');

    runs(function () {
      childZone.apply(function() {
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


  describe('element', function () {

    var button;

    beforeEach(function () {
      button = document.createElement('button');
      document.body.appendChild(button);
    });

    afterEach(function () {
      document.body.removeChild(button);
      button.remove();
    });

    it('should work with addEventListener', function () {
      var zoneHasParent;
      button.addEventListener('click', function () {
        zoneHasParent = !!window.zone.parent;
      });

      runs(function () {
        button.click();
        waits(1);
        expect(zoneHasParent).toEqual(true);
      });
    });

    it('should respect removeEventListener', function () {
      var log = '';
      var logOnClick = function logOnClick () {
        log += 'a';
      };

      button.addEventListener('click', logOnClick);
      button.removeEventListener('click', logOnClick);

      runs(function () {
        button.click();
        waits(1);
        expect(log).toEqual('');
      });
    });

    it('should work with onclick', function () {
      var zoneHasParent;
      button.onclick = function () {
        zoneHasParent = !!window.zone.parent;
      };

      runs(function () {
        button.click();
        waits(1);
        expect(zoneHasParent).toEqual(true);
      });
    });

    it('should only allow one onclick handler', function () {
      var log = '';
      button.onclick = function () {
        log += 'a';
      };
      button.onclick = function () {
        log += 'b';
      };

      runs(function () {
        button.click();
        waits(1);
        expect(log).toEqual('b');
      });
    });

  });



});


