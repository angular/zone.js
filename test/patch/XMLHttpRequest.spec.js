'use strict';

describe('XMLHttpRequest', ifBrowserEnvSupports('XMLHttpRequest', function () {
  var testZone = zone.fork();

  it('should work with onreadystatechange', function (done) {
    var req;

    testZone.run(function() {
      req = new XMLHttpRequest();
      var firstCall = true;
      req.onreadystatechange = function () {
        // Make sure that the callback will only be called once
        req.onreadystatechange = null;
        expect(zone).toBeDirectChildOf(testZone);
        done();
      };
      req.open('get', '/', true);
    });

    req.send();
  });

  var supportsOnProgress = function() {
    return 'onprogress' in new XMLHttpRequest();
  }
  supportsOnProgress.message = "XMLHttpRequest.onprogress";

  describe('onprogress', ifEnvSupports(supportsOnProgress, function () {
    it('should work with onprogress', function (done) {
      var req;
      testZone.run(function() {
        req = new XMLHttpRequest();
        req.onprogress = function () {
          // Make sure that the callback will only be called once
          req.onprogress = null;
          expect(window.zone).toBeDirectChildOf(testZone);
          done();
        };
        req.open('get', '/', true);
      });

      req.send();
    });
  }));

  it('should preserve other setters', function () {
    var req = new XMLHttpRequest();
    req.open('get', '/', true);
    req.send();
    req.responseType = 'document';
    expect(req.responseType).toBe('document');
  });

}));
