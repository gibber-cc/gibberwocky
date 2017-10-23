module.exports = function( Marker ) {

  const Literal = function( patternNode, state, seq, patternType, index=0 ) {
    if( patternNode.processed === true ) return 

    const cm = state.cm
    const track = seq.object
    const patternObject = seq[ patternType ]
    const [ className, start, end ] = Marker._getNamesAndPosition( patternNode, state, patternType )
    const cssName = className + '_0'

    const marker = cm.markText( start, end, { 
      'className': cssName + ' annotation-border', 
      inclusiveLeft: true,
      inclusiveRight: true
    })

    if( track.markup === undefined ) Marker.prepareObject( track )

    track.markup.textMarkers[ className ] = marker

    if( track.markup.cssClasses[ className ] === undefined ) track.markup.cssClasses[ className ] = []

    track.markup.cssClasses[ className ][ index ] = cssName    
    
    if(  patternObject.__delayAnnotations === true ) {
      Gibber.Environment.animationScheduler.add( () => {
        Marker._addPatternUpdates( patternObject, className )
        Marker._addPatternFilter( patternObject )
      }, 5 )
    }else{
      Marker._addPatternUpdates( patternObject, className )
      Marker._addPatternFilter( patternObject )
    }

    patternObject.patternName = className
    patternObject._onchange = () => { Marker._updatePatternContents( patternObject, className, track ) }
  }

  return Literal 

}
