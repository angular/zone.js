
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
      child.constructedAtExecption = e;
    }

    return child;
  },

  getLongStacktrace: function(exception) {
    var trace = [exception.stack];
    var zone = this;
    while (zone && zone.constructedAtExecption) {
      trace.push('---', zone.constructedAtExecption.stack);
      zone = zone.parent;
    }
    return trace.join('\n');
  },

  exceptionHandler: function(exception) {
    console.log(exception, this.getLongStacktrace(exception));
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
  Object.defineProperty(obj, 'onclick', {
    enumerable: true,
    configurable: true,
    set: function (fn) {
      this.addEventListener('click', window.zone.bind(fn), false);
      this['_' + prop + 'Original'] = fn;
    },
    get: function () {
      return this['_' + prop + 'Original'];
    }
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
