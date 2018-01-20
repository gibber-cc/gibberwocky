module.exports = function( Gibber ) {

const noteon  = 0x90,
      noteoff = 0x80,
      cc = 0x70
      
let Channel = {
  create( number ) {

    let channel = {    
      number,
		  sequences:{},
      sends:[],
      markup:{
        textMarkers:{}
      
      },

      __velocity: 64,
      __duration: 1000,
      
      note( num, offset=null, doNotConvert=false ){
        const notenum = doNotConvert === true ? num : Gibber.Theory.Note.convertToMIDI( num )
        
        let msg = [ 0x90 + channel.number, notenum, channel.__velocity ]
        const baseTime = offset !== null ? window.performance.now() + offset : window.performance.now()

        Gibber.MIDI.send( msg, baseTime )
        msg[0] = 0x80 + channel.number

        // subtract 1 from noteoff to avoid overlapping with noteon messages
        // when sequencing notes that are exactly 1 * duration apart
        Gibber.MIDI.send( msg, baseTime + channel.__duration - 1 )
      },

      midinote( num, offset=null ) {
        let msg = [ 0x90 + channel.number, num, channel.__velocity ]
        const baseTime = offset !== null ? window.performance.now() + offset : window.performance.now()

        Gibber.MIDI.send( msg, baseTime )
        msg[0] = 0x80 + channel.number
        Gibber.MIDI.send( msg, baseTime + channel.__duration - 1 )
      },
      
      duration( value ) {
        channel.__duration = value
      },
      
      velocity( value ) {
        channel.__velocity = value 
      },

      mute( value ) {
        let msg =  `${channel.id} mute ${value}`
        Gibber.MIDI.send( msg )
      },

      solo( value ) {
        let msg =  `${channel.id} solo ${value}`
        Gibber.MIDI.send( msg )
      },

      chord( chord, offset=null, doNotConvert=false ) {
        if( doNotConvert === true ) { // from sequencer
          chord.forEach( v => channel.midinote( v, offset ) )
        }else{
          if( typeof chord  === 'string' ){
            chord = Gibber.Theory.Chord.create( chord ).notes
            chord.forEach( v => channel.midinote( v ) )
          }else{
            chord.forEach( v => channel.note( v ) )
          }
        }
      },

      midichord( chord, velocity='', duration='' ) {
        chord.forEach( v => channel.midinote( v ) )
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
        Gibber.MIDI.send( `select_channel ${channel.id}` )
      }
    }

    Gibber.Environment.codeMarkup.prepareObject( channel ) 
    Gibber.addSequencingToMethod( channel, 'note' )
    Gibber.addSequencingToMethod( channel, 'chord' )
    Gibber.addSequencingToMethod( channel, 'velocity', 1 )
    Gibber.addSequencingToMethod( channel, 'duration', 1 )
    Gibber.addSequencingToMethod( channel, 'midinote' )
    Gibber.addSequencingToMethod( channel, 'midichord' )

    for( let i = 0; i < 128; i++ ) {
      const ccnum = i
      channel[ 'cc'+ccnum ] = ( val, offset = null ) => {
        let msg = [ 0xb0 + channel.number, ccnum, val ]
        const baseTime = offset !== null ? window.performance.now() + offset : window.performance.now()

        Gibber.MIDI.send( msg, baseTime )
      }

      Object.assign( channel[ 'cc'+ccnum], {
        markup: {
          textClasses:{},
          cssClasses:{}
        }
      })

      Gibber.addMethod( channel, 'cc'+ccnum, channel.number, ccnum  ) 
      //Gibber.addSequencingToMethod( channel, 'cc'+i  )
    }

    return channel
  },
}

return Channel.create.bind( Channel )

}

