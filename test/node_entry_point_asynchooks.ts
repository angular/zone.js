/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// Must be loaded before zone loads, so that zone can detect WTF.
import './wtf_mock';
import './test_fake_polyfill';

// Setup tests for Zone without microtask support
import '../lib/zone';
import '../lib/common/promise';
import '../lib/common/to-string';
const _global = global as any;
_global.__Zone_disable_node_timers = true;
_global.__Zone_disable_nextTick = true;
_global.__Zone_disable_handleUnhandledPromiseRejection = true;
_global.__Zone_disable_crypto = true;
_global.__Zone_disable_fs = true;
import '../lib/node/node';
import '../lib/node/async_hooks';
import '../lib/zone-spec/async-test';
import '../lib/zone-spec/fake-async-test';
import '../lib/zone-spec/long-stack-trace';
import '../lib/zone-spec/proxy';
import '../lib/zone-spec/sync-test';
import '../lib/zone-spec/task-tracking';
import '../lib/zone-spec/wtf';
import '../lib/rxjs/rxjs';

// Setup test environment
import './test-env-setup-jasmine';

// List all tests here:
import './common_tests';
import './node_tests';
