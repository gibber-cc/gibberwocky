require( 'babel-polyfill' )

let Gibber = require( './gibber.js' ),
    useAudioContext = false,
    count = 0
   
Gibber.init()
window.Gibber = Gibber
