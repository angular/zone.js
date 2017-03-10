/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ifEnvSupports} from './test-util';

ifEnvSupports(() => jasmine && (jasmine as any)['Spec'], () => {
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
      expect(beforeEachZone).toBe(zone);
      expect(itZone).toBe(zone);
    });

  });
})();
