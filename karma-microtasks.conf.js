// Karma configuration

module.exports = function (config) {
  config.set({
    basePath: '',
    files: [
      'test/util.js',
      'test/setup-microtask.js',
      'examples/js/*.js',
      'test/**/*.spec.js',
      {pattern: 'test/assets/**/*.*', watched: true, served: true, included: false},
      {pattern: 'lib/**/*.js', watched: true, served: false, included: false}
    ],

    exclude: [
      'test/commonjs.spec.js',
    ],

    preprocessors: {
      'test/setup-microtask.js': [ 'browserify' ]
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
