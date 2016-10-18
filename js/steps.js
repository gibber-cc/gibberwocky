module.exports = function( Gibber ) {
  
let Steps = {
  type:'Steps',
  create( _steps, track = Gibber.currentTrack ) {
    let stepseq = Object.create( Steps )
    
    stepseq.seqs = {}

    //  create( values, timings, key, object = null, priority=0 )
    for ( let _key in _steps ) {
      let values = _steps[ _key ].split(''),
          key = parseInt( _key )

      let seq = Gibber.Seq( values, 1 / values.length, 'midinote', track, 0 )
      seq.trackID = track.id

      seq.values.filters.push( function( args ) {
        let sym = args[ 0 ],
            velocity = ( parseInt( sym, 16 ) * 8 ) - 1

        if( isNaN( velocity ) ) {
          velocity = 0
        }

        // TODO: is there a better way to get access to beat, beatOffset and scheduler?
        if( velocity !== 0 ) {
          let msg = seq.externalMessages[ 'velocity' ]( velocity, seq.values.beat + seq.values.beatOffset, seq.trackID )
          seq.values.scheduler.msgs.push( msg ) 
        }

        args[ 0 ] = sym === '.' ? Gibber.Seq.DO_NOT_OUTPUT : key

        return args
      })

      stepseq.seqs[ _key ] = seq
      stepseq[ _key ] = seq.values
    }

    stepseq.start()
    stepseq.addPatternMethods()

    return stepseq
  },
  
  addPatternMethods() {
    groupMethodNames.map( (name) => {
      this[ name ] = function( ...args ) {
        for( let key in this.seqs ) {
          this.seqs[ key ].values[ name ].apply( this, args )
        }
      }
    
      Gibber.addSequencingToMethod( this, name, 1 )
    })
  },

  start() {
    for( let key in this.seqs ) { 
      this.seqs[ key ].start()
    }
  },

  stop() {
    for( let key in this.seqs ) { 
      this.seqs[ key ].stop()
    }
  },

  clear() { this.stop() },

  /*
   *rotate( amt ) {
   *  for( let key in this.seqs ) { 
   *    this.seqs[ key ].values.rotate( amt )
   *  }
   *},
   */
}

const groupMethodNames = [ 
  'rotate', 'reverse', 'transpose', 'range',
  'shuffle', 'scale', 'repeat', 'switch', 'store', 
  'reset','flip', 'invert', 'set'
]

return Steps.create

}
