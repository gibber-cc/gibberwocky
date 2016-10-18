/*
Score is a Seq(ish) object, with pause, start / stop, rewind, fast-forward.
It's internal phase is 

Score has start() method to start it running. next() advances to next element,
regardless of whether or not the score is running, and stats the transport running.
rewind() moves the score index to the first position.
*/

/*
Passed Timing           Result
=============           ======
Numeric literal         place function in timeline and store reference
a Function              callback. register to receive and advance. must use pub/sub.
Score.wait             pause until next() method is called
*/

module.exports = function( Gibber ) {

let Score = {
  wait: -987654321,

  create( data, track = Gibber.currentTrack ) {
    let score = Object.create( this )
    
    Object.assign( score, {
      track,
      timeline:   [],
      schedule:   [],
      shouldLoop: false,
      rate:       1,
      loopPause:  0,
      phase:      0,
      index:      0,
      isPaused:   true,
    })

    for( let i = 0; i < data.length; i+=2 ) {
      score.schedule.push( data[ i ] )
      score.timeline.push( data[ i+1 ] )    
    }
    
    let loopPauseFnc = () => {
          score.nextTime = score.phase = 0
          score.index = -1
          score.timeline.pop()
        }

    score.oncomplete.listeners = []
    score.oncomplete.owner = this
  
    score.nextTime = score.schedule[ 0 ]
    
    score.start()

    return score
  },

  start() { 
    if( !this.isPaused ) return
    this.isPaused = false
     
    Gibber.Scheduler.addMessage( this, 0 )   
  
    return this
  },

  stop() { 
    this.isPaused = true  
    return this
  },
  
  loop( loopPause = 0 ) {
    this.loopPause = loopPause
    this.shouldLoop = !this.shouldLoop
    
    return this
  },
  
  pause() {
    this.isPaused = true
    
    return this
  },
  
  next() {
    this.isPaused = false
    
    return this
  },
  
  combine( ...args ) {
    let score = [ 0, args[ 0 ] ]
  
    for( let i = 1; i < args.length; i++ ) {
      let timeIndex = i * 2,
          valueIndex = timeIndex +  1,
          previousValueIndex = timeIndex - 1

      score[ timeIndex  ] = score[ previousValueIndex ].oncomplete
      score[ valueIndex ] = args[ i ]
    }
  
    return Score.create( score )
  },

  tick( scheduler, beat, beatOffset ) {
    if( !this.isPaused ) {
      if( this.phase >= this.nextTime && this.index < this.timeline.length ) {
        
        let fnc = this.timeline[ this.index ],
            shouldExecute = true
        
        this.index++
        
        if( this.index <= this.timeline.length - 1 ) {
          let time = this.schedule[ this.index ]
          
          if( typeof time === 'number' && time !== Score.wait ) {
            this.nextTime =  time
          } else {
            if( time === Score.wait ) {
              this.isPaused = true
            }else if( time.owner instanceof Score ) {
              this.isPaused = true
              time.owner.oncomplete.listeners.push( self )
              // shouldExecute = false // doesn't do what I think it should do... 
            }
          }
        }else{
          if( this.shouldLoop ) {
            if( this.timeline[ this.timeline.length - 1 ] !== loopPauseFnc ) {
              this.timeline.push( loopPauseFnc )
            }
            this.nextTime = this.loopPause
          }else{
            this.isPaused = true
          }
          this.oncomplete()
        }

        if( shouldExecute && fnc ) {
          if( Score.isPrototypeOf( fnc )  ) {
            if( !fnc.codeblock ) { // TODO: what do I replace codeblock with? isRunning?
              fnc.start()
            }else{
              // TODO: what is this for?
              fnc.rewind().next()
              //fnc.rewind().next()
              //fnc()
            }
          }else{
            fnc.call( this.track )
          }
          
          let marker      = Gibber.currentTrack.markup.textMarkers[ 'score' ][ this.index - 1 ],
              pos         = marker.find(),
              funcBody    = fnc.toString(),
              isMultiLine = funcBody.includes('\n'),
              code, line 

          pos.start = Object.assign( {}, pos.from )
          pos.end   = Object.assign( {}, pos.to   )

          if( isMultiLine ) {
            code  = fnc.toString().split('\n').slice(1,-1).join('\n')
            pos.start.line += 1
            pos.end.line += 1
          } else {
            if( funcBody.endsWith( '}' ) ) {
              line  = marker.lines[ 0 ].text

              let bracketIdx = line.indexOf( '{' ) + 1,
                  commaIdx   = line.indexOf( ',' ),
                  commaAmount = line.endsWith( ',' ) ? 1 : 0
  
              code = line.substr( bracketIdx, line.length - bracketIdx - 1 - commaAmount )

              pos.horizontalOffset = bracketIdx//pos.start.ch

            }else{
              // TODO: why doesn't this work? acorn seems unable to parse arrow functions?
              line = marker.lines[ 0 ].text
              
              let arrowIdx = line.indexOf( '>' ) + 1,
                  commaAmount = line.endsWith( ',' ) ? 1 : 0

              code = line.substr( arrowIdx, line.length - arrowIdx - commaAmount )

              pos.horizontalOffset = arrowIdx

            }
          }
          //funcBody = fnc.toString(),
          //code = funcBody.match(/(?:function\s*\(\)*[\s]*[\{\n])([\s\S]*)\}/)[1]
          //code = funcBody.match(/(?:(?:\(\))*(?:_)*(?:=>)\s*(?:\{)*)([\"\'\.\{\}\(\)\w\d\s\n]+)(?:\})/i)[1]

          // TODO: should not be Gibber.currentTrack ?
          Gibber.Environment.codeMarkup.process( code, pos, Gibber.Environment.codemirror, Gibber.currentTrack )

          if( typeof this.onadvance === 'function' ) this.onadvance( this.index - 1 )
        }
      }

      Gibber.Scheduler.addMessage( this, this.nextTime )
      this.phase += this.rate //rate TODO: what if a beat isn't a quarter note?
    }
    return 0
  },

  rewind : function() { 
    this.phase = this.index = 0 
    this.nextTime = this.schedule[ 0 ]
    return this
  },

  oncomplete: function() {
    // console.log("ON COMPLETE", this.oncomplete.listeners )
    let listeners = this.oncomplete.listeners
    for( let i = listeners.length - 1; i >= 0; i-- ) {
      let listener = listeners[i]
      if( listener instanceof Score ) {
        listener.next()
      }
    }
  }

}

return Score.create.bind( Score )

}

