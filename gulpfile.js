var gulp = require('gulp');
var browserify = require('browserify');
var transform = require('vinyl-transform');
var source = require('vinyl-source-stream');

gulp.task('build-lib', function () {
  return browserify().add('./src/export.js').bundle()
    .pipe(source('popover.js')).pipe(gulp.dest('./dist'));
});

gulp.task('default', ['build-lib']);