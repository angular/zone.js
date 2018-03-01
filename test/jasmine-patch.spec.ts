/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ifEnvSupports} from './test-util';

function supportJasmineSpec() {
  return jasmine && (jasmine as any)['Spec'];
}

(supportJasmineSpec as any).message = 'jasmine spec';

ifEnvSupports(supportJasmineSpec, () => {
  beforeEach(() => {
    // assert that each jasmine run has a task, so that drainMicrotask works properly.
    expect(Zone.currentTask).toBeTruthy();
  });

  describe('jasmine', () => {
    let throwOnAsync = false;
    let beforeEachZone: Zone = null;
    let itZone: Zone = null;
    const syncZone = Zone.current;
    try {
      Zone.current.scheduleMicroTask('dontallow', () => null as void);
    } catch (e) {
      throwOnAsync = true;
    }

    beforeEach(() => beforeEachZone = Zone.current);

    it('should throw on async in describe', () => {
      expect(throwOnAsync).toBe(true);
      expect(syncZone.name).toEqual('syncTestZone for jasmine.describe');
      itZone = Zone.current;
    });

    it('should cope with pending tests, which have no test body');

    afterEach(() => {
      let zone = Zone.current;
      expect(zone.name).toEqual('ProxyZone');
      expect(beforeEachZone.name).toEqual(zone.name);
      expect(itZone).toBe(zone);
    });
  });

  describe('return promise', () => {
    let log: string[];
    beforeEach(() => {
      log = [];
    });

    it('should wait for promise to resolve', () => {
      return new Promise((res, _) => {
        setTimeout(() => {
          log.push('resolved');
          res();
        }, 100);
      });
    });

    afterEach(() => {
      expect(log).toEqual(['resolved']);
    });
  });
})();
