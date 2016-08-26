var fs = require("fs");

var filename = "index.html";

var css_sources = [
	"./css/codemirror.css",
    "./css/show-hint.css",
    "./css/gibber.css",
    "./css/vanillatree.css",
    "./css/tabs.microlib.css"
];

var js_sources = [
	"./dist/index.js",
];

var css_start_str = "<!-- css_insert_start -->";
var css_end_str   = "<!-- css_insert_end -->";
var  js_start_str = "<!-- js_insert_start -->";
var  js_end_str   = "<!-- js_insert_end -->";


var result = fs.readFileSync(filename, "utf-8");

var css = css_start_str + "\n<style>\n";
for (var f of css_sources) {
	css += fs.readFileSync(f, "utf-8");
}
css += "\n</style>\n" + css_end_str;


var js = js_start_str + "\n<script>\n";
for (var f of js_sources) {
	js += fs.readFileSync(f, "utf-8");
}
js += "\n</script>\n" + js_end_str;


// find our insertion points:
var css_start = result.indexOf(css_start_str);
var css_end   = result.indexOf(css_end_str) + css_end_str.length;
var  js_start = result.indexOf( js_start_str);
var  js_end   = result.indexOf( js_end_str) + js_end_str.length;

//if (css_start >= 0 && css_end >= 0) {

//  var a = result.slice(0, css_start);
//  var b = result.slice(css_end, -1);

//  var result = a + css + b;
//  fs.writeFileSync(filename, result);
//}

if (css_start >= 0 && css_end >= 0 && js_start >= 0 && js_end >= 0) {

	var a = result.slice(0, css_start);
	var b = result.slice(css_end, js_start);
	var c = result.slice(js_end);

	var result = a + css + b + js + c;

	//console.log(result);

	fs.writeFileSync(filename, result);
}
