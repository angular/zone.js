'use strict';

var gulp = require('gulp');
var rollup = require('gulp-rollup');
var rename = require("gulp-rename");
var gutil = require("gulp-util");
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var pump = require('pump');
var uglify = require('gulp-uglify');
var path = require('path');
var spawn = require('child_process').spawn;


var distFolder = './dist';

function generateScript(inFile, outFile, minify, callback) {
  inFile = path.join('./build-esm/', inFile).replace(/\.ts$/, '.js');
  var parts = [
    gulp.src('./build-esm/lib/**/*.js')
        .pipe(rollup({ entry: inFile}))
        .pipe(rename(outFile)),
  ];
  if (minify) {
    parts.push(uglify());
  }
  parts.push(gulp.dest('./dist'));
  pump(parts, callback);
}

function tsc(config, cb) {
  spawn('./node_modules/.bin/tsc', ['-p', config], {stdio: 'inherit'})
      .on('close', function(exitCode) {
        if (exitCode) {
          var err = new Error('TypeScript compiler failed');
          // The stack is not useful in this context.
          err.showStack = false;
          cb(err);
        } else {
          cb();
        }
      });
}

// This is equivalent to `npm run tsc`.
gulp.task('compile', function(cb) {
  tsc('tsconfig.json', cb);
});

gulp.task('compile-esm', function(cb) {
  tsc('tsconfig-esm.json', cb);
});

gulp.task('build/zone.js.d.ts', ['compile-esm'], function() {
  return gulp.src('./build/lib/zone.d.ts').pipe(rename('zone.js.d.ts')).pipe(gulp.dest('./dist'));
});

// Zone for Node.js environment.
gulp.task('build/zone-node.js', ['compile-esm'], function(cb) {
  return generateScript('./lib/node/node.ts', 'zone-node.js', false, cb);
});

gulp.task('build/zone-nativescript.js', ['compile-esm'], function(cb) {
  return generateScript('./lib/nativescript/nativescript.ts', 'zone-nativescript.js', false, cb);
});

// Zone for the browser.
gulp.task('build/zone.js', ['compile-esm'], function(cb) {

  return generateScript('./lib/browser/browser.ts', 'zone.js', false, cb);
});

gulp.task('build/zone.min.js', ['compile-esm'], function(cb) {
  return generateScript('./lib/browser/browser.ts', 'zone.min.js', true, cb);
});

gulp.task('build/jasmine-patch.js', ['compile-esm'], function(cb) {
  return generateScript('./lib/jasmine/jasmine.ts', 'jasmine-patch.js', false, cb);
});

gulp.task('build/jasmine-patch.min.js', ['compile-esm'], function(cb) {
  return generateScript('./lib/jasmine/jasmine.ts', 'jasmine-patch.min.js', true, cb);
});

gulp.task('build/long-stack-trace-zone.js', ['compile-esm'], function(cb) {
  return generateScript('./lib/zone-spec/long-stack-trace.ts', 'long-stack-trace-zone.js', false, cb);
});

gulp.task('build/long-stack-trace-zone.min.js', ['compile-esm'], function(cb) {
  return generateScript('./lib/zone-spec/long-stack-trace.ts', 'long-stack-trace-zone.min.js', true, cb);
});

gulp.task('build/proxy-zone.js', ['compile-esm'], function(cb) {
  return generateScript('./lib/zone-spec/proxy.ts', 'proxy.js', false, cb);
});

gulp.task('build/proxy-zone.min.js', ['compile-esm'], function(cb) {
  return generateScript('./lib/zone-spec/proxy.ts', 'proxy.min.js', true, cb);
});

gulp.task('build/task-tracking.js', ['compile-esm'], function(cb) {
  return generateScript('./lib/zone-spec/task-tracking.ts', 'task-tracking.js', false, cb);
});

gulp.task('build/task-tracking.min.js', ['compile-esm'], function(cb) {
  return generateScript('./lib/zone-spec/task-tracking.ts', 'task-tracking.min.js', true, cb);
});

gulp.task('build/wtf.js', ['compile-esm'], function(cb) {
  return generateScript('./lib/zone-spec/wtf.ts', 'wtf.js', false, cb);
});

gulp.task('build/wtf.min.js', ['compile-esm'], function(cb) {
  return generateScript('./lib/zone-spec/wtf.ts', 'wtf.min.js', true, cb);
});

gulp.task('build/async-test.js', ['compile-esm'], function(cb) {
  return generateScript('./lib/zone-spec/async-test.ts', 'async-test.js', false, cb);
});

gulp.task('build/fake-async-test.js', ['compile-esm'], function(cb) {
  return generateScript('./lib/zone-spec/fake-async-test.ts', 'fake-async-test.js', false, cb);
});

gulp.task('build/sync-test.js', ['compile-esm'], function(cb) {
  return generateScript('./lib/zone-spec/sync-test.ts', 'sync-test.js', false, cb);
});

gulp.task('build', [
  'build/zone.js',
  'build/zone.js.d.ts',
  'build/zone.min.js',
  'build/zone-node.js',
  'build/zone-nativescript.js',
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
  jrunner.print = function(value) {
    process.stdout.write(value);
  }
  jrunner.addReporter(new JasmineRunner.ConsoleReporter(jrunner));
  jrunner.projectBaseDir = __dirname;
  jrunner.specDir = '';
  jrunner.addSpecFiles(specFiles);
  jrunner.execute();
});

gulp.task('test/nativescript', ['compile'], function(cb) {
  var JasmineRunner = require('jasmine');
  var jrunner = new JasmineRunner();

  var specFiles = ['build/test/nativescript_entry_point.js'];

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
  jrunner.print = function(value) {
    process.stdout.write(value);
  }
  jrunner.addReporter(new JasmineRunner.ConsoleReporter(jrunner));
  jrunner.projectBaseDir = __dirname;
  jrunner.specDir = '';
  jrunner.addSpecFiles(specFiles);
  jrunner.execute();
});
