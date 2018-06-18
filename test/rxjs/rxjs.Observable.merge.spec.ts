/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as Rx from 'rxjs/Rx';
import {asyncTest} from '../test-util';

describe('Observable.merge', () => {
  let log: string[];
  let observable1: any;
  let defaultTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;

  beforeEach(() => {
    log = [];
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
  });

  afterEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = defaultTimeout;
  });

  it('expand func callback should run in the correct zone', () => {
    const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
    const expandZone1: Zone = Zone.current.fork({name: 'Expand Zone1'});
    const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
    const error = new Error('test');
    observable1 = constructorZone1.run(() => {
      return Rx.Observable.of(2);
    });

    observable1 = expandZone1.run(() => {
      return observable1
          .expand((val: any) => {
            expect(Zone.current.name).toEqual(expandZone1.name);
            return Rx.Observable.of(1 + val);
          })
          .take(2);
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
    expect(log).toEqual([2, 3, 'completed']);
  });

  it('merge func callback should run in the correct zone', asyncTest((done: any) => {
       const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
       const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
       const error = new Error('test');
       observable1 = constructorZone1.run(() => {
         return Rx.Observable.merge(
             Rx.Observable.interval(10).take(2), Rx.Observable.interval(15).take(1));
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
               expect(log).toEqual([0, 0, 1, 'completed']);
               done();
             });
       });
     }, Zone.root));

  it('mergeAll func callback should run in the correct zone', asyncTest((done: any) => {
       const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
       const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
       const error = new Error('test');
       observable1 = constructorZone1.run(() => {
         return Rx.Observable.of(1, 2)
             .map((v: any) => {
               return Rx.Observable.of(v + 1);
             })
             .mergeAll();
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
               expect(log).toEqual([2, 3, 'completed']);
               done();
             });
       });
     }, Zone.root));

  it('mergeMap func callback should run in the correct zone', () => {
    const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
    const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
    const error = new Error('test');
    observable1 = constructorZone1.run(() => {
      return Rx.Observable.of(1, 2).mergeMap((v: any) => {
        return Rx.Observable.of(v + 1);
      });
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
            expect(log).toEqual([2, 3, 'completed']);
          });
    });
  });

  it('mergeMapTo func callback should run in the correct zone', () => {
    const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
    const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
    const error = new Error('test');
    observable1 = constructorZone1.run(() => {
      return Rx.Observable.of(1, 2).mergeMapTo(Rx.Observable.of(10));
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
            expect(log).toEqual([10, 10, 'completed']);
          });
    });
  });

  it('switch func callback should run in the correct zone', () => {
    const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
    const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
    observable1 = constructorZone1.run(() => {
      return Rx.Observable.range(0, 3)
          .map(function(x: any) {
            return Rx.Observable.range(x, 3);
          })
          .switch();
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
            expect(log).toEqual([0, 1, 2, 1, 2, 3, 2, 3, 4, 'completed']);
          });
    });
  });

  it('switchMap func callback should run in the correct zone', () => {
    const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
    const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
    observable1 = constructorZone1.run(() => {
      return Rx.Observable.range(0, 3).switchMap(function(x: any) {
        return Rx.Observable.range(x, 3);
      });
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
            expect(log).toEqual([0, 1, 2, 1, 2, 3, 2, 3, 4, 'completed']);
          });
    });
  });

  it('switchMapTo func callback should run in the correct zone', () => {
    const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
    const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
    observable1 = constructorZone1.run(() => {
      return Rx.Observable.range(0, 3).switchMapTo('a');
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
            expect(log).toEqual(['a', 'a', 'a', 'completed']);
          });
    });
  });
});