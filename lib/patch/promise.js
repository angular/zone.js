'use strict';

var utils = require('../utils');

/*
 * patch a fn that returns a promise
 */
var bindPromiseFn = (function() {
  // if the browser natively supports Promises, we can just return a native promise
  if (global.Promise) {
    return function (delegate) {
      return function() {
        var delegatePromise = delegate.apply(this, arguments);
        if (delegatePromise instanceof Promise) {
          return delegatePromise;
        } else {
          return new Promise(function(resolve, reject) {
            delegatePromise.then(resolve, reject);
          });
        }
      };
    };
  } else {
    // if the browser does not have native promises, we have to patch each promise instance
    return function (delegate) {
      return function () {
        return patchThenable(delegate.apply(this, arguments));
      };
    };
  }

  function patchThenable(thenable) {
    var then = thenable.then;
    thenable.then = function () {
      var args = utils.bindArguments(arguments);
      var nextThenable = then.apply(thenable, args);
      return patchThenable(nextThenable);
    };

    var ocatch = thenable.catch;
    thenable.catch = function () {
      var args = utils.bindArguments(arguments);
      var nextThenable = ocatch.apply(thenable, args);
      return patchThenable(nextThenable);
    };
    return thenable;
  }
}());

function apply() {
  if (global.Promise) {
    utils.patchPrototype(Promise.prototype, [
      'then',
      'catch'
    ]);
  }
}

module.exports = {
  apply: apply,
  bindPromiseFn: bindPromiseFn
};
