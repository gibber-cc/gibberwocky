!function() {

let Gibber = {
  Communication: require( './communication.js' ),
  codemirror: null,
  max: null,
  codeMarkup: null, //require( './codeMarkup.js' ),
  Environment: require( './environment.js' ),
  Scheduler: require( './clock.js' ),
  Track: require( './track.js' ),
  Seq:   null,
  currentTrack:null,
  //Pattern: require( './pattern.js' ),
  export() {
    window.Seq = this.Seq
    window.Track = this.Track
    window.Scheduler = this.Scheduler
    window.Communication = this.Communication
    window.log = this.log
  },
  init() {
    this.max = window.max
    this.Environment.init( Gibber )
    this.log = this.Environment.log
    this.Communication.init( Gibber  )
    this.currentTrack = this.Track( this, 1 ) // how to determine actual "id" from Max?
    this.export()
  },
  addSequencingToMethod( obj, methodName ) {
    obj[ methodName ].seq = function( values, timings, id=0 ) {

      if( obj.sequences[ methodName ] === undefined ) obj.sequences[ methodName ] = []

      if( obj.sequences[ methodName ][ id ] ) obj.sequences[ methodName ][ id ].stop() 

      obj.sequences[ methodName ][ id ] = Gibber.Seq( values, timings, methodName, obj ).start()

      if( id === 0 ) {
        obj[ methodName ].values  = obj.sequences[ methodName ][ 0 ].values
        obj[ methodName ].timings = obj.sequences[ methodName ][ 0 ].timings
      }

      obj[ methodName ][ id ] = obj.sequences[ methodName ][ id ]
    }

    obj[ methodName ].seq.stop = function() {
      obj.sequences[ methodName ][ 0 ].stop()
      return obj
    }

    obj[ methodName ].seq.start = function() {
      obj.sequences[ methodName ][ 0 ].start()
      return obj
    }
  },
}

Gibber.Pattern = require( './pattern.js' )( Gibber )
Gibber.Seq     = require( './seq.js')( Gibber )

module.exports = Gibber

}()
