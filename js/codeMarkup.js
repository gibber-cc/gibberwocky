!function() {
  var acorn = require( 'acorn' )
  
  var Marker = {
    
    process: function( code, position, codemirror ) {
      console.log( acorn.parse( code, { locations:true } ) )
    },
  }
  
  module.exports = Marker

}()
