/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as Rx from 'rxjs/Rx';
import {asyncTest} from '../test-util';

describe('Observable.buffer', () => {
  let log: string[];
  let observable1: any;

  beforeEach(() => {
    log = [];
  });

  it('buffer func callback should run in the correct zone', asyncTest((done: any) => {
       const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
       const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
       observable1 = constructorZone1.run(() => {
         const source = Rx.Observable.interval(350);
         const interval = Rx.Observable.interval(100);
         return interval.buffer(source);
       });

       subscriptionZone.run(() => {
         const subscriber = observable1.subscribe(
             (result: any) => {
               expect(Zone.current.name).toEqual(subscriptionZone.name);
               log.push(result);
               if (result[0] >= 3) {
                 subscriber.complete();
               }
             },
             () => {
               fail('should not call error');
             },
             () => {
               log.push('completed');
               expect(Zone.current.name).toEqual(subscriptionZone.name);
               expect(log).toEqual([[0, 1, 2], [3, 4, 5], 'completed']);
               done();
             });
       });

       expect(log).toEqual([]);
     }, Zone.root));

  it('bufferCount func callback should run in the correct zone', asyncTest((done: any) => {
       const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
       const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
       observable1 = constructorZone1.run(() => {
         const interval = Rx.Observable.interval(100);
         return interval.bufferCount(3);
       });

       subscriptionZone.run(() => {
         const subscriber = observable1.subscribe(
             (result: any) => {
               expect(Zone.current.name).toEqual(subscriptionZone.name);
               log.push(result);
               if (result[0] >= 3) {
                 subscriber.complete();
               }
             },
             () => {
               fail('should not call error');
             },
             () => {
               log.push('completed');
               expect(Zone.current.name).toEqual(subscriptionZone.name);
               expect(log).toEqual([[0, 1, 2], [3, 4, 5], 'completed']);
               done();
             });
       });

       expect(log).toEqual([]);
     }, Zone.root));

  it('bufferTime func callback should run in the correct zone', asyncTest((done: any) => {
       const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
       const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
       observable1 = constructorZone1.run(() => {
         const interval = Rx.Observable.interval(100);
         return interval.bufferTime(350);
       });

       subscriptionZone.run(() => {
         const subscriber = observable1.subscribe(
             (result: any) => {
               expect(Zone.current.name).toEqual(subscriptionZone.name);
               log.push(result);
               if (result[0] >= 3) {
                 subscriber.complete();
               }
             },
             () => {
               fail('should not call error');
             },
             () => {
               log.push('completed');
               expect(Zone.current.name).toEqual(subscriptionZone.name);
               expect(log).toEqual([[0, 1, 2], [3, 4, 5], 'completed']);
               done();
             });
       });

       expect(log).toEqual([]);
     }, Zone.root));

  it('bufferToggle func callback should run in the correct zone', asyncTest((done: any) => {
       const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
       const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
       observable1 = constructorZone1.run(() => {
         const source = Rx.Observable.interval(10);
         const opening = Rx.Observable.interval(25);
         const closingSelector = (v: any) => {
           expect(Zone.current.name).toEqual(constructorZone1.name);
           return v % 2 === 0 ? Rx.Observable.of(v) : Rx.Observable.empty();
         };
         return source.bufferToggle(opening, closingSelector);
       });

       let i = 0;
       subscriptionZone.run(() => {
         const subscriber = observable1.subscribe(
             (result: any) => {
               expect(Zone.current.name).toEqual(subscriptionZone.name);
               log.push(result);
               subscriber.complete();
             },
             () => {
               fail('should not call error');
             },
             () => {
               log.push('completed');
               expect(Zone.current.name).toEqual(subscriptionZone.name);
               expect(log).toEqual([[], 'completed']);
               done();
             });
       });

       expect(log).toEqual([]);
     }, Zone.root));

  xit('bufferWhen func callback should run in the correct zone', asyncTest((done: any) => {
       const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
       const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
       observable1 = constructorZone1.run(() => {
         const source = Rx.Observable.interval(100);
         return source.bufferWhen(() => {
           expect(Zone.current.name).toEqual(constructorZone1.name);
           return Rx.Observable.interval(220);
         });
       });

       let i = 0;
       subscriptionZone.run(() => {
         const subscriber = observable1.subscribe(
             (result: any) => {
               expect(Zone.current.name).toEqual(subscriptionZone.name);
               log.push(result);
               if (i++ >= 3) {
                 subscriber.complete();
               }
             },
             () => {
               fail('should not call error');
             },
             () => {
               log.push('completed');
               expect(Zone.current.name).toEqual(subscriptionZone.name);
               expect(log).toEqual([[0, 1], [2, 3], [4, 5], [6, 7], 'completed']);
               done();
             });
       });

       expect(log).toEqual([]);
     }, Zone.root));
});