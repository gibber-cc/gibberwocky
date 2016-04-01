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
	if (str) {
		if (str[0] === '"' && str[str.length - 1] === '"') {
			return str.slice(1, str.length - 1);
		} 
		return str;
	}
};

///////////////////////////////////////////////////////////////


var dict = new Dict("lom");


function get_param_api(path) {
	var api = new LiveAPI(path);
	//about(api);
	var tree = {
		id: api.id,
		//path: path,
		//type: api.type, // always "DeviceParameter"
		name: api.get("name")[0],
		//original_name: api.get("original_name")[0],
		min: api.get("min")[0],
		max: api.get("max")[0],
		//state: api.get("state")[0], // whether currently enabled or not
		value: api.get("value")[0], // initial value
		quantized: (api.get("is_quantized")[0] === 1), // true for bools and enums
		/* is quantized, is enabled, original_name */
	};
	return tree;
}

function get_devices_api(path) {
	var api = new LiveAPI(path);
	var tree = {
		id: api.id,
		path: path,
		//type: api.type,
		title: api.get("name")[0],
		name: api.get("class_display_name")[0],
		parameters: [],
	};
	
	var nparams = Math.min(1000,api.getcount("parameters"));
	for (var i=0; i<nparams; i++) {
	
		// this just seems to blow out the memory or something and make Live crash
		try {
			tree.parameters.push(get_param_api(path + " parameters " + i));
		} catch(e) {
			// sue me
		}
	}
	return tree;
}

function get_mixer_device_api(path) {
	var api = new LiveAPI(path);
	var tree = {
		id: api.id,
		path: unquote(api.path),
		type: api.type,
		sends: [],
		panning: get_param_api(path + " panning"),
		//track_activator: get_param_api(path + " track_activator"),
		volume: get_param_api(path + " volume"),
	};
	
	var nparams = api.getcount("sends");
	for (var i=0; i<nparams; i++) {
		tree.sends.push(get_param_api(path + " sends " + i));
	}
	return tree;
}

function get_track_api(path) {
	var api = new LiveAPI(path);
	var tree = {
		id: api.id,
		path: unquote(api.path),
		//type: api.type,
		name: api.get("name")[0],
		devices: [],
		//mixer_device: get_mixer_device_api(path + " mixer_device"),
		/* clip_slots, view ; mute, arm, routing, playing/fired slot, audio/midi IO, etc. */
	};
	
	var ndevices = api.getcount("devices");
	for (var i=0; i<ndevices; i++) {
		tree.devices.push(get_devices_api(path + " devices " + i));
	}
	return tree;
}

var state = {
	bar: 1,
	bit: 1,
	bpm: 120,
	sig: "4/4",
	ply: 0,
};

function bang() {
	// get entire API...
	var api = new LiveAPI("live_set");
	
	var tree = {
		id: api.id,
		path: unquote(api.path),
		tracks: [],
		/*
		cue_points,master_track,return_tracks,scenes,view,visible_tracks 
		*/
	}
	
	var ntracks = api.getcount("tracks");
	for (var i=0; i<ntracks; i++) {
		tree.tracks.push(get_track_api("live_set tracks " + i));
	}
	
	// copy in 
	for (var k in state) {
		tree[k] = state[k];
	}
	
	// set dict from tree.
	var s = JSON.stringify(tree);
	dict.parse(s);
	
	
	outlet(0, "bang");
}

function store(key, value) {
	state[key] = value;
}	