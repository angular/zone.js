/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import '../../spec/common/microtasks.spec';
import '../../spec/common/zone.spec';
import '../../spec/common/task.spec';
import '../../spec/common/util.spec';
import '../../spec/common/Promise.spec';
import '../../spec/common/Error.spec';
import '../../spec/common/setInterval.spec';
import '../../spec/common/setTimeout.spec';
import '../../spec/common/toString.spec';
import '../../spec/zone-spec/long-stack-trace-zone.spec';
import '../../spec/zone-spec/async-test.spec';
import '../../spec/zone-spec/sync-test.spec';
import '../../spec/zone-spec/fake-async-test.spec';
import '../../spec/zone-spec/proxy.spec';
import '../../spec/zone-spec/task-tracking.spec';
import '../../spec/rxjs/rxjs.spec';
import '../../spec/jasmine/jasmine-patch.spec';
import '../../spec/mocha/mocha-patch.spec';

Error.stackTraceLimit = Number.POSITIVE_INFINITY;
