module.exports = function( Gibber ) {

let Pattern = Gibber.Pattern

let Hex = function( hexString, time = 1/16, rotation ) {
  let count = 0,
      onesAndZeros = ''


  for( let chr of hexString ) {
    let num = Number( '0x'+chr )

    onesAndZeros += (num & 8) > 0 ? 1 : 0
    onesAndZeros += (num & 4) > 0 ? 1 : 0
    onesAndZeros += (num & 2) > 0 ? 1 : 0
    onesAndZeros += (num & 1) > 0 ? 1 : 0
  } 

  let __onesAndZeros = onesAndZeros.split('') 

  let pattern = Gibber.Pattern.apply( null, __onesAndZeros )

  pattern.time = time

  //let output = { time, shouldExecute: 0 }
  
  pattern.filters.push( ( args ) => {
    let val = args[ 0 ],
        idx = args[ 2 ],
        output = { time, shouldExecute: 0 }

    output.shouldExecute = val > 0
    
    args[ 0 ] = output

    return args
  })

  pattern.reseed = ( ...args )=> {
    let n, k
    
    if( Array.isArray( args[0] ) ) {
      k = args[0][0]
      n = args[0][1]
    }else{
      k = args[0]
      n = args[1]
    }

    if( n === undefined ) n = 16
    
    out = createStartingArray( n,k )
    let _onesAndZeros = Inner( n,k )
    
    pattern.set( _onesAndZeros )
    pattern.time = 1 / n

    // this.checkForUpdateFunction( 'reseed', pattern )

    return pattern
  }

  Gibber.addSequencingToMethod( pattern, 'reseed' )

  if( typeof rotation === 'number' ) pattern.rotate( rotation )

  return pattern
}

return Hex

}
