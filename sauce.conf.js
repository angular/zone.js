// Sauce configuration

module.exports = function (config) {
  // The WS server is not available with Sauce
  config.files.unshift('test/saucelabs.js');

  var customLaunchers = {
    'SL_CHROME': {
      base: 'SauceLabs',
      browserName: 'chrome',
      version: '48'
    },
    'SL_FIREFOX': {
      base: 'SauceLabs',
      browserName: 'firefox',
      version: '44'
    },
    /*'SL_SAFARI7': {
      base: 'SauceLabs',
        browserName: 'safari',
        platform: 'OS X 10.9',
        version: '7'
    },*/
    'SL_SAFARI8': {
      base: 'SauceLabs',
        browserName: 'safari',
        platform: 'OS X 10.10',
        version: '8'
    },
    'SL_SAFARI9': {
      base: 'SauceLabs',
        browserName: 'safari',
        platform: 'OS X 10.11',
        version: '9.0'
    },
    /*'SL_IOS7': {
      base: 'SauceLabs',
      browserName: 'iphone',
      platform: 'OS X 10.10',
      version: '7.1'
    },*/
    'SL_IOS8': {
      base: 'SauceLabs',
      browserName: 'iphone',
      platform: 'OS X 10.10',
      version: '8.4'
    },
    /*'SL_IOS9': {
      base: 'SauceLabs',
      browserName: 'iphone',
      platform: 'OS X 10.10',
      version: '9.2'
    },*/
    /* Dissabled do to: https://travis-ci.org/angular/zone.js/builds/141228742#L744
     'SL_IE9': {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      platform: 'Windows 2008',
      version: '9'
    },*/
    'SL_IE10': {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      platform: 'Windows 2012',
      version: '10'
    },
    'SL_IE11': {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      platform: 'Windows 10',
      version: '11'
    },
    'SL_MSEDGE13': {
      base: 'SauceLabs',
      browserName: 'MicrosoftEdge',
      platform: 'Windows 10',
      version: '13.10586'
    },
    'SL_ANDROID4.4': {
      base: 'SauceLabs',
      browserName: 'android',
      platform: 'Linux',
      version: '4.4'
    },
    'SL_ANDROID5.1': {
      base: 'SauceLabs',
      browserName: 'android',
      platform: 'Linux',
      version: '5.1'
    }
  };

  config.set({
    captureTimeout: 120000,
    browserNoActivityTimeout: 240000,

    sauceLabs: {
      testName: 'Zone.js',
      startConnect: false,
      recordVideo: false,
      recordScreenshots: false,
      options:  {
          'selenium-version': '2.53.0',
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
