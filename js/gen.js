module.exports = function( Gibber ) {

const binops = [ 
  'min','max','add','sub','mul','div','rdiv','mod','rsub','rmod','absdiff',
  'and','or','gt','eq','eqp','gte','gtep','gtp','lt','lte','ltep','ltp','neq',
  'sah', 'step', 'rate'
]

const monops = [
  'abs','acos','acosh','asin','asinh','atan','atan2','atanh','cos','cosh','degrees',
  'fastcos','fastsin','fasttan','hypot','radians','sin','sinh','tan','tanh', 'floor',
  'ceil', 'sign', 'trunc', 'fract'
]

const noops = [
  'noise'
]

let Gen  = {
  init() {
    Gen.createBinopFunctions()
    Gen.createMonopFunctions()

    Gen.names.push( ...binops )
    Gen.names.push( ...monops )
    Gen.names.push( ...Object.keys( Gen.constants ) )
    Gen.names.push( ...Object.keys( Gen.functions ) )
    Gen.names.push( ...Object.keys( Gen.composites ) )
  },

  names:[],
  
  connected: [],

  isGen:true,
  debug:false,

  // if property is !== ugen (it's a number) a Param must be made using a default
  create( name ) {
    let obj = Object.create( this ),
        count = 0,
        params = Array.prototype.slice.call( arguments, 1 )
    
    obj.name = name
    obj.active = false
    
    for( let key of Gen.functions[ name ].properties ) { 

      let value = params[ count++ ]
      obj[ key ] = ( v ) => {
        if( v === undefined ) {
          return value
        }else{
          value = v
          if( obj.active ) {
            //console.log( `${obj.track} genp ${obj.paramID} ${obj[ key ].uid} ${v}` )
            Gibber.Communication.send( `genp ${obj.paramID} ${obj[ key ].uid} ${v}` ) 
          }
        }
      }
      obj[ key ].uid = Gen.getUID()

      Gibber.addSequencingToMethod( obj, key )
    }

    return obj
  },
  
  createBinopFunctions() {
    for( let key of binops ) {
      Gen.functions[ key ] = {
        properties:['0','1'], str:key
      }
    }
  },

  createMonopFunctions() {
    for( let key of monops ) {
      Gen.functions[ key ] = {
        properties:['0'], str:key
      }
    }
  },

  assignTrackAndParamID: function( track, id ) {
    this.paramID = id
    this.track = track

    let count = 0, param
    while( param = this[ count++ ] ) {
      if( typeof param() === 'object' ) {
        param().assignTrackAndParamID( track, id )
      }
    }
  },

  clear() {
    for( let ugen of Gen.connected ) {
      Gibber.Communication.send( `ungen ${ugen.paramID}` )
    }

    Gen.connected.length = 0
  },

  constants: {
    degtorad: Math.PI / 180,
    E :       Math.E,
    halfpi:   Math.PI / 2,
    invpi :   Math.PI * - 1,
    ln10  :   Math.LN10,
    ln2   :   Math.LN2,
    log10e:   Math.LOG10E,
    log2e :   Math.LOG2E,
    pi    :   Math.PI,  
    sqrt2 :   Math.SQRT2,
    sqrt1_2:  Math.SQRT1_2,
    twopi :   Math.PI * 2,
    time  :   'time',
    samplerate: 'samplerate'
  },

  functions: {
    phasor: { properties:[ '0' ],  str:'phasor' },
    cycle:  { properties:[ '0' ],  str:'cycle' },
    rate:   { properties:[ '0','1' ], str:'rate' },
    noise:  { properties:[], str:'noise' },
    accum:  { properties:[ '0','1' ], str:'accum' },
    scale:  { properties: ['0', '1', '2', '3'], str:'scale' }
  },

  _count: 0,

  getUID() {
    return 'p' + Gen._count++
  },

  time: 'time',

  out() {
    let paramArray = [],
        body, out
    
    body = this.gen( paramArray )

    out = paramArray.join( ';' )

    if( paramArray.length ) {
      out += ';'
    }
    
    out += 'out1='
    out += body + ';'
    
    if( Gen.debug ) console.log( out )

    return out
  },

  gen( paramArray ) {
    let def = Gen.functions[ this.name ],
        str = def.str + '(',
        count = 0
    

    // tell Gibber that this gen object is part of an active gen graph
    // so that changes to it are forwarded to m4l
    this.active = true

    for( let property of def.properties ) {
      let p = this[ property ](),
          uid = this[ property ].uid
      
      //console.log( this.name, property, def.properties, uid )
      if( Gen.isPrototypeOf( p ) ) {
        str += p.gen( paramArray )
      }else if( typeof p === 'number' ) {
        let pName = uid
        str += pName
        paramArray.push( `Param ${pName}(${p})` )
      }else if( p === Gen.time ) {
        str += p
      }else if( typeof p === 'string' ) {
        str += p
      }else{
        console.log( 'CODEGEN ERROR:', p )
      }

      if( count++ < def.properties.length - 1 ) str += ','
    }
    str += ')'

    return str
  },

  composites: { 
    lfo( frequency = .1, amp = .5, center = .5 ) {
      let _cycle = cycle( frequency ),
          _mul   = mul( _cycle, amp ),
          _add   = add( center, _mul ) 
       
      _add.frequency = (v) => {
        if( v === undefined ) {
          return _cycle[ 0 ]()
        }else{
          _cycle[0]( v )
        }
      }

      _add.amp = (v) => {
        if( v === undefined ) {
          return _mul[ 1 ]()
        }else{
          _mul[1]( v )
        }
      }

      _add.center = (v) => {
        if( v === undefined ) {
          return _add[ 0 ]()
        }else{
          _add[0]( v )
        }
      }

      Gibber.addSequencingToMethod( _add, 'frequency' )
      Gibber.addSequencingToMethod( _add, 'amp' )
      Gibber.addSequencingToMethod( _add, 'center' )

      return _add
    },

    fade( time = 1, from = 1, to = 0 ) {
      let fade, amt, beatsInSeconds = time * ( 60 / Gibber.Live.LOM.bpm )
     
      if( from > to ) {
        amt = from - to

        fade = gtp( sub( from, accum( div( amt, mul(beatsInSeconds, samplerate ) ), 0 ) ), to )
      }else{
        amt = to - from
        fade = add( from, ltp( accum( div( amt, mul( beatsInSeconds, samplerate ) ), 0 ), to ) )
      }
      
      // XXX should this be available in ms? msToBeats()?
      let numbeats = time / 4
      fade.shouldKill = {
        after: numbeats, 
        final: to
      }
      
      return fade
    },
    
    beats( num ) {
      return rate( 'in1', num )
      // beat( n ) => rate(in1, n)
      // final string should be rate( in1, num )
    }
  },

  export( obj ) {
    for( let key in Gen.functions ) {
      obj[ key ] = Gen.create.bind( Gen, key )
    }

    Object.assign( obj, Gen.constants )
    Object.assign( obj, Gen.composites )
  }
}

Gen.init()

return Gen 

}


/*

a = LFO( .5, .25, .5 )
// lfo has frequency, amplitude and bias

->

// every array indicates presence of new ugen
a.graph = [ 'add', 'bias', [ 'mul', 'amp', [ 'cycle', 'frequency' ] ] ]
*/
