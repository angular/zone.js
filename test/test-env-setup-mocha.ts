import '../lib/mocha/mocha';

((context) => {
  context['jasmine'] = global['jasmine'] || {};
  context['jasmine'].createSpy = function (spyName) {
    let spy: any = function (...params) {
      spy.countCall++;
      spy.callArgs = params;
    };

    spy.countCall = 0;

    return spy;
  };

  function eq(a, b) {
    if (a === b) {
      return true;
    } else if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) {
        return false;
      }

      var isEqual = true;

      for (let prop in a) {
        if (a.hasOwnProperty(prop)) {
          if (!eq(a[prop], b[prop])) {
            isEqual = false;
            break;
          }
        }
      }

      return isEqual;
    } else if (typeof a === 'object' && typeof b === 'object') {
      if (Object.keys(a).length !== Object.keys(b).length) {
        return false;
      }

      let isEqual = true;

      for (let prop in a) {
        if (a.hasOwnProperty(prop)) {
          if (!eq(a[prop], b[prop])) {
            isEqual = false;
            break;
          }
        }
      }

      return isEqual;
    }

    return false;
  }

  context['expect'] = function (expected) {
    return {
      toBe: function (actual) {
        if (expected !== actual) {
          throw new Error(`Expected ${expected} to be ${actual}`);
        }
      },
      toEqual: function (actual) {
        if (!eq(expected, actual)) {

          throw new Error(`Expected ${expected} to be ${actual}`);
        }
      },
      toBeDefined: function () {
        if (!expected) {
          throw new Error(`Expected ${expected} to be defined`);
        }
      },
      toThrow: function () {
        try {
          expected();
        } catch (error) {
          return;
        }

        throw new Error(`Expected ${expected} to throw`);
      },
      toThrowError: function (errorToBeThrow) {
        try {
          expected();
        } catch (error) {
          return;
        }

        throw Error(`Expected ${expected} to throw: ${errorToBeThrow}`);
      },
      toBeTruthy: function () {
        if (!expected) {
          throw new Error(`Expected ${expected} to be truthy`);
        }
      },
      toContain: function (actual) {
        if (expected.indexOf(actual) === -1) {
          throw new Error(`Expected ${expected} to contain ${actual}`);
        }
      },
      toHaveBeenCalled: function () {
        if (expected.countCall === 0) {
          throw new Error(`Expected ${expected} to been called`);
        }
      },
      toHaveBeenCalledWith: function (...params) {
        if (!eq(expected.callArgs, params)) {
          throw new Error(`Expected ${expected} to been called with ${expected.callArgs}, called with: ${params}`);
        }
      },
      toMatch: function (actual) {
        if (!new RegExp(actual).test(expected)) {
          throw new Error(`Expected ${expected} to match ${actual}`);
        }
      },
      not: {
        toBe: function (actual) {
          if (expected === actual) {
            throw new Error(`Expected ${expected} not to be ${actual}`);
          }
        },
        toHaveBeenCalled: function () {
          if (expected.countCall > 0) {
            throw new Error(`Expected ${expected} to not been called`);
          }
        },
        toThrow: function () {
          try {
            expected();
          } catch (error) {
            throw new Error(`Expected ${expected} to not throw`);
          }
        },
        toThrowError: function () {
          try {
            expected();
          } catch (error) {
            throw Error(`Expected ${expected} to not throw error`);
          }
        },
        toBeGreaterThan: function (actual: number) {
          if (expected > actual) {
            throw new Error(`Expected ${expected} not to be greater than ${actual}`);
          }

        },
        toHaveBeenCalledWith: function (params) {
          if (!eq(expected.callArgs, params)) {
            throw new Error(`Expected ${expected} to not been called with ${params}`);
          }
        }
      }
    };
  };
})(window);