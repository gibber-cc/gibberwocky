const exampleCode = `// ctrl+enter to execute line or selection
this.note( 84 )

// creates sequencer at this.note[0] (0 is default)
this.note.seq( [40,60,50,70], [1/4,1/8,1/16].rnd(1/16,2) )

// parallel sequence at this.note[1] (1 is last arg)
this.note.seq( [64,66,67,69], 1/4, 1 )

// sequence reversal and transposition of this.note[1]
this.note[ 1 ].values.reverse.seq( null, 2 )
this.note[ 1 ].values.transpose.seq( [1,2,3,-6], 1 )

// stop this.note[0]
this.note[ 0 ].stop()

// start this.note[0]
this.note[ 0 ].start()

// parallel sequence at this.note[2] (2 is last arg)
this.note.seq( 71, 1/8, 2 )

// longhand reference to sequencer 
this.sequences.note[ 2 ].stop()

// sugar
this.note[ 2 ].start()`

module.exports = exampleCode
