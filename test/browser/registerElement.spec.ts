/*
 * check that document.registerElement(name, { prototype: proto });
 * is properly patched
 */

import {ifEnvSupports} from '../util';
import { Zone } from '../../lib/zone';

function registerElement() {
  return ('registerElement' in document);
}
(<any>registerElement).message = 'document.registerElement';

describe('document.registerElement', ifEnvSupports(registerElement, function () {

  // register a custom element for each callback
  var callbackNames = [
    'created',
    'attached',
    'detached',
    'attributeChanged'
  ];

  var callbacks: any = {};

  var testZone = Zone.current.fork({name: 'test'});

  var customElements;

  customElements = testZone.run(function() {
    callbackNames.map(function (callbackName) {
      var fullCallbackName = callbackName + 'Callback';
      var proto = Object.create(HTMLElement.prototype);
      proto[fullCallbackName] = function (arg) {
        callbacks[callbackName](arg);
      };
      return (<any>document).registerElement('x-' + callbackName.toLowerCase(), {
        prototype: proto
      });
    });
  });

  it('should work with createdCallback', function (done) {
    callbacks.created = function () {
      expect(Zone.current).toBe(testZone);
      done();
    };

    document.createElement('x-created');
  });


  it('should work with attachedCallback', function (done) {
    callbacks.attached = function () {
      expect(Zone.current).toBe(testZone);
      done();
    };

    var elt = document.createElement('x-attached');
    document.body.appendChild(elt);
    document.body.removeChild(elt);
  });


  it('should work with detachedCallback', function (done) {
    callbacks.detached = function () {
      expect(Zone.current).toBe(testZone);
      done();
    };

    var elt = document.createElement('x-detached');
    document.body.appendChild(elt);
    document.body.removeChild(elt);
  });


  it('should work with attributeChanged', function (done) {
    callbacks.attributeChanged = function () {
      expect(Zone.current).toBe(testZone);
      done();
    };

    var elt = document.createElement('x-attributechanged');
    elt.id = 'bar';
  });


  it('should work with non-writable, non-configurable prototypes created with defineProperty', function (done) {
    testZone.run(function() {
      var proto = Object.create(HTMLElement.prototype);

      Object.defineProperty(proto, 'createdCallback', <any>{
        writeable: false,
        configurable: false,
        value: checkZone
      });

      (<any>document).registerElement('x-prop-desc', { prototype: proto });

      function checkZone() {
        expect(Zone.current).toBe(testZone);
        done();
      }
    });

    var elt = document.createElement('x-prop-desc');
  });


  it('should work with non-writable, non-configurable prototypes created with defineProperties', function (done) {
    testZone.run(function() {
      var proto = Object.create(HTMLElement.prototype);

      Object.defineProperties(proto, {
        createdCallback: <any>{
          writeable: false,
          configurable: false,
          value: checkZone
        }
      });

      (<any>document).registerElement('x-props-desc', { prototype: proto });

      function checkZone() {
        expect(Zone.current).toBe(testZone);
        done();
      }
    });

    var elt = document.createElement('x-props-desc');
  });


  it('should check bind callback if not own property', function (done) {
    testZone.run(function() {
      var originalProto = {
        createdCallback: checkZone
      };

      var secondaryProto = Object.create(originalProto);
      expect(secondaryProto.createdCallback).toBe(originalProto.createdCallback);

      (<any>document).registerElement('x-inherited-callback', { prototype: secondaryProto });
      expect(secondaryProto.createdCallback).not.toBe(originalProto.createdCallback);

      function checkZone() {
        expect(Zone.current).toBe(testZone);
        done();
      }

      var elt = document.createElement('x-inherited-callback');
    });
  });


  it('should not throw if no options passed to registerElement', function () {
    expect(function() {
      (<any>document).registerElement('x-no-opts');
    }).not.toThrow();
  });

}));
