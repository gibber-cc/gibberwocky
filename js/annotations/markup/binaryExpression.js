module.exports = function( Marker ) {
  'use strict'

  // 1/4, 1/8 etc.
  const BinaryExpression = function( patternNode, state, seq, patternType, index=0 ) {
    if( patternNode.processed === true ) return 
    const cm = state.cm
    const track = seq.object
    const patternObject = seq[ patternType ]
    const [ className, start, end ] = Marker._getNamesAndPosition( patternNode, state, patternType )
    const cssName = className + '_0'

    const marker = cm.markText(
      start, 
      end,
      { 
        'className': cssName + ' annotation annotation-border' ,
        startStyle: 'annotation-no-right-border',
        endStyle: 'annotation-no-left-border',
        inclusiveLeft:true,
        inclusiveRight:true
      }
    )

    track.markup.textMarkers[ className ] = marker

    const divStart = Object.assign( {}, start )
    const divEnd   = Object.assign( {}, end )

    divStart.ch += 1
    divEnd.ch -= 1

    const marker2 = cm.markText( divStart, divEnd, { className:'annotation-binop-border' })     

    if( track.markup.cssClasses[ className ] === undefined ) track.markup.cssClasses[ className ] = []
    track.markup.cssClasses[ className ][ index ] = cssName


  }

  return BinaryExpression 

}
