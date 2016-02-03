const acorn = require( 'acorn' )

const callDepths = [
  null ,
  'THIS.METHOD',
  'THIS.METHOD.SEQ',
  'THIS.METHOD[ 0 ].SEQ',
  'THIS.METHOD.VALUES.REVERSE.SEQ',
  'THIS.METHOD[ 0 ].VALUES.REVERSE.SEQ'
]

const $ = require( './utility.js' ).create

let Marker = {
  _patternTypes: [ 'values', 'timings', 'index' ],

  prepareObject : function( obj ) {
    obj.markup = {
      textMarkers: {},
      cssClasses:  {} 
    }  
  },

  process: function( code, position, codemirror, track ) {
    let tree = acorn.parse( code, { locations:true } ).body
    
    for( let node of tree ) {
      if( node.type === 'ExpressionStatement' ) { // not control flow
        node.verticalOffset = position.start.line
        this._process[ node.type ]( node, codemirror, track )
      }
    }
  },

  _process: {
    'ExpressionStatement': function( expressionNode, codemirror, track ) {
      let [ components, depthOfCall, index ] = Marker._getExpressionHierarchy( expressionNode.expression ),
          args = expressionNode.expression.arguments
      
      // if index is passed as argument to .seq call...
      if( args.length > 2 ) { index = args[ 2 ].value }

      switch( callDepths[ depthOfCall ] ) {
         case 'THIS.METHOD':
           // console.log( 'simple method call, no sequencing so no markup' )
           break;

         case 'THIS.METHOD.SEQ':
           let valuesPattern =  track[ components[ 1 ] ][ index ].values,
               timingsPattern = track[ components[ 1 ] ][ index ].timings,
               valuesNode = args[ 0 ],
               timingsNode= args[ 1 ]

           Marker._markPattern[ valuesNode.type ]( valuesNode, expressionNode, components, codemirror, track, index, 'values', valuesPattern ) 
           if( timingsNode ) {
             Marker._markPattern[ timingsNode.type ]( timingsNode, expressionNode, components, codemirror, track, index, 'timings', timingsPattern )  
           }

           break;

         case 'THIS.METHOD[ 0 ].SEQ': break;

         case 'THIS.METHOD.VALUES.REVERSE.SEQ': break;

         case 'THIS.METHOD[ 0 ].VALUES.REVERSE.SEQ': break;

         default:
           break;
      }
    },
  },

  _createBorderCycleFunction( classNamePrefix, patternObject ) {
    let modCount = 0,
        lastBorder = null,
        lastClassName = null
    
    let cycle = function() {
      let className = '.' + classNamePrefix + '_' +  patternObject.update.currentIndex,
          border = 'top'

      switch( modCount++ % 4 ) {
        case 1: border = 'right'; break;
        case 2: border = 'bottom'; break;
        case 3: border = 'left'; break;
      }

      $( className ).add( 'annotation-' + border + '-border' )
      
      if( lastBorder )
        $( className ).remove( 'annotation-' + lastBorder + '-border' )
      
      lastBorder = border
      lastClassName = className
    }

    cycle.clear = function() {
      modCount = 1
      if( lastBorder && lastClassName )
        $( lastClassName ).remove( 'annotation-' + lastBorder + '-border' )
      
      lastBorder = null
    }

    return cycle
  },

  _addPatternUpdates( patternObject, className ) {
    let cycle = Marker._createBorderCycleFunction( className, patternObject )
    
    patternObject.update = () => {
      if( !patternObject.update.shouldUpdate ) return 
      cycle() 
    }
  },

  _addPatternFilter( patternObject ) {
    patternObject.filters.push( ( args ) => {
      patternObject.update.shouldUpdate = true
      patternObject.update.currentIndex = args[ 2 ]
      
      Gibber.Environment.animationScheduler.updates.push( patternObject.update ) 
      return args
    }) 
  },

  _markPattern: {
    Literal( patternNode, containerNode, components, cm, track, index=0, patternType, patternObject ) {
       let [ className, start, end ] = Marker._getNamesAndPosition( patternNode, containerNode, components, index, patternType ),
           cssName = className + '_0',
           marker = cm.markText( start, end, { 'className':cssName + ' annotation-border' } )
       
       track.markup.textMarkers[ className ] = marker
       
       if( track.markup.cssClasses[ className ] === undefined ) track.markup.cssClasses[ className ] = []

       track.markup.cssClasses[ className ][ index ] = cssName    
       
       Marker._addPatternUpdates( patternObject, className )
       Marker._addPatternFilter( patternObject )
    },

    BinaryExpression( patternNode, containerNode, components, cm, track, index=0, patternType, patternObject ) { // TODO: same as literal, refactor?
       let [ className, start, end ] = Marker._getNamesAndPosition( patternNode, containerNode, components, index, patternType ),
           cssName = className + '_0',
           marker = cm.markText( start, end, { 'className':cssName + ' annotation-border', startStyle:'annotation-no-right-border', endStyle:'annotation-no-left-border'}) // startStyle:'annotation-left-border', endStyle:'annotation-right-border' } )
       
       track.markup.textMarkers[ className ] = marker
       
       if( track.markup.cssClasses[ className ] === undefined ) track.markup.cssClasses[ className ] = []

       track.markup.cssClasses[ className ][ index ] = cssName
       setTimeout( () => { $( '.' + cssName )[1].classList.add( 'annotation-no-horizontal-border' ) }, 250 )

       Marker._addPatternUpdates( patternObject, className )
       Marker._addPatternFilter( patternObject )
    },

    ArrayExpression( patternNode, containerNode, components, cm, track, index=0, patternType, patternObject ) {
      let [ patternName, start, end ] = Marker._getNamesAndPosition( patternNode, containerNode, components, index, patternType ),
          marker, 
          count = 0

      for( let element of patternNode.elements ) {
        let cssClassName = patternName + '_' + count,
            elementStart = Object.assign( {}, start ),
            elementEnd   = Object.assign( {}, end   ),
            marker
        
        elementStart.ch = element.start
        elementEnd.ch   = element.end
        marker = cm.markText( elementStart, elementEnd, { 'className':cssClassName } )
        
        if( track.markup.textMarkers[ patternName  ] === undefined ) track.markup.textMarkers[ patternName ] = []
        track.markup.textMarkers[ patternName ][ count ] = marker
       
        if( track.markup.cssClasses[ patternName ] === undefined ) track.markup.cssClasses[ patternName ] = []
        track.markup.cssClasses[ patternName ][ count ] = cssClassName 
        
        count++
      }
      
      let highlighted = null,
          cycle = Marker._createBorderCycleFunction( patternName, patternObject )
      
      patternObject.update = () => {
        if( !patternObject.update.shouldUpdate ) return 
         
        let className = `.note_${ index }_${ patternType }_${ patternObject.update.currentIndex }`
        
        if( highlighted !== className ) {
          if( highlighted ) { $( highlighted ).remove( 'annotation-border' ) }
          $( className ).add( 'annotation-border' )
          highlighted = className
          cycle.clear()
        }else{
          cycle()
        }
      }

      Marker._addPatternFilter( patternObject )
    },

    // CallExpression denotes an array that calls a method, like .rnd()
    CallExpression( patternNode, containerNode, components, cm, track, index=0, patternType, patternObject ) {
      var args = Array.prototype.slice.call( arguments, 0 )
      args[ 0 ] = patternNode.callee.object

      Marker._markPattern.ArrayExpression.apply( null, args )
    }
  },

  _getNamesAndPosition( patternNode, containerNode, components, index=0, patternType ) {
    let start = patternNode.loc.start,
        end   = patternNode.loc.end,
        className = components.slice( 1, components.length - 1 ), // .join('.'),
        cssName   = null,
        marker

     className.splice( 1, 0, index ) // insert index into array
      
     className.push( patternType )
     className = className.join( '_' )

     start.line += containerNode.verticalOffset - 1
     end.line   += containerNode.verticalOffset - 1
     start.ch   = start.column
     end.ch     = end.column

     return [ className, start, end ]
  },

  _getExpressionHierarchy( expr ) {
    let callee = expr.callee,
        obj = callee.object,
        components = [],
        index = 0,
        depth = 0

    while( obj !== undefined ) {
      let pushValue = null

      if( obj.type === 'ThisExpression' ) {
        pushValue = 'this' 
      }else if( obj.property.name ){
        pushValue = obj.property.name
      }else if( obj.property.type === 'Literal' ){ // array index
        pushValue = '[' + obj.property.value + ']'
        index = obj.property.value
      }
      
      if( pushValue !== null ) components.push( pushValue ) 

      depth++
      obj = obj.object
    }
    
    components.reverse()
    components.push( callee.property.name )

    return [ components, depth, index ]
  },

}

module.exports = Marker
