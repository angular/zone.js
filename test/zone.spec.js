'use strict';


describe('Zone.patch', function () {

  beforeEach(function () {
    zone.mark = 'root';
  });

  describe('setTimeout', function () {

    beforeEach(function () {
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

  describe('setInterval', function () {

    beforeEach(function () {
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

  describe('requestAnimationFrame', function () {
    var flag, hasParent, skip = false;

    it('should work', function (done) {

      if (!window.requestAnimationFrame) {
        console.log('WARNING: skipping requestAnimationFrame test (missing this API)');
        return;
      }

      // Some browsers (especially Safari) do not fire requestAnimationFrame
      // if they are offscreen. We can disable this test for those browsers and
      // assume the patch works if setTimeout works, since they are mechanically
      // the same
      runs(function() {
        flag = false;
        window.requestAnimationFrame(function () {
          flag = true;
        });
        setTimeout(function () {
          skip = true;
          flag = true;
          console.log('WARNING: skipping requestAnimationFrame test (not firing rAF)');
        }, 50);
      });

      waitsFor(function() {
        return flag;
      }, "requestAnimationFrame to run", 100);

      runs(function() {
        flag = false;
        hasParent = false;

        window.requestAnimationFrame(function () {
          hasParent = !!window.zone.parent;
          flag = true;
        });
      });

      waitsFor(function() {
        return flag || skip;
      }, "requestAnimationFrame to run", 100);

      runs(function() {
        expect(hasParent || skip).toBe(true);
      });

    });
  });

  describe('webkitRequestAnimationFrame', function () {
    var flag, hasParent, skip = false;

    it('should work', function (done) {

      if (!window.webkitRequestAnimationFrame) {
        console.log('WARNING: skipping webkitRequestAnimationFrame test (missing this API)');
        return;
      }

      // Some browsers (especially Safari) do not fire webkitRequestAnimationFrame
      // if they are offscreen. We can disable this test for those browsers and
      // assume the patch works if setTimeout works, since they are mechanically
      // the same
      runs(function() {
        flag = false;
        window.webkitRequestAnimationFrame(function () {
          flag = true;
        });
        setTimeout(function () {
          skip = true;
          flag = true;
          console.log('WARNING: skipping webkitRequestAnimationFrame test (not firing rAF)');
        }, 50);
      });

      waitsFor(function() {
        return flag;
      }, 'webkitRequestAnimationFrame to run', 100);

      runs(function() {
        flag = false;
        hasParent = false;

        window.webkitRequestAnimationFrame(function () {
          hasParent = !!window.zone.parent;
          flag = true;
        });
      });

      waitsFor(function() {
        return flag || skip;
      }, 'webkitRequestAnimationFrame to run', 100);

      runs(function() {
        expect(hasParent || skip).toBe(true);
      });

    });
  });

  describe('Promise', function () {
    var flag, hasParent;

    beforeEach(function () {
      jasmine.Clock.useMock();
      flag = false;
      hasParent = false;
    });

    it('should work with .then', function () {
      if (!window.Promise) {
        console.log('WARNING: skipping Promise test (missing this API)');
        return;
      }

      runs(function () {
        new Promise(function (resolve) {
          setTimeout(resolve, 0);
        }).then(function () {
          hasParent = !!window.zone.parent;
          flag = true;
        });
        jasmine.Clock.tick(1);
      });


      waitsFor(function() {
        return flag;
      }, 'promise to resolve', 100);

      runs(function() {
        expect(hasParent).toBe(true);
      });
    });

    it('should work with .catch', function () {
      if (!window.Promise) {
        return;
      }

      runs(function() {
        new Promise(function (resolve, reject) {
          setTimeout(reject, 0);
        }).catch(function () {
          hasParent = !!window.zone.parent;
          flag = true;
        });
        jasmine.Clock.tick(1);
      });

      waitsFor(function() {
        return flag;
      }, "promise to reject", 100);

      runs(function() {
        expect(hasParent).toBe(true);
      });
    });
  })

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

    it('should handle removing onclick', function () {
      var log = '';
      button.onclick = function () {
        log += 'a';
      };
      button.onclick = null;

      button.click();
      expect(log).toEqual('');
    });

  });

  describe('hooks', function () {

    beforeEach(function () {
      jasmine.Clock.useMock();
    });

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

    it('should fire onZoneCreated when a zone is forked', function () {
      var createdSpy = jasmine.createSpy();
      var counter = 0;
      var myZone = zone.fork({
        onZoneCreated: function () {
          counter += 1;
        },
        onZoneLeave: function () {
          counter -= 1;
        }
      });

      myZone.run(function () {

        expect(counter).toBe(0);

        setTimeout(function () {
          expect(counter).toBe(2);
        }, 0);
        expect(counter).toBe(1);

        setTimeout(function () {
          expect(counter).toBe(1);
          setTimeout(function () {}, 0);
          expect(counter).toBe(2);
        }, 0);
        expect(counter).toBe(2);

        jasmine.Clock.tick(1);

        expect(counter).toBe(0);
      });
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
