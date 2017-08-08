/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as Rx from 'rxjs/Rx';

describe('Observable.distinct', () => {
  let log: string[];
  let observable1: any;

  beforeEach(() => {
    log = [];
  });

  it('distinct func callback should run in the correct zone', () => {
    const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
    const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
    const error = new Error('test');
    observable1 = constructorZone1.run(() => {
      return Rx.Observable.of(1, 1, 2, 2, 2, 1, 2, 3, 4, 3, 2, 1).distinct();
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
          });
    });
    expect(log).toEqual([1, 2, 3, 4, 'completed']);
  });

  it('distinctUntilChanged func callback should run in the correct zone', () => {
    const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
    const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
    const error = new Error('test');
    observable1 = constructorZone1.run(() => {
      return Rx.Observable.of(1, 1, 2, 2, 2, 1, 1, 2, 3, 3, 4).distinctUntilChanged();
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
          });
    });
    expect(log).toEqual([1, 2, 1, 2, 3, 4, 'completed']);
  });

  it('distinctUntilKeyChanged func callback should run in the correct zone', () => {
    const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
    const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
    const error = new Error('test');
    observable1 = constructorZone1.run(() => {
      return Rx.Observable
          .of({age: 4, name: 'Foo'}, {age: 7, name: 'Bar'}, {age: 5, name: 'Foo'},
              {age: 6, name: 'Foo'})
          .distinctUntilKeyChanged('name');
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
          });
    });
    expect(log).toEqual(
        [{age: 4, name: 'Foo'}, {age: 7, name: 'Bar'}, {age: 5, name: 'Foo'}, 'completed']);
  });
});