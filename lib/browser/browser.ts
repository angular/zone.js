/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {findEventTasks} from '../common/events';
import {patchTimer} from '../common/timers';
import {patchClass, patchMacroTask, patchMethod, patchOnProperties, patchPrototype, zoneSymbol} from '../common/utils';

import {propertyPatch} from './define-property';
import {eventTargetPatch} from './event-target';
import {propertyDescriptorPatch} from './property-descriptor';
import {registerElementPatch} from './register-element';

Zone.__load_patch('timers', (global: any, Zone: ZoneType, api: _ZonePrivate) => {
  const set = 'set';
  const clear = 'clear';
  patchTimer(global, set, clear, 'Timeout');
  patchTimer(global, set, clear, 'Interval');
  patchTimer(global, set, clear, 'Immediate');
  patchTimer(global, 'request', 'cancel', 'AnimationFrame');
  patchTimer(global, 'mozRequest', 'mozCancel', 'AnimationFrame');
  patchTimer(global, 'webkitRequest', 'webkitCancel', 'AnimationFrame');
});

Zone.__load_patch('blocking', (global: any, Zone: ZoneType, api: _ZonePrivate) => {
  const blockingMethods = ['alert', 'prompt', 'confirm'];
  for (let i = 0; i < blockingMethods.length; i++) {
    const name = blockingMethods[i];
    patchMethod(global, name, (delegate, symbol, name) => {
      return function(s: any, args: any[]) {
        return Zone.current.run(delegate, global, args, name);
      };
    });
  }
});

Zone.__load_patch('EventTarget', (global: any, Zone: ZoneType, api: _ZonePrivate) => {
  eventTargetPatch(global, api);
  // patch XMLHttpRequestEventTarget's addEventListener/removeEventListener
  const XMLHttpRequestEventTarget = (global as any)['XMLHttpRequestEventTarget'];
  if (XMLHttpRequestEventTarget && XMLHttpRequestEventTarget.prototype) {
    api.patchEventTarget(global, [XMLHttpRequestEventTarget.prototype]);
  }
  patchClass('MutationObserver');
  patchClass('WebKitMutationObserver');
  patchClass('FileReader');
});

Zone.__load_patch('on_property', (global: any, Zone: ZoneType, api: _ZonePrivate) => {
  propertyDescriptorPatch(api, global);
  propertyPatch();
  registerElementPatch(global);
});

Zone.__load_patch('canvas', (global: any, Zone: ZoneType, api: _ZonePrivate) => {
  const HTMLCanvasElement = global['HTMLCanvasElement'];
  if (typeof HTMLCanvasElement !== 'undefined' && HTMLCanvasElement.prototype &&
      HTMLCanvasElement.prototype.toBlob) {
    patchMacroTask(HTMLCanvasElement.prototype, 'toBlob', (self: any, args: any[]) => {
      return {name: 'HTMLCanvasElement.toBlob', target: self, callbackIndex: 0, args: args};
    });
  }
});

