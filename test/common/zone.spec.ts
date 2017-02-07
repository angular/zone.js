/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {zoneSymbol} from '../../lib/common/utils';

describe('Zone', function() {
  const rootZone = Zone.current;

  it('should have a name', function() {
    expect(Zone.current.name).toBeDefined();
  });

  describe('hooks', function() {

    it('should throw if onError is not defined', function() {
      expect(function() {
        Zone.current.run(throwError);
      }).toThrow();
    });


    it('should fire onError if a function run by a zone throws', function() {
      const errorSpy = jasmine.createSpy('error');
      const myZone = Zone.current.fork({name: 'spy', onHandleError: errorSpy});

      expect(errorSpy).not.toHaveBeenCalled();

      expect(function() {
        myZone.runGuarded(throwError);
      }).not.toThrow();

      expect(errorSpy).toHaveBeenCalled();
    });

    it('should send correct currentZone in hook method when in nested zone', function() {
      const zone = Zone.current;
      const zoneA = zone.fork({
        name: 'A',
        onInvoke: function(
            parentDelegate, currentZone, targetZone, callback, applyThis, applyArgs, source) {
          expect(currentZone.name).toEqual('A');
          return parentDelegate.invoke(targetZone, callback, applyThis, applyArgs, source);
        }
      });
      const zoneB = zoneA.fork({
        name: 'B',
        onInvoke: function(
            parentDelegate, currentZone, targetZone, callback, applyThis, applyArgs, source) {
          expect(currentZone.name).toEqual('B');
          return parentDelegate.invoke(targetZone, callback, applyThis, applyArgs, source);
        }
      });
      const zoneC = zoneB.fork({name: 'C'});
      zoneC.run(function() {});
    });
  });

  it('should allow zones to be run from within another zone', function() {
    const zone = Zone.current;
    const zoneA = zone.fork({name: 'A'});
    const zoneB = zone.fork({name: 'B'});

    zoneA.run(function() {
      zoneB.run(function() {
        expect(Zone.current).toBe(zoneB);
      });
      expect(Zone.current).toBe(zoneA);
    });
    expect(Zone.current).toBe(zone);
  });


  describe('wrap', function() {
    it('should throw if argument is not a function', function() {
      expect(function() {
        (<Function>Zone.current.wrap)(11);
      }).toThrowError('Expecting function got: 11');
    });
  });

  describe('run out side of current zone', function() {
    it('should be able to get root zone', function() {
      Zone.current.fork({name: 'testZone'}).run(function() {
        expect(Zone.root.name).toEqual('<root>');
      });
    });

    it('should be able to get run under rootZone', function() {
      Zone.current.fork({name: 'testZone'}).run(function() {
        Zone.root.run(() => {
          expect(Zone.current.name).toEqual('<root>');
        });
      });
    });

    it('should be able to get run outside of current zone', function() {
      Zone.current.fork({name: 'testZone'}).run(function() {
        Zone.root.fork({name: 'newTestZone'}).run(() => {
          expect(Zone.current.name).toEqual('newTestZone');
          expect(Zone.current.parent.name).toEqual('<root>');
        });
      });
    });
  });

  describe('get', function() {
    it('should store properties', function() {
      const testZone = Zone.current.fork({name: 'A', properties: {key: 'value'}});
      expect(testZone.get('key')).toEqual('value');
      expect(testZone.getZoneWith('key')).toEqual(testZone);
      const childZone = testZone.fork({name: 'B', properties: {key: 'override'}});
      expect(testZone.get('key')).toEqual('value');
      expect(testZone.getZoneWith('key')).toEqual(testZone);
      expect(childZone.get('key')).toEqual('override');
      expect(childZone.getZoneWith('key')).toEqual(childZone);
    });
  });

  describe('task', () => {
    function noop() {}
    let log;
    const zone: Zone = Zone.current.fork({
      name: 'parent',
      onHasTask: (delegate: ZoneDelegate, current: Zone, target: Zone, hasTaskState: HasTaskState):
                     void => {
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
      const task = zone.scheduleMacroTask('test', () => log.push('macroTask'), null, noop, noop);
      zone.cancelTask(task);
      try {
        zone.cancelTask(task);
      } catch (e) {
        expect(e.message).toContain('already canceled');
      }
    });

    it('should not decrement counters on periodic tasks', () => {
      zone.run(() => {
        const task = zone.scheduleMacroTask(
            'test', () => log.push('macroTask'), {isPeriodic: true}, noop, noop);
        zone.runTask(task);
        zone.runTask(task);
        zone.cancelTask(task);
      });
      expect(log).toEqual([
        {microTask: false, macroTask: true, eventTask: false, change: 'macroTask', zone: 'parent'},
        'macroTask', 'macroTask', {
          microTask: false,
          macroTask: false,
          eventTask: false,
          change: 'macroTask',
          zone: 'parent'
        }
      ]);
    });

    it('should notify of queue status change', () => {
      zone.run(() => {
        const z = Zone.current;
        z.runTask(z.scheduleMicroTask('test', () => log.push('microTask')));
        z.cancelTask(z.scheduleMacroTask('test', () => log.push('macroTask'), null, noop, noop));
        z.cancelTask(z.scheduleEventTask('test', () => log.push('eventTask'), null, noop, noop));
      });
      expect(log).toEqual([
        {microTask: true, macroTask: false, eventTask: false, change: 'microTask', zone: 'parent'},
        'microTask',
        {microTask: false, macroTask: false, eventTask: false, change: 'microTask', zone: 'parent'},
        {microTask: false, macroTask: true, eventTask: false, change: 'macroTask', zone: 'parent'},
        {microTask: false, macroTask: false, eventTask: false, change: 'macroTask', zone: 'parent'},
        {microTask: false, macroTask: false, eventTask: true, change: 'eventTask', zone: 'parent'},
        {
          microTask: false,
          macroTask: false,
          eventTask: false,
          change: 'eventTask',
          zone: 'parent'
        }
      ]);
    });

    it('should notify of queue status change on parent task', () => {
      zone.fork({name: 'child'}).run(() => {
        const z = Zone.current;
        z.runTask(z.scheduleMicroTask('test', () => log.push('microTask')));
      });
      expect(log).toEqual([
        {microTask: true, macroTask: false, eventTask: false, change: 'microTask', zone: 'child'},
        {microTask: true, macroTask: false, eventTask: false, change: 'microTask', zone: 'parent'},
        'microTask',
        {microTask: false, macroTask: false, eventTask: false, change: 'microTask', zone: 'child'},
        {microTask: false, macroTask: false, eventTask: false, change: 'microTask', zone: 'parent'},
      ]);
    });

    describe('assert ZoneAwarePromise', () => {
      it('should not throw when all is OK', () => {
        Zone.assertZonePatched();
      });

      it('should throw when Promise has been patched', () => {
        class WrongPromise {}

        const ZoneAwarePromise = global.Promise;
        global.Promise = WrongPromise;
        try {
          expect(ZoneAwarePromise).toBeTruthy();
          expect(() => Zone.assertZonePatched()).toThrow();
        } finally {
          // restore it.
          global.Promise = ZoneAwarePromise;
        }
        Zone.assertZonePatched();
      });
    });
  });

  describe('invoking tasks', () => {
    let log;
    function noop() {}


    beforeEach(() => {
      log = [];
    });

    it('should not drain the microtask queue too early', () => {
      const z = Zone.current;
      const event = z.scheduleEventTask('test', () => log.push('eventTask'), null, noop, noop);

      z.scheduleMicroTask('test', () => log.push('microTask'));

      const macro = z.scheduleMacroTask('test', () => {
        event.invoke();
        // At this point, we should not have invoked the microtask.
        expect(log).toEqual(['eventTask']);
      }, null, noop, noop);

      macro.invoke();
    });

    it('should convert task to json without cyclic error', () => {
      const z = Zone.current;
      const event = z.scheduleEventTask('test', () => {}, null, noop, noop);
      const micro = z.scheduleMicroTask('test', () => {});
      const macro = z.scheduleMacroTask('test', () => {}, null, noop, noop);
      expect(function() {
        JSON.stringify(event);
      }).not.toThrow();
      expect(function() {
        JSON.stringify(micro);
      }).not.toThrow();
      expect(function() {
        JSON.stringify(macro);
      }).not.toThrow();
    });
  });
});

function throwError() {
  throw new Error();
}
