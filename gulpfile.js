var gulp = require('gulp');
var browserify = require('browserify');
var transform = require('vinyl-transform');
var source = require('vinyl-source-stream');

gulp.task('build-lib', function () {
  browserify().add('./demo/tooltip/tooltip.js').bundle()
    .pipe(source('tooltip.bundle.js')).pipe(gulp.dest('./demo/tooltip'));

  browserify().add('./demo/dialog/dialog.js').bundle()
    .pipe(source('dialog.bundle.js')).pipe(gulp.dest('./demo/dialog'));

  return browserify().add('./src/export.js').bundle()
    .pipe(source('popover.js')).pipe(gulp.dest('./dist'));
});

gulp.task('default', ['build-lib']);