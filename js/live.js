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

    Gibber.log( 'LIVE ID = ', Live.id )
    Live.LOM = msg

    Live.processLOM()
  },

  processLOM() {
    Live.LOM.tracks.forEach( Live.processTrack )
    Gibber.currentTrack = Live.tracks.find( (element)=> { return element.id = Live.id } )
    window.tracks = Live.tracks
  },

  processMaster() {

  },

  processTrack( track, idx ) {
    //track.devices = {}
    let deviceCount = 0, currentTrack
    console.log( 'TRACK ID', track.id, idx )
    Live.tracks[ idx ] = currentTrack = Gibber.Track( Gibber, idx )
    currentTrack.devices = []
    currentTrack.panning = track.panning
    currentTrack.valume  = track.volume
    currentTrack.sends   = track.sends

    track.devices.forEach( Live.processDevice, currentTrack )

    //for( let device of track.devices ) {
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

    for( let parameter of device.parameters ) {
      let v = parameter.value,
          p,
          seqKey = `${Live.id} ${device.title} ${parameter.name}`

      Gibber.Seq.proto.externalMessages[ seqKey ] = ( value, beat, beatOffset ) => {
        let msg = `${Gibber.Live.id} add ${beat} ${beatOffset} set ${parameter.id} ${value}` 
        return msg
      }

      d[ parameter.name ] = p = ( _v ) => {
        if( p.properties.quantized === 1 ) _v = Math.round( _v )

        if( _v !== undefined ) {
          if( typeof _v === 'object' && _v.isGen ) {
            _v.assignParamID( parameter.id )
            Gibber.Communication.send( `${Gibber.Live.id} gen ${parameter.id} "${_v.out()}"` )
          }else{
            v = _v
            Gibber.Communication.send( `${Gibber.Live.id} set ${parameter.id} ${v}` )
          }
        }else{
          return v
        }
      }

      p.properties = parameter

      p.idx = parameterCount++
      Gibber.addSequencingToMethod( d, parameter.name, 0, seqKey )
    }
  },
}

return Live

}
