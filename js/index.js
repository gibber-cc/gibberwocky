!function() {
  var Gibber = require( './gibber.js' ),
      useAudioContext = false,
      count = 0
     
  Gibber.init()
  window.Gibber = Gibber
  window.MIDI = Gibber.MIDI

  //console.log = Gibber.log.bind( Gibber ) 
  // console.log( "TESTING" )
  // ctx = new AudioContext()

  /*if( useAudioContext ) {*/
    //var ctx = new AudioContext(),
        //clock = new WAAClock( ctx )

    //clock.start()

    //clock.setTimeout( timeout, 0 ).repeat( 1 ) 

  //}else{
   //// setInterval( timeout, 1000 ) 
  /*}*/

}()
