let Track = function( Gibber, id ) {
  // seq~ schedule format:
  // add <seqid> <phase> <arguments...>
  // seqid is the beat number
  // phase is 0..1 within that beat
  // arguments is a max message, as space-delimited strings and numbers
  
  //var msgstring = "add " + beat + " " + t + " " + n + " " + v + " " + d 
  let track = {
    id,
		sequences:{},

    note( notenum, velocity, duration ) {
      var msg = `note ${notenum} ${velocity} ${duration}`
      Gibber.Communication.send( msg )
    },

    cc( ccnum, value ) {
      var msg =  `cc ${ccnum} ${value}`
      Gibber.Communication.send( msg )
    }
  }

  Gibber.Environment.codeMarkup.prepareObject( track ) 
  Gibber.addSequencingToMethod( track, 'note' )
  Gibber.addSequencingToMethod( track, 'cc' )
	
  return track
}

module.exports = Track
