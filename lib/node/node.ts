import '../zone';
import {patchMethod, patchPrototype, patchClass, zoneSymbol} from '../common/utils';

// TODO(juliemr): remove duplication in this file.

const set = 'set';
const clear = 'clear';
const blockingMethods = ['alert', 'prompt', 'confirm'];
const _global = typeof window === 'undefined' ? global : window;

// Timers
const timers = require('timers');
patchTimer(timers, set, clear, 'Timeout');
patchTimer(timers, set, clear, 'Interval');
patchTimer(timers, set, clear, 'Immediate');

const shouldPatchGlobalTimers = global.setTimeout !== timers.setTimeout;

if (shouldPatchGlobalTimers) {
  patchTimer(_global, set, clear, 'Timeout');
  patchTimer(_global, set, clear, 'Interval');
  patchTimer(_global, set, clear, 'Immediate');
}


// Crypto
let crypto;
try {
  crypto = require('crypto');
} catch (err) {}

// TODO(gdi2290): implement a better way to patch these methods
if (crypto) {
  let nativeRandomBytes = crypto.randomBytes;
  crypto.randomBytes = function randomBytesZone(size: number, callback?: Function) {
    if (!callback) {
      return nativeRandomBytes(size);
    } else {
      let zone = Zone.current;
      var source = crypto.constructor.name + '.randomBytes';
      return nativeRandomBytes(size, zone.wrap(callback, source));
    }
  }.bind(crypto);

  let nativePbkdf2 = crypto.pbkdf2;
  crypto.pbkdf2 = function pbkdf2Zone(...args) {
    let fn = args[args.length - 1];
    if (typeof fn === 'function') {
      let zone = Zone.current;
      var source = crypto.constructor.name + '.pbkdf2';
      args[args.length - 1] = zone.wrap(fn, source);
      return nativePbkdf2(...args);
    } else {
      return nativePbkdf2(...args);
    }
  }.bind(crypto);
}

interface TimerOptions extends TaskData {
  handleId: number;
  args: any[];
}

function patchTimer(
    window: any,
    setName: string,
    cancelName: string,
    nameSuffix: string) {

  var setNative = null;
  var clearNative = null;
  setName += nameSuffix;
  cancelName += nameSuffix;

  function scheduleTask(task: Task) {
    const data = <TimerOptions>task.data;
    data.args[0] = task.invoke;
    data.handleId = setNative.apply(window, data.args);
    return task;
  }

  function clearTask(task: Task) {
    return clearNative((<TimerOptions>task.data).handleId);
  }

  setNative = patchMethod(window, setName, (delegate: Function) => function(self: any, args: any[]) {
    if (typeof args[0] === 'function') {
      var zone = Zone.current;
      var options: TimerOptions = {
        handleId: null,
        isPeriodic: nameSuffix === 'Interval',
        delay: (nameSuffix === 'Timeout' || nameSuffix === 'Interval') ? args[1] || 0 : null,
        args: args
      };
      return zone.scheduleMacroTask(setName, args[0], options, scheduleTask, clearTask);
    } else {
      // cause an error by calling it directly.
      return delegate.apply(window, args);
    }
  });

  clearNative = patchMethod(window, cancelName, (delegate: Function) => function(self: any, args: any[]) {
    var task: Task = args[0];
    if (task && typeof task.type === 'string') {
      if (task.cancelFn && task.data.isPeriodic || task.runCount === 0) {
        // Do not cancel already canceled functions
        task.zone.cancelTask(task);
      }
    } else {
      // cause an error by calling it directly.
      delegate.apply(window, args);
    }
  });
}
