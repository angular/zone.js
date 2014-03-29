'use strict';


describe('Zone.countingZone', function () {
  var flushSpy = jasmine.createSpy('flush'),
      countingZone = zone.fork(Zone.countingZone).fork({
        onFlush: flushSpy
      });

  beforeEach(function () {
    jasmine.Clock.useMock();
    flushSpy.reset();
  });

  it('should flush at the end of a run', function () {
    countingZone.run(function () {});
    expect(flushSpy).toHaveBeenCalled();
    expect(countingZone.counter()).toBe(0);
  });

  it('should work', function () {
    countingZone.run(function () {

      setTimeout(function () {}, 0);
      expect(countingZone.counter()).toBe(1);

      //jasmine.Clock.tick(0);

      //expect(countingZone.counter()).toBe(0);
    });

    //jasmine.Clock.tick(0);
  });
});
