/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as Rx from 'rxjs/Rx';

describe('Observable.do', () => {
  let log: string[];
  let observable1: any;

  beforeEach(() => {
    log = [];
  });

  it('do func callback should run in the correct zone', () => {
    const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
    const doZone1: Zone = Zone.current.fork({name: 'Do Zone1'});
    const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
    const error = new Error('test');
    observable1 = constructorZone1.run(() => {
      return Rx.Observable.of(1);
    });

    observable1 = doZone1.run(() => {
      return observable1.do((v: any) => {
        log.push(v);
        expect(Zone.current.name).toEqual(doZone1.name);
      });
    });

    subscriptionZone.run(() => {
      observable1.subscribe(
          (result: any) => {
            log.push('result' + result);
            expect(Zone.current.name).toEqual(subscriptionZone.name);
          },
          (err: any) => {
            fail('should not call error');
          },
          () => {
            log.push('completed');
            expect(Zone.current.name).toEqual(subscriptionZone.name);
            expect(log).toEqual([1, 'result1', 'completed']);
          });
    });
  });
});