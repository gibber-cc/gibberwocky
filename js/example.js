const Examples = {
  introduction:`/* gibberwocky.live - introduction
 * 
 * This introduction assumes that you have the gibberwocky.demo.als
 * project open and running in Live. If not, it's easy to make your own
 * version; just place an instance of the gibberwocky_master plugin on 
 * Live's master track, and an instance of the gibberwocky_midi plugin
 * on any track you'd like to control with gibberwokcy.
 *
 * To execute any line of code, hit Ctrl+Enter. 
 * To stop all running sequences, hit Ctrl+. (period), or execute clear() 
 * (Ctrl+. doesn't work on some non-US keyboards).
 *
 * Make sure Live's transport is running (hit play). When you've played
 * around with this demo, start working your way through the tutorials
 * listed in the 'demos' tab in the sidebar.
 */

// start kick drum using impulse (preset 606) on tracks[0]
tracks[0].midinote.seq( 60, Euclid(5,8) )

// randomly pick between open and closed hi-hats
// and eighth notes vs. 1/16th notes. If 1/16th
// notes are played, always play two back to back.
tracks[0].midinote.seq( [64,65].rnd(), [1/8,1/16].rnd(1/16,2), 1 )

// play a scintillating bass line
tracks[1].note.seq( [-14,-12,-9,-8], 1/8 )

// play chords with piano sound
tracks[2].chord.seq( Rndi(0,8,3), 2 )

// control bass filter cutoff
tracks[1].devices[0]['Filter Freq']( mul( beats(2), .75 ) )   

// control panning of piano
tracks[2].pan( lfo( .15 ) ) 

// control time parameter of impulse
tracks[0].devices[0]['Global Time']( beats(8.33) ) 

// control transpostion of impulse with an lfo
// increasing in frequency over 8.66 beats
tracks[0].devices[0]['Global Transpose']( lfo( beats(8.66) ) )    
`,

['tutorial 1: basic messaging']:

`/*
 * gibberwocky.live - tutorial #1: basic messaging
 *
 * This first intro will explain how to send
 * MIDI note messages and control device and track parameters.
 *
 * To start, makesure you open the gibberwocky.demo project and
 * have Live's transport running.
*/

// The demo gibberwocky project has three tracks: drums, bass, and ambient
// piano. Let's start playing notes with the bass. The bass is located on the 
// second track, zero-indexed (start counting from zero).
bass = tracks[1]
bass.midinote( 60 ) // send middle C

// Click on the 'lom' tab (Live Object Model) in the sidebar on the right side
// of the gibberwocky client. This lists all the parameters exposed for control
// to gibberwocky. The bass track is listed under '2-Muugy' (Muggy is the name
// of the bass preset). If you uncollapse this branch, you see that the track
// contains a single Simpler device (all gibberwocky objects are ignored). Open
// up that Simpler branch, and you see all the parameters that can be controlled.
// If you drag and drop the 'Filter Freq' parameter into the code editor, it
// will insert the full path for that control into the editor. It should look
// something like this:

tracks['2-Muugy'].devices['Simpler']['Filter Freq']

// This is the path to a function we can call to change the filter cutoff frequency,
// like so:


tracks['2-Muugy'].devices['Simpler']['Filter Freq'](.75)
tracks['2-Muugy'].midinote( 36 )

tracks['2-Muugy'].devices['Simpler']['Filter Freq'](.25)
tracks['2-Muugy'].midinote( 36 )

// Note that we can shorten this in a number of ways. First, we can always refer
// to tracks and devices by their array position. In this case, the track index is
// 1 and the device index is 0 (remember, gibberwocky devices are ignored).

tracks[1].devices[0]['Filter Freq']( .5 ) // same effect!

// we can also use the shortcut we created earlier
bass.devices[0]['Filter Freq']( .35 )

// or...
simpler = tracks[1].devices[0]
simpler['Filter Freq']( 1 )

// Conveniently (well, in most cases) all parameters are measured from 0-1, so
// you don't really have to worry about ranges.

// In addition to controlling devices, we can also control parameters of each
// track in Live, such as volume, panning, mute and solo. This includes
// the return tracks and the master track as well.

tracks[0].volume( 0 )   // effectively mute our drums track 
returns[0].volume( 1 )  // increase our reverb volume
tracks[0].sends[0]( 1 ) // send our drum track full-blast to our reverb
master.volume( .5 )     // set the master volume

// OK, that's some basics out of the way. Try the sequencing tutorial next!`,

[ 'tutorial 2: basic sequencing' ]: `/* gibberwocky.live - tutorial #2: basic sequencing
 *
 * This tutorial will provide an introdution to sequencing messages in gibberwocky. In
 * order for sequencing in gibberwocky.live to work, you must start the Global Transport
 * running in Live. We're also assuming you're running the gibberwocky.demo project for
 * this tutorial.
 */

// In tutorial #1, we saw how we could send MIDI messages to specific tracks
// in Live.  We can easily sequence any of these methods by adding
// a call to .seq(). For example:

// send noteon message with a first value of 36
tracks[1].midinote( 36 )

// send same value every quarter note
tracks[1].midinote.seq( 36, 1/4 )

// You can stop all sequences in gibberwocky with the Ctrl+. keyboard shortcut
// (Ctrl + period) or by executing the command clear(). 
// You can also stop all sequences on a specific track:
tracks[1].stop()

// Most sequences in gibberwocky contain values (36) and timings (1/4). To
// sequence multiple values we simply pass an array:
tracks[1].midinote.seq( [36,48,60], 1/4 )

// ... and we can do the same thing with multiple timings:
tracks[1].midinote.seq( [36,48,60], [1/4,1/8] )

// We can also sequence our note velocities and durations.
clear()
tracks[1].midinote.seq( 48, 1/2 )
tracks[1].velocity.seq( [16, 64, 127], 1/2 )
tracks[1].duration.seq( [10, 100,500], 1/2 )

// If you experimented with running multiple variations of the midinote 
// sequences you might have noticed that only one runs at a time. For example,
// if you run these two lines:

clear()
tracks[1].midinote.seq( 72, 1/4 )
tracks[1].midinote.seq( 48, 1/4 )

// ...you'll notice only the second one actually triggers. By default, gibberwocky
// will replace an existing sequence with a new one. To stop this, you can pass an ID number 
// as a third argument to calls to .seq(). In the examples of sequencing we've seen so far,
// no ID has been given, which means gibberwocky is assuming a default ID of 0 for each
// sequence. When you launch a sequence on a channel that has the same ID as another running 
// sequence, the older sequence is stopped. If the sequences have different IDs they run 
// concurrently. Note this makes it really easy to create polyrhythms.

clear()
tracks[1].midinote.seq( 48, 1 ) // assumes ID of 0
tracks[1].midinote.seq( 60, 1/2, 1 ) 
tracks[1].midinote.seq( 72, 1/3, 2 ) 
tracks[1].midinote.seq( 84, 1/7, 3 ) 

// We can also sequence calls to midichord. You might remember from the first tutorial
// that we pass midichord an array of values, where each value represents one note. This
// means we need to pass an array of arrays in order to move between different chords.

clear()
tracks[2].midichord.seq( [[60,64,68], [62,66,72]], 1/2 )

// Even we're only sequencing a single chord, we still need to pass a 2D array. Of course,
// specifying arrays of MIDI values is not necessarily an optimal representation for chords.
// Move on to tutorial #3 to learn more about how to leverage music theory in gibberwocky.`,

['tutorial 3: harmony'] :`/* gibberwocky.live - tutorial #3: Harmony
 *
 * This tutorial covers the basics of using harmony in gibberwocky.live. It assumes you
 * know the basics of sequencing (tutorial #2) and are using the gibberwocky.demo project. 
 *
 * In the previous tutorials we looked at using raw MIDI values to send messages. However,
 * using MIDI note numbers is not an ideal representation. gibberwocky includes knoweldge of
 * scales, chords, and note names to make musical sequencing easier and more flexible. In this
 * tutorial, instead of using track.midinote() and track.midichord() we'll be using 
 * channel.note() and channel.chord(). These methods use gibberwocky's theory objects to
 * determine what MIDI notes are eventually outputted.
 */

// In our previous tutorial, we sent out C in the fourth octave by using MIDI number 60:
bass = tracks[1]
bass.midinote( 60 )

// We can also specify notes with calls to the note() method by passing a name and octave.
bass.note( 'c4' )
bass.note( 'fb3' )

bass.note.seq( ['c2','e2','g2'], 1/8 )

// remember, Ctrl+. (or clear()) stops all running sequences.

// In gibberwocky, the default scale employed is C minor, starting in the fourth octave. 
// This means that if we pass 0 as a value to note(), C4 will also be played.
bass.note( 0 )

// sequence C minor scale, starting in the fourth octave:
bass.note.seq( [0,1,2,3,4,5,6,7], 1/8 )

// negative scale indices also work:
bass.note.seq( [-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7], 1/8 )

// there is a global Scale object we can use to change the root and mode
// for all scales. Run the lines below individually  with the previous note sequence running.
Scale.root( 'd4' )
Scale.mode( 'lydian' )

Scale.root( 'c4' )
Scale.mode( 'phrygian' )

// We can also sequence changes to the root / mode:
Scale.root.seq( ['c2','d2','f2','g2'], 2 )
Scale.mode.seq( ['lydian', 'ionian', 'locrian'], 2 )

// stop the scale sequencing
Scale.root[0].stop()
Scale.mode[0].stop()
Scale.root( 'c4' )

// We can also define our own scales using chromatic scale indices. Unfortunately, 
// microtuning with MIDI is very diffcult, so only the standard eleven notes of 
// Western harmony are supported. Scales can have arbtrary numbers of notes.
Scale.modes[ 'my mode' ] = [ 0,1,2,3,5,6,10 ]
Scale.mode( 'my mode' )

Scale.modes[ 'another mode' ] = [0,1]
Scale.mode( 'another mode' )

Scale.mode.seq( ['my mode', 'another mode'], 4 )

/******** chords **********/
// Last but not least there are a few different ways to specify chords in gibberwocky.
// First, clear the current scene using Ctrl+.

pad = tracks[2]

// We can use note names:
pad.chord( ['c4','eb4','gb4','a4'] )

// Or we can use scale indices:
pad.chord( [0,2,4,5] )

// sequence in two-dimensional array
pad.chord.seq( [[0,2,4,5], [1,3,4,6]], 1 )

// We can also use strings that identify common chord names.
pad.chord( 'c4maj7' )
pad.chord( 'c#4sus7b9' )


pad.chord.seq( ['c4dim7', 'bb3maj7', 'fb3aug7'], 2 )

// OK, that's harmony in a nutshell. Next learn a bit about patterns and
// pattern manipulation in gibberwocky in tutorial #4.`,

['tutorial 4: patterns and pattern transformations']:`/* gibberwocky.live - tutorial #4: Patterns and Transformations
 *
 * This tutorial covers the basics of using patterns in gibberwocky.live. It assumes you
 * know the basics of sequencing (tutorial #2), have the the gibberwocky.demo project
 * loaded, and Live's transport running.
 *
 * In tutorial #2 we briefly mentioned that sequences consist of values and timings. These
 * are both stored in Pattern objects in gibberwocky, and these patterns can be controlled
 * and manipulated in a variety of ways over time.
 */
   
// Make sure the console is open in your sidebar to see the calls to log()
// Create a Pattern with some initial values.
myvalues = Pattern( 36,40,48,46 )

log( myvalues() ) // 36
log( myvalues() ) // 40
log( myvalues() ) // 48
log( myvalues() ) // 46
log( myvalues() ) // back to 36...

// sequence using this pattern:
bass = tracks[1]
bass.midinote.seq( myvalues, 1/8 )

// Everytime we pass values and timings to .seq(), it converts these into Pattern objects
// (unless we're already passing a Pattern object(s)). Remember from tutorial #2 that
// all of our sequences have an ID number, which defaults to 0. We can access these patterns
// as follows:

bass.midinote.seq( [36,40,48,46], [1/2,1/4] )
log( bass.midinote[0].values.toString() ) 
log( bass.midinote[0].timings.toString() ) 

// Now that we can access them, we can apply transformations:

bass.midinote[0].values.reverse()
bass.midinote[0].values.transpose( 1 ) // add 1 to each value
bass.midinote[0].values.scale( 1.5 )   // scale each value by .5
bass.midinote[0].values.rotate( 1 )    // shift values to the right
bass.midinote[0].values.rotate( -1 )   // shift values to the left
bass.midinote[0].values.reset()        // reset to initial values

// We can sequence these transformations:
bass.midinote[0].values.rotate.seq( 1,1 )
bass.midinote[0].values.reverse.seq( 1, 2 )
bass.midinote[0].values.transpose.seq( 1, 2 )
bass.midinote[0].values.reset.seq( 1, 8 )

// This enables us to quickly create variation over time. One more tutorial to go!
// Learn more about creating synthesis graphs for modulation in tutorial #5.`,
 
['tutorial 5: modulating with gen~'] :
 `/* Gen is an extension for Max for synthesizing audio/video signals.
LFOs, ramps, stochastic signals... Gen can create a wide variety of modulation sources for
exploration in Live.

Any property can be modulated via Gen in gibberwocky.live, and at a much higher resolution
than regular MIDI would typically allow for.
*/

// Let's experiment by controlling the 'Global Time' parameter of our demo project's
// Impulse (similar to the introduction example).

impulse = tracks[0].devices[0]
impulse['Global Time']( phasor(1) )

// This creates a sawtooth wave with a range of {0,1} and a frequency of 1 Hz. 
// We can also do sine waves:
impulse['Global Time']( cycle(1) )

// Note that the cycle ugen generates a full bandwidth audio signal with a range of {-1,1}
// Often times we want to specify a center point (bias) for our sine oscillator, in addition to 
// a specific amplitude and frequency. The lfo() function provides a simpler syntax for doing this:

// frequency, bias, amp 
mylfo = lfo( 2, .7, .2 )

impulse['Global Time']( mylfo )

// We can also easily sequence parameters of our LFO XXX CURRENTLY BROKEN:

mylfo.frequency.seq( [ .5,1,2,4 ], 2 )

/* ... as well as sequence any other parameter in Live controlled by a genish.js graph. Although the lfo()
ugen provides named properties for controlling frequency, amplitude, and centroid, there is a more
generic way to sequence any aspect of a gen~ ugen by using the index operator ( [] ). For example,
cycle() contains a single inlet that controls its frequency, to sequence it we would use: */

mycycle = cycle( .25 )

mycycle[ 0 ].seq( [ .25, 1, 2 ], 1 )

impulse['Global Time']( add( .5, div( mycycle, 2 ) ) )

/*For other ugens that have more than one argument (see the genish.js random tutorial for an example) we
simply indicate the appropriate index... for example, mysah[ 1 ] etc. For documentation on the types of
ugens that are available, see the gen~ reference: https://docs.cycling74.com/max7/vignettes/gen~_operators*/`, 

['tutorial 6: randomness']:
`/* gibberwocky.max - tutorial #6: Randomness
 *
 * This tutorial covers the basics of using randomness in gibberwocky.max. 
 * It assumes you've done all the other tutorials (#4 might be OK to have skipped),
 * have the gibberwocky help patch loaded, DSP turned on in Max and the global
 * transport rnning.
 *
 * Randomness in gibberwocky can be used to both create random values for sequencing 
 * as well as stochastic signals for modulation purposes.
 */
   
// rndf() and rndi() are used to generate a single random float or integer
// make sure you have the console tab in the gibberwocky sidebar
log( rndf() ) // outputs floats between 0-1
log( rndi() ) // outputs either 0 or 1

// although 0 and 1 are the default min/max values, we can pass
// arbitrary bounds:

log( rndf(-1,1) )
log( rndi(0,127) )

// if we pass a third value, we can create multiple random numbers at once,
// returned as an array.

log( rndf( 0,1,4 ) )
log( rndi( 0,127,3 ) )

// so, if we wanted to sequence a random midinote to the 'bass' device
// in the gibberwocky help patcher, we could sequence a function as follows:
bass = tracks[1]
bass.midinote.seq( ()=> rndi(0,127), 1/8 )

// Whenever gibberwocky sees a function in a sequence, it calls that function
// to generate a value or a timing. In practice this is common enough with
// random numbers that gibberwocky has a shortcut for creating functions
// that return a random value(s) in a particular range.
// Simply capitalize the call to rndi or rndf (to Rndi / Rndf ).

clear() // clear previous sequence
bass.note.seq( Rndi(-14,-7), 1/8 )

// Note that the code annotations show the final outputted MIDI note
// value, as opposed to the initial random number.

// And chords:
clear()
pad = tracks[2]
pad.chord.seq( Rndi(14,21,3), 1 )

// In addition to creating functions outputting random numbers, we can
// also randomly pick from the arrays used to initialize patterns.

// randomly play open or closed hi-hat every 1/16th note
drums = tracks[0]
drums.midinote.seq( [64,65].rnd(), 1/16 )

// For timings, it's often important to ensure that patterns eventually align
// themselves with a beat grid. For example, if we randomly choose a single 1/16th 
// note timing, then every subsequent note played will be offset from a 1/8th note
// grid until a second 1/16th note is chosen. We can ensure that particular values
// are repeated whenever they are selected to help with this problem.

// play constant kick drum to hear how bass aligns with 1/4 grid
drums.midinote.seq( 60, 1/4 )

// whenever a 1/16th timing is used, use it twice in a row
bass.note.seq( -14, [1/8,1/16].rnd( 1/16,2 ) )

// whenever a 1/16th timing is used, use it twice in a row and
// whenever a 1/12th timing is used, use it three times in a row
bass.note.seq( -14, [1/8,1/16,1/12].rnd( 1/16,2,1/12,3 ) )

// OK, that's the basics of using randomness in patterns. But we can also use
// noise to create randomness in modulations.

// here's noise() going out to control the 'Global Time' parameter
// of our drums Impulse
drums.devices[0]['Global Time']( noise() ) 

// we can scale the noise
drums.devices[0]['Global Time']( mul( noise(), .5 ) ) 

// we can also use sample and hold (sah) to selectively sample a noise signal.
// below, we sample noise whenever a separate noise signal crosses
// a threshold of .99995
drums.devices[0]['Global Time']( sah( noise(), noise(), .99995 ) )      

// alternatively, randomly sample a sine wave
drums.devices[0]['Global Time']( sah( cycle(2), noise(), .999 ) )

// OK, that's it for randomness... use it wisely!`,

[ 'using the Score() object' ]  : 
`// Scores are lists of functions with associated
// relative time values. In the score below, the first function has
// a time value of 0, which means it begins playing immediately. The
// second has a value of 1, which means it beings playing one measure
// after the previously executed function. The other funcions have
// timestamps of two, which means they begins playing two measures after
// the previously executed function. Scores have start(), stop(),
// loop(), pause() and rewind() methods.

bass = tracks[1]

s = Score([
  0, ()=> bass.note.seq( -14, 1/4 ),
 
  1, ()=> bass.note.seq( 0, Euclid(5,8) ),
 
  2, ()=> {
    arp = Arp( [0,1,3,5], 3, 'updown2' )
    bass.note.seq( arp, 1/32 )
  },
 
  2, ()=> arp.transpose( 1 ),
 
  2, ()=> arp.shuffle()
])

// Scores can also be stopped automatically to await manual retriggering.

s2 = Score([
  0,   ()=> bass.note( 0 ),

  1/2, ()=> bass.note( 1 ),

  Score.wait, null,

  0,   ()=> bass.note( 2 )
])

// restart playback
s2.next()

// CURRENTLY BROKEN
/* The loop() method tells a score to... loop. An optional argument specifies
 * an amount of time to wait between the end of one loop and the start of the next.*/

s3 = Score([
  0, ()=> bass.note.seq( 0, 1/4 ),
  1, ()=> bass.note.seq( [0,7], 1/8 ),
  1, ()=> bass.note.seq( [0, 7, 14], 1/12 )
])

s3.loop( 1 )

`,

['using the Arp() object (arpeggiator)']:
`/*
  * This tutorial assumes familiarity with the material
  * covered in tutorials 2–4.
  *
  * The Arp() object creates wrapped Pattern objects (see tutorial
  * #4) that are simply functions playing arpeggios. However,
  * the pattern transformations available in gibberwocky open
  * up a great deal of flexiblity in manipulating these arpeggios.
  */

bass = tracks[1]

// Make an arp: chord, number of octaves, mode.
myarp = Arp( [0,2,4,5], 4, 'updown' )

// other modes include 'up' and 'down'. XXX updown2 is broken :( 

// play arpeggiator with 1/16 notes
bass.note.seq( myarp, 1/16 )

// change root of Scale (see tutorial #3)
Scale.root( 'c2' )

// randomize arpeggiator
myarp.shuffle()

// transpose arpeggiator over time
myarp.transpose.seq( 1,1 )

// reset arpeggiator
myarp.reset()

// stop arpeggiator
bass.stop()

// The Arp() object can also be used with MIDI note values instead of
// gibberwocky's system of harmony. However, arp objects are designed
// to work with calls to note() by default, accordingly, they tranpose
// patterns by seven per octave (there are seven notes in a scale of one
// octave). For MIDI notes, there are 12 values... we can specify this
// as a fourth parameter to the Arp() constructor.

midiArp = Arp( [60,62,64,67,71], 4, 'down', 12 )

bass.midinote.seq( midiArp, 1/32 )

// bring everything down an octace
midiArp.transpose( -12 )

// change number of octaves
midiArp.octaves = 2
`,

['using the Euclid() object (euclidean rhythms)'] :
`/*
  * This tutorial assumes familiarty with the material
  * covered in tutorial #2. It will cover the basics of
  * working with Euclidean rhythms in gibberwocky.
  *
  * Euclidean rhythms are specifcations of rhythm using
  * a number of pulses allocated over a number of beats.
  * The algorithm attempts to distribute the pulses as
  * evenly as possible over all beats while maintaining
  * a grid. You can read a paper describing this here:
  *
  * http://archive.bridgesmathart.org/2005/bridges2005-47.pdf
  *
  * For example, consider the rhythm '5,8' where there
  * are 5 pulses over the span of eight notes while
  * maintaining a temporal grid. The algorithm distributes 
  * these as follows: "x.xx.xx." where 'x' represents a pulse
  * and '.' represents a rest. Below are a few other examples:
  *
  * 1,4 : x...
  * 2,3 : x.x
  * 2,5 : x.x..
  * 3,5 : x.x.x
  * 3,8 : x..x..x.
  * 4,9 : x.x.x.x..
  * 5,9 : x.x.x.x.x
  *
  * In gibberwocky, by default the number of beats chosen
  * also determines the time used by each beat; selecting
  * '5,8' means 5 pulses spread across 8 1/8 notes. However,
  * you can also specify a different temporal resolution for
  * the resulting pattern: '5,8,1/16' means 5 pulses spread
  * across 8 beats where each beat is a 1/16th note.
  *
  * You can specify Euclidean rhyhtms using the Euclid()
  * function, which returns a pattern (see tutorial #4);
  * in the example below I've assigned this to the variable E.
  */


// 5 pulses spread over 8 eighth notes
tracks[0].midinote.seq( 60, Euclid(5,8) )

// 3 pulses spread over 8 sixteenth notes
tracks[0].midinote.seq( 62, Euclid( 3, 8, 1/16 ), 1  )

// a quick way of notating x.x.
tracks[0].midinote.seq( 72, Euclid(2,4), 2 ) 

// because Euclid() generates Pattern objects (see tutorial #3)
// we can transform the patterns it generates:

tracks[0].midinote[1].timings.rotate.seq( 1,1 )
`,


['using the Steps() object (step-sequencer)'] : `/* Steps() creates a group of sequencer objects. Each
 * sequencer is responsible for playing a single note,
 * where the velocity of each note is determined by
 * a hexadecimal value (0-f), where f is the loudest note.
 * A value of '.' means that no MIDI note message is sent
 * with for that particular pattern element.
 *
 * The lengths of the patterns found in a Steps object can
 * differ. By default, the amount of time for each step in
 * a pattern equals 1 divided by the number of steps in the
 * pattern. In the example below, most patterns have sixteen
 * steps, so each step represents a sixteenth note. However,
 * the first two patterns (60 and 62) only have four steps, so
 * each is a quarter note. 
 *
 * The individual patterns can be accessed using the note
 * numbers they are assigned to. So, given an instance with
 * the name 'a' (as below), the pattern for note 60 can be
 * accessed at a[60]. Note that you have to access with brackets
 * as a.60 is not valid JavaScript.
 *
 * The second argument to Steps is the instrument to target. Note
 * that while the example below is designed to work with the
 * Analogue Drums device found in the gibberwocky help file,
 * that instrument is actually NOT velocity sensitive. 
 */

drums = tracks[0]

steps = Steps({
  [60]: 'ffff', 
  [62]: '.a.a',
  [64]: '........7.9.c..d',
  [65]: '..6..78..b......',
  [67]: '..c.f....f..f..3',  
  [69]: '.e.a.a...e.a.e.a',  
  [71]: '..............e.',
}, drums )

// rotate one pattern (assigned to midinote 71)
// in step sequencer  every measure
steps[69].rotate.seq( 1,1 )

// reverse all steps each measure
steps.reverse.seq( 1, 2 )`,

['using waveforms to generate patterns']: `/* Periodic Functions as Patterns */

// Gibberwocky enables you to define continuous signals that are
// periodically sampled to create patterns, a common technique in
// the modular synthesis community that was popularized in live coding
// by the Impromptu and Extempore environments. For example, to use a sine oscillator 
// to generate a pattern constrained to a musical scale:

// assumes that you have a melodic instrument loaded on track 1
tracks[1].note.seq(
  sine( 4, 0, 4 ), // period (in beats), center, amplitude
  1/8
)

tracks[1].octave(-2)

// as you can see from the visualization, this creates a sine oscillator
// with a period of 4 beats, an amplitude of 4 and a center (bias) of 0.
// sine() is a convenience method in gibberwocky; we could recreate this
// waveform using low-level Gen/genish functions:

tracks[1].note.seq(
  mul( cycle( btof(4) ), 4 ),
  1/8
)

// ... or for a straight line:
tracks[1].note.seq(
  mul( phasor( btof(8)), 8 ),
  1/8
)

// of course we can use a pattern for our rhythm:
tracks[1].note.seq(
  sine( 8, 0, 7 ),
  Euclid(5,16),
  1
)

tracks[1].note[1].timings.rotate.seq( 1,1 )

// a Lookup object can lookup a value in an array based on a signal.
// For example, in the sequence below the pattern alternates between
// 1/16, 1/8, and 1/4 notes based on a phasor:
tracks[1].note.seq(
  0, 
  Lookup( beats(4), [1/16,1/8,1/4] )              
)


// here's an example specifically sequencing a snare drum pattern
// (the snare drum is usually midinote 62 in an Impulse) along
// with velocity sequencing:
tracks[0].midinote.seq(
  62,
  Lookup( beats(4), [ 1/32, 1/16, 1/8, 1/4 ] )    
)
tracks[0].velocity.seq( sine( 4, 48, 48 ) )

// note that if you don't provide a set of durations to a sequence, 
// gibberwocky will assume the same trigger points used by running
// note or midinote sequences. In effect, this means that every time
// a note is trigger, our velocity sine oscillator is sampled and a new
// velocity is sent to Live.

// as one final example, in multi-samplers / drum machines different
// midi notes trigger different sounds. Using signals to control 
// select sounds can yield interesting patterns over time.

// assumes that tracks[0] contains an impulse:
tracks[0].note.seq(
  sine( 8, 4, 4 ),
  1/16
)`,

['using the Hex() function to create rhythms']:`/* Hex tutorial

The Hex function lets you quickly create
rhythmic patterns using hexadecimal numbers
which are subsequently converted to binary,
based off an idea originally implemented by 
Steven Yi. If you are unfamiliar with binary notation, 
maybe you'll learn a bit through this tutorial!

*/

// Hex objects accept strings of hexadecimal numbers
// (0-9, a-f). Each hexadecimal number is responsible
// for populating four 1/16th notes (by default) with
// pulses and rests. A value of 0 means no pulses are
// present. A value of 1 means the rightmost slot contains
// a pulse.

tracks[0].midinote.seq(
  60,
  Hex('1')
)

// Binary numbers can only consist of zeros or ones. Our
// rightmost digit is the ones entry. Our third digit 
// represents two. 

tracks[0].midinote.seq(
  60,
  Hex('2')
)

// For a hex value of three, we add the twos digit
// and the ones digit together.

tracks[0].midinote.seq(
  60,
  Hex('3')
)

// Our second digit represents four.
tracks[0].midinote.seq(
  60,
  Hex('4')
)

// A hex value of 7 would use our last three digits.
tracks[0].midinote.seq(
  60,
  Hex('7')
)

// a value of f fills all places.
tracks[0].midinote.seq(
  60,
  Hex('f')
)

// experiments with other letters (a-f) and numbers
// until you get a feeling for how a single hex digit
// translates to a four-digit binary number. Now we
// can chain multiple hex values together to create longer
// patterns. For example, here's a pattern of a quarter note
// followed by two-eighth notes.

tracks[0].midinote.seq(
  60,
  Hex('8a')
)

// each hex digit is responsible for four of the binary digits.
// these patterns can be arbitrarily long. For example, here is
// the classic kick pattern for Afrika Bambaataa's Planet Rock,
// over two measures.

tracks[0].midinote.seq(
  60,
  Hex('82008224')
)

// once you get some practice, typing 8 numbers to get a
// two measure 16th note pattern is pretty powerful. The
// resulting patterns can be manipulated like any other
// pattern in Gibberwocky. 

tracks[0].midinote.seq(
  60,
  Hex('c8')
)

// rotate the pattern
tracks[0].midinote[0].timings.rotate.seq( 1,1 )

// See the Patterns tutorial for other pattern transforms
// to use.

// by default each binary digit is a 1/16th note in duration,
// however, we can change this by adding a second argument to
// our Hex() call, making it easy to setup interesting
// polyrhythms.

// 1/16th note default
tracks[0].midinote.seq(
  60,
  Hex('8')
)

// 1/12th notes (quarter-note triplets)
tracks[0].midinote.seq(
  62,
  Hex( '665', 1/12 ),
  1
)

// 1/9th notes
tracks[0].midinote.seq(
  64,
  Hex( 'a7', 1/9 ),
  2
)

// core beat from planet rock by afrika bambaataa
// assumes 808 impulse with a cowbell
// for the sample assigned to midinote 71
// beat copied from http://808.pixll.de/anzeigen.php?m=15

// kick, alternating patterns for each measure
tracks[0].midinote.seq(
  60,
  Hex('82008224')
)

// snare
tracks[0].midinote.seq(
  62,
  Hex('0808'),
  1
)

// closed hat
tracks[0].midinote.seq(
  64,
  Hex('bbbf'),
  2
)

// cowbell
tracks[0].midinote.seq(
  71,
  Hex('ab5a'),
  3
)`,

['using 1D Cellular Automata']:`/* Automata Demo
 * This demo shows how to use 1D cellular automata to
 * create evolving rhythmic patterns. If you've never used
 * automata, or 1D specifically, I recommend reading the
 * first two sections of this excellent chapter on the subject,
 * from the Nature of Code by Daniel Shiffman:
 *
 * http://natureofcode.com/book/chapter-7-cellular-automata/
 *
 * For a discussion of rhythm and 1D automata, you could also
 * check out this paper by fellow live coder Andrew Brown:
 *
 * http://bit.ly/2BzUGtY
 *
 * The Automata class in gibberwocky creates a pattern that
 * outputs a set of zeros and ones, in the same fashion as the
 * Euclid and Hex classes. The parameters of the Automata are
 * as follows:
 *
 * Automata( rule=30, axiom='00011000', evolutionSpeed=1, playbackSpeed=1/16 )
 *
 * The 'rule' property determines which 1D automata rule, as 
 * outlined by Stephen Wolfram, will be used to compute each
 * generation. The 'axiom' determines the starting set of values;
 * this can be given as a decimal integer or as a binary string.
 * 'evolutionSpeed' (note:evolution is not the right word to use)
 * determines how often the Automata recomputes its state, while
 * the 'playbackSpeed' determines how fast the state is read to 
 * generate patterns.
 */

// play a kick drum pattern on an Impulse instrument.
// use rule 30: http://mathworld.wolfram.com/Rule30.html
// compute state every measure, and read the state every
// 1/16th note. this means each pattern will play twice.
tracks[0].midinote.seq(
  60,
  Automata( 30, '00011000', 1, 1/16 )
)

// note how that rather quickly becomes stable,
// alternating between two states with different offsets. 
// simply changing one value in the axiom creates a much
// longer cycle, to the point where repetition becomes 
// tricky to recognize.
tracks[0].midinote.seq(
  60,
  Automata( 30, '01011000', 1, 1/16 )
)

// let's try another rule: http://mathworld.wolfram.com/Rule158.html
// this time we'll compute the state every 1/2 note so
// that it doesn't repeat.
tracks[0].midinote.seq(
  64,
  Automata( 158, '00001000', 1/2, 1/16 )
)

// we can also use longer axioms which will in turn create longer
// patterns. this pattern lasts a measure without repeating
// itself, even using 1/16th notes.
tracks[0].midinote.seq(
  64,
  Automata( 158, '0000100000010000', 1, 1/16 )
)

// as mentioned, we can use decimal numbers for the axiom; it
// will be translated into a binary string
tracks[0].midinote.seq(
  60,
  Automata( 5, 147, 1/2, 1/16 )
)

tracks[0].midinote.seq( 62, 1/2, 1, 1/4 )

tracks[0].midinote.seq(
  64,
  Automata( 30, '00001000', 1, 1/16 )
  2
)`

}

module.exports = Examples
