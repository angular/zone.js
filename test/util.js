'use strict';

/*
 * usage:
 *
 * describe('whatever', run(function () {
 *
 * }, function () {
 *  return 'registerElement'
 * }, 'does not support whatevs'))
 *
 */
global.ifEnvSupports = function (test, block) {
  return function () {
    var message = (test.message || test.name || test);
    if (typeof test === 'string' ? !!global[test] : test()) {
      block();
    } else {
      it('should skip the test if the API does not exist', function () {
        console.log('WARNING: skipping ' + message + ' tests (missing this API)');
      });
    }
  };
};

global.ifBrowserEnvSupports = function (test, block) {
  if (_isBrowserEnv()) {
    return ifEnvSupports(test, block);
  }

  return function() {
    var message = (test.message || test.name || test);
    it('should skip the test for non-browser environments', function () {
      console.log('WARNING: skipping ' + message + ' tests (non-browser env)');
    });
  };
}

function _isBrowserEnv() {
  return !!global['window'];
}
