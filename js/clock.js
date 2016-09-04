const Queue = require( './priorityqueue.js' )
const Big   = require( 'big.js' )

let Scheduler = {
  phase: 0,
  msgs: [],
  delayed: [],
  bpm: 120,
  functionsToExecute: [],
  mockBeat: 0,
  mockInterval: null,
  currentBeat: 1,

  queue: new Queue( ( a, b ) => {
    if( a.time.eq( b.time ) ) {
      return b.priority - a.priority
    }else{
      return a.time.minus( b.time )
    }
  }),

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
        shouldEnd = false,
        beatOffset

    this.currentBeat = beat

    if( this.queue.length && parseFloat( nextTick.time.toFixed(6) ) < end ) {
      beatOffset = nextTick.time.minus( this.phase ).div( advanceAmount )
      
      // remove tick
      this.queue.pop()

      
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

  addMessage( seq, time, shouldExecute=true, priority=0 ) {
    if( typeof time === 'number' ) time = Big( time )
    // TODO: should 4 be a function of the time signature?
    time = time.times( 4 ).plus( this.currentTime )

    this.queue.push({ seq, time, shouldExecute, priority })
  },

  outputMessages() {
    this.msgs.forEach( msg => {
      if( Array.isArray( msg ) ) { // for chords etc.
        msg.forEach( Gibber.Communication.send )
      }else{
        if( msg !== 0 ) { // XXX
          Gibber.Communication.send( msg )
        }
      }
    })
  },

  seq( beat ) {
    beat = parseInt( beat )

    if( beat === 1 ) {
      for( let func of Scheduler.functionsToExecute ) {
        try {
          func()
        } catch( e ) {
          console.error( 'error with user submitted code:', e )
        }
      }
      Scheduler.functionsToExecute.length = 0
    }

    Scheduler.advance( 1, beat )
    
    Scheduler.outputMessages()
  },

}

module.exports = Scheduler
