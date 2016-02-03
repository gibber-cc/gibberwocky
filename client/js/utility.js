let Utility = {
  elementArray: function( list ) {
    let out = []

    for( var i = 0; i < list.length; i++ ) {
      out.push( list.item( i ) )
    }

    return out
  },
  
  _classListMethods: [ 'toggle', 'add', 'remove' ],

  create( query ) {
    let elementList = document.querySelectorAll( query ),
        arr = Utility.elementArray( elementList )
    
    for( let method of Utility._classListMethods ) { 
      arr[ method ] = ( style ) => {
        for( let element of arr ) { 
          element.classList[ method ]( style )
        }
      } 
    }

    return arr
  },
}

module.exports = Utility
