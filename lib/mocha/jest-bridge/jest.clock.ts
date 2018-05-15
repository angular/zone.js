/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
export function addJestTimer(jest: any, global: any) {
  const {resetFakeAsyncZone, flushMicrotasks, discardPeriodicTasks, tick, flush, fakeAsync} =
      (Zone as any)[Zone.__symbol__('fakeAsyncTest')];
  const FakeAsyncTestZoneSpec = (Zone as any)['FakeAsyncTestZoneSpec'];
  const ProxyZoneSpec = (Zone as any)['ProxyZoneSpec'];

  function getFakeAsyncTestZoneSpec() {
    return Zone.current.get('FakeAsyncTestZoneSpec');
  }

  jest.clearAllTimers = function() {
    clearAllMacrotasks();
  };

  jest.runAllTimers = function() {
    const zs = getFakeAsyncTestZoneSpec();
    if (!zs) {
      return;
    }
    if (zs.pendingPeriodicTimers.length > 0) {
      throw new Error('Can not runAllTimers when having interval timers.');
    }
    // flush non-perodic-tasks with 10000 maxTurns
    flush(10000);
  };

  jest.runOnlyPendingTimers = function() {
    const zs = getFakeAsyncTestZoneSpec();
    if (!zs) {
      return;
    }
    // flush both periodic tasks and non-perodic-tasks
    flush(10000, true);
  };

  jest.advanceTimersByTime = function(msToRun: number, doTick?: (elapsed: number) => void) {
    const zs = getFakeAsyncTestZoneSpec();
    if (!zs) {
      return;
    }
    tick(msToRun, doTick);
  };

  jest.runAllTicks = function() {
    const zs = getFakeAsyncTestZoneSpec();
    if (!zs) {
      return;
    }
    flushMicrotasks();
  };

  jest.useFakeTimers = function() {
    const zs = getFakeAsyncTestZoneSpec();
    if (zs) {
      return;
    }
    /**
     * a wrapper of jasmine.clock().install()
     */
    global['__zone_symbol__originFakeAsyncPatchLock'] = global['__zone_symbol__fakeAsyncPatchLock'];
    global['__zone_symbol__fakeAsyncPatchLock'] = true;
    global.jasmine && global.jasmine.clock().install();
  };

  jest.useRealTimers = function () {
    global['__zone_symbol__fakeAsyncPatchLock'] = global['__zone_symbol__originFakeAsyncPatchLock'];
    global.jasmine && global.jasmine.clock().uninstall();
  };
}