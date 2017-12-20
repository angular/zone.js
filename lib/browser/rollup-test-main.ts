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
import './browser';

// load test related files into bundle
import '../zone-spec/long-stack-trace';
import '../zone-spec/proxy';
import '../zone-spec/sync-test';
import '../jasmine/jasmine';
import '../zone-spec/async-test';
import '../zone-spec/fake-async-test';
