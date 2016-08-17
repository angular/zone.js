import {zoneSymbol} from '../../lib/common/utils';

describe('Zone', function () {
  var rootZone = Zone.current;

  it('should have a name', function () {
    expect(Zone.current.name).toBeDefined();
  });

  describe('hooks', function () {

    it('should throw if onError is not defined', function () {
      expect(function () {
        Zone.current.run(throwError);
      }).toThrow();
    });


    it('should fire onError if a function run by a zone throws', function () {
      var errorSpy = jasmine.createSpy('error');
      var myZone = Zone.current.fork({
        name: 'spy',
        onHandleError: errorSpy
      });

      expect(errorSpy).not.toHaveBeenCalled();

      expect(function () {
        myZone.runGuarded(throwError);
      }).not.toThrow();

      expect(errorSpy).toHaveBeenCalled();
    });
  });

  it('should allow zones to be run from within another zone', function () {
    var zone = Zone.current;
    var zoneA = zone.fork({ name: 'A' });
    var zoneB = zone.fork({ name: 'B' });

    zoneA.run(function () {
      zoneB.run(function () {
        expect(Zone.current).toBe(zoneB);
      });
      expect(Zone.current).toBe(zoneA);
    });
    expect(Zone.current).toBe(zone);
  });


  describe('wrap', function() {
    it('should throw if argument is not a function', function () {
      expect(function () {
        (<Function>Zone.current.wrap)(11);
      }).toThrowError('Expecting function got: 11');
    });
  });


  describe('get', function () {
    it('should store properties', function () {
      var testZone = Zone.current.fork({name: 'A', properties: { key: 'value' }});
      expect(testZone.get('key')).toEqual('value');
      expect(testZone.getZoneWith('key')).toEqual(testZone);
      var childZone = testZone.fork({name: 'B', properties: { key: 'override' }});
      expect(testZone.get('key')).toEqual('value');
      expect(testZone.getZoneWith('key')).toEqual(testZone);
      expect(childZone.get('key')).toEqual('override');
      expect(childZone.getZoneWith('key')).toEqual(childZone);
    });
  });

  describe('task', () => {
    function noop() {}
    var log;
    var zone: Zone = Zone.current.fork({
      name: 'parent',
      onHasTask: (delegate: ZoneDelegate, current: Zone, target: Zone,
                  hasTaskState: HasTaskState): void => {
        hasTaskState['zone'] = target.name;
        log.push(hasTaskState);
      },
      onScheduleTask: (delegate: ZoneDelegate, current: Zone, target: Zone, task: Task) => {
        // Do nothing to prevent tasks from being run on VM turn;
        // Tests run task explicitly.
        return task;
      }
    });

    beforeEach(() => {
      log = [];
    });

    it('should prevent double cancellation', () => {
      var task = zone.scheduleMacroTask('test', () => log.push('macroTask'), null, noop, noop);
      zone.cancelTask(task);
      try {
        zone.cancelTask(task);
      } catch (e) {
        expect(e.message).toContain('already canceled');
      }
    });

    it('should not decrement counters on periodic tasks', () => {
      zone.run(() => {
        var task = zone.scheduleMacroTask('test', () => log.push('macroTask'), {
          isPeriodic: true
        }, noop, noop);
        zone.runTask(task);
        zone.runTask(task);
        zone.cancelTask(task);
      });
      expect(log).toEqual([
        { microTask: false, macroTask: true, eventTask: false, change: 'macroTask', zone: 'parent' },
        'macroTask',
        'macroTask',
        { microTask: false, macroTask: false, eventTask: false, change: 'macroTask', zone: 'parent' }
      ]);
    });

    it('should notify of queue status change', () => {
      zone.run(() => {
        var z = Zone.current;
        z.runTask(z.scheduleMicroTask('test', () => log.push('microTask')));
        z.cancelTask(z.scheduleMacroTask('test', () => log.push('macroTask'), null, noop, noop));
        z.cancelTask(z.scheduleEventTask('test', () => log.push('eventTask'), null, noop, noop));
      });
      expect(log).toEqual([
        { microTask: true, macroTask: false, eventTask: false, change: 'microTask', zone: 'parent' },
        'microTask',
        { microTask: false, macroTask: false, eventTask: false, change: 'microTask', zone: 'parent' },
        { microTask: false, macroTask: true, eventTask: false, change: 'macroTask', zone: 'parent' },
        { microTask: false, macroTask: false, eventTask: false, change: 'macroTask', zone: 'parent' },
        { microTask: false, macroTask: false, eventTask: true, change: 'eventTask', zone: 'parent' },
        { microTask: false, macroTask: false, eventTask: false, change: 'eventTask', zone: 'parent' }
      ]);
    });

    it('should notify of queue status change on parent task', () => {
      zone.fork({name: 'child'}).run(() => {
        var z = Zone.current;
        z.runTask(z.scheduleMicroTask('test', () => log.push('microTask')));
      });
      expect(log).toEqual([
        { microTask: true, macroTask: false, eventTask: false, change: 'microTask', zone: 'child' },
        { microTask: true, macroTask: false, eventTask: false, change: 'microTask', zone: 'parent' },
        'microTask',
        { microTask: false, macroTask: false, eventTask: false, change: 'microTask', zone: 'child' },
        { microTask: false, macroTask: false, eventTask: false, change: 'microTask', zone: 'parent' },
      ]);
    });
  });
});

function throwError () {
  throw new Error();
}
