/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {attachOriginToPatched, zoneSymbol} from '../common/utils';

import {eventNames} from './property-descriptor';

const WTF_ISSUE_555 =
    'Anchor,Area,Audio,BR,Base,BaseFont,Body,Button,Canvas,Content,DList,Directory,Div,Embed,FieldSet,Font,Form,Frame,FrameSet,HR,Head,Heading,Html,IFrame,Image,Input,Keygen,LI,Label,Legend,Link,Map,Marquee,Media,Menu,Meta,Meter,Mod,OList,Object,OptGroup,Option,Output,Paragraph,Pre,Progress,Quote,Script,Select,Source,Span,Style,TableCaption,TableCell,TableCol,Table,TableRow,TableSection,TextArea,Title,Track,UList,Unknown,Video';
const NO_EVENT_TARGET =
    'ApplicationCache,EventSource,FileReader,InputMethodContext,MediaController,MessagePort,Node,Performance,SVGElementInstance,SharedWorker,TextTrack,TextTrackCue,TextTrackList,WebKitNamedFlow,Window,Worker,WorkerGlobalScope,XMLHttpRequest,XMLHttpRequestEventTarget,XMLHttpRequestUpload,IDBRequest,IDBOpenDBRequest,IDBDatabase,IDBTransaction,IDBCursor,DBIndex,WebSocket'
        .split(',');
const EVENT_TARGET = 'EventTarget';

export function eventTargetPatch(_global: any) {
  let apis = [];
  const isWtf = _global['wtf'];
  if (isWtf) {
    // Workaround for: https://github.com/google/tracing-framework/issues/555
    apis = WTF_ISSUE_555.split(',').map((v) => 'HTML' + v + 'Element').concat(NO_EVENT_TARGET);
  } else if (_global[EVENT_TARGET]) {
    apis.push(EVENT_TARGET);
  } else {
    // Note: EventTarget is not available in all browsers,
    // if it's not available, we instead patch the APIs in the IDL that inherit from EventTarget
    apis = NO_EVENT_TARGET;
  }

  for (let i = 0; i < apis.length; i++) {
    const type = _global[apis[i]];
    patchEventTargetMethodsOptimized(type && type.prototype);
  }
}

const TRUE_STR = 'true';
const FALSE_STR = 'false';
// an identifier to tell ZoneTask do not create a new invoke closure
const OPTIMIZED_ZONE_EVENT_TASK = zoneSymbol('optimizedZoneEventTask');

const zoneSymbolEventNames: any = {};
const globalSources: any = {};

//  predefine all __zone_symbol__ + eventName + true/false string
eventNames.forEach((eventName: string) => {
  const falseEventName = eventName + FALSE_STR;
  const trueEventName = eventName + TRUE_STR;
  const symbol = '__zone_symbol__' + falseEventName;
  const symbolCapture = '__zone_symbol__' + trueEventName;
  zoneSymbolEventNames[eventName] = {};
  zoneSymbolEventNames[eventName][FALSE_STR] = symbol;
  zoneSymbolEventNames[eventName][TRUE_STR] = symbolCapture;
});

//  predefine all task.source string
WTF_ISSUE_555.split(',').forEach((target: string) => {
  const targets: any = globalSources[target] = {};
  eventNames.forEach((eventName: string) => {
    targets[eventName] = target + '.addEventListener:' + eventName;
  });
});

// global shared zoneAwareCallback to handle all event callback with capture = false
const globalZoneAwareCallback = function(event: Event) {
  const target = this || _global;

  const tasks = target[zoneSymbolEventNames[event.type][FALSE_STR]];
  if (tasks) {
    // invoke all tasks which attached to current target with given event.type and capture = false
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const delegate = task.callback;
      if (typeof delegate === 'object' && delegate.handleEvent) {
        // create the bind version of handleEvnet when invoke
        task.callback = (event: Event) => delegate.handleEvent(event);
        task.originalDelegate = delegate;
      }
      // invoke static task.invoke
      task.invoke(task, target, [event]);
    }
  }
};

// global shared zoneAwareCallback to handle all event callback with capture = true
const globalZoneAwareCaptureCallback = function(event: Event) {
  const target = this || _global;

  const tasks = target[zoneSymbolEventNames[event.type][TRUE_STR]];
  if (tasks) {
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const delegate = task.callback;
      if (typeof delegate === 'object' && delegate.handleEvent) {
        task.callback = (event: Event) => delegate.handleEvent(event);
        task.originalDelegate = delegate;
      }
      task.invoke(task, target, [event]);
    }
  }
};

const ADD_EVENT_LISTENER = 'addEventListener';
const zoneSymbolAddEventListener = zoneSymbol(ADD_EVENT_LISTENER);

