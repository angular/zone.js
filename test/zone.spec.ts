import './test-env-setup';
import {Zone} from '../lib/browser/zone';

describe('Zone', function () {
  var rootZone = global.zone;

  it('should have an id', function () {
    expect(global.zone.$id).toBeDefined();
  });

  it('forked zones should have a greater id than their parent', function () {
    expect(global.zone.fork().$id).toBeGreaterThan(global.zone.$id);
  });

  describe('hooks', function () {

    it('should fire beforeTask before a zone runs a function', function () {
      var enterSpy = jasmine.createSpy('enter');
      var myZone = global.zone.fork({
        beforeTask: enterSpy
      });

      expect(enterSpy).not.toHaveBeenCalled();

      myZone.run(function () {
        expect(enterSpy).toHaveBeenCalled();
      });
    });


    it('should fire afterTask after a zone runs a function', function () {
      var leaveSpy = jasmine.createSpy('leave');
      var myZone = global.zone.fork({
        afterTask: leaveSpy
      });

      myZone.run(function () {
        expect(leaveSpy).not.toHaveBeenCalled();
      });

      expect(leaveSpy).toHaveBeenCalled();
    });


    it('should fire onZoneCreated when a zone is forked', function () {
      var counter = 0;
      var myZone = global.zone.fork({
        onZoneCreated: function () {
          counter += 1;
        }
      });

      myZone.run(function () {

        expect(counter).toBe(0);

        myZone.fork();

        expect(counter).toBe(1);
      });
    });


    it('should throw if onError is not defined', function () {
      expect(function () {
        global.zone.run(throwError);
      }).toThrow();
    });


    it('should fire onError if a function run by a zone throws', function () {
      var errorSpy = jasmine.createSpy('error');
      var myZone = global.zone.fork({
        onError: errorSpy
      });

      expect(errorSpy).not.toHaveBeenCalled();

      expect(function () {
        myZone.run(throwError);
      }).not.toThrow();

      expect(errorSpy).toHaveBeenCalled();
    });


    it('should allow you to override alert', function () {
      var spy = jasmine.createSpy('alert');
      var myZone = global.zone.fork({
        alert: spy
      });

      myZone.run(function () {
        alert('foo');
      });

      expect(spy).toHaveBeenCalled();
    });

    describe('eventListener hooks', function () {
      var button;
      var clickEvent;

      beforeEach(function () {
        button = document.createElement('button');
        clickEvent = document.createEvent('Event');
        clickEvent.initEvent('click', true, true);
        document.body.appendChild(button);
      });

      afterEach(function () {
        document.body.removeChild(button);
      });

      it('should support addEventListener', function () {
        var hookSpy = jasmine.createSpy('hook');
        var eventListenerSpy = jasmine.createSpy('eventListener');
        var zone = rootZone.fork({
          $addEventListener: function(parentAddEventListener) {
            return function (type, listener) {
              return parentAddEventListener.call(this, type, function() {
                hookSpy();
                listener.apply(this, arguments);
              });
            }
          }
        });

        zone.run(function() {
          button.addEventListener('click', eventListenerSpy);
        });
        
        button.dispatchEvent(clickEvent);

        expect(hookSpy).toHaveBeenCalled();
        expect(eventListenerSpy).toHaveBeenCalled();
      });

      it('should support removeEventListener', function () {
        var hookSpy = jasmine.createSpy('hook');
        var eventListenerSpy = jasmine.createSpy('eventListener');
        var zone = rootZone.fork({
          $removeEventListener: function(parentRemoveEventListener) {
            return function (type, listener) {
              hookSpy();
              return parentRemoveEventListener.call(this, type, listener);
            }
          }
        });

        zone.run(function() {
          button.addEventListener('click', eventListenerSpy);
          button.removeEventListener('click', eventListenerSpy);
        });

        button.dispatchEvent(clickEvent);

        expect(hookSpy).toHaveBeenCalled();
        expect(eventListenerSpy).not.toHaveBeenCalled();
      });
    });
  });


  it('should allow zones to be run from within another zone', function () {
    var zoneA = global.zone.fork();
    var zoneB = global.zone.fork();

    zoneA.run(function () {
      zoneB.run(function () {
        expect(global.zone).toBe(zoneB);
      });
      expect(global.zone).toBe(zoneA);
    });
    expect(global.zone).toBe(rootZone);
  });


  describe('isRootZone', function() {

    it('should return true for root zone', function() {
      expect(global.zone.isRootZone()).toBe(true);
    });


    it('should return false for non-root zone', function() {
      var executed = false;

      global.zone.fork().run(function() {
        executed = true;
        expect(global.zone.isRootZone()).toBe(false);
      });

      expect(executed).toBe(true);
    });
  });


  describe('bind', function() {

    it('should execute all callbacks from root zone without forking zones', function(done) {
      // using setTimeout for the test which relies on patching via bind
      expect(global.zone.isRootZone()).toBe(true);
      setTimeout(function() {
        expect(global.zone.isRootZone()).toBe(true);
        done();
      });
    });


    it('should fork a zone for non-root zone', function(done) {
      // using setTimeout for the test which relies on patching via bind
      var childZone = global.zone.fork();
      childZone.run(function() {
        setTimeout(function() {
          expect(global.zone).toBeDirectChildOf(childZone);
          done();
        });
      });
    });


    it('should throw if argument is not a function', function () {
      expect(function () {
        (<Function>global.zone.bind)(11);
      }).toThrowError('Expecting function got: 11');
    });
  });


  describe('fork', function () {
    it('should fork deep copy', function () {
      var protoZone = { too: { deep: true } };
      var zoneA = global.zone.fork(protoZone);
      var zoneB = global.zone.fork(protoZone);

      expect(zoneA['too']).not.toBe(zoneB['too']);
      expect(zoneA['too']).toEqual(zoneB['too']);
    });
  });

  describe('bindPromiseFn', function () {
    var mockPromise = function() {
      return {
        then: function (a, b) {
          (<any>global).zone.setTimeoutUnpatched(a, 0);
          return mockPromise();
        }
      };
    };

    it('should return a method that returns promises that run in the correct zone', function (done) {
      var zoneA = global.zone.fork();

      zoneA.run(function () {
        var patched = Zone.bindPromiseFn(function() {
          return mockPromise();
        });

        patched().then(function () {
          expect(global.zone).toBeDirectChildOf(zoneA);
        }).then(function () {
          expect(global.zone).toBeDirectChildOf(zoneA);
          done();
        });
      });
    });
  });

});

function throwError () {
  throw new Error();
}
