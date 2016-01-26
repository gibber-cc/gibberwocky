!function() {

var Gibber = {
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
  export : function() {
    window.Seq = this.Seq
    window.Track = this.Track
    window.Scheduler = this.Scheduler
    window.Communication = this.Communication
    window.log = this.log
  },
  init: function() {
    this.max = window.max
    this.Environment.init( Gibber )
    this.log = this.Environment.log
    this.Communication.init( Gibber  )
    this.currentTrack = this.Track( this, 1 ) // how to determine actual "id" from Max?
    this.export()
  },
  addSequencingToMethod: function( obj, methodName ) {
    obj[ methodName ].seq = function( values, timings ) {
      if( ! values instanceof Pattern ) values = Pattern.apply( null, values)  
      if( ! timings instanceof Pattern ) timings = Pattern.apply( null, timings )  
    }
  },
}

Gibber.Pattern = require( './pattern.js' )( Gibber )
Gibber.Seq     = require( './seq.js')( Gibber )

module.exports = Gibber

}()
