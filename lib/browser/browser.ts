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

import {findEventTasks} from '../common/events';
import {patchTimer} from '../common/timers';
import {patchArguments, patchClass, patchMacroTask, patchMethod, patchOnProperties, patchPrototype, wrapFunctionArgs, zoneSymbol} from '../common/utils';

import {propertyPatch} from './define-property';
import {eventTargetPatch, patchEvent} from './event-target';
import {propertyDescriptorPatch} from './property-descriptor';
import {registerElementPatch} from './register-element';

Zone.__load_patch('util', (global: any, Zone: ZoneType, api: _ZonePrivate) => {
  api.patchOnProperties = patchOnProperties;
  api.patchMethod = patchMethod;
  api.patchArguments = patchArguments;
});

Zone.__load_patch('timers', (global: any, Zone: ZoneType, api: _ZonePrivate) => {
  const set = 'set';
  const clear = 'clear';
  patchTimer(global, set, clear, 'Timeout');
  patchTimer(global, set, clear, 'Interval');
  patchTimer(global, set, clear, 'Immediate');
});

Zone.__load_patch('requestAnimationFrame', (global: any, Zone: ZoneType, api: _ZonePrivate) => {
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
  // load blackListEvents from global
  const SYMBOL_BLACK_LISTED_EVENTS = Zone.__symbol__('BLACK_LISTED_EVENTS');
  if (global[SYMBOL_BLACK_LISTED_EVENTS]) {
    (Zone as any)[SYMBOL_BLACK_LISTED_EVENTS] = global[SYMBOL_BLACK_LISTED_EVENTS];
  }

  patchEvent(global, api);
  eventTargetPatch(global, api);
  // patch XMLHttpRequestEventTarget's addEventListener/removeEventListener
  const XMLHttpRequestEventTarget = (global as any)['XMLHttpRequestEventTarget'];
  if (XMLHttpRequestEventTarget && XMLHttpRequestEventTarget.prototype) {
    api.patchEventTarget(global, [XMLHttpRequestEventTarget.prototype]);
  }
  patchClass('MutationObserver');
  patchClass('WebKitMutationObserver');
  patchClass('IntersectionObserver');
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
  const XHR_URL = zoneSymbol('xhrURL');

  interface XHROptions extends TaskData {
    target: any;
    url: string;
    args: any[];
    aborted: boolean;
  }

  function patchXHR(window: any) {
    function findPendingTask(target: any) {
      const pendingTask: Task = target[XHR_TASK];
      return pendingTask;
    }

    const SYMBOL_ADDEVENTLISTENER = zoneSymbol('addEventListener');
    const SYMBOL_REMOVEEVENTLISTENER = zoneSymbol('removeEventListener');

    let oriAddListener = (XMLHttpRequest.prototype as any)[SYMBOL_ADDEVENTLISTENER];
    let oriRemoveListener = (XMLHttpRequest.prototype as any)[SYMBOL_REMOVEEVENTLISTENER];
    if (!oriAddListener) {
      const XMLHttpRequestEventTarget = window['XMLHttpRequestEventTarget'];
      if (XMLHttpRequestEventTarget) {
        oriAddListener = XMLHttpRequestEventTarget.prototype[SYMBOL_ADDEVENTLISTENER];
        oriRemoveListener = XMLHttpRequestEventTarget.prototype[SYMBOL_REMOVEEVENTLISTENER];
      }
    }

    const READY_STATE_CHANGE = 'readystatechange';
    const SCHEDULED = 'scheduled';

    function scheduleTask(task: Task) {
      (XMLHttpRequest as any)[XHR_SCHEDULED] = false;
      const data = <XHROptions>task.data;
      const target = data.target;
      // remove existing event listener
      const listener = target[XHR_LISTENER];
      if (!oriAddListener) {
        oriAddListener = target[SYMBOL_ADDEVENTLISTENER];
        oriRemoveListener = target[SYMBOL_REMOVEEVENTLISTENER];
      }

      if (listener) {
        oriRemoveListener.apply(target, [READY_STATE_CHANGE, listener]);
      }
      const newListener = target[XHR_LISTENER] = () => {
        if (target.readyState === target.DONE) {
          // sometimes on some browsers XMLHttpRequest will fire onreadystatechange with
          // readyState=4 multiple times, so we need to check task state here
          if (!data.aborted && (XMLHttpRequest as any)[XHR_SCHEDULED] && task.state === SCHEDULED) {
            task.invoke();
          }
        }
      };
      oriAddListener.apply(target, [READY_STATE_CHANGE, newListener]);

      const storedTask: Task = target[XHR_TASK];
      if (!storedTask) {
        target[XHR_TASK] = task;
      }
      sendNative.apply(target, data.args);
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
          self[XHR_URL] = args[1];
          return openNative.apply(self, args);
        });

    const XMLHTTPREQUEST_SOURCE = 'XMLHttpRequest.send';
    const sendNative: Function = patchMethod(
        window.XMLHttpRequest.prototype, 'send', () => function(self: any, args: any[]) {
          const zone = Zone.current;
          if (self[XHR_SYNC]) {
            // if the XHR is sync there is no task to schedule, just execute the code.
            return sendNative.apply(self, args);
          } else {
            const options: XHROptions = {
              target: self,
              url: self[XHR_URL],
              isPeriodic: false,
              delay: null,
              args: args,
              aborted: false
            };
            return zone.scheduleMacroTask(
                XMLHTTPREQUEST_SOURCE, placeholderCallback, options, scheduleTask, clearTask);
          }
        });

    const STRING_TYPE = 'string';

    const abortNative = patchMethod(
        window.XMLHttpRequest.prototype, 'abort',
        (delegate: Function) => function(self: any, args: any[]) {
          const task: Task = findPendingTask(self);
          if (task && typeof task.type == STRING_TYPE) {
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

Zone.__load_patch('getUserMedia', (global: any, Zone: ZoneType, api: _ZonePrivate) => {
  let navigator = global['navigator'];
  if (navigator && navigator.getUserMedia) {
    navigator.getUserMedia = wrapFunctionArgs(navigator.getUserMedia);
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
