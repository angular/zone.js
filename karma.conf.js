// Karma configuration for browser tests

module.exports = function (config) {
  config.set({
    basePath: '',
    files: [
      'test/util.js',
      'test/setup/browser.js',
      'examples/js/*.js',
      //'test/lib/brick.js',
      'test/*.spec.js',
      'test/patch/*.spec.js',
      'test/patch/browser/**/*.spec.js',
      {pattern: 'test/assets/**/*.*', watched: true, served: true, included: false},
      {pattern: 'lib/**/*.js', watched: true, served: false, included: false}
    ],

    preprocessors: {
      'test/**/*.js': [ 'browserify' ]
    },

    exclude: [
      'test/commonjs.spec.js',
      'test/microtasks.spec.js'
    ],

    browserify: {
      debug: true
    },

    reporters: ['progress'],

    //port: 9876,
    colors: true,

    logLevel: config.LOG_INFO,

    browsers: ['Firefox'],
    frameworks: ['jasmine', 'browserify'],

    captureTimeout: 60000,

    autoWatch: true,
    singleRun: false
  });
};
