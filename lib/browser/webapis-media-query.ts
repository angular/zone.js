/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Zone.__load_patch('mediaQuery', (global: any, Zone: ZoneType, api: _ZonePrivate) => {
  if (!global['MediaQueryList']) {
    return;
  }
  api.patchEventTarget(
      global, [global['MediaQueryList'].prototype],
      {addEventListenerFnName: 'addListener', removeEventListenerFnName: 'removeListener'});
});