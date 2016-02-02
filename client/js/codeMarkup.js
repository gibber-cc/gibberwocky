const acorn = require( 'acorn' )

const callDepths = [
  null ,
  'THIS.METHOD',
  'THIS.METHOD.SEQ',
  'THIS.METHOD[ 0 ].SEQ',
  'THIS.METHOD.VALUES.REVERSE.SEQ',
  'THIS.METHOD[ 0 ].VALUES.REVERSE.SEQ'
]

let Marker = {
  prepareObject : function( obj ) {
    obj.markup = {
      textMarkers: {},
      cssClasses:  {} 
    }  
  },

  process: function( code, position, codemirror, track ) {
    //console.log( position )
    //console.log( acorn.parse( code, { locations:true } ) )
    let tree = acorn.parse( code, { locations:true } ).body
    
    for( let node of tree ) {
      if( node.type === 'ExpressionStatement' ) { // not control flow
        //console.log( node )
        node.verticalOffset = position.start.line
        this._process[ node.type ]( node, codemirror, track )
      }else{
        console.log( 'not expression' )
      }
    }
  },

  _patternTypes: [ 'values', 'timings', 'index' ],

  _process: {
    'ExpressionStatement': function( node, codemirror, track ) {
      let [ components, depthOfCall, hasIndex ] = Marker._getExpressionHierarchy( node.expression ),
          args = node.expression.arguments

      //console.log( 'COMPONENTS', components )
      switch( callDepths[ depthOfCall ] ) {
         case 'THIS.METHOD':
           console.log( 'simple method call, no sequencing so no markup' )
           break;

         case 'THIS.METHOD.SEQ':
           
           for( var i = 0, length = args.length >= 2 ? 2 : 1; i < length; i++ ) {
             let pattern = args[ i ]
              
             Marker._markPattern[ pattern.type ]( pattern, node, components, codemirror, track, hasIndex, Marker._patternTypes[ i ] )
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

  // doc.markText(from: {line, ch}, to: {line, ch}, ?options: object) 
  _markPattern: {
    Literal( pattern, node, components, cm, track, hasIndex, patternType ) {
      let start = pattern.loc.start,
          end   = pattern.loc.end,
          className = components.slice( 1, components.length - 1 ), // .join('.'),
          cssName   = null,
          marker

       if( !hasIndex ) className.splice( 1, 0, 0 ) // insert 0 index into array
        
       className.push( patternType )
       className = className.join( '_' )

       start.line += node.verticalOffset - 1
       end.line   += node.verticalOffset - 1
       start.ch = start.column
       end.ch   = end.column

       cssName = className + '_0'
      
       marker = cm.markText( start, end, { 'className':cssName } )
       
       track.markup.textMarkers[ className ] = marker
       
       if( track.markup.cssClasses[ className ] === undefined ) track.markup.cssClasses[ className ] = []

       track.markup.cssClasses[ className ][ 0 ] = cssName    
       
       //console.log( 'position is', start, end, cssName, className, cm )
    }
  },

  _getExpressionHierarchy: function( expr ) {
    let callee = expr.callee,
        obj = callee.object,
        components = [],
        hasIndex = false,
        depth = 0

    while( obj !== undefined ) {
      let pushValue = null

      if( obj.type === 'ThisExpression' ) {
        pushValue = 'this' 
      }else if( obj.property.name ){
        pushValue = obj.property.name
      }else if( obj.property.type === 'Literal' ){ // array index
        pushValue = '[' + obj.property.value + ']'
        hasIndex = true
      }
      
      if( pushValue !== null ) components.push( pushValue ) 

      depth++
      obj = obj.object
    }
    
    components.reverse()
    components.push( callee.property.name )

    return [ components, depth, hasIndex ]
  },

  markupArray: function( code, fragmentPosition, codemirror ) {

  }
}

module.exports = Marker
