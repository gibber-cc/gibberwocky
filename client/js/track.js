!function() {

var Track = function( Gibber, _id ) {
  // seq~ schedule format:
  // add <seqid> <phase> <arguments...>
  // seqid is the beat number
  // phase is 0..1 within that beat
  // arguments is a max message, as space-delimited strings and numbers
  
  //var msgstring = "add " + beat + " " + t + " " + n + " " + v + " " + d 
  var track = {
    id: _id,
		sequences:{},
    note : function( notenum, velocity, duration ) {
      var msg = [ 'note', notenum, velocity, duration ].join( ' ' )
      Gibber.Communication.send( msg )
    }
  }
  
  Gibber.addSequencingToMethod( track, 'note' )

	return track
}

module.exports = Track
}()
