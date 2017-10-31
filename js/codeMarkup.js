const acorn = require( 'acorn' )
const walk  = require( 'acorn/dist/walk' )
const Utility = require( './utility.js' )
const $ = Utility.create

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

const __getObj = ( name, state ) => {
  let obj
  if( state.length === 0 ) {
    obj = window[ name ]
  }else{
    obj = state[ state.length - 1][ name ]
  }

  return obj
}

const Marker = {
  genWidgets: { dirty:false },
  _patternTypes: [ 'values', 'timings', 'index' ],
  globalIdentifiers:{},

  acorn, walk,

  __visitors:require( './annotations/visitors.js' ),

  // pass Marker object to patternMarkupFunctions as a closure
  init() { 
    for( let key in this.patternMarkupFunctions ) {
      if( key.includes( '_' ) === true ) {
        this.patternMarkupFunctions[ key.slice(2) ] = this.patternMarkupFunctions[ key ]( this )
      }
    }
    this.visitors = this.__visitors( this )
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
        console.log( 'not sequence:', obj, seqNumber, obj[ seqNumber ] )
        obj = obj[ seqNumber ]
      } 
    }

    return obj
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
    
    // XXX We have to markup the timings node first, as there is the potential for 
    // markup on the value node to insert text that will alter the range of the timings node.
    // If the timings node is already marked up, the mark will simply move with the text addition.
    // However, if the timing mode is marked up after, the position information provided by the parser
    // will be off and not valid.
    
    if( nodes[1] !== undefined ) {
      const timingsNode = nodes[1] 
      timingsNode.offset = Marker.offset
      Marker.patternMarkupFunctions[ timingsNode.type ]( timingsNode, state, seq, 'timings', container )
    }

    Marker.patternMarkupFunctions[ valuesNode.type ]( valuesNode, state, seq, 'values', container )
  },

  
  processGen( node, cm, track, patternObject=null, seq=null ) {
    let ch = node.end, 
        line = Marker.offset.vertical, 
        closeParenStart = ch - 1, 
        end = node.end,
        isAssignment = true 

    // check to see if a given object is a proxy that already has
    // a widget created; if so, don't make another one!
    if( node.type === 'AssignmentExpression' ) {
      const __obj = window[ node.left.name ]

      if( __obj !== undefined ) {
        if( __obj.widget !== undefined ) {
          return
        }

        Marker.createWaveformWidget( line, closeParenStart, ch, isAssignment, node, cm, __obj, track )
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
          Marker.createWaveformWidget( line, closeParenStart, ch, isAssignment, node, cm, patternObject, track )
        }
      })

    }
    
  },

  createWaveformWidget( line, closeParenStart, ch, isAssignment, node, cm, patternObject, track ) {

    const lineTxt = cm.getLine( line )

    // different replacements are used for use in sequencers, when a callexpression
    // creating a wavepattern is often followed by a comma, vs when a wavepattern is
    // assigned to a variable, when no comma is present
    if( lineTxt[ ch ] !== ',' ) {
      cm.replaceRange( ' ', { line, ch:ch }, { line, ch:ch + 1  } )
    }else{
      cm.replaceRange( ' ,', { line, ch:ch }, { line, ch:ch + 1  } )
    }

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
    if( patternObject !== null ) patternObject.mark = widget.mark
    widget.mark.__clear = widget.mark.clear
    widget.clear = ()=> widget.mark.clear()
    widget.mark.clear = function() {
      widget.mark.__clear()
    }

  },

  // currently called when a network snapshot message is received providing ugen state..
  // needs to also be called for wavepatterns.
  updateWidget( id, __value, isFromMax = true ) {
    const widget = typeof id !== 'object' ? Marker.genWidgets[ id ] : id
    if( widget === undefined ) return 

    let value = parseFloat( __value )

    // XXX why does beats generate a downward ramp?
    if( isFromMax ) value = 1 - value

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
        const wHeight = widget.height * .9 + .45

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

  finalizePatternAnnotation( patternObject, className, seqTarget ) {
    Marker._addPatternUpdates( patternObject, className )
    Marker._addPatternFilter( patternObject )

    patternObject.patternName = className
    patternObject._onchange = () => { Marker._updatePatternContents( patternObject, className, seqTarget ) }

    patternObject.clear = () => {
      patternObject.marker.clear()
    }
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
