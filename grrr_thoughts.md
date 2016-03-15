
What works: can use [ws] to request the next beat's sequence of data from browser
results are very accurately scheduled via [seq~] -- arbitrary messages (incl. noteout)

Weirdness is that multiple browser windows will all send data additively -- and can't see each other's data. So having the [jweb] open in Live is perhaps limited use?

(When open for editing, get "ws: failed to create server: Underlying Transport Error", presumably because it is in use by Live. But after saving & closing, works again.)

Having more than one of the amxd's open: all of them get the same messages from the browser. Nice way to debug since the Max editor won't let the ws work alongside Live.

https://docs.cycling74.com/max7/vignettes/live_object_model

------

Graham todo:

- play around with LOM
	- get a full dictionary of all the tracks/devices/parameters, with paths, and send to browser
	- how can we have many live.remote~s? does patcher scripting work in a live device

## LOM

https://docs.cycling74.com/max7/vignettes/live_object_model

## Client-side (HTML + JavaScript)

Interaction is via an HTML page, largely driven by JavaScript code. This page is hosted at localhost:8088, and can be accessed either in a regular browser window, or in the Live Device itself via Max's ```jweb``` object. 

The JavaScript content of this web page hosted in jweb creates a websocket to communicate with the Live Device. It responds to beat triggers received from the websocket and replies with new messages to sequence in the Live Device. This gives < 100ms roundtrip latency on local tests, under the threshold of one beat at reasonable bpm.

The JS code ... 

## Server-side (Live Device Max patcher)

Audio events are triggered by a ```seq~``` object, driven by a locked ```phasor~ 4n``` which cycles on each beat. The ```seq~``` object thus executes max messages at precise times per beat. The ```seq~``` stores multiple sequences, and switches between each sequence at beat boundaries. Sequence switching is driven by a a locked ```metro 4n```, which generates synchronized beat events. These events are also sent over the websocket to the HTML page's JavaScript. At the end of each beat, the ```seq~``` sequence for that beat is cleared to make way for new events to be added as they are received from the websocket.