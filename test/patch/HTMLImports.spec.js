'use strict';

function supportsImports() {
  return 'import' in document.createElement('link');
}

supportsImports.message = 'HTML Imports';

describe('HTML Imports', ifBrowserEnvSupports(supportsImports, function () {
  var testZone = zone.fork();

  it('should work with addEventListener', function (done) {
    var link;

    testZone.run(function() {
      link = document.createElement('link');
      link.rel = 'import';
      link.href = 'someUrl';
      link.addEventListener('error', function () {
        expect(zone).toBeDirectChildOf(testZone);
        document.head.removeChild(link);
        done();
      });
    });

    document.head.appendChild(link);
  });

  function supportsOnEvents() {
    var link = document.createElement('link');
    var linkPropDesc = Object.getOwnPropertyDescriptor(link, 'onerror');
    return !(linkPropDesc && linkPropDesc.value === null);
  }
  supportsOnEvents.message = 'Supports HTMLLinkElement#onxxx patching';


  ifEnvSupports(supportsOnEvents, function() {
    it('should work with onerror', function (done) {
      var link;

      testZone.run(function() {
        link = document.createElement('link');
        link.rel = 'import';
        link.href = 'anotherUrl';
        link.onerror = function () {
          expect(zone).toBeDirectChildOf(testZone);
          document.head.removeChild(link);
          done();
        };
      });

      document.head.appendChild(link);
    });

    it('should work with onload', function (done) {
      var link;

      testZone.run(function() {
        link = document.createElement('link');
        link.rel = 'import';
        link.href = '/base/test/assets/import.html';
        link.onload = function () {
          expect(zone).toBeDirectChildOf(testZone);
          document.head.removeChild(link);
          done();
        };
      });

      document.head.appendChild(link);
    });
  });

}));
