
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
    if (typeof test === 'string' ? !!global[test] : test()) {
      block();
    } else {
      it('should skip the test if the API does not exist', function () {
        console.log('WARNING: skipping ' + message + ' tests (missing this API)');
      });
    }
  };
};

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
  },

  // Provide our own `toThrowError` matcher as a short-term solution because jasmine-node's breaks
  toThrowError: function() {
    return {
      compare: function(fn, expectedErrorMessage) {
        var actualError;
        var fnName = fn.name || 'fn';

        try {
          fn()
        } catch (e) {
          actualError = e;
        }

        if (actualError) {
          if (actualError.message === expectedErrorMessage) {
            return {
              pass: true,
              message: fnName + ' threw Error with message "' + expectedErrorMessage + '"'
            };
          } else {
            return {
              pass: false,
              message: 'Expected ' + fnName + ' to throw Error with message "' + expectedErrorMessage +
                       '" but it actually threw error with message "' + actualError.message + '"'
            };
          }
        } else {
          return {
              pass: false,
              message: 'Expected ' + fnName + ' to throw Error with message "' + expectedErrorMessage +
                       '" but it did not throw'
            };
        }
      }
    }
  }
}

beforeEach(function() {
  global.jasmine.addMatchers(customMatchers);
});

module.exports = {
  ifEnvSupports: ifEnvSupports,
  
  // useful for testing mocks
  setTimeout: global.setTimeout.bind(global)
};
