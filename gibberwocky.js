// properties:
var track = -1;

///////////////////////////////////////////////////////////////
// see https://docs.cycling74.com/max7/vignettes/live_object_model

var lom_dict = new Dict("lom");
var lom_cache_dict = new Dict("lom_cache");
var ranges_dict = new Dict("param_ranges");

var cached_device_ids = {};
	
var state = {
	bar: 1,
	bit: 1,
	bpm: 120,
	sig: "4/4",
	ply: 0,
};

function get_param_api(path) {
	var api = new LiveAPI(path);
	
	var tree = {
		id: api.id,
		//path: path,
		//type: api.type, // always "DeviceParameter"
		name: api.get("name")[0],
		//original_name: api.get("original_name")[0],
		//state: api.get("state")[0], // whether currently enabled or not
		value: api.get("value")[0], // not useful, because caching?		
		quantized: (api.get("is_quantized")[0] === 1), // true for bools and enums
	};
	
	// store ranges in tree and also in local dict
	tree.min = api.get("min")[0];
	tree.max = api.get("max")[0];
	//ranges_obj[api.id] = { min: tree.min, max: tree.max };
	
	ranges_dict.setparse(api.id, JSON.stringify({ min: tree.min, max: tree.max }));
	
	return tree;
}

function get_devices_api(path) {
	var api = new LiveAPI(path);
	
	var cached = lom_cache_dict.get(api.id);
	if (cached != undefined) {
		return JSON.parse(cached.stringify());
	}
	
	/*
	// use cached tree if available:
	var cached = cached_device_ids[api.id];
	if (cached !== undefined) {
		// don't bother parsing this device if we already did
		return cached;
	}
	*/
	
	var title = api.get("name")[0];
	if (title == "gibberwocky") {
		// TODO: don't include self!
		return;
	}
	
	var tree = {
		id: api.id,
		//path: path,
		type: api.get("type")[0], // 0(undefined), 1(instrument), 2(audio_effect), 4(midi_effect)
		title: title,
		name: api.get("class_display_name")[0],
		parameters: [],
	};
	
	var nparams = Math.min(1000,api.getcount("parameters"));
	for (var i=0; i<nparams; i++) {
		try {
			tree.parameters.push(get_param_api(path + " parameters " + i));
		} catch(e) {
			// sue me
		}
	}
	
	/*
			TODO: 
			Chains, for Racks
			(determine racks by "can_have_chains" boolean
			drum_pads, for drums (e.g. get names & note IDs)
			(determine drums by "can_have_drum_pads" boolean)
		
	// oddly, drumpads was 0 for Impulse
	//console.log(api.get("name")[0], "drumpads", api.get("can_have_drum_pads")[0]);
	*/
	
	// cache so that we don't keep visiting the same device:
	//cached_device_ids[api.id] = tree;
	
	lom_cache_dict.setparse(api.id, JSON.stringify(tree));
	
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
		var dev = get_devices_api(path + " devices " + i);
		if (dev) tree.devices.push(dev);
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

function bang() {
	if (lom_dict.get("busy") == 1) return;	// currently being written
	lom_dict.set("busy", 1);
	
	// get entire API...
	var api = new LiveAPI("live_set");
	
	var tree = {};
	for (var k in state) {
		tree[k] = state[k];
	}
	
	tree.tracks = [];
	var ntracks = api.getcount("tracks");
	for (var i=0; i<ntracks; i++) {
		tree.tracks.push(get_track_api("live_set tracks " + i));
	}
	tree.returns = [];
	var ntracks = api.getcount("return_tracks");
	for (var i=0; i<ntracks; i++) {
		tree.returns.push(get_track_api("live_set return_tracks " + i));
	}	
	tree.master = get_track_api("live_set master_track");
	
	/*
	todo?: cue_points,scenes,view,visible_tracks 
	*/
	
	// set dicts from js:
	var s = JSON.stringify(tree);
	lom_dict.parse(s);
	
	// done:
	outlet(0, "bang");
}

