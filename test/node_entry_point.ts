/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// Must be loaded before zone loads, so that zone can detect WTF.
if (typeof global !== 'undefined' &&
    (global as any)['__zone_symbol__fakeAsyncPatchLock'] !== false) {
  (global as any)['__zone_symbol__fakeAsyncPatchLock'] = true;
}
import './wtf_mock';
import './test_fake_polyfill';

// Setup tests for Zone without microtask support
import '../lib/testing/zone-testing';
import '../lib/zone-spec/task-tracking';
import '../lib/zone-spec/wtf';
import '../lib/rxjs/rxjs';
import '../lib/rxjs/rxjs-fake-async';
// Setup test environment
import '../lib/jasmine/jasmine';
import './test-env-setup-jasmine';

// List all tests here:
import './common_tests';
import './node_tests';
