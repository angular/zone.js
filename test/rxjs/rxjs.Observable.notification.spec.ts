/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as Rx from 'rxjs/Rx';
import {asyncTest, ifEnvSupports} from '../test-util';

const supportNotification = function() {
  return typeof Rx.Notification !== 'undefined';
};

(supportNotification as any).message = 'RxNotification';

describe(
  'Observable.notification',
  ifEnvSupports(supportNotification, () => {
    let log: string[];
    let observable1: any;

    beforeEach(() => {
      log = [];
    });

    it('notification func callback should run in the correct zone', () => {
      const constructorZone1: Zone = Zone.current.fork({
        name: 'Constructor Zone1'
      });
      const subscriptionZone: Zone = Zone.current.fork({
        name: 'Subscription Zone'
      });
      const error = new Error('test');
      observable1 = constructorZone1.run(() => {
        const notifA = new Rx.Notification('N', 'A');
        const notifB = new Rx.Notification('N', 'B');
        const notifE = new Rx.Notification('E', void 0, error);
        const materialized = Rx.Observable.of(notifA, notifB, notifE);
        return materialized.dematerialize();
      });

      subscriptionZone.run(() => {
        observable1.subscribe(
          (result: any) => {
            log.push(result);
            expect(Zone.current.name).toEqual(subscriptionZone.name);
          },
          (err: any) => {
            log.push(err);
            expect(Zone.current.name).toEqual(subscriptionZone.name);
          },
          () => {
            log.push('completed');
            expect(Zone.current.name).toEqual(subscriptionZone.name);
            expect(log).toEqual(['A', 'B', error]);
          }
        );
      });
    });
  })
);
