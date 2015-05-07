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
    button.remove();
  });

  it('should work with addEventListener', function () {
    var childTestZone;

    testZone.run(function() {
      button.addEventListener('click', function () {
        childTestZone = window.zone;
      });
    });

    button.click();
    expect(childTestZone.parent).toBe(testZone);
  });

  it('should respect removeEventListener', function () {
    var log = '';
    var logFunction = function logFunction () {
      log += 'a';
    };

    button.addEventListener('click', logFunction);
    button.addEventListener('focus', logFunction);
    button.click();
    expect(log).toEqual('a');
    button.dispatchEvent(new Event('focus'));
    expect(log).toEqual('aa');

    button.removeEventListener('click', logFunction);
    button.click();
    expect(log).toEqual('aa');
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
        var childTestZone;

        testZone.run(function() {
          button.onclick = function () {
            childTestZone = window.zone;
          };
        });

        button.click();
        expect(childTestZone.parent).toBe(testZone);
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
