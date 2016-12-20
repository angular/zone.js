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
 *    var div = document.createElement('div');
 *    var clickPropDesc = Object.getOwnPropertyDescriptor(div, 'onclick');
 *    return !(EventTarget &&
 *             div instanceof EventTarget &&
 *             clickPropDesc && clickPropDesc.value === null);
 *  }
 *  (<any>supportsOnClick).message = 'Supports Element#onclick patching';
 *
 *
 *  ifEnvSupports(supportsOnClick, function() { ... });
 */
export function ifEnvSupports(test, block) {
  return function() {
    var message = (test.message || test.name || test);
    if (typeof test === 'string' ? !!global[test] : test()) {
      block();
    } else {
      it('should skip the test if the API does not exist', function() {
        console.log('WARNING: skipping ' + message + ' tests (missing this API)');
      });
    }
  };
};

function detectBrowser() {
  const navigator = global['navigator'];
  if (!navigator) {
    return 'node';
  }
  let ua = navigator.userAgent, tem,
      M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
  if (/trident/i.test(M[1])) {
    tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
    return 'IE ' + (tem[1] || '');
  }
  if (M[1] === 'Chrome') {
    tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
    if (tem != null) return tem.slice(1).join(' ').replace('OPR', 'Opera');
  }
  M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
  if ((tem = ua.match(/version\/(\d+)/i)) != null) M.splice(1, 1, tem[1]);
  return M.join(' ').toLowerCase();
}

export const isChrome = detectBrowser().indexOf('chrome') !== -1;
export const isFirefox = detectBrowser().indexOf('firefox') !== -1;
export const isSafari = detectBrowser().indexOf('safari') !== -1;
export const isIE =
    detectBrowser().indexOf('msie') !== -1 || detectBrowser().indexOf('trident') !== -1;
export const isOpera = detectBrowser().indexOf('opera') !== -1;