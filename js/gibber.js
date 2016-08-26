let Gibber = {
  Utility:       require( './utility.js' ),
  Communication: require( './communication.js' ),
  Environment:   require( './environment.js' ),
  Scheduler:     require( './clock.js' ),
  Theory:        require( './theory.js' ),
  Live:          null,
  Track:         null,
  Gen:           null,
  Euclid:        null,
  Seq:           null,
  Score:         null,
  Pattern:       null,
  Arp:           null,
  lomView:       require( './lomView.js' ),
  currentTrack:  null,
  codemirror:    null,
  max:           null,
  '$':           null,

  export() {
    window.Steps         = this.Steps
    window.Seq           = this.Seq
    window.Score         = this.Score
    window.Track         = this.Track
    window.Scheduler     = this.Scheduler
    window.Pattern       = this.Pattern
    window.Euclid        = this.Euclid
    window.Arp           = this.Arp
    window.Communication = this.Communication
    window.log           = this.log
    window.Theory        = this.Theory
    window.Scale         = this.Theory.Scale.master
    
    Gibber.Gen.export( window )

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
      this.Communication.init( Gibber ) 
    }

    //this.currentTrack = this.Track( this, 1 ) // TODO: how to determine actual "id" from Max?
    
    this.initSingletons( window )

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
      get() { return proxy },
      set(v) {
        if( proxy && proxy.clear ) {
          proxy.clear()
        }

        proxy = v
      }
    })
  },

  initSingletons: function( target ) {
		var letters = "abcdefghijklmnopqrstuvwxyz"
    
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

      if( marker.clear ) marker.clear() 
    }
    }, 500 )
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
      seq.trackID = obj.id

      if( id === 0 ) {
        obj[ methodName ].values  = obj.sequences[ methodName ][ 0 ].values
        obj[ methodName ].timings = obj.sequences[ methodName ][ 0 ].timings
      }

      obj[ methodName ][ id ] = seq

      seq.delay( delay )
      seq.start()
 
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

  addMethod( obj, methodName, parameter, _trackID ) {
    let v = parameter.value,
        p,
        trackID = isNaN( _trackID ) ? obj.id : _trackID,
        seqKey = `${trackID} ${obj.id} ${parameter.id}`

    //console.log( "add method trackID", trackID )

    if( methodName === null ) methodName = parameter.name

    Gibber.Seq.proto.externalMessages[ seqKey ] = ( value, beat, beatOffset ) => {
      let msg = `${trackID} add ${beat} ${beatOffset} set ${parameter.id} ${value}` 
      return msg
    }
    
    obj[ methodName ] = p = ( _v ) => {
      if( p.properties.quantized === 1 ) _v = Math.round( _v )
      if( _v !== undefined ) {
        if( typeof _v === 'object' && _v.isGen ) {
          _v.assignParamID( parameter.id )
          Gibber.Communication.send( `${trackID} gen ${parameter.id} "${_v.out()}"` )
        }else{
          v = _v
          Gibber.Communication.send( `${trackID} set ${parameter.id} ${v}` )
        }
      }else{
        return v
      }
    }

    p.properties = parameter

    Gibber.addSequencingToMethod( obj, methodName, 0, seqKey )
  }
}

Gibber.Pattern = require( './pattern.js' )( Gibber )
Gibber.Seq     = require( './seq.js' )( Gibber )
Gibber.Score   = require( './score.js' )( Gibber )
Gibber.Arp     = require( './arp.js' )( Gibber )
Gibber.Euclid  = require( './euclidean.js')( Gibber )
Gibber.Gen     = require( './gen.js' )( Gibber )
Gibber.Steps   = require( './steps.js' )( Gibber )
Gibber.Live    = require( './live.js' )( Gibber )
Gibber.Track   = require( './track.js')( Gibber )

module.exports = Gibber
