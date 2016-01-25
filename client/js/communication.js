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

var Gibber = null
var mul = 1

var Communication = {
  inputMode:null,
  outputMode:null,
  webSocketPort: 8081, // default?
  socketInitialized: false,
  
  init: function( _Gibber ) { // {inputMode, outputMode ) {
    Gibber = _Gibber
    
/*
 *    if( inputMode !== undefined ) {
 *      if( typeof inputMode === 'string' ) {
 *        this.inputMode = modes.indexOf( inputMode )
 *      }else{
 *        this.inputMode = inputMode
 *      }
 *    }
 *    if( outputMode !== undefined ) {
 *      if( typeof outputMode === 'string' ) {
 *        this.outputMode = modes.indexOf( outputMode )
 *      }else{
 *        this.outputMode = outputMode
 *      }
 *    }
 *
 */
    this.createWebSocket()
  },

  createWebSocket: function() {
    if ( this.connected ) return

    if ( 'WebSocket' in window ) {
        Gibber.log( 'Connecting' , this.querystring.host, this.querystring.port );
        var host = this.querystring.host || '127.0.0.1' //'localhost'
        var port = this.querystring.port || '8081'
        var address = "ws://" + host + ":" + port// + '/maxmsp' ;
        Gibber.log( address )
        this.wsocket = new WebSocket(address);
        this.wsocket.onopen = function(ev) {        
            Gibber.log( 'CONNECTED to ' + address )
            this.connected = true
            // cancel the auto-reconnect task:
            if ( this.connectTask !== undefined ) clearInterval( this.connectTask )
            // apparently this first reply is necessary
            var message = 'update on'
            Gibber.log( 'SENT: ' + message )
            this.wsocket.send( message )
        }.bind( Communication );

        this.wsocket.onclose = function(ev) {
            Gibber.log( 'DISCONNECTED from ' + address )
            this.connected = false;
            // set up an auto-reconnect task:
            this.connectTask = setInterval( this.createWebSocket.bind( Communication ) , 1000);
        }.bind( Communication )

        this.wsocket.onmessage = function(ev) {
          // Gibber.log('msg:', ev )
          if( ev.data.substr(0, 4) === "seq ") {
            this.handleMessage( ev.data.substr(4) );
          }
        }.bind( Communication )

        this.wsocket.onerror = function(ev) {
          Gibber.log( 'WebSocket error' )
        }.bind( Communication )

      } else {
          post("WebSockets are not available in this browser!!!");
      }

/*
 *    var expr, socketAndIPPort, socketString
 *
 *    expr = /[-a-zA-Z0-9.]+(:(6553[0-5]|655[0-2]\d|65[0-4]\d{2}|6[0-4]\d{3}|[1-5]\d{4}|[1-9]\d{0,3}))/
 *
 *    socketIPAndPort = expr.exec( window.location.toString() )[0]
 *    socketIPAndPort = socketIPAndPort.split( ':' )
 *
 *    socketString = 'ws://' + socketIPAndPort[0] + ':' + ( parseInt( socketIPAndPort[1] ) )
 *
 *    this.websocket = new WebSocket( socketString ) 
 *    this.websocket.onopen = function() { this.socketInitialized = true }.bind( Communication ) 
 *    this.websocket.onmessage = Communication.onSocketMessage.bind( Communication )
 */
  
  },

  handleMessage: function( msg ) {
    this.seq( msg )
  },

  seq : function( beat ) {
    if (beat == 0) {
      mul = 1 + (mul % 4);
    }
    var msgarr = []; 
    // generate some randomized beats:
    var div = Math.pow(2, (beat+mul+1) % 5);
    var lim = 1;
    for (var i=0; i<lim; i++) {
      // timestamp within beat (0..1)
      var t = i/lim; //random(div)/div;
      // MIDI note value
      var n = 36 + (beat*3)%16; //notes[beat % notes.length]; //pick(notes)
      // MIDI velocity
      var v = (1-t) * (1-t) * (1-t) * 100; //64 + random(32);
      // duration (ms)
      var d = (beat+1) * (beat+1) * (t+1) * 6;
      // seq~ schedule format:
      // add <seqid> <phase> <arguments...>
      // seqid is the beat number
      // phase is 0..1 within that beat
      // arguments is a max message, as space-delimited strings and numbers
      var msgstring = "add " + beat + " " + t + " " + n + " " + v + " " + d
      msgarr.push( msgstring )
      // Gibber.log( msgstring )
    }
    this.send( msgarr ) // sends array as comma-delimited strings
  },

  send: function( code ) {
    //this.senders[ this.outputMode ].send( code )
    this.wsocket.send( code )
  },

  querystring : (function() {
    var qstr = window.location.search
    var query = {}
    var a = qstr.substr(1).split('&')
    for (var i = 0; i < a.length; i++) {
      var b = a[i].split('=')
      query[ decodeURIComponent( b[0]) ] = decodeURIComponent( b[1] || '' )
    }
    return query
  })(),

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
