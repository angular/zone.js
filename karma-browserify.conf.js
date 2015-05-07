// Karma configuration

module.exports = function (config) {
  config.set({
    basePath: '',
    files: [
      'test/util.js',
      {pattern: 'zone.js', watched: true, served: false, included: false},
      'test/commonjs.spec.js',
      {pattern: 'test/assets/**/*.html', watched: true, served: true, included: false}
    ],

    exclude: [
      
    ],

    reporters: ['progress'],

    preprocessors: {
      'test/commonjs.spec.js': [ 'browserify' ]
    },

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
