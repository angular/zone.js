/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as Rx from 'rxjs/Rx';
import {asyncTest} from '../test-util';

describe('Observable.collection', () => {
  let log: string[];
  let observable1: any;
  let defaultTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;

  beforeEach(() => {
    log = [];
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
  });

  afterEach(function() {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = defaultTimeout;
  });

  it('elementAt func callback should run in the correct zone', () => {
    const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
    const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
    const error = new Error('test');
    observable1 = constructorZone1.run(() => {
      return Rx.Observable.of(1, 2, 3).elementAt(1);
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
            expect(log).toEqual([2, 'completed']);
          });
    });
  });

  it('every func callback should run in the correct zone', () => {
    const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
    const everyZone1: Zone = Zone.current.fork({name: 'Every Zone1'});
    const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
    const error = new Error('test');
    observable1 = constructorZone1.run(() => {
      return Rx.Observable.of(1, 2, 3);
    });

    observable1 = everyZone1.run(() => {
      return observable1.every((v: any) => {
        expect(Zone.current.name).toEqual(everyZone1.name);
        return v % 2 === 0;
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
            expect(log).toEqual([false, 'completed']);
          });
    });
  });

  it('filter func callback should run in the correct zone', () => {
    const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
    const filterZone1: Zone = Zone.current.fork({name: 'Filter Zone1'});
    const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
    const error = new Error('test');
    observable1 = constructorZone1.run(() => {
      return Rx.Observable.of(1, 2, 3);
    });

    observable1 = filterZone1.run(() => {
      return observable1.filter((v: any) => {
        expect(Zone.current.name).toEqual(filterZone1.name);
        return v % 2 === 0;
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
            expect(log).toEqual([2, 'completed']);
          });
    });
  });

  it('find func callback should run in the correct zone', () => {
    const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
    const findZone1: Zone = Zone.current.fork({name: 'Find Zone1'});
    const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
    const error = new Error('test');
    observable1 = constructorZone1.run(() => {
      return Rx.Observable.of(1, 2, 3);
    });

    observable1 = findZone1.run(() => {
      return observable1.find((v: any) => {
        expect(Zone.current.name).toEqual(findZone1.name);
        return v === 2;
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
            expect(log).toEqual([2, 'completed']);
          });
    });
  });

  it('findIndex func callback should run in the correct zone', () => {
    const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
    const findZone1: Zone = Zone.current.fork({name: 'Find Zone1'});
    const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
    const error = new Error('test');
    observable1 = constructorZone1.run(() => {
      return Rx.Observable.of(1, 2, 3);
    });

    observable1 = findZone1.run(() => {
      return observable1.findIndex((v: any) => {
        expect(Zone.current.name).toEqual(findZone1.name);
        return v === 2;
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
            expect(log).toEqual([1, 'completed']);
          });
    });
  });

  it('first func callback should run in the correct zone', () => {
    const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
    const firstZone1: Zone = Zone.current.fork({name: 'First Zone1'});
    const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
    const error = new Error('test');
    observable1 = constructorZone1.run(() => {
      return Rx.Observable.of(1, 2, 3);
    });

    observable1 = firstZone1.run(() => {
      return observable1.first((v: any) => {
        expect(Zone.current.name).toEqual(firstZone1.name);
        return v === 2;
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
            expect(log).toEqual([2, 'completed']);
          });
    });
  });

  it('groupBy func callback should run in the correct zone', () => {
    const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
    const groupByZone1: Zone = Zone.current.fork({name: 'groupBy Zone1'});
    const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
    const error = new Error('test');
    observable1 = constructorZone1.run(() => {
      const people = [
        {name: 'Sue', age: 25}, {name: 'Joe', age: 30}, {name: 'Frank', age: 25},
        {name: 'Sarah', age: 35}
      ];
      return Rx.Observable.from(people);
    });

    observable1 = groupByZone1.run(() => {
      return observable1
          .groupBy((person: any) => {
            expect(Zone.current.name).toEqual(groupByZone1.name);
            return person.age;
          })
          // return as array of each group
          .flatMap((group: any) => group.reduce((acc: any, curr: any) => [...acc, curr], []));
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
            expect(log).toEqual([
              [{age: 25, name: 'Sue'}, {age: 25, name: 'Frank'}], [{age: 30, name: 'Joe'}],
              [{age: 35, name: 'Sarah'}], 'completed'
            ]);
          });
    });
  });

  it('ignoreElements func callback should run in the correct zone', () => {
    const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
    const ignoreZone1: Zone = Zone.current.fork({name: 'Ignore Zone1'});
    const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
    const error = new Error('test');
    observable1 = constructorZone1.run(() => {
      return Rx.Observable.of(1, 2, 3).ignoreElements();
    });

    subscriptionZone.run(() => {
      observable1.subscribe(
          (result: any) => {
            fail('should not call next');
          },
          (err: any) => {
            fail('should not call error');
          },
          () => {
            log.push('completed');
            expect(Zone.current.name).toEqual(subscriptionZone.name);
            expect(log).toEqual(['completed']);
          });
    });
  });

  it('isEmpty func callback should run in the correct zone', () => {
    const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
    const isEmptyZone1: Zone = Zone.current.fork({name: 'IsEmpty Zone1'});
    const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
    const error = new Error('test');
    observable1 = constructorZone1.run(() => {
      return Rx.Observable.of(1, 2, 3).isEmpty();
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
            expect(log).toEqual([false, 'completed']);
          });
    });
  });

  it('last func callback should run in the correct zone', () => {
    const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
    const lastZone1: Zone = Zone.current.fork({name: 'Last Zone1'});
    const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
    const error = new Error('test');
    observable1 = constructorZone1.run(() => {
      return Rx.Observable.of(1, 2, 3).last();
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
            expect(log).toEqual([3, 'completed']);
          });
    });
  });

  it('map func callback should run in the correct zone', () => {
    const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
    const mapZone1: Zone = Zone.current.fork({name: 'Map Zone1'});
    const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
    const error = new Error('test');
    observable1 = constructorZone1.run(() => {
      return Rx.Observable.of(1, 2, 3);
    });

    observable1 = mapZone1.run(() => {
      return observable1.map((v: any) => {
        expect(Zone.current.name).toEqual(mapZone1.name);
        return v + 1;
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
            expect(log).toEqual([2, 3, 4, 'completed']);
          });
    });
  });

  it('mapTo func callback should run in the correct zone', () => {
    const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
    const mapToZone1: Zone = Zone.current.fork({name: 'MapTo Zone1'});
    const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
    const error = new Error('test');
    observable1 = constructorZone1.run(() => {
      return Rx.Observable.of(1, 2, 3);
    });

    observable1 = mapToZone1.run(() => {
      return observable1.mapTo('a');
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

  it('max func callback should run in the correct zone', () => {
    const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
    const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
    const error = new Error('test');
    observable1 = constructorZone1.run(() => {
      return Rx.Observable.of(4, 2, 3).max();
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
            expect(log).toEqual([4, 'completed']);
          });
    });
  });

  it('max with comparer func callback should run in the correct zone', () => {
    const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
    const maxZone1: Zone = Zone.current.fork({name: 'Max Zone1'});
    const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
    const error = new Error('test');
    observable1 = constructorZone1.run(() => {
      return Rx.Observable.of(4, 2, 3);
    });

    observable1 = maxZone1.run(() => {
      return observable1.max((x: number, y: number) => {
        expect(Zone.current.name).toEqual(maxZone1.name);
        return x < y ? -1 : 1;
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
            expect(log).toEqual([4, 'completed']);
          });
    });
  });

  it('min func callback should run in the correct zone', () => {
    const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
    const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
    const error = new Error('test');
    observable1 = constructorZone1.run(() => {
      return Rx.Observable.of(4, 2, 3).min();
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
            expect(log).toEqual([2, 'completed']);
          });
    });
  });

  it('min with comparer func callback should run in the correct zone', () => {
    const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
    const minZone1: Zone = Zone.current.fork({name: 'Min Zone1'});
    const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
    const error = new Error('test');
    observable1 = constructorZone1.run(() => {
      return Rx.Observable.of(4, 2, 3);
    });

    observable1 = minZone1.run(() => {
      return observable1.max((x: number, y: number) => {
        expect(Zone.current.name).toEqual(minZone1.name);
        return x < y ? 1 : -1;
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
            expect(log).toEqual([2, 'completed']);
          });
    });
  });

  it('reduce func callback should run in the correct zone', () => {
    const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
    const reduceZone1: Zone = Zone.current.fork({name: 'Min Zone1'});
    const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
    observable1 = constructorZone1.run(() => {
      return Rx.Observable.of(4, 2, 3);
    });

    observable1 = reduceZone1.run(() => {
      return observable1.reduce((acc: number, one: number) => {
        expect(Zone.current.name).toEqual(reduceZone1.name);
        return acc + one;
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
            expect(log).toEqual([9, 'completed']);
          });
    });
  });

  it('scan func callback should run in the correct zone', () => {
    const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
    const scanZone1: Zone = Zone.current.fork({name: 'Min Zone1'});
    const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
    observable1 = constructorZone1.run(() => {
      return Rx.Observable.of(4, 2, 3);
    });

    observable1 = scanZone1.run(() => {
      return observable1.scan((acc: number, one: number) => {
        expect(Zone.current.name).toEqual(scanZone1.name);
        return acc + one;
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
            expect(log).toEqual([4, 6, 9, 'completed']);
          });
    });
  });

  it('repeat func callback should run in the correct zone', () => {
    const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
    const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
    observable1 = constructorZone1.run(() => {
      return Rx.Observable.of(1).repeat(2);
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
            expect(log).toEqual([1, 1, 'completed']);
          });
    });
  });

  it('single func callback should run in the correct zone', () => {
    const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
    const singleZone1: Zone = Zone.current.fork({name: 'Single Zone1'});
    const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
    observable1 = constructorZone1.run(() => {
      return Rx.Observable.of(1, 2, 3, 4, 5);
    });

    observable1 = singleZone1.run(() => {
      return observable1.single((val: any) => {
        expect(Zone.current.name).toEqual(singleZone1.name);
        return val === 4;
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
            expect(log).toEqual([4, 'completed']);
          });
    });
  });

  it('skip func callback should run in the correct zone', () => {
    const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
    const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
    observable1 = constructorZone1.run(() => {
      return Rx.Observable.of(1, 2, 3, 4, 5).skip(3);
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
            expect(log).toEqual([4, 5, 'completed']);
          });
    });
  });

  xit('skipUntil func callback should run in the correct zone', asyncTest((done: any) => {
        const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
        const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
        observable1 = constructorZone1.run(() => {
          return Rx.Observable.interval(10).skipUntil(Rx.Observable.interval(25));
        });

        subscriptionZone.run(() => {
          const subscriber = observable1.subscribe(
              (result: any) => {
                log.push(result);
                expect(Zone.current.name).toEqual(subscriptionZone.name);
                subscriber.complete();
              },
              (err: any) => {
                fail('should not call error');
              },
              () => {
                log.push('completed');
                expect(Zone.current.name).toEqual(subscriptionZone.name);
                expect(log).toEqual([2, 'completed']);
                done();
              });
        });
      }, Zone.root));

  it('skipWhile func callback should run in the correct zone', asyncTest((done: any) => {
       const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
       const skipZone1: Zone = Zone.current.fork({name: 'Skip Zone1'});
       const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
       observable1 = constructorZone1.run(() => {
         return Rx.Observable.interval(10);
       });

       observable1 = skipZone1.run(() => {
         return observable1.skipWhile((val: any) => {
           expect(Zone.current.name).toEqual(skipZone1.name);
           return val < 2;
         });
       });

       subscriptionZone.run(() => {
         const subscriber = observable1.subscribe(
             (result: any) => {
               log.push(result);
               expect(Zone.current.name).toEqual(subscriptionZone.name);
               subscriber.complete();
             },
             (err: any) => {
               fail('should not call error');
             },
             () => {
               log.push('completed');
               expect(Zone.current.name).toEqual(subscriptionZone.name);
               expect(log).toEqual([2, 'completed']);
               done();
             });
       });
     }, Zone.root));

  it('startWith func callback should run in the correct zone', () => {
    const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
    const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
    observable1 = constructorZone1.run(() => {
      return Rx.Observable.of(1, 2).startWith(3);
    });

    subscriptionZone.run(() => {
      const subscriber = observable1.subscribe(
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
            expect(log).toEqual([3, 1, 2, 'completed']);
          });
    });
  });
});