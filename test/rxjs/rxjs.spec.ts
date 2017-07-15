/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {Subscriber, Observable} from 'rxjs';

/**
 * The point of these tests, is to ensure that all callbacks execute in the Zone which was active
 * when the callback was passed into the Rx.
 *
 * The implications are:
 * - Observable callback passed into `Observable` executes in the same Zone as when the
 *   `new Observable` was invoked.
 * - The subscription callbacks passed into `subscribe` execute in the same Zone as when the
 *   `subscribe` method was invoked.
 * - The operator callbacks passe into `map`, etc..., execute in the same Zone as when the
 *   `operator` (`lift`) method was invoked.
 */
describe('Zone interaction', () => {
  it('should run methods in the zone of declaration', () => {
    const log: string[] = [];
    const constructorZone: Zone = Zone.current.fork({ name: 'Constructor Zone'});
    const subscriptionZone: Zone = Zone.current.fork({ name: 'Subscription Zone'});
    let subscriber: Subscriber<string> = null;
    const observable = constructorZone.run(() => new Observable<string>((_subscriber) => {
      subscriber = _subscriber;
      log.push('setup');
      expect(Zone.current.name).toEqual(constructorZone.name);
      return () => {
        expect(Zone.current.name).toEqual(constructorZone.name);
        log.push('cleanup');
      };
    })) as Observable<string>;
    subscriptionZone.run(() => observable.subscribe(
        () => {
          expect(Zone.current.name).toEqual(subscriptionZone.name);
          log.push('next');
        },
        () => null,
        () => {
          (process as any)._rawDebug('complete callback');
          expect(Zone.current.name).toEqual(subscriptionZone.name);
          log.push('complete');
        }
    ));
    subscriber.next('MyValue');
    subscriber.complete();

    expect(log).toEqual(['setup', 'next', 'complete', 'cleanup']);
    log.length = 0;

    subscriptionZone.run(() => observable.subscribe(
        () => null,
        () => {
          expect(Zone.current.name).toEqual(subscriptionZone.name);
          log.push('error');
        },
        () => null
    ));
    subscriber.next('MyValue');
    subscriber.error('MyError');

    expect(log).toEqual(['setup', 'error', 'cleanup']);
  });

  xit('should run methods in the zone of declaration when nexting synchronously', () => {
    const log: string[] = [];
    const rootZone: Zone = Zone.current;
    const constructorZone: Zone = Zone.current.fork({ name: 'Constructor Zone'});
    const subscriptionZone: Zone = Zone.current.fork({ name: 'Subscription Zone'});
    const observable = constructorZone.run(() => new Observable<string>((subscriber) => {
      // Execute the `next`/`complete` in different zone, and assert that correct zone
      // is restored.
      rootZone.run(() => {
        subscriber.next('MyValue');
        subscriber.complete();
      });
      return () => {
        expect(Zone.current.name).toEqual(constructorZone.name);
        log.push('cleanup');
      };
    })) as Observable<string>;

    subscriptionZone.run(() => observable.subscribe(
        () => {
          expect(Zone.current.name).toEqual(subscriptionZone.name);
          log.push('next');
        },
        () => null,
        () => {
          expect(Zone.current.name).toEqual(subscriptionZone.name);
          log.push('complete');
        }
    ));

    expect(log).toEqual(['next', 'complete', 'cleanup']);
  });

  xit('should run operators in the zone of declaration', () => {
    const log: string[] = [];
    const rootZone: Zone = Zone.current;
    const constructorZone: Zone = Zone.current.fork({ name: 'Constructor Zone'});
    const operatorZone: Zone = Zone.current.fork({ name: 'Operator Zone'});
    const subscriptionZone: Zone = Zone.current.fork({ name: 'Subscription Zone'});
    let observable = constructorZone.run(() => new Observable<string>((subscriber) => {
      // Execute the `next`/`complete` in different zone, and assert that correct zone
      // is restored.
      rootZone.run(() => {
        subscriber.next('MyValue');
        subscriber.complete();
      });
      return () => {
        expect(Zone.current.name).toEqual(constructorZone.name);
        log.push('cleanup');
      };
    })) as Observable<string>;

    observable = operatorZone.run(() => observable.map((value) => {
      expect(Zone.current.name).toEqual(operatorZone.name);
      log.push('map: ' + value);
      return value;
    })) as Observable<string>;

    subscriptionZone.run(() => observable.subscribe(
        () => {
          expect(Zone.current.name).toEqual(subscriptionZone.name);
          log.push('next');
        },
        (e) => {
          expect(Zone.current.name).toEqual(subscriptionZone.name);
          log.push('error: ' + e);
        },
        () => {
          expect(Zone.current.name).toEqual(subscriptionZone.name);
          log.push('complete');
        }
    ));

    expect(log).toEqual(['map: MyValue', 'next', 'complete', 'cleanup']);
  });

});