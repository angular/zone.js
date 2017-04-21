/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * Suppress closure compiler errors about unknown 'Zone' variable
 * @fileoverview
 * @suppress {undefinedVars,globalThis}
 */

// Hack since TypeScript isn't compiling this for a worker.
declare const WorkerGlobalScope: any;

export const zoneSymbol: (name: string) => string = (n) => `__zone_symbol__${n}`;
const _global: any =
    typeof window === 'object' && window || typeof self === 'object' && self || global;

export function bindArguments(args: any[], source: string): any[] {
  for (let i = args.length - 1; i >= 0; i--) {
    if (typeof args[i] === 'function') {
      args[i] = Zone.current.wrap(args[i], source + '_' + i);
    }
  }
  return args;
}

export function patchPrototype(prototype: any, fnNames: string[]) {
  const source = prototype.constructor['name'];
  for (let i = 0; i < fnNames.length; i++) {
    const name = fnNames[i];
    const delegate = prototype[name];
    if (delegate) {
      prototype[name] = ((delegate: Function) => {
        const patched: any = function() {
          return delegate.apply(this, bindArguments(<any>arguments, source + '.' + name));
        };
        attachOriginToPatched(patched, delegate);
        return patched;
      })(delegate);
    }
  }
}

export const isWebWorker: boolean =
    (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope);

export const isNode: boolean =
    (!('nw' in _global) && typeof process !== 'undefined' &&
     {}.toString.call(process) === '[object process]');

export const isBrowser: boolean =
    !isNode && !isWebWorker && !!(typeof window !== 'undefined' && (window as any)['HTMLElement']);

// we are in electron of nw, so we are both browser and nodejs
export const isMix: boolean = typeof process !== 'undefined' &&
    {}.toString.call(process) === '[object process]' && !isWebWorker &&
    !!(typeof window !== 'undefined' && (window as any)['HTMLElement']);

export function patchProperty(obj: any, prop: string) {
  const desc = Object.getOwnPropertyDescriptor(obj, prop) || {enumerable: true, configurable: true};
  // if the descriptor is not configurable
  // just return
  if (!desc.configurable) {
    return;
  }

  // A property descriptor cannot have getter/setter and be writable
  // deleting the writable and value properties avoids this error:
  //
  // TypeError: property descriptors must not specify a value or be writable when a
  // getter or setter has been specified
  delete desc.writable;
  delete desc.value;
  const originalDescGet = desc.get;

  // substr(2) cuz 'onclick' -> 'click', etc
  const eventName = prop.substr(2);
  const _prop = zoneSymbol('_' + prop);

  desc.set = function(newValue) {
    // in some of windows's onproperty callback, this is undefined
    // so we need to check it
    let target = this;
    if (!target && obj === _global) {
      target = _global;
    }
    if (!target) {
      return;
    }
    let previousValue = target[_prop];
    if (previousValue) {
      target.removeEventListener(eventName, previousValue);
    }

    if (typeof newValue === 'function') {
      const wrapFn = function(event: Event) {
        let result = newValue.apply(this, arguments);

        if (result != undefined && !result) {
          event.preventDefault();
        }
        return result;
      };

      target[_prop] = wrapFn;
      target.addEventListener(eventName, wrapFn, false);
    } else {
      target[_prop] = null;
    }
  };

  // The getter would return undefined for unassigned properties but the default value of an
  // unassigned property is null
  desc.get = function() {
    // in some of windows's onproperty callback, this is undefined
    // so we need to check it
    let target = this;
    if (!target && obj === _global) {
      target = _global;
    }
    if (!target) {
      return null;
    }
    if (target.hasOwnProperty(_prop)) {
      return target[_prop];
    } else {
      // result will be null when use inline event attribute,
      // such as <button onclick="func();">OK</button>
      // because the onclick function is internal raw uncompiled handler
      // the onclick will be evaluated when first time event was triggered or
      // the property is accessed, https://github.com/angular/zone.js/issues/525
      // so we should use original native get to retrieve the handler
      let value = originalDescGet.apply(this);
      value = desc.set.apply(this, [value]);
      if (typeof target['removeAttribute'] === 'function') {
        target.removeAttribute(prop);
      }
      return value;
    }
  };

  Object.defineProperty(obj, prop, desc);
}

