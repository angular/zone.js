/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
if (global && !(global as any).Mocha) {
  try {
    (global as any).Mocha = require('mocha');
  } catch (err) {
    console.log('err', err);
  }
}