'use strict';

var _global = typeof window === 'undefined' ? global : window;

function supportsImports() {
  return typeof document !== 'undefined' && 'import' in document.createElement('link');
}
supportsImports.message = 'HTML Imports';

describe('HTML Imports', _global.ifEnvSupports(supportsImports, function () {

  it('should work with addEventListener', function (done) {
    var link = document.createElement('link');
    link.rel = 'import';
    link.href = 'someUrl';
    link.addEventListener('error', function () {
      expect(window.zone.parent).toBeDefined();
      document.head.removeChild(link);
      done();
    });
    document.head.appendChild(link);
  });

  it('should work with onerror', function (done) {
    var link = document.createElement('link');
    link.rel = 'import';
    link.href = 'anotherUrl';
    link.onerror = function () {
      expect(window.zone.parent).toBeDefined();
      document.head.removeChild(link);
      done();
    };
    document.head.appendChild(link);
  });

  it('should work with onload', function (done) {
    var link = document.createElement('link');
    link.rel = 'import';
    link.href = '/base/test/assets/import.html';
    link.onload = function () {
      expect(window.zone.parent).toBeDefined();
      document.head.removeChild(link);
      done();
    };
    document.head.appendChild(link);
  });
}));
