/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {globalSources, patchEventTarget, zoneSymbolEventNames} from '../common/events';

Zone.__load_patch('EventEmitter', (global: any, Zone: ZoneType, api: _ZonePrivate) => {
  const callAndReturnFirstParam = (fn: (self: any, args: any[]) => any) => {
    return (self: any, args: any[]) => {
      fn(self, args);
      return self;
    };
  };

  // For EventEmitter
  const EE_ADD_LISTENER = 'addListener';
  const EE_PREPEND_LISTENER = 'prependListener';
  const EE_REMOVE_LISTENER = 'removeListener';
  const EE_REMOVE_ALL_LISTENER = 'removeAllListeners';
  const EE_LISTENERS = 'listeners';
  const EE_ON = 'on';

  const compareTaskCallbackVsDelegate = function(task: any, delegate: any) {
    if (task.callback === delegate || task.callback.listener === delegate) {
      // same callback, same capture, same event name, just return
      return true;
    }
    return false;
  };

  function patchEventEmitterMethods(obj: any) {
    const result = patchEventTarget(global, [obj], {
      useGlobalCallback: false,
      addEventListenerFnName: EE_ADD_LISTENER,
      removeEventListenerFnName: EE_REMOVE_LISTENER,
      prependEventListenerFnName: EE_PREPEND_LISTENER,
      removeAllFnName: EE_REMOVE_ALL_LISTENER,
      listenersFnName: EE_LISTENERS,
      checkDuplicate: false,
      returnTarget: true,
      compareTaskCallbackVsDelegate: compareTaskCallbackVsDelegate
    });
    if (result && result[0]) {
      obj[EE_ON] = obj[EE_ADD_LISTENER];
    }
  }

  // EventEmitter
  let events;
  try {
    events = require('events');
  } catch (err) {
  }

  if (events && events.EventEmitter) {
    patchEventEmitterMethods(events.EventEmitter.prototype);
  }
});
