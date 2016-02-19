const exampleCode = `// ctrl+enter to execute line or selection

// chord, octaves, style
a = Arp( [50,52,54,56], 3, 'updown' )

// create sequencer using arpeggiator and 1/16 notes
this.note.seq( a, 1/16 )

a.transpose.seq( 1,1 )
a.reset.seq( null, 8 )

// creates sequencer at this.note[1] (0 is default)
this.note.seq( [40,60,50,70], [1/4,1/8,1/16].rnd(1/16,2), 1 )

// parallel sequence at this.note[2] (2 is last arg)
this.note.seq( [64,66,67,69], 1/4, 2 )

// sequence transposition of this.note[2]
this.note[ 2 ].values.transpose.seq( [1,2,3,-6], 1 )

// stop this.note[0]
this.note[ 0 ].stop()

// start this.note[0]
this.note[ 0 ].start()

// longhand reference to sequencer 
this.sequences.note[ 2 ].stop()

// sugar
this.note[ 2 ].start()`

module.exports = exampleCode
