!function() {

var MIDI = {
  note : function( notenum, velocity, duration ) {
    window.open( 'maxmessage:midi/noteon/' + notenum + '/' + velocity + '/' + duration )
  }
}

module.exports = MIDI
}()
