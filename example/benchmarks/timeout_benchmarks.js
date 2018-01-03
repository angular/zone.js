/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
require('../../dist/zone-node-asynchooks');

const start = Date.now();
for (let i = 0; i < 10000; i ++) {
  setTimeout(() => {}, 0);
}

setTimeout(() => {
  const end = Date.now();
  console.log('cost: ', (end - start));
}, 100);
