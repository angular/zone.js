/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

describe('orphan zonespec test', () => {
  it('orphan zonespec should not call parent delegate callback test', (done) => {
    let beginToSpy = false;

    const onForkSpy = jasmine.createSpy('fork');
    const onInterceptSpy = jasmine.createSpy('intercept');
    const onInvokeSpy = jasmine.createSpy('invoke');
    const onScheduleTaskSpy = jasmine.createSpy('scheduleTask');
    const onInvokeTaskSpy = jasmine.createSpy('invokeTask');
    const onCancelTaskSpy = jasmine.createSpy('cancelTask');
    const onHasTaskSpy = jasmine.createSpy('hasTask');
    const onErrorSpy = jasmine.createSpy('error');

    const zoneParentSpec = {
      name: 'parent',
      onFork: (delegate, currentZone, targetZone, zoneSpec) => {
        if (beginToSpy) {
          onForkSpy(targetZone, zoneSpec);
        }
        return delegate.fork(targetZone, zoneSpec);
      },
      onIntercept: (delegate, currentZone, targetZone, callback, source) => {
        if (beginToSpy) {
          onInterceptSpy(targetZone, callback, source);
        }
        return delegate.intercept(targetZone, callback, source);
      },
      onHandleError: (delegate, currentZone, targetZone, error) => {
        if (beginToSpy) {
          onErrorSpy(targetZone, error);
        }
        return delegate.handleError(targetZone, error);
      },
      onInvoke: (delegate, currentZone, targetZone, callback, applyThis, applyArgs, source) => {
        if (beginToSpy) {
          onInvokeSpy(targetZone, error);
        }
        return delegate.invoke(targetZone, callback, applyThis, applyArgs, source);
      },
      onScheduleTask: (delegate, currentZone, targetZone, task) => {
        if (beginToSpy) {
          onScheduleTaskSpy(targetZone, error);
        }
        return delegate.scheduleTask(targetZone, task);
      },
      onInvokeTask: (delegate, currentZone, targetZone, task, applyThis, applyArgs) => {
        if (beginToSpy) {
          onInvokeTaskSpy(targetZone, error);
        }
        return delegate.invokeTask(targetZone, task, applyThis, applyArgs);
      },
      onCancelTask: (delegate, currentZone, targetZone, task) => {
        if (beginToSpy) {
          onCancelTaskSpy(targetZone, error);
        }
        return delegate.cancelTask(targetZone, task);
      },
      onHasTask: (delegate, currentZone, targetZone, hasTaskState) => {
        if (beginToSpy) {
          onHasTaskSpy(targetZone, error);
        }
        return delegate.hasTask(targetZone, hasTaskState);
      }
    };

    const zoneParent = Zone.current.fork(zoneParentSpec);

    const zoneOrphan = zoneParent.fork({name: 'orphan', isOrphan: true});

    zoneOrphan.run(() => {
      expect(Zone.current.name).toEqual('orphan');
      // fork a new zone to trigger onFork
      Zone.current.fork({name: 'test'}).run(() => {
        beginToSpy = true;
        expect(Zone.current.name).toEqual('test');

        // trigger intercept and invoke
        const func = function() {};
        const wrappedFunc = Zone.current.wrap(func, 'func');
        wrappedFunc.apply(null, null);

        // trigger task related callback
        Zone.current.scheduleMicroTask('test', () => {});
        const macro = Zone.current.scheduleMacroTask('test', () => {}, null, () => {}, () => {});
        Zone.current.cancelTask(macro);
      });
    });

    setTimeout(() => {
      expect(onForkSpy).not.toHaveBeenCalled();
      expect(onInterceptSpy).not.toHaveBeenCalled();
      expect(onErrorSpy).not.toHaveBeenCalled();
      expect(onInvokeSpy).not.toHaveBeenCalled();
      expect(onScheduleTaskSpy).not.toHaveBeenCalled();
      expect(onInvokeTaskSpy).not.toHaveBeenCalled();
      expect(onCancelTaskSpy).not.toHaveBeenCalled();
      expect(onHasTaskSpy).not.toHaveBeenCalled();
      done();
    }, 10);
  });

  it('should not fall into dead loop', (done) => {
    function asyncLog() {
      setTimeout(() => {}, 10);
    }
    const zoneA = Zone.current.fork({
      name: 'A',
      onScheduleTask: (delegate, currentZone, targetZone, task) => {
        Zone.current.fork({name: 'orphan', isOrphan: true}).run(() => {
          asyncLog();
        });
        return delegate.scheduleTask(targetZone, task);
      }
    });

    zoneA.run(() => {
      Promise.resolve().then(() => {
        done();
      });
    });
  });
});
