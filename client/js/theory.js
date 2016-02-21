const noteIndices = {
  c: 0,
  'c#': 1, db: 1,
  d:2,
  'd#':3, eb:3,
  e:4, fb:4,
  f:5,
  'f#':6, gb:6,
  g:7,
  'g#':8, ab:8,
  a:9,
  'a#':10, bb:10,
  b:11, cb:11
}

const noteNames = [ 'c','db','d','eb','e','f','gb','g','ab','a','bb','b' ]

let Note = {
  getMIDI() { return this.value },

  getFrequency() {
    return Math.pow( 2, (this.value - 69) / 12 ) * 440  
  },

  getString() {
    let octave = Math.floor( ( this.value / 12 ) ) - 1,
        index  = this.value % 12

    return noteNames[ index ] + octave
  },

  create( value ) {
    let midiValue = Note.convertToMIDI( value ),
        note = Object.create( this )

    note.value = midiValue

    return note
  },

  convertToMIDI( value ) {
    let midiValue

    if( typeof value === 'string' ) { 
      midiValue = this.convertStringToMIDI( value )
    } else {
      midiValue = this.convertScaleMemberToMIDI( value, Scale.master )
    }
    
    return midiValue
  },

  convertStringToMIDI( stringValue ) {
    let octave   = parseInt( stringValue.substr( -1 ) ),
        noteName = stringValue.substr( 0, stringValue.length === 2 ? 1 : 2 ),
        noteNum  = noteIndices[ noteName ]
    
    return ( octave + 1 ) * 12 + noteNum
  },

  convertMIDIToString( midiValue ) { },

  convertMIDIToFrequency( midiValue ) { },

  convertScaleMemberToMIDI( scaleIndex, scale ) { }
}

let Chord = {
  create( str ) {
    let chord = Object.create( this )

    let [ root, octave, quality, extension ] = Chord.parseString( str )

    Object.assign( chord, {
      root,
      octave,
      quality,
      extension,
      notes: []
    })

    chord.notes[ 0 ] = parseInt( Note.convertStringToMIDI( root + octave ) )
    
    let _quality = Chord.qualities[ chord.quality ]
    for( let i = 0; i <  _quality.length; i++  ) {
      chord.notes.push( chord.notes[ 0 ] + _quality[ i ] )
    }
    
    if( chord.extension ) {
      // split each extension into array
      chord.extensions = extension.split(/(b?#?\d+)/i)
      
      for( let i = 0; i < chord.extensions.length; i++ ) {
        let _extension = chord.extensions[ i ]
        if( _extension !== '' ) 
          chord.notes.push( Chord.extensions[ _extension ]( chord.notes ) )
      }
    }

    return chord
  },

  qualities: {
    min: [ 3, 7 ],
    maj: [ 4, 7 ],
    dim: [ 3, 6 ],
    aug: [ 4, 8 ],
    sus: [ 5, 7 ]
  },

  extensions: {
    ['7']  ( notes ) { return notes[ 2 ] + 3 },
    ['#7'] ( notes ) { return notes[ 2 ] + 4 },
    ['9']  ( notes ) { return notes[ 2 ] + 7 },
    ['b9'] ( notes ) { return notes[ 2 ] + 6 }
  },

  parseString( str ) {
    let [ chord, root, octave, quality, extension ] = str.match(/([A-Za-z]b?#?)(\d)([a-z]{3})([b?#?\d]*)/i) 

    return [ root.toLowerCase(), octave, quality.toLowerCase(), extension ]
  },
}

module.exports = { Note, Chord }
