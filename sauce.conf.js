// Sauce configuration

module.exports = function (config) {
  var customLaunchers = {
    'SL_Chrome': {
      base: 'SauceLabs',
      browserName: 'chrome',
      version: '42'
    },
    'SL_ChromeBeta': {
      base: 'SauceLabs',
      browserName: 'chrome',
      version: 'beta'
    },
    'SL_Firefox': {
      base: 'SauceLabs',
      browserName: 'firefox',
      version: '37'
    },
    'SL_Safari7': {
      base: 'SauceLabs',
      browserName: 'safari',
      platform: 'OS X 10.9',
      version: '7'
    },
    'SL_Safari8': {
      base: 'SauceLabs',
      browserName: 'safari',
      platform: 'OS X 10.10',
      version: '8'
    }
  };

  config.set({
    captureTimeout: 120000,
    browserNoActivityTimeout: 1500000,

    sauceLabs: {
      testName: 'Zone.js',
      startConnect: false,
      recordVideo: false,
      recordScreenshots: false,
      options:  {
          'selenium-version': '2.45.0',
          'command-timeout': 600,
          'idle-timeout': 600,
          'max-duration': 5400
      }
    },

    customLaunchers: customLaunchers,

    browsers: Object.keys(customLaunchers),

    reporters: ['dots', 'saucelabs'],

    singleRun: true,

    plugins: [
      'karma-*'
    ]
  });

  if (process.env.TRAVIS) {
    config.sauceLabs.build = 'TRAVIS #' + process.env.TRAVIS_BUILD_NUMBER + ' (' + process.env.TRAVIS_BUILD_ID + ')';
    config.sauceLabs.tunnelIdentifier = process.env.TRAVIS_JOB_NUMBER;

    process.env.SAUCE_ACCESS_KEY = process.env.SAUCE_ACCESS_KEY.split('').reverse().join('');

    // TODO(vojta): remove once SauceLabs supports websockets.
    // This speeds up the capturing a bit, as browsers don't even try to use websocket.
    config.transports = ['xhr-polling'];
  }
};
