/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {zoneSymbol} from '../../lib/common/utils';

describe('process related test', () => {
  let zoneA, result;
  beforeEach(() => {
    zoneA = Zone.current.fork({name: 'zoneA'});
    result = [];
  });
  it('process.nextTick callback should in zone', (done) => {
    zoneA.run(function() {
      process.nextTick(() => {
        expect(Zone.current.name).toEqual('zoneA');
        done();
      });
    });
  });
  it('process.nextTick should be excuted before macroTask and promise', (done) => {
    zoneA.run(function() {
      setTimeout(() => {
        result.push('timeout');
      }, 0);
      process.nextTick(() => {
        result.push('tick');
      });
      setTimeout(() => {
        expect(result).toEqual(['tick', 'timeout']);
        done();
      });
    });
  });
  it('process.nextTick should be treated as microTask', (done) => {
    let zoneTick = Zone.current.fork({
      name: 'zoneTick',
      onScheduleTask: (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
                       task: Task): Task => {
        result.push({callback: 'scheduleTask', targetZone: targetZone.name, task: task.source});
        return parentZoneDelegate.scheduleTask(targetZone, task);
      },
      onInvokeTask: (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
                     task: Task, applyThis?: any, applyArgs?: any): any => {
        result.push({callback: 'invokeTask', targetZone: targetZone.name, task: task.source});
        return parentZoneDelegate.invokeTask(targetZone, task, applyThis, applyArgs);
      }
    });
    zoneTick.run(() => {
      process.nextTick(() => {
        result.push('tick');
      });
    });
    setTimeout(() => {
      expect(result.length).toBe(3);
      expect(result[0]).toEqual(
          {callback: 'scheduleTask', targetZone: 'zoneTick', task: 'process.nextTick'});
      expect(result[1]).toEqual(
          {callback: 'invokeTask', targetZone: 'zoneTick', task: 'process.nextTick'});
      done();
    });
  });
  it('should support window.addEventListener(unhandledrejection)', function(done) {
    const hookSpy = jasmine.createSpy('hook');
    Zone[zoneSymbol('ignoreConsoleErrorUncaughtError')] = true;
    Zone.current.fork({name: 'promise'}).run(function() {
      process.on('unhandledRejection', function(reason, promise) {
        hookSpy(promise, reason.message);
      });
      const p = new Promise((resolve, reject) => {
        throw new Error('promise error');
      });

      setTimeout(function() {
        expect(hookSpy).toHaveBeenCalledWith(p, 'promise error');
        done();
      }, 10);
    });
  });

  it('should support window.addEventListener(rejectionHandled)', function(done) {
    Zone[zoneSymbol('ignoreConsoleErrorUncaughtError')] = true;
    Zone.current.fork({name: 'promise'}).run(function() {
      process.on('rejectionHandled', function(promise) {
        expect(promise).toEqual(p);
        done();
      });
      const p = new Promise((resolve, reject) => {
        throw new Error('promise error');
      });

      setTimeout(function() {
        p.catch(reason => {});
      }, 10);
    });
  });
});