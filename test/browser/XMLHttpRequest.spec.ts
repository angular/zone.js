/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ifEnvSupports, ifEnvSupportsWithDone, supportPatchXHROnProperty} from '../test-util';

describe('XMLHttpRequest', function() {
  let testZone: Zone;

  beforeEach(() => {
    testZone = Zone.current.fork({name: 'test'});
  });

  it('should intercept XHRs and treat them as MacroTasks', function(done) {
    let req: XMLHttpRequest;
    const testZoneWithWtf = Zone.current
      .fork((Zone as any)['wtfZoneSpec'])
      .fork({name: 'TestZone'});

    testZoneWithWtf.run(
      () => {
        req = new XMLHttpRequest();
        req.onload = () => {
          // The last entry in the log should be the invocation for the current onload,
          // which will vary depending on browser environment. The prior entries
          // should be the invocation of the send macrotask.
          expect(wtfMock.log[wtfMock.log.length - 3]).toEqual(
            '> Zone:invokeTask:XMLHttpRequest.send("<root>::ProxyZone::WTF::TestZone")'
          );
          expect(wtfMock.log[wtfMock.log.length - 2]).toEqual(
            '< Zone:invokeTask:XMLHttpRequest.send'
          );
          if (supportPatchXHROnProperty()) {
            expect(wtfMock.log[wtfMock.log.length - 1]).toMatch(
              /\> Zone\:invokeTask.*addEventListener\:load/
            );
          }
          done();
        };

        req.open('get', '/', true);
        req.send();
        const lastScheduled = wtfMock.log[wtfMock.log.length - 1];
        expect(lastScheduled).toMatch('# Zone:schedule:macroTask:XMLHttpRequest.send');
      },
      null,
      null,
      'unit-test'
    );
  });

  it('should not trigger Zone callback of internal onreadystatechange', function(done) {
    const scheduleSpy = jasmine.createSpy('schedule');
    const xhrZone = Zone.current.fork({
      name: 'xhr',
      onScheduleTask: (delegate: ZoneDelegate, currentZone: Zone, targetZone, task: Task) => {
        if (task.type === 'eventTask') {
          scheduleSpy(task.source);
        }
        return delegate.scheduleTask(targetZone, task);
      }
    });

    xhrZone.run(() => {
      const req = new XMLHttpRequest();
      req.onload = function() {
        expect(Zone.current.name).toEqual('xhr');
        if (supportPatchXHROnProperty()) {
          expect(scheduleSpy).toHaveBeenCalled();
        }
        done();
      };
      req.open('get', '/', true);
      req.send();
    });
  });

  it('should work with onreadystatechange', function(done) {
    let req: XMLHttpRequest;

    testZone.run(function() {
      req = new XMLHttpRequest();
      req.onreadystatechange = function() {
        // Make sure that the wrapCallback will only be called once
        req.onreadystatechange = null;
        expect(Zone.current).toBe(testZone);
        done();
      };
      req.open('get', '/', true);
    });

    req.send();
  });

  it('should return null when access ontimeout first time without error', function() {
    let req: XMLHttpRequest = new XMLHttpRequest();
    expect(req.ontimeout).toBe(null);
  });

  const supportsOnProgress = function() {
    return 'onprogress' in new XMLHttpRequest();
  };

  (<any>supportsOnProgress).message = 'XMLHttpRequest.onprogress';

  describe(
    'onprogress',
    ifEnvSupports(supportsOnProgress, function() {
      it('should work with onprogress', function(done) {
        let req: XMLHttpRequest;
        testZone.run(function() {
          req = new XMLHttpRequest();
          req.onprogress = function() {
            // Make sure that the wrapCallback will only be called once
            req.onprogress = null;
            expect(Zone.current).toBe(testZone);
            done();
          };
          req.open('get', '/', true);
        });

        req.send();
      });

      it('should allow canceling of an XMLHttpRequest', function(done) {
        const spy = jasmine.createSpy('spy');
        let req: XMLHttpRequest;
        let pending = false;

        const trackingTestZone = Zone.current.fork({
          name: 'tracking test zone',
          onHasTask: (
            delegate: ZoneDelegate,
            current: Zone,
            target: Zone,
            hasTaskState: HasTaskState
          ) => {
            if (hasTaskState.change == 'macroTask') {
              pending = hasTaskState.macroTask;
            }
            delegate.hasTask(target, hasTaskState);
          }
        });

        trackingTestZone.run(function() {
          req = new XMLHttpRequest();
          req.onreadystatechange = function() {
            if (req.readyState === XMLHttpRequest.DONE) {
              if (req.status !== 0) {
                spy();
              }
            }
          };
          req.open('get', '/', true);

          req.send();
          req.abort();
        });

        setTimeout(function() {
          expect(spy).not.toHaveBeenCalled();
          expect(pending).toEqual(false);
          done();
        }, 0);
      });

      it('should allow aborting an XMLHttpRequest after its completed', function(done) {
        let req: XMLHttpRequest;

        testZone.run(function() {
          req = new XMLHttpRequest();
          req.onreadystatechange = function() {
            if (req.readyState === XMLHttpRequest.DONE) {
              if (req.status !== 0) {
                setTimeout(function() {
                  req.abort();
                  done();
                }, 0);
              }
            }
          };
          req.open('get', '/', true);

          req.send();
        });
      });
    })
  );

  it('should preserve other setters', function() {
    const req = new XMLHttpRequest();
    req.open('get', '/', true);
    req.send();
    try {
      req.responseType = 'document';
      expect(req.responseType).toBe('document');
    } catch (e) {
      // Android browser: using this setter throws, this should be preserved
      expect(e.message).toBe('INVALID_STATE_ERR: DOM Exception 11');
    }
  });

  it('should work with synchronous XMLHttpRequest', function() {
    const log: HasTaskState[] = [];
    Zone.current
      .fork({
        name: 'sync-xhr-test',
        onHasTask: function(
          delegate: ZoneDelegate,
          current: Zone,
          target: Zone,
          hasTaskState: HasTaskState
        ) {
          log.push(hasTaskState);
          delegate.hasTask(target, hasTaskState);
        }
      })
      .run(() => {
        const req = new XMLHttpRequest();
        req.open('get', '/', false);
        req.send();
      });
    expect(log).toEqual([]);
  });

  it('should preserve static constants', function() {
    expect(XMLHttpRequest.UNSENT).toEqual(0);
    expect(XMLHttpRequest.OPENED).toEqual(1);
    expect(XMLHttpRequest.HEADERS_RECEIVED).toEqual(2);
    expect(XMLHttpRequest.LOADING).toEqual(3);
    expect(XMLHttpRequest.DONE).toEqual(4);
  });

  it('should work properly when send request multiple times on single xmlRequest instance', function(done) {
    testZone.run(function() {
      const req = new XMLHttpRequest();
      req.open('get', '/', true);
      req.send();
      req.onload = function() {
        req.onload = null;
        req.open('get', '/', true);
        req.onload = function() {
          done();
        };
        expect(() => {
          req.send();
        }).not.toThrow();
      };
    });
  });

  it('should keep taskcount correctly when abort was called multiple times before request is done', function(done) {
    testZone.run(function() {
      const req = new XMLHttpRequest();
      req.open('get', '/', true);
      req.send();
      req.addEventListener('readystatechange', function(ev) {
        if (req.readyState >= 2) {
          expect(() => {
            req.abort();
          }).not.toThrow();
          done();
        }
      });
    });
  });

  it('should not throw error when get XMLHttpRequest.prototype.onreadystatechange the first time', function() {
    const func = function() {
      testZone.run(function() {
        const req = new XMLHttpRequest();
        req.onreadystatechange;
      });
    };
    expect(func).not.toThrow();
  });

  it('should be in the zone when use XMLHttpRequest.addEventListener', function(done) {
    testZone.run(function() {
      // sometimes this case will cause timeout
      // so we set it longer
      const interval = (<any>jasmine).DEFAULT_TIMEOUT_INTERVAL;
      (<any>jasmine).DEFAULT_TIMEOUT_INTERVAL = 5000;
      const req = new XMLHttpRequest();
      req.open('get', '/', true);
      req.addEventListener('readystatechange', function() {
        if (req.readyState === 4) {
          // expect(Zone.current.name).toEqual('test');
          (<any>jasmine).DEFAULT_TIMEOUT_INTERVAL = interval;
          done();
        }
      });
      req.send();
    });
  });

  it(
    'should return origin listener when call xhr.onreadystatechange',
    ifEnvSupportsWithDone(supportPatchXHROnProperty, function(done: Function) {
      testZone.run(function() {
        // sometimes this case will cause timeout
        // so we set it longer
        const req = new XMLHttpRequest();
        req.open('get', '/', true);
        const interval = (<any>jasmine).DEFAULT_TIMEOUT_INTERVAL;
        (<any>jasmine).DEFAULT_TIMEOUT_INTERVAL = 5000;
        const listener = (req.onreadystatechange = function() {
          if (req.readyState === 4) {
            (<any>jasmine).DEFAULT_TIMEOUT_INTERVAL = interval;
            done();
          }
        });
        expect(req.onreadystatechange).toBe(listener);
        req.onreadystatechange = function() {
          return listener.apply(this, arguments);
        };
        req.send();
      });
    })
  );
});
