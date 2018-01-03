/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * patch nodejs async operations (timer, promise, net...) with
 * nodejs async_hooks
 */
Zone.__load_patch('node_async_hooks', (global: any, Zone: ZoneType, api: _ZonePrivate) => {
  let async_hooks;
  try {
    async_hooks = require('async_hooks');
    Zone.__mode__ = 'asynchooks';
  } catch (err) {
    print(err.message);
    return;
  }

  const DEBUG = false;
  const PROMISE_PROVIDER = 'PROMISE';
  const TICKOBJ_PROVIDER = 'TickObject';
  const TIMER_PROVIDER = 'Timeout';
  const TIMERWRAP_PROVIDER = 'TIMERWRAP';
  const SET_INTERVAL = 'setInterval';
  const SET_TIMEOUT = 'setTimeout';
  const NEXT_TICK = 'process.nextTick';

  const NUMBER = 'number';

  const noop = function() {};

  let isPromiseTick = false;

  interface AsyncHooksContext {
    zone?: Zone;
    id: number;
    task?: Task;
  }

  const idPromise: AsyncHooksContext[] = [];
  const idMicroTasks: AsyncHooksContext[] = [];
  const idMacroTasks: AsyncHooksContext[] = [];

  if ((process as any).setUncaughtExceptionCaptureCallback) {
    (process as any).setUncaughtExceptionCaptureCallback((error: any) => {
      const zone = Zone.current;
      (zone as any)._zoneDelegate.handleError(zone, error);
    });
  }

  process.on('unhandledRejection', (reason: any, p: any) => {
    const zone = Zone.current;
    (zone as any)._zoneDelegate.handleError(zone, error);
  });

  function binarySearch(
      array: AsyncHooksContext[], id: number, isDeleteNonPeriodic = false,
      isForceDelete = false): AsyncHooksContext {
    let low = 0, high = array.length - 1, mid;
    while (low <= high) {
      mid = Math.floor((low + high) / 2);
      const midCtx = array[mid];
      if (midCtx.id === id) {
        if (isForceDelete || (isDeleteNonPeriodic && midCtx.task && midCtx.task.data &&
                              !midCtx.task.data.isPeriodic)) {
          array.splice(mid, 1);
        }
        return midCtx;
      } else if (midCtx.id < id)
        low = mid + 1;
      else
        high = mid - 1;
    }
    return null;
  }

  function cancelTask(task: Task, id: number) {
    if (task.source === SET_TIMEOUT) {
      clearTimeout((task.data as any).args);
    } else if (task.source === SET_INTERVAL) {
      clearInterval((task.data as any).args);
    }
  }

  function print(...args: string[]) {
    if (!DEBUG) {
      return;
    }
    if (!args) {
      return;
    }
    (process as any)._rawDebug(args.join(' '));
  }

  function printObj(obj: any) {
    if (!DEBUG) {
      return;
    }
    print(Object.keys(obj)
              .map((key: string) => {
                return key + ':' + obj[key];
              })
              .join(','));
  }

  api.setPromiseTick = (flag: boolean) => {
    isPromiseTick = flag;
  };

  function promiseInit(id: number, triggerId: number, parentHandle: any) {
    if (!parentHandle) {
      print('no parenthandle');
      return;
    }
    const promise = parentHandle.promise;
    const originalThen = promise.then;

    const zone = Zone.current;
    idPromise.push({id, zone});
    promise.then = function(onResolve: any, onReject: any) {
      const task = zone.scheduleMicroTask(PROMISE_PROVIDER, noop, null, noop);
      isPromiseTick = true;
      process.nextTick(() => {
        task.zone.runTask(task, null, null);
        originalThen.call(this, onResolve, onReject);
      });
    };
  }

  function scheduleMicroTask(id: number, provider: string, triggerId: number, parentHandle: any) {
    const zone = Zone.current;
    const task = zone.scheduleMicroTask(NEXT_TICK, noop, null, noop);
    idMicroTasks.push({id, zone, task});
  }

  function scheduleMacroTask(
      id: number, provider: string, triggerId: number, parentHandle: any, delay?: number,
      isPeriodic = false) {
    const zone = Zone.current;
    const data: any = {isPeriodic: isPeriodic};
    if (delay) {
      data.delay = delay;
    }
    data.args = parentHandle;
    let source: string = provider;
    if (isPeriodic) {
      source = SET_INTERVAL;
    } else if (provider === TIMER_PROVIDER) {
      source = SET_TIMEOUT;
    }
    const task = zone.scheduleMacroTask(source, noop, data, noop, () => {
      cancelTask(task, id);
    });
    if (id === 51) {
      print('task state', task.state);
    }
    idMacroTasks.push({id, zone, task});
  }

  function init(id: number, provider: string, triggerId: number, parentHandle: any) {
    print('init', provider, id.toString());
    if (isPromiseTick) {
      isPromiseTick = false;
      return;
    }
    if (provider === TIMERWRAP_PROVIDER) {
      return;
    }
    if (provider === PROMISE_PROVIDER) {
      promiseInit(id, triggerId, parentHandle);
    } else if (provider === TICKOBJ_PROVIDER) {
      scheduleMicroTask(id, provider, triggerId, parentHandle);
    } else {
      if (provider === TIMER_PROVIDER && parentHandle && typeof parentHandle._repeat === NUMBER) {
        scheduleMacroTask(id, provider, triggerId, parentHandle, parentHandle._idleTimeout, true);
      } else {
        printObj(parentHandle);
        scheduleMacroTask(
            id, provider, triggerId, parentHandle,
            typeof parentHandle._idleTimeout === NUMBER ? parentHandle._idleTimeout : undefined,
            false);
      }
    }
  }

  function before(id: number) {
    let currentAsyncContext = binarySearch(idPromise, id);
    if (currentAsyncContext) {
      api.setAsyncContext(currentAsyncContext);
      return;
    }
    currentAsyncContext = binarySearch(idMicroTasks, id);
    if (!currentAsyncContext) {
      currentAsyncContext = binarySearch(idMacroTasks, id);
    }
    if (currentAsyncContext) {
      print('before ', currentAsyncContext && currentAsyncContext.task.source, id.toString());
      api.beforeRunTask(currentAsyncContext.zone, currentAsyncContext.task);
      (currentAsyncContext.zone as any).invokeTask(currentAsyncContext.task, null, null);
    }
  }

  function after(id: number) {
    let currentAsyncContext = binarySearch(idPromise, id, true);
    if (currentAsyncContext) {
      api.setAsyncContext(null);
      return;
    }
    currentAsyncContext = binarySearch(idMicroTasks, id, true);
    if (!currentAsyncContext) {
      currentAsyncContext = binarySearch(idMacroTasks, id, true);
    }
    if (currentAsyncContext) {
      api.afterRunTask(currentAsyncContext.zone, currentAsyncContext.task);
    }
    print('after ', currentAsyncContext && currentAsyncContext.task.source, id.toString());
  }

  function destroy(id: number) {
    const currentAsyncContext = binarySearch(idMacroTasks, id, true, true);
    if (currentAsyncContext) {
      print('cancel async context', currentAsyncContext.task.source, id.toString());
      printObj((currentAsyncContext.task.data as any).args);
      if (currentAsyncContext.task.state !== 'notScheduled') {
        currentAsyncContext.zone.cancelTask(currentAsyncContext.task);
      }
    }
  }

  async_hooks.createHook({init, before, after, destroy}).enable();
});