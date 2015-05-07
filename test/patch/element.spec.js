'use strict';

describe('element', function () {

  var button;

  beforeEach(function () {
    button = document.createElement('button');
    document.body.appendChild(button);
  });

  afterEach(function () {
    document.body.removeChild(button);
    button.remove();
  });

  it('should work with addEventListener', function (done) {
    var outerZone = zone;
    zone.fork().run(function() {
       button.addEventListener('click', function () {
         expect(zone.parent).toBe(outerZone);
         done();
       })
    });

    button.click();
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

  it('should work with onclick', function () {
    var zoneHasParent;
    button.onclick = function () {
      zoneHasParent = !!window.zone.parent;
    };

    button.click();
    expect(zoneHasParent).toEqual(true);
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
