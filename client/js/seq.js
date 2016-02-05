'use strict';

let seqclosure = function( Gibber ) {

  let proto = {
    create( _values, _timings, _key, _object = null ) {
      let seq = Object.create( this )

      Object.assign( seq, {
        phase:   0,
        running: false,
        values:  _values,
        timings: _timings,
        object:  _object,
        key:     _key,
      })
      
      seq.init()
      
      return seq
    },
    
    init() {
      if( !Array.isArray( this.values ) ) this.values  = [ this.values ] 
      if( this.timings !== undefined && !Array.isArray( this.timings ) ) this.timings = [ this.timings ]
      
      let valuesPattern = Gibber.Pattern.apply( null, this.values ),
          timingsPattern = Gibber.Pattern.apply( null, this.timings )

      if( this.values.randomFlag ) {
        valuesPattern.filters.push( () => {
          var idx = Gibber.Utility.rndi( 0, valuesPattern.values.length - 1 )
          return [ valuesPattern.values[ idx ], 1, idx ] 
        })
        for( var i = 0; i < this.values.randomArgs.length; i+=2 ) {
          valuesPattern.repeat( this.values.randomArgs[ i ], this.values.randomArgs[ i + 1 ] )
        }
      }

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
        
        // timingsPattern.seq = obj.seq
      }

      this.values = valuesPattern
      this.timings = timingsPattern
      this.values.nextTime = this.timings.nextTime = 0
    },

    externalMessages: {
      note( number, beat, beatOffset ) {
        // arguments is a max message, as space-delimited strings and numbers. t is timestamp within beat 0..1
        // let msgstring = "add " + beat + " " + t + " " + n + " " + v + " " + d

        return 'add ' + beat + ' ' +  beatOffset + ' ' + number 
      }
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

    tick( scheduler, beat, beatOffset, tickAbsoluteTime ) {
      if( !this.running ) return
      
      let value = null

      this.values.nextTime = this.timings.nextTime = beatOffset // for scheduling pattern updates

      /*
       *if( beatOffset <= this.lastBeatOffset && beat === this.lastBeat ) { this.values.nextTime = this.timings.nextTime += .25 }
       *this.lastBeatOffset = beatOffset
       *this.lastBeat = beat
       */

      // call method or anonymous function immediately
      if( this.externalMessages[ this.key ] !== undefined ) {
        
        value = this.values()
        if( typeof value === 'function' ) value = value()

        let msg = this.externalMessages[ this.key ]( value, beat, beatOffset )

        scheduler.msgs.push( msg )
      
      } else { // schedule internal method / function call
        
        value = this.values()
        if( typeof value === 'function' ) {
          value = value() // also executes anonymous functions
        }

        if( this.object && this.key ) {
          
          if( typeof this.object[ this.key ] === 'function' ) {
            this.object[ this.key ]( value )
          }else{
            this.object[ this.key ] = value
          }

        }
      }

      // pick a new timing and schedule tick
      let nextTime = this.timings()

      if( typeof nextTime === 'function' ) nextTime = nextTime()

      Gibber.Scheduler.addMessage( this, nextTime )
    },
  }

  proto.create = proto.create.bind( proto )

  return proto.create

}

module.exports = seqclosure
