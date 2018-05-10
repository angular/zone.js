/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {addCustomEqualityTester, Any, customEqualityTesters, eq, ObjectContaining, toMatch} from './jasmine.util';

export function addJasmineExpect(jasmine: any, global: any) {
  addExpect(global, jasmine);
  addAny(jasmine);
  addObjectContaining(jasmine);
  addCustomEqualityTester(jasmine);
  addCustomMatchers(jasmine, global);
}

function addAny(jasmine: any) {
  jasmine.any = function(expected: any) {
    return new Any(expected);
  };
}

function addObjectContaining(jasmine: any) {
  jasmine.objectContaining = function(expected: any) {
    return new ObjectContaining(expected);
  };
}

function addCustomMatchers(jasmine: any, global: any) {
  const originalExcept = jasmine['__zone_symbol__expect'];
  jasmine.addMatchers = function(customMatcher: any) {
    let customMatchers = jasmine['__zone_symbol__customMatchers'];
    if (!customMatchers) {
      customMatchers = jasmine['__zone_symbol__customMatchers'] = [];
    }
    customMatchers.push(customMatcher);
  };
}

function buildCustomMatchers(expectObj: any, jasmine: any, expected: any) {
  const util = {equals: eq, toMatch: toMatch};
  let customMatchers: any = jasmine['__zone_symbol__customMatchers'];
  if (!customMatchers) {
    return;
  }
  customMatchers.forEach((matcher: any) => {
    Object.keys(matcher).forEach(key => {
      if (matcher.hasOwnProperty(key)) {
        const customExpected = matcher[key](util, customEqualityTesters);
        expectObj[key] = function(...actuals: any[]) {
          // TODO: @JiaLiPassion use result.message
          if (!customExpected.compare(expected, actuals[0], actuals[1]).pass) {
            throw new Error(`${key} failed, expect: ${expected}, actual is: ${actuals[0]}`);
          }
        };
        expectObj['not'][key] = function(...actuals: any[]) {
          if (customExpected.compare(expected, actuals[0], actuals[1]).pass) {
            throw new Error(`${key} failed, not expect: ${expected}, actual is: ${actuals[0]}`);
          }
        };
      }
    });
  });
  return expectObj;
}

