'use strict';

var util = require('../../util');

describe('MutationObserver', util.ifEnvSupports('MutationObserver', function () {
  var elt;
  var testZone = zone.fork();

  beforeEach(function () {
    elt = document.createElement('div');
  });

  it('should run observers within the zone', function (done) {
    var ob;

    testZone.run(function() {
      ob = new MutationObserver(function () {
        expect(zone).toBeDirectChildOf(testZone);
        done();
      });

      ob.observe(elt, { childList: true });
    });

    elt.innerHTML = '<p>hey</p>';
  });

  it('should dequeue upon disconnect', function () {
    var ob;
    var flag = false;
    var childZone = zone.fork({
      dequeueTask: function () {
        flag = true;
      }
    });

    childZone.run(function () {
      ob = new MutationObserver(function () {});
      ob.observe(elt, { childList: true });
    });

    ob.disconnect();
    expect(flag).toBe(true);
  });

  it('should enqueue once upon observation', function () {
    var ob;
    var count = 0;
    var childZone = zone.fork({
      enqueueTask: function () {
        count += 1;
      }
    });

    childZone.run(function () {
      ob = new MutationObserver(function () {});
      expect(count).toBe(0);
    });

    ob.observe(elt, { childList: true });
    expect(count).toBe(1);

    ob.observe(elt, { childList: true });
    expect(count).toBe(1);
  });

  it('should only dequeue upon disconnect if something is observed', function () {
    var ob;
    var flag = false;
    var elt = document.createElement('div');
    var childZone = zone.fork({
      dequeueTask: function () {
        flag = true;
      }
    });

    childZone.run(function () {
      ob = new MutationObserver(function () {});
    });

    ob.disconnect();
    expect(flag).toBe(false);
  });
}));

describe('WebKitMutationObserver', util.ifEnvSupports('WebKitMutationObserver', function () {
  var testZone = zone.fork();

  it('should run observers within the zone', function (done) {
    var elt;

    testZone.run(function() {
      elt = document.createElement('div');

      var ob = new WebKitMutationObserver(function () {
        expect(zone).toBeDirectChildOf(testZone);
        done();
      });

      ob.observe(elt, { childList: true});
    });

    elt.innerHTML = '<p>hey</p>';
  });
}));
