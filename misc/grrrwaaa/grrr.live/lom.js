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

var d = new Dict("api");

function observe(prop, val) {
	outlet(0, prop, val);
}

function about(api) {
	console.log("id",api.id);
	console.log("path",api.path);
	console.log("type",api.type);
	console.log("children",api.children);
	//console.log("name",api.get("name"));
	//console.log("info",api.info);
}

function get_param_api(path) {
	var api = new LiveAPI(path);
	//about(api);
	var tree = {
		//id: api.id,
		path: path,
		//type: api.type,
		name: api.get("name")[0],
		min: api.get("min")[0],
		max: api.get("max")[0],
		//state: api.get("state")[0],
		value: api.get("value")[0],
		/* is quantized, is enabled, original_name */
	};
	return tree;
}

function get_devices_api(path) {
	var api = new LiveAPI(path);
	var tree = {
		//id: api.id,
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
		//id: api.id,
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
		//id: api.id,
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

function get_all_apis() {
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
	return tree;
}

var parameter_map = {};

function api() {
	parameter_map = {};
	var device = new LiveAPI("this_device");
	var this_track = new LiveAPI("this_device canonical_parent");
	
	var track_tree = get_track_api(unquote(this_track.path));

	var dev = track_tree.devices[1];
	for (var i in dev.parameters) {
		var param = dev.parameters[i];
		
		parameter_map[param.name] = param.path;
	}	
	
	
	
	d.parse(JSON.stringify(parameter_map));

	//outlet(0, "to_browser", "api", JSON.stringify(track_tree));
}

function midi_map() {
	var cs = new LiveAPI("control_surfaces 0");
	about(cs);
	
	
}

var psub;

var def = {
	objects: {
		gen: [10,  50, "phasor~ 0.25"],
		path: [100, 50, "live.path"],
		remote: [10, 100, "live.remote~"],
	},
	lines: [
		["gen", 0, "remote", 0],
		["path", 0, "remote", 1],
	],
};



function build() {
	if (psub) {
		this.patcher.remove(psub);
		psub = null;
	}
	//psub = this.patcher.newdefault([10, 10, "p","sub"]);
	//var p = psub.subpatcher();
		
	var parameter_path = "live_set tracks 0 devices 1 parameters " + 38; 		
	var parameter_path = parameter_map["Filter Freq"];
	
	parameter_path = parameter_path.split(" ");
	
	
	var p = this.patcher;
	
	var msg0 = p.newdefault([10, 10, "message"]);
	var msg1 = p.newdefault([70, 10, "message"]);
	var gen = p.newdefault([70,  50, "phasor~", "0.2"]);
	var livepath = p.newdefault([190, 50, "live.path"]);
	//var liveremote = p.newdefault([70, 90, "live.remote~"]);
	var liveremote = p.getnamed("liveremote");
	var scope = p.newdefault([190, 90, "scope~"]);
	var msg = p.newdefault([350, 90, "message"]);
	
	msg0.message("set", (["path"]).concat(parameter_path));
	msg1.message("set", "relink");

	p.connect(msg0, 0, livepath, 0);
	p.connect(msg1, 0, liveremote, 0);
	p.connect(gen, 0, liveremote, 0);
	p.connect(livepath, 1, liveremote, 1);
	p.connect(livepath, 1, msg, 1);
	p.connect(gen, 0, scope, 0);
	
	livepath.message("path", parameter_path);
	//gen.message("expr","phasor(0.2)");
}

function bang() {
	var device = new LiveAPI("this_device");
	outlet(0, "self_id", device.id);
	
	var this_track = new LiveAPI("this_device canonical_parent");
	outlet(0, "track_id", this_track.id);
	
	var track_tree = get_track_api(unquote(this_track.path));
	

	//post(JSON.stringify(track_tree));
	
	//get_all_apis();
}

var id = 0;
function test() {

	var code = "phasor(" + random(10) + ")";
	var parameter_path = parameter_map["Filter Freq"];
	
	parameter_path = parameter_path.split(" ");

	outlet(0, "setexpr", id, "expr", code);
	outlet(0, "setpath", id, (["path"]).concat(parameter_path));
	//id = (id + 1) % 2;
}