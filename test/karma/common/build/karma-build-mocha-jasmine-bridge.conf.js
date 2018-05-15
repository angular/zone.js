
module.exports = function(config) {
  require('../karma-base.conf.js')(config);
  config.files.push('build/test/spec/mocha/mocha-browser-karma.js');
  config.files.push('build/test/env/polyfills/wtf_mock.js');
  config.files.push('build/test/env/polyfills/test_fake_polyfill.js');
  config.files.push('build/lib/zone.js');
  config.files.push('build/lib/common/promise.js');
  config.files.push('build/lib/common/error-rewrite.js');
  config.files.push('build/test/env/browser/main.js');

  config.plugins.push(require('karma-mocha'));
  config.frameworks.push('mocha');
  config.client.mocha = {
    timeout: 5000  // copied timeout for Jasmine in WebSocket.spec (otherwise Mochas default timeout
                   // at 2 sec is to low for the tests)
  };
};
