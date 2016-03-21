'use strict';

var gulp = require('gulp');
var gutil = require("gulp-util");
var webpack = require('webpack');
var source = require('vinyl-source-stream');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var buffer = require('vinyl-buffer');
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

gulp.task('compile', function(){
  gulp.src([
    'typings/browser/ambient/node/node.d.ts',
    'typings/browser/ambient/es6-promise/es6-promise.d.ts',
    'lib/zone.ts',
  ]).pipe(typescript({ target: 'es5', "declaration": true })).pipe(gulp.dest('./build/'))
});

gulp.task('build/zone.js.d.ts', ['compile'], function() {
  return gulp.src('./build/lib/zone.d.ts').pipe(rename('zone.js.d.ts')).pipe(gulp.dest('./dist'));
});

gulp.task('build/zone-node.js', function(cb) {
  return generateBrowserScript('./lib/node/node.ts', 'zone-node.js', false, cb);
});

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

gulp.task('build/wtf.js', function(cb) {
  return generateBrowserScript('./lib/zone-spec/wtf.ts', 'wtf.js', false, cb);
});

gulp.task('build/wtf.min.js', function(cb) {
  return generateBrowserScript('./lib/zone-spec/wtf.ts', 'wtf.min.js', true, cb);
});

gulp.task('build/async-test.js', function(cb) {
  return generateBrowserScript('./lib/zone-spec/async-test.ts', 'async-test.js', false, cb);
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
  'build/wtf.js',
  'build/wtf.min.js',
  'build/async-test.js'
]);



