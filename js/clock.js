!function() {

const Queue = require( './priorityqueue.js' )

let Scheduler = {
  phase: 0,
  msgs: [],
  bpm: 120,
  functionsToExecute: [],
  queue: new Queue( ( a, b ) => {
    if( a.time === b.time ) {
      return b.priority - a.priority
    }else{
     return a.time - b.time
    }
  } ),
  mockBeat: 0,
  mockInterval: null,

  mockRun() {
    let seqFunc = () => {
      this.seq( this.mockBeat++ % 8 )
    } 
    this.mockInterval = setInterval( seqFunc, 500 )
  },

  // all ticks take the form of { time:timeInSamples, seq:obj }
  advance( advanceAmount, beat ) {
    let end = this.phase + advanceAmount,
        nextTick = this.queue.peek(),
        beatOffset
       
    if( this.queue.length && nextTick.time < end ) {
      // remove tick
      this.queue.pop()

      beatOffset = ( nextTick.time - this.phase ) / advanceAmount

      this.currentTime = nextTick.time

      // execute callback function for tick passing schedule, time and beatOffset
      // console.log( 'next tick', nextTick.shouldExecute )
      nextTick.seq.tick( this, beat, beatOffset, nextTick.shouldExecute )

      // recursively call advance
      this.advance( advanceAmount, beat ) 
    
    } else {
      if( this.msgs.length ) {      // if output messages have been created
        this.outputMessages()       // output them
        this.msgs.length = 0        // and reset the contents of the output messages array
      }

      this.phase += advanceAmount   // increment phase
      this.currentTime = this.phase
    }
  },

  addMessage( seq, time, shouldExecute=true ) {
    time *= 4 // TODO: should this be a function of the time signature?
    time += this.currentTime || this.phase
    this.queue.push({ seq, time, shouldExecute })
  },

  outputMessages() {
    this.msgs.forEach( ( msg ) => {
      if( Array.isArray( msg ) ) { // for chords etc.
        msg.forEach( Gibber.Communication.send )
      }else{
        Gibber.Communication.send( msg )
      }
    })
  },

  seq( beat ) {
    if( beat % 4 === 1 ) {
      for( let func of Scheduler.functionsToExecute ) {
        try {
          func()
        } catch( e ) {
          console.log( 'error with user submitted code:', e )
        }
      }
      Scheduler.functionsToExecute.length = 0
    }
    Scheduler.advance( 1, beat )

    Scheduler.outputMessages()
  },

}

module.exports = Scheduler

}()
