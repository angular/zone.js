import {EventEmitter} from 'events';

describe('nodejs EventEmitter', () => {
  let zone, zoneA, zoneB, emitter, expectZoneACount;
  beforeEach(() => {
    zone = Zone.current;
    zoneA = zone.fork({ name: 'A' });
    zoneB = zone.fork({ name: 'B' });

    emitter = new EventEmitter();
    expectZoneACount = 0;
  });

  function expectZoneA(value) {
    expectZoneACount++;
    expect(Zone.current).toBe(zoneA);
    expect(value).toBe('test value');
  }

  function shouldNotRun() {
    fail('this listener should not run');
  }

  it('should register listeners in the current zone', () => {
    zoneA.run(() => {
      emitter.on('test', expectZoneA);
      emitter.addListener('test', expectZoneA);
    });
    zoneB.run(() => emitter.emit('test', 'test value'));
    expect(expectZoneACount).toBe(2);
  });
  it('should remove listeners properly', () => {
    zoneA.run(() => {
      emitter.on('test', shouldNotRun);
      emitter.on('test2', shouldNotRun);
      emitter.removeListener('test', shouldNotRun);
    });
    zoneB.run(() => {
      emitter.removeListener('test2', shouldNotRun);
      emitter.emit('test', 'test value');
      emitter.emit('test2', 'test value');
    });
  });
  it('should return all listeners for an event', () => {
    zoneA.run(() => {
      emitter.on('test', expectZoneA);
    });
    zoneB.run(() => {
      emitter.on('test', shouldNotRun);
    });
    expect(emitter.listeners('test')).toEqual([expectZoneA, shouldNotRun]);
  });
});