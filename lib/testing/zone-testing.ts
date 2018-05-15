/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// load test related files into bundle in correct order
import '../zone-spec/long-stack-trace';
import '../zone-spec/proxy';
import '../zone-spec/sync-test';
import './async-testing';
import './fake-async';
import './promise-testing';
import '../jasmine/jasmine';
import '../mocha/mocha';
