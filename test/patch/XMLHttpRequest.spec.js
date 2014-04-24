'use strict';

describe('XMLHttpRequest', function () {

  it('should work with onreadystatechange', function () {
    var flag = false,
        hasParent;

    runs(function () {
      var req = new XMLHttpRequest();
      req.onreadystatechange = function () {
        hasParent = !!window.zone.parent;
        flag = true;
      };
      req.open('get', '/', true);
      req.send();
    });

    waitsFor(function() {
      return flag;
    }, 'HTTP request to resolve', 100);

    runs(function() {
      expect(hasParent).toBe(true);
    });
  });

  it('should work with onprogress', function () {
    var flag = false,
        hasParent;

    runs(function () {
      var req = new XMLHttpRequest();
      req.onprogress = function () {
        hasParent = !!window.zone.parent;
        flag = true;
      };
      req.open('get', '/', true);
      req.send();
    });

    waitsFor(function() {
      return flag;
    }, 'HTTP request to resolve', 100);

    runs(function() {
      expect(hasParent).toBe(true);
    });
  });

  it('should preserve other setters', function () {
    var req = new XMLHttpRequest();
    req.open('get', '/', true);
    req.send();
    req.responseType = 'document';
    expect(req.responseType).toBe('document');
  });

});
