const genish = require( 'genish.js' )

module.exports = function( Gibber ) {
  
'use strict'

const WavePattern = {
  create( abstractGraph, values ) {

    let pattern
    let graph = abstractGraph.render( 'genish' ) // convert abstraction to genish.js graph

    const patternOutputFnc = function() {
      pattern.run()

      let signalValue = pattern.signalOut()
      // edge case... because adjust might lead to a value of 1
      // which accum would wrap AFTER the obtaining the current value
      // leading to an undefined value for the pattern output (e.g. pattern[ pattern.length ] )
      if( signalValue === 1 ) signalValue = 0

      const scaledSignalValue = signalValue * ( pattern._values.length )
      const adjustedSignalValue = scaledSignalValue < 0 ? pattern._values.length + scaledSignalValue : scaledSignalValue
      const roundedSignalValue  = Math.floor( adjustedSignalValue )
      const outputBeforeFilters = pattern._values[ roundedSignalValue ]

      if( roundedSignalValue > pattern._values.length - 1 ) {
        //console.log( signalValue, scaledSignalValue, adjustedSignalValue, roundedSignalValue )
      }

      let output = outputBeforeFilters// pattern.runFilters( outputBeforeFilters, 0 )[ 0 ]
      //console.log( 'output:', output )

      //console.log( signalValue, scaledSignalValue, adjustedSignalValue, roundedSignalValue, outputBeforeFilters )

      if( pattern.update && pattern.update.value ) pattern.update.value.unshift( output )

      if( output === pattern.DNR ) output = null

      return output
    }

    patternOutputFnc.wavePattern = true

    pattern = Gibber.Pattern( patternOutputFnc )//, ...values )

    abstractGraph.pattern = pattern
    abstractGraph.graph = graph

    //WavePattern.assignInputProperties( graph, abstractGraph )

    Object.assign( pattern, {
      graph,
      _values:values,
      signalOut: genish.gen.createCallback( graph, undefined, false, false, Float64Array ), 
      out() {
        return pattern.signalOut()
      },
      adjust: WavePattern.adjust,
      phase:0,
      run: WavePattern.run,
      initialized:false
    })

    return pattern
  },

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

  run( ) {
    const now = Gibber.Scheduler.currentTimeInMs 

    if( this.initialized === true ) {
      const adjustment =  now - this.phase 
      this.adjust( this.graph, adjustment )
    }else{
      this.initialized = true
    }

    this.phase = now
    //debugger;
  },

  adjust( ugen, ms ) {
    // subtract one sample for the phase incremenet that occurs during
    // the genish.js callback
    const numberOfSamplesToAdvance = ( ms/1000 ) * (Gibber.__gen.genish.gen.samplerate  )


    if( ugen.name !== undefined && ( ugen.name.indexOf( 'accum' ) > -1 || ugen.name.indexOf( 'phasor' ) > -1 ) )  {
      //console.log( ugen.value, amount, JSON.stringify( ugen.inputs ) )
      if( ugen.name.indexOf( 'accum' ) > -1 ) {
        ugen.value += typeof ugen.inputs[0] === 'object' ? numberOfSamplesToAdvance  * ugen.inputs[0].value : numberOfSamplesToAdvance * ugen.inputs[0]
      }else{
      //? accum( (frequency * range) / gen.samplerate, reset, props ) 
        //: accum( mul( frequency, 1 / gen.samplerate / ( 1 / range ) ), reset, props )
        //console.log('what?')
        const range = ugen.max - ugen.min
        let __ugen = ugen

        while( __ugen.inputs !== undefined ) {
          __ugen = __ugen.inputs[0]
        }

        // needs .value because the result should be a param
        const freq = __ugen.value
        const incr = (freq * range ) / Gibber.__gen.genish.gen.samplerate//typeof ugen.inputs[0] === 'object'
          //? 
        //ugen.value += typeof ugen.inputs[0] === 'object' 
        //  ? amount * ( ugen.inputs[0].inputs[0].value  * ugen.inputs[0].inputs[1] )
        //  : amount * ugen.inputs[0]

        //console.log( ugen.value, ms, amount, ugen.inputs[0] ) 
        //console.log('huh?', ugen.inputs )
        //if( typeof ugen.inputs[0] === 'undefined' ) console.log( 'undefined!', ugen.inputs[0] )
        const adjustAmount = (numberOfSamplesToAdvance-1)  * incr 
        //debugger
        ugen.value += adjustAmount
      }

      

      //console.log( ugen.value, amount )
      // wrap or clamp accum value manuallly
      if( ugen.shouldWrap === true ) {
        if( ugen.value > ugen.max ) {
          while( ugen.value > ugen.max ) {
            ugen.value -= ugen.max - ugen.min
          }
        } else if( ugen.value < ugen.min ) {
          while( ugen.value < ugen.min ) {
            ugen.value += ugen.max - ugen.min
          }
        } 
      }else if( ugen.shouldClamp === true ) {
        if( ugen.value > ugen.max ) { 
          ugen.value = max
        }else if( ugen.value < ugen.min ) {
          ugen.value = min
        }
      }
    }

    if( typeof ugen.inputs !== 'undefined' ) {
      ugen.inputs.forEach( u => WavePattern.adjust( u,ms ) ) 
    }
  }
 
}

return WavePattern.create

}

