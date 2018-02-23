/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as Rx from 'rxjs/Rx';
import {asyncTest} from '../test-util';

describe('Observable.take', () => {
  let log: string[];
  let observable1: any;
  let defaultTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;

  beforeEach(() => {
    log = [];
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
  });

  afterEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = defaultTimeout;
  });

  it('take func callback should run in the correct zone', () => {
    const constructorZone1: Zone = Zone.current.fork({
      name: 'Constructor Zone1'
    });
    const subscriptionZone: Zone = Zone.current.fork({
      name: 'Subscription Zone'
    });
    observable1 = constructorZone1.run(() => {
      return Rx.Observable.of(1, 2, 3).take(1);
    });

    subscriptionZone.run(() => {
      observable1.subscribe(
        (result: any) => {
          log.push(result);
          expect(Zone.current.name).toEqual(subscriptionZone.name);
        },
        (err: any) => {
          fail('should not call error');
        },
        () => {
          log.push('completed');
          expect(Zone.current.name).toEqual(subscriptionZone.name);
          expect(log).toEqual([1, 'completed']);
        }
      );
    });
  });

  it('takeLast func callback should run in the correct zone', () => {
    const constructorZone1: Zone = Zone.current.fork({
      name: 'Constructor Zone1'
    });
    const subscriptionZone: Zone = Zone.current.fork({
      name: 'Subscription Zone'
    });
    observable1 = constructorZone1.run(() => {
      return Rx.Observable.of(1, 2, 3).takeLast(1);
    });

    subscriptionZone.run(() => {
      observable1.subscribe(
        (result: any) => {
          log.push(result);
          expect(Zone.current.name).toEqual(subscriptionZone.name);
        },
        (err: any) => {
          fail('should not call error');
        },
        () => {
          log.push('completed');
          expect(Zone.current.name).toEqual(subscriptionZone.name);
          expect(log).toEqual([3, 'completed']);
        }
      );
    });
  });

  xit(
    'takeUntil func callback should run in the correct zone',
    asyncTest((done: any) => {
      const constructorZone1: Zone = Zone.current.fork({
        name: 'Constructor Zone1'
      });
      const subscriptionZone: Zone = Zone.current.fork({
        name: 'Subscription Zone'
      });
      observable1 = constructorZone1.run(() => {
        return Rx.Observable.interval(10).takeUntil(Rx.Observable.interval(25));
      });

      subscriptionZone.run(() => {
        observable1.subscribe(
          (result: any) => {
            log.push(result);
            expect(Zone.current.name).toEqual(subscriptionZone.name);
          },
          (err: any) => {
            fail('should not call error');
          },
          () => {
            log.push('completed');
            expect(Zone.current.name).toEqual(subscriptionZone.name);
            expect(log).toEqual([0, 1, 'completed']);
            done();
          }
        );
      });
    }, Zone.root)
  );

  it(
    'takeWhile func callback should run in the correct zone',
    asyncTest((done: any) => {
      const constructorZone1: Zone = Zone.current.fork({
        name: 'Constructor Zone1'
      });
      const takeZone1: Zone = Zone.current.fork({name: 'Take Zone1'});
      const subscriptionZone: Zone = Zone.current.fork({
        name: 'Subscription Zone'
      });
      observable1 = constructorZone1.run(() => {
        return Rx.Observable.interval(10);
      });

      observable1 = takeZone1.run(() => {
        return observable1.takeWhile((val: any) => {
          expect(Zone.current.name).toEqual(takeZone1.name);
          return val < 2;
        });
      });

      subscriptionZone.run(() => {
        observable1.subscribe(
          (result: any) => {
            log.push(result);
            expect(Zone.current.name).toEqual(subscriptionZone.name);
          },
          (err: any) => {
            fail('should not call error');
          },
          () => {
            log.push('completed');
            expect(Zone.current.name).toEqual(subscriptionZone.name);
            expect(log).toEqual([0, 1, 'completed']);
            done();
          }
        );
      });
    }, Zone.root)
  );
});
