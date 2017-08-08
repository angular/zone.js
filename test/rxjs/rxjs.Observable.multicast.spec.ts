/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as Rx from 'rxjs/Rx';

// TODO: @JiaLiPassion, Observable.prototype.multicast return a readonly _subscribe
// should find another way to patch subscribe
describe('Observable.multicast', () => {
  let log: string[];
  const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
  const doZone1: Zone = Zone.current.fork({name: 'Do Zone1'});
  const mapZone1: Zone = Zone.current.fork({name: 'Map Zone1'});
  const multicastZone1: Zone = Zone.current.fork({name: 'Multicast Zone1'});
  const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
  let observable1: any;

  beforeEach(() => {
    log = [];
  });

  it('multicast func callback should run in the correct zone', () => {
    observable1 = constructorZone1.run(() => {
      return Rx.Observable.of(1, 2, 3);
    });

    observable1 = doZone1.run(() => {
      return observable1.do((v: any) => {
        expect(Zone.current.name).toEqual(doZone1.name);
        log.push('do' + v);
      });
    });

    observable1 = mapZone1.run(() => {
      return observable1.mapTo('test');
    });

    const multi: any = multicastZone1.run(() => {
      return observable1.multicast(() => {
        expect(Zone.current.name).toEqual(multicastZone1.name);
        return new Rx.Subject();
      });
    });

    multi.subscribe((val: any) => {
      log.push('one' + val);
    });

    multi.subscribe((val: any) => {
      log.push('two' + val);
    });

    multi.connect();

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
            log.push('completed');
            expect(Zone.current.name).toEqual(subscriptionZone.name);
          });
    });

    expect(log).toEqual([
      'do1', 'onetest', 'twotest', 'do2', 'onetest', 'twotest', 'do3', 'onetest', 'twotest', 'do1',
      'test', 'do2', 'test', 'do3', 'test', 'completed'
    ]);
  });
});