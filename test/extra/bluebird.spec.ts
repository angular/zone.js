/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
// test bluebird promise patch
// this spec will not be integrated with Travis CI, because I don't
// want to add bluebird into devDependencies, you can run this spec
// on your local environment

describe('bluebird promise', () => {
  let BluebirdPromise;
  beforeAll(() => {
    BluebirdPromise = require('bluebird');
    // import bluebird patch
    require('../../lib/extra/bluebird');
    const patchBluebird = Zone[Zone['__symbol__']('bluebird')];
    patchBluebird(BluebirdPromise);
  });

  let log;

  const zone = Zone.root.fork({
    name: 'bluebird',
    onScheduleTask: (delegate, curr, targetZone, task) => {
      log.push('schedule bluebird task ' + task.source);
      return delegate.scheduleTask(targetZone, task);
    },
    onInvokeTask: (delegate, curr, target, task, applyThis, applyArgs) => {
      log.push('invoke bluebird task ' + task.source);
      return delegate.invokeTask(target, task, applyThis, applyArgs);
    }
  });

  beforeEach(() => {
    log = [];
  });

  it('bluebird promise then method should be in zone and treated as microTask', (done) => {
    zone.run(() => {
      const p = new BluebirdPromise((resolve, reject) => {
        setTimeout(() => {
          resolve('test');
        }, 0);
      });
      p.then(() => {
        expect(Zone.current.name).toEqual('bluebird');
        expect(log.filter(item => item === 'schedule bluebird task bluebird').length).toBe(1);
        expect(log.filter(item => item === 'invoke bluebird task bluebird').length).toBe(1);
        done();
      });
    });
  });

  it('bluebird promise catch method should be in zone and treated as microTask', (done) => {
    zone.run(() => {
      const p = new BluebirdPromise((resolve, reject) => {
        setTimeout(() => {
          reject('test');
        }, 0);
      });
      p.catch(() => {
        expect(log.filter(item => item === 'schedule bluebird task bluebird').length).toBe(1);
        expect(log.filter(item => item === 'invoke bluebird task bluebird').length).toBe(1);
        expect(Zone.current.name).toEqual('bluebird');
        done();
      });
    });
  });

  it('bluebird promise spread method should be in zone', (done) => {
    zone.run(() => {
      BluebirdPromise.all([BluebirdPromise.resolve('test1'), BluebirdPromise.resolve('test2')])
          .spread((r1, r2) => {
            expect(r1).toEqual('test1');
            expect(r2).toEqual('test2');
            expect(log.filter(item => item === 'schedule bluebird task bluebird').length).toBe(1);
            expect(log.filter(item => item === 'invoke bluebird task bluebird').length).toBe(1);
            expect(Zone.current.name).toEqual('bluebird');
            done();
          });
    });
  });

  it('bluebird promise finally method should be in zone', (done) => {
    zone.run(() => {
      const p = new BluebirdPromise((resolve, reject) => {
        setTimeout(() => {
          resolve('test');
        }, 0);
      });
      p.finally(() => {
        expect(log.filter(item => item === 'schedule bluebird task bluebird').length).toBe(1);
        expect(log.filter(item => item === 'invoke bluebird task bluebird').length).toBe(1);
        expect(Zone.current.name).toEqual('bluebird');
        done();
      });
    });
  });

  it('bluebird promise join method should be in zone', (done) => {
    zone.run(() => {
      BluebirdPromise
          .join(
              BluebirdPromise.resolve('test1'), BluebirdPromise.resolve('test2'),
              (r1, r2) => {
                expect(r1).toEqual('test1');
                expect(r2).toEqual('test2');
                expect(Zone.current.name).toEqual('bluebird');
              })
          .then(() => {
            expect(Zone.current.name).toEqual('bluebird');
            expect(log.filter(item => item === 'schedule bluebird task bluebird').length).toBe(1);
            expect(log.filter(item => item === 'invoke bluebird task bluebird').length).toBe(1);
            done();
          });
    });
  });

  it('bluebird promise try method should be in zone', (done) => {
    zone.run(() => {
      BluebirdPromise
          .try(() => {
            throw new Error('promise error');
          })
          .catch((err) => {
            expect(log.filter(item => item === 'schedule bluebird task bluebird').length).toBe(1);
            expect(log.filter(item => item === 'invoke bluebird task bluebird').length).toBe(1);
            expect(Zone.current.name).toEqual('bluebird');
            expect(err.message).toEqual('promise error');
            done();
          });
    });
  });

  it('bluebird promise method method should be in zone', (done) => {
    zone.run(() => {
      BluebirdPromise
          .method(() => {
            return 'test';
          })()
          .then((result) => {
            expect(log.filter(item => item === 'schedule bluebird task bluebird').length).toBe(1);
            expect(log.filter(item => item === 'invoke bluebird task bluebird').length).toBe(1);
            expect(Zone.current.name).toEqual('bluebird');
            expect(result).toEqual('test');
            done();
          });
    });
  });

  it('bluebird promise resolve method should be in zone', (done) => {
    zone.run(() => {
      BluebirdPromise.resolve('test').then((result) => {
        expect(log.filter(item => item === 'schedule bluebird task bluebird').length).toBe(1);
        expect(log.filter(item => item === 'invoke bluebird task bluebird').length).toBe(1);
        expect(Zone.current.name).toEqual('bluebird');
        expect(result).toEqual('test');
        done();
      });
    });
  });

  it('bluebird promise reject method should be in zone', (done) => {
    zone.run(() => {
      BluebirdPromise.reject('error').catch((error) => {
        expect(log.filter(item => item === 'schedule bluebird task bluebird').length).toBe(1);
        expect(log.filter(item => item === 'invoke bluebird task bluebird').length).toBe(1);
        expect(Zone.current.name).toEqual('bluebird');
        expect(error).toEqual('error');
        done();
      });
    });
  });

  it('bluebird promise all method should be in zone', (done) => {
    zone.run(() => {
      BluebirdPromise.all([BluebirdPromise.resolve('test1'), BluebirdPromise.resolve('test2')])
          .then((r) => {
            expect(r[0]).toEqual('test1');
            expect(r[1]).toEqual('test2');
            expect(log.filter(item => item === 'schedule bluebird task bluebird').length).toBe(1);
            expect(log.filter(item => item === 'invoke bluebird task bluebird').length).toBe(1);
            expect(Zone.current.name).toEqual('bluebird');
            done();
          });
    });
  });

  it('bluebird promise props method should be in zone', (done) => {
    zone.run(() => {
      BluebirdPromise
          .props({test1: BluebirdPromise.resolve('test1'), test2: BluebirdPromise.resolve('test2')})
          .then((r) => {
            expect(r.test1).toEqual('test1');
            expect(r.test2).toEqual('test2');
            expect(log.filter(item => item === 'schedule bluebird task bluebird').length).toBe(1);
            expect(log.filter(item => item === 'invoke bluebird task bluebird').length).toBe(1);
            expect(Zone.current.name).toEqual('bluebird');
            done();
          });
    });
  });

  it('bluebird promise any method should be in zone', (done) => {
    zone.run(() => {
      BluebirdPromise.any([BluebirdPromise.resolve('test1'), BluebirdPromise.resolve('test2')])
          .then((r) => {
            expect(r).toEqual('test1');
            expect(log.filter(item => item === 'schedule bluebird task bluebird').length).toBe(1);
            expect(log.filter(item => item === 'invoke bluebird task bluebird').length).toBe(1);
            expect(Zone.current.name).toEqual('bluebird');
            done();
          });
    });
  });

  it('bluebird promise some method should be in zone', (done) => {
    zone.run(() => {
      BluebirdPromise.some([BluebirdPromise.resolve('test1'), BluebirdPromise.resolve('test2')], 1)
          .then((r) => {
            expect(r.length).toBe(1);
            expect(r[0]).toEqual('test1');
            expect(log.filter(item => item === 'schedule bluebird task bluebird').length).toBe(1);
            expect(log.filter(item => item === 'invoke bluebird task bluebird').length).toBe(1);
            expect(Zone.current.name).toEqual('bluebird');
            done();
          });
    });
  });

  it('bluebird promise map method should be in zone', (done) => {
    zone.run(() => {
      BluebirdPromise
          .map(
              ['test1', 'test2'],
              (value) => {
                return BluebirdPromise.resolve(value);
              })
          .then((r) => {
            expect(r.length).toBe(2);
            expect(r[0]).toEqual('test1');
            expect(r[1]).toEqual('test2');
            expect(log.filter(item => item === 'schedule bluebird task bluebird').length).toBe(1);
            expect(log.filter(item => item === 'invoke bluebird task bluebird').length).toBe(1);
            expect(Zone.current.name).toEqual('bluebird');
            done();
          });
    });
  });

  it('bluebird promise reduce method should be in zone', (done) => {
    zone.run(() => {
      BluebirdPromise
          .reduce(
              [1, 2],
              (total, value) => {
                return BluebirdPromise.resolve(total + value);
              })
          .then((r) => {
            expect(r).toBe(3);
            expect(log.filter(item => item === 'schedule bluebird task bluebird').length)
                .toBeTruthy();
            expect(log.filter(item => item === 'invoke bluebird task bluebird').length)
                .toBeTruthy();
            expect(Zone.current.name).toEqual('bluebird');
            done();
          });
    });
  });

  it('bluebird promise filter method should be in zone', (done) => {
    zone.run(() => {
      BluebirdPromise
          .filter(
              [1, 2, 3],
              (value) => {
                return value % 2 === 0 ? BluebirdPromise.resolve(true) :
                                         BluebirdPromise.resolve(false);
              })
          .then((r) => {
            expect(r[0]).toBe(2);
            expect(log.filter(item => item === 'schedule bluebird task bluebird').length).toBe(1);
            expect(log.filter(item => item === 'invoke bluebird task bluebird').length).toBe(1);
            expect(Zone.current.name).toEqual('bluebird');
            done();
          });
    });
  });

  it('bluebird promise each method should be in zone', (done) => {
    zone.run(() => {
      const arr = [1, 2, 3];
      BluebirdPromise.each(
          BluebirdPromise.map(arr, (item) => BluebirdPromise.resolve(item)), (r, idx) => {
            expect(r[idx] === arr[idx]);
            expect(log.filter(item => item === 'schedule bluebird task bluebird').length)
                .toBeTruthy();
            expect(log.filter(item => item === 'invoke bluebird task bluebird').length)
                .toBeTruthy();
            expect(Zone.current.name).toEqual('bluebird');
            done();
          });
    });
  });

  it('bluebird promise mapSeries method should be in zone', (done) => {
    zone.run(() => {
      const arr = [1, 2, 3];
      BluebirdPromise.mapSeries(
          BluebirdPromise.map(arr, (item) => BluebirdPromise.resolve(item)), (r, idx) => {
            expect(r[idx] === arr[idx]);
            expect(log.filter(item => item === 'schedule bluebird task bluebird').length)
                .toBeTruthy();
            expect(log.filter(item => item === 'invoke bluebird task bluebird').length)
                .toBeTruthy();
            expect(Zone.current.name).toEqual('bluebird');
            done();
          });
    });
  });

  it('bluebird promise race method should be in zone', (done) => {
    zone.run(() => {
      BluebirdPromise.race([BluebirdPromise.resolve('test1'), BluebirdPromise.resolve('test2')])
          .then((r) => {
            expect(r).toEqual('test1');
            expect(log.filter(item => item === 'schedule bluebird task bluebird').length).toBe(1);
            expect(log.filter(item => item === 'invoke bluebird task bluebird').length).toBe(1);
            expect(Zone.current.name).toEqual('bluebird');
            done();
          });
    });
  });

  it('bluebird promise using/disposer method should be in zone', (done) => {
    zone.run(() => {
      const p = new BluebirdPromise((resolve, reject) => {
        setTimeout(() => {
          resolve('test');
        }, 0);
      });
      p.leakObj = [];
      const disposer = p.disposer(() => {
        p.leakObj = null;
      });
      BluebirdPromise
          .using(
              disposer,
              (v) => {
                p.leakObj.push(v);
              })
          .then(() => {
            expect(Zone.current.name).toEqual('bluebird');
            expect(p.leakObj).toBe(null);
            // using will generate several promise inside bluebird
            expect(log.filter(item => item === 'schedule bluebird task bluebird').length).toBe(1);
            expect(log.filter(item => item === 'invoke bluebird task bluebird').length).toBe(1);
            done();
          });
    });
  });

  it('bluebird promise promisify method should be in zone and treated as microTask', (done) => {
    const func = (cb: Function) => {
      setTimeout(() => {
        cb(null, 'test');
      }, 10);
    };

    const promiseFunc = BluebirdPromise.promisify(func);
    zone.run(() => {
      promiseFunc().then((r) => {
        expect(Zone.current.name).toEqual('bluebird');
        expect(r).toBe('test');
        expect(log.filter(item => item === 'schedule bluebird task bluebird').length).toBe(1);
        expect(log.filter(item => item === 'invoke bluebird task bluebird').length).toBe(1);
        done();
      });
    });
  });

  it('bluebird promise promisifyAll method should be in zone', (done) => {
    const obj = {
      func1: (cb: Function) => {
        setTimeout(() => {
          cb(null, 'test1');
        }, 10);
      },
      func2: (cb: Function) => {
        setTimeout(() => {
          cb(null, 'test2');
        }, 10);
      },
    };

    const promiseObj = BluebirdPromise.promisifyAll(obj);
    zone.run(() => {
      BluebirdPromise.all([promiseObj.func1Async(), promiseObj.func2Async()]).then((r) => {
        expect(Zone.current.name).toEqual('bluebird');
        expect(r[0]).toBe('test1');
        expect(r[1]).toBe('test2');
        // using will generate several promise inside
        expect(log.filter(item => item === 'schedule bluebird task bluebird').length).toBe(2);
        expect(log.filter(item => item === 'invoke bluebird task bluebird').length).toBe(2);
        done();
      });
    });
  });

  it('bluebird promise fromCallback method should be in zone', (done) => {
    const resolver = (cb: Function) => {
      setTimeout(() => {
        cb(null, 'test');
      }, 10);
    };

    zone.run(() => {
      BluebirdPromise.fromCallback(resolver).then((r) => {
        expect(Zone.current.name).toEqual('bluebird');
        expect(r).toBe('test');
        expect(log.filter(item => item === 'schedule bluebird task bluebird').length).toBe(1);
        expect(log.filter(item => item === 'invoke bluebird task bluebird').length).toBe(1);
        done();
      });
    });
  });

  it('bluebird promise asCallback method should be in zone', (done) => {
    zone.run(() => {
      BluebirdPromise.resolve('test').asCallback((err, r) => {
        expect(Zone.current.name).toEqual('bluebird');
        expect(r).toBe('test');
        done();
      });
    });
  });

  it('bluebird promise delay method should be in zone', (done) => {
    zone.run(() => {
      BluebirdPromise.resolve('test').delay(10).then((r) => {
        expect(Zone.current.name).toEqual('bluebird');
        expect(r).toBe('test');
        expect(log.filter(item => item === 'schedule bluebird task bluebird').length).toBe(2);
        expect(log.filter(item => item === 'invoke bluebird task bluebird').length).toBe(2);
        done();
      });
    });
  });

  it('bluebird promise timeout method should be in zone', (done) => {
    zone.run(() => {
      new BluebirdPromise((resolve, reject) => {
        setTimeout(() => {
          resolve('test');
        }, 10);
      })
          .timeout(100)
          .then((r) => {
            expect(Zone.current.name).toEqual('bluebird');
            expect(r).toBe('test');
            expect(log.filter(item => item === 'schedule bluebird task bluebird').length).toBe(1);
            expect(log.filter(item => item === 'invoke bluebird task bluebird').length).toBe(1);
            done();
          });
    });
  });

  it('bluebird promise tap method should be in zone', (done) => {
    zone.run(() => {
      const p = new BluebirdPromise((resolve, reject) => {
        setTimeout(() => {
          resolve('test');
        }, 0);
      });
      p.tap(() => {
        expect(log.filter(item => item === 'schedule bluebird task bluebird').length).toBe(1);
        expect(log.filter(item => item === 'invoke bluebird task bluebird').length).toBe(1);
        expect(Zone.current.name).toEqual('bluebird');
        done();
      });
    });
  });

  it('bluebird promise call method should be in zone', (done) => {
    zone.run(() => {
      BluebirdPromise
          .map(
              ['test1', 'test2'],
              (value) => {
                return BluebirdPromise.resolve(value);
              })
          .call(
              'shift',
              (value) => {
                return value;
              })
          .then((r) => {
            expect(r).toEqual('test1');
            expect(log.filter(item => item === 'schedule bluebird task bluebird').length).toBe(1);
            expect(log.filter(item => item === 'invoke bluebird task bluebird').length).toBe(1);
            expect(Zone.current.name).toEqual('bluebird');
            done();
          });
    });
  });

  it('bluebird promise get method should be in zone', (done) => {
    zone.run(() => {
      BluebirdPromise.resolve(['test1', 'test2']).get(-1).then((r) => {
        expect(r).toEqual('test2');
        expect(log.filter(item => item === 'schedule bluebird task bluebird').length).toBe(1);
        expect(log.filter(item => item === 'invoke bluebird task bluebird').length).toBe(1);
        expect(Zone.current.name).toEqual('bluebird');
        done();
      });
    });
  });

  it('bluebird promise return method should be in zone', (done) => {
    zone.run(() => {
      BluebirdPromise.resolve().return ('test1').then((r) => {
        expect(r).toEqual('test1');
        expect(log.filter(item => item === 'schedule bluebird task bluebird').length).toBe(1);
        expect(log.filter(item => item === 'invoke bluebird task bluebird').length).toBe(1);
        expect(Zone.current.name).toEqual('bluebird');
        done();
      });
    });
  });

  it('bluebird promise throw method should be in zone', (done) => {
    zone.run(() => {
      BluebirdPromise.resolve().throw('test1').catch((r) => {
        expect(r).toEqual('test1');
        expect(log.filter(item => item === 'schedule bluebird task bluebird').length).toBe(1);
        expect(log.filter(item => item === 'invoke bluebird task bluebird').length).toBe(1);
        expect(Zone.current.name).toEqual('bluebird');
        done();
      });
    });
  });

  it('bluebird promise catchReturn method should be in zone', (done) => {
    zone.run(() => {
      BluebirdPromise.reject().catchReturn('test1').then((r) => {
        expect(r).toEqual('test1');
        expect(log.filter(item => item === 'schedule bluebird task bluebird').length).toBe(1);
        expect(log.filter(item => item === 'invoke bluebird task bluebird').length).toBe(1);
        expect(Zone.current.name).toEqual('bluebird');
        done();
      });
    });
  });

  it('bluebird promise catchThrow method should be in zone', (done) => {
    zone.run(() => {
      BluebirdPromise.reject().catchThrow('test1').catch((r) => {
        expect(r).toEqual('test1');
        expect(log.filter(item => item === 'schedule bluebird task bluebird').length).toBe(1);
        expect(log.filter(item => item === 'invoke bluebird task bluebird').length).toBe(1);
        expect(Zone.current.name).toEqual('bluebird');
        done();
      });
    });
  });

  it('bluebird promise reflect method should be in zone', (done) => {
    zone.run(() => {
      const promises = [BluebirdPromise.resolve('test1'), BluebirdPromise.reject('test2')];
      BluebirdPromise
          .all(promises.map(promise => {
            return promise.reflect();
          }))
          .each((r) => {
            if (r.isFulfilled()) {
              expect(r.value()).toEqual('test1');
            } else {
              expect(r.reason()).toEqual('test2');
              done();
            }
            expect(Zone.current.name).toEqual('bluebird');
          });
    });
  });
});
