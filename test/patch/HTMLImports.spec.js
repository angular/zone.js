'use strict';

describe('HTML Imports', function () {
  if (!supportsImports()) {
    console.log('WARNING: HTML Imports test (missing this API)');
    return;
  }

  var flag, hasParent;

  beforeEach(function () {
    flag = false;
    hasParent = false;
  });

  it('should work with addEventListener', function () {
    var link;

    runs(function () {
      link = document.createElement('link');
      link.rel = 'import';
      link.href = 'someUrl';
      link.addEventListener('error', setFlag);
      document.head.appendChild(link);
    });

    waitsFor(flagToBeTrue, 'template to resolve', 100);

    runs(function() {
      expect(hasParent).toBe(true);
      document.head.removeChild(link);
    });
  });

  it('should work with onerror', function () {
    var link;

    runs(function () {
      link = document.createElement('link');
      link.rel = 'import';
      link.href = 'anotherUrl';
      link.onerror = setFlag;
      document.head.appendChild(link);
    });

    waitsFor(flagToBeTrue, 'template to resolve', 100);

    runs(function() {
      expect(hasParent).toBe(true);
      document.head.removeChild(link);
    });
  });

  it('should work with onload', function () {
    var link;

    runs(function () {
      link = document.createElement('link');
      link.rel = 'import';
      link.href = '/base/test/assets/import.html';
      link.onload = setFlag;
      document.head.appendChild(link);
    });

    waitsFor(flagToBeTrue, 'template to resolve', 100);

    runs(function() {
      expect(hasParent).toBe(true);
      document.head.removeChild(link);
    });
  });

  function setFlag() {
    hasParent = !!window.zone.parent;
    flag = true;
  }

  function flagToBeTrue() {
    return flag;
  }

});

function supportsImports() {
  return 'import' in document.createElement('link');
}
