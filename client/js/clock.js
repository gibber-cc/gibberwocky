!function() {

var Queue = require( './priorityqueue.js' )

var Scheduler = {
  phase: 0,
  msgs: [],
  queue: new Queue( function( a, b ) {
    return a.time - b.time
  }),
  
  // all ticks take the form of { time:timeInSamples, seq:obj }
  advance( advanceAmount, beat ) {
    var end = this.phase + advanceAmount,
        nextTick = this.queue.peek()
       
    if( this.queue.length && nextTick.time < end ) {

      // remove tick
      this.queue.pop()

      var beatOffset = ( nextTick.time - this.phase ) / advanceAmount

      
      this.currentTime = nextTick.time

      // execute callback function for tick passing schedule, time and beatOffset
      nextTick.seq.tick( this, beat, beatOffset )

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

  addMessage( seq, time ) {
    time += this.currentTime || this.phase
    this.queue.push({ seq, time })
  },

  outputMessages() {
    this.msgs.forEach( Gibber.Communication.send )
  },

  seq( beat ) {
    // TODO WARNING TODO: SEVERE FAKERY... assume 1 beat = 22050 samples @ 120 bpm
    Scheduler.advance( 22050, beat )

    Scheduler.outputMessages()
  },

}

module.exports = Scheduler

}()
