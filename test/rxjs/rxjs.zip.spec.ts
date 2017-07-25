/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as Rx from 'rxjs/Rx';

describe('Observable.zip', () => {
  let log: string[];
  const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
  const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});

  beforeEach(() => {
    log = [];
  });

  it('zip func callback should run in the correct zone', () => {
    const observable1: any = constructorZone1.run(() => {
      return Rx.Observable.range(1, 3);
    });
    const observable2: any = constructorZone1.run(() => {
      return Rx.Observable.of('foo', 'bar', 'beer');
    });

    const observable3: any = constructorZone1.run(() => {
      return Rx.Observable.zip(observable1, observable2, function(n: number, str: string) {
        expect(Zone.current.name).toEqual(constructorZone1.name);
        return {n: n, str: str};
      });
    });

    subscriptionZone.run(() => {
      observable3.subscribe(
          (result: any) => {
            log.push(result);
            expect(Zone.current.name).toEqual(subscriptionZone.name);
          },
          () => {
            fail('should not call error');
          },
          () => {
            log.push('completed');
            expect(Zone.current.name).toEqual(subscriptionZone.name);
          });
    });

    expect(log).toEqual([{n: 1, str: 'foo'}, {n: 2, str: 'bar'}, {n: 3, str: 'beer'}, 'completed']);
  });
});