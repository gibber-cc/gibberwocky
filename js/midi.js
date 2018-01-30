let Gibber = null

const MIDI = {
  channels: [],

  init( _Gibber ) {
    Gibber = _Gibber

    const midiPromise = navigator.requestMIDIAccess()
      .then( midiAccess => {
        MIDI.midiAccess = midiAccess
        MIDI.createInputAndOutputLists( midiAccess )
        MIDI.openLastUsedPorts()
      }, ()=> console.log('access failure') )

    this.midiInputList = document.querySelector( '#midiInputSelect' )
    this.midiOutputList = document.querySelector( '#midiOutputSelect' )

    this.createChannels()
    // XXX restore
    //this.setModulationOutputRate()
  },

  setModulationOutputRate() {
    const modulationRate = localStorage.getItem('midi.modulationOutputRate')

    const modRateInput = document.querySelector('#modulationRate')

    if( modulationRate !== null && modulationRate !== undefined ) {
      Gibber.Gen.genish.gen.samplerate = parseFloat( modulationRate )
      modRateInput.value = Gibber.Gen.genish.gen.samplerate
    }else{
      Gibber.Gen.genish.gen.samplerate = 60
    }

    modRateInput.onchange = function(e) {
      Gibber.Gen.genish.gen.samplerate = e.target.value
      
      localStorage.setItem('midi.modulationOutputRate', Gibber.Gen.genish.gen.samplerate )
    }
   
  },

  openLastUsedPorts() {
    const lastMIDIInput = localStorage.getItem('midi.input'),
          lastMIDIOutput = localStorage.getItem('midi.output')

    //if( lastMIDIInput !== null && lastMIDIInput !== undefined ) {
    //  this.selectInputByName( lastMIDIInput ) 
    //}
    if( lastMIDIOutput !== null && lastMIDIOutput !== undefined ) {
      this.selectOutputByName( lastMIDIOutput ) 
    }
  },
  createChannels() {
    for( let i = 0; i < 16; i++ ) {
      this.channels.push( Gibber.Channel( i ) )
    }
  },

  createInputAndOutputLists( midiAccess ) {
    //let optin = document.createElement( 'option' )
    //optin.text = 'none'
    let optout = document.createElement( 'option' )
    optout.text = 'none'
    //MIDI.midiInputList.add( optin )
    MIDI.midiOutputList.add( optout )

    //MIDI.midiInputList.onchange = MIDI.selectInputViaGUI
    MIDI.midiOutputList.onchange = MIDI.selectOutputViaGUI
    
    //const inputs = midiAccess.inputs
    //for( let input of inputs.values() ) {
    //  const opt = document.createElement( 'option' )
    //  opt.text = input.name
    //  opt.input = input
    //  MIDI.midiInputList.add( opt )
    //}

    const outputs = midiAccess.outputs
    for( let output of outputs.values() ) {
      const opt = document.createElement('option')
      opt.output = output
      opt.text = output.name
      MIDI.midiOutputList.add(opt)
    }

  },

  selectInputViaGUI( e ) {
    if( e.target.selectedIndex !== 0 ) { // does not equal 'none'
      const opt = e.target[ e.target.selectedIndex ]
      const input = opt.input
      input.onmidimessage = MIDI.handleMsg
      input.open()
      MIDI.input = input
      localStorage.setItem( 'midi.input', input.name )
    }
  
  },

  selectOutputViaGUI( e ) {
    if( e.target.selectedIndex !== 0 ) { // does not equal 'none'
      const opt = e.target[ e.target.selectedIndex ]
      const output = opt.output
      output.open()
      MIDI.output = output
      localStorage.setItem( 'midi.output', output.name )
    }
  },

  selectInputByName( name ) {
    const inputs = MIDI.midiAccess.inputs
    let found = false
    for( let input of inputs.values() ) {
      if( name === input.name ) {
        input.onmidimessage = MIDI.handleMsg
        input.open()
        MIDI.input = input
        Gibber.Environment.log( 'MIDI input ' + name + ' opened.' )
        found = true
      }
    }

    if( found === true ) {
      for( let i = 0; i < MIDI.midiInputList.children.length; i++ ) {
        if( name === MIDI.midiInputList.children[i].innerText ) {
          MIDI.midiInputList.selectedIndex = i 
        }
      }
    }
  },

  selectOutputByName( name ) {
    const outputs = MIDI.midiAccess.outputs
    let found = false
    for( let output of outputs.values() ) {
      if( name === output.name ) {
        output.onmidimessage = MIDI.handleMsg
        output.open()
        MIDI.output = output
        Gibber.Environment.log( 'MIDI output ' + name + ' opened.' )
        found = true
      }
    }

    if( found === true ) {
      for( let i = 0; i < MIDI.midiOutputList.children.length; i++ ) {
        if( name === MIDI.midiOutputList.children[i].innerText ) {
          MIDI.midiOutputList.selectedIndex = i 
        }
      }
    }
  },

  send( msg, timestamp ) {
    MIDI.output.send( msg, timestamp )
  },

  handleMsg( msg ) {
    if( msg.data[0] !== 248 ) {
      //console.log( 'midi message:', msg.data[0], msg.data[1] )
    }

    if( Gibber.Scheduler.__sync__ === true ) {
      if( msg.data[0] === 0xf2 ) { // stop
        MIDI.timestamps.length = 0
        MIDI.clockCount = 0
        Gibber.Scheduler.currentBeat = -1
        MIDI.lastClockTime = null
      } else if (msg.data[0] === 0xfa ) { // play
        MIDI.running = true
      } else if (msg.data[0] === 0xfc ) { // pause
        MIDI.running = false
      } else if( msg.data[0] === 248 && MIDI.running === true  ) { // MIDI beat clock

        if( MIDI.timestamps.length > 0 ) {
          const diff = msg.timeStamp - MIDI.lastClockTime
          if( diff < 10 ) console.log( 'diff:', diff )
          MIDI.timestamps.unshift( diff )
          while( MIDI.timestamps.length > 20 ) MIDI.timestamps.pop()

          const sum = MIDI.timestamps.reduce( (a,b) => a+b )
          const avg = sum / MIDI.timestamps.length

          let bpm = (1000 / (avg * 24)) * 60
          Gibber.Scheduler.bpm = Math.round( Math.round( bpm *  100 ) / 100 )
   
          if( MIDI.clockCount++ === 23 ) {
            Gibber.Scheduler.advanceBeat()
            MIDI.clockCount = 0
          }

          MIDI.lastClockTime = msg.timeStamp
          
        }else{
          if( MIDI.lastClockTime !== null ) {
            const diff = msg.timeStamp - MIDI.lastClockTime
            MIDI.timestamps.unshift( diff )
            MIDI.lastClockTime = msg.timeStamp
          }else{
            MIDI.lastClockTime = msg.timeStamp
            Gibber.Scheduler.advanceBeat()
          }

          MIDI.clockCount++
        }    
      }
    }
  },
  
  clear() { 
    // This should only happen on a MIDI Stop message
    // this.timestamps.length = 0
    // this.clockCount = 0
    // this.lastClockTime = null
  },
  running: false,
  timestamps:[],
  clockCount: 0,
  lastClockTime:null

}

module.exports = MIDI
