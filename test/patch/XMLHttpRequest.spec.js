'use strict';

describe('XMLHttpRequest', function () {

  it('should work with onreadystatechange', function (done) {
    var req = new XMLHttpRequest();
    req.onreadystatechange = function () {
      expect(window.zone.parent).toBeDefined();
      done();
    };
    req.open('get', '/', true);
    req.send();
  });

  it('should work with onprogress', function (done) {
    var req = new XMLHttpRequest();
    req.onprogress = function () {
      expect(window.zone.parent).toBeDefined();
      done();
    };
    req.open('get', '/', true);
    req.send();
  });

  it('should preserve other setters', function () {
    var req = new XMLHttpRequest();
    req.open('get', '/', true);
    req.send();
    req.responseType = 'document';
    expect(req.responseType).toBe('document');
  });

});
