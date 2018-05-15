/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
// a simple version of jasmine spy
import {cloneArgs, eq} from './jasmine.util';
export function addJasmineSpy(jasmine: any, Mocha: any, global: any) {
  let order = 0;
  function nextOrder() {
    return order++;
  }

  interface CallContext {
    object: any;
    invocationOrder: number;
    args: any[];
    returnValue?: any;
  }
  interface SpyStrategyOptions {
    identity?: string;
    originalFn?: Function;
    getSpy?: Function;
    plan?: Function;
    customStrategies?: {[k: string]: Function};
  }
  class CallTracker {
    private calls: CallContext[] = [];
    private opts: {cloneArgs?: boolean} = {};

    track(context: CallContext) {
      if (this.opts.cloneArgs) {
        context.args = cloneArgs(context.args);
      }
      this.calls.push(context);
    }

    any() {
      return !!this.calls.length;
    }

    count() {
      return this.calls.length;
    }

    argsFor(index: number) {
      const call = this.calls[index];
      return call ? call.args : [];
    };

    all() {
      return this.calls;
    }

    allArgs() {
      return this.calls.map(call => call.args);
    }

    first() {
      return this.calls[0];
    }

    mostRecent() {
      return this.calls[this.calls.length - 1];
    }

    reset() {
      this.calls = [];
    }

    saveArgumentsByValue() {
      this.opts.cloneArgs = true;
    }
  }
  class SpyStrategy {
    private plan: any;
    private _defaultPlan: any;
    public identity: string;
    public originalFn: Function;
    constructor(private options: SpyStrategyOptions = {}) {
      this.identity = this.options.identity || 'unknown';
      this.originalFn = this.options.originalFn || function() {};
      this.options.getSpy = this.options.getSpy || function() {};
      this.plan = this._defaultPlan = this.options.plan || function() {};

      if (this.options.customStrategies) {
        for (let k in this.options.customStrategies) {
          if ((this as any)[k]) {
            continue;
          }
          const factory = this.options.customStrategies[k];
          (this as any)[k] = function() {
            const plan = factory.apply(null, arguments);
            this.plan = plan;
            return this.getSpy();
          };
        }
      }
    }

    exec(context: any, args: any) {
      return this.plan.apply(context, args);
    }

    getSpy() {
      return this.options.getSpy!();
    }

    callThrough() {
      this.plan = this.originalFn;
      return this.getSpy();
    }

    returnValue(value: any) {
      this.plan = function() {
        return value;
      };
      return this.getSpy();
    };

    returnValues() {
      const values = Array.prototype.slice.call(arguments);
      this.plan = function() {
        return values.shift();
      };
      return this.getSpy();
    };

    throwError(something: any) {
      const error = (something instanceof Error) ? something : new Error(something);
      this.plan = function() {
        throw error;
      };
      return this.getSpy();
    };

    callFake(fn: Function) {
      this.plan = fn;
      return this.getSpy();
    };

    stub(fn: Function) {
      this.plan = function() {};
      return this.getSpy();
    };

    isConfigured() {
      return this.plan !== this._defaultPlan;
    };
  }

  class SpyStrategyDispatcher {
    private baseStrategy: SpyStrategy;
    public and: SpyStrategy;
    public withArgs: () => {
      and: SpyStrategy
    };
    private strategyDict: SpyStrategyDict;
    constructor(private args: SpyStrategyOptions) {
      this.baseStrategy = new SpyStrategy(args);
      this.and = this.baseStrategy;
      this.strategyDict = new SpyStrategyDict(function() {
        return new SpyStrategy(args);
      });
      const self = this;
      this.withArgs = function() {
        return {and: self.strategyDict.getOrCreate(Array.prototype.slice.call(arguments))};
      };
    }

    updateArgs(newArgs: SpyStrategyOptions) {
      if (newArgs.identity) {
        this.args.identity = newArgs.identity;
        this.baseStrategy.identity = newArgs.identity;
        this.and.identity = newArgs.identity;
      }
      if (newArgs.originalFn) {
        this.args.originalFn = newArgs.originalFn;
        this.baseStrategy.originalFn = newArgs.originalFn;
        this.and.originalFn = newArgs.originalFn;
      }
    }

    exec(spy: any, args: any) {
      let strategy = this.strategyDict.get(args);
      if (!strategy) {
        strategy = this.baseStrategy;
      }
      return strategy.exec(spy, args);
    }
  }

  class SpyStrategyDict {
    private strategies: {args: any[], strategy: SpyStrategy}[] = [];
    constructor(private strategyFactory: () => SpyStrategy) {}

    any() {
      return this.strategies.length > 0;
    }

    get(args: any[]) {
      for (let i = 0; i < this.strategies.length; i++) {
        const dictArgs = this.strategies[i].args;
        if (eq(dictArgs, args)) {
          return this.strategies[i].strategy;
        }
      }
    }

    getOrCreate(args: any[]) {
      let strategy = this.get(args);
      if (!strategy) {
        strategy = this.strategyFactory();
        this.strategies.push({args, strategy});
      }
      return strategy;
    }
  }

  function Spy(name: string, originalFn?: Function, customStrategies?: {[key: string]: Function}) {
    const calls = new CallTracker();
    const spyStrategyDispatcher = new SpyStrategyDispatcher(
        {identity: name, originalFn, getSpy: () => wrapper, customStrategies});
    const spy = function() {
      const callContext: CallContext = {
        object: this,
        invocationOrder: nextOrder(),
        args: Array.prototype.slice.call(arguments)
      };
      calls.track(callContext);
      const returnValue = spyStrategyDispatcher.exec(this, arguments);
      callContext.returnValue = returnValue;
      return returnValue;
    };
    const wrapper: any = function() {
      return spy.apply(this, arguments);
    };
    if (originalFn) {
      for (let prop in originalFn) {
        wrapper[prop] = (originalFn as any)[prop];
      }
    }
    wrapper.calls = calls;
    wrapper.and = spyStrategyDispatcher.and;
    wrapper.withArgs = function() {
      return spyStrategyDispatcher.withArgs.apply(spyStrategyDispatcher, arguments);
    };
    wrapper.updateArgs = function(newArgs: SpyStrategyOptions) {
      spyStrategyDispatcher.updateArgs(newArgs);
    };
    return wrapper;
  }

  class SpyRegistry {
    registeredSpies: {suite: any, test: any, spy: any, unRegister: Function}[] = [];
    register(spy: any, unRegister: Function) {
      const currentTestInfo = Mocha.getCurrentTestInfo();
      this.registeredSpies.push({
        suite: currentTestInfo.suite,
        test: currentTestInfo.test,
        spy: spy,
        unRegister: unRegister
      });
    }

    clearAllSpies() {
      if (this.registeredSpies.length === 0) {
        return;
      }
      this.registeredSpies.forEach(spy => spy.unRegister());
      this.registeredSpies.length = 0;
    }

    clearSpies(testInfo: any) {
      if (this.registeredSpies.length === 0) {
        return;
      }
      let isSuite = false;
      if (testInfo instanceof Mocha.Suite) {
        isSuite = true;
      }
      for (let i = this.registeredSpies.length - 1; i--; i >= 0) {
        const registerSpy = this.registeredSpies[i];
        if ((isSuite && registerSpy.suite === testInfo) ||
            (!isSuite && registerSpy.test === testInfo)) {
          registerSpy.unRegister();
          this.registeredSpies.splice(i, 1);
        }
      }
    }
  }

  const spyRegistry = new SpyRegistry();
  Mocha.clearSpies = function(testInfo: any) {
    spyRegistry.clearSpies(testInfo);
  };

  Mocha.clearAllSpies = function() {
    spyRegistry.clearAllSpies();
  };

  jasmine.createSpy = function(spyName: string|Function, originalFn?: Function) {
    if (typeof spyName === 'function') {
      originalFn = spyName;
      spyName = (spyName as any).name;
    }
    return Spy(spyName as string, originalFn);
  };

  jasmine.createSpyObj = function(
      baseName: string|string[]|{[key: string]: any}, methodNames: string[]|{[key: string]: any}) {
    if (typeof baseName !== 'string' && !methodNames) {
      methodNames = baseName;
      baseName = 'unknown';
    }
    const obj: any = {};
    if (Array.isArray(methodNames)) {
      methodNames.forEach(methodName => {
        obj[methodName] = jasmine.createSpy(baseName + '.' + methodName);
      });
    } else {
      for (let key in methodNames) {
        if (methodNames.hasOwnProperty(key)) {
          obj[key] = jasmine.createSpy(baseName + '.' + key);
          obj[key].and.returnValue(methodNames[key]);
        }
      }
    }
    return obj;
  };

  global['spyOn'] = jasmine.spyOn = function(obj: any, methodName: string) {
    if (!obj || !methodName || !obj[methodName]) {
      throw new Error(
          `Can not find a valid object ${obj} or a method name ${methodName} to spy on.`);
    }
    const originalMethod: Function = obj[methodName];
    const spiedMethod = jasmine.createSpy(methodName, originalMethod);
    spyRegistry.register(spiedMethod, () => {
      obj[methodName] = originalMethod;
    });
    obj[methodName] = spiedMethod;
    return spiedMethod;
  };

  global['spyOnProperty'] =
      jasmine.spyOnProperty = function(obj: any, propertyName: string, accessType: string) {
        if (!obj || !propertyName || !obj[propertyName]) {
          throw new Error(
              `Can not find a valid object ${obj} or a property name ${propertyName} to spy on.`);
        }
        const originalDesc = Object.getOwnPropertyDescriptor(obj, propertyName);
        const originalAccess = (originalDesc as any)[accessType];
        const spiedAccess = jasmine.createSpy(propertyName, (originalDesc as any)[accessType]);
        spyRegistry.register(spiedAccess, () => {
          (orientation as any)[accessType] = originalAccess;
        });
        (originalDesc as any)[accessType] = spiedAccess;
        return spiedAccess;
      };
}
