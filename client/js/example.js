const exampleCode = `// ctrl+enter to execute line or selection
this.note( 84 )

// 'bass' sequence, defaults to id #0
this.note.seq( [40,60,50,70], 1/4 )

// 'melody' parallel sequence with id #1 (last arg)
this.note.seq( [64,66,67,69], 1/4, 1 )

// reverse and rotate 'melody'
this.note[1].values.reverse.seq( null, 2 )
this.note[1].values.rotate.seq( 1, 1 )

// stop 'bass'
this.note[ 0 ].seq.stop()

// start 'bass'
this.note[ 0 ].seq.start()

// create a parallel sequence with id #2 (last arg)
this.note.seq( 71, 1/8, 2 )

// longhand reference to sequence 
this.sequences.note[ 2 ].stop()

// sugar
this.note[ 2 ].start()`

module.exports = exampleCode
