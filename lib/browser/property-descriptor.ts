/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {isBrowser, isMix, isNode, patchClass, patchOnProperties, zoneSymbol} from '../common/utils';

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
  'transitioncancel',
  'transitionend',
  'waiting',
  'wheel'
];
const documentEventNames = [
  'afterscriptexecute', 'beforescriptexecute', 'DOMContentLoaded', 'fullscreenchange',
  'mozfullscreenchange', 'webkitfullscreenchange', 'msfullscreenchange', 'fullscreenerror',
  'mozfullscreenerror', 'webkitfullscreenerror', 'msfullscreenerror', 'readystatechange'
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
const frameSetEventNames = ['blur', 'error', 'focus', 'load', 'resize', 'scroll'];
const marqueeEventNames = ['bounce', 'finish', 'start'];

const XMLHttpRequestEventNames = [
  'loadstart', 'progress', 'abort', 'error', 'load', 'progress', 'timeout', 'loadend',
  'readystatechange'
];
const IDBIndexEventNames =
    ['upgradeneeded', 'complete', 'abort', 'success', 'error', 'blocked', 'versionchange', 'close'];
const websocketEventNames = ['close', 'error', 'open', 'message'];

export const eventNames = globalEventHandlersEventNames.concat(
    webglEventNames, formEventNames, detailEventNames, documentEventNames, windowEventNames,
    htmlElementEventNames, ieElementEventNames);

export function propertyDescriptorPatch(_global: any) {
  if (isNode && !isMix) {
    return;
  }

  const supportsWebSocket = typeof WebSocket !== 'undefined';
  if (canPatchViaPropertyDescriptor()) {
    // for browsers that we can patch the descriptor:  Chrome & Firefox
    if (isBrowser) {
      // in IE/Edge, onProp not exist in window object, but in WindowPrototype
      // so we need to pass WindowPrototype to check onProp exist or not
      patchOnProperties(window, eventNames, Object.getPrototypeOf(window));
      patchOnProperties(Document.prototype, eventNames);

      if (typeof(<any>window)['SVGElement'] !== 'undefined') {
        patchOnProperties((<any>window)['SVGElement'].prototype, eventNames);
      }
      patchOnProperties(Element.prototype, eventNames);
      patchOnProperties(HTMLElement.prototype, eventNames);
      patchOnProperties(HTMLMediaElement.prototype, mediaElementEventNames);
      patchOnProperties(HTMLFrameSetElement.prototype, windowEventNames.concat(frameSetEventNames));
      patchOnProperties(HTMLBodyElement.prototype, windowEventNames.concat(frameSetEventNames));
      patchOnProperties(HTMLFrameElement.prototype, frameEventNames);
      patchOnProperties(HTMLIFrameElement.prototype, frameEventNames);

      const HTMLMarqueeElement = (window as any)['HTMLMarqueeElement'];
      if (HTMLMarqueeElement) {
        patchOnProperties(HTMLMarqueeElement.prototype, marqueeEventNames);
      }
    }
    patchOnProperties(XMLHttpRequest.prototype, XMLHttpRequestEventNames);
    const XMLHttpRequestEventTarget = _global['XMLHttpRequestEventTarget'];
    if (XMLHttpRequestEventTarget) {
      patchOnProperties(
          XMLHttpRequestEventTarget && XMLHttpRequestEventTarget.prototype,
          XMLHttpRequestEventNames);
    }
    if (typeof IDBIndex !== 'undefined') {
      patchOnProperties(IDBIndex.prototype, IDBIndexEventNames);
      patchOnProperties(IDBRequest.prototype, IDBIndexEventNames);
      patchOnProperties(IDBOpenDBRequest.prototype, IDBIndexEventNames);
      patchOnProperties(IDBDatabase.prototype, IDBIndexEventNames);
      patchOnProperties(IDBTransaction.prototype, IDBIndexEventNames);
      patchOnProperties(IDBCursor.prototype, IDBIndexEventNames);
    }
    if (supportsWebSocket) {
      patchOnProperties(WebSocket.prototype, websocketEventNames);
    }
  } else {
    // Safari, Android browsers (Jelly Bean)
    patchViaCapturingAllTheEvents();
    patchClass('XMLHttpRequest');
    if (supportsWebSocket) {
      webSocketPatch.apply(_global);
    }
  }
}

function canPatchViaPropertyDescriptor() {
  if ((isBrowser || isMix) && !Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'onclick') &&
      typeof Element !== 'undefined') {
    // WebKit https://bugs.webkit.org/show_bug.cgi?id=134364
    // IDL interface attributes are not configurable
    const desc = Object.getOwnPropertyDescriptor(Element.prototype, 'onclick');
    if (desc && !desc.configurable) return false;
  }

  const xhrDesc = Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, 'onreadystatechange');

  // add enumerable and configurable here because in opera
  // by default XMLHttpRequest.prototype.onreadystatechange is undefined
  // without adding enumerable and configurable will cause onreadystatechange
  // non-configurable
  // and if XMLHttpRequest.prototype.onreadystatechange is undefined,
  // we should set a real desc instead a fake one
  if (xhrDesc) {
    Object.defineProperty(XMLHttpRequest.prototype, 'onreadystatechange', {
      enumerable: true,
      configurable: true,
      get: function() {
        return true;
      }
    });
    const req = new XMLHttpRequest();
    const result = !!req.onreadystatechange;
    // restore original desc
    Object.defineProperty(XMLHttpRequest.prototype, 'onreadystatechange', xhrDesc || {});
    return result;
  } else {
    Object.defineProperty(XMLHttpRequest.prototype, 'onreadystatechange', {
      enumerable: true,
      configurable: true,
      get: function() {
        return this[zoneSymbol('fakeonreadystatechange')];
      },
      set: function(value) {
        this[zoneSymbol('fakeonreadystatechange')] = value;
      }
    });
    const req = new XMLHttpRequest();
    const detectFunc = () => {};
    req.onreadystatechange = detectFunc;
    const result = (req as any)[zoneSymbol('fakeonreadystatechange')] === detectFunc;
    req.onreadystatechange = null;
    return result;
  }
};

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
          bound = Zone.current.wrap(elt[onproperty], source);
          bound[unboundKey] = elt[onproperty];
          elt[onproperty] = bound;
        }
        elt = elt.parentElement;
      }
    }, true);
  }
}
