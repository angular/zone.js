// Detect and setup WTF.
var wtfTrace = null;
var wtfEvents = null;
var wtfEnabled = (function () {
  var wtf = global['wtf'];
  if (wtf) {
    wtfTrace = wtf['trace'];
    if (wtfTrace) {
      wtfEvents = wtfTrace['events'];
      return true;
    }
  }
  return false;
})();

function noop() {
}

export interface WtfScopeFn {
  (...args): any;
}

export interface WtfEventFn {
  (...args): any;
}

export const enabled:boolean = wtfEnabled;
export const createScope:(signature:string, flags?:any) => WtfScopeFn = wtfEnabled ? function (signature, flags) {
  return wtfEvents.createScope(signature, flags);
} : function (s, f) {
  return noop;
};
export const createEvent: (signature: string, action?: string) => WtfEventFn = wtfEnabled ? function (signature, flags) {
  return wtfEvents.createInstance(signature, flags);
} : function (s, f) {
  return noop;
};
export const leaveScope = wtfEnabled ? function (scope:WtfScopeFn, returnValue:any):any {
  wtfTrace.leaveScope(scope, returnValue);
  return returnValue;
} : function (s, v) {
  return v;
};
export const beginTimeRange = wtfEnabled ? function (rangeType, action) {
  return wtfTrace.beginTimeRange(rangeType, action);
} : function (t, a) {
  return null;
};
export const endTimeRange = wtfEnabled ? function (range) {
  wtfTrace.endTimeRange(range);
} : function (r) {
};
