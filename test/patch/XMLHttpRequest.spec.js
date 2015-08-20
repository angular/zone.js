'use strict';

describe('XMLHttpRequest', function () {
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
          expect(zone).toBeDirectChildOf(testZone);
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
    try {
      req.responseType = 'document';
      expect(req.responseType).toBe('document');
    } catch (e) {
      //Android browser: using this setter throws, this should be preserved
      expect(e.message).toBe('INVALID_STATE_ERR: DOM Exception 11');
    }
  });

  it('should preserve static constants', function() {
    expect(XMLHttpRequest.UNSENT).toEqual(0);
    expect(XMLHttpRequest.OPENED).toEqual(1);
    expect(XMLHttpRequest.HEADERS_RECEIVED).toEqual(2);
    expect(XMLHttpRequest.LOADING).toEqual(3);
    expect(XMLHttpRequest.DONE).toEqual(4);
  });
});