export function patchOnProperties(obj: any, properties: string[]) {
  if (properties) {
    for (let i = 0; i < properties.length; i++) {
      patchProperty(obj, 'on' + properties[i]);
    }
  } else {
    const onProperties = [];
    for (const prop in obj) {
      if (prop.substr(0, 2) == 'on') {
        onProperties.push(prop);
      }
    }
    for (let j = 0; j < onProperties.length; j++) {
      patchProperty(obj, onProperties[j]);
    }
  }
}

const EVENT_TASKS = zoneSymbol('eventTasks');

// For EventTarget
const ADD_EVENT_LISTENER = 'addEventListener';
const REMOVE_EVENT_LISTENER = 'removeEventListener';

export interface NestedEventListener { listener?: EventListenerOrEventListenerObject; }

export declare type NestedEventListenerOrEventListenerObject =
    NestedEventListener | EventListener | EventListenerObject;

export interface EventListenerOptions { capture?: boolean; }

export interface AddEventListenerOptions extends EventListenerOptions {
  passive?: boolean;
  once?: boolean;
}

export declare type EventListenerOptionsOrCapture =
    EventListenerOptions | AddEventListenerOptions | boolean;

export interface ListenerTaskMeta extends TaskData {
  options: EventListenerOptionsOrCapture;
  eventName: string;
  handler: NestedEventListenerOrEventListenerObject;
  target: any;
  name: string;
  crossContext: boolean;
  invokeAddFunc: (addFnSymbol: any, delegate: Task|NestedEventListenerOrEventListenerObject) => any;
  invokeRemoveFunc:
      (removeFnSymbol: any, delegate: Task|NestedEventListenerOrEventListenerObject) => any;
}

// compare the EventListenerOptionsOrCapture
// 1. if the options is usCapture: boolean, compare the useCpature values directly
// 2. if the options is EventListerOptions, only compare the capture
function compareEventListenerOptions(
    left: EventListenerOptionsOrCapture, right: EventListenerOptionsOrCapture): boolean {
  const leftCapture: any = (typeof left === 'boolean') ?
      left :
      ((typeof left === 'object') ? (left && left.capture) : false);
  const rightCapture: any = (typeof right === 'boolean') ?
      right :
      ((typeof right === 'object') ? (right && right.capture) : false);
  return !!leftCapture === !!rightCapture;
}

function findExistingRegisteredTask(
    target: any, handler: any, name: string, options: EventListenerOptionsOrCapture,
    remove: boolean): Task {
  const eventTasks: Task[] = target[EVENT_TASKS];
  if (eventTasks) {
    for (let i = 0; i < eventTasks.length; i++) {
      const eventTask = eventTasks[i];
      const data = <ListenerTaskMeta>eventTask.data;
      const listener = <NestedEventListener>data.handler;
      if ((data.handler === handler || listener.listener === handler) &&
          compareEventListenerOptions(data.options, options) && data.eventName === name) {
        if (remove) {
          eventTasks.splice(i, 1);
        }
        return eventTask;
      }
    }
  }
  return null;
}

function findAllExistingRegisteredTasks(target: any, name: string, remove: boolean): Task[] {
  const eventTasks: Task[] = target[EVENT_TASKS];
  if (eventTasks) {
    const result = [];
    for (let i = eventTasks.length - 1; i >= 0; i--) {
      const eventTask = eventTasks[i];
      const data = <ListenerTaskMeta>eventTask.data;
      if (data.eventName === name) {
        result.push(eventTask);
        if (remove) {
          eventTasks.splice(i, 1);
        }
      }
    }
    return result;
  }
  return null;
}

