[
  'setTimeout'
].
forEach(zonifyGlobal);

window.zone = new Zone();

// http://www.quirksmode.org/js/events_order.html
document.addEventListener('click', function (ev) {
  var target = ev.target;

  while (target) {
    if (target.onclick && !target.onclick.__patched) {
      var fn = target.onclick;
      target.onclick = wrapAsync(fn);
      target.onclick.__patched = true;
    }
    target = target.parentElement;
  }
}, true);

var addListener = Node.prototype.addEventListener;
Node.prototype.addEventListener = function (eventName, fn) {
  arguments[1] = wrapAsync(fn);
  return addListener.apply(this, arguments);
};



function Zone (locals) {}
Zone.prototype.createChild = function (locals) {
  var Child = function () {};
  Child.prototype = this;

  var child = new Child();
  for (localName in locals) {
    child[localName] = locals[localName];
  }
  child.parent = this;

  return child;
};

Zone.prototype.run = function (fn) {
  wrapAsync(fn, this)();
};

function zonifyGlobal (name) {
  window[name] = zonifyFirstArgument(window[name]);
}

function zonifyFirstArgument (fn) {
  return function () {
    arguments[0] = wrapAsync(arguments[0]);
    return fn.apply(this, arguments);
  };
}

function wrapAsync (fn, newZone) {
  var myZone = newZone || window.zone.createChild();
  return function () {
    var oldZone = window.zone;
    window.zone = myZone;

    var returnValue = fn.apply(this, arguments);
    window.zone = oldZone;
    return returnValue;
  };
}

function stack () {
  try {0()} catch (e) {
    var stack = e.stack;
    return stack.substr(stack.indexOf('\n')+1);
  }
}
