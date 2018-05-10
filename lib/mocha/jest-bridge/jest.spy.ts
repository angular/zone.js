/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
export function mappingSpy(jest: any, jasmine: any, global: any) {
  jest.__zone_symbol__mocks = [];
  function createSpy(spyFactory: (implFn?: Function) => any, implFn?: Function) {
    const spy = spyFactory(implFn);
    spy.defaultFn = implFn;
    const instances: any[] = [];
    const mockFn: any = function MockFn() {
      if (this instanceof MockFn) {
        instances.push(this);
      } else {
        let fn = spy.defaultFn;
        if (spy.onceFns && spy.onceFns.length > 0) {
          fn = spy.onceFns.shift();
        }
        const args = Array.prototype.slice.call(arguments);
        if (fn) {
          return spy.and.callFake(fn).apply(this, args);
        } else {
          return spy.and.callThrough().apply(this, args);
        }
      }
    };
    mockFn.getMockName = function() {
      return spy.mockName || 'jestSpy';
    };
    mockFn.mockName = function(name: string) {
      spy.updateArgs({identity: name});
      spy.mockName = name;
      return this;
    };
    mockFn.mock = {instances};
    Object.defineProperty(mockFn.mock, 'calls', {
      configurable: true,
      enumerable: true,
      get: function() {
        return spy.calls.allArgs();
      }
    });
    Object.defineProperty(mockFn, 'calls', {
      configurable: true,
      enumerable: true,
      get: function() {
        return spy.calls;
      }
    });
    mockFn.mockClear = function() {
      spy.calls.length = 0;
      instances.length = 0;
      return this;
    };
    mockFn.mockReset = function() {
      spy.calls.length = 0;
      instances.length = 0;
      return this;
    };
    mockFn.mockImplementation = function(fn: Function) {
      spy.defaultFn = fn;
      return this;
    };
    mockFn.mockImplementationOnce = function(fn: Function) {
      if (!spy.onceFns) {
        spy.onceFns = [];
      }
      spy.onceFns.push(fn);
      return this;
    };
    mockFn.mockReturnThis = function() {
      return mockFn.mockImplementation(function() {
        return this;
      });
    };
    mockFn.mockReturnValue = function(value: any) {
      return mockFn.mockImplementation(function() {
        return value;
      });
    };
    mockFn.mockReturnValueOnce = function(value: any) {
      return mockFn.mockImplementationOnce(function() {
        return value;
      });
    };
    mockFn.mockResolvedValue = function(value: any) {
      return mockFn.mockReturnValue(Promise.resolve(value));
    };
    mockFn.mockResolvedValueOnce = function(value: any) {
      return mockFn.mockReturnValueOnce(Promise.resolve(value));
    };
    mockFn.mockRejectedValue = function(value: any) {
      return mockFn.mockReturnValue(Promise.reject(value));
    };
    mockFn.mockRejectedValueOnce = function(value: any) {
      return mockFn.mockReturnValueOnce(Promise.reject(value));
    };
    mockFn.mockRestore = function() {
      global.Mocha.clearSpies(global.Mocha.__zone_symbol__current_ctx);
    };

    jest.__zone_symbol__mocks.push(mockFn);
    return mockFn;
  }

  jest.fn = function(implFn?: Function) {
    return createSpy((implFn?: Function) => jasmine.createSpy('jestSpy', implFn), implFn);
  };

  jest.spyOn = function(obj: any, methodName: string, accessType?: string) {
    return accessType ? createSpy(() => global['spyOnProperty'](obj, methodName, accessType)) :
                        createSpy(() => global['spyOn'](obj, methodName));
  };

  jest.clearAllMocks = function() {
    jest.__zone_symbol__mocks.forEach((mock: any) => {
      mock.mockClear();
    });
    return jest;
  };

  jest.resetAllMocks = function() {
    jest.__zone_symbol__mocks.forEach((mock: any) => {
      mock.mockReset();
    });
    return jest;
  };

  jest.restoreAllMocks = function() {
    global.Mocha.clearAllSpies();
    return jest;
  };

  jest.isMockFunction = function(fn: Function) {
    return jest.__zone_symbol__mocks.filter((m: any) => m === fn).length > 0;
  };
}
