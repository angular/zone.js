'use strict';

(function() {
  // patch jasmine's it and fit functions so that the `done` callback always resets the zone
  // to the jasmine zone, which should be the root zone. (angular/zone.js#91)

  var jasmineZone = window.zone;
  var originalIt = window.it;
  var originalFit = window.fit;

  window.it = function zoneResettingIt(description, specFn) {
    if (specFn.length) {
      originalIt(description, function zoneResettingSpecFn(originalDone) {
        specFn(function zoneResettingDone() {
          jasmineZone.run(originalDone);
        });
      });
    } else {
      originalIt(description, specFn);  
    }
  };

  window.fit = function zoneResettingFit(description, specFn) {
    if (specFn.length) {
      originalFit(description, function zoneResettingSpecFn(originalDone) {
        specFn(function zoneResettingDone() {
          jasmineZone.run(originalDone);
        });
      });
    } else {
      originalFit(description, specFn);  
    }
  };

}(window));

// global beforeEach to check if we always start from the root zone
beforeEach(function() {
  expect(window.zone.isRootZone()).toBe(true);
});
