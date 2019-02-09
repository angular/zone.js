/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * @fileoverview
 * @suppress {globalThis}
 */

import {isBrowser, isMix, isNode, ObjectDefineProperty, ObjectGetOwnPropertyDescriptor, patchClass, patchOnProperties, wrapWithCurrentZone, zoneSymbol} from '../common/utils';

import {eventNames, filterProperties, IgnoreProperty} from './property-descriptor';
import * as webSocketPatch from './websocket';

export function patchFilteredProperties(
    target: any, onProperties: string[], ignoreProperties: IgnoreProperty[], prototype?: any) {
  // check whether target is available, sometimes target will be undefined
  // because different browser or some 3rd party plugin.
  if (!target) {
    return;
  }
  const filteredProperties: string[] = filterProperties(target, onProperties, ignoreProperties);
  patchOnProperties(target, filteredProperties, prototype);
}

export function propertyDescriptorLegacyPatch(api: _ZonePrivate, _global: any) {
  if (isNode && !isMix) {
    return;
  }

  const supportsWebSocket = typeof WebSocket !== 'undefined';
  if (!canPatchViaPropertyDescriptor()) {
    // Safari, Android browsers (Jelly Bean)
    patchViaCapturingAllTheEvents();
    patchClass('XMLHttpRequest');
    if (supportsWebSocket) {
      webSocketPatch.apply(api, _global);
    }
    (Zone as any)[api.symbol('patchEvents')] = true;
  }
}

function canPatchViaPropertyDescriptor() {
  if ((isBrowser || isMix) && !ObjectGetOwnPropertyDescriptor(HTMLElement.prototype, 'onclick') &&
      typeof Element !== 'undefined') {
    // WebKit https://bugs.webkit.org/show_bug.cgi?id=134364
    // IDL interface attributes are not configurable
    const desc = ObjectGetOwnPropertyDescriptor(Element.prototype, 'onclick');
    if (desc && !desc.configurable) return false;
  }

  const ON_READY_STATE_CHANGE = 'onreadystatechange';
  const XMLHttpRequestPrototype = XMLHttpRequest.prototype;

  const xhrDesc = ObjectGetOwnPropertyDescriptor(XMLHttpRequestPrototype, ON_READY_STATE_CHANGE);

  // add enumerable and configurable here because in opera
  // by default XMLHttpRequest.prototype.onreadystatechange is undefined
  // without adding enumerable and configurable will cause onreadystatechange
  // non-configurable
  // and if XMLHttpRequest.prototype.onreadystatechange is undefined,
  // we should set a real desc instead a fake one
  if (xhrDesc) {
    ObjectDefineProperty(XMLHttpRequestPrototype, ON_READY_STATE_CHANGE, {
      enumerable: true,
      configurable: true,
      get: function() {
        return true;
      }
    });
    const req = new XMLHttpRequest();
    const result = !!req.onreadystatechange;
    // restore original desc
    ObjectDefineProperty(XMLHttpRequestPrototype, ON_READY_STATE_CHANGE, xhrDesc || {});
    return result;
  } else {
    const SYMBOL_FAKE_ONREADYSTATECHANGE = zoneSymbol('fake');
    ObjectDefineProperty(XMLHttpRequestPrototype, ON_READY_STATE_CHANGE, {
      enumerable: true,
      configurable: true,
      get: function() {
        return this[SYMBOL_FAKE_ONREADYSTATECHANGE];
      },
      set: function(value) {
        this[SYMBOL_FAKE_ONREADYSTATECHANGE] = value;
      }
    });
    const req = new XMLHttpRequest();
    const detectFunc = () => {};
    req.onreadystatechange = detectFunc;
    const result = (req as any)[SYMBOL_FAKE_ONREADYSTATECHANGE] === detectFunc;
    req.onreadystatechange = null as any;
    return result;
  }
}

const unboundKey = zoneSymbol('unbound');

// Whenever any eventListener fires, we check the eventListener target and all parents
// for `onwhatever` properties and replace them with zone-bound functions
// - Chrome (for now)
function patchViaCapturingAllTheEvents() {
  for (let i = 0; i < eventNames.length; i++) {
    const property = eventNames[i];
    const onproperty = 'on' + property;
    self.addEventListener(property, function(event) {
      let elt: any = <Node>event.target, bound, source;
      if (elt) {
        source = elt.constructor['name'] + '.' + onproperty;
      } else {
        source = 'unknown.' + onproperty;
      }
      while (elt) {
        if (elt[onproperty] && !elt[onproperty][unboundKey]) {
          bound = wrapWithCurrentZone(elt[onproperty], source);
          bound[unboundKey] = elt[onproperty];
          elt[onproperty] = bound;
        }
        elt = elt.parentElement;
      }
    }, true);
  }
}
