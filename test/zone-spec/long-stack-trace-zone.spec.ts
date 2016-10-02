import {zoneSymbol} from '../../lib/common/utils';
var defineProperty = Object[zoneSymbol('defineProperty')] || Object.defineProperty;

describe('longStackTraceZone', function() {
  let log: Error[];
  let lstz: Zone;

  beforeEach(function() {
    lstz = Zone.current.fork(Zone['longStackTraceZoneSpec']).fork({
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
              expect(log[0].stack.split('Elapsed: ').length).toBe(3);
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
      set: (v) => {
        throw new Error('no writes');
      }
    });
    lstz.run(() => {
      setTimeout(() => {
        throw error;
      });
    });
    setTimeout(() => {
      var e = log[0];
      expect((e as any).longStack).toBeTruthy();
      done();
    });
  });

  it('should produce long stack traces when reject in promise', function(done) {
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
              expect(log[0].stack.split('Elapsed: ').length).toBe(5);
              done();
            } catch (e) {
              expect(e).toBe(null);
            }
          }, 0);
        }, 0);
      }, 0);
    });
  });
});

export var __something__;
