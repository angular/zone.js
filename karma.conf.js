// Karma configuration

module.exports = function (config) {
  config.set({
    basePath: '',
    files: [
      'zone.js',
      'test/*.spec.js'
    ],

    reporters: ['progress'],

    port: 9876,
    colors: true,

    logLevel: config.LOG_INFO,

    browsers: ['Chrome'],
    frameworks: ['jasmine'],

    captureTimeout: 60000,

    autoWatch: true,
    singleRun: false
  });
};
