'use strict';

// wrap some native API on `window`
function patchClass(className) {
  var OriginalClass = global[className];
  if (!OriginalClass) return;

  global[className] = function (fn) {
    this._o = new OriginalClass(global.zone.bind(fn, true));
    // Remember where the class was instantiate to execute the enqueueTask and dequeueTask hooks
    this._creationZone = global.zone;
  };

  var instance = new OriginalClass(function () {});

  global[className].prototype.disconnect = function () {
    var result = this._o.disconnect.apply(this._o, arguments);
    if (this._active) {
      this._creationZone.dequeueTask();
      this._active = false;
    }
    return result;
  };

  global[className].prototype.observe = function () {
    if (!this._active) {
      this._creationZone.enqueueTask();
      this._active = true;
    }
    return this._o.observe.apply(this._o, arguments);
  };

  var prop;
  for (prop in instance) {
    (function (prop) {
      if (typeof global[className].prototype !== undefined) {
        return;
      }
      if (typeof instance[prop] === 'function') {
        global[className].prototype[prop] = function () {
          return this._o[prop].apply(this._o, arguments);
        };
      } else {
        Object.defineProperty(global[className].prototype, prop, {
          set: function (fn) {
            if (typeof fn === 'function') {
              this._o[prop] = global.zone.bind(fn);
            } else {
              this._o[prop] = fn;
            }
          },
          get: function () {
            return this._o[prop];
          }
        });
      }
    }(prop));
  }
};

module.exports = {
  patchClass: patchClass
};
