const acorn = require( 'acorn' )
const walk  = require( 'acorn/dist/walk' )

const callDepths = [
  'SCORE',
  'THIS.METHOD',
  'THIS.METHOD.SEQ',
  'THIS.METHOD[ 0 ].SEQ',
  'THIS.METHOD.VALUES.REVERSE.SEQ',
  'THIS.METHOD[ 0 ].VALUES.REVERSE.SEQ',
  'TRACKS[0].METHOD[ 0 ].VALUES.REVERSE.SEQ',  
  'TRACKS[0].METHOD.SEQ',
  'TRACKS[0].METHOD[0].SEQ',
  'TRACKS[0].METHOD.VALUES.REVERSE.SEQ',
  'TRACKS[0].METHOD[0].VALUES.REVERSE.SEQ'
]

const trackNames = [ 'this', 'tracks', 'master', 'returns' ]

const COLORS = {
  FILL:'rgba(46,50,53,1)',
  STROKE:'#aaa',
  DOT:'rgba(89, 151, 198, 1)'//'rgba(0,0,255,1)'
}

const findGen = function( code ) {
  const found = Gibber.__gen.gen.names.reduce( (r,v) => {
    const idx = code.indexOf( v )
    if( idx !== -1 ){
      if( v === 'eq' && code[ idx - 1 ] !== 's' ) return r 
      if( code[ idx + v.length ] !== '(' || code[ idx + v.length + 1 ] !== '(' ) return r

      r = true
    }
    return r
  }, false )
  
  return found 
} 

const Utility = require( './utility.js' )
const $ = Utility.create

const __getObj = ( name, state ) => {
  let obj
  if( state.length === 0 ) {
    obj = window[ name ]
  }else{
    obj = state[ state.length - 1][ name ]
  }

  return obj
}

