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

      for( let parameter of device.parameters ) {
        let v = parameter.value,
            p,
            seqKey = `${Live.id} ${device.title} ${parameter.name}`

        Gibber.Seq.proto.externalMessages[ seqKey ] = ( value, beat, beatOffset ) => {
          //Gibber.Communication.send( '0 add 1 0 set 0 live_set tracks 0 devices 1 parameters 2' )
          let msg = `${Gibber.Live.id} add ${beat} ${beatOffset} set ${value} live_set tracks ${Live.id} devices ${d.idx} parameters ${p.idx}` 
          //console.log( msg )
          return msg
        }

        d[ parameter.name ] = p = ( _v ) => {
          if( _v !== undefined ) {
            v = _v
          }else{
            return v
          }
        }
        p.idx = parameterCount++
        console.log( seqKey, parameter.name  )
        Gibber.addSequencingToMethod( d, parameter.name, 0, seqKey )
      }
    }
  }
}

return Live

}
