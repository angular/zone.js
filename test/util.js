
/*
 * usage:

describe('whatever', run(function () {

}, function () {
  return 'registerElement'
}, 'does not support whatevs'))

 */
function ifEnvSupports(test, block) {
  return function () {
    var message = (test.message || test.name || test);
    if (typeof test === 'string' ? !!window[test] : test()) {
      block();
    } else {
      it('should skip the test if the API does not exist', function () {
        console.log('WARNING: skipping ' + message + ' tests (missing this API)');
      });
    }
  };
};

function assertInChildOf(parentZone) {
  expect(window.zone).toBeChildOf(parentZone);
}

var customMatchers = {
  // Assert that a zone is a child of an other zone
  // usage: `expect(childZone).toBeChildOf(parentZone);`
  toBeChildOf: function() {
    return {
      compare: function(childZone, parentZone) {
        var zone = childZone.parent;
        while (zone) {
          if (zone === parentZone) {
            return {
              pass: true,
              message: 'The zone [' + childZone.$id + '] is a child of the zone [' + parentZone.$id + ']'
            };
          }
          zone = zone.parent;
        }

        return {
          pass: false,
          message: 'The zone [' + childZone.$id + '] is not a child of the zone [' + parentZone.$id + ']'
        };
      }
    }
  },
  toBeDirectChildOf: function() {
    return {
      compare: function(childZone, parentZone) {
        if (childZone.parent === parentZone) {
          return {
            pass: true,
            message: 'The zone [' + childZone.$id + '] is a direct child of the zone [' + parentZone.$id + ']'
          };
        }

        return {
          pass: false,
          message: 'The zone [' + childZone.$id + '] is not a direct child of the zone [' + parentZone.$id + ']'
        };
      }
    }
  }
}

beforeEach(function() {
  jasmine.addMatchers(customMatchers);
});

// useful for testing mocks
window.__setTimeout = window.setTimeout;
