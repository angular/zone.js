/*
 * check that document.registerElement(name, { prototype: proto });
 * is properly patched
 */

'use strict';

function registerElement() {
  return ('registerElement' in document);
}
registerElement.message = 'document.registerElement';

describe('document.registerElement', ifBrowserEnvSupports(registerElement, function () {

  // register a custom element for each callback
  var callbackNames = [
    'created',
    'attached',
    'detached',
    'attributeChanged'
  ];

  var callbacks = {};

  var testZone = zone.fork();

  var customElements;

  customElements = testZone.run(function() {
    callbackNames.map(function (callbackName) {
      var fullCallbackName = callbackName + 'Callback';
      var proto = Object.create(HTMLElement.prototype);
      proto[fullCallbackName] = function (arg) {
        callbacks[callbackName](arg);
      };
      return document.registerElement('x-' + callbackName.toLowerCase(), {
        prototype: proto
      });
    });
  });

  it('should work with createdCallback', function (done) {
    callbacks.created = function () {
      expect(zone).toBeDirectChildOf(testZone);
      done();
    };

    document.createElement('x-created');
  });


  it('should work with attachedCallback', function (done) {
    callbacks.attached = function () {
      expect(zone).toBeDirectChildOf(testZone);
      done();
    };

    var elt = document.createElement('x-attached');
    document.body.appendChild(elt);
    document.body.removeChild(elt);
  });


  it('should work with detachedCallback', function (done) {
    callbacks.detached = function () {
      expect(zone).toBeDirectChildOf(testZone);
      done();
    };

    var elt = document.createElement('x-detached');
    document.body.appendChild(elt);
    document.body.removeChild(elt);
  });


  it('should work with attributeChanged', function (done) {
    callbacks.attributeChanged = function () {
      expect(zone).toBeDirectChildOf(testZone);
      done();
    };

    var elt = document.createElement('x-attributechanged');
    elt.id = 'bar';
  });


  it('should work with non-writable, non-configurable prototypes created with defineProperty', function (done) {
    testZone.run(function() {
      var proto = Object.create(HTMLElement.prototype);

      Object.defineProperty(proto, 'createdCallback', {
        writeable: false,
        configurable: false,
        value: checkZone
      });

      document.registerElement('x-prop-desc', { prototype: proto });

      function checkZone() {
        expect(zone).toBeDirectChildOf(testZone);
        done();
      }
    });

    var elt = document.createElement('x-prop-desc');
  });


  it('should work with non-writable, non-configurable prototypes created with defineProperties', function (done) {
    testZone.run(function() {
      var proto = Object.create(HTMLElement.prototype);

      Object.defineProperties(proto, {
        createdCallback: {
          writeable: false,
          configurable: false,
          value: checkZone
        }
      });

      document.registerElement('x-props-desc', { prototype: proto });

      function checkZone() {
        expect(zone).toBeDirectChildOf(testZone);
        done();
      }
    });

    var elt = document.createElement('x-props-desc');
  });

}));
