let Gibber = null

let Communication = {
  livePort: 8082,
  maxPort:  8081,
  maxIP: '127.0.0.1',
  liveIP: '127.0.0.1',
  socketInitialized: false,
  connectMsg: null,
  defaultMode: 'live',
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

  connected:{
    max:false,
    live:false
  },

  count:0,
  init( _Gibber, props ) {
    Gibber = _Gibber

    Object.assign( this, props )

    this.maxSocket  = this.createWebSocket( Gibber.Max.init,  this.maxPort,  this.maxIP, 'max'  )
    this.liveSocket = this.createWebSocket( Gibber.Live.init, this.livePort, this.liveIP, 'live' )

    this.send = this.send.bind( Communication )
  },

  connect( props ) {
    if( this.maxSocket !== undefined && this.maxSocket.readyState === 1 ) this.maxSocket.close()
    if( this.liveSocket !== undefined && this.liveSocket.readyState === 1 ) this.liveSocket.close()

    Object.assign( this, props )

    this.maxSocket  = this.createWebSocket( Gibber.Max.init,  this.maxPort,  this.maxIP, 'max'  )
    this.liveSocket = this.createWebSocket( Gibber.Live.init, this.livePort, this.liveIP, 'live' )
  },

  createWebSocket( init, port, host, clientName ) {
    if ( this.connected[ clientName ] === true ) return

    let wsocket = null

    if ( 'WebSocket' in window ) {
      //Gibber.log( 'Connecting' , this.querystring.host, this.querystring.port )
      if( this.connectMsg === null ) { 
        this.connectMsg = Gibber.log( 'connecting' )
      }else{
        this.connectMsg.innerText += '.'
      }

      const address = "ws://" + host + ":" + port
      
      wsocket = new WebSocket( address )
      wsocket.errorCount = 0
      
      wsocket.onopen = function(ev) {        
        //Gibber.log( 'CONNECTED to ' + address )
        Gibber.log( `gibberwocky.${clientName} is ready to burble.` )
        this.connected[ clientName ] = true

        Communication[ clientName + 'Socket' ] = wsocket
        

        init()
        // cancel the auto-reconnect task:
        if ( this.connectTask !== undefined ) clearTimeout( this.connectTask )
          
        // apparently this first reply is necessary
        wsocket.send( 'update on' )

        Gibber.Environment.setServer( clientName )
      }.bind( Communication )

      wsocket.onclose = function(ev) {
        if( this.connected[ clientName ] ) {
          Gibber.log( 'disconnected from ' + address )
          this.connectMsg = null
          this.connected[ clientName ] = false
        }

        // set up an auto-reconnect task:

        //if( wsocket.errorCount++ < 3 ) {
        //  this.connectTask = setTimeout( this.createWebSocket.bind( 
        //    Communication, 
        //    clientName === 'live' ? Gibber.Live.init : Gibber.Max.init,
        //    port, host, clientName ) 
        //  , 2000 )

        //}else{
        //  Gibber.log( `too many failed connection attempts to ${clientName}. no more connections will be attempted. refresh the page to try again.\n\n` )
        //}

      }.bind( Communication )

      wsocket.onmessage = function( ev ) {
        //Gibber.log('msg:', ev )
        this.handleMessage( ev, wsocket )
      }.bind( Communication )

      wsocket.onerror = function( ev ) {
        Gibber.log( `gibberwocky.${clientName} was not able to connect.` )
        if( wsocket.errorCount++ > 3 ) {
          wsocket.close()
          Gibber.log( `too many failed connection attempts to ${clientName}. no more connections will be attempted. refresh the page to try again.\n\n` )
        }
      }.bind( Communication )

      wsocket.clientName = clientName

    } else {
      post( 'WebSockets are not available in this browser!!!' );
    }

    return wsocket
  },



  handleMessage( _msg, socket ) {
    let id, key, data, msg, isLiveMsg=true
    
    if( _msg.data.charAt( 0 ) === '{' ) {
      data = _msg.data
      key = null
      const json = JSON.parse( data )
      const schema = json.signals !== undefined ? 'max' : 'live'

      if( Communication.callbacks.schemas[ schema ] ) {
        Communication.callbacks.schemas[ schema ]( JSON.parse( data ) )
      }
    }else if( _msg.data.includes( 'snapshot' ) ) {
      data = _msg.data.substr( 9 ).split(' ')

      // if we're not using genish.js for modulation...
      if( Gibber.__gen.enabled !== false ) {
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
        id = 0
        key = msg[ 0 ]
        if( key === 'err' ) {
          data = msg.slice( 1 ).join( ' ' )
        }else{
          data = msg[ 1 ]
        }
      }
    }
    
    if( id === undefined && isLiveMsg === true ) {
      //console.error( data )
      return
    }

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

      case 'cli':
        console.log( 'client!!!', data )
        break;

      case 'run':
        Gibber.clear()
        Gibber.Environment.codemirror.setValue( data )
        Gibber.Environment.codemirror.execCommand( 'selectAll' )
        Gibber.Environment.keymap[ 'Ctrl-Enter' ]( Gibber.Environment.codemirror )
        break;

      case 'set':
        Gibber.Environment.codemirror.setValue( data )
        break;

      case 'end':
        Gibber.clear()
        break;

      case 'add':
		    const lastLine = Gibber.Environment.codemirror.lastLine()
        const current = Gibber.Environment.codemirror.getValue( '\n' )
        Gibber.Environment.codemirror.setValue( current + '\n' + data )
        const newLastLine = Gibber.Environment.codemirror.lastLine()
        Gibber.Environment.codemirror.setSelection({ line:lastLine+1, ch:0 }, {line:newLastLine, ch:10000 })
        Gibber.Environment.keymap[ 'Ctrl-Enter' ]( Gibber.Environment.codemirror )
        break;

      default:
        break;
    }
  },

  send( code, to='live' ) {
    if( Communication[ to + 'Socket' ].readyState === 1 ) {
      //if( code === true ) debugger
      if( Communication.debug.output ) Gibber.log( 'beat:', Gibber.Scheduler.currentBeat, 'msg:', code  )
      
      const socket = to === 'live' ? Communication.liveSocket : Communication.maxSocket

      socket.send( code )
    }else{
      Gibber.log( `socket ${to} is not ready for messaging.` )
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
