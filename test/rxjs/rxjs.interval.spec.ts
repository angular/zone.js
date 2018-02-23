/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as Rx from 'rxjs/Rx';
import {asyncTest} from '../test-util';

describe('Observable.interval', () => {
  let log: string[];
  let observable1: any;

  beforeEach(() => {
    log = [];
  });

  it(
    'interval func callback should run in the correct zone',
    asyncTest((done: any) => {
      const constructorZone1: Zone = Zone.current.fork({
        name: 'Constructor Zone1'
      });
      const subscriptionZone: Zone = Zone.current.fork({
        name: 'Subscription Zone'
      });
      observable1 = constructorZone1.run(() => {
        return Rx.Observable.interval(10);
      });

      subscriptionZone.run(() => {
        const subscriber = observable1.subscribe(
          (result: any) => {
            log.push(result);
            expect(Zone.current.name).toEqual(subscriptionZone.name);
            if (result >= 3) {
              subscriber.complete();
              expect(log).toEqual([0, 1, 2, 3]);
              done();
            }
          },
          () => {
            fail('should not call error');
          },
          () => {}
        );
      });
    }, Zone.root)
  );
});
