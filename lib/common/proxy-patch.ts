/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {patchEventTarget} from './events';
import {patchOnProperties} from './utils';

// we have to patch the instance since the proto is non-configurable
export function patchAsProxy(
    api: _ZonePrivate, _global: any, targetName: string, funcProperties: string[],
    onProperties: string[]) {
  const Target = (<any>_global)[targetName];
  if (!Target) {
    return;
  }

  // On Safari window.EventTarget doesn't exist so need to patch WS add/removeEventListener
  // On older Chrome, no need since EventTarget was already patched
  // Or
  // On webkit, such as FileReader, which not implements EventTarget,
  // so we need to patch addEventListener on target
  patchEventTarget(_global, [Target.prototype]);
  (<any>_global)[targetName] = function() {
    let instance: any;
    const args = Array.prototype.slice.call(arguments);
    switch (args.length) {
      case 0:
        instance = new Target();
        break;
      case 1:
        instance = new Target(args[0]);
        break;
      case 2:
        instance = new Target(args[0], args[1]);
        break;
      case 3:
        instance = new Target(args[0], args[1], args[2]);
        break;
      case 4:
        instance = new Target(args[0], args[1], args[2], args[4]);
        break;
      default:
        throw new Error('Arg list too long.');
    }

    let proxyTarget: any;

    let proxyTargetProto: any;

    // Safari 7.0 or phantomjs has non-configurable own 'onmessage' and friends properties
    // on the target instance
    // so we try to find the descriptor on object prototype chain.
    let desc;
    const property = onProperties.length > 0 ? 'on' + onProperties[0] : undefined;
    let obj = instance;
    if (property) {
      while (obj) {
        const proto = Object.getPrototypeOf(obj);
        if (!proto) {
          break;
        }
        desc = Object.getOwnPropertyDescriptor(proto, property);
        obj = proto;

        if (desc) {
          proxyTargetProto = obj;
          break;
        }
      }
    }
    // if we can't find the descriptior in prototype chain
    // just use the instance itself.
    if (!proxyTargetProto) {
      proxyTargetProto = instance;
    }

    if (!desc || desc.configurable === false) {
      // we can't find descriptor or desc.configurable is false
      // we have to create a proxy object
      proxyTarget = Object.create(instance);
      // instance have own property descriptor of onProperties
      // but proxyTarget not, so we will keep instance as prototype and pass it to
      // patchOnProperties method
      for (const propName in instance) {
        if (typeof instance[propName] === 'function') {
          proxyTarget[propName] = function() {
            const args = Array.prototype.slice.call(arguments);
            if (propName === 'addEventListener' || propName === 'removeEventListener') {
              const eventName = args.length > 0 ? args[0] : undefined;
              if (eventName) {
                // for eventListener performance handling
                const propertySymbol = Zone.__symbol__('ON_PROPERTY' + eventName);
                instance[propertySymbol] = proxyTarget[propertySymbol];
              }
            }
            return instance[propName].apply(instance, args);
          };
        } else {
          Object.defineProperty(proxyTarget, propName, {
            get: function() {
              return instance[propName];
            },
            set: function(value) {
              instance[propName] = value;
            }
          });
        }
      };
    } else {
      // we can patch the real socket
      proxyTarget = instance;
    }

    // patch all on properties as eventTasks
    patchOnProperties(proxyTarget, onProperties, proxyTargetProto);

    return proxyTarget;
  };

  // copy all static properties.
  for (const prop in Target) {
    _global[targetName][prop] = Target[prop];
  }
};
