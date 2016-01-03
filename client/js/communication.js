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
    if( typeof inputMode !== undefined ) {
      if( typeof inputMode === 'string' ) {
        this.inputMode = modes.indexOf( inputMode )
      }else{
        this.inputMode = inputMode
      }
    }
    if( typeof outputMode !== undefined ) {
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
    var port = typeof arguments[ 0 ] === undefined ? this.webSocketPort : arguments[ 0 ]

    this.websocket = new WebSocket( 'ws://127.0.0.1:' + port ) 
    this.websocket.onopen = function() { this.socketInitialized = true }.bind( Communication )
    this.websocket.onmessage = Communication.onSocketMessage.bind( Communication )
  
  },

  onSocketMessage: function( _msg ) {
    var msg

    try() {
      msg = JSON.parse( _msg.data )
    }catch( error ){ 
      console.log( 'ill-formed web socket message: ' + _msg.data )
    }

    swith( msg.address ) {
      case 'updateVisulization':
        break;
      case 'eval':
        break;
      default:
        break;  
    }

  },


}


}()
