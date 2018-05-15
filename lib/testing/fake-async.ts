/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import '../zone-spec/fake-async-test';

Zone.__load_patch('fakeasync', (global: any, Zone: ZoneType, api: _ZonePrivate) => {
  const FakeAsyncTestZoneSpec = Zone && (Zone as any)['FakeAsyncTestZoneSpec'];
  type ProxyZoneSpec = {
    setDelegate(delegateSpec: ZoneSpec): void; getDelegate(): ZoneSpec; resetDelegate(): void;
  };
  const ProxyZoneSpec: {get(): ProxyZoneSpec; assertPresent: () => ProxyZoneSpec} =
      Zone && (Zone as any)['ProxyZoneSpec'];

  let _fakeAsyncTestZoneSpec: any = null;

  /**
   * Clears out the shared fake async zone for a test.
   * To be called in a global `beforeEach`.
   *
   * @experimental
   */
  function resetFakeAsyncZone() {
    if (_fakeAsyncTestZoneSpec) {
      _fakeAsyncTestZoneSpec.unlockDatePatch();
    }
    _fakeAsyncTestZoneSpec = null;
    // in node.js testing we may not have ProxyZoneSpec in which case there is nothing to reset.
    ProxyZoneSpec && ProxyZoneSpec.assertPresent().resetDelegate();
  }

  /**
   * Wraps a function to be executed in the fakeAsync zone:
   * - microtasks are manually executed by calling `flushMicrotasks()`,
   * - timers are synchronous, `tick()` simulates the asynchronous passage of time.
   *
   * If there are any pending timers at the end of the function, an exception will be thrown.
   *
   * Can be used to wrap inject() calls.
   *
   * ## Example
   *
   * {@example core/testing/ts/fake_async.ts region='basic'}
   *
   * @param fn
   * @returns The function wrapped to be executed in the fakeAsync zone
   *
   * @experimental
   */
  function fakeAsync(fn: Function, options: {
    checkNested?: boolean,
    checkRemainingMacrotasks?: boolean
  } = {checkNested: true, checkRemainingMacrotasks: true}): (...args: any[]) => any {
    // Not using an arrow function to preserve context passed from call site
    if (global['__zone_symbol__fakeAsyncCheckRemaining'] === false) {
      options.checkRemainingMacrotasks = false;
    }
    return function(...args: any[]) {
      const proxyZoneSpec = ProxyZoneSpec.assertPresent();
      if (Zone.current.get('FakeAsyncTestZoneSpec')) {
        if (options.checkNested) {
          throw new Error('fakeAsync() calls can not be nested');
        }
        // already in fakeAsyncZone
        return fn.apply(this, args);
      }
      try {
        // in case jasmine.clock init a fakeAsyncTestZoneSpec
        if (!_fakeAsyncTestZoneSpec) {
          if (proxyZoneSpec.getDelegate() instanceof FakeAsyncTestZoneSpec) {
            if (options.checkNested) {
              throw new Error('fakeAsync() calls can not be nested');
            }
            // already in fakeAsyncZone
            return fn.apply(this, args);
          }

          _fakeAsyncTestZoneSpec = new FakeAsyncTestZoneSpec();
        }

        let res: any;
        const lastProxyZoneSpec = proxyZoneSpec.getDelegate();
        proxyZoneSpec.setDelegate(_fakeAsyncTestZoneSpec);
        _fakeAsyncTestZoneSpec.lockDatePatch();
        try {
          res = fn.apply(this, args);
          flushMicrotasks();
        } finally {
          proxyZoneSpec.setDelegate(lastProxyZoneSpec);
        }

        // TODO: @JiaLiPassion, we don't need to report error here.
        // need to confirm.
        if (options.checkRemainingMacrotasks) {
          if (_fakeAsyncTestZoneSpec.pendingPeriodicTimers.length > 0) {
            throw new Error(
                `${_fakeAsyncTestZoneSpec.pendingPeriodicTimers.length} ` +
                `periodic timer(s) still in the queue.`);
          }

          if (_fakeAsyncTestZoneSpec.pendingTimers.length > 0) {
            throw new Error(
                `${_fakeAsyncTestZoneSpec.pendingTimers.length} timer(s) still in the queue.`);
          }
        }
        return res;
      } finally {
        resetFakeAsyncZone();
      }
    };
  }

  function _getFakeAsyncZoneSpec(): any {
    if (_fakeAsyncTestZoneSpec == null) {
      _fakeAsyncTestZoneSpec = Zone.current.get('FakeAsyncTestZoneSpec');
      if (_fakeAsyncTestZoneSpec == null) {
        throw new Error('The code should be running in the fakeAsync zone to call this function');
      }
    }
    return _fakeAsyncTestZoneSpec;
  }

  /**
   * Simulates the asynchronous passage of time for the timers in the fakeAsync zone.
   *
   * The microtasks queue is drained at the very start of this function and after any timer callback
   * has been executed.
   *
   * ## Example
   *
   * {@example core/testing/ts/fake_async.ts region='basic'}
   *
   * @experimental
   */
  function tick(millis: number = 0, doTick?: (elapsed: number) => void): void {
    _getFakeAsyncZoneSpec().tick(millis, doTick);
  }

  /**
   * Simulates the asynchronous passage of time for the timers in the fakeAsync zone by
   * draining the macrotask queue until it is empty. The returned value is the milliseconds
   * of time that would have been elapsed.
   *
   * @param maxTurns
   * @returns The simulated time elapsed, in millis.
   *
   * @experimental
   */
  function flush(maxTurns?: number, isPeriodic: boolean = false): number {
    return _getFakeAsyncZoneSpec().flush(maxTurns, isPeriodic);
  }

  /**
   * Discard all remaining periodic tasks.
   *
   * @experimental
   */
  function discardPeriodicTasks(): void {
    const zoneSpec = _getFakeAsyncZoneSpec();
    const pendingTimers = zoneSpec.pendingPeriodicTimers;
    zoneSpec.pendingPeriodicTimers.length = 0;
  }

  /**
   * Flush any pending microtasks.
   *
   * @experimental
   */
  function flushMicrotasks(): void {
    _getFakeAsyncZoneSpec().flushMicrotasks();
  }

  /**
   * Clear all microtasks
   *
   * @experimental
   */
  function clearAllMacrotasks(): void {
    _getFakeAsyncZoneSpec().clearAllMacrotasks();
  }

  /**
   * flush all macroTasks and discard periodic tasks
   *
   * @experimental
   */
  function flushAndDiscardPeriodicTasks(): void {
    const fakeAsyncSpec = _getFakeAsyncZoneSpec();
    fakeAsyncSpec.flush(100, true);
    discardPeriodicTasks();
  }


  (Zone as any)[api.symbol('fakeAsyncTest')] =
      {resetFakeAsyncZone, flushMicrotasks, discardPeriodicTasks, tick, flush, fakeAsync, clearAllMacrotasks};

  /**
   * expose those function to global
   */
  global['resetFakeAsyncZone'] = resetFakeAsyncZone;
  global['flushMicrotasks'] = flushMicrotasks;
  global['discardPeriodicTasks'] = discardPeriodicTasks;
  global['tick'] = tick;
  global['flush'] = flush;
  global['fakeAsyncTest'] = fakeAsync;
  global['clearAllMacrotasks'] = clearAllMacrotasks;
  global['flushAndDiscardPeriodicTasks'] = flushAndDiscardPeriodicTasks;
});