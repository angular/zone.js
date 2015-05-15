// Karma configuration
var os = require('os');

module.exports = function (config) {
  config.set({
    basePath: '',
    files: [
      'test/util.js',
      'test/setup-microtask.js',
      'dist/*-zone.js',
      'test/**/*.spec.js',
      {pattern: 'test/assets/**/*.*', watched: true, served: true, included: false},
      {pattern: 'lib/**/*.js', watched: true, served: false, included: false}
    ],

    exclude: [
      'test/commonjs.spec.js',
    ],

    preprocessors: {
      'test/setup-microtask.js': [ 'browserify' ],
      // See browserify block for why WebSocket.spec is needed
      'test/patch/WebSocket.spec.js': [ 'browserify']
    },

    browserify: {
      // 'Hilareously', Safari/Sauce/Localhost make Websockets not work, so we
      // have to give an explicit hostname
      transform: [ ['envify', {'WEBSOCKET_HOST': os.hostname()}]]
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