Zone.__load_patch('XHR', (global: any, Zone: ZoneType, api: _ZonePrivate) => {
  // Treat XMLHTTPRequest as a macrotask.
  patchXHR(global);

  const XHR_TASK = zoneSymbol('xhrTask');
  const XHR_SYNC = zoneSymbol('xhrSync');
  const XHR_LISTENER = zoneSymbol('xhrListener');
  const XHR_SCHEDULED = zoneSymbol('xhrScheduled');

  interface XHROptions extends TaskData {
    target: any;
    args: any[];
    aborted: boolean;
  }

  function patchXHR(window: any) {
    function findPendingTask(target: any) {
      const pendingTask: Task = target[XHR_TASK];
      return pendingTask;
    }

    function scheduleTask(task: Task) {
      (XMLHttpRequest as any)[XHR_SCHEDULED] = false;
      const data = <XHROptions>task.data;
      // remove existing event listener
      const listener = data.target[XHR_LISTENER];
      const oriAddListener = data.target[zoneSymbol('addEventListener')];
      const oriRemoveListener = data.target[zoneSymbol('removeEventListener')];

      if (listener) {
        oriRemoveListener.apply(data.target, ['readystatechange', listener]);
      }
      const newListener = data.target[XHR_LISTENER] = () => {
        if (data.target.readyState === data.target.DONE) {
          // sometimes on some browsers XMLHttpRequest will fire onreadystatechange with
          // readyState=4 multiple times, so we need to check task state here
          if (!data.aborted && (XMLHttpRequest as any)[XHR_SCHEDULED] &&
              task.state === 'scheduled') {
            task.invoke();
          }
        }
      };
      oriAddListener.apply(data.target, ['readystatechange', newListener]);

      const storedTask: Task = data.target[XHR_TASK];
      if (!storedTask) {
        data.target[XHR_TASK] = task;
      }
      sendNative.apply(data.target, data.args);
      (XMLHttpRequest as any)[XHR_SCHEDULED] = true;
      return task;
    }

    function placeholderCallback() {}

    function clearTask(task: Task) {
      const data = <XHROptions>task.data;
      // Note - ideally, we would call data.target.removeEventListener here, but it's too late
      // to prevent it from firing. So instead, we store info for the event listener.
      data.aborted = true;
      return abortNative.apply(data.target, data.args);
    }

    const openNative: Function = patchMethod(
        window.XMLHttpRequest.prototype, 'open', () => function(self: any, args: any[]) {
          self[XHR_SYNC] = args[2] == false;
          return openNative.apply(self, args);
        });

    const sendNative: Function = patchMethod(
        window.XMLHttpRequest.prototype, 'send', () => function(self: any, args: any[]) {
          const zone = Zone.current;
          if (self[XHR_SYNC]) {
            // if the XHR is sync there is no task to schedule, just execute the code.
            return sendNative.apply(self, args);
          } else {
            const options: XHROptions =
                {target: self, isPeriodic: false, delay: null, args: args, aborted: false};
            return zone.scheduleMacroTask(
                'XMLHttpRequest.send', placeholderCallback, options, scheduleTask, clearTask);
          }
        });

    const abortNative = patchMethod(
        window.XMLHttpRequest.prototype, 'abort',
        (delegate: Function) => function(self: any, args: any[]) {
          const task: Task = findPendingTask(self);
          if (task && typeof task.type == 'string') {
            // If the XHR has already completed, do nothing.
            // If the XHR has already been aborted, do nothing.
            // Fix #569, call abort multiple times before done will cause
            // macroTask task count be negative number
            if (task.cancelFn == null || (task.data && (<XHROptions>task.data).aborted)) {
              return;
            }
            task.zone.cancelTask(task);
          }
          // Otherwise, we are trying to abort an XHR which has not yet been sent, so there is no
          // task
          // to cancel. Do nothing.
        });
  }
});

Zone.__load_patch('geolocation', (global: any, Zone: ZoneType, api: _ZonePrivate) => {
  /// GEO_LOCATION
  if (global['navigator'] && global['navigator'].geolocation) {
    patchPrototype(global['navigator'].geolocation, ['getCurrentPosition', 'watchPosition']);
  }
});

Zone.__load_patch('PromiseRejectionEvent', (global: any, Zone: ZoneType, api: _ZonePrivate) => {
  // handle unhandled promise rejection
  function findPromiseRejectionHandler(evtName: string) {
    return function(e: any) {
      const eventTasks = findEventTasks(global, evtName);
      eventTasks.forEach(eventTask => {
        // windows has added unhandledrejection event listener
        // trigger the event listener
        const PromiseRejectionEvent = global['PromiseRejectionEvent'];
        if (PromiseRejectionEvent) {
          const evt = new PromiseRejectionEvent(evtName, {promise: e.promise, reason: e.rejection});
          eventTask.invoke(evt);
        }
      });
    };
  }

  if (global['PromiseRejectionEvent']) {
    (Zone as any)[zoneSymbol('unhandledPromiseRejectionHandler')] =
        findPromiseRejectionHandler('unhandledrejection');

    (Zone as any)[zoneSymbol('rejectionHandledHandler')] =
        findPromiseRejectionHandler('rejectionhandled');
  }
});


Zone.__load_patch('util', (global: any, Zone: ZoneType, api: _ZonePrivate) => {
  api.patchOnProperties = patchOnProperties;
  api.patchMethod = patchMethod;
});