'use strict';

var gulp = require('gulp');
var gutil = require("gulp-util");
var webpack = require('webpack');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var typescript = require('gulp-tsc');


var distFolder = './dist';

function generateBrowserScript(inFile, outFile, minify, callback) {
  var plugins = [];
  if (minify) {
    plugins.push(new webpack.optimize.UglifyJsPlugin({
      mangle: {
        except: ['$super', '$', 'exports', 'require']
      }
    }));
  }
  webpack({
    entry: inFile,
    plugins: plugins,
    output: {
      filename: 'dist/' + outFile
    },
    resolve: {
      extensions: ['', '.webpack.js', '.web.js', '.ts', '.js']
    },
    module: {
      loaders: [
        {test: /\.ts$/, loader: 'ts-loader', exclude: /node_modules/}
      ]
    },
    node: {
      process: false
    }
  }, function(err, stats) {
    if(err) {
      callback(err);
    } else {
      gutil.log("[webpack]", stats.toString({
        // output meta
      }));
      callback();
    }
  });
}

// This is equivalent to `npm run tsc`.
gulp.task('compile', function(cb) {
  var spawn = require('child_process').spawn;
  spawn('./node_modules/.bin/tsc', {stdio: 'inherit'}).on('close', function(exitCode) {
    if (exitCode) {
      var err = new Error('TypeScript compiler failed');
      // The stack is not useful in this context.
      err.showStack = false;
      cb(err);
    } else {
      cb();
    }
  });
});

gulp.task('build/zone.js.d.ts', ['compile'], function() {
  return gulp.src('./build/lib/zone.d.ts').pipe(rename('zone.js.d.ts')).pipe(gulp.dest('./dist'));
});

// Zone for Node.js environment.
gulp.task('build/zone-node.js', function(cb) {
  return generateBrowserScript('./lib/node/node.ts', 'zone-node.js', false, cb);
});

// Zone for the browser.
gulp.task('build/zone.js', function(cb) {
  return generateBrowserScript('./lib/browser/browser.ts', 'zone.js', false, cb);
});

gulp.task('build/zone.min.js', function(cb) {
  return generateBrowserScript('./lib/browser/browser.ts', 'zone.min.js', true, cb);
});

gulp.task('build/jasmine-patch.js', function(cb) {
  return generateBrowserScript('./lib/jasmine/jasmine.ts', 'jasmine-patch.js', false, cb);
});

gulp.task('build/jasmine-patch.min.js', function(cb) {
  return generateBrowserScript('./lib/jasmine/jasmine.ts', 'jasmine-patch.min.js', true, cb);
});

gulp.task('build/long-stack-trace-zone.js', function(cb) {
  return generateBrowserScript('./lib/zone-spec/long-stack-trace.ts', 'long-stack-trace-zone.js', false, cb);
});

gulp.task('build/long-stack-trace-zone.min.js', function(cb) {
  return generateBrowserScript('./lib/zone-spec/long-stack-trace.ts', 'long-stack-trace-zone.min.js', true, cb);
});

gulp.task('build/proxy-zone.js', function(cb) {
  return generateBrowserScript('./lib/zone-spec/proxy-zone.ts', 'proxy-zone.js', false, cb);
});

gulp.task('build/proxy-zone.min.js', function(cb) {
  return generateBrowserScript('./lib/zone-spec/proxy-zone.ts', 'proxy-zone.min.js', true, cb);
});

gulp.task('build/task-tracking.js', function(cb) {
  return generateBrowserScript('./lib/zone-spec/task-tracking.ts', 'task-tracking.js', false, cb);
});

gulp.task('build/task-tracking.min.js', function(cb) {
  return generateBrowserScript('./lib/zone-spec/task-tracking.ts', 'task-tracking.min.js', true, cb);
});

gulp.task('build/wtf.js', function(cb) {
  return generateBrowserScript('./lib/zone-spec/wtf.ts', 'wtf.js', false, cb);
});

gulp.task('build/wtf.min.js', function(cb) {
  return generateBrowserScript('./lib/zone-spec/wtf.ts', 'wtf.min.js', true, cb);
});

gulp.task('build/async-test.js', function(cb) {
  return generateBrowserScript('./lib/zone-spec/async-test.ts', 'async-test.js', false, cb);
});

gulp.task('build/fake-async-test.js', function(cb) {
  return generateBrowserScript('./lib/zone-spec/fake-async-test.ts', 'fake-async-test.js', false, cb);
});

gulp.task('build/sync-test.js', function(cb) {
  return generateBrowserScript('./lib/zone-spec/sync-test.ts', 'sync-test.js', false, cb);
});

gulp.task('build', [
  'build/zone.js',
  'build/zone.js.d.ts',
  'build/zone.min.js',
  'build/zone-node.js',
  'build/jasmine-patch.js',
  'build/jasmine-patch.min.js',
  'build/long-stack-trace-zone.js',
  'build/long-stack-trace-zone.min.js',
  'build/proxy-zone.js',
  'build/proxy-zone.min.js',
  'build/task-tracking.js',
  'build/task-tracking.min.js',
  'build/wtf.js',
  'build/wtf.min.js',
  'build/async-test.js',
  'build/fake-async-test.js',
  'build/sync-test.js'
]);

gulp.task('test/node', ['compile'], function(cb) {
  var JasmineRunner = require('jasmine');
  var jrunner = new JasmineRunner();

  var specFiles = ['build/test/node_entry_point.js'];

  jrunner.configureDefaultReporter({showColors: true});

  jrunner.onComplete(function(passed) {
    if (!passed) {
      var err = new Error('Jasmine node tests failed.');
      // The stack is not useful in this context.
      err.showStack = false;
      cb(err);
    } else {
      cb();
    }
  });
  jrunner.projectBaseDir = __dirname;
  jrunner.specDir = '';
  jrunner.addSpecFiles(specFiles);
  jrunner.execute();
});
