/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * @fileoverview
 * @suppress {missingRequire}
 */

import {patchMethod} from './utils';

interface TimerOptions extends TaskData {
  handleId: number;
  args: any[];
}

export function patchTimer(window: any, setName: string, cancelName: string, nameSuffix: string) {
  let setNative: Function = null;
  let clearNative: Function = null;
  setName += nameSuffix;
  cancelName += nameSuffix;

  const tasksByHandleId: {[id: number]: Task} = {};
  const NUMBER = 'number';
  const STRING = 'string';
  const FUNCTION = 'function';
  const INTERVAL = 'Interval';
  const TIMEOUT = 'Timeout';
  const NOT_SCHEDULED = 'notScheduled';

  function scheduleTask(task: Task) {
    const data = <TimerOptions>task.data;
    function timer() {
      try {
        task.invoke.apply(this, arguments);
      } finally {
        if (typeof data.handleId === NUMBER) {
          // Node returns complex objects as handleIds
          delete tasksByHandleId[data.handleId];
        }
      }
    }
    data.args[0] = timer;
    data.handleId = setNative.apply(window, data.args);
    if (typeof data.handleId === NUMBER) {
      // Node returns complex objects as handleIds -> no need to keep them around. Additionally,
      // this throws an
      // exception in older node versions and has no effect there, because of the stringified key.
      tasksByHandleId[data.handleId] = task;
    }
    return task;
  }

  function clearTask(task: Task) {
    if (typeof(<TimerOptions>task.data).handleId === NUMBER) {
      // Node returns complex objects as handleIds
      delete tasksByHandleId[(<TimerOptions>task.data).handleId];
    }
    return clearNative((<TimerOptions>task.data).handleId);
  }

  setNative =
      patchMethod(window, setName, (delegate: Function) => function(self: any, args: any[]) {
        if (typeof args[0] === FUNCTION) {
          const zone = Zone.current;
          const options: TimerOptions = {
            handleId: null,
            isPeriodic: nameSuffix === INTERVAL,
            delay: (nameSuffix === TIMEOUT || nameSuffix === INTERVAL) ? args[1] || 0 : null,
            args: args
          };
          const task = zone.scheduleMacroTask(setName, args[0], options, scheduleTask, clearTask);
          if (!task) {
            return task;
          }
          // Node.js must additionally support the ref and unref functions.
          const handle: any = (<TimerOptions>task.data).handleId;
          // check whether handle is null, because some polyfill or browser
          // may return undefined from setTimeout/setInterval/setImmediate/requestAnimationFrame
          if (handle && handle.ref && handle.unref && typeof handle.ref === FUNCTION &&
              typeof handle.unref === FUNCTION) {
            (<any>task).ref = (<any>handle).ref.bind(handle);
            (<any>task).unref = (<any>handle).unref.bind(handle);
          }
          return task;
        } else {
          // cause an error by calling it directly.
          return delegate.apply(window, args);
        }
      });

  clearNative =
      patchMethod(window, cancelName, (delegate: Function) => function(self: any, args: any[]) {
        const task: Task = typeof args[0] === NUMBER ? tasksByHandleId[args[0]] : args[0];
        if (task && typeof task.type === STRING) {
          if (task.state !== NOT_SCHEDULED &&
              (task.cancelFn && task.data.isPeriodic || task.runCount === 0)) {
            // Do not cancel already canceled functions
            task.zone.cancelTask(task);
          }
        } else {
          // cause an error by calling it directly.
          delegate.apply(window, args);
        }
      });
}
