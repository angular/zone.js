/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as Rx from 'rxjs/Rx';

describe('Observable.catch', () => {
  let log: string[];
  let observable1: any;

  beforeEach(() => {
    log = [];
  });

  it('audit func callback should run in the correct zone', () => {
    const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
    const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
    observable1 = constructorZone1.run(() => {
      const error = new Error('test');
      const source = Rx.Observable.of(1, 2, 3).map((n: number) => {
        expect(Zone.current.name).toEqual(constructorZone1.name);
        if (n === 2) {
          throw error;
        }
        return n;
      });
      return source.catch((err: any) => {
        expect(Zone.current.name).toEqual(constructorZone1.name);
        return Rx.Observable.of('error1', 'error2');
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
    expect(log).toEqual([1, 'error1', 'error2', 'completed']);
  });
});