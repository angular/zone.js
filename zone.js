'use strict';


function Zone(parentZone, data) {
  var zone = (arguments.length) ? Object.create(parentZone) : this;

  zone.parent = parentZone;

  Object.keys(data || {}).forEach(function(property) {

    var _property = property.substr(1);

    // augment the new zone with a hook decorates the parent's hook
    if (property[0] === '$') {
      zone[_property] = data[property](parentZone[_property] || function () {});

    // augment the new zone with a hook that runs after the parent's hook
    } else if (property[0] === '+') {
      if (parentZone[_property]) {
        zone[_property] = function () {
          var result = parentZone[_property].apply(this, arguments);
          data[property].apply(this, arguments);
          return result;
        };
      } else {
        zone[_property] = data[property];
      }

    // augment the new zone with a hook that runs before the parent's hook
    } else if (property[0] === '-') {
      if (parentZone[_property]) {
        zone[_property] = function () {
          data[property].apply(this, arguments);
          return parentZone[_property].apply(this, arguments);
        };
      } else {
        zone[_property] = data[property];
      }

    // set the new zone's hook (replacing the parent zone's)
    } else {
      zone[property] = data[property];
    }
  });

  return zone;
}


Zone.prototype = {
  constructor: Zone,

  fork: function (locals) {
    this.onZoneCreated();
    return new Zone(this, locals);
  },

  bind: function (fn) {
    var zone = this.fork();
    return function zoneBoundFn() {
      return zone.run(fn, this, arguments);
    };
  },

  run: function run (fn, applyTo, applyWith) {
    applyWith = applyWith || [];

    var oldZone = window.zone,
        result;

    window.zone = this;

    try {
      this.onZoneEnter();
      result = fn.apply(applyTo, applyWith);
    } catch (e) {
      if (zone.onError) {
        zone.onError(e);
      } else {
        throw e;
      }
    } finally {
      this.onZoneLeave();
      window.zone = oldZone;
    }
    return result;
  },

  onZoneEnter: function () {},
  onZoneCreated: function () {},
  onZoneLeave: function () {}
};

Zone.patchFn = function (obj, fnNames) {
  fnNames.forEach(function (name) {
    var delegate = obj[name];
    if (delegate) {
      zone[name] = function () {
        return delegate.apply(obj, Zone.bindArguments(arguments));
      };

      obj[name] = function marker () {
        return zone[name].apply(this, arguments);
      };
    }
  });
};

Zone.patchPrototype = function (obj, fnNames) {
  fnNames.forEach(function (name) {
    var delegate = obj[name];
    if (delegate) {
      obj[name] = function () {
        return delegate.apply(this, Zone.bindArguments(arguments));
      };
    }
  });
};

Zone.bindArguments = function (args) {
  for (var i = args.length - 1; i >= 0; i--) {
    if (typeof args[i] === 'function') {
      args[i] = zone.bind(args[i]);
    }
  }
  return args;
}

Zone.patchableFn = function (obj, fnNames) {
  fnNames.forEach(function (name) {
    var delegate = obj[name];
    zone[name] = function () {
      return delegate.apply(obj, arguments);
    };

    obj[name] = function () {
      return zone[name].apply(this, arguments);
    };
  });
}

Zone.patchProperty = function (obj, prop) {
  var desc = Object.getOwnPropertyDescriptor(obj, prop) || {
    enumerable: true,
    configurable: true
  };

  // A property descriptor cannot have getter/setter and be writable
  // deleting the writable and value properties avoids this error:
  //
  // TypeError: property descriptors must not specify a value or be writable when a
  // getter or setter has been specified
  delete desc.writable;
  delete desc.value;

  // substr(2) cuz 'onclick' -> 'click', etc
  var eventName = prop.substr(2);
  var _prop = '_' + prop;

  desc.set = function (fn) {
    if (this[_prop]) {
      this.removeEventListener(eventName, this[_prop]);
    }


    if (typeof fn === 'function') {
      this[_prop] = fn;
      this.addEventListener(eventName, fn, false);
    } else {
      this[_prop] = null;
    }
  };

  desc.get = function () {
    return this[_prop];
  };

  Object.defineProperty(obj, prop, desc);
};

Zone.patchProperties = function (obj) {
  Object.keys(obj).
    filter(function (propertyName) {
      return propertyName.substr(0,2) === 'on';
    }).
    forEach(function (eventName) {
      Zone.patchProperty(obj, eventName);
    });
};

Zone.patchEventTargetMethods = function (obj) {
  var addDelegate = obj.addEventListener;
  obj.addEventListener = function (eventName, fn) {
    arguments[1] = fn._bound = zone.bind(fn);
    return addDelegate.apply(this, arguments);
  };

  var removeDelegate = obj.removeEventListener;
  obj.removeEventListener = function (eventName, fn) {
    arguments[1] = arguments[1]._bound || arguments[1];
    return removeDelegate.apply(this, arguments);
  };
};

Zone.patch = function patch () {
  Zone.patchFn(window, [
    'setTimeout',
    'setInterval',
    'requestAnimationFrame',
    'webkitRequestAnimationFrame'
  ]);
  Zone.patchableFn(window, ['alert', 'prompt']);

  // patched properties depend on addEventListener, so this needs to come first
  if (EventTarget) {
    Zone.patchEventTargetMethods(EventTarget.prototype);

  // Note: EventTarget is not available in all browsers,
  // if it's not available, we instead patch the APIs in the IDL that inherit from EventTarget
  } else {
    [ ApplicationCache.prototype,
      EventSource.prototype,
      FileReader.prototype,
      InputMethodContext.prototype,
      MediaController.prototype,
      MessagePort.prototype,
      Node.prototype,
      Performance.prototype,
      SVGElementInstance.prototype,
      SharedWorker.prototype,
      TextTrack.prototype,
      TextTrackCue.prototype,
      TextTrackList.prototype,
      WebKitNamedFlow.prototype,
      Window.prototype,
      Worker.prototype,
      WorkerGlobalScope.prototype,
      XMLHttpRequestEventTarget.prototype,
      XMLHttpRequestUpload.prototype
    ].forEach(patchEventTargetMethods);
  }

  Zone.patchProperties(HTMLElement.prototype);
  Zone.patchProperties(XMLHttpRequest.prototype);

  // patch promises
  if (window.Promise) {
    Zone.patchPrototype(Promise.prototype, [
      'then',
      'catch'
    ]);
  }
};

Zone.init = function init () {
  window.zone = new Zone();
  Zone.patch();
};


Zone.init();
