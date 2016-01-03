var ws     = require( 'ws' ),
    app    = require( 'connect' )(),
    server = require('http').createServer(),
    static = require( 'serve-static' ),
		root   = __dirname + '/../client',
		http   = require( 'http' ),
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
   server.on( 'request', app )
	 console.log( this.wss )
	 server.listen( WEBSERVERPORT, function() { console.log( 'listening...' ) } )
	},

  createHTTPServer: function() {
		/*
     *var serveInterfaceJS = function(req, res, next){
     *  req.uri = url.parse( req.url );
     *  
     *  if( req.uri.pathname == "/interface.js" ) {
     *    res.writeHead( 200, {
     *      'Content-Type': 'text/javascript',
     *      'Content-Length': interfaceJS.length
     *    })
     *    res.end( interfaceJS );
     *    
     *    return;
     *  }
     *  
     *  next();
     *};
		 */

    this.httpServer = app
      //.use( directory( root, { hidden:false,icons:true } ) )
      //.use( serveInterfaceJS )
      .use( static( root ) )
      // .listen( WEBSERVERPORT );
  },

  onClientConnection : function( client ) { // "this" is bound to a ws server
    client.ip = client._socket.remoteAddress;
    this.clients[ client.ip ] = WS.clients[ client.ip ] = client
    
    client.on( 'message', function( msg ) {
      msg = JSON.parse( msg )
      msg.values.unshift( msg.key ) // switchboard.route accepts one array argument with path at beginning
      var response = WS.app.switchboard.route.call( WS.app.switchboard, msg.values, null ),
          stringified = null
      
      try {
        stringified = JSON.stringify({ 'key': msg.key, 'values':[ response ] })
      }catch (e) {
        console.log( "Could not create response message for " + msg.key, "::", e )
      }
      
      if( stringified !== null ) {
        client.send( stringified )
      }
    })
    
    client.on( 'close', function() {
      delete WS.clients[ client.ip ]
      WS.emit( 'WebSocket client closed', client.ip )
    })
    
    WS.emit( 'WebSocket client opened', client.ip )
  },
}

Server.createServers()
