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
    ugenNames: [
      'cycle','phasor','accum','counter',
      'add','mul','div','sub',
      'sah','noise',
      'beats', 'lfo', 'fade', 'sine', 'siner', 'cos', 'cosr', 'liner', 'line',
      'abs', 'ceil', 'round', 'floor',
      'min','max',
      'gt','lt','ltp','gtp','samplerate','rate'
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
      }, 50 )

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
         
      this.ugens.lfo = function( ...inputs ) {
        const ugen = Object.create( __ugenproto__ )

        ugen.name = 'lfo'
        ugen.inputs = inputs

        ugen.frequency = v => {
          if( ugen.rendered !== undefined ) {
            return ugen.rendered.frequency( v )
          }
        }
        ugen.amp = v => {
          if( ugen.rendered !== undefined ) {
            return ugen.rendered.amp( v )
          }
        }
        ugen.center = v => {
          if( ugen.rendered !== undefined ) {
            return ugen.rendered.center( v )
          }
        }

        Gibber.addSequencingToMethod( ugen, 'frequency' )
        Gibber.addSequencingToMethod( ugen, 'amp' )
        Gibber.addSequencingToMethod( ugen, 'center' )

        return ugen
      }

      this.ugens[ 'beats' ] = function( ...inputs ) {
        const ugen = Object.create( __ugenproto__ )
        ugen.name = 'phasor'
        ugen.inputs = inputs
        let numBeats = inputs[0]

        ugen.inputs[0] = Gibber.Utility.beatsToFrequency( inputs[0], 120 )
        inputs[2] = {min:0}

        ugen.__onrender = ()=> {
          // store original param change function for wrapping with btof value
          ugen.__frequency = ugen[0]

          ugen[0] = v => {
            if( v === undefined ) {
              return numBeats
            }else{
              numBeats = v
              const frequency = Gibber.Utility.beatsToFrequency( v, 120 )
              
              // reset phase
              ugen.rendered.value = 0
              ugen.rendered.shouldNotAdjust = true

              // pass btof value to phasor frequency via stored reference
              return ugen.__frequency( frequency )
            }
          }

          Gibber.addSequencingToMethod( ugen, '0' )
        }

        return ugen
      }

      this.ugens[ 'sine' ] = ( beats=4, center=0, amp=7, phase=0 ) => {
        const freq = btof( beats, 120 )
        const initPhase = phase
        const __cycle = this.ugens.cycle( freq,0,{initialValue:phase} )

        const sine = __cycle 
        const ugen = this.ugens.add( center, this.ugens.mul( sine, amp ) )
        ugen.__phase = initPhase

        ugen.__onrender = ()=> {

          ugen[0] = v => {
            if( v === undefined ) {
              return beats
            }else{
              beats = v
              const freq = btof( beats, 120 ) 
              __cycle[0]( freq )
              ugen.phase( initPhase )
            }
          }

          Gibber.addSequencingToMethod( ugen, '0' )
        }

        ugen.phase = (value) => {
          if( value === undefined ) return ugen.__phase

          ugen.__phase = value
          if( ugen.rendered !== undefined ) { 
            ugen.rendered.inputs[1].inputs[0].inputs[0].value = ugen.__phase
            ugen.rendered.shouldNotAdjust = true
          }
        }

        Gibber.addSequencingToMethod( ugen, 'phase' )

        return ugen
      }

      this.ugens[ 'siner' ] = ( beats=4, center=0, amp=7 ) => {
        const freq = btof( beats, 120 )
        const __cycle = this.ugens.cycle( freq )

        const sine = __cycle 
        const ugen = this.ugens.round( this.ugens.add( center, this.ugens.mul( sine, amp ) ) )
        
        ugen.sine = sine

        ugen.__onrender = ()=> {

          ugen[0] = v => {
            if( v === undefined ) {
              return beats
            }else{
              beats = v
              __cycle[0]( btof( beats, 120 ) )
            }
          }

          Gibber.addSequencingToMethod( ugen, '0' )
        }

        return ugen
      }

      this.ugens[ 'cos' ] = ( beats=4, center=0, amp=7 ) => {
        const freq = btof( beats, 120 )
        const __cycle = this.ugens.cycle( freq, 0, { initialValue:1 })

        const sine = __cycle 
        const ugen = this.ugens.add( center, this.ugens.mul( sine, amp ) )

        ugen[0] = v => {
          if( v === undefined ) {
            return beats
          }else{
            beats = v
            __cycle[0]( btof( beats, 120 ) )
          }
        }

        Gibber.addSequencingToMethod( ugen, '0' )

        return ugen
      }
      this.ugens[ 'cosr' ] = ( beats=4, center=0, amp=7 ) => {
        const freq = btof( beats, 120 )
        const __cycle = this.ugens.cycle( freq, 0, { initialValue:1 })

        const sine = __cycle 
        const ugen = this.ugens.round( this.ugens.add( center, this.ugens.mul( sine, amp ) ) )

        ugen[0] = v => {
          if( v === undefined ) {
            return beats
          }else{
            beats = v
            __cycle[0]( btof( beats, 120 ) )
          }
        }

        Gibber.addSequencingToMethod( ugen, '0' )

        return ugen
      }
      this.ugens[ 'liner' ] = ( beats=4, min=0, max=7 ) => {
        const line = this.ugens.beats( beats )

        const ugen = this.ugens.round( this.ugens.add( min, this.ugens.mul( line, max-min ) ) )

        ugen[0] = v => {
          if( v === undefined ) {
            return beats
          }else{
            beats = v
            line[0]( v )
          }
        }

        Gibber.addSequencingToMethod( ugen, '0' )

        return ugen
      }
      this.ugens[ 'line' ] = ( beats=4, min=0, max=1 ) => {
        const line = this.ugens.beats( beats )

        const ugen = this.ugens.add( min, this.ugens.mul( line, max-min ) )

        ugen[0] = v => {
          if( v === undefined ) {
            return beats
          }else{
            beats = v
            line[0]( v )
          }
        }

        Gibber.addSequencingToMethod( ugen, '0' )

        return ugen
      }

    },

    export( target ) {
      Object.assign( target, this.ugens )
    },
  }

  return __gen
}
