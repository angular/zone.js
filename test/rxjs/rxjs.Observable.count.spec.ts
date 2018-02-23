/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as Rx from 'rxjs/Rx';

describe('Observable.count', () => {
  let log: string[];
  const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
  const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
  let observable1: any;

  beforeEach(() => {
    log = [];
  });

  it('count func callback should run in the correct zone', () => {
    observable1 = constructorZone1.run(() => {
      return Rx.Observable.range(1, 3).count((i: number) => {
        expect(Zone.current.name).toEqual(constructorZone1.name);
        return i % 2 === 0;
      });
    });

    subscriptionZone.run(() => {
      observable1.subscribe(
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
        }
      );
    });
    expect(log).toEqual([1, 'completed']);
  });
});
