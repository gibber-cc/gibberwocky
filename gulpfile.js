var gulp = require('gulp');
var browserify = require('browserify');
var transform = require('vinyl-transform');
var source = require('vinyl-source-stream');
var watchify = require( 'watchify' )
var babel    = require( 'babelify' )
var gutil = require( 'gulp-util' )
const through = require('through2')
const sourcemaps = require( 'gulp-sourcemaps' )

gulp.task('build', function () {
  
  var b = browserify({
    entries: './js/index.js'
  }).transform( babel.configure({ sourceMaps:false, presets:['es2015']}) ).bundle()

  b.bundle()
    .pipe( source('gibberwocky.js') )
    .pipe( gulp.dest( './dist/' ) )
    //.pipe( through.obj((chunk, enc, cb) => {
    //  generateHTML( cb )

    //  //cb(null, chunk)
    //}))
  //b.pipe( source('index.js') ).pipe( gulp.dest( './' ) )
});

watchify.args.entries = './js/index.js'
watchify.args.debug = true
//watchify.args.debug = true

var b = watchify( 
  browserify( watchify.args )
  //.transform( babel.configure({ sourceMaps:true, presets:['es2015']} ) ) 
)
b.on( 'update', bundle )
b.on( 'log', gutil.log )

gulp.task('default', bundle)

function bundle() {
  const stream = b.bundle()
    .on("error", function(err) {
      gutil.log("Browserify error:", err);
    })
    .pipe( source('index.js') )
    .pipe( gulp.dest( './dist/' ) )
    .pipe( through.obj((chunk, enc, cb) => {
      generateHTML( cb )

      //cb(null, chunk)
    }))

  return stream
}

const generateHTML = function( cb ) { 
  const fs = require("fs")

  const readfilename  = 'index_template.html'
  const writefilename = 'index.html'

  const css_sources = [
    "./css/codemirror.css",
    "./css/show-hint.css",
    "./css/vanillatree.css",
    "./css/tabs.microlib.css",
    "./css/gibber.css"
  ]

  const js_sources = [
    "./dist/index.js",
  ]

  const css_start_str = "<!-- css_insert_start -->"
  const css_end_str   = "<!-- css_insert_end -->"
  const js_start_str  = "<!-- js_insert_start -->"
  const js_end_str    = "<!-- js_insert_end -->"

  let result = fs.readFileSync(readfilename, "utf-8")

  let css = css_start_str + "\n<style>\n";
  for (let f of css_sources) {
    css += fs.readFileSync(f, "utf-8")
  }
  css += "\n</style>\n" + css_end_str


  let js = js_start_str + "\n<script>\n"
  for (let f of js_sources) {
    js += fs.readFileSync(f, "utf-8")
  }
  js += "\n</script>\n" + js_end_str


  // find our insertion points:
  const css_start = result.indexOf(css_start_str)
  const css_end   = result.indexOf(css_end_str) + css_end_str.length
  const  js_start = result.indexOf( js_start_str)
  const  js_end   = result.indexOf( js_end_str) + js_end_str.length

  if (css_start >= 0 && css_end >= 0 && js_start >= 0 && js_end >= 0) {

    const a = result.slice(0, css_start)
    const b = result.slice(css_end, js_start)
    const c = result.slice(js_end)

    const output = a + css + b + js + c
    //console.log(result);

    fs.writeFileSync( writefilename, output )
  }

  cb( null, null )
}