/*
a = Score([ 
  0, function() { console.log('1') },
  1/4, function() { console.log('2') },
  1/4, function() { console.log('3') },
  1/4, function() { console.log('4') },
  1, function() { console.log('5555') },  
]).start()
*/

/*
 *var Score = function( data, opts ) {
 * 
 *  
 *
 *  
 *  var _rate = this.rate,
 *      oldRate  = this.__lookupSetter__( 'rate' )
 *   
 *  Object.defineProperty( this, 'rate', {
 *    get : function() { return _rate },
 *    set : function(v) {
 *      _rate = Mul( Gibber.Clock, v )
 *      oldRate.call( this, _rate )
 *    }
 *  })
 *  
 *  this.rate = this.rate // trigger meta-programming tie to master clock
 *  
 *  Gibber.createProxyProperties( this, {
 *    rate : { min: .1, max: 2, output: 0, timescale: 'audio' },
 *  })
 *}
 *
 *Score.prototype = proto
 *
 *
 *return Score
 *
 *}
 */

/*
a = Score([
  0, console.log.bind( null, 'test1'),
  seconds(.5),console.log.bind( null, 'test2'),
  Score.wait, null,
  seconds(.5),console.log.bind( null, 'test3'),
  seconds(.5),console.log.bind( null, 'test4'),
  seconds(.5),function() { a.rewind(); a.next() }
])

b = Score([
  100, console.log.bind(null,"B"),
  100, console.log.bind(null,"F"),  
  a.oncomplete, function() {
  	console.log("C")
  }
])
.start()

a.start()

-----
a = Score([
  0, console.log.bind( null, 'test1'),
  seconds(.5),console.log.bind( null, 'test2'),
  
  Score.wait, null,
  
  seconds(.5),console.log.bind( null, 'test3'),
  
  seconds(.5), Score([
    0, console.log.bind(null,"A"),
    beats(2), console.log.bind(null,"B")
  ]),
  
  Score.wait, null,
  
  seconds(.5),function() { a.rewind(); a.next() }
]).start()

-----
synth = Synth('bleep')
synth2 = Synth('bleep', {maxVoices:4})

// you need to uncomment the line below after the kick drum comes in
// and execute it

score.next()

score = Score([
  0, synth.note.score( 'c4', 1/4 ),
  
  measures(1), synth.note.score( ['c4','c5'], 1/8 ),
  
  measures(1), synth.note.score( ['c2','c3','c4','c5'], 1/16 ),
  
  measures(1), function() {
    kick = Kick().note.seq( 55,1/4 )
  },
  
  Score.wait, null,
  
  0, synth2.note.score('bb4',1/4 ),
  
  measures(1), synth2.chord.score( [['bb4','g4']], 1/4 ),
  
  measures(2), synth2.chord.score( [['c5','f4']], 1/4 ),
  
  measures(2), function() {
    synth2.chord.seq( [['eb4','bb4','d5']], 1/6 )
    synth2.note.seq.stop()
    synth2.fx.add( Delay(1/9,.35) )
    
    synth2.fadeOut(32)
  },
  
  measures(4), function() {
    ks = Pluck()
    	.note.seq( Rndi(100,600), 1/16 )
    	.blend.seq( Rndf() )
    	.fx.add( Schizo('paranoid') )
    
    Clock.rate = Line( 1, 1.1, 8 )
  },
  
  measures(8), function() {
		Master.fadeOut( 8 )
  },
  
  measures(8), Gibber.clear
  
]).start()

------

synth = Synth('bleep')

verse =  Score([ beats(1/2), synth.note.bind( synth, 'c4' ) ])
chorus = Score([ beats(1/2), synth.note.bind( synth, 'd4' ) ])
bridge = Score([ beats(1/2), synth.note.bind( synth, 'e4' ) ])

song = Score([
  0,                 verse,
  verse.oncomplete,  chorus,
  chorus.oncomplete, verse,
  verse.oncomplete,  chorus,
  chorus.oncomplete, bridge,
  bridge.oncomplete, chorus  
])

song.start()

*/

