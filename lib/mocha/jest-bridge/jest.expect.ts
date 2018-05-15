/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {Any, eq, toMatch} from '../jasmine-bridge/jasmine.util';
export function expandExpect(global: any) {
  const jasmine = global.jasmine;
  const expect: any = global.expect;

  class Anything {}

  expect.anything = function() {
    return new Anything();
  };

  expect.any = function(obj: any) {
    return new Any(obj);
  };

  class ArrayContaining {
    constructor(public expectedArray: any[]) {}
  }

  expect.arrayContaining = function(expectedArray: string[]) {
    return new ArrayContaining(expectedArray);
  };

  class ObjectContaining {
    constructor(public expectedObject: any) {}
  }

  expect.objectContaining = function(expectedObject: any) {
    return new ObjectContaining(expectedObject);
  };

  class StringContaining {
    constructor(public expectedString: string) {}
  }

  expect.stringContaining = function(expectedString: string) {
    return new StringContaining(expectedString);
  };

  class StringMatching {
    constructor(public expectedMatcher: RegExp|string) {}
  }

  expect.stringMatching = function(expectedMatcher: RegExp|string) {
    return new StringMatching(expectedMatcher);
  };

  const assertions: {test: any, numbers: number}[] = (expect as any).__zone_symbol__assertionsMap =
      [];

  jasmine.addCustomEqualityTester((a: any, b: any) => {
    if (b instanceof Anything) {
      if (a === null || a === undefined) {
        return false;
      }
      return true;
    }
    if (b instanceof Any) {
      return b.eq(a);
    }
    if (b instanceof ArrayContaining && Array.isArray(a)) {
      for (let i = 0; i < b.expectedArray.length; i++) {
        let found = false;
        const bitem = b.expectedArray[i];
        for (let j = 0; j < a.length; j++) {
          if (eq(a[j], bitem)) {
            found = true;
            break;
          }
        }
        if (!found) {
          return false;
        }
      }
      return true;
    }
    if (b instanceof ObjectContaining) {
      Object.keys(b.expectedObject).forEach(key => {
        if (b.expectedObject.hasOwnProperty(key)) {
          if (!eq(a[key], b.expectedObject[key]) || !toMatch(a[key], b.expectedObject[key])) {
            return false;
          }
        }
      });
      return true;
    }
    if (b instanceof StringContaining) {
      let astr = a;
      if (typeof a !== 'string') {
        astr = Object.prototype.toString.call(a);
      }
      if (!astr) {
        return false;
      }
      return astr.indexOf(b.expectedString) !== -1;
    }
    if (b instanceof StringMatching) {
      let astr = a;
      if (typeof a !== 'string') {
        astr = Object.prototype.toString.call(a);
      }
      return toMatch(astr, b.expectedMatcher);
    }
  });

  expect.extend = function(extendedMatchers: any) {
    const jasmineMatchers: any = {};
    Object.keys(extendedMatchers).forEach(key => {
      if (extendedMatchers.hasOwnProperty(key)) {
        const matcher = extendedMatchers[key];
        jasmineMatchers[key] = function(util: any, customEqualityTester: any) {
          return {
            compare: function(actual: any, expected: any) {
              return matcher(actual, expected);
            }
          };
        };
      }
    });
    jasmine.addMatchers(jasmineMatchers);
  };

  jasmine.addMatchers({
    toHaveBeenCalledTimes: function(util: any, customEqualityTester: any) {
      return {
        compare: function(actual: any, expected: any) {
          return {pass: actual.calls.count() === expected};
        }
      };
    },
    lastCalledWith: function(util: any, customEqualityTester: any) {
      return {
        compare: function(actual: any, expected: any) {
          return {pass: util.equals(actual.calls.last().args, expected)};
        }
      };
    },
    toHaveBeenLastCalledWith: function(util: any, customEqualityTester: any) {
      return {
        compare: function(actual: any, expected: any) {
          return {pass: util.equals(actual.calls.last().args, expected)};
        }
      };
    },
    toBeInstanceOf: function(util: any, customEqualityTester: any) {
      return {
        compare: function(actual: any, expected: any) {
          return {pass: actual instanceof expected};
        }
      };
    },
    toContainEqual: function(util: any, customEqualityTester: any) {
      return {
        compare: function(actual: any, expected: any) {
          if (!Array.isArray(actual)) {
            return {pass: false};
          }
          return {pass: actual.filter(a => util.equals(a, expected)).length > 0};
        }
      };
    },
    toHaveLength: function(util: any, customEqualityTester: any) {
      return {
        compare: function(actual: any, expected: any) {
          return {pass: actual.length === expected};
        }
      };
    },
    toHaveProperty: function(util: any, customEqualityTester: any) {
      return {
        compare: function(actual: any, expected: any, expectedValue: any) {
          const split: string[] = Array.isArray(expected) ? expected : expected.split('.');
          let value = null;
          let hasKey = false;
          for (let i = 0; i < split.length; i++) {
            const prop = split[i];
            const isIndex = typeof prop === 'number';
            if (value) {
              hasKey = isIndex ? Array.isArray(value) && (value as any).length > prop :
                                 Object.keys(value).filter(a => util.equals(a, prop)).length > 0;
              value = value[prop];
            } else {
              hasKey = isIndex ? Array.isArray(actual) && (actual as any).length > prop :
                                 Object.keys(actual).filter(a => util.equals(a, prop)).length > 0;
              value = actual[prop];
            }
            if (!hasKey) {
              return {pass: false};
            }
          }

          if (expectedValue !== undefined) {
            return {pass: util.equals(expectedValue, value)};
          } else {
            return {pass: true};
          }
        }
      };
    },
    toMatchObject: function(util: any, customEqualityTester: any) {
      return {
        compare: function(actual: any, expected: any) {
          Object.keys(expected).forEach(key => {
            if (expected.hasOwnProperty(key)) {
              if (!util.equals(actual[key], expected[key]) &&
                  !util.toMatch(actual[key], expected[key])) {
                return {pass: false};
              }
            }
          });
          return {pass: true};
        }
      };
    },
  });

  expect.assertions = function(numbers: number) {
    if (typeof numbers !== 'number') {
      return;
    }
    const currentTest = global.Mocha.__zone_symbol__test;
    assertions.push({test: currentTest, numbers});
  };

  expect.hasAssertions = function() {
    const currentTest = global.Mocha.__zone_symbol__test;
    assertions.push({test: currentTest, numbers: 1});
  };

  if (!global.Mocha.__zone_symbol__afterEach) {
    global.Mocha.__zone_symbol__afterEach = [];
  }

  global.Mocha.__zone_symbol__afterEach.push((test: any) => {
    // check assertions
    for (let i = 0; i < assertions.length; i++) {
      const ass = assertions[i];
      if (ass.test === test) {
        assertions.splice(i, 1);
        const actual = jasmine.__zone_symbol__expect_assertions;
        jasmine.__zone_symbol__expect_assertions = 0;
        if (ass.numbers != actual) {
          throw new Error(`Assertions failed, expect should be called ${
              ass.numbers} times, it was actual called ${actual} times.`);
        }
        return;
      }
    }
  });
}
