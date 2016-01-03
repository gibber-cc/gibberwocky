var ws     = require( 'ws' ),
    app    = require( 'connect' )(),
    server = require('http').createServer(),
    static = require( 'serve-static' ),
		ROOTDIR       = __dirname + '/../client',
		WEBSERVERPORT = 9080

console.log( 'root directory is', ROOTDIR )

var Server = {
  createServers : function() {
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
    console.log( 'client connection.' )
		
		client.ip = client._socket.remoteAddress;

    
    client.on( 'message', function( _msg ) {
      var msg = JSON.parse( _msg )
      
			console.log( "MSG CODE", msg.code )
    })
  },
}

Server.createServers()
