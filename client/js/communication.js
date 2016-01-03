!function () {

const WEBSOCKET = 0,
      MAXOBJECT = 1,
      WINDOW    = 2,
      EXECUTE   = 3

const modes = [
  'websocket',
  'maxobject',
  'window.open',
  'executejavascript'
]

var Communication = {
  inputMode:null,
  outputMode:null,
  webSocketPort: 9090, // default?
  socketInitialized: false,
  
  init: function( inputMode, outputMode ) {
    if( inputMode !== undefined ) {
      if( typeof inputMode === 'string' ) {
        this.inputMode = modes.indexOf( inputMode )
      }else{
        this.inputMode = inputMode
      }
    }
    if( outputMode !== undefined ) {
      if( typeof outputMode === 'string' ) {
        this.outputMode = modes.indexOf( outputMode )
      }else{
        this.outputMode = outputMode
      }
    }

    if( inputMode === 0 || outputMode === 0 ) {
      this.createWebSocket()
    }
  },

  createWebSocket: function() {
    var expr, socketAndIPPort, socketString

    expr = /[-a-zA-Z0-9.]+(:(6553[0-5]|655[0-2]\d|65[0-4]\d{2}|6[0-4]\d{3}|[1-5]\d{4}|[1-9]\d{0,3}))/

    socketIPAndPort = expr.exec( window.location.toString() )[0]
    socketIPAndPort = socketIPAndPort.split( ':' )

    socketString = 'ws://' + socketIPAndPort[0] + ':' + ( parseInt( socketIPAndPort[1] ) )

    this.websocket = new WebSocket( socketString ) 
    this.websocket.onopen = function() { this.socketInitialized = true }.bind( Communication ) 
    this.websocket.onmessage = Communication.onSocketMessage.bind( Communication )
  
  },

  send: function( code ) {
    this.senders[ this.outputMode ].send( code )
  },

  senders: [
    {
      name:'websocket',
      send: function( code ) {
        Communication.websocket.send( JSON.stringify({ 'code':code }) )
      }
    }

  ],


  onSocketMessage: function( _msg ) {
    var msg

    try {
      msg = JSON.parse( _msg.data )
    }catch( error ){ 
      console.log( 'ill-formed web socket message: ' + _msg.data )
    }

    console.log( msg )

    switch( msg.address ) {
      case 'updateVisulization':
        break;
      case 'eval':
        break;
      default:
        break;  
    }

  },


}

module.exports = Communication

}()
