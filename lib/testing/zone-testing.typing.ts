/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * Zone testing type definition, mix jasmine/mocha/jest
 */
/**
 * Jasmine/Jest/Mocha BDD/TDD interface
 */
declare const describe: ZoneTest.Describe;
declare const xdescribe: ZoneTest.Describe;
declare const fdescribe: ZoneTest.Describe;
// alias for `describe`
declare const context: ZoneTest.Describe;
// alias for `describe`
declare const suite: ZoneTest.Describe;
declare const it: ZoneTest.Test;
declare const xit: ZoneTest.Test;
// alias for `it`
declare const test: ZoneTest.Test;
declare const specify: ZoneTest.Test;

declare const before: ZoneTest.BeforeAndAfter;
declare const beforeAll: ZoneTest.BeforeAndAfter;
declare const setup: ZoneTest.BeforeAndAfter;

declare const after: ZoneTest.BeforeAndAfter;
declare const afterAll: ZoneTest.BeforeAndAfter;
declare const teardown: ZoneTest.BeforeAndAfter;

declare const beforeEach: ZoneTest.BeforeAndAfter;
declare const suiteSetup: ZoneTest.BeforeAndAfter;

declare const afterEach: ZoneTest.BeforeAndAfter;
declare const suiteTeardown: ZoneTest.BeforeAndAfter;

declare const expect: ZoneTest.Expect;
declare function fail(error?: any): void;
declare function pending(reason?: string): void;

/**
 * Zone testing global interface for asyncTest/syncTest/fakeAsyncTest
 */

declare function asyncTest(fn: ZoneTest.BeforeAndAfter | ZoneTest.Test): (done: ZoneTest.DoneCallback) => PromiseLike<any> | void;
declare function fakeAsyncTest(fn: ZoneTest.BeforeAndAfter | ZoneTest.Test, fakeAsyncTestOptions?: {
  checkNested?: boolean, checkRemainingMacrotasks?: boolean
}): (done: ZoneTest.DoneCallback) => PromiseLike<any> | void;
declare function resetFakeAsyncZone(): void;
declare function flushMicrotasks(): void;
declare function flushAndDiscardPeriodicTasks(): void;
declare function discardPeriodicTasks(): void;
declare function tick(millis?: number, doTick?: (elapsed: number) => void): void;
declare function flush(maxTurns?: number): void;
declare function clearAllMacrotasks(): void;

declare namespace ZoneTest {
  interface DoneCallback extends Function {
    (...args: any[]): void;
    fail(error?: string | { message: string }): any;
  }

  interface TestSpecContext {
    skip(): this;
    timeout(ms: number | string): this;
    [index: string]: any;
  }

  interface Describe {
    (description: string, spec: (this: DescribeSpecContext) => void): void;
    only(description: string, spec: (this: DescribeSpecContext) => void): void;
    skip(description: string, spec: (this: DescribeSpecContext) => void): void;
  }

  interface Test {
    (description: string, callback?: (this: TestSpecContext, done?: DoneCallback) => PromiseLike<any> | void, timeout?: number): void;
    only(description: string, callback?: (this: TestSpecContext, done?: DoneCallback) => PromiseLike<any> | void): void;
    skip(description: string, callback?: (this: TestSpecContext, done?: DoneCallback) => PromiseLike<any> | void): void;
  }

  interface DescribeSpecContext {
    timeout(ms: number | string): this;
  }

  interface BeforeAndAfter {
    (callback?: (this: TestSpecContext, done?: DoneCallback) => PromiseLike<any> | void, timeout?: number): void;
    (description: string, callback?: (this: TestSpecContext, done?: DoneCallback) => PromiseLike<any> | void, timeout?: number): void;
  }

  type CustomEqualityTester = (first: any, second: any) => boolean | void;

  interface CustomMatcher {
      compare<T>(actual: T, expected: T, ...args: any[]): CustomMatcherResult;
      compare(actual: any, ...expected: any[]): CustomMatcherResult;
  }

  interface MatchersUtil {
    equals(a: any, b: any, customTesters?: CustomEqualityTester[]): boolean;
    contains<T>(haystack: ArrayLike<T> | string, needle: any, customTesters?: CustomEqualityTester[]): boolean;
    buildFailureMessage(matcherName: string, isNot: boolean, actual: any, ...expected: any[]): string;
  }

  type CustomMatcherFactory = (util: MatchersUtil, customEqualityTesters: CustomEqualityTester[]) => CustomMatcher;

  interface CustomMatcherFactories {
      [index: string]: CustomMatcherFactory;
  }

  interface CustomMatcherResult {
      pass: boolean;
      message?: string;
  }

  interface Expect {
    (actual: any): Matchers<void>;
    anything(): any;
    any(classType: any): any;
    arrayContaining(arr: any[]): any;
    assertions(num: number): void;
    hasAssertions(): void;
    extend(obj: any): void;
    objectContaining(obj: any): any;
    stringMatching(str: string | RegExp): any;
    stringContaining(str: string): any;
  }