function getMatchers(expected: any) {
  return {
    nothing: function() {},
    toBe: function(actual: any) {
      if (expected !== actual) {
        throw new Error(`Expected ${expected} to be ${actual}`);
      }
    },
    toBeCloseTo: function(actual: any, precision: any) {
      if (precision !== 0) {
        precision = precision || 2;
      }
      const pow = Math.pow(10, precision + 1);
      const delta = Math.abs(expected - actual);
      const maxDelta = Math.pow(10, -precision) / 2;
      if (Math.round(delta * pow) / pow > maxDelta) {
        throw new Error(
            `Expected ${expected} to be close to ${actual} with precision ${precision}`);
      }
    },
    toEqual: function(actual: any) {
      if (!eq(expected, actual)) {
        throw new Error(`Expected ${expected} to be ${actual}`);
      }
    },
    toBeGreaterThan: function(actual: number) {
      if (expected <= actual) {
        throw new Error(`Expected ${expected} to be greater than ${actual}`);
      }
    },
    toBeGreaterThanOrEqual: function(actual: number) {
      if (expected < actual) {
        throw new Error(`Expected ${expected} to be greater than or equal ${actual}`);
      }
    },
    toBeLessThan: function(actual: number) {
      if (expected >= actual) {
        throw new Error(`Expected ${expected} to be lesser than ${actual}`);
      }
    },
    toBeLessThanOrEqual: function(actual: number) {
      if (expected > actual) {
        throw new Error(`Expected ${expected} to be lesser than or equal ${actual}`);
      }
    },
    toBeDefined: function() {
      if (expected === undefined) {
        throw new Error(`Expected ${expected} to be defined`);
      }
    },
    toBeNaN: function() {
      if (expected === expected) {
        throw new Error(`Expected ${expected} to be NaN`);
      }
    },
    toBeNegativeInfinity: function() {
      if (expected !== Number.NEGATIVE_INFINITY) {
        throw new Error(`Expected ${expected} to be -Infinity`);
      }
    },
    toBeNull: function() {
      if (expected !== null) {
        throw new Error(`Expected ${expected} to be null`);
      }
    },
    toBePositiveInfinity: function() {
      if (expected !== Number.POSITIVE_INFINITY) {
        throw new Error(`Expected ${expected} to be +Infinity`);
      }
    },
    toBeUndefined: function() {
      if (expected !== undefined) {
        throw new Error(`Expected ${expected} to be undefined`);
      }
    },
    toThrow: function() {
      try {
        expected();
      } catch (error) {
        return;
      }

      throw new Error(`Expected ${expected} to throw`);
    },
    toThrowError: function(errorToBeThrow: any) {
      try {
        expected();
      } catch (error) {
        return;
      }

      throw Error(`Expected ${expected} to throw: ${errorToBeThrow}`);
    },
    toBeTruthy: function() {
      if (!expected) {
        throw new Error(`Expected ${expected} to be truthy`);
      }
    },
    toBeFalsy: function(actual: any) {
      if (!!actual) {
        throw new Error(`Expected ${actual} to be falsy`);
      }
    },
    toContain: function(actual: any) {
      if (expected.indexOf(actual) === -1) {
        throw new Error(`Expected ${expected} to contain ${actual}`);
      }
    },
    toBeCalled: function() {
      if (expected.calls.count() === 0) {
        throw new Error(`Expected ${expected} to been called`);
      }
    },
    toHaveBeenCalled: function() {
      if (expected.calls.count() === 0) {
        throw new Error(`Expected ${expected} to been called`);
      }
    },
    toBeCalledWith: function(...params: any[]) {
      if (expected.calls.allArgs().filter((args: any) => eq(args, params)).length === 0) {
        throw new Error(`Expected ${expected.calls.allArgs()} to been called with ${params}`);
      }
    },
    toHaveBeenCalledWith: function(...params: any[]) {
      if (expected.calls.allArgs().filter((args: any) => eq(args, params)).length === 0) {
        throw new Error(`Expected ${expected.calls.allArgs()} to been called with ${params}`);
      }
    },
    toMatch: function(actual: any) {
      if (!toMatch(actual, expected)) {
        throw new Error(`Expected ${expected} to match ${actual}`);
      }
    },
    not: {
      toBe: function(actual: any) {
        if (expected === actual) {
          throw new Error(`Expected ${expected} not to be ${actual}`);
        }
      },
      toBeCloseTo: function(actual: any, precision: any) {
        if (precision !== 0) {
          precision = precision || 2;
        }
        const pow = Math.pow(10, precision + 1);
        const delta = Math.abs(expected - actual);
        const maxDelta = Math.pow(10, -precision) / 2;
        if (Math.round(delta * pow) / pow <= maxDelta) {
          throw new Error(
              `Expected ${expected} not to be close to ${actual} with precision ${precision}`);
        }
      },
      toEqual: function(actual: any) {
        if (eq(expected, actual)) {
          throw new Error(`Expected ${expected} not to be ${actual}`);
        }
      },
      toThrow: function() {
        try {
          expected();
        } catch (error) {
          throw new Error(`Expected ${expected} to not throw`);
        }
      },
      toThrowError: function() {
        try {
          expected();
        } catch (error) {
          throw Error(`Expected ${expected} to not throw error`);
        }
      },
      toBeGreaterThan: function(actual: number) {
        if (expected > actual) {
          throw new Error(`Expected ${expected} not to be greater than ${actual}`);
        }
      },
      toBeGreaterThanOrEqual: function(actual: number) {
        if (expected >= actual) {
          throw new Error(`Expected ${expected} not to be greater than or equal ${actual}`);
        }
      },
      toBeLessThan: function(actual: number) {
        if (expected < actual) {
          throw new Error(`Expected ${expected} not to be lesser than ${actual}`);
        }
      },
      toBeLessThanOrEqual: function(actual: number) {
        if (expected <= actual) {
          throw new Error(`Expected ${expected} not to be lesser than or equal ${actual}`);
        }
      },
      toBeDefined: function() {
        if (expected !== undefined) {
          throw new Error(`Expected ${expected} not to be defined`);
        }
      },
      toBeNaN: function() {
        if (expected !== expected) {
          throw new Error(`Expected ${expected} not to be NaN`);
        }
      },
      toBeNegativeInfinity: function() {
        if (expected === Number.NEGATIVE_INFINITY) {
          throw new Error(`Expected ${expected} not to be -Infinity`);
        }
      },
      toBeNull: function() {
        if (expected === null) {
          throw new Error(`Expected ${expected} not to be null`);
        }
      },
      toBePositiveInfinity: function() {
        if (expected === Number.POSITIVE_INFINITY) {
          throw new Error(`Expected ${expected} not to be +Infinity`);
        }
      },
      toBeUndefined: function() {
        if (expected === undefined) {
          throw new Error(`Expected ${expected} not to be undefined`);
        }
      },
      toBeTruthy: function() {
        if (!!expected) {
          throw new Error(`Expected ${expected} not to be truthy`);
        }
      },
      toBeFalsy: function() {
        if (!expected) {
          throw new Error(`Expected ${expected} not to be falsy`);
        }
      },
      toContain: function(actual: any) {
        if (expected.indexOf(actual) !== -1) {
          throw new Error(`Expected ${expected} not to contain ${actual}`);
        }
      },
      toMatch: function(actual: any) {
        if (toMatch(actual, expected)) {
          throw new Error(`Expected ${expected} not to match ${actual}`);
        }
      },
      toBeCalled: function() {
        if (expected.calls.count() > 0) {
          throw new Error(`Expected ${expected} to not been called`);
        }
      },
      toHaveBeenCalled: function() {
        if (expected.calls.count() > 0) {
          throw new Error(`Expected ${expected} to not been called`);
        }
      },
      toBeCalledWith: function(params: any[]) {
        if (expected.calls.allArgs().filter((args: any) => eq(args, params)).length > 0) {
          throw new Error(`Expected ${expected.calls.allArgs()} to not been called with ${params}`);
        }
      },
      toHaveBeenCalledWith: function(params: any[]) {
        if (expected.calls.allArgs().filter((args: any) => eq(args, params)).length > 0) {
          throw new Error(`Expected ${expected.calls.allArgs()} to not been called with ${params}`);
        }
      }
    }
  };
}

