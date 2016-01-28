'use strict';

var Queue = require( './priorityqueue.js' )

let seqclosure = function( Gibber ) {

  let proto = {
    create: function( _values, _timings, _key, _object ) {
      let seq = Object.create( this )

      Object.assign( seq, {
        phase: 0,
        running:false,
        queue: new Queue( function( a, b ) { return a.time - b.time }),   
        values: _values,
        timings: _timings,
        object: _object || null,
        key: _key,
        nextTime: 0,
      })
      
      seq.init()
      
      return seq
    },
    
    init: function() {
      if( !Array.isArray( this.values  ) ) this.values  = [ this.values ] 
      if( !Array.isArray( this.timings ) ) this.timings = [ this.timings ]

      /* TODO: if( ! this.values instanceof Gibber.Pattern )  */ this.values  = Gibber.Pattern.apply( null, this.values  )
      /* TODO: if( ! this.timings instanceof Gibber.Pattern ) */ this.timings = Gibber.Pattern.apply( null, this.timings ) 
    },

    externalMessages: {
      note: function( number, beat, beatOffset ) {
        // arguments is a max message, as space-delimited strings and numbers. t is timestamp within beat 0..1
        // let msgstring = "add " + beat + " " + t + " " + n + " " + v + " " + d

        let msg = 'add ' + beat + ' ' +  beatOffset + ' ' + number 

        return msg 
      }
    },

    start: function() {
      if( this.running ) return

      this.running = true
      this.tick( -1, -1, Gibber.Scheduler.phase, 0 )
      
      return this
    },

    stop: function() {
      this.running = false
    },

    tick : function( scheduler, beat, currentTime, beatOffset ) { // avoid this
      if( !this.running ) return

      // pick a value and generate messages
      let value = this.values
 
      // call method or anonymous function immediately
      if( scheduler === -1 ) {

        if( this.object && this.key ) {
          this.object[ this.key ]( value )
        } else if ( typeof value === 'function' ) { // anonymous function
          value()
        }

      } else if( this.externalMessages[ this.key ] !== undefined ) {

        if( typeof value === 'function' ) value = value()

        let msg = this.externalMessages[ this.key ]( value, beat, beatOffset )

        scheduler.msgs.push( msg )
      
      } else { // schedule internal method / function call

        if( this.object && this.key ) {

          if( typeof this.object[ this.key ] === 'function' ) {
            this.object[ this.key ]( value )
          }else{
            this.object[ this.key ] = value
          }

        } else {

          if( typeof value === 'function' ) { // anonymous function
            value()
          }

        }
      }

      // pick a new timing and schedule tick
      let nextTime = currentTime + this.timings()
      
      //Gibber.log( 'tick', currentTime, nextTime )
      
      Gibber.Scheduler.addMessage( this, nextTime )
    },
  }

  proto.create = proto.create.bind( proto )

  return proto.create

}

module.exports = seqclosure
