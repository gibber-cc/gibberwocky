
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

In the patcher, the Live Device's websockets are currently supported by Oli Larkin's [ol.wsserver](https://github.com/olilarkin/wsserver). (Note: communicating directly in & out of ```jweb``` via patchcoords is not functional in a Live device). 

Audio events are triggered by a ```seq~``` object, driven by a locked ```phasor~ 4n``` which cycles on each beat. The ```seq~``` object thus executes max messages at precise times per beat. The ```seq~``` stores multiple sequences, and switches between each sequence at beat boundaries. Sequence switching is driven by a a locked ```metro 4n```, which generates synchronized beat events. These events are also sent over the websocket to the HTML page's JavaScript. At the end of each beat, the ```seq~``` sequence for that beat is cleared to make way for new events to be added as they are received from the websocket.

The max messages executed by ```seq~``` are ... 
- Live MIDI?
- gen~ expr?
- Live.API?
