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
    var logOnClick = function logOnClick () {
      log += 'a';
    };

    button.addEventListener('click', logOnClick);
    button.click();
    expect(log).toEqual('a');

    button.removeEventListener('click', logOnClick);
    button.click();
    expect(log).toEqual('a');
  });


  describe('onclick', function() {

    function onClickDescriptor() {
      return Zone.canPatchViaPropertyDescriptor();
    }
    onClickDescriptor.message = 'onclick property descriptor on HTMLElement prototype';


    it('should spawn new child zones', ifEnvSupports(onClickDescriptor, function () {
      var childTestZone;

      testZone.run(function() {
        button.onclick = function () {
          childTestZone = window.zone;
        };
      });

      button.click();
      expect(childTestZone.parent).toBe(testZone);
    }));


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
