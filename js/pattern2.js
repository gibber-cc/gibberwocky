module.exports = function( Gibber ) {

"use strict"

let PatternPrototype = Object.create( Function )

Object.assign( PatternPrototype, {
  concat( _pattern ) { this.values = this.values.concat( _pattern.values ) },  
  toString() { return this.values.toString() },
  valueOf() { return this.values },

  getLength() {
    let l
    if( this.start <= this.end ) {
      l = this.end - this.start + 1
    }else{
      l = this.values.length + this.end - this.start + 1
    }
    return l
  },

  runFilters( val, idx ) {
    let args = [ val, 1, idx ] // 1 is phaseModifier

    for( let filter of this.filters ) {
      args = filter( args, this ) 
    }

    return args
  },

  checkForUpdateFunction( name, ...args ) {
    if( this.listeners[ name ] ) {
      this.listeners[ name ].apply( this, args )
    }else if( Pattern.listeners[ name ] ) {
      Pattern.listeners[ name ].apply( this, args )
    }
  },
  range() {
    let start, end
    
    if( Array.isArray( arguments[0] ) ) {
      start = arguments[0][0]
      end   = arguments[0][1]
    }else{
      start = arguments[0]
      end   = arguments[1]
    }
    
    if( start < end ) {
      this.start = start
      this.end = end
    }else{
      this.start = end
      this.end = start
    }

    this.checkForUpdateFunction( 'range', [ pattern ] )

    return this
  },
  
  set() {
    let args = Array.isArray( arguments[ 0 ] ) ? arguments[ 0 ] : arguments
    
    this.values.length = 0
    
    for( let i = 0; i < args.length; i++ ) {
      this.values.push( args[ i ] )
    }
    
    this.end = this.values.length - 1
    
    // if( pattern.end > pattern.values.length - 1 ) {
    //   pattern.end = pattern.values.length - 1
    // }else if( pattern.end < )
    
    this._onchange()
    
    return this
  },
   
  reverse() { 
    //pattern.values.reverse(); 
    let array = this.values,
        left = null,
        right = null,
        length = array.length,
        temporary;
        
    for ( left = 0, right = length - 1; left < right; left += 1, right -= 1 ) {
      temporary = array[ left ]
      array[ left ] = array[ right ]
      array[ right ] = temporary;
    }
    
    this._onchange() 
    
    return this
  },
  // humanize: function( randomMin, randomMax ) {
 //     let lastAmt = 0
 //
 //     for( let i = 0; i < this.filters.length; i++ ) {
 //       if( this.filters[ i ].humanize ) {
 //         lastAmt = this.filters[ i ].lastAmt
 //         this.filters.splice( i, 1 )
 //         break;
 //       }
 //     }
 //
 //     let filter = function( args ) {
 //       console.log( filter.lastAmt, args[0])
 //       args[ 0 ] -= filter.lastAmt
 //       filter.lastAmt = Gibber.Clock.time( Gibber.Utilities.rndi( randomMin, randomMax ) )
 //
 //       console.log( "LA", filter.lastAmt )
 //       args[0] += filter.lastAmt
 //
 //       return args
 //     }
 //     filter.lastAmt = lastAmt
 //     filter.humanize = true
 //
 //     this.filters.push( filter )
 //
 //     return this
 //   },
  repeat() {
    let counts = {}
  
    for( let i = 0; i < arguments.length; i +=2 ) {
      counts[ arguments[ i ] ] = {
        phase: 0,
        target: arguments[ i + 1 ]
      }
    }
    
    let repeating = false, repeatValue = null, repeatIndex = null
    let filter = function( args ) {
      let value = args[ 0 ], phaseModifier = args[ 1 ], output = args
      
      //console.log( args, counts )
      if( repeating === false && counts[ value ] ) {
        repeating = true
        repeatValue = value
        repeatIndex = args[2]
      }
      
      if( repeating === true ) {
        if( counts[ repeatValue ].phase !== counts[ repeatValue ].target ) {
          output[ 0 ] = repeatValue            
          output[ 1 ] = 0
          output[ 2 ] = repeatIndex
          //[ val, 1, idx ]
          counts[ repeatValue ].phase++
        }else{
          counts[ repeatValue ].phase = 0
          output[ 1 ] = 1
          if( value !== repeatValue ) { 
            repeating = false
          }else{
            counts[ repeatValue ].phase++
          }
        }
      }
    
      return output
    }
  
    this.filters.push( filter )
  
    return this
  },
  
  reset() { this.values = this.original.slice( 0 ); this._onchange(); return this; },
  store() { this.storage[ this.storage.length ] = this.values.slice( 0 ); return this; },

  transpose( amt ) { 
    for( let i = 0; i < this.values.length; i++ ) { 
      let val = this.values[ i ]
      
      if( Array.isArray( val ) ) {
        for( let j = 0; j < val.length; j++ ) {
          if( typeof val[ j ] === 'number' ) {
            val[ j ] = this.integersOnly ? Math.round( val[ j ] + amt ) : val[ j ] + amt
          }
        }
      }else{
        if( typeof val === 'number' ) {
          this.values[ i ] = this.integersOnly ? Math.round( this.values[ i ] + amt ) : this.values[ i ] + amt
        }
      }
    }
    
    this._onchange()
    
    return this
  },

  shuffle() { 
    Gibber.Utilities.shuffle( this.values )
    this._onchange()
    
    return this
  },

  scale( amt ) { 
    this.values.map( (val, idx, array) => {
      if( Array.isArray( val ) ) {
        array[ idx ] = val.map( inside  => {
          if( typeof inside === 'number' ) {
            return this.integersOnly ? Math.round( inside * amt ) : inside * amt
          } else {
            return inside
          }
        })
      }else{
        if( typeof val === 'number' ) {
          array[ idx ] = this.integersOnly ? Math.round( val * amt ) : val * amt
        }
      }
    })

    this._onchange()
    
    return this
  },

  flip() {
    let start = [],
        ordered = null
  
    ordered = this.values.filter( function(elem) {
    	let shouldPush = start.indexOf( elem ) === -1
      if( shouldPush ) start.push( elem )
      return shouldPush
    })
  
    ordered = ordered.sort( function( a,b ){ return a - b } )
  
    for( let i = 0; i < this.values.length; i++ ) {
      let pos = ordered.indexOf( this.values[ i ] )
      this.values[ i ] = ordered[ ordered.length - pos - 1 ]
    }
    
    this._onchange()
  
  	return pattern
  },
  
  invert() {
    let prime0 = pattern.values[ 0 ]
    
    for( let i = 1; i < this.values.length; i++ ) {
      if( typeof this.values[ i ] === 'number' ) {
        let inverse = prime0 + (prime0 - this.values[ i ])
        this.values[ i ] = inverse
      }
    }
    
    this._onchange()
    
  	return this
  },
  
  switch( to ) {
    if( this.storage[ to ] ) {
      this.values = this.storage[ to ].slice( 0 )
    }
    
    this._onchange()
    
    return this
  },
  
  rotate( amt ) {
    if( amt > 0 ) {
      while( amt > 0 ) {
        let end = this.values.pop()
        this.values.unshift( end )
        amt--
      }
    }else if( amt < 0 ) {
      while( amt < 0 ) {
        let begin = this.values.shift()
        this.values.push( begin )
        amt++
      }
    }
    
    this._onchange()
    
    return this
  },



  // used when _onchange has not been assigned to individual patterns
  _onchange() {},
})

let methodNames =  [
  'rotate','switch','invert','reset', 'flip',
  'transpose','reverse','shuffle','scale',
  'store', 'range', 'set'
]
 
for( let key of methodNames ) { Gibber.addSequencingToProtoMethod( PatternPrototype, key ) }

let Pattern = function( ...args ) {
  /*
   *if( ! ( this instanceof Pattern ) ) {
   *  let args = Array.prototype.slice.call( arguments, 0 )
   *  return Gibber.construct( Pattern, args )
   *}
   */

  let pattern = function _pattern() {
    let len = _pattern.getLength(),
        idx, val, args
    
    if( len === 1 ) { 
      idx = 0 
    }else{
      idx = _pattern.phase > -1 ? Math.floor( _pattern.start + ( _pattern.phase % len ) ) : Math.floor( _pattern.end + (_pattern.phase % len ) )
    }
    
    val = _pattern.values[ Math.floor( idx % _pattern.values.length ) ]
    args = _pattern.runFilters( val, idx )
    
    _pattern.phase += _pattern.stepSize * args[ 1 ]
    val = args[ 0 ]
    
    // check to see if value is a function, and if so evaluate it
    if( typeof val === 'function' ) {
      val = val()
    }
    /*else if ( Array.isArray( val ) ) {
      // if val is an Array, loop through array and evaluate any functions found there. TODO: IS THIS SMART?

      for( let i = 0; i < val.length; i++ ){
        if( typeof val[ i ] === 'function' ) {
          val[ i ] = val[ i ]()
        }
      }
    }
    */

    // if pattern has update function, set new value
    if( _pattern.update ) _pattern.update.value = val
    return val
  }
   
  Object.assign( pattern, {
    start : 0,
    end   : 0,
    phase : 0,
    values : args, 
    //values : typeof arguments[0] !== 'string' || arguments.length > 1 ? Array.prototype.slice.call( arguments, 0 ) : arguments[0].split(''),    
    original : null,
    storage : [],
    stepSize : 1,
    integersOnly : false,
    filters : [],
    onchange : null,

  })
  
  //pattern.retrograde = pattern.reverse.bind( pattern )
  
  pattern.end = pattern.values.length - 1
  
  pattern.original = pattern.values.slice( 0 )
  pattern.storage[ 0 ] = pattern.original.slice( 0 )
  
  pattern.integersOnly = pattern.values.every( function( n ) { return n === +n && n === (n|0); })
  

  
  // for( let i = 0; i < methodNames.length; i++ ) {
  //  let name = methodNames[ i ]
  //
  //  pattern[ name ].listeners = {}
  //  }
  pattern.listeners = {}
  // pattern.sequences = {}

  // TODO: Gibber.createProxyProperties( pattern, { 'stepSize':0, 'start':0, 'end':0 })
  
  // it isn't ideal to overwrite the __proto__ function, but there aren't really other options
  // for changing the prototype of functions in js...
  pattern.__proto__ = PatternPrototype 
  
  return pattern
}

Pattern.listeners = {}

return Pattern

}