let Marker = {
  genWidgets: { dirty:false },
  _patternTypes: [ 'values', 'timings', 'index' ],
  globalIdentifiers:{},

  acorn, walk,

  // pass Marker object to patternMarkupFunctions as a closure
  init() { 
    for( let key in this.patternMarkupFunctions ) {
      if( key.includes( '_' ) === true ) {
        this.patternMarkupFunctions[ key.slice(2) ] = this.patternMarkupFunctions[ key ]( this )
      }
    }
  },

  prepareObject( obj ) {
    obj.markup = {
      textMarkers: {},
      cssClasses:  {} 
    }  
  },

  getObj( path, findSeq = false, seqNumber = 0 ) {
    let obj = window[ path[0] ]

    for( let i = 1; i < path.length; i++ ) {
      const key = path[ i ]
      if( key !== undefined ) {
        obj = obj[ key ]
      }else{
        break;
      }
    }

    if( findSeq === true ) {
      if( obj.type !== 'sequence' ) {
        obj = obj[ seqNumber ]
      } 
    }

    return obj
  },
  
  visitors: {
    Literal( node, state, cb ) {
      state.push( node.value )
    },
    Identifier( node, state, cb ) {
      state.push( node.name )
    },
    AssignmentExpression( expression, state, cb ) {
      //cb( expression, state )
      
      if( expression.right.type !== 'Literal' && Marker.standalone[ expression.right.callee.name ] ) {

        Marker.standalone[ expression.right.callee.name ]( 
          expression.right, 
          state.cm,
          track,
          expression.left.name,
          state,
          cb
        )            
      }else{
        // if it's a gen~ object we need to store a reference so that we can create wavepattern
        // annotations when appropriate.
        const left = expression.left
        const right= expression.right
        
        Marker.globalIdentifiers[ left.name ] = right

        // XXX does this need a track object? passing null...
        Marker.processGen( expression, state.cm, null)

      }
    },
    CallExpression( node, state, cb ) {
      cb( node.callee, state )

      const endIdx = state.length - 1
      const end = state[ endIdx ]
      const foundSequence = end === 'seq'

      if( foundSequence === true ){
        const hasSeqNumber = node.arguments.length > 2
        
        let seqNumber = 0
        if( hasSeqNumber === true ) {
          seqNumber = node.arguments[2].raw
        }

        const seq = Marker.getObj( state.slice( 0, endIdx ), true, seqNumber )
        //console.log( 'seq:', seq )

        Marker.markPatternsForSeq( seq, node.arguments, state, cb, node )
      }
    },
    MemberExpression( node, state, cb ) {
      if( node.object.type !== 'Identifier' ) {
        if( node.property ) {
          state.unshift( node.property.type === 'Identifier' ? node.property.name : node.property.raw )
        }
        cb( node.object, state )
      }else{
        if( node.property !== undefined ) { // if the objects is an array member, e.g. tracks[0]
          state.unshift( node.property.raw )
        }
        state.unshift( node.object.name )
      }
    },
  },

  // need ecmaVersion 7 for arrow functions to work correctly
  parsingOptions: { locations:true, ecmaVersion:7 },

  process( code, position, codemirror, track ) {
    // store position offset from top of code editor
    // to use when marking patterns, since acorn will produce
    // relative offsets 
    Marker.offset = {
      vertical:   position.start.line,
      horizontal: position.horizontalOffset === undefined ? 0 : position.horizontalOffset
    }

    const state = []
    state.cm = codemirror

    walk.recursive( acorn.parse( code, Marker.parsingOptions ), state, Marker.visitors )
  },

  markPatternsForSeq( seq, nodes, state, cb, container ) {
    const valuesNode = nodes[0]
    valuesNode.offset = Marker.offset

    Marker.patternMarkupFunctions[ valuesNode.type ]( valuesNode, state, seq, 'values', container )

    if( nodes[1] !== undefined ) {
      const timingsNode = nodes[1] 
      timingsNode.offset = Marker.offset
      Marker.patternMarkupFunctions[ timingsNode.type ]( timingsNode, state, seq, 'timings', container )
    }
  },

    /*let shouldParse = code.includes( '.seq' ) || code.includes( 'Steps(' ) || code.includes( 'Score(' ),
        shouldParseGen = true,
        isGen = false

    if( shouldParseGen ) { // check for gen~ assignment XXX check not currently needed
      const found = findGen( code ) 

      if( found === true ) {
        shouldParse = true
        isGen = true
      }

      if( isGen === false ) {
        for( let ugen of Gibber.__gen.ugenNames ) {
          let idx = code.indexOf( ugen )
          if( idx !== -1 && code.charAt( idx + ugen.length ) === '('  ) {
            shouldParse = true
            isGen = true

            break;
          }
        }
      }
    }

    if( !shouldParse ) return

    const tree = acorn.parse( code, { locations:true, ecmaVersion:6 } ).body
    
    for( let node of tree ) {
      if( node.type === 'ExpressionStatement' ) { // not control flow
        node.verticalOffset  = position.start.line
        node.horizontalOffset = position.horizontalOffset === undefined ? 0 : position.horizontalOffset
        try {
          //if( isGen ) {
            //this.processGen( node, codemirror, track )
          //}else{ 
            this._process[ node.type ]( node, codemirror, track )
          //}
        } catch( error ) {
          console.log( 'error processing annotation for', node.expression.type, error )
        }
      }
    }
  },*/
  
  processGen( node, cm, track, patternObject=null ) {
    let ch = node.end, 
        line = Marker.offset.vertical, 
        closeParenStart = ch - 1, 
        end = node.end,
        isAssignment = true 

    // check to see if a given object is a proxy that already has
    // a widget created; if so, don't make another one!
    if( node.type === 'AssignmentExpression' ) {
      const __obj = window[ node.left.name ]
      console.log( 'obj:', __obj )

      if( __obj !== undefined ) {
        if( __obj.widget !== undefined ) {
          return
        }

        console.log( 'making widget...' )

        Marker.createWaveformWidget( line, closeParenStart, ch, isAssignment, node, cm, __obj )
      }
    }else if( node.type === 'CallExpression' ) {
      const seqExpression = node

      // check each node in calls to .seq for genish functions
      // XXX CURRENTLY ONLY CHECKS FOR ONE GENISH FUNCTION
      seqExpression.arguments.forEach( function( seqArgument ) {
        if( seqArgument.type === 'CallExpression' ) {
          const idx = Gibber.__gen.ugenNames.indexOf( seqArgument.callee.name )
          
          // not a gen, markup will happen elsewhere
          if( idx === -1 ) return

          ch = seqArgument.end
          closeParenStart = ch - 1
          isAssignment = false
          node.processed = true
          Marker.createWaveformWidget( line, closeParenStart, ch, isAssignment, node, cm, patternObject )
        }
      })

    }

    
  },

  createWaveformWidget( line, closeParenStart, ch, isAssignment, node, cm, patternObject ) {

    cm.replaceRange( ' ', { line, ch:ch+1 })// { line, ch:ch + 1  } )

    const widget = document.createElement( 'canvas' )
    widget.ctx = widget.getContext('2d')
    widget.style.display = 'inline-block'
    widget.style.verticalAlign = 'middle'
    widget.style.height = '1.1em'
    widget.style.width = '60px'
    widget.style.backgroundColor = 'transparent'
    widget.style.borderLeft = '1px solid #666'
    widget.style.borderRight = '1px solid #666'
    widget.setAttribute( 'width', 60 )
    widget.setAttribute( 'height', 13 )
    widget.ctx.fillStyle = COLORS.FILL 
    widget.ctx.strokeStyle = COLORS.STROKE
    widget.ctx.lineWidth = .5
    widget.gen = patternObject !== null ? patternObject : Gibber.__gen.gen.lastConnected
    widget.values = []
    widget.min = 10000
    widget.max = -10000

    if( widget.gen === null || widget.gen === undefined ) {
      if( node.expression.type === 'AssignmentExpression' ) {
        isAssignment = true
        
        widget.gen = window[ node.expression.left.name ]

        if( widget.gen.widget !== undefined ) {
          widget.gen.widget.parentNode.removeChild( widget.gen.widget )
        }
        widget.gen.widget = widget
      }
    }else{
      if( widget.gen.widget !== undefined && widget.gen.widget !== widget ) {
        isAssignment = true
        //widget.gen = window[ node.expression.left.name ]
      }
    }

    Gibber.__gen.gen.lastConnected = null

    for( let i = 0; i < 120; i++ ) widget.values[ i ] = 0

    if( isAssignment === false ) {
      if( widget.gen !== null ) {
        let oldWidget = Marker.genWidgets[ widget.gen.paramID ] 

        if( oldWidget !== undefined ) {
          oldWidget.parentNode.removeChild( oldWidget )
        } 
      }
    }
    
    if( widget.gen !== null ) {
      Marker.genWidgets[ widget.gen.paramID ] = widget
      widget.gen.widget = widget
    }

    //debugger
    widget.mark = cm.markText({ line, ch:ch }, { line, ch:ch+1 }, { replacedWith:widget })
    widget.mark.__clear = widget.mark.clear
    widget.clear = ()=> widget.mark.clear()
    widget.mark.clear = function() {
      widget.mark.__clear()
    }

    
  },

  // currently called when a network snapshot message is received providing ugen state..
  // needs to also be called for wavepatterns.
  updateWidget( id, __value ) {
    const widget = typeof id !== 'object' ? Marker.genWidgets[ id ] : id
    if( widget === undefined ) return 

    const value = parseFloat( __value )

    if( typeof widget.values[72] !== 'object' ) {
      widget.values[ 72 ] = value
    }
    
    if( value > widget.max ) {
      widget.max = value
    }else if( value < widget.min ) {
      widget.min = value
    } 

    widget.values.shift()
    Marker.genWidgets.dirty = true
  },

  // called by animation scheduler if Marker.genWidgets.dirty === true
  drawWidgets() {
    
    Marker.genWidgets.dirty = false

    for( let key in Marker.genWidgets ) {
      let widget = Marker.genWidgets[ key ]
      if( typeof widget === 'object' && widget.ctx !== undefined ) {

        widget.ctx.fillStyle = COLORS.FILL
        widget.ctx.fillRect( 0,0, widget.width, widget.height )
        widget.ctx.beginPath()
        widget.ctx.moveTo( 0,  widget.height / 2 + 1 )

        const range = widget.max - widget.min
        const wHeight = widget.height * .9 + .5

        for( let i = 0, len = widget.width; i < len; i++ ) {
          const data = widget.values[ i ]
          const shouldDrawDot = typeof data === 'object'
          const value = shouldDrawDot ? data.value : data
          const scaledValue = ( value - widget.min ) / range

          const yValue = scaledValue * wHeight - .5 
          
          if( shouldDrawDot === true ) {
            widget.ctx.fillStyle = COLORS.DOT
            widget.ctx.fillRect( i-1, wHeight - yValue - 1, 2, 2)
          }else{
            widget.ctx.lineTo( i, wHeight - yValue )
          }
        }
        widget.ctx.stroke()
      }
    }
  },

  clear() {
    for( let key in Marker.genWidgets ) {
      let widget = Marker.genWidgets[ key ]
      if( typeof widget === 'object' ) {
        widget.mark.clear()
        //widget.parentNode.removeChild( widget )
      }
    }

    Marker.genWidgets = { dirty:false }
  },

  _process: {
    ExpressionStatement( expressionNode, codemirror, track ){ 
      Marker._process[ expressionNode.expression.type ]( expressionNode, codemirror, track )
    },

    AssignmentExpression: function( expressionNode, codemirror, track ) {
      // if the right-hand op is not a literal and we have a defined annotation for it (in Marker.functions)
      if( expressionNode.expression.right.type !== 'Literal' && Marker.standalone[ expressionNode.expression.right.callee.name ] ) {

        Marker.standalone[ expressionNode.expression.right.callee.name ]( 
          expressionNode.expression.right, 
          codemirror,
          track,
          expressionNode.expression.left.name,
          expressionNode.verticalOffset,
          expressionNode.horizontalOffset
        )            
      }else{
        // if it's a gen~ object we need to store a reference so that we can create wavepattern
        // annotations when appropriate.
        const left = expressionNode.expression.left
        const right= expressionNode.expression.right
        
        Marker.globalIdentifiers[ left.name ] = right

        
        console.log( 'assignment expression for gen~' )
        Marker.processGen( expressionNode, codemirror, track )
      }
    },

    CallExpression( expressionNode, codemirror, track  ) {
      let [ components, depthOfCall, index ] = Marker._getCallExpressionHierarchy( expressionNode.expression ),
        args = expressionNode.expression.arguments,
        usesThis, targetPattern, isTrack, method, target

      // if index is passed as argument to .seq call...
      if( args.length > 2 ) { index = args[ 2 ].value }
      
      //console.log( "depth of call", depthOfCall, components, index )
      let valuesPattern, timingsPattern, valuesNode, timingsNode

      switch( callDepths[ depthOfCall ] ) {
         case 'SCORE':
           //console.log( 'score no assignment?', components, expressionNode.expression )
           if( Marker.functions[ expressionNode.expression.callee.name ] ) {
             Marker.functions[ expressionNode.expression.callee.name ]( expressionNode.expression, codemirror, track, expressionNode.verticalOffset )            
           }
           break;

         case 'THIS.METHOD': // also for calls to Score([]).start() 
           break;

         case 'THIS.METHOD.SEQ':
           if( components.includes( 'tracks' ) ) { //expressionNode.expression.callee.object.object.type !== 'ThisExpression' ) {
             let objName = expressionNode.expression.callee.object.object.name

             track = window[ objName ]
             method = track[ components[ 1 ] ][ index ]
           }else if( components.includes( 'this' ) ){
             track = Gibber.currentTrack
             method = track[ components[ 1 ] ][ index ]
           }else{
             let objName = expressionNode.expression.callee.object.object.name

             track = window[ components[0] ]
             method = track[ components[ 1 ] ][ index ] 
           }

           if( !track.markup ) { Marker.prepareObject( track ) }

           valuesPattern =  method.values
           timingsPattern = method.timings
           valuesNode = args[ 0 ]
           timingsNode= args[ 1 ]

           valuesPattern.codemirror = timingsPattern.codemirror = codemirror 
          
           if( valuesNode ) {
             Marker._markPattern[ valuesNode.type ]( valuesNode, expressionNode, components, codemirror, track, index, 'values', valuesPattern ) 
           }  
           if( timingsNode ) {
             Marker._markPattern[ timingsNode.type ]( timingsNode, expressionNode, components, codemirror, track, index, 'timings', timingsPattern )  
           }

           break;

         case 'THIS.METHOD[ 0 ].SEQ': // will this ever happen??? I guess after it has been sequenced once?
           isTrack  = trackNames.includes( components[0] )
           target = null
           track = window[ components[0] ][ components[1] ]
           
           if( !isTrack ) { // not a track! XXX please, please get a better parsing method / rules...
             target = track
             track = Gibber.currentTrack
           }

           valuesPattern =  target === null ? track[ components[2] ][ index ].values : target[ components[2] ].values
           timingsPattern = target === null ? track[ components[2] ][ index ].timings : target[ components[2] ].timings 
           valuesNode = args[0]
           timingsNode = args[1]

           valuesPattern.codemirror = codemirror
           if( timingsPattern !== undefined ) timingsPattern.codemirror = codemirror

           if( valuesNode ) { 
             Marker._markPattern[ valuesNode.type ]( valuesNode, expressionNode, components, codemirror, track, index, 'values', valuesPattern ) 
           }
           if( timingsNode ) {
             Marker._markPattern[ timingsNode.type ]( timingsNode, expressionNode, components, codemirror, track, index, 'timings', timingsPattern )  
           }

           break;

         case 'THIS.METHOD.VALUES.REVERSE.SEQ':
           usesThis = components.includes( 'this' )
           isTrack  = components.includes( 'tracks' )

           if( isTrack ) { // XXX this won't ever get called here, right?
             track = window[ components[0] ][ components[1] ] 
             targetPattern = track[ components[2] ][ components[3] ]
             method = targetPattern[ components[4] ]

           }else{
             track = usesThis ? Gibber.currentTrack : window[ components[0] ],
             targetPattern = track[ components[1] ][ components[2] ],
             method = targetPattern[ components[3] ]
           }
        
            
           valuesPattern = method.values
           timingsPattern = method.timings
           valuesNode = args[0]
           timingsNode = args[1]

           valuesPattern.codemirror = timingsPattern.codemirror = codemirror
           
           if( valuesNode ) {
             Marker._markPattern[ valuesNode.type ]( valuesNode, expressionNode, components, codemirror, track, index, 'values', valuesPattern ) 
           }  
           if( timingsNode ) {
             Marker._markPattern[ timingsNode.type ]( timingsNode, expressionNode, components, codemirror, track, index, 'timings', timingsPattern )  
           }

           break;

         case 'THIS.METHOD[ 0 ].VALUES.REVERSE.SEQ': // most useful?
           usesThis = components.includes( 'this' )
           isTrack  = components.includes( 'tracks' )
           // tracks['1-Impulse 606'].devices['Impulse']['Global Time']
           
           if( isTrack ) {
             track = window[ components[0] ][ components[1] ] 
             targetPattern = track[ components[2] ][ components[3] ]
             method = targetPattern[ components[4] ]

           }else{
             track = usesThis ? Gibber.currentTrack : window[ components[0] ],
             targetPattern = track[ components[1] ][ index ][ components[3] ],
             method = targetPattern[ components[4] ]
           }

           valuesPattern =  method.values
           timingsPattern = method.timings
           valuesNode = args[ 0 ]
           timingsNode= args[ 1 ]
          
           valuesPattern.codemirror = timingsPattern.codemirror = codemirror

           if( !isTrack ) components.splice( 2,index )
          
           if( valuesNode ) {
             Marker._markPattern[ valuesNode.type ]( valuesNode, expressionNode, components, codemirror, track, index, 'values', valuesPattern ) 
           }
           if( timingsNode ) {
             Marker._markPattern[ timingsNode.type ]( timingsNode, expressionNode, components, codemirror, track, index, 'timings', timingsPattern )  
           }
           break;
         case 'TRACKS[0].METHOD[ 0 ].VALUES.REVERSE.SEQ':
           track = window[ 'tracks' ][ components[ 1 ] ]

           components[3] = components[3]
           valuesPattern =  track[ components[ 2 ] ][ components[3] ][ components[4] ][ components[5] ].values
           timingsPattern = track[ components[ 2 ] ][ components[3] ][ components[4] ][ components[5] ].timings
           valuesNode = args[ 0 ]
           timingsNode= args[ 1 ]
          
           valuesPattern.codemirror = timingsPattern.codemirror = codemirror

           if( valuesNode ) {
             Marker._markPattern[ valuesNode.type ]( valuesNode, expressionNode, components, codemirror, track, index, 'values', valuesPattern ) 
           }  
           if( timingsNode ) {
             Marker._markPattern[ timingsNode.type ]( timingsNode, expressionNode, components, codemirror, track, index, 'timings', timingsPattern )  
           }
           break;

         default:
           console.log( 'default annotation error' )
           break;
      }
    },
  },

  _createBorderCycleFunction( classNamePrefix, patternObject ) {
    let modCount = 0,
        lastBorder = null,
        lastClassName = null
    
    let cycle = function( isArray = false ) {
      let className = '.' + classNamePrefix + '_' +  patternObject.update.currentIndex,
          border = 'top'

      switch( modCount++ % 4 ) {
        case 1: border = 'right'; break;
        case 2: border = 'bottom'; break;
        case 3: border = 'left'; break;
      }


      // for a pattern holding arrays... like for chord()
      if( isArray === true ) {
        switch( border ) {
          case 'left':
            $( className ).remove( 'annotation-' + lastBorder + '-border-cycle' )
            $( className + '_start' ).add( 'annotation-left-border-cycle' )

            break;
          case 'right':
            $( className ).remove( 'annotation-' + lastBorder + '-border-cycle' ) 
            $( className + '_end' ).add( 'annotation-right-border-cycle' )
 
            break;
          case 'top':
            $( className ).add( 'annotation-top-border-cycle' )
            $( className+'_start' ).remove( 'annotation-left-border-cycle' )
            $( className+'_start' ).add( 'annotation-top-border-cycle' )
            $( className+'_end' ).add( 'annotation-top-border-cycle' )

            break;
          case 'bottom':
            $( className ).add( 'annotation-bottom-border-cycle' )
            $( className+'_end' ).remove( 'annotation-right-border-cycle' )
            $( className+'_end' ).add( 'annotation-bottom-border-cycle' )
            $( className+'_start' ).add( 'annotation-bottom-border-cycle' )

            break;
          default:
            $( className ).add( 'annotation-' + border + '-border-cycle' )
            $( className+'_start' ).remove( 'annotation-' + border + '-border-cycle' )
            $( className+'_end' ).remove( 'annotation-' + border + '-border-cycle' )
            break;
        }

      }else{
        $( className ).remove( 'annotation-' + border + '-border' )
        $( className ).add( 'annotation-' + border + '-border-cycle' )
        
        if( lastBorder !== null ) {
          $( className ).remove( 'annotation-' + lastBorder + '-border-cycle' )
          $( className ).add( 'annotation-' + lastBorder + '-border' )
        }
      }
      
      lastBorder = border
      lastClassName = className

      //console.log( 'cycle idx:', patternObject.idx )
    }

    cycle.clear = function() {
      modCount = 1
      
      if( lastClassName !== null ) {
        $( lastClassName ).remove( 'annotation-left-border' )
        $( lastClassName ).remove( 'annotation-left-border-cycle' )
        $( lastClassName ).remove( 'annotation-right-border' )
        $( lastClassName ).remove( 'annotation-right-border-cycle' )
        $( lastClassName ).remove( 'annotation-top-border' )
        $( lastClassName ).remove( 'annotation-top-border-cycle' )
        $( lastClassName ).remove( 'annotation-bottom-border' )
        $( lastClassName ).remove( 'annotation-bottom-border-cycle' )
      }

      lastBorder = null
    }

    return cycle
  },

  _addPatternUpdates( patternObject, className ) {
    let cycle = Marker._createBorderCycleFunction( className, patternObject )
    
    patternObject.update = () => {
      // if( !patternObject.update.shouldUpdate ) return 
      cycle() 
    }
  },

  // Patterns can have *filters* which are functions
  // that can modify the final output of a pattern and carry out
  // other miscellaneous tasks. Here we add a filter that schedules
  // updates for annotations everytime the target pattern outputs
  // a value.
  _addPatternFilter( patternObject ) {
    patternObject.filters.push( args => {
      const wait = Utility.beatsToMs( patternObject.nextTime + .5,  Gibber.Scheduler.bpm ),
            idx = args[ 2 ],
            shouldUpdate = patternObject.update.shouldUpdate

      // delay is used to ensure that timings pattern is processed after values pattern,
      // because changing the mark of the values pattern messes up the mark of the timings
      // pattern; reversing their order of execution fixes this.  
      if( patternObject.__delayAnnotations === true ) {
        Gibber.Environment.animationScheduler.add( () => {
          patternObject.update.currentIndex = idx
          patternObject.update()
        }, wait + 1 )
      }else{
        Gibber.Environment.animationScheduler.add( () => {
          patternObject.update.currentIndex = idx
          patternObject.update()
        }, wait ) 
      }

      return args
    }) 
  },

  // FunctionExpression and ArrowFunctionExpression are small enough to
  // include here, as they're simply wrappers for Identifier. All other
  // pattern markup functions are in their own files.
  patternMarkupFunctions: {

    __Literal:          require( './annotations/markup/literal.js' ),
    __Identifier:       require( './annotations/markup/identifier.js'   ),
    __UnaryExpression:  require( './annotations/markup/unaryExpression.js'  ),
    __BinaryExpression: require( './annotations/markup/binaryExpression.js' ),
    __ArrayExpression:  require( './annotations/markup/arrayExpression.js'  ),
    __CallExpression:   require( './annotations/markup/callExpression.js'   ),

    // args[ 0 ] is the pattern node
    FunctionExpression( ...args ) { 
      if( args[ 0 ].processed === true ) return 
      Marker.patternMarkupFunctions.Identifier( ...args )
    },

    ArrowFunctionExpression( ...args ) { 
      if( args[ 0 ].processed === true ) return 
      Marker.patternMarkupFunctions.Identifier( ...args )
    }
  },

  patternUpdates: {
    Euclid: ( patternObject, marker, className, cm, track ) => {
      let val ='/* ' + patternObject.values.join('')  + ' */',
          pos = marker.find(),
          end = Object.assign( {}, pos.to ),
          annotationStartCh = pos.from.ch + 3,
          annotationEndCh   = annotationStartCh + 1,
          memberAnnotationStart   = Object.assign( {}, pos.from ),
          memberAnnotationEnd     = Object.assign( {}, pos.to ),
          initialized = false,
          markStart = null,
          commentMarker,
          currentMarker, chEnd

      end.ch = pos.from.ch + val.length

      pos.to.ch -= 1
      cm.replaceRange( val, pos.from, pos.to )

      patternObject.commentMarker = cm.markText( pos.from, end, { className, atomic:false}) //replacedWith:element })

      track.markup.textMarkers[ className ] = {}
      
      let mark = () => {
        // first time through, use the position given to us by the parser
        let range,start, end
        if( initialized === false ) {
          memberAnnotationStart.ch = annotationStartCh
          memberAnnotationEnd.ch   = annotationEndCh
          initialized = true
        }else{
          // after the first time through, every update to the pattern store the current
          // position of the first element (in markStart) before replacing. Use this to generate position
          // info. REPLACING TEXT REMOVES TEXT MARKERS.
          range = markStart
          start = range.from
          memberAnnotationStart.ch = start.ch
          memberAnnotationEnd.ch = start.ch + 1 
        }

        for( let i = 0; i < patternObject.values.length; i++ ) {
          track.markup.textMarkers[ className ][ i ] = cm.markText(
            memberAnnotationStart,  memberAnnotationEnd,
            { 'className': `${className}_${i}` }
          )

          memberAnnotationStart.ch += 1
          memberAnnotationEnd.ch   += 1
        }
        
        if( start !== undefined ) {
          start.ch -= 3
          end = Object.assign({}, start )
          end.ch = memberAnnotationEnd.ch + 3
          patternObject.commentMarker = cm.markText( start, end, { className, atomic:true })
        }
      }
      
      mark()

      // XXX: there's a bug when you sequence pattern transformations, and then insert newlines ABOVE the annotation
      let count = 0, span, update, activeSpans = []

      update = () => {
        let currentIdx = count++ % patternObject.values.length
        
        if( span !== undefined ) {
          span.remove( 'euclid0' )
        }

        let spanName = `.${className}_${currentIdx}`,
            currentValue = patternObject.values[ currentIdx ]
 
        span = $( spanName )

        if( currentValue === 1 ) {
          span.add( 'euclid1' )
          activeSpans.push( span )
          setTimeout( ()=> { 
            activeSpans.forEach( _span => _span.remove( 'euclid1' ) )
            activeSpans.length = 0 
          }, 50 )
        }else{
          span.add( 'euclid0' )
        }
      }

      patternObject._onchange = () => {
        let delay = Utility.beatsToMs( 1,  Gibber.Scheduler.bpm )
        markStart = track.markup.textMarkers[ className ][ 0 ].find()

        Gibber.Environment.animationScheduler.add( () => {
          for( let i = 0; i < patternObject.values.length; i++ ) {
   
            let markerCh = track.markup.textMarkers[ className ][ i ],
                pos = markerCh.find()
            
            marker.doc.replaceRange( '' + patternObject.values[ i ], pos.from, pos.to )
          }
          mark()
        }, delay ) 
      }

      patternObject.clear = () => {
        try{
          let commentPos = patternObject.commentMarker.find()
          cm.replaceRange( '', commentPos.from, commentPos.to )
          patternObject.commentMarker.clear()
        } catch( e ) {
          console.log( 'euclid annotation error:', e )
        } // yes, I just did that XXX 
      }

      return update 
    },

    anonymousFunction: ( patternObject, marker, className, cm ) => {
      patternObject.commentMarker = marker
      let update = () => {
        if( !patternObject.commentMarker ) return
        let patternValue = '' + patternObject.update.value.pop()
        
        if( patternValue.length > 8 ) patternValue = patternValue.slice(0,8) 

        let val ='/* ' + patternValue + ' */,',
            pos = patternObject.commentMarker.find(),
            end = Object.assign( {}, pos.to )
         
        //pos.from.ch += 1
        end.ch = pos.from.ch + val.length 
        //pos.from.ch += 1

        cm.replaceRange( val, pos.from, pos.to )
        
        if( patternObject.commentMarker ) patternObject.commentMarker.clear()

        patternObject.commentMarker = cm.markText( pos.from, end, { className, atomic:false })
      }

      patternObject.clear = () => {
        try{
          let commentPos = patternObject.commentMarker.find()
          commentPos.to.ch -= 1 // XXX wish I didn't have to do this
          cm.replaceRange( '', commentPos.from, commentPos.to )
          patternObject.commentMarker.clear()
          delete patternObject.commentMarker
        } catch( e ) {} // yes, I just did that XXX 
      }

      return update
    }
  },

  standalone: {
    Score( node, cm, track, objectName, vOffset=0 ) {
      let timelineNodes = node.arguments[ 0 ].elements
      //console.log( timelineNodes )
      track.markup.textMarkers[ 'score' ] = []

      for( let i = 0; i < timelineNodes.length; i+=2 ) {
        let timeNode = timelineNodes[ i ],
            functionNode = timelineNodes[ i + 1 ]
            
        functionNode.loc.start.line += vOffset - 1
        functionNode.loc.end.line   += vOffset - 1
        functionNode.loc.start.ch = functionNode.loc.start.column
        functionNode.loc.end.ch = functionNode.loc.end.column

        let marker = cm.markText( functionNode.loc.start, functionNode.loc.end, { className:`score${i/2}` } )
        track.markup.textMarkers[ 'score' ][ i/2 ] = marker

      }

      let lastClass = 'score0'
      $( '.' + lastClass ).add( 'scoreCurrentIndex' )
      // TODO: global object usage is baaaad methinks?
      window[ objectName ].onadvance = ( idx ) => {
        $( '.' + lastClass ).remove( 'scoreCurrentIndex' )
        lastClass = `score${idx}`
        $( '.' + lastClass ).add( 'scoreCurrentIndex' ) 
      }
    },

    Steps( node, cm, track, objectName, state, cb ) {
      let steps = node.arguments[ 0 ].properties

      track.markup.textMarkers[ 'step' ] = []
      track.markup.textMarkers[ 'step' ].children = []

      let mark = ( _step, _key, _cm, _track ) => {
        for( let i = 0; i < _step.value.length; i++ ) {
          let pos = { loc:{ start:{}, end:{}} }
          Object.assign( pos.loc.start, _step.loc.start )
          Object.assign( pos.loc.end  , _step.loc.end   )
          pos.loc.start.ch += i
          pos.loc.end.ch = pos.loc.start.ch + 1
          let posMark = _cm.markText( pos.loc.start, pos.loc.end, { className:`step_${_key}_${i}` })
          _track.markup.textMarkers.step[ _key ].pattern[ i ] = posMark
        }
      }

      for( let key in steps ) {
        let step = steps[ key ].value

        if( step && step.value ) { // ensure it is a correctly formed step
          step.loc.start.line += Marker.offset.vertical - 1
          step.loc.end.line   += Marker.offset.vertical - 1
          step.loc.start.ch   = step.loc.start.column + 1
          step.loc.end.ch     = step.loc.end.column - 1
          
          let marker = cm.markText( step.loc.start, step.loc.end, { className:`step${key}` } )
          track.markup.textMarkers.step[ key ] = marker

          track.markup.textMarkers.step[ key ].pattern = []
          
          mark( step, key, cm, track )

          let count = 0, span, update,
              _key = steps[ key ].key.value,
              patternObject = window[ objectName ].seqs[ _key ].values

          update = () => {
            let currentIdx = update.currentIndex // count++ % step.value.length
            
            if( span !== undefined ) {
              span.remove( 'euclid0' )
              span.remove( 'euclid1' )
            }
            
            let spanName = `.step_${key}_${currentIdx}`,
                currentValue = patternObject.update.value.pop() //step.value[ currentIdx ]
            
            span = $( spanName )

            if( currentValue !== Gibber.Seq.DO_NOT_OUTPUT ) {
              span.add( 'euclid1' )
              setTimeout( ()=> { span.remove( 'euclid1' ) }, 50 )
            }
            
            span.add( 'euclid0' )
          }

          patternObject._onchange = () => {
            let delay = Utility.beatsToMs( 1,  Gibber.Scheduler.bpm )
            Gibber.Environment.animationScheduler.add( () => {
              marker.doc.replaceRange( patternObject.values.join(''), step.loc.start, step.loc.end )
              mark( step, key, cm, track )
            }, delay ) 
          }

          patternObject.update = update
          patternObject.update.value = []

          Marker._addPatternFilter( patternObject )
        }
      }

    },  
  },


  _updatePatternContents( pattern, patternClassName, track ) {
    let marker, pos, newMarker

    if( pattern.values.length > 1 ) {
      // array of values
      for( let i = 0; i < pattern.values.length; i++) {
        marker = track.markup.textMarkers[ patternClassName ][ i ]
        pos = marker.find()

        marker.doc.replaceRange( '' + pattern.values[ i ], pos.from, pos.to )
      }
    }else{
      // single literal
      marker = track.markup.textMarkers[ patternClassName ]
      pos = marker.find()

      marker.doc.replaceRange( '' + pattern.values[ 0 ], pos.from, pos.to )
      // newMarker = marker.doc.markText( pos.from, pos.to, { className: patternClassName + ' annotation-border' } )
      // track.markup.textMarkers[ patternClassName ] = newMarker
    }
  },

  _getNamesAndPosition( patternNode, state, patternType, index = 0 ) {
    let start   = patternNode.loc.start,
        end     = patternNode.loc.end,
        className = state.slice( 0 ), 
        cssName   = null,
        marker

     //if( className.includes( 'this' ) ) className.shift()

     //if( className.includes( 'tracks' ) ) {
     //  //className = [ 'tracks', components[1] ].concat( components.slice( 2, components.length - 1 ) )
     //  if( index !== 0 ) {
     //    className.splice( 3, 0, index )
     //  }
     //}else{
     //  if( index !== 0 ) {
     //    className.splice( 1, 0, index ) // insert index into array
     //  }
     //}

     className.push( patternType )
     className = className.join( '_' )

     let expr = /\[\]/gi
     className = className.replace( expr, '' )

     expr = /\-/gi
     className = className.replace( expr, '_' )

     expr = /\ /gi
     className = className.replace( expr, '_' )

     start.line += patternNode.offset.vertical - 1
     end.line   += patternNode.offset.vertical - 1
     start.ch   = start.column + patternNode.offset.horizontal 
     end.ch     = end.column + patternNode.offset.horizontal 

     return [ className, start, end ]
  },

  _getCallExpressionHierarchy( expr ) {
    let callee = expr.callee,
        obj = callee.object,
        components = [],
        index = 0,
        depth = 0

    while( obj !== undefined ) {
      let pushValue = null

      if( obj.type === 'ThisExpression' ) {
        pushValue = 'this' 
      }else if( obj.property && obj.property.name ){
        pushValue = obj.property.name
      }else if( obj.property && obj.property.type === 'Literal' ){ // array index
        pushValue = obj.property.value

        // don't fall for tracks[0] etc.
        if( depth > 1 ) index = obj.property.value
      }else if( obj.type === 'Identifier' ) {
        pushValue = obj.name
      }
      
      if( pushValue !== null ) components.push( pushValue ) 

      depth++
      obj = obj.object
    }
    
    components.reverse()
    
    if( callee.property )
      components.push( callee.property.name )

    return [ components, depth, index ]
  },

}

module.exports = Marker
