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

import {isBrowser, isMix, isNode, ObjectDefineProperty, ObjectGetOwnPropertyDescriptor, ObjectGetPrototypeOf, patchClass, patchOnProperties, wrapWithCurrentZone, zoneSymbol} from '../common/utils';

import * as webSocketPatch from './websocket';

const globalEventHandlersEventNames = [
  'abort',
  'animationcancel',
  'animationend',
  'animationiteration',
  'auxclick',
  'beforeinput',
  'blur',
  'cancel',
  'canplay',
  'canplaythrough',
  'change',
  'compositionstart',
  'compositionupdate',
  'compositionend',
  'cuechange',
  'click',
  'close',
  'contextmenu',
  'curechange',
  'dblclick',
  'drag',
  'dragend',
  'dragenter',
  'dragexit',
  'dragleave',
  'dragover',
  'drop',
  'durationchange',
  'emptied',
  'ended',
  'error',
  'focus',
  'focusin',
  'focusout',
  'gotpointercapture',
  'input',
  'invalid',
  'keydown',
  'keypress',
  'keyup',
  'load',
  'loadstart',
  'loadeddata',
  'loadedmetadata',
  'lostpointercapture',
  'mousedown',
  'mouseenter',
  'mouseleave',
  'mousemove',
  'mouseout',
  'mouseover',
  'mouseup',
  'mousewheel',
  'orientationchange',
  'pause',
  'play',
  'playing',
  'pointercancel',
  'pointerdown',
  'pointerenter',
  'pointerleave',
  'pointerlockchange',
  'mozpointerlockchange',
  'webkitpointerlockerchange',
  'pointerlockerror',
  'mozpointerlockerror',
  'webkitpointerlockerror',
  'pointermove',
  'pointout',
  'pointerover',
  'pointerup',
  'progress',
  'ratechange',
  'reset',
  'resize',
  'scroll',
  'seeked',
  'seeking',
  'select',
  'selectionchange',
  'selectstart',
  'show',
  'sort',
  'stalled',
  'submit',
  'suspend',
  'timeupdate',
  'volumechange',
  'touchcancel',
  'touchmove',
  'touchstart',
  'touchend',
  'transitioncancel',
  'transitionend',
  'waiting',
  'wheel'
];
const documentEventNames = [
  'afterscriptexecute', 'beforescriptexecute', 'DOMContentLoaded', 'fullscreenchange',
  'mozfullscreenchange', 'webkitfullscreenchange', 'msfullscreenchange', 'fullscreenerror',
  'mozfullscreenerror', 'webkitfullscreenerror', 'msfullscreenerror', 'readystatechange',
  'visibilitychange'
];
const windowEventNames = [
  'absolutedeviceorientation',
  'afterinput',
  'afterprint',
  'appinstalled',
  'beforeinstallprompt',
  'beforeprint',
  'beforeunload',
  'devicelight',
  'devicemotion',
  'deviceorientation',
  'deviceorientationabsolute',
  'deviceproximity',
  'hashchange',
  'languagechange',
  'message',
  'mozbeforepaint',
  'offline',
  'online',
  'paint',
  'pageshow',
  'pagehide',
  'popstate',
  'rejectionhandled',
  'storage',
  'unhandledrejection',
  'unload',
  'userproximity',
  'vrdisplyconnected',
  'vrdisplaydisconnected',
  'vrdisplaypresentchange'
];
const htmlElementEventNames = [
  'beforecopy', 'beforecut', 'beforepaste', 'copy', 'cut', 'paste', 'dragstart', 'loadend',
  'animationstart', 'search', 'transitionrun', 'transitionstart', 'webkitanimationend',
  'webkitanimationiteration', 'webkitanimationstart', 'webkittransitionend'
];
const mediaElementEventNames =
    ['encrypted', 'waitingforkey', 'msneedkey', 'mozinterruptbegin', 'mozinterruptend'];
const ieElementEventNames = [
  'activate',
  'afterupdate',
  'ariarequest',
  'beforeactivate',
  'beforedeactivate',
  'beforeeditfocus',
  'beforeupdate',
  'cellchange',
  'controlselect',
  'dataavailable',
  'datasetchanged',
  'datasetcomplete',
  'errorupdate',
  'filterchange',
  'layoutcomplete',
  'losecapture',
  'move',
  'moveend',
  'movestart',
  'propertychange',
  'resizeend',
  'resizestart',
  'rowenter',
  'rowexit',
  'rowsdelete',
  'rowsinserted',
  'command',
  'compassneedscalibration',
  'deactivate',
  'help',
  'mscontentzoom',
  'msmanipulationstatechanged',
  'msgesturechange',
  'msgesturedoubletap',
  'msgestureend',
  'msgesturehold',
  'msgesturestart',
  'msgesturetap',
  'msgotpointercapture',
  'msinertiastart',
  'mslostpointercapture',
  'mspointercancel',
  'mspointerdown',
  'mspointerenter',
  'mspointerhover',
  'mspointerleave',
  'mspointermove',
  'mspointerout',
  'mspointerover',
  'mspointerup',
  'pointerout',
  'mssitemodejumplistitemremoved',
  'msthumbnailclick',
  'stop',
  'storagecommit'
];
const webglEventNames = ['webglcontextrestored', 'webglcontextlost', 'webglcontextcreationerror'];
const formEventNames = ['autocomplete', 'autocompleteerror'];
const detailEventNames = ['toggle'];
const frameEventNames = ['load'];
const frameSetEventNames = ['blur', 'error', 'focus', 'load', 'resize', 'scroll', 'messageerror'];
const marqueeEventNames = ['bounce', 'finish', 'start'];

