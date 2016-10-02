'use strict';

var log = [];
var logArgs = [];
var wtfMock = {
  log: log,
  logArgs: logArgs,
  reset: function () {
    log.length = 0;
    logArgs.length = 0;
  },
  trace: {
    leaveScope: function(scope, returnValue) {
      return scope(returnValue);
    },
    beginTimeRange: function(type, action) {
      logArgs.push([]);
      log.push('>>> ' + type + '[' + action + ']');
      return function() {
        logArgs.push([]);
        log.push('<<< ' + type);
      };
    },
    endTimeRange: function(range) {
      range();
    },
    events: {
      createScope: function(signature, flags) {
        var parts = signature.split('(');
        var name = parts[0];
        return function scopeFn() {
          var args = [];
          for(var i = arguments.length - 1; i >= 0; i--) {
            var arg = arguments[i];
            if (arg !== undefined) {
              args.unshift(__stringify(arg));
            }
          }
          log.push('> ' + name + '(' + args.join(', ') + ')');
          logArgs.push(args);
          return function (retValue) {
            log.push('< ' + name + (retValue == undefined ? '' : ' => ' + retValue));
            logArgs.push(retValue);
            return retValue;
          };
        };
      },
      createInstance: function(signature, flags) {
        var parts = signature.split('(');
        var name = parts[0];
        return function eventFn() {
          var args = [];
          for(var i = arguments.length - 1; i >= 0; i--) {
            var arg = arguments[i];
            if (arg !== undefined) {
              args.unshift(__stringify(arg));
            }
          }
          log.push('# ' + name + '(' + args.join(', ') + ')');
          logArgs.push(args);
        };
      }
    }
  }
};

function __stringify(obj) {
  var str = typeof obj == 'string'  || !obj ? JSON.stringify(obj) : obj.toString();
  if (str == "[object Arguments]") {
    str =  JSON.stringify(Array.prototype.slice.call(obj));
  } else if (str == "[object Object]") {
    str = JSON.stringify(obj);
  }
  return str;
}

beforeEach(function() {
  wtfMock.reset();
});

(<any>global).wtfMock = wtfMock;
(<any>global).wtf = wtfMock;