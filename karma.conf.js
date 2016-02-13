// Karma configuration

module.exports = function (config) {
  config.set({
    basePath: '',
    files: [
      'test/browser_entry_point.ts',
      'test/zone_worker_entry_point.ts',
      'test/**/*.spec.ts',
      {pattern: 'test/assets/**/*.*', watched: true, served: true, included: false},
      // Autowatcch all files to trigger rerun
      {pattern: 'lib/**/*.ts', watched: true, served: false, included: false},
      {pattern: 'test/**/*.ts', watched: true, served: false, included: false},
      {pattern: 'test/ws-webworker-context.ts', watched: true, served: true, included: false},

      {pattern: 'dist/**/*.js', watched: true, served: true, included: false}
    ],

    /*
    plugins: [
      require('karma-chrome-launcher'),
      require('karma-jasmine'),
      require('karma-sourcemap-loader'),
      require('karma-webpack')
    ],
    */

    preprocessors: {
      'test/browser_entry_point.ts': [ 'webpack', 'sourcemap' ],
      'test/zone_worker_entry_point.ts': [ 'webpack', 'sourcemap' ],
      'test/**/*.spec.ts': [ 'webpack', 'sourcemap' ],
      'test/ws-webworker-context.ts': ['webpack', 'sourcemap']
    },
    webpack: {
      devtool: 'source-map',
      module: {
        loaders: [
          {test: /\.ts/, loaders: ['ts-loader'], exclude: /node_modules/}
        ]
      },
      resolve: {
        extensions: ["", ".js", ".ts"]
      }
    },
    webpackServer: {
      noInfo: true
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
