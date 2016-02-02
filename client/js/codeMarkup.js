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
    var tree = acorn.parse( code, { locations:true } ).body
    
    for( let node of tree ) {
      if( node.type === 'ExpressionStatement' ) { // not control flow
        console.log( node )
        this._process[ node.type ]( node )
      }else{
        console.log( 'not expression' )
      }
    }
  },

  _process: {
    'ExpressionStatement': function( node ) {
      var [ components, depthOfCall ] = Marker._getExpressionHierarchy( node.expression ),
          args = node.expression.arguments

      console.log( 'COMPONENTS', components )
      switch( callDepths[ depthOfCall ] ) {
         case 'THIS.METHOD':
           console.log( 'simple method call, no sequencing so no markup' )
           break;

         case 'THIS.METHOD.SEQ':
           
           for( let pattern of args ) {
             Marker._markPattern( pattern, node, components )
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
  
  _markPattern: function( pattern, node, components ) {
    
  },

  _getExpressionHierarchy: function( expr ) {
    var callee = expr.callee,
        obj = callee.object,
        components = [],
        depth = 0

    while( obj !== undefined ) {
      let pushValue = null

      if( obj.type === 'ThisExpression' ) {
        pushValue = 'this' 
      }else if( obj.property.name ){
        pushValue = obj.property.name
      }else if( obj.property.type === 'Literal' ){ // array index
        pushValue = '[' + obj.property.value + ']'
      }
      
      if( pushValue !== null ) components.push( pushValue ) 

      depth++
      obj = obj.object
    }
    
    components.reverse()
    components.push( callee.property.name )

    return [ components, depth ]
  },

  markupArray: function( code, fragmentPosition, codemirror ) {

  }
}

module.exports = Marker
