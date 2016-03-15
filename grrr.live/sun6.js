console = {};

console.log = function() {
	post([].splice.call(arguments,0).join(" "), "\n");
}


function random(n) {
	return Math.floor(Math.random()*n);
}

function pick(arr) {
	return arr[random(arr.length)];
}

function unquote(str) {
	if (str[0] === '"' && str[str.length - 1] === '"') {
		return str.slice(1, str.length - 1);
	} 
	return str;
};

///////////////////////////////////////////////////////////////

var freq = random(500);

var synths = [
	"cycle(300)",
	"cycle(300 + 100*cycle(10))",
	"cycle(300 + 300*cycle(4))",
	"cycle(300 + 300*cycle(10))",
	"cycle(300 + 100*cycle(4))",
];

function bang() {

	freq = random(10)*100/random(3);
	var code = "phasor(" + freq + ")";

	outlet(0, "expr", code);
}