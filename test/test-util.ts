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
    console.log('WARNING: skipping ' + message + ' tests (missing this API)');
    done && done();
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

let supportSetErrorStack = true;

export function isSupportSetErrorStack() {
  try {
    throw new Error('test');
  } catch (err) {
    try {
      err.stack = 'new stack';
      supportSetErrorStack = err.stack === 'new stack';
    } catch (error) {
      supportSetErrorStack = false;
    }
  }
  return supportSetErrorStack;
}

(isSupportSetErrorStack as any).message = 'supportSetErrorStack';

export function asyncTest(testFn: Function, zone: Zone = Zone.current) {
  const AsyncTestZoneSpec = (Zone as any)['AsyncTestZoneSpec'];
  return (done: Function) => {
    let asyncTestZone: Zone = zone.fork(new AsyncTestZoneSpec(() => {}, (error: Error) => {
      fail(error);
    }, 'asyncTest'));
    asyncTestZone.run(testFn, this, [done]);
  };
}

export function getIEVersion() {
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.indexOf('msie') != -1) {
    return parseInt(userAgent.split('msie')[1]);
  }
  return null;
}

export function isEdge() {
  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.indexOf('edge') !== -1;
}
