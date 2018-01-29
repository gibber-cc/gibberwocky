let Gibber, genAbstract, __ugenproto__


module.exports = function( _Gibber, _genAbstract, proto ) {
  Gibber = _Gibber
  genAbstract = _genAbstract
  waveObjects.saw = waveObjects.line
  __ugenproto__ = proto

  return waveObjects
}

const waveObjects = {
  lfo( freq=.5, bias=.5, amp=.5, phase=0 ) {
    const initPhase = phase
    const __cycle = genAbstract.ugens.cycle( freq, 0, { initialValue:phase })

    const sine = __cycle
    const ugen = genAbstract.ugens.add( bias, genAbstract.ugens.mul( sine, amp ) )
    ugen.__phase = initPhase

    ugen.__onrender = ()=> {

      ugen.frequency = v => {
        if( v === undefined ) {
          return freq
        }else{
          freq = v
          __cycle[0]( freq )
          //ugen.phase( initPhase )
        }
      }

      Gibber.addSequencingToMethod( ugen, 'frequency' )

      ugen.bias = v => {
        if( v === undefined ) {
          return bias
        }else{
          bias = v
          ugen[0]( bias )
          //ugen.phase( initPhase )
        }
      }

      Gibber.addSequencingToMethod( ugen, 'bias' )
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
  },

  fade( measures=4, from=0, to=1 ) {
    
    const g = genAbstract.ugens 
    const amt = to - from
    const incr = 1 / ((Gibber.Utility.beatsToMs( measures * 4 ) / 1000) * 44100) * amt
    const psr =  g.accum( incr, 0, { max:Infinity, min:-Infinity, shouldWrap:false, initialValue:0 })
    const min = from < to ? from : to
    const max = to > from ? to : from
    const fade = g.clamp( g.add( from, psr ), min, max )

    //debugger
    
    fade.shouldKill = {
      after: measures, 
      final: to
    }

    return fade
  },

  beats( ...inputs ) {
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

    //console.log( 'beats:', ugen )

    return ugen
  },

  sine( periodInMeasures=1, center=0, amp=7, phase=0 )  {
    const freq = btof( periodInMeasures * 4, 120 )
    const initPhase = phase
    const __cycle = genAbstract.ugens.cycle( freq,0,{initialValue:phase} )

    const sine = __cycle 
    const scalar = genAbstract.ugens.mul( amp, sine )
    const ugen = genAbstract.ugens.add( center, scalar )
    ugen.__phase = initPhase

    ugen.__onrender = ()=> {

      ugen[0] = v => {
        if( v === undefined ) {
          return periodInMeasures
        }else{
          periodInMeasures = v
          const freq = btof( periodInMeasures * 4, 120 ) 
          __cycle[0]( freq )
          ugen.phase( initPhase )
        }
      }

      Gibber.addSequencingToMethod( ugen, '0' )

      ugen[1] = v => {
        if( v === undefined ) {
          return center
        }else{
          center = v
          ugen[0]( center )
        }
      }

      Gibber.addSequencingToMethod( ugen, '1' )
      
      ugen[2] = v => {
        if( v === undefined ) {
          return amp 
        }else{
          amp = v
          scalar[0]( amp )
        }
      }

      Gibber.addSequencingToMethod( ugen, '2' )   
    }

    ugen.phase = value => {
      if( value === undefined ) return ugen.__phase

      ugen.__phase = value
      if( ugen.rendered !== undefined ) { 
        ugen.rendered.inputs[1].inputs[1].inputs[0].value = ugen.__phase
        ugen.rendered.shouldNotAdjust = true
      }

      return ugen
    }

    Gibber.addSequencingToMethod( ugen, 'phase' )

    return ugen
  },

  siner( periodInMeasures=1, center=0, amp=7 ) {
    const freq = btof( periodInMeasures * 4, 120 )
    const __cycle = genAbstract.ugens.cycle( freq )

    const sine = __cycle 
    const ugen = genAbstract.ugens.round( genAbstract.ugens.add( center, genAbstract.ugens.mul( sine, amp ) ) )

    ugen.sine = sine

    ugen.__onrender = ()=> {

      ugen[0] = v => {
        if( v === undefined ) {
          return periodInMeasures
        }else{
          periodInMeasures = v
          __cycle[0]( btof( periodInMeasures * 4, 120 ) )
        }
      }

      Gibber.addSequencingToMethod( ugen, '0' )
    }

    return ugen
  },

  cos( periodInMeasures=1, center=0, amp=7 )  {
    const freq = btof( periodInMeasures * 4, 120 )
    const __cycle = genAbstract.ugens.cycle( freq, 0, { initialValue:1 })

    const sine = __cycle 
    const ugen = genAbstract.ugens.add( center, genAbstract.ugens.mul( sine, amp ) )

    ugen[0] = v => {
      if( v === undefined ) {
        return periodInMeasures
      }else{
        periodInMeasures = v
        __cycle[0]( btof( periodInMeasures * 4, 120 ) )
      }
    }

    Gibber.addSequencingToMethod( ugen, '0' )

    return ugen
  },

  cosr( periodInMeasures=1, center=0, amp=7 )  {
    const freq = btof( periodInMeasures * 4, 120 )
    const __cycle = genAbstract.ugens.cycle( freq, 0, { initialValue:1 })

    const sine = __cycle 
    const ugen = genAbstract.ugens.round( genAbstract.ugens.add( center, genAbstract.ugens.mul( sine, amp ) ) )

    ugen[0] = v => {
      if( v === undefined ) {
        return periodInMeasures
      }else{
        periodInMeasures = v
        __cycle[0]( btof( periodInMeasures * 4, 120 ) )
      }
    }

    Gibber.addSequencingToMethod( ugen, '0' )

    return ugen
  },

  liner( periodInMeasures=1, min=0, max=7 )  {
    const line = genAbstract.ugens.beats( periodInMeasures * 4 )

    const ugen = genAbstract.ugens.round( genAbstract.ugens.add( min, genAbstract.ugens.mul( line, max-min ) ) )

    ugen.__onrender = ()=> {

      ugen[0] = v => {
        if( v === undefined ) {
          return periodInMeasures
        }else{
          periodInMeasures = v
          line[0]( v * 4 )
        }
      }

      Gibber.addSequencingToMethod( ugen, '0' )
    }


    return ugen
  },

  line( periodInMeasures=1, min=0, max=1 ) {
    const line = genAbstract.ugens.beats( periodInMeasures * 4 )

    // note messages are rounded in note filter, found in seq.js
    const ugen = genAbstract.ugens.add( min, genAbstract.ugens.mul( line, max-min ) )

    ugen.__onrender = ()=> {

      ugen[0] = v => {
        if( v === undefined ) {
          return periodInMeasures
        }else{
          periodInMeasures = v
          line[0]( v * 4 )
        }
      }

      Gibber.addSequencingToMethod( ugen, '0' )
    }


    return ugen
  }
}
