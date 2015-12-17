var gulp = require('gulp');
var browserify = require('browserify');
var transform = require('vinyl-transform');
var source = require('vinyl-source-stream');

gulp.task('default', function () {
  
  var b = browserify({
    entries: './js/index.js',
    debug:true
  }).bundle()

  b.pipe( source('index.js') ).pipe( gulp.dest( './dist/' ) )
});
