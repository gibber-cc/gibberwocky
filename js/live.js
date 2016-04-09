module.exports = function( Gibber ) {

let Live = {
  init() {
    Gibber.Communication.callbacks.scene = Live.handleScene
    Gibber.Communication.send( 'get_scene' )
  },
  
  handleScene( msg ) {
    Live.id = Communication.querystring.track

    Gibber.log( 'LIVE ID = ', Live.id )
    Live.LOM = msg

    Live.processLOM()
  },

  processLOM() {
    let track = Live.LOM.tracks[ Live.id ]
    Gibber.currentTrack.devices = {}

    let deviceCount = 0
    for( let device of track.devices ) {
      let d = Gibber.currentTrack.devices[ device.title ] = { idx:deviceCount++ },
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

      for( let parameter of device.parameters ) {
        let v = parameter.value,
            p,
            seqKey = `${Live.id} ${device.title} ${parameter.name}`

        Gibber.Seq.proto.externalMessages[ seqKey ] = ( value, beat, beatOffset ) => {
          let msg = `${Gibber.Live.id} add ${beat} ${beatOffset} set ${parameter.id} ${value}` 
          return msg
        }

        d[ parameter.name ] = p = ( _v ) => {
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
        p.idx = parameterCount++
        Gibber.addSequencingToMethod( d, parameter.name, 0, seqKey )
      }
    }
  }
}

return Live

}
