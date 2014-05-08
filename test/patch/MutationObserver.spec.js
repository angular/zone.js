'use strict';

describe('MutationObserver', function () {
  var elt;

  beforeEach(function () {
    elt = document.createElement('div');
  });

  it('should work', function () {
    if (!window.MutationObserver) {
      console.log('WARNING: skipping MutationObserver test (missing this API)');
      return;
    }

    var flag = false,
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

  it('should dequeue upon disconnect', function () {
    if (!window.MutationObserver) {
      console.log('WARNING: skipping MutationObserver test (missing this API)');
      return;
    }

    var flag = false,
        childZone = zone.fork({
          dequeueTask: function () {
            flag = true;
          }
        });

    childZone.run(function () {
      var ob = new MutationObserver(function () {});
      ob.observe(elt, {
        childList: true
      });
      ob.disconnect();
      expect(flag).toBe(true);
    });
  });

  it('should enqueue once upon observation', function () {
    if (!window.MutationObserver) {
      console.log('WARNING: skipping MutationObserver test (missing this API)');
      return;
    }

    var count = 0,
        childZone = zone.fork({
          enqueueTask: function () {
            count += 1;
          }
        });

    childZone.run(function () {
      var ob = new MutationObserver(function () {});
      expect(count).toBe(0);

      ob.observe(elt, { childList: true });
      expect(count).toBe(1);

      ob.observe(elt, { childList: true });
      expect(count).toBe(1);
    });
  });

  it('should only dequeue upon disconnect if something is observed', function () {
    if (!window.MutationObserver) {
      console.log('WARNING: skipping MutationObserver test (missing this API)');
      return;
    }

    var flag = false,
        elt = document.createElement('div'),
        childZone = zone.fork({
          dequeueTask: function () {
            flag = true;
          }
        });

    childZone.run(function () {
      var ob = new MutationObserver(function () {});
      ob.disconnect();
      expect(flag).toBe(false);
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
