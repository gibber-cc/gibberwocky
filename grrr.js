

var notes = [
	//60, 
	62, 64, 65, 67, 69, 71, 72
];

function random(n) {
	return Math.floor(Math.random()*n);
}

function pick(arr) {
	return arr[random(arr.length)];
}

function seq(seqname) {
	outlet(0, "delete", seqname, -1, 5.); // clear it from timepoints -1 to 2
	for (var i=0; i< 32; i++) {
		var div = Math.pow(2, random(5));
		var t = 4*random(div)/div;
		outlet(0, "add", seqname, t, pick(notes), 64 + random(32));
	}
}
