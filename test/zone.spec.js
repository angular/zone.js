'use strict';

var util = require('./util');
var zone = require('../lib/zone');

describe('Zone', function () {
  var rootZone = global.zone;

  it('should have an id', function () {
    expect(rootZone.$id).toBeDefined();
  });

  it('forked zones should have a greater id than their parent', function () {
    expect(rootZone.fork().$id).toBeGreaterThan(rootZone.$id);
  });

  describe('core hooks', function () {

    it('should fire beforeTask before a zone runs a function', function () {
      var enterSpy = jasmine.createSpy();
      var myZone = rootZone.fork({
        beforeTask: enterSpy
      });

      expect(enterSpy).not.toHaveBeenCalled();

      myZone.run(function () {
        expect(enterSpy).toHaveBeenCalled();
      });
    });


    it('should fire afterTask after a zone runs a function', function () {
      var leaveSpy = jasmine.createSpy();
      var myZone = rootZone.fork({
        afterTask: leaveSpy
      });

      myZone.run(function () {
        expect(leaveSpy).not.toHaveBeenCalled();
      });

      expect(leaveSpy).toHaveBeenCalled();
    });


    it('should fire onZoneCreated when a zone is forked', function (done) {
      var createdSpy = jasmine.createSpy();
      var counter = 0;
      var myZone = rootZone.fork({
        onZoneCreated: function () {
          counter += 1;
        },
        afterTask: function () {
          counter -= 1;
        }
      });

      myZone.run(function () {

        expect(counter).toBe(0);

        setTimeout(function () {}, 0);
        expect(counter).toBe(1);

        setTimeout(function () {
          expect(counter).toBe(0);
          setTimeout(done, 5);
          expect(counter).toBe(1);
        }, 0);
        expect(counter).toBe(2);
      });
    });


    it('should throw if onError is not defined', function () {
      expect(function () {
        rootZone.run(throwError);
      }).toThrow();
    });


    it('should fire onError if a function run by a zone throws', function () {
      var errorSpy = jasmine.createSpy();
      var myZone = rootZone.fork({
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
      var myZone = rootZone.fork({
        alert: spy
      });

      myZone.run(function () {
        alert('foo');
      });

      expect(spy).toHaveBeenCalled();
    });
  });


  it('should allow zones to be run from within another zone', function () {
    var zoneA = rootZone.fork();
    var zoneB = rootZone.fork();

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
      expect(rootZone.isRootZone()).toBe(true);
    });


    it('should return false for non-root zone', function() {
      var executed = false;

      rootZone.fork().run(function() {
        executed = true;
        expect(global.zone.isRootZone()).toBe(false);
      });

      expect(executed).toBe(true);
    });
  });


  describe('bind', function() {

    it('should execute all callbacks from root zone without forking zones', function(done) {
      // using setTimeout for the test which relies on patching via bind
      setTimeout(function() {
        expect(global.zone.isRootZone()).toBe(true);
        done();
      });
    });


    it('should fork a zone for non-root zone', function(done) {
      // using setTimeout for the test which relies on patching via bind
      var childZone = rootZone.fork();
      childZone.run(function() {
        setTimeout(function() {
          expect(global.zone).toBeDirectChildOf(childZone);
          done();
        });
      });
    });


    it('should throw if argument is not a function', function () {
      expect(function () {
        global.zone.bind(11);
      }).toThrowError('Expecting function got: 11');
    });
  });


  describe('fork', function () {
    it('should fork deep copy', function () {
      var protoZone = { too: { deep: true } };
      var zoneA = rootZone.fork(protoZone);
      var zoneB = rootZone.fork(protoZone);

      expect(zoneA.too).not.toBe(zoneB.too);
      expect(zoneA.too).toEqual(zoneB.too);
    });
  });

  describe('bindPromiseFn', function () {
    var mockPromise = function() {
      return {
        then: function (a, b) {
          util.setTimeout(a, 0);
          return mockPromise();
        }
      };
    };

    it('should return a method that returns promises that run in the correct zone', function (done) {
      var zoneA = rootZone.fork();

      zoneA.run(function () {
        var patched = zone.Zone.bindPromiseFn(function() {
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
