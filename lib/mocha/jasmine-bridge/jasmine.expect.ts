/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {addCustomEqualityTester, Any, customEqualityTesters, eq, ObjectContaining} from './jasmine.util';

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
  const util = {equals: eq};
  const originalExcept = jasmine['__zone_symbol__expect'];
  jasmine.addMatchers = function(customMatcher: any) {
    let customMatchers = jasmine['__zone_symbol__customMatchers'];
    if (!customMatchers) {
      customMatchers = jasmine['__zone_symbol__customMatchers'] = [];
    }
    customMatchers.push(customMatcher);
    global['expect'] = function(expected: any) {
      const expectObj = originalExcept.call(this, expected);
      customMatchers.forEach((matcher: any) => {
        Object.keys(matcher).forEach(key => {
          if (matcher.hasOwnProperty(key)) {
            const customExpected = matcher[key](util, customEqualityTesters);
            expectObj[key] = function(actual: any) {
              return customExpected.compare(expected, actual);
            };
            expectObj['not'][key] = function(actual: any) {
              return !customExpected.compare(expected, actual);
            };
          }
        });
      });
      return expectObj;
    };
  };
}

function addExpect(global: any, jasmine: any) {
  global['expect'] = jasmine['__zone_symbol__expect'] = function(expected: any) {
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
      toHaveBeenCalled: function() {
        if (expected.calls.count() === 0) {
          throw new Error(`Expected ${expected} to been called`);
        }
      },
      toHaveBeenCalledWith: function(...params: any[]) {
        if (expected.calls.allArgs().filter((args: any) => eq(args, params)).length === 0) {
          throw new Error(`Expected ${expected} to been called with ${params}`);
        }
      },
      toMatch: function(actual: any) {
        if (!new RegExp(actual).test(expected)) {
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
          if (new RegExp(actual).test(expected)) {
            throw new Error(`Expected ${expected} not to match ${actual}`);
          }
        },
        toHaveBeenCalled: function() {
          if (expected.calls.count() > 0) {
            throw new Error(`Expected ${expected} to not been called`);
          }
        },
        toHaveBeenCalledWith: function(params: any[]) {
          if (expected.calls.allArgs().filter((args: any) => eq(args, params)).length > 0) {
            throw new Error(`Expected ${expected} to not been called with ${params}`);
          }
        }
      }
    };
  };
}