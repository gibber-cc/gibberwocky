module.exports = function( Gibber ) {

let Track = {
  create( spec ) {

    let track = {    
      id: spec.id,
      spec,
		  sequences:{},
      sends:[],
      note( ...args ) {
        args[0] = Gibber.Theory.Note.convertToMIDI( args[0] )
        
        let msg = `${track.id} note ${args.join(' ')}`
        Gibber.Communication.send( msg )
      },

      midinote( ...args ) {
        let msg = `${track.id} note ${args.join(' ')}`
        Gibber.Communication.send( msg )
      },
      
      duration( value ) {
        Gibber.Communication.send( `${track.id} duration ${value}` )
      },
      
      velocity( value ) {
        Gibber.Communication.send( `${track.id} velocity ${value}` )
      },

      cc( ccnum, value ) {
        let msg =  `${track.id} cc ${ccnum} ${value}`
        Gibber.Communication.send( msg )
      },

      mute( value ) {
        let msg =  `${track.id} mute ${value}`
        Gibber.Communication.send( msg )
      },

      solo( value ) {
        let msg =  `${track.id} solo ${value}`
        Gibber.Communication.send( msg )
      },

      chord( chord, velocity='', duration='' ) {
        let msg = []
        
        if( typeof chord  === 'string' ){
          chord = Gibber.Theory.Chord.create( chord ).notes
          chord.forEach( v => track.midinote( v ) )
        }else{
          chord.forEach( v => track.note( v ) )
        }
      },

      midichord( chord, velocity='', duration='' ) {
        let msg = []
        for( let i = 0; i < chord.length; i++ ) {
          msg.push( `${track.id} note ${chord[i]} ${velocity} ${duration}`.trimRight() )
        }

        Gibber.Communication.send( msg )
      },

      stop() {
        for( let key in this.sequences ) {
          for( let seq of this.sequences[ key ] ) {
            if( seq !== undefined ) {
              seq.stop()
            }
          }
        }
      },

      start() {
        for( let key in this.sequences ) {
          for( let seq of this.sequences[ key ] ) {
            if( seq !== undefined ) {
              seq.start()
            }
          }
        }
      },
      select() {
        Gibber.Communication.send( `select_track ${track.id}` )
      }
    }

    Gibber.Environment.codeMarkup.prepareObject( track ) 
    Gibber.addSequencingToMethod( track, 'note' )
    Gibber.addSequencingToMethod( track, 'cc' )
    Gibber.addSequencingToMethod( track, 'chord' )
    Gibber.addSequencingToMethod( track, 'velocity', 1 )
    Gibber.addSequencingToMethod( track, 'duration', 1 )
    Gibber.addSequencingToMethod( track, 'midinote' )
    Gibber.addSequencingToMethod( track, 'mute' )
    Gibber.addSequencingToMethod( track, 'solo' )

    Gibber.addMethod( track, 'pan', spec.panning )
    Gibber.addMethod( track, 'volume', spec.volume )

    spec.sends.forEach( (element, idx) => {
      Gibber.addMethod( track.sends, idx, element )
    })

    return track
  },
}

return Track.create.bind( Track )

}
