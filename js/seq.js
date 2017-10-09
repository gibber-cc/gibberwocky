'use strict';

const Big = require( 'big.js' )

let seqclosure = function( Gibber ) {
  
  let Theory = Gibber.Theory

  let proto = {
    DO_NOT_OUTPUT: -987654321,
    _seqs: [],

    create( values, timings, key, object = null, priority=0 ) {
      let seq = Object.create( this )

      if( values.isGen ) values  = Gibber.WavePattern( values )
      if( timings !== undefined && timings.isGen ) timings = Gibber.WavePattern( timings )

      if( timings === undefined ) {
        if( object.autorun === undefined ) {
          object.autorun = [ seq ]
        }else{
          object.autorun.push( seq )
        }
      }

      Object.assign( seq, {
        phase:   0,
        running: false,
        offset: 0,
        values,
        timings,
        object,
        key,
        priority,
        trackID:-1,
        octave:0
      })
      
      seq.init()

      proto._seqs.push( seq )
      
      return seq
    },

    __noteFilter( args ) {
      const seq = this

      args[ 0 ] = Theory.Note.convertToMIDI( args[ 0 ] )
      if( seq.octave !== 0 || seq.object.octave !== 0 ) {
        if( seq.octave !== 0 )
          args[0] += seq.octave * 12
        else
          args[0] += seq.object.octave * 12
      }

      return args
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

      let seq = this

      if( this.key === 'note' ) {
        if( this.values.filters.findIndex( v => v.type === 'note' ) === -1 ) {
          // round the values for transformation to midinotes... XXX what about for Max version?
          this.values.filters.push( args => { args[0] = Math.round( args[0] ); return args })
          const noteFilter = this.__noteFilter.bind( seq ) 
          noteFilter.type = 'note'
          this.values.filters.push( noteFilter )
        }
      } else if( this.key === 'chord' ) {

        this.values.filters.push( args => {
          let chord = args[ 0 ], out

          if( typeof chord === 'string' ) {
            let chordObj = Gibber.Theory.Chord.create( chord )

            out = chordObj.notes 
          }else{
            if( typeof chord === 'function' ) chord = chord()
            out = chord.map( Gibber.Theory.Note.convertToMIDI )
            if( this.octave !== 0 || this.object.octave !== 0 ) {
              out = this.octave !== 0 ? out.map( v => v + ( this.octave * 12 ) ) : out.map( v=> v + ( this.object.octave * 12 ) )
            }
          }

          args[0] = out
          
          return args
        })
      }

      // check in case it has no time values and is autotriggered by note / midinote messages
      if( this.timings !== undefined ) {
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
        const proxyFunctionTimings = ( oldPattern, newPattern ) => {
          this.timings = newPattern
          this.timings.filters = oldPattern.filters.slice( 0 )
          newPattern.__listeners.push( proxyFunctionTimings ) 
        }
        this.timings.__listeners.push( proxyFunctionTimings )
        this.timings.seq = this
        this.timings.nextTime = 0
        
        // add delay for timings pattern so that values updates first, this should help avoid glitches
        // in annotations. This delay is inserted in the _addPatternFilter function of codeMarkup.js. 
        this.timings.__delayAnnotations = true
      }
      

      const proxyFunctionValues = ( oldPattern, newPattern ) => {
        this.values = newPattern
        this.values.filters = oldPattern.filters.slice(0)
        newPattern.__listeners.push( proxyFunctionValues ) 
      }
      this.values.__listeners.push( proxyFunctionValues )

      this.values.nextTime = 0
      this.values.seq = this
    },

    externalMessages: {
      note( number, beat, trackID ) {
        // let msgstring = "add " + beat + " " + t + " " + n + " " + v + " " + d

        return `${trackID} add ${beat} note ${number}` 
      },
      midinote( number, beat, trackID ) {
        return `${trackID} add ${beat} note ${number}` 
      },
      duration( value, beat, trackID ) {
        return `${trackID} add ${beat} duration ${value}` 
      },

      velocity( value, beat, trackID ) {
        return `${trackID} add ${beat} velocity ${value}` 
      },

      chord( chord, beat, trackID ) {
        //console.log( chord )
        let msg = []

        for( let i = 0; i < chord.length; i++ ) {
          msg.push( `${trackID} add ${beat} note ${chord[i]}` )
        }

        return msg
      },
      midichord( chord, beat, trackID ) {
        //console.log( chord )
        let msg = []

        for( let i = 0; i < chord.length; i++ ) {
          msg.push( `${trackID} add ${beat} note ${chord[i]}` )
        }

        return msg
      },
      cc( number, value, beat ) {
        return `${trackID} add ${beat} cc ${number} ${value}`
      },
    },

    start() {
      if( this.running ) return
      this.running = true
      //console.log( 'starting with offset', this.offset ) 
      Gibber.Scheduler.addMessage( this, Big( this.offset ) )     
      
      return this
    },

    stop() {
      this.running = false
    },

    clear() {
      this.stop()

      if( this.timings !== undefined && typeof this.timings.clear === 'function' ) this.timings.clear()
      if( typeof this.values.clear  === 'function' ) this.values.clear()
    },
    
    delay( v ) { 
      this.offset = v
      return this
    },

    tick( scheduler, beat, beatOffset ) {
      if( !this.running ) return

      let _beatOffset = parseFloat( beatOffset.toFixed( 6 ) ),
          shouldExecute

      // if sequencer is not on autorun...
      if( this.timings !== undefined ) {
        this.timings.nextTime = _beatOffset
        // pick a new timing and schedule tick
        let nextTime = this.timings()
        
        if( typeof nextTime === 'function' )  nextTime = nextTime()

        if( typeof nextTime === 'object' ) {
          shouldExecute = nextTime.shouldExecute
          nextTime = nextTime.time
        }else{
          shouldExecute = true
        }

        let bigTime = Big( nextTime )

        scheduler.addMessage( this, bigTime, true, this.priority )
      }else{
        shouldExecute = true
      }

      if( shouldExecute ) {
        this.values.nextTime = _beatOffset
        this.values.beat = beat
        this.values.beatOffset = _beatOffset
        this.values.scheduler = scheduler

        let value = this.values()
        if( typeof value === 'function' ) value = value()
        if( value !== null ) {
          // delay messages  
          if( this.externalMessages[ this.key ] !== undefined ) {

            let msg = this.externalMessages[ this.key ]( value, beat + _beatOffset, this.trackID )
            scheduler.msgs.push( msg, this.priority )

            //Gibber.Communication.send( msg )

          } else { // schedule internal method / function call immediately
            if( this.object !== undefined && this.key !== undefined ) {
              if( typeof this.object[ this.key ] === 'function' ) {
                this.object[ this.key ]( value )
              }else{
                this.object[ this.key ] = value
              }
            }
          }

          if( this.key === 'note' || this.key === 'midinote' ) {
            if( Array.isArray( this.object.autorun ) ) {
              for( let seq of this.object.autorun ) {
                seq.tick( scheduler, beat, beatOffset )
              }
            }
          }

        }
      } 

      //console.log( 'beat', beat )
      //this.timings.nextTime = _beatOffset // for scheduling pattern updates
    },
    
  }

  proto.create = proto.create.bind( proto )
  proto.create.DO_NOT_OUTPUT = proto.DO_NOT_OUTPUT
  proto.create._seqs = proto._seqs
  proto.create.proto = proto

  return proto.create

}

module.exports = seqclosure
