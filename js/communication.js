let Gibber = null

let Communication = {
  livePort: 8081,
  maxPort:  8082,
  socketInitialized: false,
  connectMsg: null,
  debug: {
    input:false,
    output:false
  },

  liveSocket:null,
  maxSocket: null,

  callbacks: {
    schemas: {
      live:null,
      max: null
    }
  },


  count:0,
  init( _Gibber ) { 
    Gibber = _Gibber

    this.liveSocket = this.createWebSocket( Gibber.Live.init, this.livePort, '127.0.0.1', 'live' )
    this.maxSocket  = this.createWebSocket( Gibber.Max.init,  this.maxPort,  '127.0.0.1', 'max'  )

    this.send = this.send.bind( Communication )
  },

  createWebSocket( init, port=8081, host='127.0.0.1', clientName ) {
    if ( this.connected ) return

    if ( 'WebSocket' in window ) {
      //Gibber.log( 'Connecting' , this.querystring.host, this.querystring.port )
      if( this.connectMsg === null ) { 
        this.connectMsg = Gibber.log( 'connecting' )
      }else{
        this.connectMsg.innerText += '.'
      }

      const address = "ws://" + host + ":" + port
      
      this.wsocket = new WebSocket( address )
      
      this.wsocket.onopen = function(ev) {        
        //Gibber.log( 'CONNECTED to ' + address )
        Gibber.log( `gibberwocky.${clientName} is ready to burble.` )
        this.connected = true
        
        init()
        // cancel the auto-reconnect task:
        if ( this.connectTask !== undefined ) clearTimeout( this.connectTask )
          
        // apparently this first reply is necessary
        this.wsocket.send( 'update on' )
      }.bind( Communication )

      this.wsocket.onclose = function(ev) {
        if( this.connected ) {
          Gibber.log( 'disconnected from ' + address )
          this.connectMsg = null
          this.connected = false
        }

        // set up an auto-reconnect task:
        this.connectTask = setTimeout( this.createWebSocket.bind( Communication ) , 2000 )
      }.bind( Communication )

      let socket = this.wsocket
      this.wsocket.onmessage = function( ev ) {
        //Gibber.log('msg:', ev )
        this.handleMessage( ev, socket )
      }.bind( Communication )

      this.wsocket.onerror = function( ev ) {
        Gibber.log( 'WebSocket error' )
      }.bind( Communication )

      this.wsocket.clientName = clientName

    } else {
      post( 'WebSockets are not available in this browser!!!' );
    }

    return this.wsocket
  },



  handleMessage( _msg, socket ) {
    let id, key, data, msg, isLiveMsg=true
    
    if( _msg.data.charAt( 0 ) === '{' ) {
      data = _msg.data
      key = null
      const json = JSON.parse( data )
      const schema = json.namespaces !== undefined ? 'max' : 'live'

      if( Communication.callbacks.schemas[ schema ] ) {
        Communication.callbacks.schemas[ schema]( JSON.parse( data ) )
      }
    }else if( _msg.data.includes( 'snapshot' ) ) {
      data = _msg.data.substr( 9 ).split(' ')
      for ( let i = 0; i < data.length; i += 2 ) {
        let param_id = data[ i ]
        let param_value = data[ i+1 ] 

        if( socket === Communication.liveSocket ) {
          if( param_value < 0 ) {
            param_value = 0
          }else if( param_value > 1 ) {
            param_value = 1
          }
        }
          
        Gibber.Environment.codeMarkup.waveform.updateWidget( param_id, 1 - param_value )
      }

      return
    }else{
      msg = _msg.data.split( ' ' )

      isLiveMsg = msg.length > 2

      if( isLiveMsg ) {
        id = msg[ 0 ]
        key = msg[ 1 ]
        data = msg.slice( 2 )

        if( key === 'err' ) data = data.join(' ')

      }else{
        key = msg[ 0 ]
        if( key === 'err' ) {
          data = msg.slice( 1 ).join( ' ' )
        }else{
          data = msg[ 1 ]
        }
      }
    }
    
    if( id === undefined && isLiveMsg === true ) return

    if( Communication.debug.input ) {
      if( id !== undefined ) { 
        Gibber.log( 'debug.input:', id, key, data )
      }else{
        Gibber.log( 'debug.input (obj):', JSON.parse( data ) )
      }
    }

    switch( key ) {
      case 'seq' :
        if( data === undefined ) {
          console.log( 'faulty ws seq message', _msg.data )
        }else{
          const from = socket === Communication.liveSocket ? 'live' : 'max' 
          Gibber.Scheduler.seq( data, socket.clientName );
        }
        break;

      case 'clr' :
        Gibber.Environment.clearConsole()
        break;

      case 'bpm' :
        Gibber.Scheduler.bpm = parseFloat( data )
        break;

      case 'err':
        Gibber.Environment.error( data )
        break;

      default:
        break;
    }
  },

  send( code, to='live' ) {
    if( Communication.connected ) {
      //if( code === true ) debugger
      if( Communication.debug.output ) Gibber.log( 'beat:', Gibber.Scheduler.currentBeat, 'msg:', code  )
      
      const socket = to === 'live' ? Communication.liveSocket : Communication.maxSocket
      socket.send( code )
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
