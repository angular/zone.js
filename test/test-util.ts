/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/*
 * Usage:
 *
 *  function supportsOnClick() {
 *    const div = document.createElement('div');
 *    const clickPropDesc = Object.getOwnPropertyDescriptor(div, 'onclick');
 *    return !(EventTarget &&
 *             div instanceof EventTarget &&
 *             clickPropDesc && clickPropDesc.value === null);
 *  }
 *  (<any>supportsOnClick).message = 'Supports Element#onclick patching';
 *
 *
 *  ifEnvSupports(supportsOnClick, function() { ... });
 */
declare const global: any;
export function ifEnvSupports(test: any, block: Function) {
  return function() {
    const message = (test.message || test.name || test);
    if (typeof test === 'string' ? !!global[test] : test()) {
      block();
    } else {
      it('should skip the test if the API does not exist', function() {
        console.log('WARNING: skipping ' + message + ' tests (missing this API)');
      });
    }
  };
};
