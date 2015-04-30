'use strict';

var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var buffer = require('vinyl-buffer');

var distFolder = './dist';

function generateBrowserScript(inFile, outFile) {
  var b = browserify({
    entries: inFile,
    debug: false
  });

  return b
    .bundle()
    .pipe(source(outFile))
    .pipe(buffer())
    .pipe(gulp.dest(distFolder))
    .pipe(uglify())
    .pipe(rename({ extname: '.min.js' }))
    .pipe(gulp.dest(distFolder));
  ;
}

gulp.task('build/zone.js', function() {
  return generateBrowserScript('./lib/browser/zone.js', 'zone.js');
});

gulp.task('build/zone-microtask.js', function() {
  return generateBrowserScript('./lib/browser/zone-microtask.js', 'zone-microtask.js');
});

gulp.task('build', ['build/zone.js', 'build/zone-microtask.js']);



