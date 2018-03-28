'use strict';

const Big = require( 'big.js' )

let seqclosure = function( Gibber ) {
  
  let Theory = Gibber.Theory

  let proto = {
    DO_NOT_OUTPUT: -987654321,
    _seqs: [],
    type: 'sequence',

    create( values, timings, key, object = null, priority=0, mode='live' ) {
      let seq = Object.create( this )

      if( values.isGen ) values  = Gibber.WavePattern( values )
      if( timings !== undefined && timings.isGen ) timings = Gibber.WavePattern( timings )

      if( mode === 'max' ) object.id = object.path

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
        octave:0,
        autorun:[],
        mode
      })

      seq.__client = object.__client

      seq.autorun.init = false

      if( typeof key === 'string' ) {
        if( key.indexOf( 'note' ) > -1 || key.indexOf( 'chord' ) > -1 ) {
          let __velocity = null 
          seq.velocity = v => {
            if( v !== undefined ) {
              __velocity = v
            }
            
            let output = __velocity
            if( output === null ) {
              let track = null
              while( track === null ) {
                track = seq.object
              }

              output = track.velocity()
            }
            return output
          }

          Gibber.addSequencingToMethod( seq, 'velocity', 1 )

          let __duration = null 
          seq.duration = v => {
            if( v !== undefined ) {
              __duration = v
            }
            let output = __duration
            if( output === null ) {
              let track = null
              while( track === null ) {
                track = seq.object
              }

              output = track.duration()
            }
            return output
          }

          Gibber.addSequencingToMethod( seq, 'duration', 1 )
        }
      }
      
      seq.init()

      proto._seqs.push( seq )
      
      return seq
    },

    __noteFilter( args ) {
      args[ 0 ] = Theory.Note.convertToMIDI( args[ 0 ] )
      if( this.octave !== 0 || this.object.octave() !== 0 ) {
        if( this.octave !== 0 )
          args[0] += this.octave * 12
        else
          args[0] += this.object.octave() * 12
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


      if( typeof this.key === 'string' ) {
        // only apply for 'note' messages, but need to check for longer keys due to 
        // max/msp addressing
        if( this.key.indexOf( 'midinote' ) === -1 && this.key.indexOf( 'note' ) > -1 ) {
          if( this.values.filters.findIndex( v => v.type === 'note' ) === -1 ) {
            // round the values for transformation to midinotes... XXX what about for Max version?
            this.values.filters.push( args => { 
              if( typeof args[0] !== 'string' ) args[0] = Math.round( args[0] )

              return args 
            })

            const noteFilter = this.__noteFilter.bind( this ) 
            noteFilter.type = 'note'
            this.values.filters.push( noteFilter )
          }
        } else if( this.key.indexOf( 'midichord' ) === -1 && this.key.indexOf( 'chord' ) > -1  ) {

          this.values.filters.push( args => {
            let chord = args[ 0 ], out

            if( typeof chord === 'string' ) {
              let chordObj = Gibber.Theory.Chord.create( chord )

              out = chordObj.notes 
            }else{
              if( typeof chord === 'function' ) chord = chord()
              out = chord.map( Gibber.Theory.Note.convertToMIDI )
              if( this.octave !== 0 || this.object.octave() !== 0 ) {
                out = this.octave !== 0 ? out.map( v => v + ( this.octave * 12 ) ) : out.map( v=> v + ( this.object.octave() * 12 ) )
              }
            }

            args[0] = out
            
            return args
          })
        }
      }
      
       //XXX implement per sequence velocity
      //if( this.key === 'note' || this.key === 'midinote' || this.key === 'chord' || this.key === 'midichord' ) {
      //  this.values.filters.push( args => {
      //    const velocity = this.velocity()
      //    if( velocity !== null ) {
      //      let msg = this.externalMessages[ 'velocity' ]( velocity, this.values.beat + this.values.beatOffset, this.trackID ) 
      //      this.values.scheduler.msgs.push( msg ) 
      //    }
      //    return args
      //  })
    
      //}

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
      note( number, beat, trackID, seq ) {
        const velocity = seq.velocity()
        const duration = seq.duration()

        let msg = ''
        if( seq.__client === 'max' ) {
          msg = `add ${beat} midinote ${trackID} ${number} ${velocity} ${duration}`        
        }else if( seq.__client === 'live' ){
          msg = `${trackID} add ${beat} note ${number} ${velocity} ${duration}` 
        }else{
          msg = [ 0x90 + seq.object.number, number, velocity ]
        }

        return msg 
      },

      midinote( number, beat, trackID, seq ) {
        const velocity = seq.velocity()
        const duration = seq.duration()

        let msg = ''
        if( seq.__client === 'max' ) {
          msg = `add ${beat} midinote ${trackID} ${number} ${velocity} ${duration}`        
        }else if( seq.__client === 'live' ){
          msg = `${trackID} add ${beat} note ${number} ${velocity} ${duration}` 
        }else{
          msg = [ 0x90 + seq.object.number, number, velocity ]
        }

        return msg 
      },
      //duration( value, beat, trackID ) {
      //  return `${trackID} add ${beat} duration ${value}` 
      //},

      //velocity( value, beat, trackID ) {
      //  return `${trackID} add ${beat} velocity ${value}` 
      //},

      chord( chord, beat, trackID, seq ) {
        //console.log( chord )
        let msgs = []

        const velocity = seq.velocity()
        const duration = seq.duration()

        for( let i = 0; i < chord.length; i++ ) {
          let msg = ''
          const number = chord[ i ]
          if( seq.__client === 'max' ) {
            msg = `add ${beat} midinote ${trackID} ${number} ${velocity} ${duration}`        
          }else if( seq.__client === 'live' ){
            msg = `${trackID} add ${beat} note ${number} ${velocity} ${duration}` 
          }else{
            msg = [ 0x90 + seq.object.number, number, velocity ]
          }
          msgs.push( msg )
        }

        return msgs
      },
      midichord( chord, beat, trackID, seq ) {
        //console.log( chord )
        let msgs = []
        const velocity = seq.velocity()
        const duration = seq.duration()

        for( let i = 0; i < chord.length; i++ ) {
          let msg = ''
          if( seq.__client === 'max' ) {
            msg = `add ${beat} midinote ${trackID} ${number} ${velocity} ${duration}`        
          }else if( seq.__client === 'live' ){
            msg = `${trackID} add ${beat} note ${number} ${velocity} ${duration}` 
          }else{
            msg = [ 0x90 + seq.object.number, number, velocity ]
          }
          msgs.push( msg )
        }

        return msgs
      },
      cc( number, value, beat, trackID, seq ) {
        let msg = ''
        if( seq.__client === 'max' ) {
          msg = `add ${beat} cc ${trackID} ${number} ${value}`        
        }else if( seq.__client === 'live' ){
          msg = `${trackID} add ${beat} cc ${number} ${value}` 
        }else{
          msg = [ 0xb0 + seq.object.number, number, value ]
        }
        console.log( 'cc msg:', msg, seq.__client )

        return msg 
      },
    },

    start() {
      if( this.running ) return
      this.running = true
      //console.log( 'starting with offset', this.offset ) 
      Gibber.Scheduler.addMessage( this, Big( this.offset ), true, this.priority, this.object.__client )     
      
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

    tick( scheduler, beat, beatOffset, priority=0 ) {
      if( !this.running ) return

      let _beatOffset = parseFloat( beatOffset.toFixed( 6 ) ),
          shouldExecute = false

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
            //Gibber.Communication.send( msg )
            if( this.autorun.init === true ) {
              if( this.key === 'note' || this.key === 'midinote' ) {
                if( this.object !== undefined && this.object !== null ) {
                  if( Array.isArray( this.object.autorun ) ) {
                    for( let seq of this.object.autorun ) {
                      seq.tick( scheduler, beat, beatOffset, 1 )
                    }
                  }
                }
                // for per sequence (i.e. tracks[0].note[0]) sequences,
                // primarily velocity (could also be duration)
                if( Array.isArray( this.autorun ) ) {
                  for( let seq of this.autorun ) {
                    seq.tick( scheduler, beat, beatOffset, 1 )
                  }
                }
              }
            }else{
              this.autorun.init = true
            }

            let msg = this.externalMessages[ this.key ]( value, beat + _beatOffset, this.trackID, this )

            if( this.__client !== 'midi' ) {
              scheduler.msgs.push( [msg, this.__client ])
            }else{
              if( this.key === 'note' || this.key === 'midinote' ) { 

                //this.externalMessages[ this.key ]( value, Gibber.Utility.beatsToMs( _beatOffset ) )
                Gibber.MIDI.send( msg, Gibber.Utility.beatsToMs( _beatOffset + 1, Gibber.Scheduler.bpm ),  true, this.duration() )
              }else{
                Gibber.MIDI.send( msg, Gibber.Utility.beatsToMs( _beatOffset + 1, Gibber.Scheduler.bpm ), false )
              }
            }
          
          } else { // schedule internal method / function call immediately

            if( this.object !== undefined && this.key !== undefined ) {
              if( typeof this.object[ this.key ] === 'function' ) {
                this.object[ this.key ]( value )
              }else{
                this.object[ this.key ] = value
              }
            }
          }
        }
      } 

      //console.log( 'beat', beat )
      //this.timings.nextTime = _beatOffset // for scheduling pattern updates
    },
    
  }

  // create external messages for cc0, cc1, cc2 etc.
  for( let i = 0; i < 128; i++ ) {
    proto.externalMessages[ 'cc' + i ] =  ( value, beat, trackID, seq ) => {
      let msg = ''
      let number = i

      if( seq.__client === 'max' ) {
        msg = `add ${beat} cc ${trackID} ${number} ${value}`        
      }else if( seq.__client === 'live' ){
        msg = `${trackID} add ${beat} cc ${number} ${value}` 
      }else{
        msg = [ 0xb0 + seq.object.number, number, value ]
      }
      
      return msg
    }
  }

  proto.create = proto.create.bind( proto )
  proto.create.DO_NOT_OUTPUT = proto.DO_NOT_OUTPUT
  proto.create._seqs = proto._seqs
  proto.create.proto = proto

  return proto.create

}

module.exports = seqclosure
