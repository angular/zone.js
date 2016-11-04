/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// Must be loaded before zone loads, so that zone can detect WTF.
import './wtf_mock';

// Setup tests for Zone without microtask support
import '../lib/zone';
import '../lib/browser/browser';
import '../lib/zone-spec/async-test';
import '../lib/zone-spec/fake-async-test';
import '../lib/zone-spec/long-stack-trace';
import '../lib/zone-spec/proxy';
import '../lib/zone-spec/sync-test';
import '../lib/zone-spec/task-tracking';
import '../lib/zone-spec/wtf';

// Setup test environment
import './test-env-setup';

// List all tests here:
import './common_tests';
import './browser/browser.spec';
import './browser/define-property.spec';
import './browser/element.spec';
import './browser/FileReader.spec';
import './browser/HTMLImports.spec';
import './browser/registerElement.spec';
import './browser/requestAnimationFrame.spec';
import './browser/WebSocket.spec';
import './browser/XMLHttpRequest.spec';
// import './browser/geolocation.spec.manual';
