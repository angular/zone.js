// Karma configuration

module.exports = function (config) {
  config.set({
    basePath: '',
    files: [
      'zone.js',
      '*-zone.js',
      'test/**/*.spec.js'
    ],

    reporters: ['progress'],

    port: 9876,
    colors: true,

    logLevel: config.LOG_INFO,

    browsers: ['Firefox'],
    frameworks: ['jasmine'],

    captureTimeout: 60000,

    autoWatch: true,
    singleRun: false
  });
};
