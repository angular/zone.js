/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {addCustomEqualityTester, Any, buildFailureMessage, customEqualityTesters, eq, ObjectContaining, toMatch} from './jasmine.util';

export function addJasmineExpect(jasmine: any, global: any) {
  jasmine['__zone_symbol__customMatchers'] = [];
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
  jasmine.addMatchers = function(customMatcher: any) {
    let customMatchers = getCustomMatchers(jasmine);
    customMatchers.push(customMatcher);
  };
}

function getCustomMatchers(jasmine: any) {
  return jasmine['__zone_symbol__customMatchers'];
}

function buildCustomMatchers(jasmine: any, actual: any) {
  const matchers: any = {not: {}};
  const util = {equals: eq, toMatch: toMatch, buildFailureMessage: buildFailureMessage};
  let customMatchers: any = getCustomMatchers(jasmine);
  customMatchers.forEach((matcher: any) => {
    Object.keys(matcher).forEach(key => {
      if (matcher.hasOwnProperty(key)) {
        const customMatcher = matcher[key](util, customEqualityTesters);
        matchers[key] = function(...expects: any[]) {
          const args = expects ? [...expects] : [];
          args.unshift(actual);
          const result = customMatcher.compare.apply(null, args);
          if (!result.pass) {
            const message = result.messge || util.buildFailureMessage(key, false, actual, expects);
            throw new Error(message);
          }
        };
        matchers['not'][key] = function(...expects: any[]) {
          const args = expects ? [...expects] : [];
          args.unshift(actual);
          const result = customMatcher.compare.apply(null, args);
          if (result.pass) {
            const message = result.messge || util.buildFailureMessage(key, true, actual, expects);
            throw new Error(message);
          }
        };
      }
    });
  });
  return matchers;
}

function getMatchers() {
  return {
    nothing: function() {
      return {compare: (actual: any) => ({pass: true})};
    },
    toBe: function() {
      return {compare: (actual: any, expected: any) => ({pass: actual === expected})};
    },
    toBeCloseTo: function() {
      return {
        compare: function(actual: any, expected: any, precision: any) {
          if (precision !== 0) {
            precision = precision || 2;
          }
          const pow = Math.pow(10, precision + 1);
          const delta = Math.abs(expected - actual);
          const maxDelta = Math.pow(10, -precision) / 2;
          return {pass: Math.round(delta * pow) / pow <= maxDelta};
        }
      };
    },
    toEqual: function() {
      return {compare: (actual: any, expected: any) => ({pass: eq(actual, expected)})};
    },
    toBeGreaterThan: function() {
      return {compare: (actual: any, expected: any) => ({pass: actual > expected})};
    },
    toBeGreaterThanOrEqual: function() {
      return {compare: (actual: any, expected: any) => ({pass: actual >= expected})};
    },
    toBeLessThan: function() {
      return {compare: (actual: any, expected: any) => ({pass: actual < expected})};
    },
    toBeLessThanOrEqual: function() {
      return {compare: (actual: any, expected: any) => ({pass: actual <= expected})};
    },
    toBeDefined: function() {
      return {compare: (actual: any) => ({pass: actual !== undefined})};
    },
    toBeNaN: function() {
      return {compare: (actual: any) => ({pass: actual !== actual})};
    },
    toBeNegativeInfinity: function() {
      return {compare: (actual: any) => ({pass: actual === Number.NEGATIVE_INFINITY})};
    },
    toBeNull: function() {
      return {compare: (actual: any) => ({pass: actual === null})};
    },
    toBePositiveInfinity: function() {
      return {compare: (actual: any) => ({pass: actual === Number.POSITIVE_INFINITY})};
    },
    toBeUndefined: function() {
      return {compare: (actual: any) => ({pass: actual === undefined})};
    },
    toThrow: function() {
      return {
        compare: (actual: any, expected: any) => {
          let pass = false;
          try {
            if (typeof actual === 'function') {
              actual();
            } else {
              pass = (!expected && actual instanceof Error) || eq(actual, expected);
            }
          } catch (error) {
            pass = !expected || eq(error, expected);
          }
          return {pass};
        }
      };
    },
    toThrowError: function() {
      return {
        compare: (actual: any) => {
          let pass = false;
          try {
            if (typeof actual === 'function') {
              actual();
            } else {
              pass = actual instanceof Error;
            }
          } catch (error) {
            pass = true;
          }
          return {pass};
        }
      };
    },
    toBeTruthy: function() {
      return {compare: (actual: any) => ({pass: !!actual})};
    },
    toBeFalsy: function() {
      return {compare: (actual: any) => ({pass: !actual})};
    },
    toContain: function() {
      return {compare: (actual: any, expected: any) => ({pass: actual.indexOf(expected) !== -1})};
    },
    toBeCalled: function() {
      return {compare: (actual: any) => ({pass: actual.calls.count() > 0})};
    },
    toHaveBeenCalled: function() {
      return {compare: (actual: any) => ({pass: actual.calls.count() > 0})};
    },
    toBeCalledWith: function() {
      return {
        compare: (actual: any, ...expected: any[]) =>
            ({pass: actual.calls.allArgs().filter((args: any) => eq(args, expected)).length > 0})
      };
    },
    toHaveBeenCalledWith: function() {
      return {
        compare: (actual: any, ...expected: any[]) =>
            ({pass: actual.calls.allArgs().filter((args: any) => eq(args, expected)).length > 0})
      };
    },
    toMatch: function() {
      return {compare: (actual: any, expected: any) => ({pass: toMatch(actual, expected)})};
    }
  };
}

function buildResolveRejects(key: string, matchers: any, actual: any, isNot = false) {
  const resolveFnFactory = function(isNot = false) {
    return function() {
      const self = this;
      const args = Array.prototype.slice.call(arguments);
      return actual.then(
          (value: any) => {
            const newMatchers: any = buildCustomMatchers(jasmine, value);
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
      return actual.then((value: any) => {}, (error: any) => {
        const newMatchers: any = buildCustomMatchers(jasmine, error);
        return isNot ? newMatchers.not[key].apply(self, args) : newMatchers[key].apply(self, args);
      });
    };
  };
  if (isNot) {
    matchers.rejects.not[key] = rejectFnFactory(true);
  } else {
    matchers.rejects[key] = rejectFnFactory();
  }
}

function addExpect(global: any, jasmine: any) {
  jasmine.__zone_symbol__expect_assertions = 0;
  const builtinMatchers: any = getMatchers();
  const customMatchers = getCustomMatchers(jasmine);
  customMatchers.unshift(builtinMatchers);
  global['expect'] = jasmine['__zone_symbol__expect'] = function(actual: any) {
    jasmine.__zone_symbol__expect_assertions++;
    const matchers = buildCustomMatchers(jasmine, actual);
    if (actual && typeof actual.then === 'function') {
      // expected maybe a promise
      matchers.resolves = {not: {}};
      matchers.rejects = {not: {}};
      Object.keys(matchers).forEach(key => {
        if (matchers.hasOwnProperty(key)) {
          buildResolveRejects(key, matchers, actual);
        }
      });
      Object.keys(matchers.not).forEach(key => {
        if (matchers.not.hasOwnProperty(key)) {
          buildResolveRejects(key, matchers, actual, true);
        }
      });
    }
    return matchers;
  };
}