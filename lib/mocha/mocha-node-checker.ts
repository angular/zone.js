/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
(function(global: any) {
  const isNode: boolean =
      (typeof global.process !== 'undefined' &&
       {}.toString.call(global.process) === '[object process]');
  if (isNode && global && !global.Mocha) {
    try {
      const module = 'mocha';
      // to prevent systemjs to preload the require module
      // which will cause error.
      global.Mocha = require('' + module);
    } catch (err) {
    }
  }
}(typeof window === 'undefined' ? global : window));