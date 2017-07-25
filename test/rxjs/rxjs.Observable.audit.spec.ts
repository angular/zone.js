/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as Rx from 'rxjs/Rx';
import {asyncTest} from '../test-util';

describe('Observable.audit', () => {
  let log: string[];
  let observable1: any;

  beforeEach(() => {
    log = [];
  });

  it('audit func callback should run in the correct zone', asyncTest((done: any) => {
       const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
       const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
       observable1 = constructorZone1.run(() => {
         const source = Rx.Observable.interval(100);
         return source.audit(ev => {
           expect(Zone.current.name).toEqual(constructorZone1.name);
           return Rx.Observable.interval(360);
         });
       });

       subscriptionZone.run(() => {
         const subscriber = observable1.subscribe(
             (result: any) => {
               expect(Zone.current.name).toEqual(subscriptionZone.name);
               log.push(result);
               if (result >= 7) {
                 subscriber.complete();
               }
             },
             () => {
               fail('should not call error');
             },
             () => {
               log.push('completed');
               expect(Zone.current.name).toEqual(subscriptionZone.name);
               expect(log).toEqual([3, 7, 'completed']);
               done();
             });
       });

       expect(log).toEqual([]);
     }, Zone.root));

  it('auditTime func callback should run in the correct zone', asyncTest((done: any) => {
       const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
       const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
       observable1 = constructorZone1.run(() => {
         const source = Rx.Observable.interval(100);
         return source.auditTime(360);
       });

       subscriptionZone.run(() => {
         const subscriber = observable1.subscribe(
             (result: any) => {
               expect(Zone.current.name).toEqual(subscriptionZone.name);
               log.push(result);
               if (result >= 7) {
                 subscriber.complete();
               }
             },
             () => {
               fail('should not call error');
             },
             () => {
               log.push('completed');
               expect(Zone.current.name).toEqual(subscriptionZone.name);
               expect(log).toEqual([3, 7, 'completed']);
               done();
             });
       });

       expect(log).toEqual([]);
     }, Zone.root));
});