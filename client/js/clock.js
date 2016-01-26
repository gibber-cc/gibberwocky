!function() {

var Queue = require( './priorityqueue.js' )

var Scheduler = {
  phase: 0,
  msgs: [],
  queue: new Queue( function( a, b ) {
    return a.time - b.time
  }),
  
  // all ticks take the form of { time:timeInSamples, callback:function }
  advance : function( advanceAmount, beat ) {
    var end = this.phase + advanceAmount,
        nextTick = this.queue.peek()
       
    if( this.queue.length && nextTick.time < end ) {

      // remove tick
      this.queue.pop()

      var beatOffset = (nextTick.time - this.phase) / advanceAmount

      // execute callback function for tick passing schedule, time and beatOffset    
      nextTick.callback( this, beat, nextTick.time, beatOffset )

      // recursively call advance
      this.advance( advanceAmount, beat ) 
    
    }else{

      if( this.msgs.length ) {      // if output messages have been created
        this.outputMessages()       // output them
        this.msgs.length = 0        // and reset the contents of the output messages array
      }

      this.phase += advanceAmount   // increment phase
    }
  },

  addMessage: function( _callback, _time ) {
    this.queue.push({ callback:_callback, time:_time  })
    // console.log( "CURRENT TIME: " + Scheduler.phase, "| NEXT TIME:" + _time )
  },

  outputMessages: function() {
    this.msgs.forEach( Gibber.Communication.send )
  },

  seq : function( beat ) {
    // TODO WARNING TODO: SEVERE FAKERY... assume 1 beat = 22050 samples @ 120 bpm
    Scheduler.advance( 22050, beat )

    Scheduler.outputMessages()
    /*
     *if (beat == 0) {
     *  mul = 1 + (mul % 4);
     *}
     *var msgarr = []; 
     * // generate some randomized beats:
     *var div = Math.pow(2, (beat+mul+1) % 5);
     *var lim = 1;
     *for (var i=0; i<lim; i++) {
     *  // timestamp within beat (0..1)
     *  var t = i/lim; //random(div)/div;
     *  // MIDI note value
     *  var n = 36 + (beat*3)%16; //notes[beat % notes.length]; //pick(notes)
     *  // MIDI velocity
     *  var v = (1-t) * (1-t) * (1-t) * 100; //64 + random(32);
     *  // duration (ms)
     *  var d = (beat+1) * (beat+1) * (t+1) * 6;
     *  // seq~ schedule format:
     *  // add <seqid> <phase> <arguments...>
     *  // seqid is the beat number
     *  // phase is 0..1 within that beat
     *  // arguments is a max message, as space-delimited strings and numbers
     *  var msgstring = "add " + beat + " " + t + " " + n + " " + v + " " + d
     *  msgarr.push( msgstring )
     *  // Gibber.log( msgstring )
     *}
    */

    // this.send( this.msgs ) // sends array as comma-delimited strings
  },

}

module.exports = Scheduler

}()
