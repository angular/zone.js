var gulp = require('gulp');
var jasmine = require('gulp-jasmine');

gulp.task('test', function () {
  require('./test/util');
  require('./zone.js');
  require('./long-stack-trace-zone.js');
  var tests = [
  	'test/zone.spec.js',
  	'test/long-stack-trace-zone.spec.js',
  	'test/patch/*.js'
  ];
  return gulp.src(tests).pipe(jasmine({includeStackTrace: true, timeout: 1000, verbose: true}));
});
