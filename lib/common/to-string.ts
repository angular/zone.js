/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {zoneSymbol} from './utils';

// override Function.prototype.toString to make zone.js patched function
// look like native function
export function patchFuncToString() {
  const originalFunctionToString = Function.prototype.toString;
  const g: any =
      typeof window !== 'undefined' && window || typeof self !== 'undefined' && self || global;
  Function.prototype.toString = function() {
    if (typeof this === 'function') {
      if (this[zoneSymbol('OriginalDelegate')]) {
        return originalFunctionToString.apply(this[zoneSymbol('OriginalDelegate')], arguments);
      }
      if (this === Promise) {
        const nativePromise = g[zoneSymbol('Promise')];
        if (nativePromise) {
          return originalFunctionToString.apply(nativePromise, arguments);
        }
      }
      if (this === Error) {
        const nativeError = g[zoneSymbol('Error')];
        if (nativeError) {
          return originalFunctionToString.apply(nativeError, arguments);
        }
      }
    }
    return originalFunctionToString.apply(this, arguments);
  };
}
