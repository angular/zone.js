// Sauce configuration

module.exports = function (config) {
  // The WS server is not available with Sauce
  config.files.unshift('test/saucelabs.js');

  var customLaunchers = {
    'SL_Chrome': {
      base: 'SauceLabs',
      browserName: 'chrome',
      version: '42'
    },
    /*'SL_ChromeBeta': {
      base: 'SauceLabs',
      browserName: 'chrome',
      version: 'beta'
    },*/
    'SL_Firefox': {
      base: 'SauceLabs',
      browserName: 'firefox',
      version: '37'
    },
    /*
    'SL_Safari7': {
      base: 'SauceLabs',
      browserName: 'safari',
      platform: 'OS X 10.9',
      version: '7'
    },
    */
    'SL_Safari8': {
      base: 'SauceLabs',
      browserName: 'safari',
      platform: 'OS X 10.10',
      version: '8'
    },
    'SL_IE_9': {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      platform: 'Windows 2008',
      version: '9'
    },
    'SL_IE_10': {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      platform: 'Windows 2012',
      version: '10'
    },
    'SL_IE_11': {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      platform: 'Windows 8.1',
      version: '11'
    },
    'SL_ANDROID4.3': {
      base: 'SauceLabs',
      browserName: 'android',
      platform: 'Linux',
      version: '4.3'
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
  }
};