function attachRegisteredEvent(target: any, eventTask: Task, isPrepend: boolean): void {
  let eventTasks: Task[] = target[EVENT_TASKS];
  if (!eventTasks) {
    eventTasks = target[EVENT_TASKS] = [];
  }
  if (isPrepend) {
    eventTasks.unshift(eventTask);
  } else {
    eventTasks.push(eventTask);
  }
}

const defaultListenerMetaCreator = (self: any, args: any[]) => {
  return {
    options: args[2],
    eventName: args[0],
    handler: args[1],
    target: self || _global,
    name: args[0],
    crossContext: false,
    invokeAddFunc: function(
        addFnSymbol: any, delegate: Task|NestedEventListenerOrEventListenerObject) {
      // check if the data is cross site context, if it is, fallback to
      // remove the delegate directly and try catch error
      if (!this.crossContext) {
        if (delegate && (<Task>delegate).invoke) {
          return this.target[addFnSymbol](this.eventName, (<Task>delegate).invoke, this.options);
        } else {
          return this.target[addFnSymbol](this.eventName, delegate, this.options);
        }
      } else {
        // add a if/else branch here for performance concern, for most times
        // cross site context is false, so we don't need to try/catch
        try {
          return this.target[addFnSymbol](this.eventName, delegate, this.options);
        } catch (err) {
          // do nothing here is fine, because objects in a cross-site context are unusable
        }
      }
    },
    invokeRemoveFunc: function(
        removeFnSymbol: any, delegate: Task|NestedEventListenerOrEventListenerObject) {
      // check if the data is cross site context, if it is, fallback to
      // remove the delegate directly and try catch error
      if (!this.crossContext) {
        if (delegate && (<Task>delegate).invoke) {
          return this.target[removeFnSymbol](this.eventName, (<Task>delegate).invoke, this.options);
        } else {
          return this.target[removeFnSymbol](this.eventName, delegate, this.options);
        }
      } else {
        // add a if/else branch here for performance concern, for most times
        // cross site context is false, so we don't need to try/catch
        try {
          return this.target[removeFnSymbol](this.eventName, delegate, this.options);
        } catch (err) {
          // do nothing here is fine, because objects in a cross-site context are unusable
        }
      }
    }
  };
};

export function makeZoneAwareAddListener(
    addFnName: string, removeFnName: string, useCapturingParam: boolean = true,
    allowDuplicates: boolean = false, isPrepend: boolean = false,
    metaCreator: (self: any, args: any[]) => ListenerTaskMeta = defaultListenerMetaCreator) {
  const addFnSymbol = zoneSymbol(addFnName);
  const removeFnSymbol = zoneSymbol(removeFnName);
  const defaultUseCapturing = useCapturingParam ? false : undefined;

  function scheduleEventListener(eventTask: Task): any {
    const meta = <ListenerTaskMeta>eventTask.data;
    attachRegisteredEvent(meta.target, eventTask, isPrepend);
    return meta.invokeAddFunc(addFnSymbol, eventTask);
  }

  function cancelEventListener(eventTask: Task): void {
    const meta = <ListenerTaskMeta>eventTask.data;
    findExistingRegisteredTask(meta.target, eventTask.invoke, meta.eventName, meta.options, true);
    return meta.invokeRemoveFunc(removeFnSymbol, eventTask);
  }

  return function zoneAwareAddListener(self: any, args: any[]) {
    const data: ListenerTaskMeta = metaCreator(self, args);

    data.options = data.options || defaultUseCapturing;
    // - Inside a Web Worker, `this` is undefined, the context is `global`
    // - When `addEventListener` is called on the global context in strict mode, `this` is undefined
    // see https://github.com/angular/zone.js/issues/190
    let delegate: EventListener = null;
    if (typeof data.handler == 'function') {
      delegate = <EventListener>data.handler;
    } else if (data.handler && (<EventListenerObject>data.handler).handleEvent) {
      delegate = (event) => (<EventListenerObject>data.handler).handleEvent(event);
    }
    let validZoneHandler = false;
    try {
      // In cross site contexts (such as WebDriver frameworks like Selenium),
      // accessing the handler object here will cause an exception to be thrown which
      // will fail tests prematurely.
      validZoneHandler = data.handler && data.handler.toString() === '[object FunctionWrapper]';
    } catch (error) {
      // we can still try to add the data.handler even we are in cross site context
      data.crossContext = true;
      return data.invokeAddFunc(addFnSymbol, data.handler);
    }
    // Ignore special listeners of IE11 & Edge dev tools, see
    // https://github.com/angular/zone.js/issues/150
    if (!delegate || validZoneHandler) {
      return data.invokeAddFunc(addFnSymbol, data.handler);
    }

    if (!allowDuplicates) {
      const eventTask: Task = findExistingRegisteredTask(
          data.target, data.handler, data.eventName, data.options, false);
      if (eventTask) {
        // we already registered, so this will have noop.
        return data.invokeAddFunc(addFnSymbol, eventTask);
      }
    }

    const zone: Zone = Zone.current;
    const source = data.target.constructor['name'] + '.' + addFnName + ':' + data.eventName;

    zone.scheduleEventTask(source, delegate, data, scheduleEventListener, cancelEventListener);
  };
}

