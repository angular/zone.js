// Karma configuration

module.exports = function (config) {
  config.set({
    basePath: '',
    files: [
      'test/util.js',
      'zone.js',
      'test/jasmine-patch.js',
      '*-zone.js',
      //'test/lib/brick.js',
      'test/**/*.spec.js',
      {pattern: 'test/assets/**/*.html', watched: true, served: true, included: false}
    ],

    exclude: [
      'test/commonjs.spec.js'
    ],

    reporters: ['progress'],

    //port: 9876,
    colors: true,

    logLevel: config.LOG_INFO,

    browsers: ['Firefox'],
    frameworks: ['jasmine'],

    captureTimeout: 60000,

    autoWatch: true,
    singleRun: false
  });
};
