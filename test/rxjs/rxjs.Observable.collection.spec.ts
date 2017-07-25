/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as Rx from 'rxjs/Rx';

describe('Observable.collection', () => {
  let log: string[];
  let observable1: any;

  beforeEach(() => {
    log = [];
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
});