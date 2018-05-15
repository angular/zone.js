/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {mappingBDD} from './mocha.bdd';
Zone.__load_patch('mocha-bridge', (global: any) => {
  if (global.Mocha) {
    return;
  }
  global.Mocha = {};
  // set a flag to tell global.Mocha is a mock.
  global.Mocha['__zone_symbol__isBridge'] = true;
  mappingBDD(global.Mocha, global.jasmine, global);
});