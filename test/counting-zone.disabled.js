'use strict';

describe('Zone.countingZone', function () {
  function makeCountingZone() {
    return zone.fork(Zone.longStackTraceZone).
                fork(Zone.countingZone);
  }

  it('should flush at the end of a run', function (done) {
    makeCountingZone().fork({
      onFlush: done
    }).run(function () { });
  });


  it('should work with setTimeout', function (done) {
    var countingZone = makeCountingZone();
    countingZone.run(function () {
      setTimeout(function () {
        expect(countingZone.counter()).toBe(0);
        done();
      }, 0);
      expect(countingZone.counter()).toBe(1);
    });
  });


  it('should work with clearTimeout', function (done) {
    var countingZone = makeCountingZone();

    makeCountingZone().run(function () {
      var id = setTimeout(function () {}, 0);
      expect(countingZone.counter()).toBe(1);
      clearTimeout(id);
      expect(countingZone.counter()).toBe(0);
      done();
    });
  });


  it('should work with setInterval', function (done) {
    var latch = 0,
        countingZone = makeCountingZone(),
        id;

    countingZone.run(function () {
      expect(countingZone.counter()).toBe(0);

      id = setInterval(function () {
        latch += 1;

        // setInterval should run multiple times
        if (latch === 2) {
          finish();
        }
      }, 0);

      expect(countingZone.counter()).toBe(1);
    });

    function finish() {
      expect(countingZone.counter()).toBe(1);
      clearInterval(id);
      done();
    }
  });


  it('should work with clearInterval', function (done) {
    var id;
    countingZone.run(function () {
      id = setInterval(function () {
        latch += 1;
      }, 0);
      expect(countingZone.counter()).toBe(1);
      clearInterval(id);
      expect(countingZone.counter()).toBe(0);
      done();
    });
  });


  it('should work with addEventListener', function (done) {
    var elt = document.createElement('button');
    expect(countingZone.counter()).toBe(0);
    countingZone.run(main);

    function main () {
      expect(countingZone.counter()).toBe(0);
      elt.addEventListener('click', onClick);
      expect(countingZone.counter()).toBe(1);

      elt.click();
      function onClick () {
        expect(countingZone.counter()).toBe(1);
        elt.removeEventListener('click', onClick);
        expect(countingZone.counter()).toBe(0);

        done();
        clicked = true;
      }

      expect(countingZone.counter()).toBe(0);
    }
  });
});
