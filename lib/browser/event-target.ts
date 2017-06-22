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
const OPTIMIZED_ZONE_EVENT_TASK = zoneSymbol('optimizedZoneEventTask');


const zoneSymbolEventNames: any = {};
const globalSources: any = {};

eventNames.forEach((eventName: string) => {
  const falseEventName = eventName + FALSE_STR;
  const trueEventName = eventName + TRUE_STR;
  const symbol = '__zone_symbol__' + falseEventName;
  const symbolCapture = '__zone_symbol__' + trueEventName;
  zoneSymbolEventNames[eventName] = {};
  zoneSymbolEventNames[eventName][FALSE_STR] = symbol;
  zoneSymbolEventNames[eventName][TRUE_STR] = symbolCapture;
});

WTF_ISSUE_555.split(',').forEach((target: string) => {
  const targets: any = globalSources[target] = {};
  eventNames.forEach((eventName: string) => {
    targets[eventName] = target + '.addEventListener:' + eventName;
  });
});

const globalZoneAwareCallback = function(event: Event) {
  const target = this || _global;

  const tasks = target[zoneSymbolEventNames[event.type][FALSE_STR]];
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

  const taskData: any = {};

  const nativeAddEventListener = proto[zoneSymbolAddEventListener] = proto.addEventListener;
  const nativeRemoveEventListener = proto[zoneSymbol('removeEventListener')] =
      proto.removeEventListener;
  const customSchedule = function(task: Task) {
    if (taskData.isExisting) {
      return;
    }
    return nativeAddEventListener.apply(taskData.target, [
      taskData.eventName,
      taskData.capture ? globalZoneAwareCaptureCallback : globalZoneAwareCallback, taskData.options
    ]);
  };

  const customCancel = function(task: any) {
    // call removeListener later
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
      isExisting = true;
      for (let i = 0; i < existingTasks.length; i++) {
        const existingTask = existingTasks[i];
        const typeOfDelegate = typeof delegate;
        if ((typeOfDelegate === 'function' && existingTask.callback === delegate) ||
            (typeOfDelegate === 'object' && existingTask.originalDelegate === delegate)) {
          arguments[1] = capture ? globalZoneAwareCaptureCallback : globalZoneAwareCallback;
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
    taskData.options = options;
    taskData.target = target;
    taskData.capture = capture;
    taskData.eventName = eventName;
    taskData.isExisting = isExisting;
    const task: any = zone.scheduleEventTask(
        source, delegate, OPTIMIZED_ZONE_EVENT_TASK, customSchedule, customCancel);
    task.options = options;
    task.target = target;
    task.capture = capture;
    task.eventName = eventName;
    if (isHandleEvent) {
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
            (existingTask as any).remove = true;
            target[symbolEventName] = null;
          }
          existingTask.zone.cancelTask(existingTask);
          return;
        }
      }
    }
  };

  attachOriginToPatched(proto.addEventListener, nativeAddEventListener);
  attachOriginToPatched(proto.removeEventListener, nativeRemoveEventListener);
}
