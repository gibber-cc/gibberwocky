require( './vanillatree.js' )

let Gibber = null, count = -1

let lomView = {
  tree: null,

  init( _gibber ) {
    Gibber = _gibber
    this.setup()
    this.create()

    count++
    if( count )
      Gibber.log( 'the live object model (lom) has been updated.' )
  },

  setup() {
    document.querySelector( '#lomView' ).innerHTML = ''

    this.tree = new VanillaTree('#lomView', {
      placeholder: ''
      //contextmenu: [{
      //  label: 'Label 1',
      //  action: function(id) {
      //    // someAction
      //  }
      //},{
      //  label: 'Label 2',
      //  action: function(id) {
      //    // someAction
      //  }
      //}]
    })
    //elem.addEventListener( 'vtree-select', function( evt ) {
    //  console.log( evt, evt.detail )
    //});
  },

  processTrack( track, id ) {
    let trackID = id === undefined ? track.spec.name : id
    lomView.tree.add({ label:trackID, id:trackID }) 
    for( let device of track.devices ) {
      let deviceID = device.name // device.title
      lomView.tree.add({ label:deviceID, id:deviceID, parent:trackID })
      for( let param of device.parameters ) {
        lomView.tree.add({ label:param.name, id:encodeURI(param.name), parent:deviceID })
      }
    }
  },

  create() {
    Gibber.Live.tracks.forEach( v => lomView.processTrack( v ) )
    Gibber.Live.returns.forEach( v => lomView.processTrack( v ) ) // 'return ' + v.id ) )
    lomView.processTrack( Gibber.Live.master )
  }
}

module.exports = lomView 
