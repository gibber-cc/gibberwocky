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

    Gibber.__gen.export( window ) 

    this.Theory.export( window )
    this.Utility.export( window )
  },

  init() {
    this.max = window.max
    this.$   = Gibber.Utility.create


    this.Environment.init( Gibber )
    this.Theory.init( Gibber )
    this.log = this.Environment.log

    if( this.Environment.debug ) {
      this.Scheduler.mockRun()
    }else{
      this.MIDI.init( Gibber )
      this.Communication.init( Gibber ) 
    }

    //this.currentTrack = this.Track( this, 1 ) // TODO: how to determine actual "id" from Max?
    
    this.initSingletons( window )

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

  addSequencingToMethod( obj, methodName, priority, overrideName ) {
    
    if( !obj.sequences ) obj.sequences = {}
    if( overrideName === undefined ) overrideName = methodName 
    
    let lastId = 0
    obj[ methodName ].seq = function( values, timings, id=0, delay=0 ) {
      let seq
      lastId = id

      if( obj.sequences[ methodName ] === undefined ) obj.sequences[ methodName ] = []

      if( obj.sequences[ methodName ][ id ] ) obj.sequences[ methodName ][ id ].clear()

      obj.sequences[ methodName ][ id ] = seq = Gibber.Seq( values, timings, overrideName, obj, priority )

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
      if( obj.id !== undefined ) Gibber.Communication.send( `select_track ${obj.id}` )

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
  addMethod( obj, methodName, parameter, _trackID ) {
    let v = parameter.value,
        p,
        trackID = isNaN( _trackID ) ? obj.id : _trackID,
        seqKey = `${trackID} ${obj.id} ${parameter.id}`

    //console.log( "add method trackID", trackID )

    if( methodName === null ) methodName = parameter.name

    Gibber.Seq.proto.externalMessages[ seqKey ] = ( value, beat ) => {
      let msg = `add ${beat} set ${parameter.id} ${value}` 
      return msg
    }

    obj[ methodName ] = p = ( _v ) => {
      if( p.properties.quantized === 1 ) _v = Math.round( _v )

      const hasGen = Gibber.__gen.enabled

      if( _v !== undefined ) {
        if( typeof _v === 'object' && _v.isGen ) {
          let __v = hasGen === true ? _v.render( 'gen' ) : _v.render( 'genish' )

          if( hasGen ) {
            __v.assignTrackAndParamID( trackID, parameter.id )
          }else{
            Gibber.__gen.assignTrackAndParamID.call( _v, trackID, parameter.id )
          }
          
          // if a gen is not already connected to this parameter, push
          const prevGen = Gibber.Gen.connected.find( e => e.paramID === parameter.id )
          const genAlreadyAssigned = prevGen !== undefined
          if( genAlreadyAssigned === true ) {
            Gibber.Gen.connected.push( __v )
          }

          if( hasGen === true ) { 
            Gibber.Communication.send( `gen ${parameter.id} "${__v.out()}"` )
          }else{
            if( genAlreadyAssigned === true ) {
              prevGen.clear()
              prevGen.shouldStop = true
              const idx = Gibber.Gen.connected.findIndex( e => e.paramID === parameter.id )
              Gibber.Gen.connected.splice( idx, 1 )
            }

            _v.wavePattern = Gibber.WavePattern( _v )
            
            _v.wavePattern.genReplace = function( out ) { 
              // XXX set min/max for gibberwocky.live only
              out = Math.min( out, 1 )
              out = Math.max( 0, out )

              Gibber.Communication.send( `set ${parameter.id} ${out}` )
            }

            _v.wavePattern( false )
            __v = _v
          }

          Gibber.Communication.send( `select_track ${ trackID }` )

          Gibber.__gen.gen.lastConnected.push( hasGen === true ? __v : _v )
          
          // disconnects for fades etc.
          // XXX reconfigure for hasGen === false
          if( typeof _v.shouldKill === 'object' ) {
            Gibber.Utility.future( ()=> {
              if( hasGen ) {
                Gibber.Communication.send( `ungen ${parameter.id}` )
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

                Gibber.Communication.send( `set ${parameter.id} ${_v.shouldKill.final}` )
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
          if( v.isGen ) {
            if( hasGen ) {
              Gibber.Communication.send( `ungen ${parameter.id}` )
            }

            let widget = Gibber.Environment.codeMarkup.waveform.widgets[ parameter.id ]
            if( widget !== undefined && widget.mark !== undefined ) {
              widget.mark.clear()
            }
            delete Gibber.Environment.codeMarkup.waveform.widgets[ parameter.id ]
          }

          v = typeof _v === 'object' && _v.isGen ? ( hasGen === true ? _v.render( 'gen' ) : _v.render('genish') ) : _v

          Gibber.Communication.send( `set ${parameter.id} ${v}` )
        }
      }else{
        return v
      }
    }

    p.properties = parameter

    Gibber.addSequencingToMethod( obj, methodName, 0, seqKey )
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
Gibber.Track   = require( './track.js')( Gibber )
Gibber.__gen   = require( './gen_abstraction.js' )( Gibber )

Gibber.Channel = require( './channel.js' )( Gibber )
Gibber.MIDI    = require( './midi.js' )
Gibber.WavePattern = require( './wavePattern.js' )( Gibber )

Gibber.Gen = Gibber.__gen.gen
module.exports = Gibber
