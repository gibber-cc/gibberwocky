require( './vanillatree.js' )

/* NOTE THAT DRAG/DROP CODE IS IN VANILLATREE.JS FILE */
let Gibber = null, count = -1

let momView = {
  tree: null,

  init( _gibber ) {
    Gibber = _gibber
    this.setup()
    this.create()

    count++
    if( count )
      Gibber.log( 'The Max scene has been updated.' )
  },

  setup() {
    document.querySelector( '#momView' ).innerHTML = ''

    this.tree = new VanillaTree('#momView', {
      placeholder: ''
    })
    this.tree.mode = 'max'
  },

  processDevice( device, id ) {
    momView.tree.add({ label:device.path, id:device.path, parent:'devices' }) 
    for( let value of device.values ) {
      let deviceID = value.name // device.title
      momView.tree.add({ label:deviceID, id:deviceID, parent:device.path })
    }
  },

  create() {    
    let deviceBranch = momView.tree.add({ label:'devices', id:'devices', opened:true })
    for( let deviceName in Gibber.Max.devices ) {
      momView.processDevice( Gibber.Max.devices[ deviceName ] )
    }

    let namespaceBranch = momView.tree.add({ label:'messages', id:'message', opened:true })
    if( Gibber.Max.MOM.messages !== undefined ) {
      for( let ns of Gibber.Max.MOM.messages ) {
        momView.tree.add({ label:ns, id:ns, parent:'message' })
      }
    }

    let paramsBranch = momView.tree.add({ label:'params', id:'params', opened:true })
    for( let param of Gibber.Max.MOM.root.params ) {
      momView.tree.add({ label:param.varname, id:param.varname, parent:'params', opened:true })
    }
    
    let signalsBranch = momView.tree.add({ label:'signals', id:'signals', opened:true })
    for( let ns of Gibber.Max.MOM.signals ) {
      momView.tree.add({ label:ns, id:ns, parent:'signals' })
    }
  }
}

module.exports = momView 
