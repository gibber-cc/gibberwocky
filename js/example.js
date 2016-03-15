const exampleCode = `// ctrl+enter to execute line or selection
// make sure the transport in Ableton is running before 
// attemptingto execute any code.

// play a note identified by name
this.note( 'c4' ) // ... or d4, fb2, e#5 etc.

// play a note identified by number. The number represents a
// position in the master scale object. By default the master
// scale is set to c4 Aeolian

this.note( 0 )

// Change master scale root
Scale.master.root( 'eb2' )
this.note( 0 )

// sequence calls to the note method every 1/16 note
// traveling up the current master scale. An optional
// third argument assigns an id# to the sequencer; by
// default this id is set to 0 if no argument is passed.
// Assigning sequences to different id numbers allows them
// to run in parallel.
this.note.seq( [0,1,2,3,4,5,6,7], Euclid(5,8) )

// sequence the master scale to change root every measure
Scale.root.seq( ['c4','d4','f4','g4'], 1 )

// sequence the master scale to change mode every measure
Scale.mode.seq( ['Aeolian','Lydian', 'WholeHalf'], 1 )

// stop the sequence with id# 0 from running
this.note[ 0 ].stop()

// stop scale sequencing
Scale.mode[ 0 ].stop()
Scale.root[ 0 ].stop()

// set scale mode
Scale.mode( 'Lydian' )

// Create an arpegctor by passing notes of a chord, 
// number of octaves to play, and style. Possible styles 
// include 'up', 'down', 'updown' (repeat top and bottom 
// notes) and 'updown2'
a = Arp( [0,2,3,5], 4, 'updown2' )

// create sequencer using arpeggiator and 1/16 notes
this.note.seq( a, 1/16 )

// transpose the notes in our arpeggio by one scale degree
a.transpose( 1 )

// sequence transposition of one scale degree every measure
a.transpose.seq( 1,1 )

// reset the arpeggiator every 8 measures 
// (removes transposition)
a.reset.seq( null, 8 )

// stop sequence
this.note[ 0 ].stop()

// creates sequencer at this.note[1] (0 is default)
this.note.seq( [0,1,2,3], [1/4,1/8], 1 )

// parallel sequence at this.note[2] with 
// random note selection  (2 is last arg)
this.note.seq( [5,6,7,8].rnd(), 1/4, 2 )

// Every sequence contains two Pattern functions. 
// The first, 'values',determines the output of the 
// sequencer. The second, 'timings', determines when the 
// sequencer fires.

// sequence transposition of this.note[2]
this.note[ 2 ].values.transpose.seq( [1,2,3,-6], 1 )

// stop this.note[1]
this.note[ 1 ].stop()

// start this.note[0]
this.note[ 1 ].start()

// longhand reference to sequencer 
this.sequences.note[ 2 ].stop()

// sugar
this.note[ 2 ].start()`

const exampleScoreCode = `Score([ 
  0, function() { console.log('1') },
  1/4, function() { console.log('2') },
  1/4, function() { console.log('3') },
  1/4, function() { console.log('4') },
  1, function() { console.log('5555') },  
])`

const exampleScore2 = `s = Score([ 
  0, function() { 
    this.note.seq( 0, 1/4 )
  },
  1, function() { 
    this.note.seq( [0,1], Euclid(3,4), 1 )
  },
  1, function() { console.log('5555') },  
])`

const exampleScore3 = `s = Score([
  0, ()=> {
    this.note.seq( [0,1,2,3], 1/4 )
  },
  1, ()=> { this.note.seq( [0,1], Euclid(2,4), 1 ) },
  2, function() { this.note.seq( [3,4], [1/4,1/8], 2 ) }
])`

const exampleScore4 = `s = Score([
  0, ()=> this.note.seq( [0,1,2,3], 1/4 ),

  1, ()=> this.note.seq( [0,2,4,5], 1/4, 1 ),
  
  1, ()=> this.note.seq( [3,4,5,6],[1/4,1/8], 2 )
])`

const exampleRange = `this.note.seq( [0,1,2,3,4,5,6,7], 1/4 )

this.note.values.range.seq( Rndi(0,6,2), 2 )`

const genExample = `a = cycle( min( 0, max( 2,4 ) ) )
console.log( a.out() )`

const simpleExample = 'this.note.seq( [0,1,2,3], 1/8 )'

module.exports = exampleCode//simpleExample//genExample//exampleScore4//exampleScore4 //'this.note.seq( [0,1], Euclid(5,8) );' //exampleCode
