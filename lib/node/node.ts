/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import '../zone';
import './events';
import './fs';

import {patchTimer} from '../common/timers';
import {patchFuncToString, patchObjectToString} from '../common/to-string';
import {findEventTask, patchMacroTask, patchMicroTask, zoneSymbol} from '../common/utils';

const set = 'set';
const clear = 'clear';
const _global = typeof window === 'object' && window || typeof self === 'object' && self || global;

// Timers
const timers = require('timers');
patchTimer(timers, set, clear, 'Timeout');
patchTimer(timers, set, clear, 'Interval');
patchTimer(timers, set, clear, 'Immediate');

const shouldPatchGlobalTimers = global.setTimeout !== timers.setTimeout;

if (shouldPatchGlobalTimers) {
  patchTimer(_global, set, clear, 'Timeout');
  patchTimer(_global, set, clear, 'Interval');
  patchTimer(_global, set, clear, 'Immediate');
}

// patch process related methods
patchProcess();
handleUnhandledPromiseRejection();

// patch Function.prototyp.toString
patchFuncToString();
// patch Object.prototyp.toString
patchObjectToString();

// Crypto
let crypto: any;
try {
  crypto = require('crypto');
} catch (err) {
}

// use the generic patchMacroTask to patch crypto
if (crypto) {
  const methodNames = ['randomBytes', 'pbkdf2'];
  methodNames.forEach(name => {
    patchMacroTask(crypto, name, (self: any, args: any[]) => {
      return {
        name: 'crypto.' + name,
        args: args,
        callbackIndex:
            (args.length > 0 && typeof args[args.length - 1] === 'function') ? args.length - 1 : -1,
        target: crypto
      };
    });
  });
}

function patchProcess() {
  // patch nextTick as microTask
  patchMicroTask(process, 'nextTick', (self: any, args: any[]) => {
    return {
      name: 'process.nextTick',
      args: args,
      callbackIndex: (args.length > 0 && typeof args[0] === 'function') ? 0 : -1,
      target: process
    };
  });
}

// handle unhandled promise rejection
function findProcessPromiseRejectionHandler(evtName: string) {
  return function(e: any) {
    const eventTasks = findEventTask(process, evtName);
    eventTasks.forEach(eventTask => {
      // process has added unhandledrejection event listener
      // trigger the event listener
      if (evtName === 'unhandledRejection') {
        eventTask.invoke(e.rejection, e.promise);
      } else if (evtName === 'rejectionHandled') {
        eventTask.invoke(e.promise);
      }
    });
  };
}

function handleUnhandledPromiseRejection() {
  (Zone as any)[zoneSymbol('unhandledPromiseRejectionHandler')] =
      findProcessPromiseRejectionHandler('unhandledRejection');

  (Zone as any)[zoneSymbol('rejectionHandledHandler')] =
      findProcessPromiseRejectionHandler('rejectionHandled');
}
