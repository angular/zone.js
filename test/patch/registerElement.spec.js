/*
 * check that document.registerElement(name, { prototype: proto });
 * is properly patched
 */

'use strict';

describe('document.registerElement', function () {
  if (!('registerElement' in document)) {
    console.log('WARNING: skipping document.registerElement test (missing this API)');
    return;
  }

  var flag, hasParent;

  // register a custom element for each callback
  var callbacks = [
    'created',
    'attached',
    'detached',
    'attributeChanged'
  ];

  function flagAndCheckZone() {
    flag = true;
    hasParent = !!window.zone.parent;
  }

  var customElements = callbacks.map(function (callbackName) {
    var fullCallbackName = callbackName + 'Callback';
    var proto = Object.create(HTMLElement.prototype);
    proto[fullCallbackName] = flagAndCheckZone;
    return document.registerElement('x-' + callbackName.toLowerCase(), {
      prototype: proto
    });
  });


  beforeEach(function () {
    flag = false;
    hasParent = false;
  });


  it('should work with createdCallback', function () {
    runs(function () {
      var elt = document.createElement('x-created');
    });

    waitsFor(function() {
      return flag;
    }, 'createdCallback to fire', 100);

    runs(function() {
      expect(hasParent).toBe(true);
    });
  });


  it('should work with attachedCallback', function () {
    runs(function () {
      var elt = document.createElement('x-attached');
      document.body.appendChild(elt);
      document.body.removeChild(elt);
    });

    waitsFor(function() {
      return flag;
    }, 'attachedCallback to fire', 100);

    runs(function() {
      expect(hasParent).toBe(true);
    });
  });


  it('should work with detachedCallback', function () {
    runs(function () {
      var elt = document.createElement('x-detached');
      document.body.appendChild(elt);
      document.body.removeChild(elt);
    });

    waitsFor(function() {
      return flag;
    }, 'detachedCallback to fire', 100);

    runs(function() {
      expect(hasParent).toBe(true);
    });
  });


  it('should work with attributeChanged', function () {
    runs(function () {
      var elt = document.createElement('x-attributechanged');
      elt.id = 'bar';
    });

    waitsFor(function() {
      return flag;
    }, 'attributeChanged to fire', 100);

    runs(function() {
      expect(hasParent).toBe(true);
    });
  });


  it('should work with prototypes that have non-writable, non-configurable descriptors', function () {
    runs(function () {
      var proto = Object.create(HTMLElement.prototype);
      Object.defineProperty(proto, 'createdCallback', {
        writeable: false,
        configurable: false,
        value: flagAndCheckZone
      });
      document.registerElement('x-prop-desc', {
        prototype: proto
      });
      var elt = document.createElement('x-prop-desc');
    });

    waitsFor(function() {
      return flag;
    }, 'createdCallback to fire', 100);

    runs(function() {
      expect(hasParent).toBe(true);
    });
  });


  it('should work with prototypes that have non-writable, non-configurable descriptors', function () {
    runs(function () {
      var proto = Object.create(HTMLElement.prototype);
      Object.defineProperties(proto, {
        createdCallback: {
          writeable: false,
          configurable: false,
          value: flagAndCheckZone
        }
      });
      document.registerElement('x-props-desc', {
        prototype: proto
      });
      var elt = document.createElement('x-props-desc');
    });

    waitsFor(function() {
      return flag;
    }, 'createdCallback to fire', 100);

    runs(function() {
      expect(hasParent).toBe(true);
    });
  });

});
