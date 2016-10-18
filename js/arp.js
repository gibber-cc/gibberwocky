module.exports = function( Gibber ) {

let Arp = function( chord = [0,2,4,6], octaves = 1, pattern = 'updown2' ) {
  let notes, arp
  
  if( typeof chord === 'string' ) {
    // TODO: doesn't work... numbers can't be MIDI numbers because they go through scale conversion
    let _chord = Gibber.Theory.Chord.create( chord )
    chord = _chord.notes
  }

  notes = Gibber.Pattern.apply( null, chord.slice( 0 ) )

  if( pattern === 'down' ) notes.reverse()
  
  let maxLength = notes.values.length * octaves,
      dir = pattern !== 'down' ? 'up' : 'down'

  arp = ()=> {
    arp.phase++
    if( arp.phase >= maxLength ) {
      arp.phase = 0
    }

    if( arp.phase % notes.values.length === 0 ) {
      if( dir === 'up' ) {
        if( arp.octave < octaves ) {
          arp.octave += 1 
        }else{ 
          if( pattern === 'up' ) {
            arp.octave = 1
          }else{
            dir = 'down'
            notes.reverse()
          }
        }
      }else{
        if( arp.octave > 1 ) {
          arp.octave += -1
        }else{
          if( pattern === 'down' ) {
            arp.octave = octaves
          } else {
            dir = 'up'
            notes.reverse()
          }
        }
      }
    }

    let octaveMod,
        note = arp.notes()
    
    //note = Gibber.Theory.Note.convertToMIDI( note )
    
    for( let i = 1; i < arp.octave; i++ ) {
      note += 7
    }

    let methodNames =  [
      'rotate','switch','invert','reset', 'flip',
      'transpose','reverse','shuffle','scale',
      'store', 'range', 'set'
    ]

    for( let key of methodNames ) {
      arp[ key ] = notes[ key ].bind( notes )
      Gibber.addSequencingToMethod( arp, key ) 
    }

    //arp.transpose = notes.transpose.bind( notes )
    //arp.reset = notes.reset.bind( notes )
    //arp.reverse = notes.reverse.bind( notes )
    //arp.rotate  = notes.rotate.bind( notes )

    return note
  }

  arp.octave = 0
  arp.phase = -1
  arp.notes = notes

  return arp
}

Arp.patterns = {
  up( array ) {
    return array
  },

  down( array ) {
    return array.reverse()
  },

  updown( array ) {
    let _tmp = array.slice( 0 )
    _tmp.reverse()
    return array.concat( _tmp )
  },

  updown2( array ) { // do not repeat highest and lowest notes
    var tmp = array.slice( 0 )
    tmp.pop()
    tmp.reverse()
    tmp.pop()
    return array.concat( tmp )
  }
}

return Arp

}
