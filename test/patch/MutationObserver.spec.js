'use strict';

describe('MutationObserver', ifEnvSupports('MutationObserver', function () {
  var elt;

  beforeEach(function () {
    elt = document.createElement('div');
  });

  it('should work', function () {
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
}));

describe('WebKitMutationObserver', ifEnvSupports('WebKitMutationObserver', function () {
  it('should ensure observers run within the zone', function () {
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
}));
