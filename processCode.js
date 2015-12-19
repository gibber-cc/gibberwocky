	
function process( code ) {
	post( code );
	eval( code );
}

var MIDI = {
  note: function( num, vel, dur ) {
	outlet(0,'noteon',num,vel,dur)
  }
}	
