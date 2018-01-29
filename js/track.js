module.exports = function( Gibber ) {

let Track = {
  create( spec ) {

    let track = {    
      type: 'track',
      id: spec.id,
      spec,
		  sequences:{},
      sends:[],
      __octave:0,
      __velocity:64,
      __duration:250,

      octave( v ) {
        if( v===undefined ) return this.__octave

        this.__octave = v
        return this
      },
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
        if( value === undefined ) return this.__duration
        this.__duration = value

        Gibber.Communication.send( `${track.id} duration ${value}` )
      },
      
      velocity( value ) {
        if( value === undefined ) return this.__velocity
        this.__velocity = value

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
          track.midinote( chord[i] )
          //msg.push( `${track.id} note ${chord[i]} ${velocity} ${duration}`.trimRight() )
        }

        //Gibber.Communication.send( msg )
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
    Gibber.addSequencingToMethod( track, 'note', 0 )
    Gibber.addSequencingToMethod( track, 'cc' )
    Gibber.addSequencingToMethod( track, 'chord', 0 )
    Gibber.addSequencingToMethod( track, 'velocity', 1 )
    Gibber.addSequencingToMethod( track, 'duration', 1 )
    Gibber.addSequencingToMethod( track, 'midinote' )
    Gibber.addSequencingToMethod( track, 'midichord' )
    Gibber.addSequencingToMethod( track, 'mute' )
    Gibber.addSequencingToMethod( track, 'solo' )
    Gibber.addSequencingToMethod( track, 'octave' )

    // XXX add cc messages to track!
    for( let i = 0; i < 127; i++ ) {
      track[ 'cc' + i ] = value => {
        let msg =  `${track.id} cc ${i} ${value}`
        Gibber.Communication.send( msg )
      }
      Gibber.addSequencingToMethod( track, 'cc'+i )
    }

    Gibber.addMethod( track, 'pan', spec.panning )
    Gibber.addMethod( track, 'volume', spec.volume )

    spec.sends.forEach( (element, idx) => {
      Gibber.addMethod( track.sends, idx, element )
    })


    const proxy = new Proxy( track, {
      // whenever a property on the namespace is accessed
      get( target, prop, receiver ) {
        let hasProp = true, 
          device = null, 
          upper = prop[0].toUpperCase() + prop.slice( 1 ), // convert lowercase to camelcase
          useUpper = false

        // if the property is undefined...
        if( target[ prop ] === undefined && target[ upper ] === undefined && prop !== 'markup' && prop !== 'seq' && prop !== 'sequences' ) {
          //target[ prop ] = Max.namespace( prop, target )
          //target[ prop ].address = addr + ' ' + prop
          for( let __device of target.devices ) {
            if( typeof __device !== 'object' ) continue

            if( __device[ prop ] !== undefined ) {
              device = __device
              break
            }else if( __device[ upper ] !== undefined ) {
              device = __device
              useUpper = true
              break
            }
          }

          hasProp = false
        }


        let propName = useUpper ? upper : prop

        let property = null
        if( hasProp ) {
          property = target[ prop ]
        }else{
          if( device !== null ) {
            property = device[ propName ]
          }
        }

        return property 
      }
    })

    return proxy
  },
}

return Track.create.bind( Track )

}
