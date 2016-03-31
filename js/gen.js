module.exports = function( Gibber ) {

const binops = [ 
  'min','max','add','sub','mul','div','rdiv','mod','rsub','rmod','absdiff',
  'and','or','gt','eq','eqp','gte','gtep','gtp','lt','lte','ltep','ltp','neq',
  'step'
]

const monops = [
  'abs','acos','acosh','asin','asinh','atan','atan2','atanh','cos','cosh','degrees',
  'fastcos','fastsin','fasttan','hypot','radians','sin','sinh','tan','tanh'
]

const noops = [
  'noise'
]

let Gen  = {
  init() {
    Gen.createBinopFunctions()
    Gen.createMonopFunctions()
  },

  // if property is !== ugen (it's a number) a Param must be made using a default
  create( name ) {
    let obj = Object.create( this ),
        count = 0,
        params = Array.prototype.slice.call( arguments, 1 )
    
    obj.name = name
    
    for( let key of Gen.functions[ name ].properties ) { 
      let prop = { 
        value: params[ count++ ], 
        valueOf: ()=> { return prop.value },
      }

      obj[ key ] = prop //params[ count++ ]

      Object.defineProperty( obj, key, {
        get: ()=> prop,
        set: (v)=> prop.value = v
      })

      Gibber.addSequencingToMethod( obj, key )
    }

    return obj
  },
  
  createBinopFunctions() {
    for( let key of binops ) {
      Gen.functions[ key ] = {
        properties:['in1','in2'], str:key
      }
    }
  },

  createMonopFunctions() {
    for( let key of monops ) {
      Gen.functions[ key ] = {
        properties:['in1'], str:key
      }
    }
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
    time  :   'time'
  },

  functions: {
    phasor: { properties:[ 'frequency' ],  str:'phasor' },
    cycle:  { properties:[ 'frequency' ],  str:'cycle' },
  },

  _count: 0,

  getUID() {
    return Gen._count++
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

    return out
  },

  gen( paramArray ) {
    let def = Gen.functions[ this.name ],
        str = def.str + '(',
        count = 0

    for( let property of def.properties ) {
      let p = this[ property ].value
      if( Gen.isPrototypeOf( p ) ) {
        str += p.gen( paramArray )
      }else if( typeof p === 'number' ) {
        let pName = 'p' + Gen.getUID()
        str += pName
        paramArray.push( `Param ${pName}=${p}` )
      }else if( p === Gen.time ) {
        str += p
      }else{
        console.log( 'CODEGEN ERROR:', p )
      }

      if( count++ < def.properties.length - 1 ) str += ','
    }
    str += ')'

    return str
  },

  export( obj ) {
    for( let key in Gen.functions ) {
      obj[ key ] = Gen.create.bind( Gen, key )
    }

    Object.assign( obj, Gen.constants )
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
