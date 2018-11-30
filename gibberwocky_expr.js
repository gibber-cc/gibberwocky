function expr(code) {
	// get a reference to a named gen~ in the patcher:
	var gen_obj = this.patcher.getnamed("mockturtle");
	
	// get a reference to the embedded gen~ patcher:
	var gen_patcher = gen_obj.subpatcher();
		
	// remove all existing objects:
	gen_patcher.apply(function(b) { gen_patcher.remove(b); });
	
	// hacky parsing to get the number of inlets from the code:
	var ninlets = 1;
	code.replace(/in(\d+)/igm, function(m,p) { ninlets = Math.max(ninlets, p); });
	// etc. to get (and remove) the params:
	var params = [];
	code = code.replace(/Param (p\d+)\(([-+]?[0-9]*\.?[0-9]+)\);/igm, function(m,id,init) { 
		params.push([id, init]);
		return ""; 
	});
	
	// have to remove whitespace from code to use with patcher.newdefault()
	code = code.replace(/\s/gi, "");
	var codebox = gen_patcher.newdefault([10, 100, "codebox", "@code", code]);
	
	// create params:
	for (var i=0; i<params.length; i++) {
		var box = gen_patcher.newdefault([10+110*i, 20, "param", params[i][0], params[i][1]]);
	}
	// create the inlets:
	for (var i=0; i<ninlets; i++) {
		var box = gen_patcher.newdefault([10+110*i, 60, "in", i+1]);
		gen_patcher.connect(box, 0, codebox, i);
	}
	// create the outlet:
	gen_patcher.connect(codebox, 0, gen_patcher.newdefault([10, 320, "out", 1]), 0);
}
