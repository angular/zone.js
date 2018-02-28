/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import '../../lib/zone-spec/async-test';
import {ifEnvSupports} from '../test-util';

describe('AsyncTestZoneSpec', function() {
  let log: string[];
  const AsyncTestZoneSpec = (Zone as any)['AsyncTestZoneSpec'];

  function finishCallback() {
    log.push('finish');
  }

  function failCallback() {
    log.push('fail');
  }

  beforeEach(() => {
    log = [];
  });

  it('should call finish after zone is run in sync call', (done) => {
    let finished = false;
    const testZoneSpec = new AsyncTestZoneSpec(() => {
      expect(finished).toBe(true);
      done();
    }, failCallback, 'name');

    const atz = Zone.current.fork(testZoneSpec);

    atz.run(function() {
      finished = true;
    });
  });

  it('should call finish after a setTimeout is done', (done) => {
    let finished = false;

    const testZoneSpec = new AsyncTestZoneSpec(
        () => {
          expect(finished).toBe(true);
          done();
        },
        () => {
          done.fail('async zone called failCallback unexpectedly');
        },
        'name');

    const atz = Zone.current.fork(testZoneSpec);

    atz.run(function() {
      setTimeout(() => {
        finished = true;
      }, 10);
    });
  });

  it('should call finish after microtasks are done', (done) => {
    let finished = false;

    const testZoneSpec = new AsyncTestZoneSpec(
        () => {
          expect(finished).toBe(true);
          done();
        },
        () => {
          done.fail('async zone called failCallback unexpectedly');
        },
        'name');

    const atz = Zone.current.fork(testZoneSpec);

    atz.run(function() {
      Promise.resolve().then(() => {
        finished = true;
      });
    });
  });

  it('should call finish after both micro and macrotasks are done', (done) => {
    let finished = false;

    const testZoneSpec = new AsyncTestZoneSpec(
        () => {
          expect(finished).toBe(true);
          done();
        },
        () => {
          done.fail('async zone called failCallback unexpectedly');
        },
        'name');

    const atz = Zone.current.fork(testZoneSpec);

    atz.run(function() {
      new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 10);
      }).then(() => {
        finished = true;
      });
    });
  });

  it('should call finish after both macro and microtasks are done', (done) => {
    let finished = false;

    const testZoneSpec = new AsyncTestZoneSpec(
        () => {
          expect(finished).toBe(true);
          done();
        },
        () => {
          done.fail('async zone called failCallback unexpectedly');
        },
        'name');

    const atz = Zone.current.fork(testZoneSpec);

    atz.run(function() {
      Promise.resolve().then(() => {
        setTimeout(() => {
          finished = true;
        }, 10);
      });
    });
  });

  describe('event tasks', ifEnvSupports('document', () => {
             let button: HTMLButtonElement;
             beforeEach(function() {
               button = document.createElement('button');
               document.body.appendChild(button);
             });
             afterEach(function() {
               document.body.removeChild(button);
             });

             it('should call finish because an event task is considered as sync', (done) => {
               let finished = false;

               const testZoneSpec = new AsyncTestZoneSpec(
                   () => {
                     expect(finished).toBe(true);
                     done();
                   },
                   () => {
                     done.fail('async zone called failCallback unexpectedly');
                   },
                   'name');

               const atz = Zone.current.fork(testZoneSpec);

               atz.run(function() {
                 const listener = () => {
                   finished = true;
                 };
                 button.addEventListener('click', listener);

                 const clickEvent = document.createEvent('Event');
                 clickEvent.initEvent('click', true, true);

                 button.dispatchEvent(clickEvent);
               });
             });

             it('should call finish after an event task is done asynchronously', (done) => {
               let finished = false;

               const testZoneSpec = new AsyncTestZoneSpec(
                   () => {
                     expect(finished).toBe(true);
                     done();
                   },
                   () => {
                     done.fail('async zone called failCallback unexpectedly');
                   },
                   'name');

               const atz = Zone.current.fork(testZoneSpec);

               atz.run(function() {
                 button.addEventListener('click', () => {
                   setTimeout(() => {
                     finished = true;
                   }, 10);
                 });

                 const clickEvent = document.createEvent('Event');
                 clickEvent.initEvent('click', true, true);

                 button.dispatchEvent(clickEvent);
               });
             });
           }));

  describe('XHRs', ifEnvSupports('XMLHttpRequest', () => {
             it('should wait for XHRs to complete', function(done) {
               let req: XMLHttpRequest;
               let finished = false;

               const testZoneSpec = new AsyncTestZoneSpec(
                   () => {
                     expect(finished).toBe(true);
                     done();
                   },
                   (err: Error) => {
                     done.fail('async zone called failCallback unexpectedly');
                   },
                   'name');

               const atz = Zone.current.fork(testZoneSpec);

               atz.run(function() {
                 req = new XMLHttpRequest();

                 req.onreadystatechange = () => {
                   if (req.readyState === XMLHttpRequest.DONE) {
                     finished = true;
                   }
                 };

                 req.open('get', '/', true);
                 req.send();
               });
             });

             it('should fail if an xhr fails', function(done) {
               let req: XMLHttpRequest;

               const testZoneSpec = new AsyncTestZoneSpec(
                   () => {
                     done.fail('expected failCallback to be called');
                   },
                   (err: Error) => {
                     expect(err.message).toEqual('bad url failure');
                     done();
                   },
                   'name');

               const atz = Zone.current.fork(testZoneSpec);

               atz.run(function() {
                 req = new XMLHttpRequest();
                 req.onload = () => {
                   if (req.status != 200) {
                     throw new Error('bad url failure');
                   }
                 };
                 req.open('get', '/bad-url', true);
                 req.send();
               });
             });
           }));

  it('should not fail if setInterval is used and canceled', (done) => {
    const testZoneSpec = new AsyncTestZoneSpec(
        () => {
          done();
        },
        (err: Error) => {
          done.fail('async zone called failCallback unexpectedly');
        },
        'name');

    const atz = Zone.current.fork(testZoneSpec);

    atz.run(function() {
      let id = setInterval(() => {
        clearInterval(id);
      }, 100);
    });
  });

  it('should fail if an error is thrown asynchronously', (done) => {
    const testZoneSpec = new AsyncTestZoneSpec(
        () => {
          done.fail('expected failCallback to be called');
        },
        (err: Error) => {
          expect(err.message).toEqual('my error');
          done();
        },
        'name');

    const atz = Zone.current.fork(testZoneSpec);

    atz.run(function() {
      setTimeout(() => {
        throw new Error('my error');
      }, 10);
    });
  });

  it('should fail if a promise rejection is unhandled', (done) => {
    const testZoneSpec = new AsyncTestZoneSpec(
        () => {
          done.fail('expected failCallback to be called');
        },
        (err: Error) => {
          expect(err.message).toEqual('Uncaught (in promise): my reason');
          done();
        },
        'name');

    const atz = Zone.current.fork(testZoneSpec);

    atz.run(function() {
      Promise.reject('my reason');
    });

  });

  describe('non zone aware async task in promise should be detected', () => {
    it('should be able to detect non zone aware async task in promise', (done) => {
      let finished = false;

      const testZoneSpec = new AsyncTestZoneSpec(
          () => {
            expect(finished).toBe(true);
            done();
          },
          () => {
            done.fail('async zone called failCallback unexpectedly');
          },
          'name');

      const atz = Zone.current.fork(testZoneSpec);

      atz.run(() => {
        new Promise((res, rej) => {
          const g: any = typeof window === 'undefined' ? global : window;
          g[Zone.__symbol__('setTimeout')](res, 100);
        }).then(() => {
          finished = true;
        });
      });
    });
  });

  describe('ProxyZone with AsyncTestZoneSpec', () => {
    const ProxyZoneSpec = (Zone as any)['ProxyZoneSpec'];
    const AsyncTestZoneSpec = (Zone as any)['AsyncTestZoneSpec'];

    function testAsync(fn: Function, doneFn?: Function) {
      return function(done: any) {
        runInTestZone(fn, this, function() {
          if (doneFn) {
            doneFn();
          }
          done();
        }, (err: any) => {
          if (typeof err === 'string') {
            return done.fail(new Error(<string>err));
          } else {
            done.fail(err);
          }
        });
      };
    }

    function runInTestZone(
        fn: Function, context: any, finishCallback: Function, failCallback: Function) {
      const currentZone = Zone.current;
      const proxyZoneSpec = ProxyZoneSpec.get();
      ProxyZoneSpec.assertPresent();
      // We need to create the AsyncTestZoneSpec outside the ProxyZone.
      // If we do it in ProxyZone then we will get to infinite recursion.
      const proxyZone = Zone.current.getZoneWith('ProxyZoneSpec');
      const previousDelegate = proxyZoneSpec.getDelegate();
      proxyZone.parent.run(() => {
        const testZoneSpec: ZoneSpec = new AsyncTestZoneSpec(
            () => {
              // Need to restore the original zone.
              if (proxyZoneSpec.getDelegate() == testZoneSpec) {
                // Only reset the zone spec if it's sill this one. Otherwise, assume it's OK.
                proxyZoneSpec.setDelegate(previousDelegate);
              }
              currentZone.run(() => {
                finishCallback();
              });
            },
            (error: any) => {
              // Need to restore the original zone.
              if (proxyZoneSpec.getDelegate() == testZoneSpec) {
                // Only reset the zone spec if it's sill this one. Otherwise, assume it's OK.
                proxyZoneSpec.setDelegate(previousDelegate);
              }
              currentZone.run(() => {
                failCallback(error);
              });
            },
            'test');
        proxyZoneSpec.setDelegate(testZoneSpec);
      });
      return Zone.current.runGuarded(fn, context);
    }

    describe('test without beforeEach', () => {
      const logs: string[] = [];
      it('should automatically done after async tasks finished', testAsync(() => {
        setTimeout(() => {
          logs.push('timeout');
        }, 100);
      }, () => {
        expect(logs).toEqual(['timeout']);
        logs.splice(0);
      }));
  
      it('should automatically done after all nested async tasks finished', testAsync(() => {
        setTimeout(() => {
          logs.push('timeout');
          setTimeout(() => {
            logs.push('nested timeout');
          }, 100);
        }, 100);
      }, () => {
        expect(logs).toEqual(['timeout', 'nested timeout']);
        logs.splice(0);
      }));
  
      it('should automatically done after multiple async tasks finished', testAsync(() => {
        setTimeout(() => {
          logs.push('1st timeout');
        }, 100);
  
        setTimeout(() => {
          logs.push('2nd timeout');
        }, 100);
      }, () => {
        expect(logs).toEqual(['1st timeout', '2nd timeout']);
        logs.splice(0);
      }));
    });
  
    describe('test with sync beforeEach', () => {
      const logs: string[] = [];
  
      beforeEach(() => {
        logs.splice(0);
        logs.push('beforeEach');
      });
  
      it('should automatically done after async tasks finished', testAsync(() => {
        setTimeout(() => {
          logs.push('timeout');
        }, 100);
      }, () => {
        expect(logs).toEqual(['beforeEach', 'timeout']);
      }));
    });
  
    describe('test with async beforeEach', () => {
      const logs: string[] = [];
  
      beforeEach(testAsync(() => {
        setTimeout(() => {
          logs.splice(0);
          logs.push('beforeEach');
        }, 100);
      }));
  
      it('should automatically done after async tasks finished', testAsync(() => {
        setTimeout(() => {
          logs.push('timeout');
        }, 100);
      }, () => {
        expect(logs).toEqual(['beforeEach', 'timeout']);
      }));
  
      it('should automatically done after all nested async tasks finished', testAsync(() => {
        setTimeout(() => {
          logs.push('timeout');
          setTimeout(() => {
            logs.push('nested timeout');
          }, 100);
        }, 100);
      }, () => {
        expect(logs).toEqual(['beforeEach', 'timeout', 'nested timeout']);
      }));
  
      it('should automatically done after multiple async tasks finished', testAsync(() => {
        setTimeout(() => {
          logs.push('1st timeout');
        }, 100);
  
        setTimeout(() => {
          logs.push('2nd timeout');
        }, 100);
      }, () => {
        expect(logs).toEqual(['beforeEach', '1st timeout', '2nd timeout']);
      }));
    });
  
    describe('test with async beforeEach and sync afterEach', () => {
      const logs: string[] = [];
  
      beforeEach(testAsync(() => {
        setTimeout(() => {
          expect(logs).toEqual([]);
          logs.push('beforeEach');
        }, 100);
      }));
  
      afterEach(() => {
        logs.splice(0);
      });
  
      it('should automatically done after async tasks finished', testAsync(() => {
        setTimeout(() => {
          logs.push('timeout');
        }, 100);
      }, () => {
        expect(logs).toEqual(['beforeEach', 'timeout']);
      }));
    });
  
    describe('test with async beforeEach and async afterEach', () => {
      const logs: string[] = [];
  
      beforeEach(testAsync(() => {
        setTimeout(() => {
          expect(logs).toEqual([]);
          logs.push('beforeEach');
        }, 100);
      }));
  
      afterEach(testAsync(() => {
        setTimeout(() => {
          logs.splice(0);
        }, 100);
      }));
  
      it('should automatically done after async tasks finished', testAsync(() => {
        setTimeout(() => {
          logs.push('timeout');
        }, 100);
      }, () => {
        expect(logs).toEqual(['beforeEach', 'timeout']);
      }));
    });

    describe('return promise', () => {
      let value = 'init';
      it('should only call finish once', testAsync(() => {
        return new Promise((resolve, _) => {
          setTimeout(() => {
            value = 'timeout';
            resolve();
          }, 100);
        });
      }, () => {
        expect(value).toEqual('timeout');
      }));
    });
  });
});
