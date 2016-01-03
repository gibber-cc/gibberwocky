!function() {
  var acorn = require( 'acorn' )
  
  var Marker = {
    
    process: function( code, position, codemirror ) {
      console.log( position )
      console.log( acorn.parse( code, { locations:true } ) )
    },

    markupArray: function( code, fragmentPosition, codemirror ) {

    }
  }
  
  module.exports = Marker

}()
