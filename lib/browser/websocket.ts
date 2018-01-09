/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {patchEventTarget} from '../common/events';
import {ADD_EVENT_LISTENER_STR, ArraySlice, ObjectCreate, ObjectGetOwnPropertyDescriptor, patchOnProperties, REMOVE_EVENT_LISTENER_STR} from '../common/utils';

// we have to patch the instance since the proto is non-configurable
export function apply(api: _ZonePrivate, _global: any) {
  const WS = (<any>_global).WebSocket;
  // On Safari window.EventTarget doesn't exist so need to patch WS add/removeEventListener
  // On older Chrome, no need since EventTarget was already patched
  if (!(<any>_global).EventTarget) {
    patchEventTarget(_global, [WS.prototype]);
  }
  (<any>_global).WebSocket = function(x: any, y: any) {
    const socket = arguments.length > 1 ? new WS(x, y) : new WS(x);
    let proxySocket: any;

    let proxySocketProto: any;

    // Safari 7.0 has non-configurable own 'onmessage' and friends properties on the socket instance
    const onmessageDesc = ObjectGetOwnPropertyDescriptor(socket, 'onmessage');
    if (onmessageDesc && onmessageDesc.configurable === false) {
      proxySocket = ObjectCreate(socket);
      // socket have own property descriptor 'onopen', 'onmessage', 'onclose', 'onerror'
      // but proxySocket not, so we will keep socket as prototype and pass it to
      // patchOnProperties method
      proxySocketProto = socket;
      [ADD_EVENT_LISTENER_STR, REMOVE_EVENT_LISTENER_STR, 'send', 'close'].forEach(function(
          propName) {
        proxySocket[propName] = function() {
          const args = ArraySlice.call(arguments);
          if (propName === ADD_EVENT_LISTENER_STR || propName === REMOVE_EVENT_LISTENER_STR) {
            const eventName = args.length > 0 ? args[0] : undefined;
            if (eventName) {
              const propertySymbol = Zone.__symbol__('ON_PROPERTY' + eventName);
              socket[propertySymbol] = proxySocket[propertySymbol];
            }
          }
          return socket[propName].apply(socket, args);
        };
      });
    } else {
      // we can patch the real socket
      proxySocket = socket;
    }

    patchOnProperties(proxySocket, ['close', 'error', 'message', 'open'], proxySocketProto);
    return proxySocket;
  };

  const globalWebSocket = _global['WebSocket'];
  for (const prop in WS) {
    globalWebSocket[prop] = WS[prop];
  }
}
