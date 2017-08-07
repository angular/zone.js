/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as Rx from 'rxjs/Rx';

describe('Observable.forkjoin', () => {
  let log: string[];
  const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
  const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
  let observable1: any;

  beforeEach(() => {
    log = [];
  });

  it('forkjoin func callback should run in the correct zone', () => {
    observable1 = constructorZone1.run(() => {
      return Rx.Observable.forkJoin(Rx.Observable.range(1, 2), Rx.Observable.from([4, 5]));
    });

    subscriptionZone.run(() => {
      observable1.subscribe(
          (result: any) => {
            expect(Zone.current.name).toEqual(subscriptionZone.name);
            log.push(result);
          },
          () => {
            fail('should not call error');
          },
          () => {
            expect(Zone.current.name).toEqual(subscriptionZone.name);
            log.push('completed');
          });
    });

    expect(log).toEqual([[2, 5], 'completed']);
  });

  it('forkjoin func callback with selector should run in the correct zone', () => {
    observable1 = constructorZone1.run(() => {
      return Rx.Observable.forkJoin(
          Rx.Observable.range(1, 2), Rx.Observable.from([4, 5]), function(x, y) {
            expect(Zone.current.name).toEqual(constructorZone1.name);
            return x + y;
          });
    });

    subscriptionZone.run(() => {
      observable1.subscribe(
          (result: any) => {
            expect(Zone.current.name).toEqual(subscriptionZone.name);
            log.push(result);
          },
          () => {
            fail('should not call error');
          },
          () => {
            expect(Zone.current.name).toEqual(subscriptionZone.name);
            log.push('completed');
          });
    });

    expect(log).toEqual([7, 'completed']);
  });
});