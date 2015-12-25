
## Timing

Timing is great within MSP:

[phasor~ 1n @lock 1] gives us a very nice audio ramp per bar -- 4n would be per beat, etc. 
- Easy to imagine Tidal-like transforms to this ramp.
- send to [techno~] for sample accurate curves: amplitude, pitch, attack, decay, curve, pos. 
- send to zigzag~ (mode 1) to trigger an arbitrary list of amp/time line segments. A little fiddly to set up. Might be just as easy to fill a buffer~. 

Timing is great within Max:

Get excellent timing from [metro @interval 20 ticks @quantize 20 ticks @autostart 1 @active 1] -> [transport]. The @interval and @quantize values determine the resolution within a beat (normally 480 ticks). So 20 ticks gives 1/24th, good enough for 8ths and 6ths of a beat.

[metro 1n @quantize 480 ticks @autostart 1 @active 1] gives us a bang on each bar, which could be used to synchronize edits. 

[plugsync~] tells us if the transport is running, which can be used to drive these metros. 

Timing is sloppy in JavaScript:

Timing via [js] is very sloppy, because it runs in a low priority thread. Therefore all actual event triggering should be via Max objects. Therefore the [js] needs to run in the future, and queue up changes for Max to apply.

Queue options:

- fill a dict array, iter & clear them at each bar marker.
	- annoying error message when array is empty... 
- [seq~]:
	- add <seq id> <time> <event...>

seq aseq, play 1
delete aseq 0
add aseq 0.5 72

Since we can have multiple seqs, we can simply switch between them at bar points.


