!function() {
  var WAAClock = require( 'waaclock' ),
      CodeMirror = require( 'codemirror' )

  require( '../node_modules/codemirror/mode/javascript/javascript.js' )

  var cm = CodeMirror( document.body, { mode:"javascript" })

  console.log('test2')

}()
