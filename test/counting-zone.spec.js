'use strict';

describe('Zone.countingZone', function () {
  var flushSpy, countingZone;

  beforeEach(function () {
    flushSpy = jasmine.createSpy('flush');
    countingZone = zone.fork(Zone.longStackTraceZone).
                        fork(Zone.countingZone).
                        fork({
                          onFlush: flushSpy
                        });
  });

  it('should flush at the end of a run', function () {
    countingZone.run(function () {
      expect(countingZone.counter()).toBe(0);
    });
    expect(countingZone.counter()).toBe(0);
    expect(flushSpy.calls.length).toBe(1);
  });

  it('should work with setTimeout', function () {
    var latch;

    runs(function () {
      countingZone.run(function () {
        setTimeout(function () {
          latch = true;
        }, 0);
        expect(countingZone.counter()).toBe(1);
      });
    });

    waitsFor(function () {
      return latch;
    });

    runs(function () {
      expect(countingZone.counter()).toBe(0);
    })
  });

  it('should work with clearTimeout', function () {
    var latch = false;
    countingZone.run(function () {
      var id = setTimeout(function () {
        latch = true;
      }, 0);
      expect(countingZone.counter()).toBe(1);
      clearTimeout(id);
      expect(countingZone.counter()).toBe(0);
    });
  });


  it('should work with addEventListener', function () {
    var elt = document.createElement('button');
    var clicked = false;

    runs(function () {
      countingZone.run(main);
    });

    function main () {
      expect(countingZone.counter()).toBe(0);
      elt.addEventListener('click', onClick);
      expect(countingZone.counter()).toBe(1);

      elt.click();
      function onClick () {
        expect(countingZone.counter()).toBe(1);
        elt.removeEventListener('click', onClick);
        expect(countingZone.counter()).toBe(0);
        clicked = true;
      }

      expect(countingZone.counter()).toBe(0);
    }

    waitsFor(function () {
      return clicked;
    }, 10, 'the thing');

    runs(function () {
      expect(flushSpy.calls.length).toBe(1);
    });

  });
});
