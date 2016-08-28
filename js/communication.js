let Gibber = null

let Communication = {
  webSocketPort: 8081, // default?
  socketInitialized: false,
  debug: false,
  
  init( _Gibber ) { 
    //console.log(' Communication init' )
    Gibber = _Gibber
    this.createWebSocket()
    this.send = this.send.bind( Communication )
  },

  createWebSocket() {
    if ( this.connected ) return

    if ( 'WebSocket' in window ) {
      //Gibber.log( 'Connecting' , this.querystring.host, this.querystring.port )
      Gibber.log( 'initializing...' )
      let host = this.querystring.host || '127.0.0.1',
          port = this.querystring.port || '8081',
          address = "ws://" + host + ":" + port
      
      //Gibber.log( "ADDRESS", address )
      this.wsocket = new WebSocket( address )
      
      this.wsocket.onopen = function(ev) {        
        //Gibber.log( 'CONNECTED to ' + address )
        Gibber.log('gibberwocky is ready to burble.')
        this.connected = true
        
        Gibber.Live.init()
        // cancel the auto-reconnect task:
        if ( this.connectTask !== undefined ) clearTimeout( this.connectTask )
          
        // apparently this first reply is necessary
        this.wsocket.send( 'update on' )
      }.bind( Communication )

      this.wsocket.onclose = function(ev) {
        Gibber.log( 'disconnected from ' + address )
        this.connected = false

        // set up an auto-reconnect task:
        this.connectTask = setTimeout( this.createWebSocket.bind( Communication ) , 1000 )
      }.bind( Communication )

      this.wsocket.onmessage = function( ev ) {
        //Gibber.log('msg:', ev )
        this.handleMessage( ev )
      }.bind( Communication )

      this.wsocket.onerror = function( ev ) {
        Gibber.log( 'WebSocket error' )
      }.bind( Communication )

    } else {
      post( 'WebSockets are not available in this browser!!!' );
    }
  
  },

  callbacks: {},
  count:0,
  handleMessage( _msg ) {
    // key and data are separated by a space
    // TODO: will key always be three characters?
    
    let msg, isObject = false, id, key, data
    
    if( _msg.data.charAt( 0 ) === '{' ) {
      data = _msg.data
      isObject = true
      key = null
    }else{
      msg = _msg.data.split( ' ' )
      id = msg[ 0 ]
      key = msg[ 1 ]
      data = msg[ 2 ]
    }
    
    if( id !== Gibber.Live.id ) return

    //let key = msg.data.substr( 1,4 ), data = msg.data.substr( 5 )
    switch( key ) {
      case 'seq' :
        if( data === undefined ) {
          console.log( 'faulty ws seq message', _msg.data )
        }else{
          //console.log( 'WS', key, data )
          Gibber.Scheduler.seq( data );
        }
        break;
      case 'clr' :
        Gibber.Environment.console.setValue('')
        break;
      case 'bpm' :
        Gibber.Scheduler.bpm = data
        break;
      default:
        if( isObject ) {
          if( Communication.callbacks.scene ) {
            Communication.callbacks.scene( JSON.parse( data ) )
          }
        }
        //console.log( 'MSG', msg )
        break;
    }
  },

  send( code ) {
    if( Communication.connected ) {
      if( Communication.debug ) console.log( 'beat:', Gibber.Scheduler.currentBeat, 'msg:', code  )
      Communication.wsocket.send( code )
    }
  },

  querystring : null,
}

let qstr = window.location.search,
    query = {},
    a = qstr.substr( 1 ).split( '&' )

for ( let i = 0; i < a.length; i++ ) {
  let b = a[ i ].split( '=' )
  query[ decodeURIComponent( b[0]) ] = decodeURIComponent( b[1] || '' )
}

Communication.querystring =  query

module.exports = Communication
