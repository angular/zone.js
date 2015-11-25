'use strict';

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

if (wtfEnabled) {
  module.exports = {
    enabled: true,
    createScope: function (signature, flags) {
      return wtfEvents.createScope(signature, flags);
    },
    createEvent: function (signature, flags) {
      return wtfEvents.createInstance(signature, flags);
    },
    leaveScope: function (scope, returnValue) {
      wtfTrace.leaveScope(scope, returnValue);
      return returnValue;
    },
    beginTimeRange:function (rangeType, action) {
      return wtfTrace.beginTimeRange(rangeType, action);
    },
    endTimeRange: function (range) {
      wtfTrace.endTimeRange(range);
    }
  };
} else {
  module.exports = {
    enabled: false,
    createScope: function (s, f) { return noop; },
    createEvent: function (s, f) { return noop; },
    leaveScope: function (s, v) { return v; },
    beginTimeRange: function (t, a) { return null; },
    endTimeRange: function (r) { }
  };
}

