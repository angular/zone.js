/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

'use strict';
(function(global) {
  const NativeError = global['Error'];
  NativeError.customProperty = 'customProperty';
  NativeError.customFunction = function() {};
})(typeof window === 'object' && window || typeof self === 'object' && self || global);
