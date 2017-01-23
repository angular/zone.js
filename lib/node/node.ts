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
import {patchMacroTask, patchMethod} from '../common/utils';

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

patchNextTick();

// Crypto
let crypto;
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

function patchNextTick() {
  let setNative = null;

  function scheduleTask(task: Task) {
    const args = task.data;
    args[0] = function() {
      task.invoke.apply(this, arguments);
    };
    setNative.apply(process, args);
    return task;
  }

  setNative =
      patchMethod(process, 'nextTick', (delegate: Function) => function(self: any, args: any[]) {
        if (typeof args[0] === 'function') {
          const zone = Zone.current;
          const task = zone.scheduleMicroTask('nextTick', args[0], args, scheduleTask);
          return task;
        } else {
          // cause an error by calling it directly.
          return delegate.apply(process, args);
        }
      });
}