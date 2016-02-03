let Scheduler = {
  updates: [],

  init() {
    window.requestAnimationFrame( this.onAnimationFrame ) 
  },

  onAnimationFrame() {
    for( let func of this.updates ) {
      func()
    }
    
    this.updates.length = 0

    window.requestAnimationFrame( this.onAnimationFrame )
  }

}

Scheduler.onAnimationFrame = Scheduler.onAnimationFrame.bind( Scheduler )

module.exports = Scheduler
