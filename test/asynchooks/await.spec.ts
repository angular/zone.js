/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

describe('native async/await', function() {
  const log: string[] = [];
  const zone = Zone.current.fork({
    name: 'promise',
    onScheduleTask: (delegate: ZoneDelegate, curr: Zone, target: Zone, task: any) => {
      log.push('scheduleTask');
      return delegate.scheduleTask(target, task);
    },
    onInvokeTask: (delegate: ZoneDelegate, curr: Zone, target: Zone, task: any, applyThis: any,
                   applyArgs: any) => {
      log.push('invokeTask');
      return delegate.invokeTask(target, task, applyThis, applyArgs);
    }
  });

  it('should still in zone after await', function(done) {
    async function asyncOutside() {
      return 'asyncOutside';
    }
    
    const neverResolved = new Promise(() => {});
    const waitForNever = new Promise((res, _) => {
      res(neverResolved);
    });
    
    async function getNever() {
      return waitForNever;
    };

    zone.run(async() => {
      const outside = await asyncOutside();
      expect(outside).toEqual('asyncOutside');
      expect(Zone.current.name).toEqual(zone.name);

      async function asyncInside() {
        return 'asyncInside';
      };

      const inside = await asyncInside();
      expect(inside).toEqual('asyncInside');
      expect(Zone.current.name).toEqual(zone.name);

      expect(log).toEqual(['scheduleTask', 'invokeTask', 'scheduleTask', 'invokeTask']);

      done();
    });
  });
});