export function makeZoneAwareRemoveListener(
    fnName: string, useCapturingParam: boolean = true,
    metaCreator: (self: any, args: any[]) => ListenerTaskMeta = defaultListenerMetaCreator) {
  const symbol = zoneSymbol(fnName);
  const defaultUseCapturing = useCapturingParam ? false : undefined;

  return function zoneAwareRemoveListener(self: any, args: any[]) {
    const data = metaCreator(self, args);

    data.options = data.options || defaultUseCapturing;
    // - Inside a Web Worker, `this` is undefined, the context is `global`
    // - When `addEventListener` is called on the global context in strict mode, `this` is undefined
    // see https://github.com/angular/zone.js/issues/190
    let delegate: EventListener = null;
    if (typeof data.handler == 'function') {
      delegate = <EventListener>data.handler;
    } else if (data.handler && (<EventListenerObject>data.handler).handleEvent) {
      delegate = (event) => (<EventListenerObject>data.handler).handleEvent(event);
    }
    let validZoneHandler = false;
    try {
      // In cross site contexts (such as WebDriver frameworks like Selenium),
      // accessing the handler object here will cause an exception to be thrown which
      // will fail tests prematurely.
      validZoneHandler = data.handler && data.handler.toString() === '[object FunctionWrapper]';
    } catch (error) {
      data.crossContext = true;
      return data.invokeRemoveFunc(symbol, data.handler);
    }
    // Ignore special listeners of IE11 & Edge dev tools, see
    // https://github.com/angular/zone.js/issues/150
    if (!delegate || validZoneHandler) {
      return data.invokeRemoveFunc(symbol, data.handler);
    }
    const eventTask =
        findExistingRegisteredTask(data.target, data.handler, data.eventName, data.options, true);
    if (eventTask) {
      eventTask.zone.cancelTask(eventTask);
    } else {
      data.invokeRemoveFunc(symbol, data.handler);
    }
  };
}

export function makeZoneAwareRemoveAllListeners(fnName: string) {
  const symbol = zoneSymbol(fnName);

  return function zoneAwareRemoveAllListener(self: any, args: any[]) {
    const target = self || _global;
    if (args.length === 0) {
      // remove all listeners without eventName
      target[EVENT_TASKS] = [];
      // we don't cancel Task either, because call native eventEmitter.removeAllListeners will
      // will do remove listener(cancelTask) for us
      target[symbol]();
      return;
    }
    const eventName = args[0];
    // call this function just remove the related eventTask from target[EVENT_TASKS]
    // we don't need useCapturing here because useCapturing is just for DOM, and
    // removeAllListeners should only be called by node eventEmitter
    // and we don't cancel Task either, because call native eventEmitter.removeAllListeners will
    // will do remove listener(cancelTask) for us
    findAllExistingRegisteredTasks(target, eventName, true);
    target[symbol](eventName);
  };
}

