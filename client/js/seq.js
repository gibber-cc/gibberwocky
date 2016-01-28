!function() {

var Queue = require( './priorityqueue.js' )

var seqclosure = function( Gibber ) {

  var proto = {
    create: function( _values, _timings, _key, _object ) {
      var seq = Object.create( this )

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
      /* TODO: if( ! this.values instanceof Gibber.Pattern ) */  this.values  = Gibber.Pattern.apply( null, this.values  )
      /* TODO: if( ! this.timings instanceof Gibber.Pattern ) */ this.timings = Gibber.Pattern.apply( null, this.timings ) 
    },

    start: function() {
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
      var value = this.values()
      
      // arguments is a max message, as space-delimited strings and numbers. t is timestamp within beat 0..1
      // var msgstring = "add " + beat + " " + t + " " + n + " " + v + " " + d
 
      // send that message to clock to be scheduled
      if( scheduler === -1 ) {

        if( this.object && this.key ) {
          this.object[ this.key ]( value )
        } else if ( typeof value === 'function' ) { // anonymous function
          value()
        }

      } else {
        if( typeof value === 'function' ) value = value()

        var msg = 'add ' + beat + ' ' +  beatOffset + ' ' + value 

        scheduler.msgs.push( msg )
      }

      // pick a new timing and schedule tick
      var nextTime = currentTime + this.timings()
      
      //Gibber.log( 'tick', currentTime, nextTime )
      
      Gibber.Scheduler.addMessage( this, nextTime )
    },
  }

  proto.create = proto.create.bind( proto )

  return proto.create

}

module.exports = seqclosure

}()