export function patchEventTargetMethodsOptimized(obj: any) {
  if (!obj) {
    return;
  }
  let proto = obj;
  while (proto && !proto.hasOwnProperty(ADD_EVENT_LISTENER)) {
    proto = Object.getPrototypeOf(proto);
  }
  if (!proto && obj[ADD_EVENT_LISTENER]) {
    // somehow we did not find it, but we can see it. This happens on IE for Window properties.
    proto = obj;
  }

  if (!proto) {
    return;
  }
  if (proto[zoneSymbolAddEventListener]) {
    return;
  }

  // a shared global taskData to pass data for scheduleEventTask
  // so we do not need to create a new object just for pass some data
  const taskData: any = {};

  const nativeAddEventListener = proto[zoneSymbolAddEventListener] = proto.addEventListener;
  const nativeRemoveEventListener = proto[zoneSymbol('removeEventListener')] =
      proto.removeEventListener;
  const customSchedule = function(task: Task) {
    // if there is already a task for the eventName + capture,
    // just return, because we use the shared globalZoneAwareCallback here.
    if (taskData.isExisting) {
      return;
    }
    return nativeAddEventListener.apply(taskData.target, [
      taskData.eventName,
      taskData.capture ? globalZoneAwareCaptureCallback : globalZoneAwareCallback, taskData.options
    ]);
  };

  const customCancel = function(task: any) {
    // if all tasks for the eventName + capture have gone,
    // we will really remove the global evnet callback,
    // if not, return
    if (!task.remove) {
      return;
    }
    return nativeRemoveEventListener.apply(task.target, [
      task.eventName, task.capture ? globalZoneAwareCaptureCallback : globalZoneAwareCallback,
      task.options
    ]);
  };

  proto.addEventListener = function() {
    const target = this || _global;
    const targetZone = Zone.current;
    let delegate = arguments[1];
    if (!delegate) {
      return nativeAddEventListener.apply(this, arguments);
    }

    // don't create the bind delegate function for handleEvent
    // case here to improve addEventListener performance
    // we will create the bind delegate when invoke
    let isHandleEvent = false;
    if (typeof delegate === 'function') {
    } else {
      if (!delegate.handleEvent) {
        return nativeAddEventListener.apply(this, arguments);
      }
      isHandleEvent = true;
    }

    const eventName = arguments[0];
    const options = arguments[2];

    let capture;
    if (options === undefined) {
      capture = false;
    } else if (options === true) {
      capture = true;
    } else if (options === false) {
      capture = false;
    } else {
      capture = options ? !!options.capture : false;
    }

    const zone = Zone.current;
    const symbolEventNames = zoneSymbolEventNames[eventName];
    let symbolEventName;
    if (!symbolEventNames) {
      // the code is duplicate, but I just want to get some better performance
      const falseEventName = eventName + FALSE_STR;
      const trueEventName = eventName + TRUE_STR;
      const symbol = '__zone_symbol__' + falseEventName;
      const symbolCapture = '__zone_symbol__' + trueEventName;
      zoneSymbolEventNames[eventName] = {};
      zoneSymbolEventNames[eventName][FALSE_STR] = symbol;
      zoneSymbolEventNames[eventName][TRUE_STR] = symbolCapture;
      symbolEventName = capture ? symbolCapture : symbol;
    } else {
      symbolEventName = symbolEventNames[capture ? TRUE_STR : FALSE_STR];
    }
    let existingTasks = target[symbolEventName];
    let isExisting = false;
    if (existingTasks) {
      // already have task registered
      isExisting = true;
      for (let i = 0; i < existingTasks.length; i++) {
        const existingTask = existingTasks[i];
        const typeOfDelegate = typeof delegate;
        if ((typeOfDelegate === 'function' && existingTask.callback === delegate) ||
            (typeOfDelegate === 'object' && existingTask.originalDelegate === delegate)) {
          // same callback, same capture, same event name, just return
          return;
        }
      }
    } else {
      existingTasks = target[symbolEventName] = [];
    }
    let source;
    const constructorName = target.constructor['name'];
    const targetSource = globalSources[constructorName];
    if (targetSource) {
      source = targetSource[eventName];
    }
    if (!source) {
      source = constructorName + '.addEventListener:' + eventName;
    }
    // do not create a new object as task.data to pass those things
    // just use the global shared one
    taskData.options = options;
    taskData.target = target;
    taskData.capture = capture;
    taskData.eventName = eventName;
    taskData.isExisting = isExisting;
    const task: any = zone.scheduleEventTask(
        source, delegate, OPTIMIZED_ZONE_EVENT_TASK, customSchedule, customCancel);

    // have to save those information to task in case
    // application may call task.zone.cancelTask() directly
    task.options = options;
    task.target = target;
    task.capture = capture;
    task.eventName = eventName;
    if (isHandleEvent) {
      // save original delegate for compare to check duplicate
      (task as any).originalDelegate = delegate;
    }
    existingTasks.push(task);
  };

  proto.removeEventListener = function() {
    const target = this || _global;
    const eventName = arguments[0];
    const options = arguments[2];

    let capture;
    if (options === undefined) {
      capture = false;
    } else if (options === true) {
      capture = true;
    } else if (options === false) {
      capture = false;
    } else {
      capture = options ? !!options.capture : false;
    }

    const symbolEventNames = zoneSymbolEventNames[eventName];
    const delegate = arguments[1];
    let symbolEventName;
    if (symbolEventNames) {
      symbolEventName = symbolEventNames[capture ? TRUE_STR : FALSE_STR];
    }
    const existingTasks = symbolEventName && target[symbolEventName];
    if (existingTasks) {
      for (let i = 0; i < existingTasks.length; i++) {
        const existingTask = existingTasks[i];
        const typeOfDelegate = typeof delegate;
        if ((typeOfDelegate === 'function' && existingTask.callback === delegate) ||
            (typeOfDelegate === 'object' && existingTask.originalDelegate === delegate)) {
          existingTasks.splice(i, 1);
          if (existingTasks.length === 0) {
            // all tasks for the eventName + capture have gone,
            // remove globalZoneAwareCallback and remove the task cache from target
            (existingTask as any).remove = true;
            target[symbolEventName] = null;
          }
          existingTask.zone.cancelTask(existingTask);
          return;
        }
      }
    }
  };

  // for native toString patch
  attachOriginToPatched(proto.addEventListener, nativeAddEventListener);
  attachOriginToPatched(proto.removeEventListener, nativeRemoveEventListener);
}
