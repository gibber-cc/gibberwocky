!function() {
  var WAAClock = require( 'waaclock' ),
      CodeMirror = require( 'codemirror' )

  require( '../node_modules/codemirror/mode/javascript/javascript.js' )

  var cm = CodeMirror( document.body, { mode:"javascript" }),
      useAudioContext = false,
      count = 0,
      timeout
     
  timeout  = function() {
    cm.setValue( 'the time is ' + count++ + ' seconds' )
  }

  if( useAudioContext ) {
    var ctx = new AudioContext(),
        clock = new WAAClock( ctx )

    clock.start()

    clock.setTimeout( timeout, 0 ).repeat( 1 ) 

  }else{
    setInterval( timeout, 1000 ) 
  }

}()
