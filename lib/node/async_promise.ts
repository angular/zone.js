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
Zone.__load_patch('node_async_hooks_promise', (global: any, Zone: ZoneType, api: _ZonePrivate) => {
  let async_hooks;
  try {
    async_hooks = require('async_hooks');
  } catch (err) {
    print(err.message);
    return;
  }

  const PROMISE_PROVIDER = 'PROMISE';
  const noop = function() {};

  const idPromise: {[key: number]: any} = {};

  function print(...args: string[]) {
    if (!args) {
      return;
    }
    (process as any)._rawDebug(args.join(' '));
  }

  function init(id: number, provider: string, triggerId: number, parentHandle: any) {
    if (provider === PROMISE_PROVIDER) {
      if (!parentHandle) {
        print('no parenthandle');
        return;
      }
      const promise = parentHandle.promise;
      const originalThen = promise.then;

      const zone = Zone.current;
      if (!zone.parent) {
        return;
      }
      const currentAsyncContext: any = {};
      currentAsyncContext.id = id;
      currentAsyncContext.zone = zone;
      idPromise[id] = currentAsyncContext;
      promise.then = function(onResolve: any, onReject: any) {
        const task = zone.scheduleMicroTask(PROMISE_PROVIDER, noop, null, noop);
        process.nextTick(() => {
          task.zone.runTask(task, null, null);
          originalThen.call(this, onResolve, onReject);
        });
      };
    }
  }

  function before(id: number) {
    const currentAsyncContext = idPromise[id];
    if (currentAsyncContext) {
      api.setAsyncContext(currentAsyncContext);
    }
  }

  function after(id: number) {
    const currentAsyncContext = idPromise[id];
    if (currentAsyncContext) {
      idPromise[id] = null;
      api.setAsyncContext(null);
    }
  }

  function destroy(id: number) {
  }

  async_hooks.createHook({init, before, after, destroy}).enable();
});