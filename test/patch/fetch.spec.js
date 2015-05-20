'use strict';

describe('fetch', ifEnvSupports('fetch', function () {
  var testZone = zone.fork();
  var oPromise = Promise;

  beforeEach(function() {
    Promise = function() {
      throw new Error('use window.Promise');
    };
  });

  afterEach(function() {
    Promise = oPromise;
  });


  fit('should work on success', function(done) {
    var oPromise = Promise;


    testZone.run(function() {
      fetch('/base/test/assets/import.html').then(function(response) {
        console.log('fetch cb zone parent is testZone', zone.parent === testZone);
        var thenZone = window.zone;
        //expect(window.zone).toBeDirectChildOf(testZone);
        expect(response).toBeDefined();
        response.text().then(function(text) {
          expect(window.zone).toBeDirectChildOf(thenZone);
          expect(text.trim()).toEqual('<p>hey</p>');
          done();
        })
      });
    });
  });

}));

