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
    note( ...args ) {
      args[0] = Gibber.Theory.Note.convertToMIDI( args[0] )
      
      let msg = `${Gibber.Live.id} note ${args.join(' ')}`
      Gibber.Communication.send( msg )
    },

    midinote( ...args ) {
      let msg = `${Gibber.Live.id} note ${args.join(' ')}`
      Gibber.Communication.send( msg )
    },
    
    duration( value ) {
      Gibber.Communication.send( `${Gibber.Live.id} duration ${value}` )
    },
    
    velocity( value ) {
      Gibber.Communication.send( `${Gibber.Live.id} velocity ${value}` )
    },

    cc( ccnum, value ) {
      let msg =  `${Gibber.Live.id} cc ${ccnum} ${value}`
      Gibber.Communication.send( msg )
    },

    chord( chord, velocity='', duration='' ) {
      let msg = []
      
      if( typeof chord  === 'string' ) {
        let chordObj = Gibber.Theory.Chord.create( chord )

        chord = chordObj.notes 
        console.log( 'chord', chord )
        for( let i = 0; i < chord.length; i++ ) {
          let note = chord[ i ] // Gibber.Theory.Note.convertToMIDI( chord[i] )
          this.note( chord[ i ] )//msg.push( `${Gibber.Live.id} note ${note} ${velocity} ${duration}`.trimRight() )
        }
      }else{
        for( let i = 0; i < chord.length; i++ ) {
          let note = Gibber.Theory.Note.convertToMIDI( chord[i] )
          this.note( chord[i] )
         // msg.push( `${Gibber.Live.id} note ${note} ${velocity} ${duration}`.trimRight() )
        }
      }

      Gibber.Communication.send( msg )
    },

    midichord( chord, velocity='', duration='' ) {
      let msg = []
      for( let i = 0; i < chord.length; i++ ) {
        msg.push( `${Gibber.Live.id} note ${chord[i]} ${velocity} ${duration}`.trimRight() )
      }

      Gibber.Communication.send( msg )
    },
  }

  Gibber.Environment.codeMarkup.prepareObject( track ) 
  Gibber.addSequencingToMethod( track, 'note' )
  Gibber.addSequencingToMethod( track, 'cc' )
  Gibber.addSequencingToMethod( track, 'chord' )
  Gibber.addSequencingToMethod( track, 'velocity' )
  Gibber.addSequencingToMethod( track, 'duration' )
  Gibber.addSequencingToMethod( track, 'midinote' )

  return track
}

module.exports = Track
