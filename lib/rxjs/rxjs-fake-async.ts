/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Scheduler} from 'rxjs/Scheduler';
import {async} from 'rxjs/scheduler/async';
import {asap} from 'rxjs/scheduler/asap';

Zone.__load_patch('rxjs.Scheduler.now', (global: any, Zone: ZoneType, api: _ZonePrivate) => {
  api.patchMethod(Scheduler, 'now', (delegate: Function) => (self: any, args: any[]) => {
    return Date.now.apply(self, args);
  });
  api.patchMethod(async, 'now', (delegate: Function) => (self: any, args: any[]) => {
    return Date.now.apply(self, args);
  });
  api.patchMethod(asap, 'now', (delegate: Function) => (self: any, args: any[]) => {
    return Date.now.apply(self, args);
  });
});
