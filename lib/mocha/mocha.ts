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
    
    if (fn.length === 1) {
      // add mochas 'done' callback for async tests
      return function (done) {
        return testZone.run(fn, this, [done]);
      }
    }

    return function testFunc() {
      return testZone.run(fn, this);
    };
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

})(window);