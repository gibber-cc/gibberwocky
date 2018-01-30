const Queue = require( './priorityqueue.js' )

let Scheduler = {
  currentTime : performance.now(),
  queue: new Queue( ( a, b ) => a.time - b.time ),
  visualizationTime: {
    init:true,
    base:0,
    phase:0,
  },

  init() {
    window.requestAnimationFrame( this.onAnimationFrame ) 
  },

  clear() {
    this.queue.data.length = 0
  },
  
  add( func, offset, idx ) {
    let time = this.currentTime + offset
    this.queue.push({ func, time })

    return time
  },

  runSoon( evt ) {
    
    try{
      evt.func()
    }catch(e) {
      console.log( 'annotiation error:', e.toString() )
    }
  },

  run( timestamp, dt ) {
    let nextEvent = this.queue.peek()
    //if( nextEvent === undefined ) return

    if( nextEvent !== undefined && this.queue.length > 0 && nextEvent.time <= timestamp ) {

      // remove event
      this.queue.pop()
      
      setTimeout( ()=> this.runSoon( nextEvent ) ) 
      //try{
      //  nextEvent.func()
      //}catch( e ) {
      //  console.log( e )
      //  Gibber.Environment.error( 'annotation error:', e.toString() )
      //}
      
      // call recursively
      this.run( timestamp )
    }

    if( Gibber.Environment.codeMarkup.waveform.widgets.dirty === true ) {
      Gibber.Environment.codeMarkup.waveform.drawWidgets()
    }
  },

  onAnimationFrame( timestamp ) {
    window.requestAnimationFrame( this.onAnimationFrame )
    const diff = timestamp - this.currentTime
    this.currentTime = timestamp
    this.visualizationTime.phase += diff 

    this.run( timestamp, diff )    
  },

  updateVisualizationTime( ms ) {
    if( this.visualizationTime.init === true ) {
      this.visualizationTime.base += ms
      this.visualizationTime.phase = 0
    }else{
      this.visualizationTime.init = true 
    }
  },

}

Scheduler.onAnimationFrame = Scheduler.onAnimationFrame.bind( Scheduler )

module.exports = Scheduler
