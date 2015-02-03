'use strict';

describe('Zone', function () {

  beforeEach(function () {
    zone.mark = 'root';
  });

  describe('hooks', function () {

    it('should fire beforeTask before a zone runs a function', function () {
      var enterSpy = jasmine.createSpy();
      var myZone = zone.fork({
        beforeTask: enterSpy
      });

      expect(enterSpy).not.toHaveBeenCalled();

      myZone.run(function () {
        expect(enterSpy).toHaveBeenCalled();
      });
    });


    it('should fire afterTask after a zone runs a function', function () {
      var leaveSpy = jasmine.createSpy();
      var myZone = zone.fork({
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
      var myZone = zone.fork({
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


  describe('fork', function () {
    it('should fork deep copy', function () {
      var protoZone = { too: { deep: true } },
          a = zone.fork(protoZone),
          b = zone.fork(protoZone);

      expect(a.too).not.toBe(b.too);
      expect(a.too).toEqual(b.too);
    });
  });

});

function throwError () {
  throw new Error();
}
