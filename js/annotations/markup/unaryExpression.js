module.exports = function( Marker ) {
  
  // for negative literals e.g. -10
  const UnaryExpression = function( patternNode, state, seq, patternType, index=0 ) {
    if( patternNode.processed === true ) return 
    const cm = state.cm
    const track = seq.object
    const patternObject = seq[ patternType ]
    const [ className, start, end ] = Marker._getNamesAndPosition( patternNode, state, patternType )
    const cssName = className + '_0'

    marker = cm.markText( start, end, { 
      'className': cssName + ' annotation', 
      inclusiveLeft: true,
      inclusiveRight: true
    })

    track.markup.textMarkers[ className ] = marker

    if( track.markup.cssClasses[ className ] === undefined ) track.markup.cssClasses[ className ] = []

    track.markup.cssClasses[ className ][ index ] = cssName    

    let start2 = Object.assign( {}, start )
    start2.ch += 1
    let marker2 = cm.markText( start, start2, { 
      'className': cssName + ' annotation-no-right-border', 
      inclusiveLeft: true,
      inclusiveRight: true
    })

    let marker3 = cm.markText( start2, end, { 
      'className': cssName + ' annotation-no-left-border', 
      inclusiveLeft: true,
      inclusiveRight: true
    })


    patternObject.marker = marker
    Marker.finalizePatternAnnotation( patternObject, className )
  }

  return UnaryExpression

}
