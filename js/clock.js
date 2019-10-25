const Queue = require( './priorityqueue.js' )
const Big   = require( 'big.js' )

let Gibber = null

let Scheduler = {
  phase: 0,
  msgs: [],
  delayed: [],
  bpm: 120,
  functionsToExecute: [],
  mockBeat: 0,
  mockInterval: null,
  currentBeat: 1,
  currentTime: Big(0),
  currentTimeInMs:0,

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

  sync( mode = 'internal' ) {
    const tempSync = this.__sync__

    this.__sync__ = mode// === 'internal' 

    if( this.__sync__ === 'internal' ) {
      if( tempSync === true ) {
        this.run()
      }
    }else{
      if( tempSync === false ) {
        this.animationClockInitialized = false
      }
    }

    localStorage.setItem( 'sync', mode )
  },

  init( __Gibber ) {
    Gibber = __Gibber
    const sync = localStorage.getItem( 'sync' )

    if( sync !== null && sync !== undefined ) { 
      this.sync( sync )
      if( Gibber.isStandalone === true ) {
        switch( sync ) {
          case 'internal': document.querySelector('#internalSyncRadio').setAttribute( 'checked', true ); break;
          case 'clock':    document.querySelector('#clockSyncRadio').setAttribute( 'checked', true ); break; 
          case 'live':     document.querySelector('#liveSyncRadio').setAttribute( 'checked', true ); break;
          case 'max':      document.querySelector('#maxSyncRadio').setAttribute( 'checked', true ); break;
        }
      }
    }else{
      this.sync( 'max' )
    }

    this.animationClock = Gibber.Environment.animationClock
  },

  run() {
    if( this.animationClockInitialized === false ) {
      this.animationClock.add( this.animationClockCallback, 0 )
    }
  },

  animationClockCallback( time ) {
    if( this.animationClockInitialized === false ) {
      this.animationOffset = this.lastBeat = time
      this.animationClockInitialized = true
    }
    
    this.beatCallback( time )
  },

  beatCallback( time ) {
    const timeDiff = time - this.lastBeat
    const oneBeat = (60 / this.bpm) * 1000 
    if( timeDiff >= oneBeat ) {
      this.advanceBeat()
      this.lastBeat = time - (timeDiff - oneBeat) // preserve phase remainder
    }

    if( this.__sync__ === false ) {
      this.animationClock.add( this.beatCallback, 1 )
    }
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
      this.currentTimeInMs = Gibber.Utility.beatsToMs( this.currentTime )

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
      this.currentTimeInMs = Gibber.Utility.beatsToMs( this.currentTime )
      Gibber.Environment.animationScheduler.updateVisualizationTime( Gibber.Utility.beatsToMs( advanceAmount ) )
    }
  },

  addMessage( seq, time, shouldExecute=true, priority=0, client ) {
    if( typeof time === 'number' ) time = Big( time )
    // TODO: should 4 be a function of the time signature?
    time = time.times( 4 ).plus( this.currentTime )

    this.queue.push({ seq, time, shouldExecute, priority, client })
  },

  outputMessages() {
    this.msgs.forEach( __msg => {
      if( __msg === undefined  ) return 

      const msg  = __msg[ 0 ]
      const mode = __msg[ 1 ]

      if( Array.isArray( msg ) ) { // for chords etc.
        msg.forEach( _msg => Gibber.Communication.send( _msg, mode ) )
      }else{
        if( mode === 'midi' ) {
          Gibber.MIDI.send( msg )
        }else{
          Gibber.Communication.send( msg, mode )
        }
      }
    })
  },

  seq( beat, from='max' ) {
    if( Scheduler.__sync__ === from ) {
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
    }
  },

}

module.exports = Scheduler
