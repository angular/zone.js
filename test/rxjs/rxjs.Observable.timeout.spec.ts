/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as Rx from 'rxjs/Rx';
import {asyncTest} from '../test-util';

describe('Observable.timeout', () => {
  let log: string[];
  let observable1: any;

  beforeEach(() => {
    log = [];
  });

  it(
    'timeout func callback should run in the correct zone',
    asyncTest((done: any) => {
      const constructorZone1: Zone = Zone.current.fork({
        name: 'Constructor Zone1'
      });
      const subscriptionZone: Zone = Zone.current.fork({
        name: 'Subscription Zone'
      });
      observable1 = constructorZone1.run(() => {
        return Rx.Observable.of(1).timeout(10);
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
            done();
          }
        );
      });
    }, Zone.root)
  );

  it(
    'promise should run in the correct zone',
    asyncTest((done: any) => {
      const constructorZone1: Zone = Zone.current.fork({
        name: 'Constructor Zone1'
      });
      const subscriptionZone: Zone = Zone.current.fork({
        name: 'Subscription Zone'
      });
      const promise: any = constructorZone1.run(() => {
        return Rx.Observable.of(1).toPromise();
      });

      subscriptionZone.run(() => {
        promise.then(
          (result: any) => {
            expect(Zone.current.name).toEqual(subscriptionZone.name);
            expect(result).toEqual(1);
            done();
          },
          (err: any) => {
            fail('should not call error');
          }
        );
      });
    }, Zone.root)
  );
});
