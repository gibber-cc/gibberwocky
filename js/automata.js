module.exports = function( Gibber ) {

let Pattern = Gibber.Pattern

const numberToBinaryArray = num => {
  let str = Number( num ).toString( 2 )
  while( str.length < 8 ) {
    str = '0' + str
  }
  
  // need to use parseFloat and round due to fpe
  return str.split('').map( parseFloat ).map( Math.round )
}

let Automata = function( __rule=30, __axiom='00011000', evolutionSpeed=1, playbackSpeed ) {
  const axiom = typeof __axiom === 'string' ? __axiom : Number( __axiom ).toString( 2 ),
        rule  = numberToBinaryArray( __rule )

  let currentState = axiom.split('').map( parseFloat ).map( Math.round ),
      nextState    = currentState.slice( 0 ),
      pattern      = Gibber.Pattern.apply( null, currentState )

  pattern.time = playbackSpeed === undefined ? 1 / currentState.length : playbackSpeed

  pattern.filters.push( ( args ) => {
    let val = args[ 0 ],
        idx = args[ 2 ],
        output = { time:pattern.time, shouldExecute: 0 }

    output.shouldExecute = val > 0
    
    args[ 0 ] = output

    return args
  })

  const width = currentState.length

  pattern.evolve = ()=> {
    currentState = nextState.slice( 0 )

    for( let i = 0; i < width; i++ ) {
      let sum = ''        
      sum += i > 0 ? currentState[ i - 1 ] : currentState[ currentState.length - 1 ]
      sum += currentState[ i ]
      sum += i < width - 1 ? currentState[ i + 1 ] : currentState[ 0 ]
      nextState[ i ] = rule[ 7 - Number( '0b'+sum ) ]
    }

    pattern.set( nextState )
  }

  Gibber.addSequencingToMethod( pattern, 'evolve' )
  Gibber.Utility.future( ()=> pattern.evolve.seq( 1, evolutionSpeed ), evolutionSpeed )

  return pattern
}

return Automata 

}
