// Karma configuration

module.exports = function (config) {
  config.set({
    basePath: '',
    files: [
      'test/util.js',
      'test/wtf_mock.js',
      'test/setup.js',
      'example/js/*.js',
      //'test/lib/brick.js',
      'test/**/*.spec.js',
      {pattern: 'test/assets/**/*.*', watched: true, served: true, included: false},
      {pattern: 'lib/**/*.js', watched: true, served: false, included: false}
    ],

    preprocessors: {
      'test/setup.js': [ 'browserify' ]
    },

    exclude: [
      'test/commonjs.spec.js',
      'test/microtasks.spec.js'
    ],

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
