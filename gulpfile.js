/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
'use strict';

var gulp = require('gulp');
var rollup = require('gulp-rollup');
var rename = require("gulp-rename");
var uglify = require('gulp-uglify');
var pump = require('pump');
var path = require('path');
var spawn = require('child_process').spawn;
const os = require('os');

function generateScript(inFile, outFile, minify, callback) {
  inFile = path.join('./build-esm/', inFile).replace(/\.ts$/, '.js');
  var parts = [
    gulp.src('./build-esm/lib/**/*.js')
        .pipe(rollup({
          entry: inFile,
          format: 'umd',
          banner: '/**\n'
              + '* @license\n'
              + '* Copyright Google Inc. All Rights Reserved.\n'
              + '*\n'
              + '* Use of this source code is governed by an MIT-style license that can be\n'
              + '* found in the LICENSE file at https://angular.io/license\n'
              + '*/'
        }))
        .pipe(rename(outFile)),
  ];
  if (minify) {
    parts.push(uglify());
  }
  parts.push(gulp.dest('./dist'));
  pump(parts, callback);
}

// returns the script path for the current platform
function platformScriptPath(path) {
    return /^win/.test(os.platform()) ? `${path}.cmd` : path;
}

function tsc(config, cb) {
  spawn(path.normalize(platformScriptPath('./node_modules/.bin/tsc')), ['-p', config], {stdio: 'inherit'})
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
  return gulp.src('./build-esm/lib/zone.d.ts').pipe(rename('zone.js.d.ts')).pipe(gulp.dest('./dist'));
});

// Zone for Node.js environment.
gulp.task('build/zone-node.js', ['compile-esm'], function(cb) {
  return generateScript('./lib/node/node.ts', 'zone-node.js', false, cb);
});

// Zone for the browser.
gulp.task('build/zone.js', ['compile-esm'], function(cb) {
  return generateScript('./lib/browser/rollup-main.ts', 'zone.js', false, cb);
});

// Zone for electron/nw environment.
gulp.task('build/zone-mix.js', ['compile-esm'], function(cb) {
    return generateScript('./lib/mix/rollup-mix.ts', 'zone-mix.js', false, cb);
});

gulp.task('build/zone.min.js', ['compile-esm'], function(cb) {
  return generateScript('./lib/browser/rollup-main.ts', 'zone.min.js', true, cb);
});

gulp.task('build/webapis-media-query.js', ['compile-esm'], function(cb) {
    return generateScript('./lib/browser/webapis-media-query.ts', 'webapis-media-query.js', true, cb);
});

gulp.task('build/webapis-notification.js', ['compile-esm'], function(cb) {
    return generateScript('./lib/browser/webapis-notification.ts', 'webapis-notification.js', true, cb);
});

gulp.task('build/jasmine-patch.js', ['compile-esm'], function(cb) {
  return generateScript('./lib/jasmine/jasmine.ts', 'jasmine-patch.js', false, cb);
});

gulp.task('build/jasmine-patch.min.js', ['compile-esm'], function(cb) {
  return generateScript('./lib/jasmine/jasmine.ts', 'jasmine-patch.min.js', true, cb);
});

gulp.task('build/mocha-patch.js', ['compile-esm'], function(cb) {
  return generateScript('./lib/mocha/mocha.ts', 'mocha-patch.js', false, cb);
});

gulp.task('build/mocha-patch.min.js', ['compile-esm'], function(cb) {
  return generateScript('./lib/mocha/mocha.ts', 'mocha-patch.min.js', true, cb);
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
  'build/webapis-media-query.js',
  'build/webapis-notification.js',
  'build/zone-mix.js',
  'build/jasmine-patch.js',
  'build/jasmine-patch.min.js',
  'build/mocha-patch.js',
  'build/mocha-patch.min.js',
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
  };
  jrunner.addReporter(new JasmineRunner.ConsoleReporter(jrunner));
  jrunner.projectBaseDir = __dirname;
  jrunner.specDir = '';
  jrunner.addSpecFiles(specFiles);
  jrunner.execute();
});

// Check the coding standards and programming errors
gulp.task('lint', () => {
  const tslint = require('gulp-tslint');
  // Built-in rules are at
  // https://github.com/palantir/tslint#supported-rules
  const tslintConfig = require('./tslint.json');

  return gulp.src(['lib/**/*.ts', 'test/**/*.ts'])
    .pipe(tslint({
      tslint: require('tslint').default,
      configuration: tslintConfig,
      formatter: 'prose',
    }))
    .pipe(tslint.report({emitError: true}));
});

// clang-format entry points
const srcsToFmt = [
  'lib/**/*.ts',
  'test/**/*.ts',
];

// Check source code for formatting errors (clang-format)
gulp.task('format:enforce', () => {
  const format = require('gulp-clang-format');
  const clangFormat = require('clang-format');
  return gulp.src(srcsToFmt).pipe(
    format.checkFormat('file', clangFormat, {verbose: true, fail: true}));
});

// Format the source code with clang-format (see .clang-format)
gulp.task('format', () => {
  const format = require('gulp-clang-format');
  const clangFormat = require('clang-format');
  return gulp.src(srcsToFmt, { base: '.' }).pipe(
    format.format('file', clangFormat)).pipe(gulp.dest('.'));
});

// Update the changelog with the latest changes
gulp.task('changelog', () => {
  const conventionalChangelog = require('gulp-conventional-changelog');

  return gulp.src('CHANGELOG.md')
    .pipe(conventionalChangelog({preset: 'angular', releaseCount: 1}, {
       // Conventional Changelog Context
       // We have to manually set version number so it doesn't get prefixed with `v`
       // See https://github.com/conventional-changelog/conventional-changelog-core/issues/10
       currentTag: require('./package.json').version
    }))
    .pipe(gulp.dest('./'));
});

// run promise aplus test
gulp.task('promisetest', ['build/zone-node.js'], (cb) => {
    const promisesAplusTests = require('promises-aplus-tests');
    const adapter = require('./promise-adapter');
    promisesAplusTests(adapter, { reporter: "dot" }, function (err) {
      if (err) {
        cb(err);
      }
    });
});