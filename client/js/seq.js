!function() {

var Queue = require( './priorityqueue.js' )

var seqclosure = function( Gibber ) {

  var Seq = function( _values, _timings, _key ) {

    var seq = {
      phase: 0,
      running:false,
      queue: new Queue( function( a, b ) {
        return a.time - b.time
      }),   
      values: _values,
      timings: _timings,
      key: _key,
      nextTime: 0,
      start: function() {
        //console.log( this.values, this.timings )
        /* TODO: if( ! this.values instanceof Gibber.Pattern ) */  this.values = Gibber.Pattern.apply( null, this.values )
        /* TODO: if( ! this.timings instanceof Gibber.Pattern ) */ this.timings = Gibber.Pattern.apply( null, this.timings )      
        
        this.running = true
        this.tick( -1, -1, Gibber.Scheduler.phase, 0 )
        return this
      },
      tick : function( scheduler, beat, currentTime, beatOffset ) { // avoid this
        // console.log( 'TICK', beatOffset, beat )

        // pick a value and generate messages
        var value = seq.values()
                  
        // arguments is a max message, as space-delimited strings and numbers. t is timestamp within beat 0..1
        // var msgstring = "add " + beat + " " + t + " " + n + " " + v + " " + d
   
        // send that message to clock to be scheduled
        if( scheduler === -1 ) {
          Gibber.Communication.send( msg )
        } else {
          var msg = 'add ' + beat + ' '

          // TODO: do not use 22050 as number of samples in beat!!!
          msg += beatOffset
          msg += ' ' + value 
          scheduler.msgs.push( msg )
        }

        // pick a new timing and schedule tick
        var nextTime = currentTime + seq.timings()

        // console.log("NEXT", nextTime, value )
        
        Gibber.Scheduler.addMessage( seq.tick, nextTime )
      },
    } 

    return seq
  }

  return Seq

}

module.exports = seqclosure

}()