  interface Matchers<R> {
    not: Matchers<R>;
    resolves: Matchers<Promise<R>>;
    rejects: Matchers<Promise<R>>;
    lastCalledWith(...args: any[]): R;
    toBe(expected: any): R;
    toBeCalled(): R;
    toBeCalledWith(...args: any[]): R;
    toBeCloseTo(expected: number, numDigits?: number): R;
    toBeDefined(): R;
    toBeFalsy(): R;
    toBeGreaterThan(expected: number): R;
    toBeGreaterThanOrEqual(expected: number): R;
    toBeInstanceOf(expected: any): R;
    toBeLessThan(expected: number): R;
    toBeLessThanOrEqual(expected: number): R;
    toBeNull(): R;
    toBeTruthy(): R;
    toBeUndefined(): R;
    toBeNaN(): R;
    toContain(expected: any): R;
    toContainEqual(expected: any): R;
    toEqual(expected: any): R;
    toHaveBeenCalled(): R;
    toHaveBeenCalledTimes(expected: number): R;
    toHaveBeenCalledWith(...params: any[]): R;
    toHaveBeenLastCalledWith(...params: any[]): R;
    toHaveLength(expected: number): R;
    toHaveProperty(propertyPath: string | any[], value?: any): R;
    toMatch(expected: string | RegExp): R;
    toMatchObject(expected: {} | any[]): R;
    toThrow(error?: string | RegExp | Error): R;
    toThrowError(message?: string | RegExp): boolean;
    toThrowError(expected?: new (...args: any[]) => Error, message?: string | RegExp): boolean;
  }
}

interface DoneFn extends Function {
  (): void;
  fail: (message?: Error | string) => void;
}
declare namespace jasmine {
  type SpyObjMethodNames = string[] | {[methodName: string]: any};
  let clock: () => Clock;
  function any(aclass: any): any;
  function anything(): any;
  function arrayContaining<T>(sample: ArrayLike<T>): any;
  function arrayWithExactContents<T>(sample: ArrayLike<T>): any;
  function objectContaining<T>(sample: Partial<T>): any;
  function createSpy(name?: string, originalFn?: Function): Spy;
  function createSpyObj(baseName: string, methodNames: SpyObjMethodNames): any;
  function createSpyObj<T>(baseName: string, methodNames: SpyObjMethodNames): SpyObj<T>;
  function createSpyObj(methodNames: SpyObjMethodNames): any;
  function createSpyObj<T>(methodNames: SpyObjMethodNames): SpyObj<T>;
  function addCustomEqualityTester(equalityTester: ZoneTest.CustomEqualityTester): void;
  function addMatchers(matchers: ZoneTest.CustomMatcherFactories): void;
  function pp(value: any): string;

  function getEnv(): any;
  let DEFAULT_TIMEOUT_INTERVAL: number;

  interface Clock {
    install(): void;
    uninstall(): void;
    tick(ms: number): void;
    mockDate(date?: Date): void;
  }

  interface Spy {
    (...params: any[]): any;

    identity: string;
    and: SpyAnd;
    calls: Calls;
    mostRecentCall: { args: any[]; };
    argsForCall: any[];
  }

  type SpyObj<T> = T & {
    [k in keyof T]: Spy;
  };

  interface SpyAnd {
    callThrough(): Spy;
    returnValue(val: any): Spy;
    returnValues(...values: any[]): Spy;
    callFake(fn: Function): Spy;
    throwError(msg: string): Spy;
    stub(): Spy;
  }

  interface Calls {
    any(): boolean;
    count(): number;
    argsFor(index: number): any[];
    allArgs(): any[];
    all(): CallInfo[];
    mostRecent(): CallInfo;
    first(): CallInfo;
    reset(): void;
  }

  interface CallInfo {
    object: any;
    args: any[];
    returnValue: any;
  }
}

declare function spyOn<T>(object: T, method: keyof T): jasmine.Spy;
declare function spyOnProperty<T>(object: T, property: keyof T, accessType?: 'get' | 'set'): jasmine.Spy;

declare namespace jest {
  function addMatchers(matchers: ZoneTest.CustomMatcherFactories): typeof jest;
  function clearAllMocks(): typeof jest;
  function resetAllMocks(): typeof jest;
  function restoreAllMocks(): typeof jest;
  function clearAllTimers(): typeof jest;
  function fn<T extends {}>(implementation: (...args: any[]) => T): Mock<T>;
  function fn<T>(implementation?: (...args: any[]) => any): Mock<T>;
  function isMockFunction(fn: any): fn is Mock<any>;
  function runAllTicks(): typeof jest;
  function runAllTimers(): typeof jest;
  function runOnlyPendingTimers(): typeof jest;
  function runTimersToTime(msToRun: number): typeof jest;
  function advanceTimersByTime(msToRun: number): typeof jest;
  function setTimeout(timeout: number): typeof jest;
  function spyOn<T extends {}, M extends keyof T>(object: T, method: M, accessType?: 'get' | 'set'): jasmine.Spy;
  function useFakeTimers(): typeof jest;
  function useRealTimers(): typeof jest;

  interface MockInstance<T> {
    getMockName(): string;
    mock: MockContext<T>;
    mockClear(): void;
    mockReset(): void;
    mockImplementation(fn: (...args: any[]) => any): Mock<T>;
    mockImplementationOnce(fn: (...args: any[]) => any): Mock<T>;
    mockName(name: string): Mock<T>;
    mockReturnThis(): Mock<T>;
    mockReturnValue(value: any): Mock<T>;
    mockReturnValueOnce(value: any): Mock<T>;
    mockResolvedValue(value: any): Mock<T>;
    mockResolvedValueOnce(value: any): Mock<T>;
    mockRejectedValue(value: any): Mock<T>;
    mockRejectedValueOnce(value: any): Mock<T>;
  }

  interface MockContext<T> {
    calls: any[][];
    instances: T[];
  }

  interface Mock<T = {}> extends Function, MockInstance<T> {
    new (...args: any[]): T;
    (...args: any[]): any;
  }
}

