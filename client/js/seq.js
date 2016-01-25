!function() {

var Seq = function( _values, _timing, _object, _key ) {

  var seq = {
    phase: 0,
    running:false,
    msgs: [],
    values: _values,
    timings: _timings,
    object: _object,
    key: _key,
    nextTime: 0,
    start: function( Gibber ) {
      if( ! this.values instanceof Pattern )  this.values = Pattern( this.values )
      if( ! this.timings instanceof Pattern ) this.timings = Pattern( this.timings )
      
      
      this.running = true
      this.tick( 0 )
    },
    tick : function( offset ) {
      // pick a value and generate messages
      var value = this.values(),
          msg   = this.key + ' ' + value
        
      // send that message to clock to be scheduled
      if( offset !== 0 ) 
        Gibber.Clock.addMessage( msg, offset )
      else
        Gibber.Communication.send( msg )

      // pick a new timing / nextTIme value
      this.nextTime = this.timings()


    },
    advance : function( advanceAmount ) {
      var end = this.phase + advanceAmount,
          nextMsg = this.msgs[ 0 ]
       
    // scheduleMessage will handle all messages recursively until end time
      if( nextMsg.time < end )
        this.scheduleMessage( nextMsg, end )

      this.phase += advanceAmount
    },
    scheduleMessage: function( msg, endTime ) {
      if( msg.time < endTime ) {
        // add message
        // TODO must account for function execution vs output NO JUST EXECUTES FUNCTIONS WITH TIMING INFO?
        //  Gibber.Clock.addMessage(
        // this.note.seq( [44,46,48,52], 1/4 )
        // /*
        //   
        // remove message
        this.msgs.splice( 0,1 )
        
        var nextMsg = this.msgs[ 0 ]
        if( nextMsg.time < endTime ) this.scheduleMessage( nextMsg, endTime )
      }else{
        if( this.msgs.length > 0 )  this.outputMessages()
      }
  
    },
    addMessage: function( _msg, _time ) {
      this.msgs.push({ msg:_msg, time:_time })
    },
    removeMessage: function( msg ) {
      var idx = this.msgs.indexOf( msg )
  
      if( idx > -1 )
        this.msgs.splice( idx, 1 )
    },

  } 

  return Seq
}

module.exports = Seq

}()
