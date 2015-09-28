var EventEmitter = require('events');
var utils = require('../../utils');
var keys = require('../../keys');

function apply () {
  utils.patchAddListenerFns(EventEmitter.prototype, [
    'addListener',
    'on',
    'once'
  ], { skipEnqueue: true });

  var removeListenerDelegate = EventEmitter.prototype.removeListener;
  EventEmitter.prototype.removeListener = function(eventName, fn) {
    var map = this[keys.common.bindingMap];
    var boundFns = map.get(eventName);

    if (boundFns && boundFns.length) {
      arguments[1] = boundFns[0];
      removeListenerDelegate.apply(this, arguments);

      map.removeFirst(eventName);
    } else if (fn) {
      // in some places in the node standard library
      // .removeListener is called before any such listener has been added.
      // in this case, we simply forward to the delegate
      removeListenerDelegate.apply(this, arguments);
    }

    return this;
  }

  var removeAllListenersDelegate = EventEmitter.prototype.removeAllListeners;
  EventEmitter.prototype.removeAllListeners = function(eventName) {
    var map = this[keys.common.bindingMap];

    if (typeof eventName !== 'undefined') {
      map.remove(eventName);
    } else {
      map.removeAll();
    }

    removeAllListenersDelegate.apply(this, arguments);

    return this;
  }

  EventEmitter.prototype.listeners = function(eventName) {
    var map = this[keys.common.bindingMap];

    return map && map.getUnbounds(eventName);
  }
}

module.exports = {
  apply: apply
};