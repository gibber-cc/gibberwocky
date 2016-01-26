!function () {

var Gibber = null

var Communication = {
  inputMode:null,
  outputMode:null,
  webSocketPort: 8081, // default?
  socketInitialized: false,
  
  init: function( _Gibber ) { 
    Gibber = _Gibber
    this.createWebSocket()
    this.send = this.send.bind( Communication )
  },

  createWebSocket: function() {
    if ( this.connected ) return

    if ( 'WebSocket' in window ) {
      Gibber.log( 'Connecting' , this.querystring.host, this.querystring.port );
      var host = this.querystring.host || '127.0.0.1' //'localhost'
      var port = this.querystring.port || '8081'
      var address = "ws://" + host + ":" + port// + '/maxmsp' ;
      this.wsocket = new WebSocket(address);
      this.wsocket.onopen = function(ev) {        
          Gibber.log( 'CONNECTED to ' + address )
          this.connected = true
          // cancel the auto-reconnect task:
          if ( this.connectTask !== undefined ) clearInterval( this.connectTask )
          // apparently this first reply is necessary
          var message = 'update on'
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
        this.handleMessage( ev )
      }.bind( Communication )

      this.wsocket.onerror = function(ev) {
        Gibber.log( 'WebSocket error' )
      }.bind( Communication )

    } else {
        post("WebSockets are not available in this browser!!!");
    }
  
  },

  handleMessage: function( msg ) {
    // key and data are separated by a space
    // TODO: will key always be three characters?

    var key = msg.data.substr( 0,3 ), data = msg.data.substr( 4 )
    switch( key ) {
      case 'seq' :
        if( data === undefined ) {
          console.log( 'FAULTY WS SEQ MESSAGE', msg.data )
        }else{
          // console.log( 'WS', msg.data, key, data )
          Gibber.Scheduler.seq( data );
        }
        break;
      case 'clr' :
        Gibber.Environment.console.setValue('')
        break;
      default:
        break;
    }
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
}

module.exports = Communication

}()
