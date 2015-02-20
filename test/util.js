
/*
 * usage:

describe('whatever', run(function () {

}, function () {
  return 'registerElement'
}, 'does not support whatevs'))

 */
function ifEnvSupports(test, block) {
  return function () {
    var message = (test.message || test.name || test);
    if (typeof test === 'string' ? !!window[test] : test()) {
      block();
    } else {
      it('should skip the test if the API does not exist', function () {
        console.log('WARNING: skipping ' + message + ' tests (missing this API)');
      });
    }
  };
};

// useful for testing mocks
window.__setTimeout = window.setTimeout;
