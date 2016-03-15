

var notes = [ 60, 62, 64, 65, 67, 69, 71, 72 ];

function random(n) {
	return Math.floor(Math.random()*n);
}

function pick(arr) {
	return arr[random(arr.length)];
}

function seq(seqname) {
	outlet(0, "delete", seqname, -1, 2.); // clear over all valid timepoints
	for (var i=0; i< 32; i++) {
		var div = Math.pow(2, random(3));
		var t = random(div)/div;
		outlet(0, "add", seqname, t, pick(notes), 64 + random(32));
	}
}