export function makeZoneAwareListeners(fnName: string) {
  return function zoneAwareEventListeners(self: any, args: any[]) {
    const eventName: string = args[0];
    const target = self || _global;
    if (!target[EVENT_TASKS]) {
      return [];
    }
    return target[EVENT_TASKS]
        .filter((task: Task) => (task.data as any)['eventName'] === eventName)
        .map((task: Task) => (task.data as any)['handler']);
  };
}

export function patchEventTargetMethods(
    obj: any, addFnName: string = ADD_EVENT_LISTENER, removeFnName: string = REMOVE_EVENT_LISTENER,
    metaCreator: (self: any, args: any[]) => ListenerTaskMeta =
        defaultListenerMetaCreator): boolean {
  if (obj && obj[addFnName]) {
    patchMethod(
        obj, addFnName,
        () => makeZoneAwareAddListener(addFnName, removeFnName, true, false, false, metaCreator));
    patchMethod(
        obj, removeFnName, () => makeZoneAwareRemoveListener(removeFnName, true, metaCreator));
    return true;
  } else {
    return false;
  }
}

const originalInstanceKey = zoneSymbol('originalInstance');

// wrap some native API on `window`
export function patchClass(className: string) {
  const OriginalClass = _global[className];
  if (!OriginalClass) return;
  // keep original class in global
  _global[zoneSymbol(className)] = OriginalClass;

  _global[className] = function() {
    const a = bindArguments(<any>arguments, className);
    switch (a.length) {
      case 0:
        this[originalInstanceKey] = new OriginalClass();
        break;
      case 1:
        this[originalInstanceKey] = new OriginalClass(a[0]);
        break;
      case 2:
        this[originalInstanceKey] = new OriginalClass(a[0], a[1]);
        break;
      case 3:
        this[originalInstanceKey] = new OriginalClass(a[0], a[1], a[2]);
        break;
      case 4:
        this[originalInstanceKey] = new OriginalClass(a[0], a[1], a[2], a[3]);
        break;
      default:
        throw new Error('Arg list too long.');
    }
  };

  // attach original delegate to patched function
  attachOriginToPatched(_global[className], OriginalClass);

  const instance = new OriginalClass(function() {});

  let prop;
  for (prop in instance) {
    // https://bugs.webkit.org/show_bug.cgi?id=44721
    if (className === 'XMLHttpRequest' && prop === 'responseBlob') continue;
    (function(prop) {
      if (typeof instance[prop] === 'function') {
        _global[className].prototype[prop] = function() {
          return this[originalInstanceKey][prop].apply(this[originalInstanceKey], arguments);
        };
      } else {
        Object.defineProperty(_global[className].prototype, prop, {
          set: function(fn) {
            if (typeof fn === 'function') {
              this[originalInstanceKey][prop] = Zone.current.wrap(fn, className + '.' + prop);
              // keep callback in wrapped function so we can
              // use it in Function.prototype.toString to return
              // the native one.
              attachOriginToPatched(this[originalInstanceKey][prop], fn);
            } else {
              this[originalInstanceKey][prop] = fn;
            }
          },
          get: function() {
            return this[originalInstanceKey][prop];
          }
        });
      }
    }(prop));
  }

  for (prop in OriginalClass) {
    if (prop !== 'prototype' && OriginalClass.hasOwnProperty(prop)) {
      _global[className][prop] = OriginalClass[prop];
    }
  }
}

export function createNamedFn(name: string, delegate: (self: any, args: any[]) => any): Function {
  try {
    return (Function('f', `return function ${name}(){return f(this, arguments)}`))(delegate);
  } catch (error) {
    // if we fail, we must be CSP, just return delegate.
    return function() {
      return delegate(this, <any>arguments);
    };
  }
}

