'use strict';

((context) => {
  var Mocha = context['Mocha'];
  
  if (typeof Mocha === 'undefined') {
    throw new Error('Missing Mocha.js');
  }

  if (typeof Zone === 'undefined') {
    throw new Error('Missing Zone.js');
  }

  let ProxyZoneSpec = Zone['ProxyZoneSpec'];

  if (!ProxyZoneSpec) {
    throw new Error('Missing ProxyZoneSpec');
  }

  if(Mocha['__zone_patch__']){
    throw new Error('"Mocha" has already been patched with "Zone".');
  }

  Mocha['__zone_patch__'] = true;

  let rootZone = Zone.current;

  function wrapCallbackInProxyZone(fn: Function): Function {
    let testZone = rootZone.fork(new ProxyZoneSpec());
    
    let asyncTest = function(done){
      // add mochas 'done' callback for async tests if needed
      return testZone.run(fn, this, [done]);
    };

    let syncTest = function(){
      return testZone.run(fn, this);
    };
    
    let wrapFn: Function = fn.length == 0 ? syncTest : asyncTest;   

    // Mocha uses toString to get the body of the test (later used in the result view) 
    // Make sure we return the real test body, not the wrapper body, otherwise the test body just show "return testZone.run ..."
    wrapFn.toString = function(){
      return fn.toString();
    };

    return wrapFn;
  }

  ['it', 'specify', 'test'].forEach((funcName) => {
    if (!context[funcName]) {
      return;
    }

    let originalFn = context[funcName];
    context[funcName] = function (name: string, fn: Function) {
      arguments[1] = wrapCallbackInProxyZone(fn);
      return originalFn.apply(this, arguments);
    };
  });

  ['describe', 'suite'].forEach((funcName) => {
    if (!context[funcName]) {
      return;
    }

    let originalFn = context[funcName];
    context[funcName] = function (name: string, fn: Function) {
      return originalFn.call(this, name, wrapCallbackInProxyZone(fn));
    };
  });

  ['beforeEach', 'afterEach', 'after', 'before', 'suiteSetup', 'suiteTeardown', 'setup', 'teardown'].forEach((funcName) => {
    if (!context[funcName]) {
      return;
    }

    let originalFn = context[funcName];
    context[funcName] = function (fn: Function) {
      return originalFn.call(this, wrapCallbackInProxyZone(fn));
    };
  });

  (runTest => {
    Mocha.Runner.prototype.runTest = function(fn){
      Zone.current.scheduleMicroTask('mocha.forceTask', () => {
        runTest.call(this, fn);
      });
    };
  })(Mocha.Runner.prototype.runTest);

})(window);