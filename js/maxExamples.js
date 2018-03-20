const Examples = {
  introduction:`/* gibberwocky.max - introduction
 * 
 * This introduction assumes that your controlling the gibberwocky
 * object's help patch in Max. Otherwise your mileage will vary.
 *
 * First, make sure that audio is enabled in Max/MSP and that the
 * global transport is running. You can find the global transport
 * under Extras > GlobalTransport in the Max/MSP menubar.
 *
 * Next, make sure that gibberwocky is syncing to Max/MSP by
 * choosing config > Clock Sync > Max from the gibberwocky
 * sidebar.
 *
 * To execute any line of  code, hit Ctrl+Enter. Feel free to
 * modify and re-execute at any time. To stop all running 
 * sequences, hit Ctrl+. (period).
 *
 * After playing around here, check out some of the tutorials
 * found in the sidebar under demos > max demos..
 */

// start kick drum on Max for Live device
devices['drums'].midinote.seq( 36, Euclid(5,8) )

// randomly pick between open and closed hi-hats
// and eighth notes vs. 1/16th notes. If 1/16th
// notes are played, always play two back to back.
devices['drums'].midinote.seq( [42,46].rnd(), [1/8,1/16].rnd(1/16,2), 1 )

// play a scintillating bass line
devices['bass'].note.seq( [-14,-12,-9,-8], 1/8 )

// target namespaces 'bell' and 'squelch' 
// and sequence bangs at different rhythms
namespace('bell').seq( 1, [1/8,1/16,1/4].rnd(1/16,2) )
namespace('squelch').seq( 1, [1/4,1/16,1].rnd(1/16,4) )

// set values of named UI elements in patcher interface
params['White_Queen'].seq( [10,32,64,92,127], 1  )
params['Red_Queen'].seq( [32,64,96,127], 1 ) 

// send a sine wave out outlet 2 (the first signal outlet)
signals[0]( cycle(.1) ) 

// send a ramp lasting 16 beats out outlet 2
signals[1]( beats(16) ) 

// send a reverse sawtooth out outlet 3
signals[2]( sub(1,phasor( 1 ) ) )   

// send a sine wave with a modulated frequency out outlet 4
signals[3]( mul( cycle( mul(beats(8), .5 ) ), .15 ) )
`,

['tutorial 1: basic messaging']:

`/*
 * gibberwocky.max - tutorial #1: basic messaging
 *
 * This first intro will explain how to execute code, send
 * MIDI note messages, sequence arbitrary messages, and 
 * control UI objects.
 *
 * To start, makesure you open the gibberwocky object help patch
 * in Max and ahve the Max console open as well.
*/

// Messaging in gibberwocky.max can be done in two ways. First, 
// we can send messages out the first outlet of the gibberwocky.max
// object. To do this, we specify 'namespaces' where each
// namespace represents the first part of messages that are sent. Thus,
// you could create namespaces for individual instruments, or Max objects,
// or any other routing scheme you can come up with.

// Let's start by sending the following message 'synth1 1'. Connect the left
// most outlet of the gibberwocky object in Max to a print object, and then
// run the following three lines code and look at the console in Max:
synth1 = namespace('synth1') 
synth1( 1 )
synth1( 'test' )

// You can add an extra prefix to your message by appending a property:
synth1.gollygee( 'willickers?' )

// You can define arbitrary paths this way:
synth1.a.b.c.d.e.f.g.h( 'i?' )

// If you use [route], [routepass], or [sel] objects in Max/MSP you can easily direct 
// messages to a variety of destinations in this fashion. These namespaces will appear
// in the 'scene' tab of the browser reference; click on anyone to automatically insert
// the appropriate path into the code editor at the current cursor position. For example,
// using the gibberwocky help patcher both 'squelch' and 'bell' appear as targets as
// they are connected to a [sel] that is in turn connected to the leftmost gibberwocky
// outlet.

// gibberwocky can also easily target Max for Live devices embedded in Max
// patches. In the patcher for this tutorial there's an included Laverne
// instrument. If you click on the 'scene' tab of the gibberwocky sidebar, 
// you'll see a tree browser with a 'devices' branch. Open that branch to see all 
// Max for Live devices available in your patch. Now click on the branch for the device
// you want to send a midinote message to. The associated object path is automatically 
// inserted into your code editor at the current cursor position. Add a call to midinote to the end of this
// code snippet; it should look similar to the following:

devices['bass'].midinote( 60 ) // send middle C

// Now uncollapse the branch for your device in the scene browser. This lists
// all the parameters exposed for control on the Max for Live device. Click on any
// leaf to insert the full path to the control into your code editor. Here's the 
// 'res' parameter controlling the resonance of the filter on the bassline instrument.

devices['bass']['res']

// This points to a function; we can pass this function a value to manipulate the
// control.

devices['bass']['res']( 100 )

devices['bass'].note( 'eb4' )

// If you've used gibberwocky.live before, it's important to note that these controls
// do not default to a range of {0,1}. Many of the controls on bassline default to the 
// standard MIDI range of {0,127}.

// OK, that's some basics out of the way. Try the sequencing tutorial next!`,

[ 'tutorial 2: basic sequencing' ]: `/* gibberwocky.max - tutorial #2: basic sequencing
 *
 * This tutorial will provide an introdution to sequencing messages in gibberwocky. In
 * order for sequencing in gibberwocky.max to work, you must start the Global Transport
 * running in Max/MSP. In the gibberwocky help patcher there's
 * a link to open the Global Transport. Make sure you've opened this patcher to complete
 * this tutorial, as we'll be using the included Bassline instrument.
 */

// In tutorial #1, we saw how we could send MIDI messages to specific MIDI
// channel objects. We can easily sequence any of these methods by adding
// a call to .seq(). For example:

// send noteon message with a first value of 36
devices['bass'].midinote( 36 )

// send same value every quarter note
devices['bass'].midinote.seq( 36, 1/4 )

// You can stop all sequences in gibberwocky with the Ctrl+. keyboard shortcut
// (Ctrl + period). You can also stop all sequences on a specific channel:

devices['bass'].stop()

// Most sequences in gibberwocky contain values (60) and timings (1/4). To
// sequence multiple values we simply pass an array:

devices['bass'].midinote.seq( [60,72,48], 1/4 )

// ... and we can do the same thing with multiple timings:

devices['bass'].midinote.seq( [60,72,48], [1/4,1/8] )

// We can also sequence our note velocities and durations.
devices['bass'].midinote.seq( 60, 1/2 )
devices['bass'].velocity.seq( [16, 64, 127], 1/2 )
devices['bass'].duration.seq( [10, 100,500], 1/2 )

// If you experimented with running multiple variations of the midinote 
// sequences you might have noticed that only one runs at a time. For example,
// if you run these two lines:

devices['bass'].midinote.seq( 72, 1/4 )
devices['bass'].midinote.seq( 48, 1/4 )

// ...you'll notice only the second one actually triggers. By default, gibberwocky
// will replace an existing sequence with a new one. To stop this, you can pass an ID number 
// as a third argument to calls to .seq(). In the examples of sequencing we've seen so far,
// no ID has been given, which means gibberwocky is assuming a default ID of 0 for each
// sequence. When you launch a sequence on a channel that has the same ID as another running 
// sequence, the older sequence is stopped. If the sequences have different IDs they run 
// concurrently. Note this makes it really easy to create polyrhythms.

devices['bass'].midinote.seq( 48, 1 ) // assumes ID of 0
devices['bass'].midinote.seq( 60, 1/2, 1 ) 
devices['bass'].midinote.seq( 72, 1/3, 2 ) 
devices['bass'].midinote.seq( 84, 1/7, 3 ) 

// We can also sequence calls to midichord. You might remember from the first tutorial
// that we pass midichord an array of values, where each value represents one note. This
// means we need to pass an array of arrays in order to move between different chords.

devices['bass'].midichord.seq( [[60,64,68], [62,66,72]], 1/2 )

// Even we're only sequencing a single chord, we still need to pass a 2D array. Of course,
// specifying arrays of MIDI values is not necessarily an optimal representation for chords.
// Move on to tutorial #3 to learn more about how to leverage music theory in gibberwocky.`,

['tutorial 3: harmony'] :`/* gibberwocky.max - tutorial #3: Harmony
 *
 * This tutorial covers the basics of using harmony in gibberwocky.midi. It assumes you
 * know the basics of sequencing (tutorial #2) and have an appropriate MIDI output setup.
 * It also assumes you have the gibberwocky help patch open and the transport running.
 *
 * In the previous tutorials we looked at using raw MIDI values to send messages. However,
 * using MIDI note numbers is not an ideal representation. gibberwocky includes knoweldge of
 * scales, chords, and note names to make musical sequencing easier and more flexible. In this
 * tutorial, instead of using channel.midinote() and channel.midichord() we'll be using 
 * channel.note() and channel.chord(). These methods use gibberwocky's theory objects to
 * determine what MIDI notes are eventually outputted.
 */

// In our previous tutorial, we sent out C in the fourth octave by using MIDI number 60:
devices['bass'].midinote( 60 )

// We can also specify notes with calls to the note() method by passing a name and octave.
devices['bass'].note( 'c4' )
devices['bass'].note( 'fb3' )

devices['bass'].note.seq( ['c4','e4','g4'], 1/8 )

// remember, Ctrl+. stops all running sequences.

// In gibberwocky, the default scale employed is C minor, starting in the fourth octave. 
// This means that if we pass 0 as a value to note(), C4 will also be played.
devices['bass'].note( 0 )

// sequence C minor scale, starting in the fourth octave:
devices['bass'].note.seq( [0,1,2,3,4,5,6,7], 1/8 )

// negative scale indices also work:
devices['bass'].note.seq( [-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7], 1/8 )

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

// change the release time, scale mode, and root
devices['bass'].release( 75 )

// We can use note names:
devices['bass'].chord( ['c4','eb4','gb4','a4'] )

// Or we can use scale indices:
devices['bass'].chord( [0,2,4,5] )

// sequence in two-dimensional array
devices['bass'].chord.seq( [[0,2,4,5], [1,3,4,6]], 1 )

// We can also use strings that identify common chord names.
devices['bass'].chord( 'c4maj7' )
devices['bass'].chord( 'c#4sus7b9' )


devices['bass'].chord.seq( ['c4dim7', 'bb3maj7', 'fb3aug7'], 1 )

// OK, that's harmony in a nutshell. Next learn a bit about patterns and
// pattern manipulation in gibberwocky in tutorial #4.`,

['tutorial 4: patterns and pattern transformations']:`/* gibberwocky.max - tutorial #4: Patterns and Transformations
 *
 * This tutorial covers the basics of using patterns in gibberwocky.max. It assumes you
 * know the basics of sequencing (tutorial #2), have the the gibberwocky help patch
 * loaded, and the Global Transport running.
 *
 * In tutorial #2 we briefly mentioned that sequences consist of values and timings. These
 * are both stored in Pattern objects in gibberwocky, and these patterns can be controlled
 * and manipulated in a variety of ways over time.
 */
   
// Make sure the console is open in your sidebar to see the calls to Gibber.log()
// Create a Pattern with some initial values.
myvalues = Pattern( 60,62,64,65 )

Gibber.log( myvalues() ) // 60
Gibber.log( myvalues() ) // 62
Gibber.log( myvalues() ) // 64
Gibber.log( myvalues() ) // 65
Gibber.log( myvalues() ) // back to 60...

// sequence using this pattern:
devices['bass'].midinote.seq( myvalues, 1/8 )

// Everytime we pass values and timings to .seq(), it converts these into Pattern objects
// (unless we're already passing a Pattern object(s)). Remember from tutorial #2 that
// all of our sequences have an ID number, which defaults to 0. We can access these patterns
// as follows:

devices['bass'].midinote.seq( [62,74,38,50], [1/2,1/4] )
Gibber.log( devices['bass'].midinote[0].values.toString() ) 
Gibber.log( devices['bass'].midinote[0].timings.toString() ) 

// Now that we can access them, we can apply transformations:

devices['bass'].midinote[0].values.reverse()
devices['bass'].midinote[0].values.transpose( 1 ) // add 1 to each value
devices['bass'].midinote[0].values.scale( 1.5 )    // scale each value by .5
devices['bass'].midinote[0].values.rotate( 1 )    // shift values to the right
devices['bass'].midinote[0].values.rotate( -1 )   // shift values to the left
devices['bass'].midinote[0].values.reset()        // reset to initial values

// We can sequence these transformations:
devices['bass'].midinote[0].values.rotate.seq( 1,1 )
devices['bass'].midinote[0].values.reverse.seq( 1, 2 )
devices['bass'].midinote[0].values.transpose.seq( 1, 2 )
devices['bass'].midinote[0].values.reset.seq( 1, 8 )

// This enables us to quickly create variation over time. One more tutorial to go!
// Learn more about creating synthesis graphs for modulation in tutorial #5.`,
 
['tutorial 5: modulating with gen~'] :
 `/* Gen is an extension for Max for Live for synthesizing audio/video signals.
LFOs, ramps, stochastic signals... Gen can create a wide variety of modulation sources for
exploration.

We've seen that the first outlet of gibberwocky is used for messaging. The remaining outlets
are used for signals created by Gen objects. You can determine the number of outlets
using the @signals property; for example, [gibberwocky @signals 4], as seen in the gibberwocky
help patch, has four outputs for audio signals in addtion to its messaging output (for a total
of 5).
*/

// Let's experiment! Create a [gibberwocky @signals 1] object and connect the rightmost outlet
// to a [scope~]. We can send a simple ramp as follows:
signals[0]( phasor(1) )

// This creates a sawtooth wave with a range of {0,1}. We can also do sine waves:
signals[0]( cycle(1) )

// Note that the cycle ugen generates a full bandwidth audio signal with a range of {-1,1}
// Often times we want to specify a center point (bias) for our sine oscillator, in addition to 
// a specific amplitude and frequency. The lfo() function provides a simpler syntax for doing this:

// frequency, bias, amplitude 
mylfo = lfo( 2, .2, .7 )

signals[0]( mylfo )

// We can also easily sequence parameters of our LFO

mylfo.frequency.seq( [ .5,1,2,4 ], 2 )

/* ... as well as sequence any other parameter in Live controlled by a genish.js graph. Although the lfo()
ugen provides named properties for controlling frequency, amplitude, and centroid, there is a more
generic way to sequence any aspect of a gen~ ugen by using the index operator ( [] ). For example,
cycle() contains a single inlet that controls its frequency, to sequence it we would use: */

mycycle = cycle( .25 )

mycycle[ 0 ].seq( [ .25, 1, 2 ], 1 )

signals[0]( add( .5, div( mycycle, 2 ) ) )

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

devices['bass'].midinote.seq( ()=> rndi(0,127), 1/8 )

// Whenever gibberwocky sees a function in a sequence, it calls that function
// to generate a value or a timing. In practice this is common enough with
// random numbers that gibberwocky has a shortcut for creating functions
// that return a random value(s) in a particular range.
// Simply capitalize the call to rndi or rndf (to Rndi / Rndf ).

clear() // clear previous sequence
devices['bass'].note.seq( Rndi(-14,-7), 1/8 )

// And chords:
clear()
devices['bass'].chord.seq( Rndi(14,21,3), 1/8 )

// In addition to creating functions outputting random numbers, we can
// also randomly pick from the arrays used to initialize patterns.

// randomly play open or closed hi-hat every 1/16th note
devices['drums'].midinote.seq( [42,46].rnd(), 1/16 )

// For timings, it's often important to ensure that patterns eventually align
// themselves with a beat grid. For example, if we randomly choose a single 1/16th 
// note timing, then every subsequent note played will be offset from a 1/8th note
// grid until a second 1/16th note is chosen. We can ensure that particular values
// are repeated whenever they are selected to help with this problem.

// play constant kick drum to hear how bass aligns with 1/4 grid
devices['drums'].midinote.seq( 36, 1/4 )

// whenever a 1/16th timing is used, use it twice in a row
devices['bass'].note.seq( -14, [1/8,1/16].rnd( 1/16,2 ) )

// whenever a 1/16th timing is used, use it twice in a row and
// whenever a 1/12th timing is used, use it three times in a row
devices['bass'].note.seq( -14, [1/8,1/16,1/12].rnd( 1/16,2,1/12,3 ) )

// OK, that's the basics of using randomness in patterns. But we can also use
// noise to create randomness in modulations.

// here's noise() going out the second outlet of gibberwocky
signals[0]( noise() ) 

// we can scale the noise
signals[0]( mul( noise(), .5 ) ) 

// we can also use sample and hold (sah) to selectively sample a noise signal.
// below, we sample noise whenever a separate noise signal crosses
// a threshold of .99995
signals[0]( sah( noise(), noise(), .99995 ) )      

// alternatively, randomly sample a sine wave
signals[0]( sah( cycle(2), noise(), .999 ) )

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

s = Score([
  0, ()=> devices['bass'].note.seq( -14, 1/4 ),
 
  1, ()=> devices['bass'].note.seq( 0, Euclid(5,8) ),
 
  2, ()=> {
    arp = Arp( [0,1,3,5], 3, 'updown2' )
    devices['bass'].note.seq( arp, 1/32 )
  },
 
  2, ()=> arp.transpose( 1 ),
 
  2, ()=> arp.shuffle()
])

// Scores can also be stopped automatically to await manual retriggering.

s2 = Score([
  0,   ()=> devices['bass'].note( 0 ),

  1/2, ()=> devices['bass'].note( 1 ),

  Score.wait, null,

  0,   ()=> devices['bass'].note( 2 )
])

// restart playback
s2.next()

// CURRENTLY BROKEN
/* The loop() method tells a score to... loop. An optional argument specifies
 * an amount of time to wait between the end of one loop and the start of the next.*/

s3 = Score([
  0, ()=> devices['bass'].note.seq( 0, 1/4 ),
  1, ()=> devices['bass'].note.seq( [0,7], 1/8 ),
  1, ()=> devices['bass'].note.seq( [0, 7, 14], 1/12 )
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

// Make an arp: chord, number of octaves, mode.
myarp = Arp( [0,2,4,5], 4, 'updown' )

// other modes include 'up' and 'down'. XXX updown2 is broken :( 

// play arpeggiator with 1/16 notes
devices['bass'].note.seq( myarp, 1/16 )

// change root of Scale (see tutorial #3)
Scale.root( 'c2' )

// randomize arpeggiator
myarp.shuffle()

// transpose arpeggiator over time
myarp.transpose.seq( 1,1 )

// reset arpeggiator
myarp.reset()

// stop arpeggiator
devices['bass'].stop()

// The Arp() object can also be used with MIDI note values instead of
// gibberwocky's system of harmony. However, arp objects are designed
// to work with calls to note() by default, accordingly, they tranpose
// patterns by seven per octave (there are seven notes in a scale of one
// octave). For MIDI notes, there are 12 values... we can specify this
// as a fourth parameter to the Arp() constructor.

midiArp = Arp( [60,62,64,67,71], 4, 'down', 12 )

devices['bass'].midinote.seq( midiArp, 1/32 )

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

// store for faster reference
E = Euclid

devices['bass'].duration( 10 )

// 5 pulses spread over 8 eighth notes
devices['bass'].midinote.seq( 60, E(5,8) )

// 3 pulses spread over 8 sixteenth notes
devices['bass'].midinote.seq( 48, E( 3, 8, 1/16 ), 1  )

// a quick way of notating x.x.
devices['bass'].midinote.seq( 36, E(2,4), 2 ) 

// because Euclid() generates Pattern objects (see tutorial #3)
// we can transform the patterns it generates:

devices['bass'].midinote[1].timings.rotate.seq( 1,1 )

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

steps = Steps({
  [36]: 'ffff', 
  [38]: '.a.a',
  [41]: '........7.9.c..d',
  [43]: '..6..78..b......',
  [45]: '..c.f....f..f..3',  
  [42]: '.e.a.a...e.a.e.a',  
  [46]: '..............e.',
}, devices['drums'] )

// rotate one pattern (assigned to midinote 71)
// in step sequencer  every measure
steps[42].rotate.seq( 1,1 )

// reverse all steps each measure
steps.reverse.seq( 1, 2 )`,

['using waveforms to generate patterns']:
`/* Periodic Functions as Patterns */

// Gibberwocky enables you to define continuous signals that are
// periodically sampled to create patterns, a common technique in
// the modular synthesis community that was popularized in live coding
// by the Impromptu and Extempore environments. For example, to use a sine oscillator 
// to generate a pattern constrained to a musical scale:

// assumes you're using the gibberwocky help patch
bass = devices['bass']
bass.note.seq(
  sine( 1, 0, 4 ), // period (in beats), center, amplitude
  1/8
)

bass.octave(-2)

// as you can see from the visualization, this creates a sine oscillator
// with a period of 4 beats, an amplitude of 4 and a center (bias) of 0.
// sine() is a convenience method in gibberwocky; we could recreate this
// waveform using low-level Gen/genish functions:

bass.note.seq(
  mul( cycle( btof(4) ), 4 ),
  1/8
)

// ... or for a straight line:
bass.note.seq(
  mul( phasor( btof(8)), 8 ),
  1/8
)

// of course we can use a pattern for our rhythm:
bass.note.seq(
  sine( 8, 0, 7 ),
  Euclid(5,16)
  1
)

bass.note[1].timings.rotate.seq( 1,1 )

// a Lookup object can lookup a value in an array based on a signal.
// For example, in the sequence below the pattern alternates between
// 1/16, 1/8, and 1/4 notes based on a phasor:
bass.note.seq(
  0, 
  Lookup( beats(4), [1/16,1/8,1/4] )               
)


// here's an example specifically sequencing a snare drum pattern:
devices['drums'].midinote.seq(
  38,
  Lookup( beats(4), [ 1/32, 1/16, 1/8, 1/4 ] )      
)
// as one final example, in multi-samplers / drum machines different
// midi notes trigger different sounds. Using signals to control 
// select sounds can yield interesting patterns over time. also note
// that with our sine ugen we can pass an initial phase between 0-1.
// passing .75 means our sine oscillator starts at its lowest point,
// which in this case triggers the kick drum sound on beat 1
devices['drums'].midinote.seq(
  sine( 1, 40, 4, .75 ),
  1/16
)`,

['using the Hex() function to create rhythms']:
`/* Hex tutorial

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

drums = devices['drums']
drums.midinote.seq(
  36,
  Hex('1')
)

// Binary numbers can only consist of zeros or ones. Our
// rightmost digit is the ones entry. Our third digit 
// represents two. 

drums.midinote.seq(
  36,
  Hex('2')
)

// For a hex value of three, we add the twos digit
// and the ones digit together.

drums.midinote.seq(
  36,
  Hex('3')
)

// Our second digit represents four.
drums.midinote.seq(
  36,
  Hex('4')
)

// A hex value of 7 would use our last three digits.
drums.midinote.seq(
  36,
  Hex('7')
)

// a value of f fills all places.
drums.midinote.seq(
  36,
  Hex('f')
)

// experiments with other letters (a-f) and numbers
// until you get a feeling for how a single hex digit
// translates to a four-digit binary number. Now we
// can chain multiple hex values together to create longer
// patterns. For example, here's a pattern of a quarter note
// followed by two-eighth notes.

drums.midinote.seq(
  36,
  Hex('8a')
)

// each hex digit is responsible for four of the binary digits.
// these patterns can be arbitrarily long. For example, here is
// the classic kick pattern for Afrika Bambaataa's Planet Rock,
// over two measures.

drums.midinote.seq(
  36,
  Hex('82008224')
)

// once you get some practice, typing 8 numbers to get a
// two measure 16th note pattern is pretty powerful. The
// resulting patterns can be manipulated like any other
// pattern in Gibberwocky. 

drums.midinote.seq(
  36,
  Hex('c8')
)

// rotate the pattern
drums.midinote[0].timings.rotate.seq( 1,1 )

// See the Patterns tutorial for other pattern transforms
// to use.

// by default each binary digit is a 1/16th note in duration,
// however, we can change this by adding a second argument to
// our Hex() call, making it easy to setup interesting
// polyrhythms.

// 1/16th note default
drums.midinote.seq(
  36,
  Hex('8')
)

// 1/12th notes (quarter-note triplets)
drums.midinote.seq(
  38,
  Hex( '665', 1/12 ),
  1
)

// 1/9th notes
drums.midinote.seq(
  42,
  Hex( 'a7', 1/9 ),
  2
)

// core beat from planet rock by afrika bambaataa
// assumes 808 impulse with a cowbell
// for the sample assigned to midinote 71
// beat copied from http://808.pixll.de/anzeigen.php?m=15

// in this example, we use HexSteps to create multiple
// hex sequences and tersely assign them to a track.

h = HexSteps({
  // kick
  36:'82008224',
  // snare
  38:'0808',
  // closed hat
  42:'bbbf',
  // "cowbell"
  45:'ab5a'
}, devices.drums )
`,

['using 1D cellular automata']:
`/* Automata Demo
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

// play a kick drum pattern.
// use rule 30: http://mathworld.wolfram.com/Rule30.html
// compute state every measure, and read the state every
// 1/16th note. this means each pattern will play twice.
devices['drums'].midinote.seq(
  36,
  Automata( 30, '00011000', 1, 1/16 )
)

// note how that rather quickly becomes stable,
// alternating between two states with different offsets. 
// simply changing one value in the axiom creates a much
// longer cycle, to the point where repetition becomes 
// tricky to recognize.
devices['drums'].midinote.seq(
  36,
  Automata( 30, '01011000', 1, 1/16 )
)

// let's try another rule: http://mathworld.wolfram.com/Rule158.html
// this time we'll compute the state every 1/2 note so
// that it doesn't repeat.
devices['drums'].midinote.seq(
  38,
  Automata( 158, '00001000', 1/2, 1/16 )
)

// we can also use longer axioms which will in turn create longer
// patterns. this pattern lasts a measure without repeating
// itself, even using 1/16th notes.
devices['drums'].midinote.seq(
  42,
  Automata( 158, '0000100000010000', 1, 1/16 )
  1
)

// as mentioned, we can use decimal numbers for the axiom; it
// will be translated into a binary string
devices['drums'].midinote.seq(
  36,
  Automata( 5, 147, 1/2, 1/16 )
)

devices['drums'].midinote.seq( 38, 1/2, 1, 1/4 )

devices['drums'].midinote.seq(
  42,
  Automata( 30, '00001000', 1, 1/16 ),
  2
)`
}

module.exports = Examples
