let Utility = {
  elementArray: function( list ) {
    let out = []

    for( var i = 0; i < list.length; i++ ) {
      out.push( list.item( i ) )
    }

    return out
  },
  
  _classListMethods: [ 'toggle', 'add', 'remove' ],

  create( query ) {
    let elementList = document.querySelectorAll( query ),
        arr = Utility.elementArray( elementList )
    
    for( let method of Utility._classListMethods ) { 
      arr[ method ] = ( style ) => {
        for( let element of arr ) { 
          element.classList[ method ]( style )
        }
      } 
    }

    return arr
  },

  rndf( min=0, max=1, number, canRepeat=true ) {
    let out = 0
  	if( number === undefined ) {
  		let diff = max - min,
  		    r = Math.random(),
  		    rr = diff * r

  		out =  min + rr;
  	}else{
      let output = [],
  		    tmp = []

  		for( let i = 0; i < number; i++ ) {
  			let num
        if( canRepeat ) {
          num = Utility.rndf(min, max)
        }else{
          num = Utility.rndf( min, max )
          while( tmp.indexOf( num ) > -1) {
            num = Utility.rndf( min, max )
          }
          tmp.push( num )
        }
  			output.push( num )
  		}

  		out = output
  	}

    return out
  },

  Rndf( _min = 0, _max = 1, quantity, canRepeat=true ) {
    return function() {
      let value, min, max

      min = typeof _min === 'function' ? _min() : _min
      max = typeof _max === 'function' ? _max() : _max
  
      if( quantity === undefined ) {
        value = Utility.rndf( min, max )
      }else{
        value = Utility.rndf( min, max, quantity, canRepeat )
      }

      return value
    }
  },

  rndi( min = 0, max = 1, number, canRepeat = true ) {
    let range = max - min,
        out
    
    if( range < number ) canRepeat = true

    if( typeof number === 'undefined' ) {
      range = max - min
      out = Math.round( min + Math.random() * range );
    }else{
  		let output = [],
  		    tmp = []

  		for( let i = 0; i < number; i++ ) {
  			let num
  			if( canRepeat ) {
  				num = Utility.rndi( min, max )
  			}else{
  				num = Utility.rndi( min, max )
  				while( tmp.indexOf( num ) > -1 ) {
  					num = Utility.rndi( min, max )
  				}
  				tmp.push( num )
  			}
  			output.push( num )
  		}
  		out = output
    }
    return out
  },

  Rndi( _min = 0, _max = 1, quantity, canRepeat = true ) {
    let range = _max - _min
    if( typeof quantity === 'number' && range < quantity ) canRepeat = true

    return function() {
      let value = 0, min, max, range

      min = typeof _min === 'function' ? _min() : _min
      max = typeof _max === 'function' ? _max() : _max

      if( quantity === undefined ) {
        value = Utility.rndi( min, max )
      }else{
        value = Utility.rndi( min, max, quantity, canRepeat )
      }

      return value
    }
  },

  random() {
    this.randomFlag = true
    this.randomArgs = Array.prototype.slice.call( arguments, 0 )

    return this
  },

  shuffle : function( arr ) {
    for( let j, x, i = arr.length; i; j = parseInt(Math.random() * i), x = arr[--i], arr[i] = arr[j], arr[j] = x );
  },

  beatsToMs( beats, bpm=120 ) {
    const beatsPerSecond = bpm / 60

    return (beats / beatsPerSecond ) * 1000
  },

  future( func, time ) {
    let msg = {
      tick( scheduler, beat, beatOffset ) {
        func()
      }
    }

    Gibber.Scheduler.addMessage( msg, time )
  },

  export( destination ) {
    destination.rndf = Utility.rndf
    destination.rndi = Utility.rndi
    destination.Rndf = Utility.Rndf
    destination.Rndi = Utility.Rndi
    destination.future = Utility.future

    Array.prototype.random = Array.prototype.rnd = Utility.random
  }
}

module.exports = Utility
