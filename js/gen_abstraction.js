/* gen_abstraction.js
 *
 * This object serves as an asbtraction between the codegen for Gen and
 * the use of genish.js. In gibberwocky, Gen code is sent to Live/Max for
 * modulation purposes while genish.js is used to create waveforms that can
 * be sampled for pattern generation.
 *
 * This abstraction delays interpretation of the Gen(ish) graphs until 
 * one of the following two events occurs:
 *
 * 1. The graph is assigned to a property. This means that the graph
 * should be interpreted as a Gen graph.
 *
 * 2. The graph is used to create a WavePattern. This means that the
 * graph should be interpreted as a genish graph.
 *
 * One open problem: what if the same graph is used in two places? Can
 * the abstraction hold both types of codegen objects inside of it? Currently
 * the abstraction only holds one graph in its 'rendered' property... perhaps
 * this could be chagned to 'genRendered' and 'genishRendered' and then the 
 * appropriate one could be linked to? What happens when multiple wavepatterns
 * use the same graph? Does each generated a dot for every s&h value??
 */

const genish = require( 'genish.js' )
const genreq = require( './gen.js' )

/*  
assignInputProperties( genishGraph, abstractGraph ) {
  for( let input in abstractGraph.inputs ) {
    if( typeof abstractGraph.inputs[ input ] === 'number' ) {
      let __param = genishGraph.inputs[ input ] = genish.param( abstractGraph.inputs[ input ] )
      abstractGraph[ input ] = v => {
        __param.value = v
      }
    }
  }
},
*/

const defineMethod = function( obj, methodName, param, priority=0 ) {
  obj[ methodName ] = v => {
    if( v === undefined ) return param.value
    
    // else, set the value
    param.value = v
  }
  
  if( !obj.sequences ) obj.sequences = {}

  obj[ methodName ].seq = function( values, timings, id=0, delay=0 ) {
    if( obj.sequences[ methodName ] === undefined ) obj.sequences[ methodName ] = []

    if( obj.sequences[ methodName ][ id ] !== undefined ) obj.sequences[ methodName ][ id ].clear()

    const seq = Gibber.Seq( values, timings, methodName, obj, priority )
    obj.sequences[ methodName ][ id ] = seq 

    seq.__tick = seq.tick
    seq.tick = function( ...args ) {
      param.value = 0 
      for( let i = 0; i < obj.patterns.length; i++ ) {
        let pattern = obj.patterns[ i ]
        let graph   = obj.graphs[ i ]
        pattern.adjust( graph, Gibber.Scheduler.currentTimeInMs - pattern.phase )  
      }
      seq.__tick.apply( seq, args )
    }

    seq.trackID = obj.id

    if( id === 0 ) {
      obj[ methodName ].values  = obj.sequences[ methodName ][ 0 ].values
      obj[ methodName ].timings = obj.sequences[ methodName ][ 0 ].timings
    }

    obj[ methodName ][ id ] = seq

    seq.delay( delay )
    seq.start()

    // avoid this for gibber objects that don't communicate with Live such as Scale
    if( obj.id !== undefined ) Gibber.Communication.send( `select_track ${obj.id}` )

    return seq
  }
    
  obj[ methodName ].seq.delay = v => obj[ methodName ][ lastId ].delay( v )

  obj[ methodName ].seq.stop = function() {
    obj.sequences[ methodName ][ 0 ].stop()
    return obj
  }

  obj[ methodName ].seq.start = function() {
    obj.sequences[ methodName ][ 0 ].start()
    return obj
  }
}

