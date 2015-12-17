!function() {
  var WAAClock = require( 'waaclock' ),
      CodeMirror = require( 'codemirror' ),
      Gibber = require( './gibber.js' )

  

  var useAudioContext = false,
      count = 0,
      timeout
     
  timeout  = function() {
    cm.setValue( 'the time is ' + count++ + ' seconds' )
  }
  
  Gibber.init()
  window.Gibber = Gibber
 // window.max.outlet(0)
  var log = console.log

  //console.log = Gibber.log.bind( Gibber ) 
 // console.log( "TESTING" )
  // ctx = new AudioContext()

  if( useAudioContext ) {
    var ctx = new AudioContext(),
        clock = new WAAClock( ctx )

    clock.start()

    clock.setTimeout( timeout, 0 ).repeat( 1 ) 

  }else{
   // setInterval( timeout, 1000 ) 
  }

}()
