/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

'use strict';
import {patchJasmineClock} from './jasmine.clock';
import { mappingMochaMethods } from './mocha-bridge/mocha.bdd';
Zone.__load_patch('jasmine', (global: any) => {
  const __extends = function(d: any, b: any) {
    for (const p in b)
      if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : ((__.prototype = b.prototype), new (__ as any)());
  };
  // Patch jasmine's describe/it/beforeEach/afterEach functions so test code always runs
  // in a testZone (ProxyZone). (See: angular/zone.js#91 & angular/angular#10503)
  if (!Zone) throw new Error('Missing: zone.js');
  if (typeof jasmine == 'undefined') {
    // not using jasmine, just return;
    return;
  }
  if ((jasmine as any)['__zone_symbol__isBridge']) {
    // jasmine is a mock bridge
    return;
  }
  if ((jasmine as any)['__zone_patch__'])
    throw new Error(`'jasmine' has already been patched with 'Zone'.`);
  (jasmine as any)['__zone_patch__'] = true;

  const SyncTestZoneSpec: {new (name: string): ZoneSpec} = (Zone as any)['SyncTestZoneSpec'];
  const ProxyZoneSpec: {new (): ZoneSpec} = (Zone as any)['ProxyZoneSpec'];
  if (!SyncTestZoneSpec) throw new Error('Missing: SyncTestZoneSpec');
  if (!ProxyZoneSpec) throw new Error('Missing: ProxyZoneSpec');

  const ambientZone = Zone.current;
  // Create a synchronous-only zone in which to run `describe` blocks in order to raise an
  // error if any asynchronous operations are attempted inside of a `describe` but outside of
  // a `beforeEach` or `it`.
  const syncZone = ambientZone.fork(new SyncTestZoneSpec('jasmine.describe'));

  const symbol = Zone.__symbol__;

  // Monkey patch all of the jasmine DSL so that each function runs in appropriate zone.
  const jasmineEnv: any = jasmine.getEnv();
  ['describe', 'xdescribe', 'fdescribe'].forEach(methodName => {
    let originalJasmineFn: Function = jasmineEnv[methodName];
    jasmineEnv[methodName] = function(description: string, specDefinitions: Function) {
      return originalJasmineFn.call(this, description, wrapDescribeInZone(specDefinitions));
    };
  });
  ['it', 'xit', 'fit'].forEach(methodName => {
    let originalJasmineFn: Function = jasmineEnv[methodName];
    jasmineEnv[symbol(methodName)] = originalJasmineFn;
    jasmineEnv[methodName] = function(
        description: string, specDefinitions: Function, timeout: number) {
      const wrappedSpecDef = wrapTestInZone(specDefinitions);
      return originalJasmineFn.apply(
          this,
          typeof timeout === 'number' ? [description, wrappedSpecDef, timeout] :
                                        [description, wrappedSpecDef]);
    };
  });
  ['beforeAll', 'afterAll', 'beforeEach', 'afterEach'].forEach(methodName => {
    let originalJasmineFn: Function = jasmineEnv[methodName];
    jasmineEnv[symbol(methodName)] = originalJasmineFn;
    jasmineEnv[methodName] = function(specDefinitions: Function, timeout: number) {
      const wrappedSpecDef = wrapTestInZone(specDefinitions);
      return originalJasmineFn.apply(
          this, typeof timeout === 'number' ? [wrappedSpecDef, timeout] : [wrappedSpecDef]);
    };
  });

  patchJasmineClock(jasmine, global);
  /**
   * Gets a function wrapping the body of a Jasmine `describe` block to execute in a
   * synchronous-only zone.
   */
  function wrapDescribeInZone(describeBody: Function): Function {
    return function() {
      mappingMochaMethods(jasmine, global, this);
      return syncZone.run(describeBody, this, (arguments as any) as any[]);
    };
  }

  function runInTestZone(testBody: Function, applyThis: any, queueRunner: any, done?: Function) {
    const isClockInstalled = (jasmine as any)[symbol('clockInstalled')] === true;
    const testProxyZoneSpec = queueRunner.testProxyZoneSpec;
    const testProxyZone = queueRunner.testProxyZone;
    if (isClockInstalled) {
      // auto run a fakeAsync
      const fakeAsyncModule = (Zone as any)[Zone.__symbol__('fakeAsyncTest')];
      if (fakeAsyncModule && typeof fakeAsyncModule.fakeAsync === 'function') {
        testBody = fakeAsyncModule.fakeAsync(testBody);
      }
    }
    mappingMochaMethods(jasmine, global, applyThis);
    if (done) {
      return testProxyZone.run(testBody, applyThis, [done]);
    } else {
      return testProxyZone.run(testBody, applyThis);
    }
  }

  /**
   * Gets a function wrapping the body of a Jasmine `it/beforeEach/afterEach` block to
   * execute in a ProxyZone zone.
   * This will run in `testProxyZone`. The `testProxyZone` will be reset by the `ZoneQueueRunner`
   */
  function wrapTestInZone(testBody: Function): Function {
    // The `done` callback is only passed through if the function expects at least one argument.
    // Note we have to make a function with correct number of arguments, otherwise jasmine will
    // think that all functions are sync or async.
    return (testBody && (testBody.length ? function(done: Function) {
              return runInTestZone(testBody, this, this.queueRunner, done);
            } : function() {
              return runInTestZone(testBody, this, this.queueRunner);
            }));
  }
  interface QueueRunner {
    execute(): void;
  }
  interface QueueRunnerAttrs {
    queueableFns: {fn: Function}[];
    onComplete: () => void;
    clearStack: (fn: any) => void;
    onException: (error: any) => void;
    catchException: () => boolean;
    userContext: any;
    timeout: {setTimeout: Function; clearTimeout: Function};
    fail: () => void;
  }

  const QueueRunner = (jasmine as any).QueueRunner as {
    new (attrs: QueueRunnerAttrs): QueueRunner;
  };
  (jasmine as any).QueueRunner = (function(_super) {
    __extends(ZoneQueueRunner, _super);
    function ZoneQueueRunner(attrs: {
      onComplete: Function;
      userContext?: any;
      timeout?: {setTimeout: Function; clearTimeout: Function};
      onException?: (error: any) => void;
    }) {
      attrs.onComplete = (fn => () => {
        // All functions are done, clear the test zone.
        this.testProxyZone = null;
        this.testProxyZoneSpec = null;
        const originalTimeout = (jasmine as any)['__zone_symbol__DEFAULT_TIMEOUT_INTERVAL'];
        if (typeof originalTimeout === 'number') {
          jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
        }
        ambientZone.scheduleMicroTask('jasmine.onComplete', fn);
      })(attrs.onComplete);

      const nativeSetTimeout = global['__zone_symbol__setTimeout'];
      const nativeClearTimeout = global['__zone_symbol__clearTimeout'];
      if (nativeSetTimeout) {
        // should run setTimeout inside jasmine outside of zone
        attrs.timeout = {
          setTimeout: nativeSetTimeout ? nativeSetTimeout : global.setTimeout,
          clearTimeout: nativeClearTimeout ? nativeClearTimeout : global.clearTimeout
        };
      }

      // create a userContext to hold the queueRunner itself
      // so we can access the testProxy in it/xit/beforeEach ...
      if ((jasmine as any).UserContext) {
        if (!attrs.userContext) {
          attrs.userContext = new (jasmine as any).UserContext();
        }
        attrs.userContext.queueRunner = this;
      } else {
        if (!attrs.userContext) {
          attrs.userContext = {};
        }
        attrs.userContext.queueRunner = this;
      }

      // patch attrs.onException
      const onException = attrs.onException;
      attrs.onException = function(error: any) {
        if (error &&
            error.message ===
                'Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.') {
          // jasmine timeout, we can make the error message more
          // reasonable to tell what tasks are pending
          const proxyZoneSpec: any = this && this.testProxyZoneSpec;
          if (proxyZoneSpec) {
            const pendingTasksInfo = proxyZoneSpec.getAndClearPendingTasksInfo();
            error.message += pendingTasksInfo;
          }
        }
        if (onException) {
          onException.call(this, error);
        }
      };

      _super.call(this, attrs);
    }
    ZoneQueueRunner.prototype.execute = function() {
      let zone: Zone = Zone.current;
      let isChildOfAmbientZone = false;
      while (zone) {
        if (zone === ambientZone) {
          isChildOfAmbientZone = true;
          break;
        }
        zone = zone.parent;
      }

      if (!isChildOfAmbientZone) throw new Error('Unexpected Zone: ' + Zone.current.name);

      // This is the zone which will be used for running individual tests.
      // It will be a proxy zone, so that the tests function can retroactively install
      // different zones.
      // Example:
      //   - In beforeEach() do childZone = Zone.current.fork(...);
      //   - In it() try to do fakeAsync(). The issue is that because the beforeEach forked the
      //     zone outside of fakeAsync it will be able to escape the fakeAsync rules.
      //   - Because ProxyZone is parent fo `childZone` fakeAsync can retroactively add
      //     fakeAsync behavior to the childZone.

      this.testProxyZoneSpec = new ProxyZoneSpec();
      this.testProxyZone = ambientZone.fork(this.testProxyZoneSpec);
      if (!Zone.currentTask) {
        // if we are not running in a task then if someone would register a
        // element.addEventListener and then calling element.click() the
        // addEventListener callback would think that it is the top most task and would
        // drain the microtask queue on element.click() which would be incorrect.
        // For this reason we always force a task when running jasmine tests.
        Zone.current.scheduleMicroTask(
            'jasmine.execute().forceTask', () => QueueRunner.prototype.execute.call(this));
      } else {
        _super.prototype.execute.call(this);
      }
    };
    return ZoneQueueRunner;
  })(QueueRunner);
});
