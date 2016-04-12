import '../zone';
import {eventTargetPatch} from './event-target';
import {propertyPatch} from './define-property';
import {registerElementPatch} from './register-element';
import {propertyDescriptorPatch} from './property-descriptor';
import {patchTimer} from '../common/timers';
import {patchMethod, patchPrototype, patchClass, zoneSymbol} from "../common/utils";

const set = 'set';
const clear = 'clear';
const blockingMethods = ['alert', 'prompt', 'confirm'];
const _global = typeof window == 'undefined' ? global : window;

patchTimer(_global, set, clear, 'Timeout');
patchTimer(_global, set, clear, 'Interval');
patchTimer(_global, set, clear, 'Immediate');
patchTimer(_global, 'request', 'cancelMacroTask', 'AnimationFrame');
patchTimer(_global, 'mozRequest', 'mozCancel', 'AnimationFrame');
patchTimer(_global, 'webkitRequest', 'webkitCancel', 'AnimationFrame');

for (var i = 0; i < blockingMethods.length; i++) {
  var name = blockingMethods[i];
  patchMethod(_global, name, (delegate, symbol, name) => {
    return function (s:any, args: any[]) {
      return Zone.current.run(delegate, _global, args, name)
    }
  });
}

eventTargetPatch(_global);
propertyDescriptorPatch(_global);
patchClass('MutationObserver');
patchClass('WebKitMutationObserver');
patchClass('FileReader');
propertyPatch();
registerElementPatch(_global);

// Treat XMLHTTPRequest as a macrotask.
patchXHR(_global);

const XHR_TASK = zoneSymbol('xhrTask');

interface XHROptions extends TaskData {
  target: any;
  args: any[];
  aborted: boolean;
}

function patchXHR(window: any) {
  function findPendingTask(target: any) {
    var pendingTask: Task = target[XHR_TASK];
    return pendingTask;
  }

  function scheduleTask(task: Task) {
    var data = <XHROptions>task.data;
    data.target.addEventListener('readystatechange', () => {
      if (data.target.readyState === XMLHttpRequest.DONE) {
        if (!data.aborted) {
          task.invoke();
        }
      }
    });
    var storedTask: Task = data.target[XHR_TASK];
    if (!storedTask) {
      data.target[XHR_TASK] = task;
    }
    setNative.apply(data.target, data.args);
    return task;
  }

  function placeholderCallback() {
  }

  function clearTask(task: Task) {
    var data = <XHROptions>task.data;
    // Note - ideally, we would call data.target.removeEventListener here, but it's too late
    // to prevent it from firing. So instead, we store info for the event listener.
    data.aborted = true;
    return clearNative.apply(data.target, data.args);
  }

  var setNative = patchMethod(window.XMLHttpRequest.prototype, 'send', () => function(self: any, args: any[]) {
    var zone = Zone.current;

    var options: XHROptions = {
      target: self,
      isPeriodic: false,
      delay: null,
      args: args,
      aborted: false
    };
    return zone.scheduleMacroTask('XMLHttpRequest.send', placeholderCallback, options, scheduleTask, clearTask);
  });

  var clearNative = patchMethod(window.XMLHttpRequest.prototype, 'abort', (delegate: Function) => function(self: any, args: any[]) {
    var task: Task = findPendingTask(self);
    if (task && typeof task.type == 'string') {
      // If the XHR has already completed, do nothing.
      if (task.cancelFn == null) {
        return;
      }
      task.zone.cancelTask(task);
    }
    // Otherwise, we are trying to abort an XHR which has not yet been sent, so there is no task to cancel. Do nothing.
  });
}

/// GEO_LOCATION
if (_global['navigator'] && _global['navigator'].geolocation) {
  patchPrototype(_global['navigator'].geolocation, [
    'getCurrentPosition',
    'watchPosition'
  ]);
}
