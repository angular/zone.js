/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import '../../lib/zone-spec/fake-async-test';

import {isNode} from '../../lib/common/utils';
import {ifEnvSupports} from '../test-util';

function supportNode() {
  return isNode;
}

(supportNode as any).message = 'support node';

describe('FakeAsyncTestZoneSpec', () => {
  let FakeAsyncTestZoneSpec = (Zone as any)['FakeAsyncTestZoneSpec'];
  let testZoneSpec: any;
  let fakeAsyncTestZone: Zone;

  beforeEach(() => {
    testZoneSpec = new FakeAsyncTestZoneSpec('name');
    fakeAsyncTestZone = Zone.current.fork(testZoneSpec);
  });

  it('sets the FakeAsyncTestZoneSpec property', () => {
    fakeAsyncTestZone.run(() => {
      expect(Zone.current.get('FakeAsyncTestZoneSpec')).toEqual(testZoneSpec);
    });
  });

  describe('synchronous code', () => {
    it('should run', () => {
      let ran = false;
      fakeAsyncTestZone.run(() => {
        ran = true;
      });

      expect(ran).toEqual(true);
    });

    it('should throw the error in the code', () => {
      expect(() => {
        fakeAsyncTestZone.run(() => {
          throw new Error('sync');
        });
      }).toThrowError('sync');
    });

    it('should throw error on Rejected promise', () => {
      expect(() => {
        fakeAsyncTestZone.run(() => {
          Promise.reject('myError');
          testZoneSpec.flushMicrotasks();
        });
      }).toThrowError('Uncaught (in promise): myError');
    });
  });

  describe('asynchronous code', () => {
    it('should run', () => {
      fakeAsyncTestZone.run(() => {
        let thenRan = false;
        Promise.resolve(null).then((_) => {
          thenRan = true;
        });

        expect(thenRan).toEqual(false);

        testZoneSpec.flushMicrotasks();
        expect(thenRan).toEqual(true);
      });
    });

    it('should rethrow the exception on flushMicroTasks for error thrown in Promise callback',
       () => {
         fakeAsyncTestZone.run(() => {
           Promise.resolve(null).then((_) => {
             throw new Error('async');
           });
           expect(() => {
             testZoneSpec.flushMicrotasks();
           }).toThrowError(/Uncaught \(in promise\): Error: async/);
         });
       });

    it('should run chained thens', () => {
      fakeAsyncTestZone.run(() => {
        let log: number[] = [];

        Promise.resolve(null).then((_) => log.push(1)).then((_) => log.push(2));

        expect(log).toEqual([]);

        testZoneSpec.flushMicrotasks();
        expect(log).toEqual([1, 2]);
      });
    });

    it('should run Promise created in Promise', () => {
      fakeAsyncTestZone.run(() => {
        let log: number[] = [];

        Promise.resolve(null).then((_) => {
          log.push(1);
          Promise.resolve(null).then((_) => log.push(2));
        });

        expect(log).toEqual([]);

        testZoneSpec.flushMicrotasks();
        expect(log).toEqual([1, 2]);
      });
    });
  });

  describe('timers', () => {
    it('should run queued zero duration timer on zero tick', () => {
      fakeAsyncTestZone.run(() => {
        let ran = false;
        setTimeout(() => {
          ran = true;
        }, 0);

        expect(ran).toEqual(false);

        testZoneSpec.tick();
        expect(ran).toEqual(true);
      });
    });

    it('should run queued timer after sufficient clock ticks', () => {
      fakeAsyncTestZone.run(() => {
        let ran = false;
        setTimeout(() => {
          ran = true;
        }, 10);

        testZoneSpec.tick(6);
        expect(ran).toEqual(false);

        testZoneSpec.tick(4);
        expect(ran).toEqual(true);
      });
    });

    it('should run queued timer created by timer callback', () => {
      fakeAsyncTestZone.run(() => {
        let counter = 0;
        const startCounterLoop = () => {
          counter++;
          setTimeout(startCounterLoop, 10);
        };

        startCounterLoop();

        expect(counter).toEqual(1);

        testZoneSpec.tick(10);
        expect(counter).toEqual(2);

        testZoneSpec.tick(10);
        expect(counter).toEqual(3);

        testZoneSpec.tick(30);
        expect(counter).toEqual(6);
      });
    });

    it('should run queued timer only once', () => {
      fakeAsyncTestZone.run(() => {
        let cycles = 0;
        setTimeout(() => {
          cycles++;
        }, 10);

        testZoneSpec.tick(10);
        expect(cycles).toEqual(1);

        testZoneSpec.tick(10);
        expect(cycles).toEqual(1);

        testZoneSpec.tick(10);
        expect(cycles).toEqual(1);
      });
      expect(testZoneSpec.pendingTimers.length).toBe(0);
    });

    it('should not run cancelled timer', () => {
      fakeAsyncTestZone.run(() => {
        let ran = false;
        let id = setTimeout(() => {
          ran = true;
        }, 10);
        clearTimeout(id);

        testZoneSpec.tick(10);
        expect(ran).toEqual(false);
      });
    });

    it('should run periodic timers', () => {
      fakeAsyncTestZone.run(() => {
        let cycles = 0;
        let id = setInterval(() => {
          cycles++;
        }, 10);

        testZoneSpec.tick(10);
        expect(cycles).toEqual(1);

        testZoneSpec.tick(10);
        expect(cycles).toEqual(2);

        testZoneSpec.tick(10);
        expect(cycles).toEqual(3);

        testZoneSpec.tick(30);
        expect(cycles).toEqual(6);
      });
    });

    it('should not run cancelled periodic timer', () => {
      fakeAsyncTestZone.run(() => {
        let ran = false;
        let id = setInterval(() => {
          ran = true;
        }, 10);

        testZoneSpec.tick(10);
        expect(ran).toEqual(true);

        ran = false;
        clearInterval(id);
        testZoneSpec.tick(10);
        expect(ran).toEqual(false);
      });
    });

    it('should be able to cancel periodic timers from a callback', () => {
      fakeAsyncTestZone.run(() => {
        let cycles = 0;
        let id: number;

        id = setInterval(() => {
          cycles++;
          clearInterval(id);
        }, 10) as any as number;

        testZoneSpec.tick(10);
        expect(cycles).toEqual(1);

        testZoneSpec.tick(10);
        expect(cycles).toEqual(1);
      });
    });

    it('should process microtasks before timers', () => {
      fakeAsyncTestZone.run(() => {
        let log: string[] = [];

        Promise.resolve(null).then((_) => log.push('microtask'));

        setTimeout(() => log.push('timer'), 9);

        setInterval(() => log.push('periodic timer'), 10);

        expect(log).toEqual([]);

        testZoneSpec.tick(10);
        expect(log).toEqual(['microtask', 'timer', 'periodic timer']);
      });
    });

    it('should process micro-tasks created in timers before next timers', () => {
      fakeAsyncTestZone.run(() => {
        let log: string[] = [];

        Promise.resolve(null).then((_) => log.push('microtask'));

        setTimeout(() => {
          log.push('timer');
          Promise.resolve(null).then((_) => log.push('t microtask'));
        }, 9);

        let id = setInterval(() => {
          log.push('periodic timer');
          Promise.resolve(null).then((_) => log.push('pt microtask'));
        }, 10);

        testZoneSpec.tick(10);
        expect(log).toEqual(
            ['microtask', 'timer', 't microtask', 'periodic timer', 'pt microtask']);

        testZoneSpec.tick(10);
        expect(log).toEqual([
          'microtask', 'timer', 't microtask', 'periodic timer', 'pt microtask', 'periodic timer',
          'pt microtask'
        ]);
      });
    });

    it('should throw the exception from tick for error thrown in timer callback', () => {
      fakeAsyncTestZone.run(() => {
        setTimeout(() => {
          throw new Error('timer');
        }, 10);
        expect(() => {
          testZoneSpec.tick(10);
        }).toThrowError('timer');
      });
      // There should be no pending timers after the error in timer callback.
      expect(testZoneSpec.pendingTimers.length).toBe(0);
    });

    it('should throw the exception from tick for error thrown in periodic timer callback', () => {
      fakeAsyncTestZone.run(() => {
        let count = 0;
        setInterval(() => {
          count++;
          throw new Error(count.toString());
        }, 10);

        expect(() => {
          testZoneSpec.tick(10);
        }).toThrowError('1');

        // Periodic timer is cancelled on first error.
        expect(count).toBe(1);
        testZoneSpec.tick(10);
        expect(count).toBe(1);
      });
      // Periodic timer is removed from pending queue on error.
      expect(testZoneSpec.pendingPeriodicTimers.length).toBe(0);
    });
  });

  it('should be able to resume processing timer callbacks after handling an error', () => {
    fakeAsyncTestZone.run(() => {
      let ran = false;
      setTimeout(() => {
        throw new Error('timer');
      }, 10);
      setTimeout(() => {
        ran = true;
      }, 10);
      expect(() => {
        testZoneSpec.tick(10);
      }).toThrowError('timer');
      expect(ran).toBe(false);

      // Restart timer queue processing.
      testZoneSpec.tick(0);
      expect(ran).toBe(true);
    });
    // There should be no pending timers after the error in timer callback.
    expect(testZoneSpec.pendingTimers.length).toBe(0);
  });

  describe('flushing all tasks', () => {
    it('should flush all pending timers', () => {
      fakeAsyncTestZone.run(() => {
        let x = false;
        let y = false;
        let z = false;

        setTimeout(() => {
          x = true;
        }, 10);
        setTimeout(() => {
          y = true;
        }, 100);
        setTimeout(() => {
          z = true;
        }, 70);

        let elapsed = testZoneSpec.flush();

        expect(elapsed).toEqual(100);
        expect(x).toBe(true);
        expect(y).toBe(true);
        expect(z).toBe(true);
      });
    });

    it('should flush nested timers', () => {
      fakeAsyncTestZone.run(() => {
        let x = true;
        let y = true;
        setTimeout(() => {
          x = true;
          setTimeout(() => {
            y = true;
          }, 100);
        }, 200);

        let elapsed = testZoneSpec.flush();

        expect(elapsed).toEqual(300);
        expect(x).toBe(true);
        expect(y).toBe(true);
      });
    });

    it('should advance intervals', () => {
      fakeAsyncTestZone.run(() => {
        let x = false;
        let y = false;
        let z = 0;

        setTimeout(() => {
          x = true;
        }, 50);
        setTimeout(() => {
          y = true;
        }, 141);
        setInterval(() => {
          z++;
        }, 10);

        let elapsed = testZoneSpec.flush();

        expect(elapsed).toEqual(141);
        expect(x).toBe(true);
        expect(y).toBe(true);
        expect(z).toEqual(14);
      });
    });

    it('should not wait for intervals', () => {
      fakeAsyncTestZone.run(() => {
        let z = 0;

        setInterval(() => {
          z++;
        }, 10);

        let elapsed = testZoneSpec.flush();

        expect(elapsed).toEqual(0);
        expect(z).toEqual(0);
      });
    });


    it('should process micro-tasks created in timers before next timers', () => {
      fakeAsyncTestZone.run(() => {
        let log: string[] = [];

        Promise.resolve(null).then((_) => log.push('microtask'));

        setTimeout(() => {
          log.push('timer');
          Promise.resolve(null).then((_) => log.push('t microtask'));
        }, 20);

        let id = setInterval(() => {
          log.push('periodic timer');
          Promise.resolve(null).then((_) => log.push('pt microtask'));
        }, 10);

        testZoneSpec.flush();
        expect(log).toEqual(
            ['microtask', 'periodic timer', 'pt microtask', 'timer', 't microtask']);
      });
    });

    it('should throw the exception from tick for error thrown in timer callback', () => {
      fakeAsyncTestZone.run(() => {
        setTimeout(() => {
          throw new Error('timer');
        }, 10);
        expect(() => {
          testZoneSpec.flush();
        }).toThrowError('timer');
      });
      // There should be no pending timers after the error in timer callback.
      expect(testZoneSpec.pendingTimers.length).toBe(0);
    });

    it('should do something reasonable with polling timeouts', () => {
      expect(() => {
        fakeAsyncTestZone.run(() => {
          let z = 0;

          let poll = () => {
            setTimeout(() => {
              z++;
              poll();
            }, 10);
          };

          poll();
          testZoneSpec.flush();
        });
      })
          .toThrowError(
              'flush failed after reaching the limit of 20 tasks. Does your code use a polling timeout?');
    });
  });

  describe('outside of FakeAsync Zone', () => {
    it('calling flushMicrotasks should throw exception', () => {
      expect(() => {
        testZoneSpec.flushMicrotasks();
      }).toThrowError('The code should be running in the fakeAsync zone to call this function');
    });
    it('calling tick should throw exception', () => {
      expect(() => {
        testZoneSpec.tick();
      }).toThrowError('The code should be running in the fakeAsync zone to call this function');
    });
  });

  describe('XHRs', ifEnvSupports('XMLHttpRequest', () => {
             it('should throw an exception if an XHR is initiated in the zone', () => {
               expect(() => {
                 fakeAsyncTestZone.run(() => {
                   let finished = false;
                   let req = new XMLHttpRequest();

                   req.onreadystatechange = () => {
                     if (req.readyState === XMLHttpRequest.DONE) {
                       finished = true;
                     }
                   };

                   req.open('GET', '/', true);
                   req.send();
                 });
               }).toThrowError('Cannot make XHRs from within a fake async test.');
             });
           }));

  describe('node process', ifEnvSupports(supportNode, () => {
             it('should be able to schedule microTask with additional arguments', () => {
               const process = global['process'];
               const nextTick = process && process['nextTick'];
               if (!nextTick) {
                 return;
               }
               fakeAsyncTestZone.run(() => {
                 let tickRun = false;
                 let cbArgRun = false;
                 nextTick(
                     (strArg: string, cbArg: Function) => {
                       tickRun = true;
                       expect(strArg).toEqual('stringArg');
                       cbArg();
                     },
                     'stringArg',
                     () => {
                       cbArgRun = true;
                     });

                 expect(tickRun).toEqual(false);

                 testZoneSpec.flushMicrotasks();
                 expect(tickRun).toEqual(true);
                 expect(cbArgRun).toEqual(true);
               });

             });
           }));
});
