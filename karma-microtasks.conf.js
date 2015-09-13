// Karma configuration

module.exports = function (config) {
  config.set({
    basePath: '',
    files: [
      'test/setup/browser-microtask.js',
      'test/util.js',
      'examples/js/*.js',
      'test/*.spec.js',
      'test/patch/*.spec.js',
      'test/patch/browser/**/*.spec.js', 
      {pattern: 'test/assets/**/*.*', watched: true, served: true, included: false},
      {pattern: 'lib/**/*.js', watched: true, served: false, included: false}
    ],

    exclude: [
      'test/commonjs.spec.js',
    ],

    preprocessors: {
      'test/**/*.js': [ 'browserify' ]
    },

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
