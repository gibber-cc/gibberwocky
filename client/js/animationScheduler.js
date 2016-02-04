const Queue = require( './priorityqueue.js' )

let Scheduler = {
  currentTime : null,
  queue: new Queue( function( a, b ) {
    return a.time - b.time
  }),

  init() {
    //this.currentTime = Performance.now()
    window.requestAnimationFrame( this.onAnimationFrame ) 
  },
  
  add( func, offset, idx ) {
    let time = this.currentTime + offset
    this.queue.push({ func, time })

    return time
  },

  run( timestamp ) {
    let nextEvent = this.queue.peek()
    //if( nextEvent ) console.log( nextEvent.time, timestamp )   
    if( this.queue.length && nextEvent.time <= timestamp ) {

      // remove event
      this.queue.pop()

      nextEvent.func()
      
      // call recursively
      this.run( timestamp )
    }
  },

  onAnimationFrame( timestamp ) {
    this.currentTime = timestamp

    this.run( timestamp )    

    window.requestAnimationFrame( this.onAnimationFrame )
  }

}

Scheduler.onAnimationFrame = Scheduler.onAnimationFrame.bind( Scheduler )

module.exports = Scheduler
