module.exports = function( Gibber ) {

let Track = {
  create( id, spec ) {
    let track = Object.create( this )
    
    Object.assign( track, {    
      id,
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
          msg.push( `${track.id} note ${chord[i]} ${velocity} ${duration}`.trimRight() )
        }

        Gibber.Communication.send( msg )
      },
    })

    Gibber.Environment.codeMarkup.prepareObject( track ) 
    Gibber.addSequencingToMethod( track, 'note' )
    Gibber.addSequencingToMethod( track, 'cc' )
    Gibber.addSequencingToMethod( track, 'chord' )
    Gibber.addSequencingToMethod( track, 'velocity' )
    Gibber.addSequencingToMethod( track, 'duration' )
    Gibber.addSequencingToMethod( track, 'midinote' )

    track.createMethod( 'pan', spec.panning )
    track.createMethod( 'volume', spec.volume )

    spec.sends.forEach( (element, idx) => {
      track.createMethod( idx, element, track.sends, track ) 
    })

    return track
  },

  createMethod( name, properties, obj=this, track=this ) {
    let v = properties.value
    obj[ name ] = ( _v ) => {
      if( properties.quantized === 1 ) _v = Math.round( _v )
      if( _v !== undefined ) {
        if( typeof _v === 'object' && _v.isGen ) {
          _v.assignParamID( properties.id )
          Gibber.Communication.send( `${track.id} gen ${properties.id} "${_v.out()}"` )
        }else{
          v = _v
          Gibber.Communication.send( `${track.id} set ${properties.id} ${v}` )
        }
      }else{
        return v
      }
    }
    return obj
  }

}

return Track.create.bind( Track )

}
