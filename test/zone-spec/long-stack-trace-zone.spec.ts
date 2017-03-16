/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {zoneSymbol} from '../../lib/common/utils';
const defineProperty = (Object as any)[zoneSymbol('defineProperty')] || Object.defineProperty;

describe('longStackTraceZone', function() {
  let log: Error[];
  let lstz: Zone;
  let longStackTraceZoneSpec = (Zone as any)['longStackTraceZoneSpec'];

  beforeEach(function() {
    lstz = Zone.current.fork(longStackTraceZoneSpec).fork({
      name: 'long-stack-trace-zone-test',
      onHandleError: (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
                      error: any): boolean => {
        parentZoneDelegate.handleError(targetZone, error);
        log.push(error);
        return false;
      }
    });

    log = [];
  });

  it('should produce long stack traces', function(done) {
    lstz.run(function() {
      setTimeout(function() {
        setTimeout(function() {
          setTimeout(function() {
            try {
              expect(log[0].stack.split('Elapsed').length).toBe(3);
              done();
            } catch (e) {
              expect(e).toBe(null);
            }
          }, 0);
          throw new Error('Hello');
        }, 0);
      }, 0);
    });
  });

  it('should produce a long stack trace even if stack setter throws', (done) => {
    let wasStackAssigne = false;
    let error = new Error('Expected error');
    defineProperty(error, 'stack', {
      configurable: false,
      get: () => 'someStackTrace',
      set: (v: any) => {
        throw new Error('no writes');
      }
    });
    lstz.run(() => {
      setTimeout(() => {
        throw error;
      });
    });
    setTimeout(() => {
      const e = log[0];
      expect((e as any).longStack).toBeTruthy();
      done();
    });
  });

  it('should produce long stack traces when has uncaught error in promise', function(done) {
    lstz.runGuarded(function() {
      setTimeout(function() {
        setTimeout(function() {
          let promise = new Promise(function(resolve, reject) {
            setTimeout(function() {
              reject(new Error('Hello Promise'));
            }, 0);
          });
          promise.then(function() {
            fail('should not get here');
          });
          setTimeout(function() {
            try {
              expect(log[0].stack.split('Elapsed').length).toBe(5);
              done();
            } catch (e) {
              expect(e).toBe(null);
            }
          }, 0);
        }, 0);
      }, 0);
    });
  });

  it('should produce long stack traces when handling error in promise', function(done) {
    lstz.runGuarded(function() {
      setTimeout(function() {
        setTimeout(function() {
          let promise = new Promise(function(resolve, reject) {
            setTimeout(function() {
              reject(new Error('Hello Promise'));
            }, 0);
          });
          promise.catch(function(error) {
            // should be able to get long stack trace
            const longStackFrames: string = longStackTraceZoneSpec.getLongStackTrace(error);
            expect(longStackFrames.split('Elapsed').length).toBe(4);
            done();
          });
        }, 0);
      }, 0);
    });
  });
});
