/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {patchAsProxy} from '../common/proxy-patch';

// we have to patch the instance since the proto is non-configurable
export function apply(api: _ZonePrivate, _global: any) {
  patchAsProxy(api, _global, 'WebSocket', ['message', 'error', 'close', 'open']);
}
