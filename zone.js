
function Zone () {};

Zone.prototype = {
  constructor: Zone,

  createChild: function (locals) {
    var Child = function () {};
    Child.prototype = this;

    var child = new Child();
    for (localName in locals) {
      child[localName] = locals[localName];
    }
    child.parent = this;

    child.constructedAtExecption = Zone.getStacktrace();
    child.constructedAtTime = Date.now();

    return child;
  },

  getLongStacktrace: function (exception) {
    var trace = [exception.stack];
    var zone = this;
    var now = Date.now();
    while (zone && zone.constructedAtExecption) {
      trace.push(
          '--- ' + (Date(zone.constructedAtTime)).toString() +
            ' - ' + (now - zone.constructedAtTime) + 'ms ago',
          zone.constructedAtExecption.get());
      zone = zone.parent;
    }
    return trace.join('\n');
  },

  exceptionHandler: function (exception) {
    console.log(exception.toString());
    console.log(this.getLongStacktrace(exception));
  },

  run: function (fn) {
    this.apply(fn);
  },

  bind: function (fn) {
    var zone = this.createChild();
    return function zoneBoundFn() {
      return zone.apply(fn, this, arguments);
    };
  },

  apply: function apply (fn, applyTo, applyWith) {
    applyTo = applyTo || this;
    applyWith = applyWith || [];

    var oldZone = window.zone,
        result;

    window.zone = this;

    try {
      result = fn.apply(applyTo, applyWith);
    } catch (e) {
      this.exceptionHandler(e);
    } finally {
      window.zone = oldZone;
    }
    return result;
  }
};

Zone.Stacktrace = function (e) {
  this._e = e;
};
Zone.Stacktrace.prototype.get = function () {
  return this._e.stack;
}

Zone.getStacktrace = function () {
  function getStacktraceWithUncaughtError () {
    return new Zone.Stacktrace(new Error());
  }

  function getStacktraceWithCaughtError () {
    try {
      throw new Error();
    } catch (e) {
      return new Zone.Stacktrace(e);
    }
  }

  // Some implementations of exception handling don't create a stack trace if the exception
  // isn't thrown, however it's faster not to actually throw the exception.
  var stack = getStacktraceWithUncaughtError();
  if (stack.get()) {
    Zone.getStacktrace = getStacktraceWithUncaughtError;
    return stack;
  } else {
    Zone.getStacktrace = getStacktraceWithCaughtError;
    return Zone.getStacktrace();
  }
};

Zone.patchFn = function (obj, fnNames) {
  fnNames.forEach(function (name) {
    var delegate = obj[name];
    zone[name] = function () {
      return zone.bind(delegate);
    };
    obj[name] = function () {
      return zone[name].apply(this, arguments);
    };
  });
};

Zone.patchProperty = function (obj, prop) {
  var desc = Object.getOwnPropertyDescriptor(obj, prop) || {
    enumerable: true,
    configurable: true
  };

  // A property descriptor cannot have getter/setter and be writable
  // deleting the writable property avoids this error:
  //
  // TypeError: property descriptors must not specify a value or be writable when a
  // getter or setter has been specified
  delete desc.writable;

  // substr(2) cuz 'onclick' -> 'click', etc
  var eventName = prop.substr(2);
  var _prop = '_' + prop;

  desc.set = function (fn) {
    if (this[_prop]) {
      this.removeEventListener(eventName, this[_prop]);
    }

    this[_prop] = fn;

    this.addEventListener(eventName, fn, false);
  };

  desc.get = function () {
    return this[_prop];
  };

  Object.defineProperty(obj, prop, desc);
};

Zone.patchProperties = function (obj) {
  Object.keys(HTMLElement.prototype).
    filter(function (propertyName) {
      return propertyName.substr(0,2) === 'on';
    }).
    forEach(function (eventName) {
      Zone.patchProperty(obj, eventName);
    });
};

Zone.patchAddEvent = function (obj) {
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
  Zone.patchFn(window, ['setTimeout', 'setInterval']);

  // properties depend on addEventListener, so these need to come first
  Zone.patchAddEvent(Node.prototype);
  Zone.patchAddEvent(XMLHttpRequest.prototype);

  Zone.patchProperties(HTMLElement.prototype);
  Zone.patchProperties(XMLHttpRequest.prototype);
};

Zone.init = function init () {
  window.zone = new Zone();
  Zone.patch();
};

Zone.init();
