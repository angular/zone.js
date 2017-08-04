/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as Rx from 'rxjs/Rx';
import {asyncTest} from '../test-util';

describe('Observable.throw', () => {
  let log: string[];
  const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
  const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
  let observable1: any;

  beforeEach(() => {
    log = [];
  });

  it('throw func callback should run in the correct zone', () => {
    let error = new Error('test');
    observable1 = constructorZone1.run(() => {
      return Rx.Observable.throw(error);
    });

    subscriptionZone.run(() => {
      observable1.subscribe(
          (result: any) => {
            fail('should not call next');
          },
          (error: any) => {
            log.push(error);
            expect(Zone.current.name).toEqual(subscriptionZone.name);
          },
          () => {
            fail('should not call complete');
          });
    });

    expect(log).toEqual([error]);
  });

  it('throw func callback should run in the correct zone with scheduler', asyncTest((done: any) => {
       const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
       const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
       let error = new Error('test');
       observable1 = constructorZone1.run(() => {
         return Rx.Observable.throw(error, Rx.Scheduler.asap);
       });

       subscriptionZone.run(() => {
         observable1.subscribe(
             (result: any) => {
               fail('should not call next');
             },
             (error: any) => {
               log.push(error);
               expect(Zone.current.name).toEqual(subscriptionZone.name);
               expect(log).toEqual([error]);
               done();
             },
             () => {
               fail('should not call complete');
             });
       });

       expect(log).toEqual([]);
     }, Zone.root));
});