const Utility = require( '../../utility.js' )
const $ = Utility.create

module.exports = function( Marker ) {
  'use strict'

  const ArrayExpression = function( patternNode, state, seq, patternType, container=null, index=0 ) {
    if( patternNode.processed === true ) return 
    console.log( 'array' )
    const cm = state.cm
    const track = seq.object
    const patternObject = seq[ patternType ]
    const [ patternName, start, end ] = Marker._getNamesAndPosition( patternNode, state, patternType, index )
    const cssName = patternName 

    if( track.markup === undefined ) Marker.prepareObject( track )

    let count = 0

    for( let element of patternNode.elements ) {
      let cssClassName = patternName + '_' + count,
          elementStart = Object.assign( {}, start ),
          elementEnd   = Object.assign( {}, end   ),
          marker
      
      elementStart.ch = element.start + Marker.offset.horizontal
      elementEnd.ch   = element.end   + Marker.offset.horizontal

      if( element.type === 'BinaryExpression' ) {
        marker = cm.markText( elementStart, elementEnd, { 
          'className': cssClassName + ' annotation',
           startStyle: 'annotation-no-right-border',
           endStyle: 'annotation-no-left-border',
           inclusiveLeft:true, inclusiveRight:true
        })

        // create specific border for operator: top, bottom, no sides
        const divStart = Object.assign( {}, elementStart )
        const divEnd   = Object.assign( {}, elementEnd )

        divStart.ch += 1
        divEnd.ch -= 1

        const marker2 = cm.markText( divStart, divEnd, { className:cssClassName + '_binop annotation-binop' })


      }else if (element.type === 'UnaryExpression' ) {
        marker = cm.markText( elementStart, elementEnd, { 
          'className': cssClassName + ' annotation', 
          inclusiveLeft: true,
          inclusiveRight: true
        })

        let start2 = Object.assign( {}, elementStart )
        start2.ch += 1
        let marker2 = cm.markText( elementStart, start2, { 
          'className': cssClassName + ' annotation-no-right-border', 
          inclusiveLeft: true,
          inclusiveRight: true
        })

        let marker3 = cm.markText( start2, elementEnd, { 
          'className': cssClassName + ' annotation-no-left-border', 
          inclusiveLeft: true,
          inclusiveRight: true
        })
      }else if( element.type === 'ArrayExpression' ) {
         marker = cm.markText( elementStart, elementEnd, { 
          'className': cssClassName + ' annotation',
          inclusiveLeft:true, inclusiveRight:true,
          startStyle:'annotation-left-border-start',
          endStyle: 'annotation-right-border-end',
         })

         // mark opening array bracket
         const arrayStart_start = Object.assign( {}, elementStart )
         const arrayStart_end  = Object.assign( {}, elementStart )
         arrayStart_end.ch += 1
         cm.markText( arrayStart_start, arrayStart_end, { className:cssClassName + '_start' })

         // mark closing array bracket
         const arrayEnd_start = Object.assign( {}, elementEnd )
         const arrayEnd_end   = Object.assign( {}, elementEnd )
         arrayEnd_start.ch -=1
         cm.markText( arrayEnd_start, arrayEnd_end, { className:cssClassName + '_end' })

      }else{
        marker = cm.markText( elementStart, elementEnd, { 
          'className': cssClassName + ' annotation',
          inclusiveLeft:true, inclusiveRight:true
        })
      }

      if( track.markup.textMarkers[ patternName  ] === undefined ) track.markup.textMarkers[ patternName ] = []
      track.markup.textMarkers[ patternName ][ count ] = marker
     
      if( track.markup.cssClasses[ patternName ] === undefined ) track.markup.cssClasses[ patternName ] = []
      track.markup.cssClasses[ patternName ][ count ] = cssClassName 
      
      count++
    }
    
    let highlighted = { className:null, isArray:false },
        cycle = Marker._createBorderCycleFunction( patternName, patternObject )
    
    patternObject.patternType = patternType 
    patternObject.patternName = patternName

    patternObject.update = () => {
      let className = '.' + patternName
      
      className += '_' + patternObject.update.currentIndex 

      if( highlighted.className !== className ) {

        // remove any previous annotations for this pattern
        if( highlighted.className !== null ) {
          if( highlighted.isArray === false && highlighted.className ) { 
            $( highlighted.className ).remove( 'annotation-border' ) 
          }else{
            $( highlighted.className ).remove( 'annotation-array' )
            $( highlighted.className + '_start' ).remove( 'annotation-border-left' )
            $( highlighted.className + '_end' ).remove( 'annotation-border-right' )

            if( $( highlighted.className + '_binop' ).length > 0 ) {
              $( highlighted.className + '_binop' ).remove( 'annotation-binop-border' )
            }

          }
        }

        // add annotation for current pattern element
        if( Array.isArray( patternObject.values[ patternObject.update.currentIndex ] ) ) {
          $( className ).add( 'annotation-array' )
          $( className + '_start' ).add( 'annotation-border-left' )
          $( className + '_end' ).add( 'annotation-border-right' )
          highlighted.isArray = true
        }else{
          $( className ).add( 'annotation-border' )

          if( $( className + '_binop' ).length > 0 ) {
            $( className + '_binop' ).add( 'annotation-binop-border' )
          }
          highlighted.isArray = false
        }

        highlighted.className = className

        cycle.clear()
      }else{
        cycle()
      }
    }

    patternObject.clear = () => {
      if( highlighted.className !== null ) { $( highlighted.className ).remove( 'annotation-border' ) }
      cycle.clear()
    }

    Marker._addPatternFilter( patternObject )
    patternObject._onchange = () => { Marker._updatePatternContents( patternObject, patternName, track ) }
  }
    
  return ArrayExpression
}

