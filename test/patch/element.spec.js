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
        expect(event).toBe(clickEvent)
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

  it('should respect removeEventListener when called with a function listener', function () {
    var log = '';
    var logFunction = function logFunction () {
      log += 'a';
    };

    button.addEventListener('click', logFunction);
    button.addEventListener('focus', logFunction);
    button.click();
    expect(log).toEqual('a');
    var focusEvent = document.createEvent('Event');
    focusEvent.initEvent('focus', true, true)
    button.dispatchEvent(focusEvent);
    expect(log).toEqual('aa');

    button.removeEventListener('click', logFunction);
    button.click();
    expect(log).toEqual('aa');
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
