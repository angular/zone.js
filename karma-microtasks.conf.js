// Karma configuration

module.exports = function (config) {
  config.set({
    basePath: '',
    files: [
      'test/util.js',
      'dist/zone-microtask.js',
      'dist/*-zone.js',
      //'test/lib/brick.js',
      'test/microtasks.spec.js',
      {pattern: 'test/assets/**/*.html', watched: true, served: true, included: false}
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
