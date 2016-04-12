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


    it('should allow you to override alert/prompt/confirm', function () {
      var alertSpy = jasmine.createSpy('alert');
      var promptSpy = jasmine.createSpy('prompt');
      var confirmSpy = jasmine.createSpy('confirm');
      var spies = {
        'alert': alertSpy,
        'prompt': promptSpy,
        'confirm': confirmSpy
      };
      var myZone = Zone.current.fork({
        name: 'spy',
        onInvoke: (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
                   callback: Function, applyThis: any, applyArgs: any[], source: string): any =>
        {
          if (source) {
            spies[source].apply(null, applyArgs);
          } else {
            return parentZoneDelegate.invoke(targetZone, callback, applyThis, applyArgs, source);
          }
        }
      });

      myZone.run(function () {
        alert('alertMsg');
        prompt('promptMsg', 'default');
        confirm('confirmMsg');
      });

      expect(alertSpy).toHaveBeenCalledWith('alertMsg');
      expect(promptSpy).toHaveBeenCalledWith('promptMsg', 'default');
      expect(confirmSpy).toHaveBeenCalledWith('confirmMsg');
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
          name: 'spy',
          onScheduleTask: (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
                                task: Task): any => {
            hookSpy();
            return parentZoneDelegate.scheduleTask(targetZone, task);
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
          name: 'spy',
          onCancelTask: (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
                              task: Task): any => {
            hookSpy();
            return parentZoneDelegate.cancelTask(targetZone, task);
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
    var zoneA = Zone.current.fork({ name: 'A' });
    var zoneB = Zone.current.fork({ name: 'B' });

    zoneA.run(function () {
      zoneB.run(function () {
        expect(Zone.current).toBe(zoneB);
      });
      expect(Zone.current).toBe(zoneA);
    });
    expect(Zone.current).toBe(rootZone);
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
      var childZone = testZone.fork({name: 'B', properties: { key: 'override' }});
      expect(testZone.get('key')).toEqual('value');
      expect(childZone.get('key')).toEqual('override');
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
