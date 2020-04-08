let Gibber = {
  Utility:       require( './utility.js' ),
  Communication: require( './communication.js' ),
  Environment:   require( './environment.js' ),
  Scheduler:     require( './clock.js' ),
  Theory:        require( './theory.js' ),
  Examples:      require( './example.js' ),
  Live:          null,
  Track:         null,
  Gen:           null,
  Euclid:        null,
  Hex:           null,
  Seq:           null,
  Score:         null,
  Pattern:       null,
  Arp:           null,
  currentTrack:  null,
  codemirror:    null,
  max:           null,
  '$':           null,

  export() {
    window.Steps         = this.Steps
    window.HexSteps      = this.HexSteps
    window.Automata      = this.Automata
    window.Seq           = this.Seq
    window.Score         = this.Score
    window.Track         = this.Track
    window.Scheduler     = this.Scheduler
    window.Pattern       = this.Pattern
    window.Euclid        = this.Euclid
    window.Hex           = this.Hex
    window.Arp           = this.Arp
    window.Communication = this.Communication
    window.log           = this.log
    window.clear         = this.clear
    window.Theory        = this.Theory
    window.Lookup        = this.WavePattern
    window.channels      = this.MIDI.channels
    window.MIDI          = this.MIDI
    window.Max           = this.Max

    window.signals       = this.Max.signals
    window.params        = this.Max.params
    // XXX probably safe to remove old namespace reference...
    window.namespace     = this.Max.message
    window.message       = this.Max.message
    window.devices       = this.Max.devices
    window.patchers      = this.Max.patchers

    window.connect = this.Communication.connect.bind( this.Communication )

    Gibber.__gen.export( window ) 

    this.Theory.export( window )
    this.Utility.export( window )
  },

  init(shouldCreateEnvironment=true ) {
    this.isStandalone = shouldCreateEnvironment

    this.$   = Gibber.Utility.create

    if( this.isStandalone === true ) {
      this.Environment.init( Gibber )
    }

    this.Theory.init( Gibber )
    this.log = this.Environment.log

    if( this.Environment.debug ) {
      this.Scheduler.mockRun()
    }else{
      this.MIDI.init( Gibber )
      this.Communication.init( Gibber ) 
    }

    this.Scheduler.init( this )
    //this.currentTrack = this.Track( this, 1 ) // TODO: how to determine actual "id" from Max?
    
    //this.initSingletons( window )

    this.__gen.init( this )

    this.export()
  },

  singleton( target, key ) {
    if( Array.isArray( key ) ) {
      for( let i = 0; i < key.length; i++ ) {
        Gibber.singleton( target, key[ i ] )
      }
      return
    }
    
    if( target[ key ] !== undefined ) {
      delete target[ key ]
    }

    let proxy = null
    Object.defineProperty( target, key, {
      configurable:true,
      get() { return proxy },
      set(v) {
        if( proxy !== null && proxy.clear ) {
          proxy.clear()
        }
        
        if( proxy !== null && proxy.__listeners !== undefined ) {
          for( let listener of proxy.__listeners ) {
            listener( proxy, v )
          }
        }

        if( proxy !== null && v !== null ) {
          if( proxy.isGen && v.isGen ) {
            for( let key in proxy.sequences ) {
              let sequences = proxy.sequences[ key ]
              for( let sequence of sequences ) {
                sequence.target = v
              }
            }
            v.sequences = proxy.sequences
          }
        }
        proxy = v
      }
    })
  },

  initSingletons: function( target ) {
		var letters = "abcdefghjklmnopqrstuwxyz"
    
		for(var l = 0; l < letters.length; l++) {

			var lt = letters.charAt(l);
      Gibber.singleton( target, lt )
      
    }
  },

  clear() {
    for( let i = 0; i < this.Seq._seqs.length; i++ ){
      this.Seq._seqs[ i ].clear()
    }
    
    if( Gibber.currentTrack !== null && Gibber.isStandalone === true ) {
      setTimeout( () => {
        for( let key in Gibber.currentTrack.markup.textMarkers ) {
          let marker = Gibber.currentTrack.markup.textMarkers[ key ]

          if( Array.isArray( marker ) ) {
            marker.forEach( m => m.clear() )
          }else{
            if( marker.clear ) marker.clear() 
          }
        }
      }, 250 )
    }
    Gibber.Scheduler.clear()
    Gibber.Gen.clear()
    Gibber.Environment.clear()
    Gibber.publish( 'clear' )
    Gibber.initSingletons( window )
  },

  createPubSub() {
    const events = {}
    this.subscribe = function( key, fcn ) {
      if( typeof events[ key ] === 'undefined' ) {
        events[ key ] = []
      }
      events[ key ].push( fcn )
    }

    this.unsubscribe = function( key, fcn ) {
      if( typeof events[ key ] !== 'undefined' ) {
        const arr = events[ key ]

        arr.splice( arr.indexOf( fcn ), 1 )
      }
    }

    this.publish = function( key, data ) {
      if( typeof events[ key ] !== 'undefined' ) {
        const arr = events[ key ]

        arr.forEach( v => v( data ) )
      }
    }
  },

  addSequencingToMethod( obj, methodName, priority, overrideName, mode ) {
    
    if( !obj.sequences ) obj.sequences = {}
    if( overrideName === undefined || overrideName === null ) overrideName = methodName 
    
    let lastId = 0
    if( mode !== undefined && (obj.__client === undefined || obj.__client === null ) ) obj.__client = mode

    obj[ methodName ].seq = function( values, timings, id=0, delay=0 ) {
      let seq
      lastId = id

      if( obj.sequences[ methodName ] === undefined ) obj.sequences[ methodName ] = []

      if( obj.sequences[ methodName ][ id ] ) obj.sequences[ methodName ][ id ].clear()

      obj.sequences[ methodName ][ id ] = seq = Gibber.Seq( values, timings, overrideName, obj, priority, mode )

      // if the target is another sequencer (like for per-sequencer velocity control) it won't
      // have an id property.. use existing trackID property instead.
      seq.trackID = obj.id === undefined ? obj.trackID : obj.id

      if( id === 0 ) {
        obj[ methodName ].values  = obj.sequences[ methodName ][ 0 ].values
        obj[ methodName ].timings = obj.sequences[ methodName ][ 0 ].timings
      }

      obj[ methodName ][ id ] = seq

      if( delay !== 0 ) seq.delay( delay )
      seq.start()

      // avoid this for gibber objects that don't communicate with Live such as Scale
      if( mode === 'live' && obj.id !== undefined ) Gibber.Communication.send( `select_track ${obj.id}` )

      // setup code annotations to place values and widget onto pattern object
      // not gen~ object
      if( typeof values === 'object' && values.isGen ) {
        Gibber.Gen.lastConnected.push( seq.values )
      }
      
      if( typeof timing === 'object' && timings.isGen ) {
        Gibber.Gen.lastConnected.push( seq.timings )
      }

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


  },

  addSequencingToProtoMethod( proto, methodName ) {
    proto[ methodName ].seq = function( values, timings, id = 0 ) {

      if( this.sequences === undefined ) this.sequences = {}

      if( this.sequences[ methodName ] === undefined ) this.sequences[ methodName ] = []

      if( this.sequences[ methodName ][ id ] ) this.sequences[ methodName ][ id ].stop() 

      this.sequences[ methodName ][ id ] = Gibber.Seq( values, timings, methodName, this ).start() // 'this' will never be correct reference

      if( id === 0 ) {
        this.values  = this.sequences[ methodName ][ 0 ].values
        this.timings = this.sequences[ methodName ][ 0 ].timings
      }

      this[ id ] = this.sequences[ methodName ][ id ]
      
      this.seq.stop = function() {
        this.sequences[ methodName ][ 0 ].stop()
        return this
      }.bind( this )

      this.seq.start = function() {
        this.sequences[ methodName ][ 0 ].start()
        return this
      }.bind( this )
    }
  },

  // XXX THIS MUST BE REFACTORED. UGH.
  addMethod( obj, methodName, parameter, _trackID, mode='live' ) {
    let v = mode === 'live' ? parameter.value : 0,
        p,
        trackID = isNaN( _trackID ) ? obj.id : _trackID

    let  seqKey = null
   
    if( mode === 'live' ) {
      seqKey = `${trackID} ${obj.id} ${parameter.id}`
    }else if ( mode === 'max' ){
      seqKey = `${parameter} ${methodName}`
    }else{
      seqKey = methodName
    }

    //console.log( "add method trackID", trackID )

    if( mode === 'live' && methodName === null ) methodName = parameter.name
    
    if( parameter === null ) parameter = ''
    if( typeof methodName === 'string' && methodName.indexOf('cc') === -1 ) {
      Gibber.Seq.proto.externalMessages[ seqKey ] = ( value, beat ) => {
        let msg = mode === 'live' 
          ? `add ${beat} set ${parameter.id} ${value}`
          : `add ${beat} set ${parameter} ${methodName} ${value}`
                
        return msg
      }
    }

    obj[ methodName ] = p = _v => {
      if( p.properties !== null && p.properties.quantized === 1 ) _v = Math.round( _v )

      const hasGen = Gibber.__gen.enabled

      if( _v !== undefined ) {
        _v.__client = mode

        if( typeof _v === 'object' && _v.isGen ) {
          let __v = hasGen === true ? _v.render( 'gen', mode ) : _v.render( 'genish', mode )

          __v.__client = _v.__client = mode

          const __id = isNaN( parameter ) ? parameter.id : parameter+'0000'+_trackID
          if( hasGen ) {
            _v.paramID = __id
            __v.assignTrackAndParamID( trackID, __id ) 
          }else{
            Gibber.__gen.assignTrackAndParamID.call( _v, trackID, __id )
          }
          
          // if a gen is not already connected to this parameter, push
          const prevGen = Gibber.Gen.connected.find( e => e.paramID === __id )
          const genAlreadyAssigned = prevGen !== undefined
          if( genAlreadyAssigned === false && mode !== 'midi' ) {
            Gibber.Gen.connected.push( __v )
          }


          if( hasGen === true && mode !== 'midi' ) { 
            if( mode === 'live' ) {
              Gibber.Communication.send( `gen ${parameter.id} "${__v.out()}"`, 'live' )
            }else{
              Gibber.Communication.send( `sig ${parameter.id} expr "${__v.out()}"`, 'max' )
            } 
            if( genAlreadyAssigned === true ) {
              prevGen.clear()
              prevGen.shouldStop = true
              const idx = Gibber.Gen.connected.findIndex( e => e.paramID === __id )
              Gibber.Gen.connected.splice( idx, 1 )
            }
          }else{
            if( genAlreadyAssigned === true ) {
              prevGen.clear()
              prevGen.shouldStop = true
              const idx = Gibber.Gen.connected.findIndex( e => e.paramID === __id )
              Gibber.Gen.connected.splice( idx, 1 )
            }

            _v.wavePattern = Gibber.WavePattern( _v, null, mode )

            if( mode === 'midi' ) {
              _v.wavePattern.channel = _trackID
              _v.wavePattern.ccnum = parameter
            }
            
            _v.wavePattern.genReplace = function( out ) { 
              if( mode === 'live' ) {
                // set min/max for live only
                out = Math.min( out, 1 )
                out = Math.max( 0, out )
                Gibber.Communication.send( `set ${parameter.id} ${out}` )
              }else if( mode === 'max' ) {
                Gibber.Communication.send( `sig ${parameter.id} expr "out1=${out};"` )
              }
            }

            _v.wavePattern( false )
            __v = _v
          }

          if( mode === 'live' ) Gibber.Communication.send( `select_track ${ trackID }` )

          Gibber.__gen.gen.lastConnected.push( hasGen === true ? __v : _v )
          
          // disconnects for fades etc.
          // XXX reconfigure for hasGen === false
          if( typeof _v.shouldKill === 'object' ) {
            Gibber.Utility.future( ()=> {
              if( hasGen ) {
                Gibber.Communication.send( `ungen ${parameter.id}`, 'live' )
                Gibber.Communication.send( `set ${parameter.id} ${_v.shouldKill.final}` )
              }else{
                Gibber.Communication.send( `ungen ${parameter.id}` )
                //_v.wavePattern.clear()

                const prevGen = Gibber.Gen.connected.find( e => e.paramID === parameter.id )
                prevGen.clear()
                _v.patterns[0].shouldStop = true
                const idx = Gibber.Gen.connected.findIndex( e => e.paramID === parameter.id )
                Gibber.Gen.connected.splice( idx, 1 )
                obj[ methodName ]( _v.shouldKill.final )

                Gibber.Communication.send( `set ${parameter.id} ${_v.shouldKill.final}`, 'live' )
              }
              
              let widget = Gibber.Environment.codeMarkup.waveform.widgets[ parameter.id ]
              if( widget !== undefined && widget.mark !== undefined ) {
                widget.mark.clear()
              }
              delete Gibber.Environment.codeMarkup.waveform.widgets[ parameter.id ]
            }, _v.shouldKill.after )
          }
          
          v = hasGen === true ? __v : _v
        }else{
          v = typeof _v === 'object' && _v.isGen ? ( hasGen === true ? _v.render( 'gen', mode ) : _v.render('genish', mode ) ) : _v
          v.__client = mode
          if( v.isGen ) {
            if( hasGen ) {
              if( mode === 'live' ) {
                Gibber.Communication.send( `ungen ${parameter.id}`, 'live' )
              }
            }

            let widget = Gibber.Environment.codeMarkup.waveform.widgets[ parameter.id ]
            if( widget !== undefined && widget.mark !== undefined ) {
              widget.mark.clear()
            }
            delete Gibber.Environment.codeMarkup.waveform.widgets[ parameter.id ]
          }

         
          if( mode === 'live' ) {
            Gibber.Communication.send( `set ${parameter.id} ${v}`, 'live' )
          }else if( mode === 'max' ) {
            // how to know if this is a signal? shouldn't be assuming this.
            if( parameter !== null ) {
              Gibber.Communication.send( `set ${parameter} ${methodName} ${v}`, 'max' ) 
            }
            // Gibber.Communication.send( `sig ${parameter.id} expr "out1=${v};"`, 'max' )
          }else if( mode === 'midi' ) {
            let msg = [ 0xb0 + _trackID, parameter, v ]

            const __id = isNaN( parameter ) ? parameter.id : parameter+'0000'+_trackID
            const prevGen = Gibber.Gen.connected.find( e => e.paramID === __id )
            if( prevGen !== undefined ) {
              prevGen.clear()
              prevGen.shouldStop = true
              const idx = Gibber.Gen.connected.findIndex( e => e.paramID === __id )
              Gibber.Gen.connected.splice( idx, 1 )
              Gibber.MIDI.send( msg, 100 )
            }else{
              Gibber.MIDI.send( msg, 0 )
            }

          }
        }
      }else{
        return v
      }
    }

    p.properties = parameter

    Gibber.addSequencingToMethod( obj, methodName, 0, seqKey, mode )
  },

  
  addMIDIMethod( obj, methodName, channel, ccnum )  {
    let v = 0,//parameter.value,
        p,
        seqKey = `${channel} cc ${ccnum}`

    //console.log( "add method trackID", trackID )

    Gibber.Seq.proto.externalMessages[ seqKey ] = ( val, offset=null ) => {
      let msg = [ 0xb0 + channel, ccnum, val ]
      const baseTime = offset !== null ? window.performance.now() + offset : window.performance.now()

      Gibber.MIDI.send( msg, baseTime )
    }
    
    obj[ methodName ] = p = ( initialGraph, shouldTransform=true ) => {
      let transformedGraph = null, finishedGraph = null
      //if( p.properties.quantized === 1 ) _v = Math.round( _v )
      
      if( typeof initialGraph === 'object' ) initialGraph.isGen = typeof initialGraph.gen === 'function'

      if( initialGraph !== undefined ) {
        if( typeof initialGraph === 'object' && initialGraph.isGen ) {
          if( shouldTransform === true ) { // affine transform -1:1 to 0:127
            transformedGraph = Gibber.Gen.genish.clamp(
              Gibber.Gen.genish.floor(
                Gibber.Gen.genish.mul( 
                  Gibber.Gen.genish.div( 
                    Gibber.Gen.genish.add( 1, initialGraph ), 
                    2 
                  ), 
                127 
                ) 
              ),
            0, 127 )
          }

          finishedGraph = shouldTransform ?
            Gibber.Gen.genish.gen.createCallback( transformedGraph ) :
            Gibber.Gen.genish.gen.createCallback( initialGraph ) 


          Gibber.Gen.assignTrackAndParamID( finishedGraph, channel, ccnum )
          
          // if a gen is not already connected to this parameter, push
          if( Gibber.Gen.connected.find( e => e.ccnum === ccnum && e.channel === channel ) === undefined ) {
            Gibber.Gen.connected.push( finishedGraph )
          }

          Gibber.Gen.lastConnected = finishedGraph

          if( '__widget__' in initialGraph ) {
            initialGraph.__widget__.place()
          }
          
          // disconnects for fades etc.
          //if( typeof _v.shouldKill === 'object' ) {
          //  Gibber.Utility.future( ()=> {
          //    Gibber.Communication.send( `ungen ${parameter.id}` )
          //    Gibber.Communication.send( `set ${parameter.id} ${_v.shouldKill.final}` )

          //    let widget = Gibber.Environment.codeMarkup.genWidgets[ parameter.id ]
          //    if( widget !== undefined && widget.mark !== undefined ) {
          //      widget.mark.clear()
          //    }
          //    delete Gibber.Environment.codeMarkup.genWidgets[ parameter.id ]
          //  }, _v.shouldKill.after )
          //}
          
          v = finishedGraph
          v.isGen = true
        }else{
          // if there was a gen assigned and now a number is being assigned...
          if( v.isGen ) { 
            console.log( 'removing gen', v )
            let widget = Gibber.Environment.codeMarkup.genWidgets[ v.id ]

            if( widget !== undefined && widget.mark !== undefined ) {
              widget.mark.clear()
            }
            delete Gibber.Environment.codeMarkup.genWidgets[ v.id ]

          }

          v = initialGraph
          Gibber.Seq.proto.externalMessages[ seqKey ]( v )
          //Gibber.Communication.send( `set ${parameter.id} ${v}` )
        }
      }else{
        return v
      }
    }
    
    // solo cc output for midi mapping
    let soloing = false
    obj[ methodName ].solo = function() {
      if( soloing === false ) {
        Gibber.Gen.__solo = { channel, ccnum }
      }else{
        Gibber.Gen.__solo = null
      }

      soloing = !soloing
    }
    //p.properties = parameter

    Gibber.addSequencingToMethod( obj, methodName, 0, seqKey )
  }
}

// must be called before requiring objects that use pubsub
Gibber.createPubSub()

Gibber.Pattern = require( './pattern.js' )( Gibber )
Gibber.Seq     = require( './seq.js' )( Gibber )
Gibber.Score   = require( './score.js' )( Gibber )
Gibber.Arp     = require( './arp.js' )( Gibber )
Gibber.Euclid  = require( './euclidean.js')( Gibber )
Gibber.Automata= require( './automata.js' )( Gibber )
Gibber.Hex     = require( './hex.js')( Gibber )
Gibber.Steps   = require( './steps.js' )( Gibber )
Gibber.HexSteps= require( './hexSteps.js' )( Gibber )
Gibber.Live    = require( './live.js' )( Gibber )
Gibber.Max     = require( './max.js' )( Gibber )
Gibber.Track   = require( './track.js')( Gibber )
Gibber.__gen   = require( './gen_abstraction.js' )( Gibber )

Gibber.Channel = require( './channel.js' )( Gibber )
Gibber.MIDI    = require( './midi.js' )
Gibber.WavePattern = require( './wavePattern.js' )( Gibber )

Gibber.Gen = Gibber.__gen.gen
module.exports = Gibber
