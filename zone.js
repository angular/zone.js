
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

    try {
      0()
    } catch (e) {
      e.stack = e.stack.
                  split('\n').
                  slice(3).
                  join('\n');
      child.constructedAtExecption = e;
    }
    child.constructedAtTime = Date.now();

    return child;
  },

  getLongStacktrace: function(exception) {
    var trace = [exception.stack];
    var zone = this;
    var now = Date.now();
    while (zone && zone.constructedAtExecption) {
      trace.push('--- ' + (now - zone.constructedAtTime) + 'ms ago', zone.constructedAtExecption.stack);
      zone = zone.parent;
    }
    return trace.join('\n');
  },

  exceptionHandler: function(exception) {
    console.log(exception.toString());
    console.log(this.getLongStacktrace(exception));
  },

  run: function (fn) {
    this.apply(fn);
  },

  bind: function(fn) {
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

Zone.patchFn = function(obj) {
  var i, ii, name, delegate;
  for(i = 1, ii = arguments.length; i < ii; i++) {
    name = arguments[i];
    delegate = obj[name];
    zone[name] = function() {
      return zone.bind(delegate);
    };
    obj[name] = function() {
      return zone[name].apply(this, arguments);
    };
  }
};

Zone.patchProperty = function (obj, prop) {
  var desc = Object.getOwnPropertyDescriptor(obj, prop);

  // substr(2) cuz 'onclick' -> 'click', etc
  var eventName = prop.substr(2);

  desc.set = function (fn) {
    this.addEventListener(eventName, window.zone.bind(fn), false);
    this['_' + prop + 'Original'] = fn;
  };

  desc.get = function () {
    return this['_' + prop + 'Original'];
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
    arguments[1] = zone.bind(fn);
    arguments[1]._original = fn;
    return addDelegate.apply(this, arguments);
  };

  var removeDelegate = obj.removeEventListener;
  obj.removeEventListener = function (eventName, fn) {
    arguments[1] = arguments[1]._original || arguments[1];
    return removeDelegate.apply(this, arguments);
  }
};
