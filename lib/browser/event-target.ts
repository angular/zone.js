/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  globalSources,
  patchEventPrototype,
  patchEventTarget,
  zoneSymbolEventNames
} from '../common/events';
import {FALSE_STR, isIEOrEdge, TRUE_STR, ZONE_SYMBOL_PREFIX} from '../common/utils';

import {eventNames} from './property-descriptor';

export function eventTargetPatch(_global: any, api: _ZonePrivate) {
  const WTF_ISSUE_555 =
    'Anchor,Area,Audio,BR,Base,BaseFont,Body,Button,Canvas,Content,DList,Directory,Div,Embed,FieldSet,Font,Form,Frame,FrameSet,HR,Head,Heading,Html,IFrame,Image,Input,Keygen,LI,Label,Legend,Link,Map,Marquee,Media,Menu,Meta,Meter,Mod,OList,Object,OptGroup,Option,Output,Paragraph,Pre,Progress,Quote,Script,Select,Source,Span,Style,TableCaption,TableCell,TableCol,Table,TableRow,TableSection,TextArea,Title,Track,UList,Unknown,Video';
  const NO_EVENT_TARGET = 'ApplicationCache,EventSource,FileReader,InputMethodContext,MediaController,MessagePort,Node,Performance,SVGElementInstance,SharedWorker,TextTrack,TextTrackCue,TextTrackList,WebKitNamedFlow,Window,Worker,WorkerGlobalScope,XMLHttpRequest,XMLHttpRequestEventTarget,XMLHttpRequestUpload,IDBRequest,IDBOpenDBRequest,IDBDatabase,IDBTransaction,IDBCursor,DBIndex,WebSocket'.split(
    ','
  );
  const EVENT_TARGET = 'EventTarget';

  let apis = [];
  const isWtf = _global['wtf'];
  const WTF_ISSUE_555_ARRAY = WTF_ISSUE_555.split(',');

  if (isWtf) {
    // Workaround for: https://github.com/google/tracing-framework/issues/555
    apis = WTF_ISSUE_555_ARRAY.map(v => 'HTML' + v + 'Element').concat(NO_EVENT_TARGET);
  } else if (_global[EVENT_TARGET]) {
    apis.push(EVENT_TARGET);
  } else {
    // Note: EventTarget is not available in all browsers,
    // if it's not available, we instead patch the APIs in the IDL that inherit from EventTarget
    apis = NO_EVENT_TARGET;
  }

  const isDisableIECheck = _global['__Zone_disable_IE_check'] || false;
  const isEnableCrossContextCheck = _global['__Zone_enable_cross_context_check'] || false;
  const ieOrEdge = isIEOrEdge();

  const ADD_EVENT_LISTENER_SOURCE = '.addEventListener:';
  const FUNCTION_WRAPPER = '[object FunctionWrapper]';
  const BROWSER_TOOLS = 'function __BROWSERTOOLS_CONSOLE_SAFEFUNC() { [native code] }';

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

  //  predefine all task.source string
  for (let i = 0; i < WTF_ISSUE_555.length; i++) {
    const target: any = WTF_ISSUE_555_ARRAY[i];
    const targets: any = (globalSources[target] = {});
    for (let j = 0; j < eventNames.length; j++) {
      const eventName = eventNames[j];
      targets[eventName] = target + ADD_EVENT_LISTENER_SOURCE + eventName;
    }
  }

  const checkIEAndCrossContext = function(
    nativeDelegate: any,
    delegate: any,
    target: any,
    args: any
  ) {
    if (!isDisableIECheck && ieOrEdge) {
      if (isEnableCrossContextCheck) {
        try {
          const testString = delegate.toString();
          if (testString === FUNCTION_WRAPPER || testString == BROWSER_TOOLS) {
            nativeDelegate.apply(target, args);
            return false;
          }
        } catch (error) {
          nativeDelegate.apply(target, args);
          return false;
        }
      } else {
        const testString = delegate.toString();
        if (testString === FUNCTION_WRAPPER || testString == BROWSER_TOOLS) {
          nativeDelegate.apply(target, args);
          return false;
        }
      }
    } else if (isEnableCrossContextCheck) {
      try {
        delegate.toString();
      } catch (error) {
        nativeDelegate.apply(target, args);
        return false;
      }
    }
    return true;
  };

  const apiTypes: any[] = [];
  for (let i = 0; i < apis.length; i++) {
    const type = _global[apis[i]];
    apiTypes.push(type && type.prototype);
  }
  // vh is validateHandler to check event handler
  // is valid or not(for security check)
  patchEventTarget(_global, apiTypes, {vh: checkIEAndCrossContext});
  api.patchEventTarget = patchEventTarget;

  return true;
}

export function patchEvent(global: any, api: _ZonePrivate) {
  patchEventPrototype(global, api);
}
