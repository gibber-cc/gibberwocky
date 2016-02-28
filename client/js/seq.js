'use strict';

let seqclosure = function( Gibber ) {
  
  let Theory = Gibber.Theory

  let proto = {
    create( values, timings, key, object = null, priority=0 ) {
      let seq = Object.create( this )

      Object.assign( seq, {
        phase:   0,
        running: false,
        values,
        timings,
        object,
        key,
        priority
      })
      
      seq.init()
      
      return seq
    },
    
    init() {
      let valuesPattern, timingsPattern

      if( ! Gibber.Pattern.prototype.isPrototypeOf( this.values ) ) {
        if( !Array.isArray( this.values ) ) this.values  = [ this.values ] 
        valuesPattern = Gibber.Pattern.apply( null, this.values ) 

        if( this.values.randomFlag ) {
          valuesPattern.filters.push( () => {
            var idx = Gibber.Utility.rndi( 0, valuesPattern.values.length - 1 )
            return [ valuesPattern.values[ idx ], 1, idx ] 
          })
          for( var i = 0; i < this.values.randomArgs.length; i+=2 ) {
            valuesPattern.repeat( this.values.randomArgs[ i ], this.values.randomArgs[ i + 1 ] )
          }
        }

        this.values = valuesPattern
      }

      if( this.key === 'note' ) {
        this.values.filters.push( ( args ) => {
          args[ 0 ] = Theory.Note.convertToMIDI( args[ 0 ] )
          return args
        })
      } else if( this.key === 'chord' ) {
        this.values.filters.push( ( args ) => {
          let chord = args[ 0 ], out = []
          
          if( typeof chord === 'string' ) {
            let chordObj = Gibber.Theory.Chord.create( chord )

            out = chordObj.notes 
          }else{
            for( let i = 0; i < chord.length; i++ ) {
              let note = Gibber.Theory.Note.convertToMIDI( chord[i] )
              out.push( note )            
            }
          }

          args[0] = out

          return args
        })
      }

      if( ! Gibber.Pattern.prototype.isPrototypeOf( this.timings ) ) {
        if( this.timings !== undefined && !Array.isArray( this.timings ) ) this.timings = [ this.timings ]
        timingsPattern = Gibber.Pattern.apply( null, this.timings )
        timingsPattern.values.initial = this.timings.initial

        if( this.timings !== undefined ) {
          if( this.timings.randomFlag ) {
            timingsPattern.filters.push( ()=> { 
              var idx = Gibber.Utility.rndi( 0, timingsPattern.values.length - 1)
              return [ timingsPattern.values[ idx ], 1, idx ] 
            })
            for( var i = 0; i < this.timings.randomArgs.length; i+=2 ) {
              timingsPattern.repeat( this.timings.randomArgs[ i ], this.timings.randomArgs[ i + 1 ] )
            }
          }
        }

        this.timings = timingsPattern
      } 

      this.values.nextTime = this.timings.nextTime = 0
    },

    externalMessages: {
      note( number, beat, beatOffset ) {
        // arguments is a max message, as space-delimited strings and numbers. t is timestamp within beat 0..1
        // let msgstring = "add " + beat + " " + t + " " + n + " " + v + " " + d

        return 'add ' + beat + ' ' +  beatOffset + ' ' + number 
      },
      chord( chord, beat, beatOffset ) {
        let msg = []

        for( let i = 0; i < chord.length; i++ ) {
          msg.push( `add note ${beat} ${beatOffset} ${chord[i]}` )
        }

        return msg
      },
      cc( number, value, beat, beatOffset ) {
        return `add cc ${beat} ${beatOffset} ${number} ${value}`
      },
    },

    start() {
      if( this.running ) return
      this.running = true
     
      Gibber.Scheduler.addMessage( this, 0 )     
      
      return this
    },

    stop() {
      this.running = false
    },
    
    lastBeat:0,
    lastBeatOffset:0,

    tick( scheduler, beat, beatOffset ) {
      if( !this.running ) return

      // pick a new timing and schedule tick
      let nextTime = this.timings(),
          shouldExecute
      
      if( typeof nextTime === 'function' )  nextTime = nextTime()

      if( typeof nextTime === 'object' ) {
        shouldExecute = nextTime.shouldExecute
        nextTime = nextTime.time
      }else{
        shouldExecute = true
      }
      
      scheduler.addMessage( this, nextTime, true )

      if( shouldExecute ) {
        this.values.nextTime = beatOffset
        this.values.update.shouldUpdate = true

        let value = this.values()
        if( typeof value === 'function' ) value = value()

        // delay messages  
        if( this.externalMessages[ this.key ] !== undefined ) {
          
          let msg = this.externalMessages[ this.key ]( value, beat, beatOffset )

          scheduler.msgs.push( msg, this.priority )

        } else { // schedule internal method / function call immediately

          if( this.object && this.key ) {
            
            if( typeof this.object[ this.key ] === 'function' ) {
              this.object[ this.key ]( value )
            }else{
              this.object[ this.key ] = value
            }

          }
          
        }
      }
 
      this.timings.nextTime = beatOffset // for scheduling pattern updates
    },
  }

  proto.create = proto.create.bind( proto )

  return proto.create

}

module.exports = seqclosure
