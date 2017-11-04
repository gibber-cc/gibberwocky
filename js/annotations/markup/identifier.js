const __Identifier = function( Marker ) {

  const mark = function( node, state, patternType, seqNumber ) {
    const [ className, start, end ] = Marker._getNamesAndPosition( node, state, patternType, seqNumber )
    const cssName = className + '_0'
    const commentStart = end
    const commentEnd = {}

    Object.assign( commentEnd, commentStart )
    const line = end.line
    const lineTxt = state.cm.getLine( line )
    let ch = end.ch

    // different replacements are used for use in sequencers, when a callexpression
    // creating a wavepattern is often followed by a comma, vs when a wavepattern is
    // assigned to a variable, when no comma is present

    let lastChar = lineTxt[ ch ]
    while( lastChar === undefined ) {
      ch--
      lastChar = lineTxt[ ch ]
    }
    
    if( lastChar === ',' ) {
      state.cm.replaceRange( ' ,', { line, ch:ch }, { line, ch:ch + 1 } ) 
    }else if( lastChar === ')' ){
      state.cm.replaceRange( ') ', { line, ch:ch }, { line, ch:ch + 1 } )
    }
    // else we assume it's a space character?

    //commentStart.ch -= 1
    commentEnd.ch += 1

    const marker = state.cm.markText( commentStart, commentEnd, { className })

    return [ marker, className ]
  }

  // Typically this is used with named functions. For example, if you store an
  // Arp in the variable 'a' and pass 'a' into a sequence, 'a' is the Identifier
  // and this function will be called to mark up the associated pattern.
  const Identifier = function( patternNode, state, seq, patternType, containerNode, seqNumber ) {
    if( patternNode.processed === true ) return 

    const cm = state.cm
    const track = seq.object
    const patternObject = seq[ patternType ]
    const [ marker, className ] = mark( patternNode, state, patternType, seqNumber )

    // WavePatterns can also be passed as named functions; make sure we forward
    // these to the appropriate markup functions
    if( patternObject.type === 'WavePattern' || patternObject.isGen ) {

      if( patternObject.widget === undefined ) { // if wavepattern is inlined to .seq call
        Marker.processGen( containerNode, cm, track, patternObject, seq )
      }else{
        patternObject.update = Marker.patternUpdates.anonymousFunction( patternObject, marker, className, cm, track )
      }
    }else{
      
      const updateName = typeof patternNode.callee !== 'undefined' ? patternNode.callee.name : patternNode.name

      if( Marker.patternUpdates[ updateName ] ) {
        patternObject.update = Marker.patternUpdates[ updateName ]( patternObject, marker, className, cm, track )
      } else {
        patternObject.update = Marker.patternUpdates.anonymousFunction( patternObject, marker, className, cm, track )
      }
      
      patternObject.patternName = className

      // store value changes in array and then pop them every time the annotation is updated
      patternObject.update.value = []

      Marker._addPatternFilter( patternObject )
    }

    patternObject.marker = marker
  }


  return Identifier
}

module.exports = __Identifier
