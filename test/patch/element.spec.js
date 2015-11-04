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

  // https://github.com/angular/zone.js/issues/190
  it('should work when addEventListener / removeEventListener are called in the global context', function () {
    var clickEvent = document.createEvent('Event');
    var callCount = 0;

    clickEvent.initEvent('click', true, true);

    var listener = function (event) {
      callCount++;
      expect(zone).toBeDirectChildOf(testZone);
      expect(event).toBe(clickEvent)
    };

    testZone.run(function() {
      // `this` would be null inside the method when `addEventListener` is called from strict mode
      // it would be `window`:
      // - when called from non strict-mode,
      // - when `window.addEventListener` is called explicitely.
      addEventListener('click', listener);
    });

    button.dispatchEvent(clickEvent);
    expect(callCount).toEqual(1);

    removeEventListener('click', listener);
    button.dispatchEvent(clickEvent);
    expect(callCount).toEqual(1);
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

  it('should have no effect while calling addEventListener without listener', function () {
    var eventListenerZone = zone.fork({
      addEventListener: jasmine.createSpy('addEventListener')
    });
    expect(function() {
      eventListenerZone.run(function() {
        button.addEventListener('click', null);
        button.addEventListener('click', undefined);
      });
    }).not.toThrowError();
    expect(eventListenerZone.addEventListener).toHaveBeenCalledWith('click', null);
    expect(eventListenerZone.addEventListener).toHaveBeenCalledWith('click', undefined);
  });

  it('should have no effect while calling removeEventListener without listener', function () {
    var eventListenerZone = zone.fork({
      removeEventListener: jasmine.createSpy('removeEventListener')
    });
    expect(function() {
      eventListenerZone.run(function() {
        button.removeEventListener('click', null);
        button.removeEventListener('click', undefined);
      });
    }).not.toThrowError();
    expect(eventListenerZone.removeEventListener).toHaveBeenCalledWith('click', null);
    expect(eventListenerZone.removeEventListener).toHaveBeenCalledWith('click', undefined);
  });


  it('should only add a listener once for a given set of arguments', function() {
    var log = [];
    var clickEvent = document.createEvent('Event');

    function listener() {
      log.push('listener');
    }

    clickEvent.initEvent('click', true, true);

    button.addEventListener('click', listener);
    button.addEventListener('click', listener);
    button.addEventListener('click', listener);

    button.dispatchEvent(clickEvent);

    button.removeEventListener('click', listener);

    button.dispatchEvent(clickEvent);

    expect(log).toEqual([
        'listener'
    ]);
  });

  it('should correctly handle capturing versus nonCapturing eventListeners', function () {
    var log = [];
    var clickEvent = document.createEvent('Event');

    function capturingListener () {
      log.push('capturingListener');
    }

    function bubblingListener () {
      log.push('bubblingListener');
    }

    clickEvent.initEvent('click', true, true);

    document.body.addEventListener('click', capturingListener, true);
    document.body.addEventListener('click', bubblingListener);

    button.dispatchEvent(clickEvent);

    expect(log).toEqual([
      'capturingListener',
      'bubblingListener'
    ]);
  });

  it('should correctly handle a listener that is both capturing and nonCapturing', function () {
    var log = [];
    var clickEvent = document.createEvent('Event');

    function listener () {
      log.push('listener');
    }

    clickEvent.initEvent('click', true, true);

    document.body.addEventListener('click', listener, true);
    document.body.addEventListener('click', listener);

    button.dispatchEvent(clickEvent);

    document.body.removeEventListener('click', listener, true);
    document.body.removeEventListener('click', listener);

    button.dispatchEvent(clickEvent);

    expect(log).toEqual([
      'listener',
      'listener'
    ]);
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
