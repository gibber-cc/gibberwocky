const Examples = {
  default : `// ctrl+enter to execute line or selection
// make sure the transport in Ableton is running before 
// attemptingto execute any code.

// pick a track to target with an instrument on it
// subsitute another number for 0 as needed
track = tracks[0]

// play a note identified by name
track.note( 'c4' ) // ... or d4, fb2, e#5 etc.

// play a note identified by number. The number represents a
// position in the master scale object. By default the master
// scale is set to c4 Aeolian

track.note( 0 )

// Change master scale root
Scale.master.root( 'eb4' )
track.note( 0 )

// sequence calls to the note method every 1/16 note
// traveling up the current master scale. An optional
// third argument assigns an id# to the sequencer; by
// default this id is set to 0 if no argument is passed.
// Assigning sequences to different id numbers allows them
// to run in parallel.
track.note.seq( [0,1,2,3,4,5,6,7], 1/16 )

// sequence velocity to use random values between 10-127 (midi range)
track.velocity.seq( Rndi( 10,127 ), 1/16 )

// sequence duration of notes in milliseconds
track.duration.seq( [ 50, 250, 500 ].rnd(), 1/16 )

// sequence the master scale to change root every measure
Scale.root.seq( ['c4','d4','f4','g4'], 1 )

// sequence the master scale to change mode every measure
Scale.mode.seq( ['aeolian','lydian', 'wholeHalf'], 1 )

// stop the sequence with id# 0 from running
track.note[ 0 ].stop()

// stop scale sequencing
Scale.mode[ 0 ].stop()
Scale.root[ 0 ].stop()

// set scale mode
Scale.mode( 'Lydian' )
Scale.root( 'c3' )

// Create an arpegctor by passing notes of a chord, 
// number of octaves to play, and style. Possible styles 
// include 'up', 'down', 'updown' (repeat top and bottom 
// notes) and 'updown2'
a = Arp( [0,2,3,5], 4, 'updown2' )

// create sequencer using arpeggiator and 1/16 notes
track.note.seq( a, 1/16 )

// transpose the notes in our arpeggio by one scale degree
a.transpose( 1 )

// sequence transposition of one scale degree every measure
a.transpose.seq( 1,1 )

// reset the arpeggiator every 8 measures 
// (removes transposition)
a.reset.seq( 1, 8 )

// stop sequence
track.note[ 0 ].stop()

// creates sequencer at this.note[1] (0 is default)
track.note.seq( [0,1,2,3], [1/4,1/8], 1 )

// parallel sequence at this.note[2] with 
// random note selection  (2 is last arg)
track.note.seq( [5,6,7,8].rnd(), 1/4, 2 )

// Every sequence contains two Pattern functions. 
// The first, 'values',determines the output of the 
// sequencer. The second, 'timings', determines when the 
// sequencer fires.

// sequence transposition of this.note[2]
track.note[ 2 ].values.transpose.seq( [1,2,3,-6], 1 )

// stop this.note[1]
track.note[ 1 ].stop()

// start this.note[0]
track.note[ 1 ].start()`,

['sequencing parameter changes']: `/* Almost every parameter in Ableton can be sequenced and controlled
using gibberwocky. Because there are hundreds (and often thousands) of paramters exposed
for control in any given Live set, gibberwocky provides a more organized way to search
them. In the gibberwocky interface, go to the sidebar and click on the 'lom' tab. 
LOM is short for 'Live Object Model', and this tab will show you a tree graph 
representation of all the tracks / devices / parameters that are exposed
for control in Live. Click on any of the small triangles next to the tracks / devices to
expand or collapse the view for a particular node in the treeview graph.

Explore the tree graph a little bit. When you find a parameter that you'd like to control, click on
it in the treeview and then drag it into gibberwocky's code editor. This will copy and paste the
path to the particular parameter you selected for control into the editor, making it easy to start
sequencing. Unfortunately, it's tricky to enter these paths without usign the treeview (at least at
first), but this is because a typical Ableton session has hundreds and hundreds (if not thousands) of
parameters exposed for control.

Let's say you had an Impulse using the 606 preset on Track 1, and you dragged the 'Global Time'
parameter into the window. You should see something like the following:*/

tracks['1-Impulse 606'].devices['Impulse']['Global Time']

/*That string of code actually points to a function. If we pass it a value between 0-1, we can 
change the value of the time parameter in our Impulse:*/

tracks['1-Impulse 606'].devices['Impulse']['Global Time']( .15 ) // low value
tracks['1-Impulse 606'].devices['Impulse']['Global Time']( .95 ) // high value

/* After running either of the above two lines of code (by placing your cursor on it and hitting
ctrl+enter) you should see the time value change in your Impulse. Great! Now we can control it
with sequencing as well, using syntax almost identical to what you have previously
explored to sequence note, velocity, and duration messages (at least what you've hopefully
explored... if not, check out the corresponding demos). Below is a line of code that
incremenets the time parameter by .25 every 1/2 note... it loops back to 0 after reaching 1.*/

tracks['1-Impulse 606'].devices['Impulse']['Global Time'].seq( [0, .25, .5, .75, 1], 1/2 )

// We can do the same pattern transforms on our values that we can do with note/veloctiy/duration 
// sequences. We can also sequence randomly:

tracks['1-Impulse 606'].devices['Impulse']['Global Time'].seq( Rndf(), 1/16 )

/* Equally as powerful as sequencing is modulating these parameters using gen~ expressions. See
the corresponding tutorial for more details about this.*/ `,

['modulating with gen~'] : `/* gen~ is an extension for Max4Live for synthesizing audio/video signals.
In gibberwocky, we can use gen~ to create complex modulation systems that run at audio rate
and with a much higher resolution than MIDI; there are 4294967296 possible values for gen~
signals vs 127 for MIDI. This is a huge improvement, especially for controlling frequencies and
other parameters that provide large sweeps of range. In the context of gibberwocky, think of
gen~ graphs as analog(ish) modular patchbays that you can use to control almost any parameter in Live.

As we saw in the paramter sequencing tutorial (look at that now if you haven't yet, or you'll be a
bit lost here), most ugens from gen~ are available for scripting in gibberwocky. In the gibberwocky interface,
go to the sidebar, click on the 'lom' tab, and drag a parameter into the editor that you'd like to
modulate. For purposes of this tutorial, we'll assume we're modulating the same parameter from the
parameter sequencing tutorial: the Global Time of an Impulse device on the first track in the Live set.

Perhaps the most basic modulation is a simple ramp. Remember that all Live parameters accepts values
between {0,1}; this happens to be what the phasor() ugen outputs at a argument frequency. For example,
to fade our Global Time parameter from its minimum to its maximum value once every second we would use:*/

tracks['1-Impulse 606'].devices['Impulse']['Global Time']( phasor( 1 ) )

/* Execute the above line to see it in action. A related ugen is beat(), which creates a ramp over an
argument number of beats, making it easy to create tempo-synced modulation graphs. If we wanted to scale 
our phasor() from {.25,.75} we would use slightly more complex graph:*/

tracks['1-Impulse 606'].devices['Impulse']['Global Time']( 
  add( 
    .25,
    div( phasor( 1 ), 2 )
  )
)

/* The above graph divides our phasor in half, giving us a signal between {0,.5}, and then adds .25 to
this to give us our final signal. Another common ugen used for modulation is the sine oscillator; in
gen~ this is the cycle() ugen. The cycle() accepts one parameter, the frequency that it operates at.
So we can do the following:*/

tracks['1-Impulse 606'].devices['Impulse']['Global Time']( cycle( .5 ) )

/* However, you'll notice that there's a problem if you run the above line of code: the parameter
spends half of each oscillation at its minimum value. This is because cycle() returns a value between
{-1,1} instead of {0,1}, and whenever a value travels below 0 it is clamped. So, in order to use
cycle() we need to scale and offset its output the same way we did with our phasor() example:*/

tracks['1-Impulse 606'].devices['Impulse']['Global Time'](  
  add(
    .5,  
    div( cycle( .5 ), 2 )
  )
)

/* The above example will oscillate between {0,1} with .5 being the center point. Creating these
scalars and offsets is tedious enough that gibberwocky provides a lfo() ugen to take care of this
for you; this ugen is not found in the standard gen~ library (although, as we've seen above, it's
simple enough to make). lfo() accepts three parameters: frequency, amplitude, and center. For example,
to create a lfo that moves between {.6, .8} at 2Hz we would use:*/

mylfo = lfo( 2, .1, .7 )

// We can also easily sequence parameters of our LFO:

mylfo.frequency.seq( [ .5,1,2,4 ], 2 )

/* ... as well as sequence any other parameter in Live controlled by a gen~ graph. Although the lfo()
ugen provides named properties for controlling frequency, amplitude, and centroid, there is a more
generic way to sequence any aspect of a gen~ ugen by using the index operator ( [] ). For example,
cycle() contains a single inlet that controls its frequency, to sequence it we would use: */

mycycle = cycle( .25 )

mycycle[ 0 ].seq( [ .25, 1, 2 ], 1 )

tracks['1-Impulse 606'].devices['Impulse']['Global Time']( add( .5, div( mycycle, 2 ) ) )

/*For other ugens that have more than one argument (see the gen~ random tutorial for an example) we
simply indicate the appropriate index... for example, mysah[ 1 ] etc.*/`,

[ 'using the Score() object' ]  : `// Scores are lists of functions with associated
// relative time values. In the score below, the first function has
// a time value of 0, which means it begins playing immediately. The
// second has a value of 1, which means it beings playing one measure
// after the previously executed function. The last function has a
// timestamp of two, which means it begins playing two measures after
// the previously executed function. Scores have start(), stop(),
// loop(), pause() and rewind() methods.

s = Score([ 
  0, function() { 
    tracks[1].note.seq( 0, 1/4 )
  },
  1, function() { 
     tracks[1].note.seq( [0,1], Euclid(3,4), 1 )
  },
  2, function() { 
    tracks[1].note.seq( [7,14,13,8].rnd(), [1/4,1/8].rnd(), 2 )
  },  
])

s.stop()

// scores become much terser using arrow functions
// (note: Safari does not currently support arrow functions, except in betas)

s = Score([
  0, ()=> tracks[1].note.seq( [0,1,2,3], 1/4 ),
  1, ()=> tracks[1].note.seq( [0,1], Euclid(2,4), 1 ),
  1, ()=> tracks[1].note.seq( [3,4], [1/4,1/8], 2 )
])`,

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
 * pattern. In the example below, each pattern has sixteen
 * steps, so each step represents a sixteenth note.
 *
 * The individual patterns can be accessed using the note
 * numbers they are assigned to. So, given an instance with
 * the name 'a' (as below), the pattern for note 60 can be
 * accessed at a[60]. Note that you have to access with brackets
 * as a.60 is not valid JavaScript.
 *
 * The second argument to Steps is the track to target.  
 */ 

a = Steps({
  [60]: '3.3f..4..8.5...f',
  [62]: '7.9.f4.....6f...',
  [64]: '........7.9.c..d',
  [65]: '..6..78..b......',
  [67]: '.f..3.........f.',  
  [71]: 'e.a.e.a.e.a.a...',  
  [72]: '..............e.',
}, tracks[0] )

// rotate one pattern in step sequencer
// every measure
a[71].rotate.seq( 1,1 )

// reverse all steps each measure
a.reverse.seq( 1, 2 )`,

}

module.exports = Examples//stepsExample2//simpleExample//genExample//exampleScore4//exampleScore4 //'this.note.seq( [0,1], Euclid(5,8) );' //exampleCode
