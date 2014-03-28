'use strict';


describe('Zone.patch', function () {

  beforeEach(function () {
    zone.mark = 'root';
    jasmine.Clock.useMock();
  });

  describe('setTimeout', function () {

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

  describe('setInterval', function () {

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

      button.click();
      expect(zoneHasParent).toEqual(true);
    });

    it('should respect removeEventListener', function () {
      var log = '';
      var logOnClick = function logOnClick () {
        log += 'a';
      };

      button.addEventListener('click', logOnClick);
      button.click();
      expect(log).toEqual('a');

      button.removeEventListener('click', logOnClick);
      button.click();
      expect(log).toEqual('a');
    });

    it('should work with onclick', function () {
      var zoneHasParent;
      button.onclick = function () {
        zoneHasParent = !!window.zone.parent;
      };

      button.click();
      expect(zoneHasParent).toEqual(true);
    });

    it('should only allow one onclick handler', function () {
      var log = '';
      button.onclick = function () {
        log += 'a';
      };
      button.onclick = function () {
        log += 'b';
      };

      button.click();
      expect(log).toEqual('b');
    });

  });

  describe('hooks', function () {
    it('should fire onZoneEnter before a zone runs a function', function () {
      var enterSpy = jasmine.createSpy();
      var myZone = zone.fork({
        onZoneEnter: enterSpy
      });

      expect(enterSpy).not.toHaveBeenCalled();

      myZone.run(function () {
        expect(enterSpy).toHaveBeenCalled();
      });
    });

    it('should fire onZoneLeave after a zone runs a function', function () {
      var leaveSpy = jasmine.createSpy();
      var myZone = zone.fork({
        onZoneLeave: leaveSpy
      });

      myZone.run(function () {
        expect(leaveSpy).not.toHaveBeenCalled();
      });

      expect(leaveSpy).toHaveBeenCalled();
    });

    it('should throw if onError is not defined', function () {
      expect(function () {
        zone.run(throwError);
      }).toThrow();
    });

    it('should fire onError if a function run by a zone throws', function () {
      var errorSpy = jasmine.createSpy();
      var myZone = zone.fork({
        onError: errorSpy
      });

      expect(errorSpy).not.toHaveBeenCalled();

      expect(function () {
        myZone.run(throwError);
      }).not.toThrow();

      expect(errorSpy).toHaveBeenCalled();
    });

    it('should allow you to override alert', function () {
      var spy = jasmine.createSpy();
      var myZone = zone.fork({
        alert: spy
      });

      //alert('foo');
      //expect(spy).not.toHaveBeenCalled();

      myZone.run(function () {
        alert('foo');
      });

      expect(spy).toHaveBeenCalled();
    });
  });

  it('should allow zones to be run from within another zone', function () {
    var a = zone.fork({
          mark: 'a'
        }),
        b = zone.fork({
          mark: 'b'
        });

    a.run(function () {
      b.run(function () {
        expect(zone.mark).toBe('b');
      });
      expect(zone.mark).toBe('a');
    });
    expect(zone.mark).toBe('root');
  });

});

function throwError () {
  throw new Error();
}
