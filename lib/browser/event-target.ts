/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {globalSources, patchEventPrototype, patchEventTarget, zoneSymbolEventNames} from '../common/events';
import {FALSE_STR, TRUE_STR, ZONE_SYMBOL_PREFIX} from '../common/utils';

import {eventNames} from './property-descriptor';

export function eventTargetPatch(_global: any, api: _ZonePrivate) {
  //  predefine all __zone_symbol__ + eventName + true/false string
  for (let i = 0; i < eventNames.length; i++) {
    const eventName = eventNames[i];
    const falseEventName = eventName + FALSE_STR;
    const trueEventName = eventName + TRUE_STR;
    const symbol = ZONE_SYMBOL_PREFIX + falseEventName;
    const symbolCapture = ZONE_SYMBOL_PREFIX + trueEventName;
    zoneSymbolEventNames[eventName] = {};
    zoneSymbolEventNames[eventName][FALSE_STR] = symbol;
    zoneSymbolEventNames[eventName][TRUE_STR] = symbolCapture;
  }

  const EVENT_TARGET = _global['EventTarget'];
  if (!EVENT_TARGET || !EVENT_TARGET.prototype) {
    return;
  }
  patchEventTarget(_global, [EVENT_TARGET && EVENT_TARGET.prototype]);
  api.patchEventTarget = patchEventTarget;

  return true;
}

export function patchEvent(global: any, api: _ZonePrivate) {
  patchEventPrototype(global, api);
}
