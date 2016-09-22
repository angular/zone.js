// Karma configuration

module.exports = function (config) {
  config.set({
    basePath: '',
    files: [
      'node_modules/systemjs/dist/system-polyfills.js',
      'node_modules/systemjs/dist/system.src.js',
      'node_modules/whatwg-fetch/fetch.js',
      {pattern: 'test/assets/**/*.*', watched: true, served: true, included: false},
      {pattern: 'build/**/*.js.map', watched: true, served: true, included: false},
      {pattern: 'build/**/*.js', watched: true, served: true, included: false},
      'build/test/main.js'
    ],

    plugins: [
      require('karma-chrome-launcher'),
      require('karma-firefox-launcher'),
      require('karma-jasmine'),
      require('karma-sourcemap-loader'),
    ],

    preprocessors: {
      '**/*.js': ['sourcemap']
    },

    exclude: [
      'test/microtasks.spec.ts'
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
