/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

'use strict';
(function(global: any) {
  // add custom properties to Native Error
  const NativeError = global['Error'];
  NativeError.customProperty = 'customProperty';
  NativeError.customFunction = function() {};

  // add fake cordova polyfill for test
  const fakeCordova = function() {};

  (fakeCordova as any).exec = function(
      success: Function, error: Function, service: string, action: string, args: any[]) {
    if (action === 'successAction') {
      success();
    } else {
      error();
    }
  };

  global.cordova = fakeCordova;
})(typeof window === 'object' && window || typeof self === 'object' && self || global);