module.exports = function( Gibber ) {
  const gen = genreq( Gibber )
  const genfunctions = {}

  gen.export( genfunctions )

  const __ugenproto__ = {
    render( mode ) {
      let inputs = [], inputNum = 0

      this.mode = mode

      if( this.name === 'phasor' ) {
        if( this.inputs[2] === undefined ) {
          this.inputs[2] = { min:0 }
        }
      }

      for( let input of this.inputs ) {
        // use input.render as check to make sure this isn't a properties dictionary
        if( typeof input === 'object' && input.render !== undefined ) {
          inputs.push( input.render( mode ) )
        }else{
          if( mode === 'genish' && typeof input === 'number' ) { // replace numbers with params
            let _input =  genish.param( input )
            defineMethod( this, inputNum, _input )
            inputs.push( _input )
          }else{
            inputs.push( input )
          }
        }

        inputNum++
      }

      let ugen
      if( mode === 'genish' || __gen.enabled === false ) {
        ugen = genish[ this.name ]( ...inputs ) 
      }else{
        ugen = genfunctions[ this.name ]( ...inputs )
      }

      this.rendered = ugen
      this.rendered.paramID = this.paramID
      this.rendered.track = this.track

      if( typeof this.__onrender === 'function' ) { this.__onrender() }

      return ugen
    },

    isGen:true,
  }

  const __gen = {
    __hasGen: true, // is Gen licensed on this machine? true by default
    gen,
    genish,
    Gibber,
    enabled: true,
    initialized: false,
    __waveObjects: require( './waveObjects.js' ),
    waveObjects:null,
    ugenNames: [
      'cycle','phasor','accum','counter',
      'add','mul','div','sub',
      'sah','noise',
      'beats', 'lfo', 'fade', 'sine', 'siner', 'cos', 'cosr', 'liner', 'line',
      'abs', 'ceil', 'round', 'floor',
      'min','max',
      'gt','lt','ltp','gtp','samplerate','rate','clamp',
      'ternary', 'selector'
    ],
    ugens:{},
  
    // determine whether or not gen is licensed
    checkForLicense() {
      const volume = Gibber.Live.tracks[0].volume()
      __gen.enabled = true
      const lfo = __gen.ugens.lfo( .25 )
      Gibber.Live.tracks[0].volume( lfo )
      setTimeout( ()=> {
        Gibber.clear()
        setTimeout( ()=> {
          Gibber.Live.tracks[0].volume( volume )
          Gibber.Environment.suppressErrors = false
        }, 50 )
      }, 250 * 8 )

    },
 
    assignTrackAndParamID: function( track, id ) {
      this.paramID = id
      this.track = track

      let count = 0, param
      //while( param = this[ count++ ] ) {
      //  if( typeof param() === 'object' ) {
      //    param().assignTrackAndParamID( track, id )
      //  }
      //}
    },

    init() {
      genish.gen.memory = genish.gen.createMemory( 88200, Float64Array )
      const btof = Gibber.Utility.beatsToFrequency 

      Gibber.subscribe( 'lom_update', ()=> {
        if( __gen.initialized === false ) {
          __gen.checkForLicense()
          __gen.initialized = true
        }
      })

      Gibber.Environment.suppressErrors = true

      for( let name of this.ugenNames ) {
        this.ugens[ name ] = function( ...inputs ) {
          const ugen = Object.create( __ugenproto__ )

          ugen.name = name
          ugen.inputs = inputs

          for( let i = 0; i < inputs.length; i++ ) {
            ugen[ i ] = v => {
              if( ugen.rendered !== undefined ) {
                return ugen.rendered[ i ]( v )
              }
            }
            Gibber.addSequencingToMethod( ugen, i )
          }

          return ugen
        }
      }

      this.waveObjects = this.__waveObjects( Gibber, this, __ugenproto__ )
      Object.assign( this.ugens, this.waveObjects )

      genish.lfo = ( frequency = .1, center = .5, amp = .25 ) => {
        const g = this.ugens//genish
        //console.log( 'lfo', g )

        let _cycle = g.cycle( frequency ),
            _mul   = g.mul( _cycle, amp ),
            _add   = g.add( center, _mul ) 
         
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
      }

      //genish.fade = function( beats=43, from = 0, to = 1 ) {
      //  const g = this.ugens//__gen.ugens 
      //  let fade, amt, beatsInSeconds = Gibber.Utility.beatsToFrequency( beats, 120 )
       
      //  if( from > to ) {
      //    amt = from - to

      //    fade = g.gtp( g.sub( from, g.accum( g.div( amt, g.mul(beatsInSeconds, g.samplerate ) ), 0 ) ), to )
      //  }else{
      //    console.log( 'fading in' )
      //    amt = to - from
      //    fade = g.add( from, g.ltp( g.accum( g.div( amt, g.mul( beatsInSeconds, g.samplerate ) ), 0 ), to ) )
      //  }
        
      //  // XXX should this be available in ms? msToBeats()?
      //  fade.shouldKill = {
      //    after: beats, 
      //    final: to
      //  }

      //  fade.name = 'fade'
        
      //  return fade
      //}
    },

    export( target ) {
      Object.assign( target, this.ugens )
    },
  }

  return __gen
}