export function patchMethod(
    target: any, name: string,
    patchFn: (delegate: Function, delegateName: string, name: string) => (self: any, args: any[]) =>
        any): Function {
  let proto = target;
  while (proto && Object.getOwnPropertyNames(proto).indexOf(name) === -1) {
    proto = Object.getPrototypeOf(proto);
  }
  if (!proto && target[name]) {
    // somehow we did not find it, but we can see it. This happens on IE for Window properties.
    proto = target;
  }
  const delegateName = zoneSymbol(name);
  let delegate: Function;
  if (proto && !(delegate = proto[delegateName])) {
    delegate = proto[delegateName] = proto[name];
    proto[name] = createNamedFn(name, patchFn(delegate, delegateName, name));
    attachOriginToPatched(proto[name], delegate);
  }
  return delegate;
}

export interface MacroTaskMeta extends TaskData {
  name: string;
  target: any;
  callbackIndex: number;
  args: any[];
}

// TODO: @JiaLiPassion, support cancel task later if necessary
export function patchMacroTask(
    obj: any, funcName: string, metaCreator: (self: any, args: any[]) => MacroTaskMeta) {
  let setNative: Function = null;

  function scheduleTask(task: Task) {
    const data = <MacroTaskMeta>task.data;
    data.args[data.callbackIndex] = function() {
      task.invoke.apply(this, arguments);
    };
    setNative.apply(data.target, data.args);
    return task;
  }

  setNative = patchMethod(obj, funcName, (delegate: Function) => function(self: any, args: any[]) {
    const meta = metaCreator(self, args);
    if (meta.callbackIndex >= 0 && typeof args[meta.callbackIndex] === 'function') {
      const task = Zone.current.scheduleMacroTask(
          meta.name, args[meta.callbackIndex], meta, scheduleTask, null);
      return task;
    } else {
      // cause an error by calling it directly.
      return delegate.apply(self, args);
    }
  });
}

export interface MicroTaskMeta extends TaskData {
  name: string;
  target: any;
  callbackIndex: number;
  args: any[];
}

export function patchMicroTask(
    obj: any, funcName: string, metaCreator: (self: any, args: any[]) => MicroTaskMeta) {
  let setNative: Function = null;

  function scheduleTask(task: Task) {
    const data = <MacroTaskMeta>task.data;
    data.args[data.callbackIndex] = function() {
      task.invoke.apply(this, arguments);
    };
    setNative.apply(data.target, data.args);
    return task;
  }

  setNative = patchMethod(obj, funcName, (delegate: Function) => function(self: any, args: any[]) {
    const meta = metaCreator(self, args);
    if (meta.callbackIndex >= 0 && typeof args[meta.callbackIndex] === 'function') {
      const task =
          Zone.current.scheduleMicroTask(meta.name, args[meta.callbackIndex], meta, scheduleTask);
      return task;
    } else {
      // cause an error by calling it directly.
      return delegate.apply(self, args);
    }
  });
}

export function findEventTask(target: any, evtName: string): Task[] {
  const eventTasks: Task[] = target[zoneSymbol('eventTasks')];
  const result: Task[] = [];
  if (eventTasks) {
    for (let i = 0; i < eventTasks.length; i++) {
      const eventTask = eventTasks[i];
      const data = eventTask.data;
      const eventName = data && (<any>data).eventName;
      if (eventName === evtName) {
        result.push(eventTask);
      }
    }
  }
  return result;
}

export function attachOriginToPatched(patched: Function, original: any) {
  (patched as any)[zoneSymbol('OriginalDelegate')] = original;
}

(Zone as any)[zoneSymbol('patchEventTargetMethods')] = patchEventTargetMethods;
(Zone as any)[zoneSymbol('patchOnProperties')] = patchOnProperties;
