/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

'use strict';

Zone.__load_patch('Mocha', (global: any, Zone: ZoneType, api: _ZonePrivate) => {
  const Mocha = global.Mocha;
  const jasmine = global.jasmine;

  if (typeof Mocha === 'undefined') {
    return;
  }

  if (Mocha['__zone_symbol__isBridge']) {
    return;
  }

  if (jasmine && !jasmine['__zone_symbol__isBridge']) {
    return;
  }

  if (typeof Zone === 'undefined') {
    throw new Error('Missing Zone.js');
  }

  const ProxyZoneSpec = (Zone as any)['ProxyZoneSpec'];
  const SyncTestZoneSpec = (Zone as any)['SyncTestZoneSpec'];
  const FakeAsyncTestZoneSpec = (Zone as any)['FakeAsyncTestZoneSpec'];

  if (!ProxyZoneSpec) {
    throw new Error('Missing ProxyZoneSpec');
  }

  if (Mocha['__zone_patch__']) {
    throw new Error('"Mocha" has already been patched with "Zone".');
  }

  Mocha['__zone_patch__'] = true;

  const rootZone = Zone.current;
  const syncZone = rootZone.fork(new SyncTestZoneSpec('Mocha.describe'));
  let testZone: Zone = null;
  let testZoneSpec: ZoneSpec = null;
  let suiteZoneSpec: ZoneSpec = new ProxyZoneSpec();
  const suiteZone = rootZone.fork(suiteZoneSpec);

  function modifyArguments(args: IArguments, syncTest: Function, asyncTest?: Function): any[] {
    for (let i = 0; i < args.length; i++) {
      let arg = args[i];
      if (typeof arg === 'function') {
        // The `done` callback is only passed through if the function expects at
        // least one argument.
        // Note we have to make a function with correct number of arguments,
        // otherwise mocha will
        // think that all functions are sync or async.
        args[i] = (arg.length === 0) ? syncTest(arg) : asyncTest(arg);
        // Mocha uses toString to view the test body in the result list, make sure we return the
        // correct function body
        args[i].toString = function() {
          return arg.toString();
        };
      }
    }

    return args as any;
  }

  function wrapDescribeInZone(args: IArguments): any[] {
    const syncTest: any = function(fn: Function) {
      return function() {
        if (this && this instanceof Mocha.Suite) {
          // add an afterAll hook to clear spies.
          this.afterAll('afterAll clear spies', () => {
            Mocha.clearSpies(this);
          });
          this.afterEach('afterEach clear spies', function() {
            if (this.test && this.test.ctx && this.test.currentTest) {
              Mocha.clearSpies(this.test.ctx.currentTest);
              if (Mocha.__zone_symbol__afterEach) {
                Mocha.__zone_symbol__afterEach.forEach((afterEachCallback: any) => {
                  afterEachCallback(this.test.ctx.currentTest);
                });
              }
            }
          });
          Mocha.__zone_symbol__suite = this;
        }
        return syncZone.run(fn, this, arguments as any as any[]);
      };
    };

    return modifyArguments(args, syncTest);
  }

  function beforeTest(ctx: any, testBody: any) {
    registerCurrentTestBeforeTest(ctx);
    checkTimeout(ctx && ctx.test);
    return checkIsFakeAsync(testBody);
  }

  function checkTimeout(test: any) {
    if (test && typeof test.timeout === 'function' &&
        typeof Mocha.__zone_symbol__TIMEOUT === 'number') {
      test.timeout(Mocha.__zone_symbol__TIMEOUT);
      // clear timeout, until user set jasmine.DEFAULT_TIMEOUT_INTERVAL again
      Mocha.__zone_symbol__TIMEOUT = null;
    }
  }

  function registerCurrentTestBeforeTest(ctx: any) {
    Mocha.__zone_symbol__current_ctx = ctx;
    if (ctx && ctx.test && ctx.test.ctx && ctx.test.ctx.currentTest) {
      Mocha.__zone_symbol__test = ctx.test.ctx.currentTest;
    }
  }

  function checkIsFakeAsync(testBody: any) {
    const jasmine = global.jasmine;
    const isClockInstalled = jasmine && !!jasmine[api.symbol('clockInstalled')];
    if (isClockInstalled) {
      // auto run a fakeAsync
      const fakeAsyncModule = (Zone as any)[api.symbol('fakeAsyncTest')];
      if (fakeAsyncModule && typeof fakeAsyncModule.fakeAsync === 'function') {
        testBody = fakeAsyncModule.fakeAsync(
            testBody, {checkNested: false, checkRemainingMacrotasks: false});
      }
    }
    return testBody;
  }

  function wrapTestInZone(args: IArguments): any[] {
    const timeoutArgs = args.length > 0 ? args[args.length - 1] : null;
    const asyncTest = function(fn: Function) {
      return function(done: Function) {
        if (this && typeof this.timeout === 'function' && typeof timeoutArgs === 'number') {
          this.timeout(timeoutArgs);
        }
        fn = beforeTest(this, fn);
        return testZone.run(fn, this, [done]);
      };
    };

    const syncTest: any = function(fn: Function) {
      return function() {
        fn = beforeTest(this, fn);
        return testZone.run(fn, this);
      };
    };

    return modifyArguments(args, syncTest, asyncTest);
  }

  function wrapSuiteInZone(args: IArguments): any[] {
    const asyncTest = function(fn: Function) {
      return function(done: Function) {
        fn = beforeTest(this, fn);
        return suiteZone.run(fn, this, [done]);
      };
    };

    const syncTest: any = function(fn: Function) {
      return function() {
        fn = beforeTest(this, fn);
        return suiteZone.run(fn, this);
      };
    };

    return modifyArguments(args, syncTest, asyncTest);
  }

  Mocha.getCurrentTestInfo = function() {
    return {suite: Mocha.__zone_symbol__suite, test: Mocha.__zone_symbol__test};
  };

  Mocha.clearSpies = function() {};

  function patchGlobal() {
    const mochaOriginal = {
      after: Mocha[api.symbol('after')] || Mocha.after,
      afterEach: Mocha[api.symbol('afterEach')] || Mocha.afterEach,
      before: Mocha[api.symbol('before')] || Mocha.before,
      beforeEach: Mocha[api.symbol('beforeEach')] || Mocha.beforeEach,
      describe: Mocha[api.symbol('describe')] || Mocha.describe,
      it: Mocha[api.symbol('it')] || Mocha.it
    };
    /*if (!Mocha[api.symbol('describe')]) {
      Mocha[api.symbol('describe')] = Mocha['describe'];
    }
    if (!Mocha[api.symbol('after')]) {
      Mocha[api.symbol('after')] = Mocha['after'];
    }
    if (!Mocha[api.symbol('afterEach')]) {
      Mocha[api.symbol('afterEach')] = Mocha['afterEach'];
    }
    if (!Mocha[api.symbol('before')]) {
      Mocha[api.symbol('before')] = Mocha['before'];
    }
    if (!Mocha[api.symbol('beforeEach')]) {
      Mocha[api.symbol('beforeEach')] = Mocha['beforeEach'];
    }
    if (!Mocha[api.symbol('it')]) {
      Mocha[api.symbol('it')] = Mocha['it'];
    }*/

    global.describe = global.suite = Mocha.describe = function () {
      return mochaOriginal.describe.apply(this, wrapDescribeInZone(arguments));
    };

    global.xdescribe = global.suite.skip = Mocha.describe.skip = function () {
      return mochaOriginal.describe.skip.apply(this, wrapDescribeInZone(arguments));
    };

    global.describe.only = global.suite.only = Mocha.describe.only = function () {
      return mochaOriginal.describe.only.apply(this, wrapDescribeInZone(arguments));
    };

    global.it = global.specify = global.test = Mocha.it = function () {
      return mochaOriginal.it.apply(this, wrapTestInZone(arguments));
    };

    global.xit = global.xspecify = Mocha.it.skip = function () {
      return mochaOriginal.it.skip.apply(this, wrapTestInZone(arguments));
    };

    global.it.only = global.test.only = Mocha.it.only = function () {
      return mochaOriginal.it.only.apply(this, wrapTestInZone(arguments));
    };

    global.after = global.suiteTeardown = Mocha.after = function () {
      return mochaOriginal.after.apply(this, wrapSuiteInZone(arguments));
    };

    global.afterEach = global.teardown = Mocha.afterEach = function () {
      return mochaOriginal.afterEach.apply(this, wrapTestInZone(arguments));
    };

    global.before = global.suiteSetup = Mocha.before = function () {
      return mochaOriginal.before.apply(this, wrapSuiteInZone(arguments));
    };

    global.beforeEach = global.setup = Mocha.beforeEach = function () {
      return mochaOriginal.beforeEach.apply(this, wrapTestInZone(arguments));
    };
  }

  if (typeof Mocha.describe === 'function') {
    patchGlobal();
  }
  ((originalRunTest, originalRun, originalMochaRun) => {
    Mocha.prototype.run = function () {
      if (this.suite) {
        this.suite.on('pre-require', () => {
          patchGlobal();
        });
      }
      return originalMochaRun.apply(this, arguments);
    }
    Mocha.Runner.prototype.runTest = function(fn: Function) {
      Zone.current.scheduleMicroTask('mocha.forceTask', () => {
        originalRunTest.call(this, fn);
      });
    };

    Mocha.Runner.prototype.run = function(fn: Function) {
      this.on('test', (e: any) => {
        testZoneSpec = new ProxyZoneSpec();
        testZone = rootZone.fork(testZoneSpec);
      });

      this.on('fail', (test: any, err: any) => {
        const proxyZoneSpec = testZone && testZone.get('ProxyZoneSpec');
        if (proxyZoneSpec && err) {
          err.message += proxyZoneSpec.getAndClearPendingTasksInfo();
        }
      });

      return originalRun.call(this, fn);
    };
  })(Mocha.Runner.prototype.runTest, Mocha.Runner.prototype.run, Mocha.prototype.run);
});
