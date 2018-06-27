/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {asapScheduler, asyncScheduler, Scheduler} from 'rxjs';

Zone.__load_patch('rxjs.Scheduler.now', (global: any, Zone: ZoneType, api: _ZonePrivate) => {
  api.patchMethod(Scheduler, 'now', (delegate: Function) => (self: any, args: any[]) => {
    return Date.now.apply(self, args);
  });
  api.patchMethod(asyncScheduler, 'now', (delegate: Function) => (self: any, args: any[]) => {
    return Date.now.apply(self, args);
  });
  api.patchMethod(asapScheduler, 'now', (delegate: Function) => (self: any, args: any[]) => {
    return Date.now.apply(self, args);
  });
});
