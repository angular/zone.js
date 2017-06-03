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
export function ifEnvSupports(test: any, block: Function): () => void {
  return _ifEnvSupports(test, block);
}

export function ifEnvSupportsWithDone(test: any, block: Function): (done: Function) => void {
  return _ifEnvSupports(test, block, true);
}

function _ifEnvSupports(test: any, block: Function, withDone = false) {
  if (withDone) {
    return function(done?: Function) {
      _runTest(test, block, done);
    };
  } else {
    return function() {
      _runTest(test, block, undefined);
    };
  }
}

function _runTest(test: any, block: Function, done: Function) {
  const message = (test.message || test.name || test);
  if (typeof test === 'string' ? !!global[test] : test()) {
    if (done) {
      block(done);
    } else {
      block();
    }
  } else {
    done && done();
    it('should skip the test if the API does not exist', function() {
      console.log('WARNING: skipping ' + message + ' tests (missing this API)');
    });
  }
}

export function supportPatchXHROnProperty() {
  let desc = Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, 'onload');
  if (!desc && (window as any)['XMLHttpRequestEventTarget']) {
    desc = Object.getOwnPropertyDescriptor(global['XMLHttpRequestEventTarget'].prototype, 'onload');
  }
  if (!desc || !desc.configurable) {
    return false;
  }
  return true;
}