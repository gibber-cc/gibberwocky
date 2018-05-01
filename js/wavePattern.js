
const genish = require( 'genish.js' )

module.exports = function( Gibber ) {

'use strict'

const WavePattern = {
  __connectedWidgets: null,

  create( abstractGraph, values, mode=null ) {
    // might change due to proxy functionality, so use 'let'
    let graph = abstractGraph.render( 'genish' ) // convert abstraction to genish.js graph


    const patternOutputFnc = function( isViz = false ) {
      if( isViz && pattern.vizinit === false ) {
        return
      } 
      pattern.run( isViz )

      let signalValue = pattern.signalOut()
      // edge case... because adjust might lead to a value of 1
      // which accum would wrap AFTER the obtaining the current value
      // leading to an undefined value for the pattern output (e.g. pattern[ pattern.length ] )
      let outputBeforeFilters = signalValue

      // if there is an array of values to read from... (signal is a phasor indexing into a values array)
      if( pattern.__usesValues === true && isViz === false ) {
        // have to wait to declare this array for annotations to be processed
        if( pattern.update !== undefined ) {
          if( pattern.update.__currentIndex === undefined ) pattern.update.__currentIndex = []
        }

        if( signalValue === 1 ) signalValue = 0

        const scaledSignalValue = signalValue * ( pattern._values.length )
        const adjustedSignalValue = Math.abs( scaledSignalValue )//scaledSignalValue < 0 ? pattern._values.length + scaledSignalValue : scaledSignalValue
        const roundedSignalValue  = Math.floor( adjustedSignalValue )
        //console.log( scaledSignalValue, adjustedSignalValue, roundedSignalValue )
        outputBeforeFilters = pattern._values[ roundedSignalValue ]

        if( pattern.update !== undefined ) {
          pattern.update.__currentIndex.push( roundedSignalValue )
        }

      }

      let output = outputBeforeFilters

      if( mode === 'midi' ) {
        if( pattern.widget === undefined ) {
          //console.log( pattern.paramID, Gibber.Environment.codeMarkup.waveform.widgets[ pattern.paramID ] )
          pattern.widget = Gibber.Environment.codeMarkup.waveform.widgets[ pattern.paramID ]

        }

        isViz = false
      }

      // if we are running the pattern solely to visualize the waveform data...
      if( isViz === true && pattern.vizinit && Gibber.Environment.annotations === true ) {
        Gibber.Environment.codeMarkup.waveform.updateWidget( pattern.paramID, signalValue, false )
      }else if( Gibber.Environment.annotations === true && pattern.widget !== undefined ) {
        // mark the last placed value by the visualization as having a "hit", 
        // which will cause a dot to be drawn on the sparkline.
        const idx = 60 + Math.round( pattern.nextTime * 16  )

        pattern.widget.values[ idx ] = { value: signalValue, type:'hit' }

        if( mode === 'midi' ) {
          Gibber.Environment.codeMarkup.waveform.updateWidget( pattern.paramID, signalValue, false )
          Gibber.MIDI.send([ 0xb0 + pattern.channel, pattern.ccnum, Math.floor( signalValue ) ], 0 ) 
        }
      }

      if( typeof pattern.genReplace === 'function' ) { pattern.genReplace( output ) }

      if( output === pattern.DNR ) output = null

      if( pattern.running === false ) { 
        Gibber.Environment.animationScheduler.add( pattern.runVisualization, 1000/60 )
        pattern.running = true
      }

      return output
    }

    patternOutputFnc.wavePattern = true

    const pattern = Gibber.Pattern( patternOutputFnc )

    patternOutputFnc.pattern = pattern

    // check whether or not to use raw signal values
    // or index into values array
    pattern.__usesValues = values !== undefined && values !== null

    if( abstractGraph.patterns === undefined ) {
      abstractGraph.patterns = []
      abstractGraph.graphs = []
    }
    abstractGraph.patterns.push( pattern )
    abstractGraph.graphs.push( graph )

    if( abstractGraph.__listeners === undefined ) {
      abstractGraph.__listeners = []
    }

    const proxyFunction = ( oldAbstractGraph, newAbstractGraph ) => {
      graph = newAbstractGraph.render( 'genish' )

      if( newAbstractGraph.patterns === undefined ) {
        newAbstractGraph.patterns = []
        newAbstractGraph.graphs = []
      }
      newAbstractGraph.patterns.push( pattern )
      newAbstractGraph.graphs.push( graph )
      // XXX what the heck is the patterns array used for?
      newAbstractGraph.widget = oldAbstractGraph.patterns[0].widget

      pattern.graph = graph
      pattern.signalOut = genish.gen.createCallback( graph, mem, false, false, Float64Array ),
      pattern.phase = 0
      pattern.initialized = false
      pattern.widget = newAbstractGraph.widget
      
      // reset min and max values for sparkline in case amplitudes have changed
      pattern.widget.min = Infinity 
      pattern.widget.max = -Infinity
      pattern.widget.values.length = 0
      pattern.widget.storage.length = 0

      if( newAbstractGraph.__listeners === undefined ) {
        newAbstractGraph.__listeners = []
      }
      newAbstractGraph.__listeners.push( proxyFunction ) 
    }

    abstractGraph.__listeners.push( proxyFunction )

    pattern.clear = function() {
      if( pattern.widget !== undefined  ) { 
        if( abstractGraph.widget !== undefined ) {
          delete abstractGraph.widget
        }
        pattern.widget.clear()
        delete pattern.widget
        pattern.running = false
      }else if( abstractGraph.widget !== undefined ) {
        abstractGraph.widget.clear()
        delete abstractGraph.widget
        pattern.running = false
      }
      const idx = Gibber.Gen.connected.findIndex( e => e.paramID === pattern.id )
      Gibber.Gen.connected.splice( idx, 1 )

      pattern.shouldStop = true
    }

    Gibber.subscribe( 'clear', pattern.clear )

    // if memory block has not been defined, create new one by passing in an undefined value
    // else reuse exisitng memory block
    let mem = genish.gen.memory || 44100 * 2

    Object.assign( pattern, {
      type: pattern.__usesValues ? 'Lookup' : 'WavePattern',
      graph,
      abstractGraph,
      paramID:abstractGraph.paramID || Math.round( Math.random() * 1000000 ),
      _values:values,
      signalOut: genish.gen.createCallback( graph, mem, false, false, Float64Array ), 
      adjust: WavePattern.adjust.bind( pattern ),
      phase:0,
      run: WavePattern.run.bind( pattern ),
      runVisualization: WavePattern.runVisualization.bind( patternOutputFnc ),
      running: false,
      initialized:false,
      vizinit:true,
      shouldStop:false,
      __listeners:[],
      mode
    })

    if( abstractGraph.paramID === undefined ) abstractGraph.paramID = pattern.paramID

    // for assigning an abstract graph to a variable
    // and then passing that variable as a pattern to a sequence
    if( abstractGraph.widget !== undefined ) {
      pattern.widget = abstractGraph.widget
      Gibber.Environment.codeMarkup.waveform.widgets[ abstractGraph.paramID ] = pattern.widget
    }

    if( mode === 'midi' ) { 
      pattern.widget = Gibber.Environment.codeMarkup.waveform.widgets[ pattern.paramID ]
    }
      //  if( WavePattern.__connectedWidgets === null ) { // initialize
    //    WavePattern.__connectedWidgets = []

    //    const update = ()=> {
    //      Gibber.Environment.animationScheduler.add( update, 1000/60 )
    //      WavePattern.runWidgets()
    //    }

    //    Gibber.Environment.animationScheduler.add( update, 0 )

    //  }
    //  WavePattern.__connectedWidgets.push( pattern.widget )
    //}

    Gibber.Gen.connected.push( pattern )

    return pattern
  },


  runWidgets: function () {
    for( let widget of WavePattern.__connectedWidgets ) {
      //if( id === 'dirty' ) continue

      //const widget = Gibber.Environment.codeMarkup.genWidgets[ id ]
      const value = widget.gen() 

      Gibber.Environment.codeMarkup.updateWidget( id, value )
      
      //if( Gen.__solo === null || ( Gen.__solo.channel === widget.gen.channel && Gen.__solo.ccnum === widget.gen.ccnum) ) {
      Gibber.MIDI.send([ 0xb0 + widget.gen.channel, widget.gen.ccnum, value ]) 
      //}
    }
  },

  runVisualization() {
    // pass true for visualization run as opposed to audio run
    // this represents the patternOutputFunction, pass true to create sparkline
    // without triggering output
    
    this( true ) // I LOVE JS

    if( this.pattern.shouldStop === false )
      Gibber.Environment.animationScheduler.add( this.pattern.runVisualization, 1000 / 60 )
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

  run( isViz = false ) {
    let now 
    if( isViz === true ) {
      now = Gibber.Environment.animationScheduler.visualizationTime.base + Gibber.Environment.animationScheduler.visualizationTime.phase //+ 4
    }else{
      now = Gibber.Scheduler.currentTimeInMs 
    }

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
    if( ugen.shouldNotAdjust === true ) {
      ugen.shouldNotAdjust = false
      return
    }
    // subtract one sample for the phase incremenet that occurs during
    // the genish.js callback
    const numberOfSamplesToAdvance = ( ms/1000 ) * (Gibber.__gen.genish.gen.samplerate  )


    if( ugen.name !== undefined && ( ugen.name.indexOf( 'accum' ) > -1 || ugen.name.indexOf( 'phasor' ) > -1 ) )  {
      if( ugen.name.indexOf( 'accum' ) > -1 ) {
        ugen.value += typeof ugen.inputs[0] === 'object' 
          ? numberOfSamplesToAdvance  * ugen.inputs[0].value 
          : numberOfSamplesToAdvance * ugen.inputs[0]

      }else{
        const range = ugen.max - ugen.min
        let __ugen = ugen

        while( __ugen.inputs !== undefined ) {
          __ugen = __ugen.inputs[0]
        }

        // needs .value because the result should be a param
        const freq = __ugen.value
        const incr = (freq * range ) / Gibber.__gen.genish.gen.samplerate
        const adjustAmount = (numberOfSamplesToAdvance-1)  * incr 
 
        ugen.value += adjustAmount
      }

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
      
      ugen.inputs.forEach( u => {
        if( typeof u === 'object' || typeof u === 'function' )
          WavePattern.adjust( u,ms )
      }) 
    }
  }
 
}

return WavePattern.create

}


