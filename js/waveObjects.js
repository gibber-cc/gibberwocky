let Gibber, genAbstract, __ugenproto__


module.exports = function( _Gibber, _genAbstract, proto ) {
  Gibber = _Gibber
  genAbstract = _genAbstract
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

  fade( beats=16, from=0, to=1 ) {
    //const ugen = Object.create( __ugenproto__ )

    //ugen.name = 'fade'
    //ugen.inputs = inputs

    //return ugen
    const g = genAbstract.ugens 
    let fade, amt, beatsInSeconds = Gibber.Utility.beatsToFrequency( beats, 120 )

    if( from > to ) {
      amt = from - to

      fade = g.gtp( g.sub( from, g.accum( g.div( amt, g.mul(beatsInSeconds, g.samplerate ) ), 0 ) ), to )
    }else{
      amt = to - from
      fade = g.ltp( g.accum( g.div( amt, g.mul( beatsInSeconds, 44100 ) ), 0 ), to )
    }

    // XXX should this be available in ms? msToBeats()?
    fade.shouldKill = {
      after: beats, 
      final: to
    }

    //fade.name = 'fade'

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

    return ugen
  },

  sine( beats=4, center=0, amp=7, phase=0 )  {
    const freq = btof( beats, 120 )
    const initPhase = phase
    const __cycle = genAbstract.ugens.cycle( freq,0,{initialValue:phase} )

    const sine = __cycle 
    const ugen = genAbstract.ugens.add( center, genAbstract.ugens.mul( sine, amp ) )
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
  },

  siner( beats=4, center=0, amp=7 ) {
    const freq = btof( beats, 120 )
    const __cycle = genAbstract.ugens.cycle( freq )

    const sine = __cycle 
    const ugen = genAbstract.ugens.round( genAbstract.ugens.add( center, genAbstract.ugens.mul( sine, amp ) ) )

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
  },

  cos( beats=4, center=0, amp=7 )  {
    const freq = btof( beats, 120 )
    const __cycle = genAbstract.ugens.cycle( freq, 0, { initialValue:1 })

    const sine = __cycle 
    const ugen = genAbstract.ugens.add( center, genAbstract.ugens.mul( sine, amp ) )

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
  },

  cosr( beats=4, center=0, amp=7 )  {
    const freq = btof( beats, 120 )
    const __cycle = genAbstract.ugens.cycle( freq, 0, { initialValue:1 })

    const sine = __cycle 
    const ugen = genAbstract.ugens.round( genAbstract.ugens.add( center, genAbstract.ugens.mul( sine, amp ) ) )

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
  },

  liner( beats=4, min=0, max=7 )  {
    const line = genAbstract.ugens.beats( beats )

    const ugen = genAbstract.ugens.round( genAbstract.ugens.add( min, genAbstract.ugens.mul( line, max-min ) ) )

    ugen.__onrender = ()=> {

      ugen[0] = v => {
        if( v === undefined ) {
          return beats
        }else{
          beats = v
          line[0]( v )
        }
      }

      Gibber.addSequencingToMethod( ugen, '0' )
    }


    return ugen
  },

  line( beats=4, min=0, max=1 ) {
    const line = genAbstract.ugens.beats( beats )

    const ugen = genAbstract.ugens.add( min, genAbstract.ugens.mul( line, max-min ) )

    ugen.__onrender = ()=> {

      ugen[0] = v => {
        if( v === undefined ) {
          return beats
        }else{
          beats = v
          line[0]( v )
        }
      }

      Gibber.addSequencingToMethod( ugen, '0' )
    }


    return ugen
  }
}
