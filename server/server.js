var ws     = require( 'ws' ),
    app    = require( 'connect' )(),
    server = require('http').createServer(),
    static = require( 'serve-static' ),
		ROOTDIR       = __dirname + '/../client',
		WEBSERVERPORT = 9080

console.log( "ROOT IS ", root )
var Server = {
  createServers : function() {
		/*
     *if this.servers[ port ] ) return this.servers[ port ]
     *
     *var server = new ( require( 'ws' ).Server )({ 'port': port })
     *
     *server.clients = {} // TODO: this is already an array defined by the ws module.
     *
     *server.on( 'connection', this.onClientConnection.bind( server ) )
     *
     *server.output = function( path, typetags, values ) { // TODO: you should be able to target individual clients
     *  for( var i = 0; i < server.clients.length; i++ ) {
     *    var client = server.clients[ i ]
     *    client.send( JSON.stringify({ 'key': path, 'values': Array.isArray( values ) ? values : [ values ] }) )
     *  }
     *}
     *
     *WS.servers[ port ] = server
     *
     *this.emit( 'WebSocket server created', server, port )
		 */
    this.createHTTPServer()
    this.createWebSocketServer()	
  },

	createWebSocketServer: function() {
	 this.wss = new ws.Server({ server: server })
	 this.wss.on( 'connection', this.onClientConnection )
   server.on( 'request', app )
	 server.listen( WEBSERVERPORT, function() { console.log( 'listening...' ) } )
	},

  createHTTPServer: function() {
    this.httpServer = app.use( static( ROOTDIR ) )
  },

  onClientConnection : function( client ) { // "this" is bound to a ws server
		console.log( 'CONNECTION', client )
    client.ip = client._socket.remoteAddress;
    //  this.clients[ client.ip ] = WS.clients[ client.ip ] = client
    
    client.on( 'message', function( _msg ) {
      var msg = JSON.parse( _msg )
      
			console.log( "MSG CODE", msg.code )
    })
    
		/*
     *client.on( 'close', function() {
     *  delete WS.clients[ client.ip ]
     *})
		 */
    
  },
}

Server.createServers()
