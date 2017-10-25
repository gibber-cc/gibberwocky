module.exports = function( Marker ) {
  return {
    Literal( node, state, cb ) {
      state.push( node.value )
    },
    Identifier( node, state, cb ) {
      state.push( node.name )
    },
    AssignmentExpression( expression, state, cb ) {
      if( expression.right.type !== 'Literal' && Marker.standalone[ expression.right.callee.name ] ) {

        Marker.standalone[ expression.right.callee.name ]( 
          expression.right, 
          state.cm,
          track,
          expression.left.name,
          state,
          cb
        )            
      }else{
        // if it's a gen~ object we need to store a reference so that we can create wavepattern
        // annotations when appropriate.
        const left = expression.left
        const right= expression.right
        
        Marker.globalIdentifiers[ left.name ] = right

        // XXX does this need a track object? passing null...
        Marker.processGen( expression, state.cm, null)

      }
    },
    CallExpression( node, state, cb ) {
      cb( node.callee, state )

      const endIdx = state.length - 1
      const end = state[ endIdx ]
      const foundSequence = end === 'seq'

      if( foundSequence === true ){
        const hasSeqNumber = node.arguments.length > 2
        
        let seqNumber = 0
        if( hasSeqNumber === true ) {
          seqNumber = node.arguments[2].raw
        }

        const seq = Marker.getObj( state.slice( 0, endIdx ), true, seqNumber )

        Marker.markPatternsForSeq( seq, node.arguments, state, cb, node )
      }
    },
    MemberExpression( node, state, cb ) {
      if( node.object.type !== 'Identifier' ) {
        if( node.property ) {
          state.unshift( node.property.type === 'Identifier' ? node.property.name : node.property.raw )
        }
        cb( node.object, state )
      }else{
        if( node.property !== undefined ) { // if the objects is an array member, e.g. tracks[0]
          state.unshift( node.property.raw )
        }
        state.unshift( node.object.name )
      }
    },
  }
}
