/**
 *
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const globalRx: any = (window as any).Rx;
exports.Observable = globalRx.Observable;
exports.Subscriber = globalRx.Subscriber;
exports.Subject = globalRx.Subject;
exports.Subscription = globalRx.Subscription;
exports.Scheduler = globalRx.Scheduler;
exports.asap = globalRx.Scheduler.asap;
exports.bindCallback = globalRx.Observable.bindCallback;
exports.bindNodeCallback = globalRx.Observable.bindNodeCallback;
exports.defer = globalRx.Observable.defer;
exports.forkJoin = globalRx.Observable.forkJoin;
exports.fromEventPattern = globalRx.Observable.fromEventPattern;
exports.multicast = globalRx.Observable.multicast;