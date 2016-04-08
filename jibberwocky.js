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

// see https://docs.cycling74.com/max7/vignettes/live_object_model


var dict = new Dict("lom");
var ranges_dict = new Dict("param_ranges");
var ranges_obj = {};

function get_param_api(path) {
	var api = new LiveAPI(path);
	var min = api.get("min")[0];
	var max = api.get("max")[0];
	var tree = {
		id: api.id,
		//path: path,
		//type: api.type, // always "DeviceParameter"
		name: api.get("name")[0],
		//original_name: api.get("original_name")[0],
		min: min,
		max: max,
		//state: api.get("state")[0], // whether currently enabled or not
		value: api.get("value")[0], // initial value
		quantized: (api.get("is_quantized")[0] === 1), // true for bools and enums
	};
	
	ranges_obj[api.id] = { min: min, max: max };
	
	return tree;
}

function get_devices_api(path) {
	var api = new LiveAPI(path);
	var tree = {
		id: api.id,
		//path: path,
		type: api.get("type")[0], // 0(undefined), 1(instrument), 2(audio_effect), 4(midi_effect)
		title: api.get("name")[0],
		name: api.get("class_display_name")[0],
		parameters: [],
		
		/*
			TODO: 
			Chains, for Racks
			(determine racks by "can_have_chains" boolean
			drum_pads, for drums (e.g. get names & note IDs)
			(determine drums by "can_have_drum_pads" boolean)
		*/
	};
	
	// oddly, drumpads was 0 for Impulse
	//console.log(api.get("name")[0], "drumpads", api.get("can_have_drum_pads")[0]);
	
	var nparams = Math.min(1000,api.getcount("parameters"));
	for (var i=0; i<nparams; i++) {
		try {
			tree.parameters.push(get_param_api(path + " parameters " + i));
		} catch(e) {
			// sue me
		}
	}
	return tree;
}

function get_track_api(path) {
	var api = new LiveAPI(path);
	var tree = {
		id: api.id,
		//path: unquote(api.path),
		//type: api.type, // always "Track"
		name: api.get("name")[0],
		midi_input: api.get("has_midi_input")[0],	// 1 for midi tracks
		devices: [],
		/* clip_slots, view ; mute, arm, routing, playing/fired slot, audio/midi IO, etc. */
	};
	
	var ndevices = api.getcount("devices");
	for (var i=0; i<ndevices; i++) {
		tree.devices.push(get_devices_api(path + " devices " + i));
	}
	
	var mixer_path = path + " mixer_device";
	var mixer_api = new LiveAPI(mixer_path);
	tree.volume = get_param_api(mixer_path + " volume");
	tree.panning = get_param_api(mixer_path + " panning");
	tree.sends = [];
	var nparams = mixer_api.getcount("sends");
	for (var i=0; i<nparams; i++) {
		tree.sends.push(get_param_api(mixer_path + " sends " + i));
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
		//id: api.id,
		//path: unquote(api.path),
	}
	
	// copy in 
	for (var k in state) {
		tree[k] = state[k];
	}
	
	tree.tracks = [];
	var ntracks = api.getcount("tracks");
	for (var i=0; i<ntracks; i++) {
		tree.tracks.push(get_track_api("live_set tracks " + i));
	}
	
		/*
		also: cue_points,scenes,view,visible_tracks 
		*/
	
	tree.returns = [];
	var ntracks = api.getcount("return_tracks");
	for (var i=0; i<ntracks; i++) {
		tree.returns.push(get_track_api("live_set return_tracks " + i));
	}
	
	tree.master = get_track_api("live_set master_track");
	
	// set dict from tree.
	var s = JSON.stringify(tree);
	dict.parse(s);
	
	var s = JSON.stringify(ranges_obj);
	ranges_dict.parse(s);
	
	outlet(0, "bang");
}

function store(key, value) {
	state[key] = value;
}	