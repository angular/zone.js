/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {mappingBDD} from './jasmine.bdd';
import {addJasmineClock} from './jasmine.clock';
import {addJasmineExpect} from './jasmine.expect';
import {addJasmineSpy} from './jasmine.spy';

Zone.__load_patch('jasmine2mocha', (global: any) => {
  if (typeof global.Mocha === 'undefined') {
    // not using mocha, just return
    return;
  }
  let jasmine = global['jasmine'];
  if (typeof jasmine !== 'undefined') {
    // jasmine already loaded, just return
    return;
  }
  // create a jasmine global object
  jasmine = global['jasmine'] = {};
  // BDD mapping
  mappingBDD(jasmine, global.Mocha, global);

  // Mocha don't have a built in assert implementation
  // add expect functionality
  addJasmineExpect(jasmine, global);

  // Mocha don't have a built in spy implementation
  // add spy functionality
  addJasmineSpy(jasmine, global.Mocha, global);

  // Add jasmine clock functionality
  addJasmineClock(jasmine);

  Object.defineProperty(jasmine, 'DEFAULT_TIMEOUT_INTERVAL', {
    configurable: true,
    enumerable: true,
    get: function() {
      return global.Mocha.__zone_symbol__TIMEOUT;
    },
    set: function(newValue: number) {
      global.Mocha.__zone_symbol__TIMEOUT = newValue;
    }
  });
});