module.exports = function( Marker ) {

  // Typically this is used with named functions. For example, if you store an
  // Arp in the variable 'a' and pass 'a' into a sequence, 'a' is the Identifier
  // and this function will be called to mark up the associated pattern.
  const Identifier = function( patternNode, state, seq, patternType, index=0 ) {
    if( patternNode.processed === true ) return 
    const cm = state.cm
    const track = seq.object
    const patternObject = seq[ patternType ]

    // WavePatterns can also be passed as named functions; make sure we forward
    // these to the appropriate markup functions
    if( patternObject.type === 'WavePattern' || patternObject.isGen ) {
      Marker.processGen( containerNode, cm, track, patternObject )
    }else{
      const [ className, start, end ] = Marker._getNamesAndPosition( patternNode, state, patternType )
      const cssName = className + '_0'
      const commentStart = end
      const commentEnd = {}

      Object.assign( commentEnd, commentStart )
        
      commentEnd.ch += 1

      const marker = cm.markText( commentStart, commentEnd, { className })
         
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
  }

  return Identifier
}
