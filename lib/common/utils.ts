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

export const zoneSymbol = Zone.__symbol__;
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

// Make sure to access `process` through `_global` so that WebPack does not accidently browserify
// this code.
export const isNode: boolean =
    (!('nw' in _global) && typeof _global.process !== 'undefined' &&
     {}.toString.call(_global.process) === '[object process]');

export const isBrowser: boolean =
    !isNode && !isWebWorker && !!(typeof window !== 'undefined' && (window as any)['HTMLElement']);

// we are in electron of nw, so we are both browser and nodejs
// Make sure to access `process` through `_global` so that WebPack does not accidently browserify
// this code.
export const isMix: boolean = typeof _global.process !== 'undefined' &&
    {}.toString.call(_global.process) === '[object process]' && !isWebWorker &&
    !!(typeof window !== 'undefined' && (window as any)['HTMLElement']);

export function patchProperty(obj: any, prop: string, prototype?: any) {
  let desc = Object.getOwnPropertyDescriptor(obj, prop);
  if (!desc && prototype) {
    // when patch window object, use prototype to check prop exist or not
    const prototypeDesc = Object.getOwnPropertyDescriptor(prototype, prop);
    if (prototypeDesc) {
      desc = {enumerable: true, configurable: true};
    }
  }
  // if the descriptor not exists or is not configurable
  // just return
  if (!desc || !desc.configurable) {
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
    } else if (originalDescGet) {
      // result will be null when use inline event attribute,
      // such as <button onclick="func();">OK</button>
      // because the onclick function is internal raw uncompiled handler
      // the onclick will be evaluated when first time event was triggered or
      // the property is accessed, https://github.com/angular/zone.js/issues/525
      // so we should use original native get to retrieve the handler
      let value = originalDescGet && originalDescGet.apply(this);
      if (value) {
        desc.set.apply(this, [value]);
        if (typeof target['removeAttribute'] === 'function') {
          target.removeAttribute(prop);
        }
        return value;
      }
    }
    return null;
  };

  Object.defineProperty(obj, prop, desc);
}

export function patchOnProperties(obj: any, properties: string[], prototype?: any) {
  if (properties) {
    for (let i = 0; i < properties.length; i++) {
      patchProperty(obj, 'on' + properties[i], prototype);
    }
  } else {
    const onProperties = [];
    for (const prop in obj) {
      if (prop.substr(0, 2) == 'on') {
        onProperties.push(prop);
      }
    }
    for (let j = 0; j < onProperties.length; j++) {
      patchProperty(obj, onProperties[j], prototype);
    }
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

export function patchMethod(
    target: any, name: string,
    patchFn: (delegate: Function, delegateName: string, name: string) => (self: any, args: any[]) =>
        any): Function {
  let proto = target;
  while (proto && !proto.hasOwnProperty(name)) {
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
    const patchDelegate = patchFn(delegate, delegateName, name);
    proto[name] = function() {
      return patchDelegate(this, arguments as any);
    };
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

export function attachOriginToPatched(patched: Function, original: any) {
  (patched as any)[zoneSymbol('OriginalDelegate')] = original;
}

let isDetectedIEOrEdge = false;
let ieOrEdge = false;

export function isIEOrEdge() {
  if (isDetectedIEOrEdge) {
    return ieOrEdge;
  }

  isDetectedIEOrEdge = true;

  try {
    const ua = window.navigator.userAgent;
    const msie = ua.indexOf('MSIE ');
    if (ua.indexOf('MSIE ') !== -1 || ua.indexOf('Trident/') !== -1 || ua.indexOf('Edge/') !== -1) {
      ieOrEdge = true;
    }
    return ieOrEdge;
  } catch (error) {
  }
}