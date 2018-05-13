/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {patchJasmineClock} from '../../jasmine/jasmine.clock';
export function addJasmineClock(jasmine: any, global: any) {
  jasmine.clock = function() {
    return {
      tick: function() {},
      install: function() {},
      uninstall: function() {},
      mockDate: function() {}
    };
  };
  patchJasmineClock(jasmine, global);
}