function buildResolveRejects(key: string, matchers: any, expected: any, isNot = false) {
  if (matchers.hasOwnProperty(key)) {
    const resolveFnFactory = function(isNot = false) {
      return function() {
        const self = this;
        const args = Array.prototype.slice.call(arguments);
        return expected.then(
            (value: any) => {
              const newMatchers: any = getMatchers(value);
              return isNot ? newMatchers.not[key].apply(self, args) :
                             newMatchers[key].apply(self, args);
            },
            (error: any) => {
              throw error;
            });
      };
    };
    if (isNot) {
      matchers.resolves.not[key] = resolveFnFactory(true);
    } else {
      matchers.resolves[key] = resolveFnFactory();
    }
    const rejectFnFactory = function(isNot = false) {
      return function() {
        const self = this;
        const args = Array.prototype.slice.call(arguments);
        return expected.then((value: any) => {}, (error: any) => {
          const newMatchers: any = getMatchers(error);
          return isNot ? newMatchers.not[key].apply(self, args) :
                         newMatchers[key].apply(self, args);
        });
      };
    };
    if (isNot) {
      matchers.rejects.not[key] = rejectFnFactory(true);
    } else {
      matchers.rejects[key] = rejectFnFactory();
    }
  }
}
function addExpect(global: any, jasmine: any) {
  jasmine.__zone_symbol__expect_assertions = 0;
  global['expect'] = jasmine['__zone_symbol__expect'] = function(expected: any) {
    jasmine.__zone_symbol__expect_assertions++;
    const matchers: any = getMatchers(expected);
    if (expected && typeof expected.then === 'function') {
      // expected maybe a promise
      matchers.resolves = {not: {}};
      matchers.rejects = {not: {}};
      Object.keys(matchers).forEach(key => {
        buildResolveRejects(key, matchers, expected);
      });
      Object.keys(matchers.not).forEach(key => {
        buildResolveRejects(key, matchers, expected, true);
      });
    }
    buildCustomMatchers(matchers, jasmine, expected);
    return matchers;
  };
}