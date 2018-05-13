/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {mappingBDD} from './jest.bdd';
import {addJestTimer} from './jest.clock';
import {expandExpect} from './jest.expect';
import {mappingSpy} from './jest.spy';

Zone.__load_patch('jest2mocha', (global: any) => {
  let jest = global['jest'];
  if (typeof jest !== 'undefined') {
    // jasmine already loaded, just return
    return;
  }
  // TODO: @JiaLiPassion, now we only support jest in Mocha runner
  // support jasmine later.
  if (!global.Mocha || global.Mocha['__zone_symbol__isBridge']) {
    return;
  }
  if (global.jasmine && !global.jasmine['__zone_symbol__isBridge']) {
    // real jasmine is loaded
    return;
  }
  // create a jasmine global object
  jest = global['jest'] = {};
  jest['__zone_symbol__isBridge'] = true;
  // BDD mapping
  mappingBDD(jest, global.Mocha, global);
  expandExpect(global);
  mappingSpy(jest, jasmine, global);
  addJestTimer(jest, global);

  jest.setTimeout = function(timeout: number) {
    const ctx = global.Mocha.__zone_symbol__current_ctx;
    if (ctx && typeof ctx.timeout === 'function') {
      ctx.timeout(timeout);
    }
  };
});