import * as utils from '../utils';
import * as wtf from '../wtf';

export function patchSetClearFunction(window, Zone, fnNames) {
  function patchMacroTaskMethod(setName, clearName, repeating, isRaf) {
    var setNative = window[setName];
    var clearNative = window[clearName];
    var ids = {};

    if (setNative) {
      var wtfSetEventFn = wtf.createEvent('Zone#' + setName + '(uint32 zone, uint32 id, uint32 delay)');
      var wtfClearEventFn = wtf.createEvent('Zone#' + clearName + '(uint32 zone, uint32 id)');
      var wtfCallbackFn = wtf.createScope('Zone#cb:' + setName + '(uint32 zone, uint32 id, uint32 delay)');

      // Forward all calls from the window through the zone.
      window[setName] = function () {
        return global.zone[setName].apply(global.zone, arguments);
      };
      window[clearName] = function () {
        return global.zone[clearName].apply(global.zone, arguments);
      };


      // Set up zone processing for the set function.
      Zone.prototype[setName] = function (fn, delay) {
        // We need to save `fn` in var different then argument. This is because
        // in IE9 `argument[0]` and `fn` have same identity, and assigning to
        // `argument[0]` changes `fn`.
        var callbackFn = fn;
        if (typeof callbackFn !== 'function') {
          // force the error by calling the method with wrong args
          setNative.apply(window, arguments);
        }
        var zone = this;
        var setId = null;
        // wrap the callback function into the zone.
        arguments[0] = function() {
          var callbackZone = zone.isRootZone() || isRaf ? zone : zone.fork();
          var callbackThis = this;
          var callbackArgs = arguments;
          return wtf.leaveScope(
              wtfCallbackFn(callbackZone.$id, setId, delay),
              callbackZone.run(function() {
                if (!repeating) {
                  delete ids[setId];
                  callbackZone.removeTask(callbackFn);
                }
                return callbackFn.apply(callbackThis, callbackArgs);
              })
          );
        };
        if (repeating) {
          zone.addRepeatingTask(callbackFn);
        } else {
          zone.addTask(callbackFn);
        }
        setId = setNative.apply(window, arguments);
        ids[setId] = callbackFn;
        wtfSetEventFn(zone.$id, setId, delay);
        return setId;
      };

      Zone.prototype[setName + 'Unpatched'] = function() {
        return setNative.apply(window, arguments);
      };

      // Set up zone processing for the clear function.
      Zone.prototype[clearName] = function (id) {
        wtfClearEventFn(this.$id, id);
        if (ids.hasOwnProperty(id)) {
          var callbackFn = ids[id];
          delete ids[id];
          if (repeating) {
            this.removeRepeatingTask(callbackFn);
          } else {
            this.removeTask(callbackFn);
          }
        }
        return clearNative.apply(window, arguments);
      };

      Zone.prototype[clearName + 'Unpatched'] = function() {
        return clearNative.apply(window, arguments);
      };

    }
  }
  fnNames.forEach(function(args) {
    patchMacroTaskMethod.apply(null, args);
  });
};

export function patchFunction(obj, fnNames) {
  fnNames.forEach(function (name) {
    var delegate = obj[name];
    global.zone[name] = function () {
      return delegate.apply(obj, arguments);
    };

    obj[name] = function () {
      return global.zone[name].apply(this, arguments);
    };
  });
};
