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
      __octave:   0,

      octave( v ) {
        if( v===undefined ) return channel.__octave

        channel.__octave = v
        return channel
      },
      note( num, offset=null, doNotConvert=false ){
        const notenum = doNotConvert === true ? num : Gibber.Theory.Note.convertToMIDI( num )
        
        let msg = [ 0x90 + channel.number, notenum, channel.__velocity ]
        const baseTime = offset !== null ? offset : 0 

        Gibber.MIDI.send( msg, baseTime )
        msg[0] = 0x80 + channel.number

        // subtract 1 from noteoff to avoid overlapping with noteon messages
        // when sequencing notes that are exactly 1 * duration apart
        Gibber.MIDI.send( msg, baseTime + channel.__duration - 1 )
      },

      midinote( num, offset=null ) {
        let msg = [ 0x90 + channel.number, num, channel.__velocity ]
        const baseTime = offset !== null ? offset : 0 

        Gibber.MIDI.send( msg, baseTime )
        msg[0] = 0x80 + channel.number
        Gibber.MIDI.send( msg, baseTime + channel.__duration - 1 )
      },
      
      duration( value ) {
        if( value === undefined ) { return channel.__duration }

        channel.__duration = value
        return channel 
      },
      
      velocity( value ) {
        if( value === undefined ) { return channel.__velocity }
        channel.__velocity = value 
        return channel
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
    Gibber.addSequencingToMethod( channel, 'note', null, null, 'midi' )
    Gibber.addSequencingToMethod( channel, 'chord', null, null, 'midi' )
    Gibber.addSequencingToMethod( channel, 'velocity', 1, null, 'midi' )
    Gibber.addSequencingToMethod( channel, 'duration', 1, null, 'midi' )
    Gibber.addSequencingToMethod( channel, 'midinote', null, null, 'midi' )
    Gibber.addSequencingToMethod( channel, 'midichord', null, null, 'midi' )

    for( let i = 0; i < 128; i++ ) {
      const ccnum = i
      channel[ 'cc'+ccnum ] = ( val, offset = null ) => {
        let msg = [ 0xb0 + channel.number, ccnum, val ]
        const baseTime = offset !== null ? offset : 0 

        Gibber.MIDI.send( msg, baseTime )
      }

      Object.assign( channel[ 'cc'+ccnum ], {
        markup: {
          textClasses:{},
          cssClasses:{}
        }
      })

      Gibber.addMethod( channel, 'cc'+ccnum, ccnum, channel.number, 'midi' ) 
      //Gibber.addSequencingToMethod( channel, 'cc'+i, null, null, 'midi'  )
      channel[ 'cc'+ccnum ].stop = function() {
        const id = ccnum+'0000'+channel.number
        const prevGen = Gibber.Gen.connected.find( e => e.paramID === id )

        if( prevGen !== undefined ) {
          prevGen.clear()
          prevGen.shouldStop = true
          const idx = Gibber.Gen.connected.findIndex( e => e.paramID === id ) 
          Gibber.Gen.connected.splice( idx, 1 )
        }
      }
    }

    return channel
  },
}

return Channel.create.bind( Channel )

}

