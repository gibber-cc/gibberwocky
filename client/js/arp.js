module.exports = function( Gibber ) {

let Arp = function( chord = [0,2,4,6], octaves = 1, pattern = 'updown2' ) {
  let notes, arp 
  
  if( typeof chord === 'string' ) {
    let _chord = Gibber.Theory.Chord.create( chord )
    chord = _chord.notes
  }

  notes = chord.slice( 0 )

  for( let i = 1; i < octaves; i++ ) {
    let offset =  i * 12
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
    var _tmp = array.slice( 0 )
    _tmp.pop()
    _tmp.reverse()
    _tmp.pop()
    return array.concat( _tmp )
  }
}

return Arp

}
