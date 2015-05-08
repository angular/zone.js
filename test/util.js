
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

function assertInChildOf(parentZone) {
  var zone = window.zone.parent;
  while (zone) {
    if (zone === parentZone) return;
    zone = zone.parent;
  }

  throw new Error('The current zone [' + window.zone.$id +
                  '] is not a child of the given zone [' + parentZone.$id + '] !');
}

// useful for testing mocks
window.__setTimeout = window.setTimeout;
