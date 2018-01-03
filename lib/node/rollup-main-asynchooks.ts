/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import '../zone';
import '../common/promise';
import '../common/to-string';
const _global = global as any;
_global.__Zone_disable_node_timers = true;
_global.__Zone_disable_nextTick = true;
_global.__Zone_disable_handleUnhandledPromiseRejection = true;
_global.__Zone_disable_crypto = true;
_global.__Zone_disable_fs = true;
import './node';
import './async_hooks';