const XMLHttpRequestEventNames = [
  'loadstart', 'progress', 'abort', 'error', 'load', 'progress', 'timeout', 'loadend',
  'readystatechange'
];
const IDBIndexEventNames =
    ['upgradeneeded', 'complete', 'abort', 'success', 'error', 'blocked', 'versionchange', 'close'];
const websocketEventNames = ['close', 'error', 'open', 'message'];
const workerEventNames = ['error', 'message'];

export const eventNames = globalEventHandlersEventNames.concat(
    webglEventNames, formEventNames, detailEventNames, documentEventNames, windowEventNames,
    htmlElementEventNames, ieElementEventNames);

export interface IgnoreProperty {
  target: any;
  ignoreProperties: string[];
}

function filterProperties(
    target: any, onProperties: string[], ignoreProperties: IgnoreProperty[]): string[] {
  if (!ignoreProperties) {
    return onProperties;
  }

  const tip: IgnoreProperty[] = ignoreProperties.filter(ip => ip.target === target);
  if (!tip || tip.length === 0) {
    return onProperties;
  }

  const targetIgnoreProperties: string[] = tip[0].ignoreProperties;
  return onProperties.filter(op => targetIgnoreProperties.indexOf(op) === -1);
}

export function patchFilteredProperties(
    target: any, onProperties: string[], ignoreProperties: IgnoreProperty[], prototype?: any) {
  const filteredProperties: string[] = filterProperties(target, onProperties, ignoreProperties);
  patchOnProperties(target, filteredProperties, prototype);
}

export function propertyDescriptorPatch(api: _ZonePrivate, _global: any) {
  if (isNode && !isMix) {
    return;
  }

  const supportsWebSocket = typeof WebSocket !== 'undefined';
  if (canPatchViaPropertyDescriptor()) {
    const ignoreProperties: IgnoreProperty[] = _global.__Zone_ignore_on_properties;
    // for browsers that we can patch the descriptor:  Chrome & Firefox
    if (isBrowser) {
      const internalWindow: any = window;
      // in IE/Edge, onProp not exist in window object, but in WindowPrototype
      // so we need to pass WindowPrototype to check onProp exist or not
      patchFilteredProperties(
          internalWindow, eventNames.concat(['messageerror']), ignoreProperties,
          ObjectGetPrototypeOf(internalWindow));
      patchFilteredProperties(Document.prototype, eventNames, ignoreProperties);

      if (typeof internalWindow['SVGElement'] !== 'undefined') {
        patchFilteredProperties(
            internalWindow['SVGElement'].prototype, eventNames, ignoreProperties);
      }
      patchFilteredProperties(Element.prototype, eventNames, ignoreProperties);
      patchFilteredProperties(HTMLElement.prototype, eventNames, ignoreProperties);
      patchFilteredProperties(HTMLMediaElement.prototype, mediaElementEventNames, ignoreProperties);
      patchFilteredProperties(
          HTMLFrameSetElement.prototype, windowEventNames.concat(frameSetEventNames),
          ignoreProperties);
      patchFilteredProperties(
          HTMLBodyElement.prototype, windowEventNames.concat(frameSetEventNames), ignoreProperties);
      patchFilteredProperties(HTMLFrameElement.prototype, frameEventNames, ignoreProperties);
      patchFilteredProperties(HTMLIFrameElement.prototype, frameEventNames, ignoreProperties);

      const HTMLMarqueeElement = internalWindow['HTMLMarqueeElement'];
      if (HTMLMarqueeElement) {
        patchFilteredProperties(HTMLMarqueeElement.prototype, marqueeEventNames, ignoreProperties);
      }
      const Worker = internalWindow['Worker'];
      if (Worker) {
        patchFilteredProperties(Worker.prototype, workerEventNames, ignoreProperties);
      }
    }
    patchFilteredProperties(XMLHttpRequest.prototype, XMLHttpRequestEventNames, ignoreProperties);
    const XMLHttpRequestEventTarget = _global['XMLHttpRequestEventTarget'];
    if (XMLHttpRequestEventTarget) {
      patchFilteredProperties(
          XMLHttpRequestEventTarget && XMLHttpRequestEventTarget.prototype,
          XMLHttpRequestEventNames, ignoreProperties);
    }
    if (typeof IDBIndex !== 'undefined') {
      patchFilteredProperties(IDBIndex.prototype, IDBIndexEventNames, ignoreProperties);
      patchFilteredProperties(IDBRequest.prototype, IDBIndexEventNames, ignoreProperties);
      patchFilteredProperties(IDBOpenDBRequest.prototype, IDBIndexEventNames, ignoreProperties);
      patchFilteredProperties(IDBDatabase.prototype, IDBIndexEventNames, ignoreProperties);
      patchFilteredProperties(IDBTransaction.prototype, IDBIndexEventNames, ignoreProperties);
      patchFilteredProperties(IDBCursor.prototype, IDBIndexEventNames, ignoreProperties);
    }
    if (supportsWebSocket) {
      patchFilteredProperties(WebSocket.prototype, websocketEventNames, ignoreProperties);
    }
  } else {
    // Safari, Android browsers (Jelly Bean)
    patchViaCapturingAllTheEvents();
    patchClass('XMLHttpRequest');
    if (supportsWebSocket) {
      webSocketPatch.apply(api, _global);
    }
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
    req.onreadystatechange = null;
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
