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
    Live.LOM.tracks.forEach( Live.processTrack )
    
    Gibber.currentTrack = Live.tracks.find( (element)=> { return element.id = Live.id } )
    
    Gibber.Live.master = Gibber.Track( Live.id, Live.LOM.master )
    
    for( let i = 0; i < Live.LOM.returns.length; i++ ) {
      let spec = Live.LOM.returns[ i ]
      Live.returns[ i ] = Gibber.Track( Live.id, spec )
    }

    window.tracks = Live.tracks
    window.master = Live.master
    window.returns = Live.returns
  },

  processMaster() {

  },

  processTrack( track, idx ) {
    let deviceCount = 0, currentTrack
    Live.tracks[ idx ] = currentTrack = Gibber.Track( Live.id, track )
    currentTrack.devices = []

    track.devices.forEach( Live.processDevice, currentTrack )
  },

  processDevice( device, idx ) {
    let currentTrack = this,
        d = currentTrack.devices[ device.title ] = currentTrack.devices[ idx ] = { idx },
        parameterCount = 0
    
    d.pickRandomParameter = ()=> {
      let idx = Gibber.Utility.rndi( 0, device.parameters.length - 1 ),
          param = device.parameters[ idx ]
       
      while( param.name === 'Device On' ) {
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

    device.parameters.forEach( ( spec, idx ) => Gibber.addMethod( d, null, spec ) )
  },
}

return Live

}
