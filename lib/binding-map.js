// The purpose of this class is to maintain linkage between arbitrary names 
// (e.g. event names) and a corresponding list of bound and unbound fns. There is a need for this linkage
// to implement certain functionality e.g. event listeners seamlessly.

function BindingMap() {
  // map of names -> bound fns
  this._map = {};

  // map of names -> unbound fns
  this._unboundMap = {};
}

BindingMap.prototype.get = function (name) {
  return this._map[name] || [];
};

BindingMap.prototype.getUnbounds = function (name) {
  return this._unboundMap[name] || [];
};

BindingMap.prototype.getAll = function () {
  var fns = [];

  for (var name in this._map) {
    fns.concat(this._map[name]);
  }

  return fns;
}

BindingMap.prototype.getAllUnbounds = function () {
  var fns = [];

  for (var name in this._unboundMap) {
    fns.concat(this._unboundMap[name]);
  }

  return fns;
}

BindingMap.prototype.add = function (name, fn, boundFn) {
  this._map[name] = this._map[name] || [];
  this._unboundMap[name] = this._unboundMap[name] || [];

  this._map[name].push(boundFn);
  this._unboundMap[name].push(fn);
};

BindingMap.prototype.remove = function (name) {
  this._map[name] = [];
  this._unboundMap = [];
}

BindingMap.prototype.removeFirst = function (name) {
  if (this._map[name]) {
    this._map[name].shift();
    this._unboundMap[name].shift();
  }
}

BindingMap.prototype.removeAll = function () {
  this._map = {};
  this._unboundMap = {};
}

module.exports = BindingMap;