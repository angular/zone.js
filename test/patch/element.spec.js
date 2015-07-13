'use strict';

describe('element', function () {

  var button;
  var testZone = zone.fork();

  beforeEach(function () {
    button = document.createElement('button');
    document.body.appendChild(button);
  });

  afterEach(function () {
    document.body.removeChild(button);
  });

  it('should work with addEventListener when called with a function listener', function () {
    var clickEvent = document.createEvent('Event');
    clickEvent.initEvent('click', true, true);

    testZone.run(function() {
      button.addEventListener('click', function (event) {
        expect(zone).toBeDirectChildOf(testZone);
        expect(event).toBe(clickEvent);
      });
    });

    button.dispatchEvent(clickEvent);
  });

  it('should work with addEventListener when called with an EventListener-implementing listener', function () {
    var eventListener = {
      x: 5,
      handleEvent: function(event) {
        // Test that context is preserved
        expect(this.x).toBe(5);

        expect(event).toBe(clickEvent);
        expect(zone).toBeDirectChildOf(testZone);
      }
    };

    var clickEvent = document.createEvent('Event');
    clickEvent.initEvent('click', true, true);

    testZone.run(function() {
      button.addEventListener('click', eventListener);
    });

    button.dispatchEvent(clickEvent);
  });

  it('should work with addEventListener when invoked in a zone with an addEventListener interceptor', function () {
    var count = 0;
    var focusEvent = document.createEvent('Event');
    focusEvent.initEvent('focus', true, true);

    var interceptorZone = testZone.fork({
      addEventListener: function (delegate, target) {
        expect(target).toBe(button);
        return function addEventListener (name, listener) {
            delegate('focus', function() {
              count++;
              return listener.apply(this, arguments);
          });
        };
      }
    });

    interceptorZone.run(function() {
      button.addEventListener('click', function (event) {
        expect(zone).toBeDirectChildOf(interceptorZone);
        expect(event).toBe(focusEvent);
      });
    });

    button.dispatchEvent(focusEvent);
    button.dispatchEvent(focusEvent);

    expect(count).toBe(2);
  });

  it('should respect removeEventListener when called with a function listener', function () {
    var listener = jasmine.createSpy();

    button.addEventListener('click', listener);
    button.removeEventListener('click', listener);

    button.click();

    expect(listener).not.toHaveBeenCalled();
  });

  it('should respect removeEventListener with an EventListener-implementing listener', function () {
    var eventListener = {
      x: 5,
      handleEvent: jasmine.createSpy('handleEvent')
    };

    button.addEventListener('click', eventListener);
    button.removeEventListener('click', eventListener);

    button.click();

    expect(eventListener.handleEvent).not.toHaveBeenCalled();
  });

  it('should respect removeEventListener when invoked in a zone with a removeEventListener interceptor', function () {
    var count = 0;
    var listener = jasmine.createSpy();
    var interceptorZone = testZone.fork({
      removeEventListener: function(delegate, target) {
        expect(target).toBe(button);
        return function removeEventListener(name, listener) {
          count++;
          delegate('click', listener);
        }
      }
    })

    interceptorZone.run(function() {
      button.addEventListener('click', listener);
      button.removeEventListener('focus', listener);
    });

    button.click();

    expect(count).toBe(1);
    expect(listener).not.toHaveBeenCalled();
  });

  describe('onclick', function() {

    function supportsOnClick() {
      var div = document.createElement('div');
      var clickPropDesc = Object.getOwnPropertyDescriptor(div, 'onclick');
      return !(EventTarget &&
               div instanceof EventTarget &&
               clickPropDesc && clickPropDesc.value === null);
    }
    supportsOnClick.message = 'Supports Element#onclick patching';


    ifEnvSupports(supportsOnClick, function() {
      it('should spawn new child zones', function () {
        testZone.run(function() {
          button.onclick = function () {
            expect(zoneA).toBeDirectChildOf(testZone);
          };
        });

        button.click();
      });
    });


    it('should only allow one onclick handler', function () {
      var log = '';
      button.onclick = function () {
        log += 'a';
      };
      button.onclick = function () {
        log += 'b';
      };

      button.click();
      expect(log).toEqual('b');
    });


    it('should handle removing onclick', function () {
      var log = '';
      button.onclick = function () {
        log += 'a';
      };
      button.onclick = null;

      button.click();
      expect(log).toEqual('');
    });
  });

});
