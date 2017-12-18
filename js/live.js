module.exports = function( Gibber ) {

let Live = {
  init() {
    Gibber.Communication.callbacks.scene = Live.handleScene
    Gibber.Communication.send( 'get_scene' )
  },

  tracks:[],
  master:null,
  returns:[],
  
  handleScene( msg ) {
    Live.id = Communication.querystring.track

    Live.LOM = msg

    Live.processLOM()
  },

  processLOM() {
    Live.tracks = Live.LOM.tracks.map( Live.processTrack )
    Gibber.currentTrack = Live.tracks.find( element => { return element.id === Live.id } )
    
    Live.returns = Live.LOM.returns.map( Live.processTrack )

    Gibber.Live.master = Live.processTrack( Live.LOM.master )

    if( Gibber.currentTrack === undefined ) {
      Gibber.currentTrack = Gibber.Live.master
    }

    for( let track of Live.tracks ) {
      // the next line is for a weird error that occurs when tracks
      // are named with discontinuous numbers; see https://github.com/gibber-cc/gibberwocky.live/issues/8
      if( track === undefined ) continued

      Live.tracks[ track.spec.name ] = track
    }
    
    window.tracks  = Live.tracks
    window.master  = Live.master
    window.returns = Live.returns

    Gibber.Scheduler.bpm = Live.LOM.bpm

    Gibber.Environment.lomView.init( Gibber )

    Gibber.publish( 'lom_update' )
  },

  processTrack( spec, index  ) {
    let track = Gibber.Track( spec )
    track.devices = []
    track.index = index

    spec.devices.forEach( (val, idx ) => {
      Live.processDevice( val, idx, track ) 
    })
    
    if( track.devices[0] !== undefined ) {
      if( track.devices[0].title.includes('gibberwocky') ) {
        track.length = track.devices.length
        track.devices.shift()
        Array.prototype.shift.call( track )
      }
    }
    return track
  },

  processDevice( device, idx, currentTrack ) {
    if( device.name === undefined ) {
      // XXX hack for wavetable bug
      //console.log( 'undefined device name, assuming wavetable:', device )
      device.name = 'Wavetable'
    }

    let d = currentTrack.devices[ device.name ] = currentTrack.devices[ idx ] = currentTrack[ idx ] = { idx },
        parameterCount = 0
    
    //console.log( 'device', device ) 
    if( device.type === 1 ) currentTrack.instrument = d

    d.pickRandomParameter = ()=> {
      let idx = Gibber.Utility.rndi( 0, device.parameters.length - 1 ),
          param = device.parameters[ idx ]
       
      while( param.name === 'Device On' || param.name.indexOf( 'Volume' ) !== -1 ) {
        idx = Gibber.Utility.rndi( 0, device.parameters.length - 1 ),
        param = device.parameters[ idx ]
      }

      return d[ param.name ]
    }

    d.galumph = ( value ) => d.pickRandomParameter()( value )
    d.on =  ()=>  { d.isOn = 1; d['Device On']( d.isOn ) }
    d.off = ()=>  { d.isOn = 0; d['Device On']( d.isOn ) }
    d.toggle = ()=> { d.isOn = d.isOn === 1 ? 0 : 1; d['Device On']( d.isOn ) }

    Gibber.addSequencingToMethod( d, 'galumph' )
    Gibber.addSequencingToMethod( d, 'toggle' )

    device.parameters.forEach( ( spec, idx ) => Gibber.addMethod( d, null, spec, currentTrack.id ) )
    d.parameters = device.parameters.slice( 0 )
    d.name = device.name
    d.title = device.title
  },
}

return Live

}
