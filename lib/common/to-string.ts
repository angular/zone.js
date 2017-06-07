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
Zone.__load_patch('toString', (global: any, Zone: ZoneType, api: _ZonePrivate) => {
  // patch Func.prototype.toString to let them look like native
  const originalFunctionToString = Function.prototype.toString;
  Function.prototype.toString = function() {
    if (typeof this === 'function') {
      const originalDelegate = this[zoneSymbol('OriginalDelegate')];
      if (originalDelegate) {
        if (typeof originalDelegate === 'function') {
          return originalFunctionToString.apply(this[zoneSymbol('OriginalDelegate')], arguments);
        } else {
          return Object.prototype.toString.call(originalDelegate);
        }
      }
      if (this === Promise) {
        const nativePromise = global[zoneSymbol('Promise')];
        if (nativePromise) {
          return originalFunctionToString.apply(nativePromise, arguments);
        }
      }
      if (this === Error) {
        const nativeError = global[zoneSymbol('Error')];
        if (nativeError) {
          return originalFunctionToString.apply(nativeError, arguments);
        }
      }
    }
    return originalFunctionToString.apply(this, arguments);
  };


  // patch Object.prototype.toString to let them look like native
  const originalObjectToString = Object.prototype.toString;
  Object.prototype.toString = function() {
    if (this instanceof Promise) {
      return '[object Promise]';
    }
    return originalObjectToString.apply(this, arguments);
  };
});
