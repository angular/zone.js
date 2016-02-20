'use strict';

var gulp = require('gulp');
var gutil = require("gulp-util");
var webpack = require('webpack');

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
    if(err) throw new gutil.PluginError("webpack", err);
    gutil.log("[webpack]", stats.toString({
      // output options
    }));
    callback();
  });
}

gulp.task('build/zone.js', function(cb) {
  return generateBrowserScript('./lib/browser/zone.ts', 'zone.js', false, cb);
});

gulp.task('build/zone.min.js', function(cb) {
  return generateBrowserScript('./lib/browser/zone.ts', 'zone.min.js', true, cb);
});

gulp.task('build/zone-microtask.js', function(cb) {
  return generateBrowserScript('./lib/browser/zone-microtask.ts', 'zone-microtask.js', false, cb);
});

gulp.task('build/zone-microtask.min.js', function(cb) {
  return generateBrowserScript('./lib/browser/zone-microtask.ts', 'zone-microtask.min.js', true, cb);
});

gulp.task('build/jasmine-patch.js', function(cb) {
  return generateBrowserScript('./lib/browser/jasmine-patch.ts', 'jasmine-patch.js', false, cb);
});

gulp.task('build/jasmine-patch.min.js', function(cb) {
  return generateBrowserScript('./lib/browser/jasmine-patch.ts', 'jasmine-patch.min.js', true, cb);
});

gulp.task('build/long-stack-trace-zone.js', function(cb) {
  return generateBrowserScript('./lib/browser/long-stack-trace-zone.ts', 'long-stack-trace-zone.js', false, cb);
});

gulp.task('build/long-stack-trace-zone.min.js', function(cb) {
  return generateBrowserScript('./lib/browser/long-stack-trace-zone.ts', 'long-stack-trace-zone.min.js', true, cb);
});

gulp.task('build', [
  'build/zone.js',
  'build/zone.min.js',
  'build/zone-microtask.js',
  'build/zone-microtask.min.js',
  'build/jasmine-patch.js',
  'build/jasmine-patch.min.js',
  'build/long-stack-trace-zone.js',
  'build/long-stack-trace-zone.min.js'
]);
