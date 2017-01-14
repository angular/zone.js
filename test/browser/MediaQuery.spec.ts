/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import '../../lib/browser/webapis-media-query';

import {zoneSymbol} from '../../lib/common/utils';
import {ifEnvSupports} from '../test-util';

function supportMediaQuery() {
  const _global =
      typeof window === 'object' && window || typeof self === 'object' && self || global;
  return _global['MediaQueryList'] && _global['matchMedia'];
}

describe('test mediaQuery patch', ifEnvSupports(supportMediaQuery, () => {
           it('test whether addListener is patched', () => {
             const mqList = window.matchMedia('min-width:500px');
             if (mqList && mqList['addListener']) {
               expect(mqList[zoneSymbol('addListener')]).not.toBe(undefined);
             }
           });
         }));
