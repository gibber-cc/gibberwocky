module.exports = function( Gibber ) {

let Arp = function( chord = [0,2,4,6], octaves = 1, pattern = 'updown2' ) {
  let notes, arp
  
  if( typeof chord === 'string' ) {
    // TODO: doesn't work... numbers can't be MIDI numbers because they go through scale conversion
    let _chord = Gibber.Theory.Chord.create( chord )
    chord = _chord.notes
  }

  notes = chord.slice( 0 )

  for( let i = 1; i < octaves; i++ ) {
    // TODO: next line is messy... what if the mode and corresponding mode length changes?
    let offset =  i * Gibber.Theory.Scale.master.modeNumbers.length
    for( let j = 0; j < chord.length; j++ ) {
      notes.push( chord[ j ] + offset )
    }
  }
  
  notes = Arp.patterns[ pattern ]( notes )

  arp = Gibber.Pattern.apply( null, notes )

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
