*Note*
  - uses MIDI value as core data
  - can translate from string to MIDI (possibly slightly annoying)
  - can also provide pitchbend amount for microtonal stuff
  
*Chord*
  - can build set of notes based on notation and output array of MIDI + pitchbend info
    - really annoying

  ([A-Za-z]b?#?)(\d)([a-z]{3})(b?#?\d)* // captures ['c','c#','cb'] [4] ['min'] [7]
    
*Temperament*
  - Defines number of notes per octave
  - Defines MIDI note number + pitchbend value for each note
  
*Scale*
  - a collection of scale degrees that are then used alongside a Temperament
  - has a key signature
  - can change root scale degree. notes triggered by scale change based on root, scale, and temperament
  - should be able to read tuning files from tune.js
  
  Example:
    a = Scale({ key:'f minor', root:1 })
    a.note( 0 ) // outputs a Note object equivalent to F
    a.root = 4  // modulate to Bb major
    a.note( 2 ) // outputs a Note object equivalent to D (the third of Bb)
    