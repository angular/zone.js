'use strict';

describe('Promise', ifEnvSupports('Promise', function () {
  var testZone = window.zone.fork();

  describe('Promise API', function () {
    it('should work with .then', function (done) {
      var resolve;

      testZone.run(function() {
        new Promise(function (resolveFn) {
          resolve = resolveFn;
        }).then(function () {
          expect(window.zone).toBeDirectChildOf(testZone);
          done();
        });
      });

      resolve();
    });

    it('should work with .catch', function (done) {
      var reject;

      testZone.run(function() {
        new Promise(function (resolveFn, rejectFn) {
          reject = rejectFn;
        }).catch(function () {
          expect(window.zone).toBeDirectChildOf(testZone);
          done();
        });
      });

      reject();
    });
  });

  describe('fetch', ifEnvSupports('fetch', function () {
    it('should work for text response', function(done) {
      testZone.run(function() {
        fetch('/base/test/assets/sample.json').then(function(response) {
          var fetchZone = zone;
          expect(fetchZone).toBeDirectChildOf(testZone);

          response.text().then(function(text) {
            expect(zone).toBeDirectChildOf(fetchZone);
            expect(text.trim()).toEqual('{"hello": "world"}');
            done();
          });
        });
      });
    });

    it('should work for json response', function(done) {
      testZone.run(function() {
        fetch('/base/test/assets/sample.json').then(function(response) {
          var fetchZone = zone;
          expect(fetchZone).toBeDirectChildOf(testZone);

          response.json().then(function(obj) {
            expect(zone).toBeDirectChildOf(fetchZone);
            expect(obj.hello).toEqual('world');
            done();
          });
        });
      });
    });

    it('should work for blob response', function(done) {
      testZone.run(function() {
        fetch('/base/test/assets/sample.json').then(function(response) {
          var fetchZone = zone;
          expect(fetchZone).toBeDirectChildOf(testZone);

          response.blob().then(function(blob) {
            expect(zone).toBeDirectChildOf(fetchZone);
            expect(blob instanceof Blob).toEqual(true);
            done();
          });
        });
      });
    });

    it('should work for arrayBuffer response', function(done) {
      testZone.run(function() {
        fetch('/base/test/assets/sample.json').then(function(response) {
          var fetchZone = zone;
          expect(fetchZone).toBeDirectChildOf(testZone);

          response.arrayBuffer().then(function(blob) {
            expect(zone).toBeDirectChildOf(fetchZone);
            expect(blob instanceof ArrayBuffer).toEqual(true);
            done();
          });
        });
      });
    });
  }));

}));
