/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
// need to patch jasmine.clock().mockDate and jasmine.clock().tick() so
// they can work properly in FakeAsyncTest
export function patchJasmineClock(jasmine: any, global: any) {
  const symbol = Zone.__symbol__;
  const originalClockFn: Function = ((jasmine as any)[symbol('clock')] = jasmine['clock']);
  (jasmine as any)['clock'] = function() {
    const clock = originalClockFn.apply(this, arguments);
    if (!clock[symbol('patched')]) {
      clock[symbol('patched')] = symbol('patched');
      const originalTick = (clock[symbol('tick')] = clock.tick);
      clock.tick = function() {
        const fakeAsyncZoneSpec = Zone.current.get('FakeAsyncTestZoneSpec');
        if (fakeAsyncZoneSpec) {
          return fakeAsyncZoneSpec.tick.apply(fakeAsyncZoneSpec, arguments);
        }
        return originalTick.apply(this, arguments);
      };
      const originalMockDate = (clock[symbol('mockDate')] = clock.mockDate);
      clock.mockDate = function() {
        const fakeAsyncZoneSpec = Zone.current.get('FakeAsyncTestZoneSpec');
        if (fakeAsyncZoneSpec) {
          const dateTime = arguments.length > 0 ? arguments[0] : new Date();
          return fakeAsyncZoneSpec.setCurrentRealTime.apply(
              fakeAsyncZoneSpec,
              dateTime && typeof dateTime.getTime === 'function' ? [dateTime.getTime()] :
                                                                   arguments);
        }
        return originalMockDate.apply(this, arguments);
      };
      // for auto go into fakeAsync feature, we need the flag to enable it
      ['install', 'uninstall'].forEach(methodName => {
        const originalClockFn: Function = (clock[symbol(methodName)] = clock[methodName]);
        clock[methodName] = function () {
          const enableClockPatch = global[symbol('fakeAsyncPatchLock')] === true;
          const FakeAsyncTestZoneSpec = (Zone as any)['FakeAsyncTestZoneSpec'];
          if (enableClockPatch && FakeAsyncTestZoneSpec) {
            (jasmine as any)[symbol('clockInstalled')] = 'install' === methodName;
            return;
          }
          return originalClockFn.apply(this, arguments);
        };
      });
    }
    return clock;
  };
}
