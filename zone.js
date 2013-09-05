[
  'setTimeout'
].
forEach(zonifyGlobal);

window.zone = new Zone();



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
  zonifyFunction(fn, this)();
};


function zonifyGlobal (name) {
  window[name] = zonifyFirstArgument(window[name]);
}

function zonifyFirstArgument (fn) {
  return function () {
    arguments[0] = zonifyFunction(arguments[0]);
    return fn.apply(this, arguments);
  };
}

function zonifyFunction (fn, newZone) {
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
