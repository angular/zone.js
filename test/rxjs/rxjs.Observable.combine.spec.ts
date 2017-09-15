/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as Rx from 'rxjs/Rx';
import {asyncTest} from '../test-util';

describe('Observable.combine', () => {
  let log: string[];
  let observable1: any;

  beforeEach(() => {
    log = [];
  });

  it('combineAll func callback should run in the correct zone', asyncTest((done: any) => {
       const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
       const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
       observable1 = constructorZone1.run(() => {
         const source = Rx.Observable.of(1, 2);
         const highOrder = source.map((src: any) => {
           expect(Zone.current.name).toEqual(constructorZone1.name);
           return Rx.Observable.of(src);
         });
         return highOrder.combineAll();
       });

       subscriptionZone.run(() => {
         const subscriber = observable1.subscribe(
             (result: any) => {
               expect(Zone.current.name).toEqual(subscriptionZone.name);
               log.push(result);
             },
             () => {
               fail('should not call error');
             },
             () => {
               log.push('completed');
               expect(Zone.current.name).toEqual(subscriptionZone.name);
               expect(log).toEqual([[1, 2], 'completed']);
               done();
             });
       });
     }, Zone.root));

  it('combineAll func callback should run in the correct zone with project function',
     asyncTest((done: any) => {
       const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
       const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
       observable1 = constructorZone1.run(() => {
         const source = Rx.Observable.of(1, 2, 3);
         const highOrder = source.map((src: any) => {
           expect(Zone.current.name).toEqual(constructorZone1.name);
           return Rx.Observable.of(src);
         });
         return highOrder.combineAll((x: any, y: any) => {
           expect(Zone.current.name).toEqual(constructorZone1.name);
           return {x: x, y: y};
         });
       });

       subscriptionZone.run(() => {
         const subscriber = observable1.subscribe(
             (result: any) => {
               expect(Zone.current.name).toEqual(subscriptionZone.name);
               log.push(result);
             },
             () => {
               fail('should not call error');
             },
             () => {
               log.push('completed');
               expect(Zone.current.name).toEqual(subscriptionZone.name);
               expect(log).toEqual([{x: 1, y: 2}, 'completed']);
               done();
             });
       });
     }, Zone.root));

  it('combineLatest func callback should run in the correct zone', () => {
    const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
    const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
    observable1 = constructorZone1.run(() => {
      const source = Rx.Observable.of(1, 2, 3);
      const input = Rx.Observable.of(4, 5, 6);
      return source.combineLatest(input);
    });

    subscriptionZone.run(() => {
      const subscriber = observable1.subscribe(
          (result: any) => {
            expect(Zone.current.name).toEqual(subscriptionZone.name);
            log.push(result);
          },
          () => {
            fail('should not call error');
          },
          () => {
            log.push('completed');
            expect(Zone.current.name).toEqual(subscriptionZone.name);
          });
    });

    expect(log).toEqual([[3, 4], [3, 5], [3, 6], 'completed']);
  });

  it('combineLatest func callback should run in the correct zone with project function', () => {
    const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
    const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
    observable1 = constructorZone1.run(() => {
      const source = Rx.Observable.of(1, 2, 3);
      const input = Rx.Observable.of(4, 5, 6);
      return source.combineLatest(input, function(x: any, y: any) {
        return x + y;
      });
    });

    subscriptionZone.run(() => {
      const subscriber = observable1.subscribe(
          (result: any) => {
            expect(Zone.current.name).toEqual(subscriptionZone.name);
            log.push(result);
          },
          () => {
            fail('should not call error');
          },
          () => {
            log.push('completed');
            expect(Zone.current.name).toEqual(subscriptionZone.name);
          });
    });

    expect(log).toEqual([7, 8, 9, 'completed']);
  });
});
