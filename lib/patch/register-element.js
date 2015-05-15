'use strict';

var _redefineProperty = require('./define-property')._redefineProperty;

function apply() {
  if (!('registerElement' in global.document)) {
    return;
  }

  var _registerElement = document.registerElement;
  var callbacks = [
    'createdCallback',
    'attachedCallback',
    'detachedCallback',
    'attributeChangedCallback'
  ];

  document.registerElement = function (name, opts) {
    callbacks.forEach(function (callback) {
      if (opts.prototype.hasOwnProperty(callback)) {
        var descriptor = Object.getOwnPropertyDescriptor(opts.prototype, callback);
        if (descriptor.value) {
          descriptor.value = global.zone.bind(descriptor.value || opts.prototype[callback]);
          _redefineProperty(opts.prototype, callback, descriptor);
        }
      }
    });
    return _registerElement.apply(document, [name, opts]);
  };
}

module.exports = {
  apply: apply
};
