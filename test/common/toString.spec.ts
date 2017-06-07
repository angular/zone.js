/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {zoneSymbol} from '../../lib/common/utils';
import {ifEnvSupports} from '../test-util';

const g: any =
    typeof window !== 'undefined' && window || typeof self !== 'undefined' && self || global;
describe('global function patch', () => {
  describe('isOriginal', () => {
    it('setTimeout toString should be the same with non patched setTimeout', () => {
      expect(Function.prototype.toString.call(setTimeout))
          .toEqual(Function.prototype.toString.call(g[zoneSymbol('setTimeout')]));
    });

    it('MutationObserver toString should be the same with native version',
       ifEnvSupports('MutationObserver', () => {
         const nativeMutationObserver = g[zoneSymbol('MutationObserver')];
         if (typeof nativeMutationObserver === 'function') {
           expect(Function.prototype.toString.call(g['MutationObserver']))
               .toEqual(Function.prototype.toString.call(nativeMutationObserver));
         } else {
           expect(Function.prototype.toString.call(g['MutationObserver']))
               .toEqual(Object.prototype.toString.call(nativeMutationObserver));
         }
       }));
  });

  describe('isNative', () => {
    it('ZoneAwareError toString should look like native', () => {
      expect(Function.prototype.toString.call(Error)).toContain('[native code]');
    });

    it('EventTarget addEventListener should look like native', ifEnvSupports('HTMLElement', () => {
         expect(Function.prototype.toString.call(HTMLElement.prototype.addEventListener))
             .toContain('[native code]');
       }));
  });
});
