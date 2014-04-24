'use strict';

describe('MutationObserver', function () {
  it('should work', function () {
    if (!window.MutationObserver) {
      console.log('WARNING: skipping MutationObserver test (missing this API)');
      return;
    }

    var flag = false,
        elt = document.createElement('div'),
        hasParent;

    runs(function () {
      var ob = new MutationObserver(function () {
        hasParent = !!window.zone.parent;
        flag = true;
      });

      ob.observe(elt, {
        childList: true
      });

      elt.innerHTML = '<p>hey</p>';
    });

    waitsFor(function() {
      return flag;
    }, 'mutation observer to fire', 100);

    runs(function() {
      expect(hasParent).toBe(true);
    });

  });
});

describe('WebKitMutationObserver', function () {
  it('should ensure observers run within the zone', function () {
    if (!window.WebKitMutationObserver) {
      console.log('WARNING: skipping WebKitMutationObserver test (missing this API)');
      return;
    }

    var flag = false,
        elt = document.createElement('div'),
        hasParent;

    runs(function () {
      var ob = new WebKitMutationObserver(function () {
        hasParent = !!window.zone.parent;
        flag = true;
      });

      ob.observe(elt, {
        childList: true
      });

      elt.innerHTML = '<p>hey</p>';
    });

    waitsFor(function() {
      return flag;
    }, 'mutation observer to fire', 100);

    runs(function() {
      expect(hasParent).toBe(true);
    });

  });
});
