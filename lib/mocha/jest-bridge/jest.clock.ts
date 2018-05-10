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
    const zs = getFakeAsyncTestZoneSpec();
    if (!zs) {
      return;
    }
    // TODO: @JiaLiPassion, add clear method in fakeAsyncZoneSpec
    // flush();
  };

  jest.runAllTimers = function() {
    const zs = getFakeAsyncTestZoneSpec();
    if (!zs) {
      return;
    }
    // TODO: @JiaLiPassion, now flush can only flush
    // non periodic timers, should flush periodic too.
    flush();
  };

  jest.runAllImmediates = function() {
    const zs = getFakeAsyncTestZoneSpec();
    if (!zs) {
      return;
    }
    // TODO: @JiaLiPassion, should we support this one?
    flush();
  };

  jest.runOnlyPendingTimers = function() {
    const zs = getFakeAsyncTestZoneSpec();
    if (!zs) {
      return;
    }
    // TODO: @JiaLiPassion, should we support this one?
    flush();
  };

  jest.advanceTimersByTime = function(msToRun: number) {
    const zs = getFakeAsyncTestZoneSpec();
    if (!zs) {
      return;
    }
    tick(msToRun);
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
    const fakeAsyncTestZoneSpec = new FakeAsyncTestZoneSpec()
    const proxyZoneSpec = ProxyZoneSpec.get();
    jest.__zone_symbol__last_delegate_spec = proxyZoneSpec.getDelegate();
    proxyZoneSpec.setDelegate(fakeAsyncTestZoneSpec);
    fakeAsyncTestZoneSpec.lockDatePatch();
  };

  jest.useRealTimers = function() {
    const zs = getFakeAsyncTestZoneSpec();
    if (!zs) {
      throw new Error('Must use real timers in the same block with useFakeTimers');
    }
    const proxyZoneSpec = ProxyZoneSpec.get();
    const lastDelegate = jest.__zone_symbol__last_delegate_spec;
    jest.__zone_symbol__last_delegate_spec = null;
    proxyZoneSpec.setDelegate(lastDelegate);
    zs.unlockDatePatch();
  }
}