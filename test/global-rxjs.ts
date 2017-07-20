/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const globalRx: any = (window as any).Rx;
exports.Observable = globalRx.Observable;
exports.Subject = globalRx.Subject;
exports.Scheduler = globalRx.Scheduler;