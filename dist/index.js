(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
!function() {

var CodeMirror = require( 'codemirror' )

require( '../node_modules/codemirror/mode/javascript/javascript.js' )

var Gibber = {
  codemirror: null,
  max: null,
  MIDI: require( './midi.js' ),
  test: function() { console.log('test') },
  init: function() {
    this.max = window.max
    this.createCodeMirror()
  },
  createCodeMirror: function() {
    CodeMirror.keyMap.gibber = this.keymap
    var cm = CodeMirror( document.body, { mode:"javascript", keyMap:'gibber' }) 
    this.codemirror = cm
  },
  log: function() {
    var args = Array.prototype.slice.call( arguments, 0 )

    //window.max.outlet( 'test' ) // args.join(' | ' ) )
  },
  keymap : {
    fallthrough:'default',
    'Ctrl-Enter': function( cm ) {
      try {
        var selectedCode = Gibber.getSelectionCodeColumn( Gibber.codemirror, false )

        eval( selectedCode.code )
        Gibber.flash( Gibber.codemirror, selectedCode.selection )
        console.log( selectedCode.code ) 
      } catch (e) {
        console.log("ERROR")
      }
    }
  },
 	getSelectionCodeColumn : function( cm, findBlock ) {
		var pos = cm.getCursor(), 
				text = null
 
  	if( !findBlock ) {
      text = cm.getDoc().getSelection()

      if ( text === "") {
        text = cm.getLine( pos.line )
      }else{
        pos = { start: cm.getCursor('start'), end: cm.getCursor('end') }
        //pos = null
      }
    }else{
      var startline = pos.line, 
          endline = pos.line,
          pos1, pos2, sel
    
      while ( startline > 0 && cm.getLine( startline ) !== "" ) { startline-- }
      while ( endline < cm.lineCount() && cm.getLine( endline ) !== "" ) { endline++ }
    
      pos1 = { line: startline, ch: 0 }
      pos2 = { line: endline, ch: 0 }
    
      text = cm.getRange( pos1, pos2 )

      pos = { start: pos1, end: pos2 }
    }
		
    //GE.Keymap.flash(cm, pos)
		
		return { selection: pos, code: text }
	},
  flash: function(cm, pos) {
    var sel,
        cb = function() { sel.clear() }
  
    if (pos !== null) {
      if( pos.start ) { // if called from a findBlock keymap
        sel = cm.markText( pos.start, pos.end, { className:"CodeMirror-highlight" } );
      }else{ // called with single line
        sel = cm.markText( { line: pos.line, ch:0 }, { line: pos.line, ch:null }, { className: "CodeMirror-highlight" } )
      }
    }else{ // called with selected block
      sel = cm.markText( cm.getCursor(true), cm.getCursor(false), { className: "CodeMirror-highlight" } );
    }
  
    window.setTimeout(cb, 250);
  },
}

module.exports = Gibber

}()

},{"../node_modules/codemirror/mode/javascript/javascript.js":5,"./midi.js":3,"codemirror":4}],2:[function(require,module,exports){
!function() {
  var Gibber = require( './gibber.js' ),
      useAudioContext = false,
      count = 0
     
  Gibber.init()
  window.Gibber = Gibber
  window.MIDI = Gibber.MIDI

  //console.log = Gibber.log.bind( Gibber ) 
  // console.log( "TESTING" )
  // ctx = new AudioContext()

  /*if( useAudioContext ) {*/
    //var ctx = new AudioContext(),
        //clock = new WAAClock( ctx )

    //clock.start()

    //clock.setTimeout( timeout, 0 ).repeat( 1 ) 

  //}else{
   //// setInterval( timeout, 1000 ) 
  /*}*/

}()

},{"./gibber.js":1}],3:[function(require,module,exports){
!function() {

var MIDI = {
  note : function( notenum, velocity, duration ) {
    window.open( 'maxmessage:midi/noteon/' + notenum + '/' + velocity + '/' + duration )
  }
}

module.exports = MIDI
}()

},{}],4:[function(require,module,exports){
// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

// This is CodeMirror (http://codemirror.net), a code editor
// implemented in JavaScript on top of the browser's DOM.
//
// You can find some technical background for some of the code below
// at http://marijnhaverbeke.nl/blog/#cm-internals .

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    module.exports = mod();
  else if (typeof define == "function" && define.amd) // AMD
    return define([], mod);
  else // Plain browser env
    this.CodeMirror = mod();
})(function() {
  "use strict";

  // BROWSER SNIFFING

  // Kludges for bugs and behavior differences that can't be feature
  // detected are enabled based on userAgent etc sniffing.
  var userAgent = navigator.userAgent;
  var platform = navigator.platform;

  var gecko = /gecko\/\d/i.test(userAgent);
  var ie_upto10 = /MSIE \d/.test(userAgent);
  var ie_11up = /Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(userAgent);
  var ie = ie_upto10 || ie_11up;
  var ie_version = ie && (ie_upto10 ? document.documentMode || 6 : ie_11up[1]);
  var webkit = /WebKit\//.test(userAgent);
  var qtwebkit = webkit && /Qt\/\d+\.\d+/.test(userAgent);
  var chrome = /Chrome\//.test(userAgent);
  var presto = /Opera\//.test(userAgent);
  var safari = /Apple Computer/.test(navigator.vendor);
  var mac_geMountainLion = /Mac OS X 1\d\D([8-9]|\d\d)\D/.test(userAgent);
  var phantom = /PhantomJS/.test(userAgent);

  var ios = /AppleWebKit/.test(userAgent) && /Mobile\/\w+/.test(userAgent);
  // This is woefully incomplete. Suggestions for alternative methods welcome.
  var mobile = ios || /Android|webOS|BlackBerry|Opera Mini|Opera Mobi|IEMobile/i.test(userAgent);
  var mac = ios || /Mac/.test(platform);
  var windows = /win/i.test(platform);

  var presto_version = presto && userAgent.match(/Version\/(\d*\.\d*)/);
  if (presto_version) presto_version = Number(presto_version[1]);
  if (presto_version && presto_version >= 15) { presto = false; webkit = true; }
  // Some browsers use the wrong event properties to signal cmd/ctrl on OS X
  var flipCtrlCmd = mac && (qtwebkit || presto && (presto_version == null || presto_version < 12.11));
  var captureRightClick = gecko || (ie && ie_version >= 9);

  // Optimize some code when these features are not used.
  var sawReadOnlySpans = false, sawCollapsedSpans = false;

  // EDITOR CONSTRUCTOR

  // A CodeMirror instance represents an editor. This is the object
  // that user code is usually dealing with.

  function CodeMirror(place, options) {
    if (!(this instanceof CodeMirror)) return new CodeMirror(place, options);

    this.options = options = options ? copyObj(options) : {};
    // Determine effective options based on given values and defaults.
    copyObj(defaults, options, false);
    setGuttersForLineNumbers(options);

    var doc = options.value;
    if (typeof doc == "string") doc = new Doc(doc, options.mode, null, options.lineSeparator);
    this.doc = doc;

    var input = new CodeMirror.inputStyles[options.inputStyle](this);
    var display = this.display = new Display(place, doc, input);
    display.wrapper.CodeMirror = this;
    updateGutters(this);
    themeChanged(this);
    if (options.lineWrapping)
      this.display.wrapper.className += " CodeMirror-wrap";
    if (options.autofocus && !mobile) display.input.focus();
    initScrollbars(this);

    this.state = {
      keyMaps: [],  // stores maps added by addKeyMap
      overlays: [], // highlighting overlays, as added by addOverlay
      modeGen: 0,   // bumped when mode/overlay changes, used to invalidate highlighting info
      overwrite: false,
      delayingBlurEvent: false,
      focused: false,
      suppressEdits: false, // used to disable editing during key handlers when in readOnly mode
      pasteIncoming: false, cutIncoming: false, // help recognize paste/cut edits in input.poll
      selectingText: false,
      draggingText: false,
      highlight: new Delayed(), // stores highlight worker timeout
      keySeq: null,  // Unfinished key sequence
      specialChars: null
    };

    var cm = this;

    // Override magic textarea content restore that IE sometimes does
    // on our hidden textarea on reload
    if (ie && ie_version < 11) setTimeout(function() { cm.display.input.reset(true); }, 20);

    registerEventHandlers(this);
    ensureGlobalHandlers();

    startOperation(this);
    this.curOp.forceUpdate = true;
    attachDoc(this, doc);

    if ((options.autofocus && !mobile) || cm.hasFocus())
      setTimeout(bind(onFocus, this), 20);
    else
      onBlur(this);

    for (var opt in optionHandlers) if (optionHandlers.hasOwnProperty(opt))
      optionHandlers[opt](this, options[opt], Init);
    maybeUpdateLineNumberWidth(this);
    if (options.finishInit) options.finishInit(this);
    for (var i = 0; i < initHooks.length; ++i) initHooks[i](this);
    endOperation(this);
    // Suppress optimizelegibility in Webkit, since it breaks text
    // measuring on line wrapping boundaries.
    if (webkit && options.lineWrapping &&
        getComputedStyle(display.lineDiv).textRendering == "optimizelegibility")
      display.lineDiv.style.textRendering = "auto";
  }

  // DISPLAY CONSTRUCTOR

  // The display handles the DOM integration, both for input reading
  // and content drawing. It holds references to DOM nodes and
  // display-related state.

  function Display(place, doc, input) {
    var d = this;
    this.input = input;

    // Covers bottom-right square when both scrollbars are present.
    d.scrollbarFiller = elt("div", null, "CodeMirror-scrollbar-filler");
    d.scrollbarFiller.setAttribute("cm-not-content", "true");
    // Covers bottom of gutter when coverGutterNextToScrollbar is on
    // and h scrollbar is present.
    d.gutterFiller = elt("div", null, "CodeMirror-gutter-filler");
    d.gutterFiller.setAttribute("cm-not-content", "true");
    // Will contain the actual code, positioned to cover the viewport.
    d.lineDiv = elt("div", null, "CodeMirror-code");
    // Elements are added to these to represent selection and cursors.
    d.selectionDiv = elt("div", null, null, "position: relative; z-index: 1");
    d.cursorDiv = elt("div", null, "CodeMirror-cursors");
    // A visibility: hidden element used to find the size of things.
    d.measure = elt("div", null, "CodeMirror-measure");
    // When lines outside of the viewport are measured, they are drawn in this.
    d.lineMeasure = elt("div", null, "CodeMirror-measure");
    // Wraps everything that needs to exist inside the vertically-padded coordinate system
    d.lineSpace = elt("div", [d.measure, d.lineMeasure, d.selectionDiv, d.cursorDiv, d.lineDiv],
                      null, "position: relative; outline: none");
    // Moved around its parent to cover visible view.
    d.mover = elt("div", [elt("div", [d.lineSpace], "CodeMirror-lines")], null, "position: relative");
    // Set to the height of the document, allowing scrolling.
    d.sizer = elt("div", [d.mover], "CodeMirror-sizer");
    d.sizerWidth = null;
    // Behavior of elts with overflow: auto and padding is
    // inconsistent across browsers. This is used to ensure the
    // scrollable area is big enough.
    d.heightForcer = elt("div", null, null, "position: absolute; height: " + scrollerGap + "px; width: 1px;");
    // Will contain the gutters, if any.
    d.gutters = elt("div", null, "CodeMirror-gutters");
    d.lineGutter = null;
    // Actual scrollable element.
    d.scroller = elt("div", [d.sizer, d.heightForcer, d.gutters], "CodeMirror-scroll");
    d.scroller.setAttribute("tabIndex", "-1");
    // The element in which the editor lives.
    d.wrapper = elt("div", [d.scrollbarFiller, d.gutterFiller, d.scroller], "CodeMirror");

    // Work around IE7 z-index bug (not perfect, hence IE7 not really being supported)
    if (ie && ie_version < 8) { d.gutters.style.zIndex = -1; d.scroller.style.paddingRight = 0; }
    if (!webkit && !(gecko && mobile)) d.scroller.draggable = true;

    if (place) {
      if (place.appendChild) place.appendChild(d.wrapper);
      else place(d.wrapper);
    }

    // Current rendered range (may be bigger than the view window).
    d.viewFrom = d.viewTo = doc.first;
    d.reportedViewFrom = d.reportedViewTo = doc.first;
    // Information about the rendered lines.
    d.view = [];
    d.renderedView = null;
    // Holds info about a single rendered line when it was rendered
    // for measurement, while not in view.
    d.externalMeasured = null;
    // Empty space (in pixels) above the view
    d.viewOffset = 0;
    d.lastWrapHeight = d.lastWrapWidth = 0;
    d.updateLineNumbers = null;

    d.nativeBarWidth = d.barHeight = d.barWidth = 0;
    d.scrollbarsClipped = false;

    // Used to only resize the line number gutter when necessary (when
    // the amount of lines crosses a boundary that makes its width change)
    d.lineNumWidth = d.lineNumInnerWidth = d.lineNumChars = null;
    // Set to true when a non-horizontal-scrolling line widget is
    // added. As an optimization, line widget aligning is skipped when
    // this is false.
    d.alignWidgets = false;

    d.cachedCharWidth = d.cachedTextHeight = d.cachedPaddingH = null;

    // Tracks the maximum line length so that the horizontal scrollbar
    // can be kept static when scrolling.
    d.maxLine = null;
    d.maxLineLength = 0;
    d.maxLineChanged = false;

    // Used for measuring wheel scrolling granularity
    d.wheelDX = d.wheelDY = d.wheelStartX = d.wheelStartY = null;

    // True when shift is held down.
    d.shift = false;

    // Used to track whether anything happened since the context menu
    // was opened.
    d.selForContextMenu = null;

    d.activeTouch = null;

    input.init(d);
  }

  // STATE UPDATES

  // Used to get the editor into a consistent state again when options change.

  function loadMode(cm) {
    cm.doc.mode = CodeMirror.getMode(cm.options, cm.doc.modeOption);
    resetModeState(cm);
  }

  function resetModeState(cm) {
    cm.doc.iter(function(line) {
      if (line.stateAfter) line.stateAfter = null;
      if (line.styles) line.styles = null;
    });
    cm.doc.frontier = cm.doc.first;
    startWorker(cm, 100);
    cm.state.modeGen++;
    if (cm.curOp) regChange(cm);
  }

  function wrappingChanged(cm) {
    if (cm.options.lineWrapping) {
      addClass(cm.display.wrapper, "CodeMirror-wrap");
      cm.display.sizer.style.minWidth = "";
      cm.display.sizerWidth = null;
    } else {
      rmClass(cm.display.wrapper, "CodeMirror-wrap");
      findMaxLine(cm);
    }
    estimateLineHeights(cm);
    regChange(cm);
    clearCaches(cm);
    setTimeout(function(){updateScrollbars(cm);}, 100);
  }

  // Returns a function that estimates the height of a line, to use as
  // first approximation until the line becomes visible (and is thus
  // properly measurable).
  function estimateHeight(cm) {
    var th = textHeight(cm.display), wrapping = cm.options.lineWrapping;
    var perLine = wrapping && Math.max(5, cm.display.scroller.clientWidth / charWidth(cm.display) - 3);
    return function(line) {
      if (lineIsHidden(cm.doc, line)) return 0;

      var widgetsHeight = 0;
      if (line.widgets) for (var i = 0; i < line.widgets.length; i++) {
        if (line.widgets[i].height) widgetsHeight += line.widgets[i].height;
      }

      if (wrapping)
        return widgetsHeight + (Math.ceil(line.text.length / perLine) || 1) * th;
      else
        return widgetsHeight + th;
    };
  }

  function estimateLineHeights(cm) {
    var doc = cm.doc, est = estimateHeight(cm);
    doc.iter(function(line) {
      var estHeight = est(line);
      if (estHeight != line.height) updateLineHeight(line, estHeight);
    });
  }

  function themeChanged(cm) {
    cm.display.wrapper.className = cm.display.wrapper.className.replace(/\s*cm-s-\S+/g, "") +
      cm.options.theme.replace(/(^|\s)\s*/g, " cm-s-");
    clearCaches(cm);
  }

  function guttersChanged(cm) {
    updateGutters(cm);
    regChange(cm);
    setTimeout(function(){alignHorizontally(cm);}, 20);
  }

  // Rebuild the gutter elements, ensure the margin to the left of the
  // code matches their width.
  function updateGutters(cm) {
    var gutters = cm.display.gutters, specs = cm.options.gutters;
    removeChildren(gutters);
    for (var i = 0; i < specs.length; ++i) {
      var gutterClass = specs[i];
      var gElt = gutters.appendChild(elt("div", null, "CodeMirror-gutter " + gutterClass));
      if (gutterClass == "CodeMirror-linenumbers") {
        cm.display.lineGutter = gElt;
        gElt.style.width = (cm.display.lineNumWidth || 1) + "px";
      }
    }
    gutters.style.display = i ? "" : "none";
    updateGutterSpace(cm);
  }

  function updateGutterSpace(cm) {
    var width = cm.display.gutters.offsetWidth;
    cm.display.sizer.style.marginLeft = width + "px";
  }

  // Compute the character length of a line, taking into account
  // collapsed ranges (see markText) that might hide parts, and join
  // other lines onto it.
  function lineLength(line) {
    if (line.height == 0) return 0;
    var len = line.text.length, merged, cur = line;
    while (merged = collapsedSpanAtStart(cur)) {
      var found = merged.find(0, true);
      cur = found.from.line;
      len += found.from.ch - found.to.ch;
    }
    cur = line;
    while (merged = collapsedSpanAtEnd(cur)) {
      var found = merged.find(0, true);
      len -= cur.text.length - found.from.ch;
      cur = found.to.line;
      len += cur.text.length - found.to.ch;
    }
    return len;
  }

  // Find the longest line in the document.
  function findMaxLine(cm) {
    var d = cm.display, doc = cm.doc;
    d.maxLine = getLine(doc, doc.first);
    d.maxLineLength = lineLength(d.maxLine);
    d.maxLineChanged = true;
    doc.iter(function(line) {
      var len = lineLength(line);
      if (len > d.maxLineLength) {
        d.maxLineLength = len;
        d.maxLine = line;
      }
    });
  }

  // Make sure the gutters options contains the element
  // "CodeMirror-linenumbers" when the lineNumbers option is true.
  function setGuttersForLineNumbers(options) {
    var found = indexOf(options.gutters, "CodeMirror-linenumbers");
    if (found == -1 && options.lineNumbers) {
      options.gutters = options.gutters.concat(["CodeMirror-linenumbers"]);
    } else if (found > -1 && !options.lineNumbers) {
      options.gutters = options.gutters.slice(0);
      options.gutters.splice(found, 1);
    }
  }

  // SCROLLBARS

  // Prepare DOM reads needed to update the scrollbars. Done in one
  // shot to minimize update/measure roundtrips.
  function measureForScrollbars(cm) {
    var d = cm.display, gutterW = d.gutters.offsetWidth;
    var docH = Math.round(cm.doc.height + paddingVert(cm.display));
    return {
      clientHeight: d.scroller.clientHeight,
      viewHeight: d.wrapper.clientHeight,
      scrollWidth: d.scroller.scrollWidth, clientWidth: d.scroller.clientWidth,
      viewWidth: d.wrapper.clientWidth,
      barLeft: cm.options.fixedGutter ? gutterW : 0,
      docHeight: docH,
      scrollHeight: docH + scrollGap(cm) + d.barHeight,
      nativeBarWidth: d.nativeBarWidth,
      gutterWidth: gutterW
    };
  }

  function NativeScrollbars(place, scroll, cm) {
    this.cm = cm;
    var vert = this.vert = elt("div", [elt("div", null, null, "min-width: 1px")], "CodeMirror-vscrollbar");
    var horiz = this.horiz = elt("div", [elt("div", null, null, "height: 100%; min-height: 1px")], "CodeMirror-hscrollbar");
    place(vert); place(horiz);

    on(vert, "scroll", function() {
      if (vert.clientHeight) scroll(vert.scrollTop, "vertical");
    });
    on(horiz, "scroll", function() {
      if (horiz.clientWidth) scroll(horiz.scrollLeft, "horizontal");
    });

    this.checkedZeroWidth = false;
    // Need to set a minimum width to see the scrollbar on IE7 (but must not set it on IE8).
    if (ie && ie_version < 8) this.horiz.style.minHeight = this.vert.style.minWidth = "18px";
  }

  NativeScrollbars.prototype = copyObj({
    update: function(measure) {
      var needsH = measure.scrollWidth > measure.clientWidth + 1;
      var needsV = measure.scrollHeight > measure.clientHeight + 1;
      var sWidth = measure.nativeBarWidth;

      if (needsV) {
        this.vert.style.display = "block";
        this.vert.style.bottom = needsH ? sWidth + "px" : "0";
        var totalHeight = measure.viewHeight - (needsH ? sWidth : 0);
        // A bug in IE8 can cause this value to be negative, so guard it.
        this.vert.firstChild.style.height =
          Math.max(0, measure.scrollHeight - measure.clientHeight + totalHeight) + "px";
      } else {
        this.vert.style.display = "";
        this.vert.firstChild.style.height = "0";
      }

      if (needsH) {
        this.horiz.style.display = "block";
        this.horiz.style.right = needsV ? sWidth + "px" : "0";
        this.horiz.style.left = measure.barLeft + "px";
        var totalWidth = measure.viewWidth - measure.barLeft - (needsV ? sWidth : 0);
        this.horiz.firstChild.style.width =
          (measure.scrollWidth - measure.clientWidth + totalWidth) + "px";
      } else {
        this.horiz.style.display = "";
        this.horiz.firstChild.style.width = "0";
      }

      if (!this.checkedZeroWidth && measure.clientHeight > 0) {
        if (sWidth == 0) this.zeroWidthHack();
        this.checkedZeroWidth = true;
      }

      return {right: needsV ? sWidth : 0, bottom: needsH ? sWidth : 0};
    },
    setScrollLeft: function(pos) {
      if (this.horiz.scrollLeft != pos) this.horiz.scrollLeft = pos;
      if (this.disableHoriz) this.enableZeroWidthBar(this.horiz, this.disableHoriz);
    },
    setScrollTop: function(pos) {
      if (this.vert.scrollTop != pos) this.vert.scrollTop = pos;
      if (this.disableVert) this.enableZeroWidthBar(this.vert, this.disableVert);
    },
    zeroWidthHack: function() {
      var w = mac && !mac_geMountainLion ? "12px" : "18px";
      this.horiz.style.height = this.vert.style.width = w;
      this.horiz.style.pointerEvents = this.vert.style.pointerEvents = "none";
      this.disableHoriz = new Delayed;
      this.disableVert = new Delayed;
    },
    enableZeroWidthBar: function(bar, delay) {
      bar.style.pointerEvents = "auto";
      function maybeDisable() {
        // To find out whether the scrollbar is still visible, we
        // check whether the element under the pixel in the bottom
        // left corner of the scrollbar box is the scrollbar box
        // itself (when the bar is still visible) or its filler child
        // (when the bar is hidden). If it is still visible, we keep
        // it enabled, if it's hidden, we disable pointer events.
        var box = bar.getBoundingClientRect();
        var elt = document.elementFromPoint(box.left + 1, box.bottom - 1);
        if (elt != bar) bar.style.pointerEvents = "none";
        else delay.set(1000, maybeDisable);
      }
      delay.set(1000, maybeDisable);
    },
    clear: function() {
      var parent = this.horiz.parentNode;
      parent.removeChild(this.horiz);
      parent.removeChild(this.vert);
    }
  }, NativeScrollbars.prototype);

  function NullScrollbars() {}

  NullScrollbars.prototype = copyObj({
    update: function() { return {bottom: 0, right: 0}; },
    setScrollLeft: function() {},
    setScrollTop: function() {},
    clear: function() {}
  }, NullScrollbars.prototype);

  CodeMirror.scrollbarModel = {"native": NativeScrollbars, "null": NullScrollbars};

  function initScrollbars(cm) {
    if (cm.display.scrollbars) {
      cm.display.scrollbars.clear();
      if (cm.display.scrollbars.addClass)
        rmClass(cm.display.wrapper, cm.display.scrollbars.addClass);
    }

    cm.display.scrollbars = new CodeMirror.scrollbarModel[cm.options.scrollbarStyle](function(node) {
      cm.display.wrapper.insertBefore(node, cm.display.scrollbarFiller);
      // Prevent clicks in the scrollbars from killing focus
      on(node, "mousedown", function() {
        if (cm.state.focused) setTimeout(function() { cm.display.input.focus(); }, 0);
      });
      node.setAttribute("cm-not-content", "true");
    }, function(pos, axis) {
      if (axis == "horizontal") setScrollLeft(cm, pos);
      else setScrollTop(cm, pos);
    }, cm);
    if (cm.display.scrollbars.addClass)
      addClass(cm.display.wrapper, cm.display.scrollbars.addClass);
  }

  function updateScrollbars(cm, measure) {
    if (!measure) measure = measureForScrollbars(cm);
    var startWidth = cm.display.barWidth, startHeight = cm.display.barHeight;
    updateScrollbarsInner(cm, measure);
    for (var i = 0; i < 4 && startWidth != cm.display.barWidth || startHeight != cm.display.barHeight; i++) {
      if (startWidth != cm.display.barWidth && cm.options.lineWrapping)
        updateHeightsInViewport(cm);
      updateScrollbarsInner(cm, measureForScrollbars(cm));
      startWidth = cm.display.barWidth; startHeight = cm.display.barHeight;
    }
  }

  // Re-synchronize the fake scrollbars with the actual size of the
  // content.
  function updateScrollbarsInner(cm, measure) {
    var d = cm.display;
    var sizes = d.scrollbars.update(measure);

    d.sizer.style.paddingRight = (d.barWidth = sizes.right) + "px";
    d.sizer.style.paddingBottom = (d.barHeight = sizes.bottom) + "px";

    if (sizes.right && sizes.bottom) {
      d.scrollbarFiller.style.display = "block";
      d.scrollbarFiller.style.height = sizes.bottom + "px";
      d.scrollbarFiller.style.width = sizes.right + "px";
    } else d.scrollbarFiller.style.display = "";
    if (sizes.bottom && cm.options.coverGutterNextToScrollbar && cm.options.fixedGutter) {
      d.gutterFiller.style.display = "block";
      d.gutterFiller.style.height = sizes.bottom + "px";
      d.gutterFiller.style.width = measure.gutterWidth + "px";
    } else d.gutterFiller.style.display = "";
  }

  // Compute the lines that are visible in a given viewport (defaults
  // the the current scroll position). viewport may contain top,
  // height, and ensure (see op.scrollToPos) properties.
  function visibleLines(display, doc, viewport) {
    var top = viewport && viewport.top != null ? Math.max(0, viewport.top) : display.scroller.scrollTop;
    top = Math.floor(top - paddingTop(display));
    var bottom = viewport && viewport.bottom != null ? viewport.bottom : top + display.wrapper.clientHeight;

    var from = lineAtHeight(doc, top), to = lineAtHeight(doc, bottom);
    // Ensure is a {from: {line, ch}, to: {line, ch}} object, and
    // forces those lines into the viewport (if possible).
    if (viewport && viewport.ensure) {
      var ensureFrom = viewport.ensure.from.line, ensureTo = viewport.ensure.to.line;
      if (ensureFrom < from) {
        from = ensureFrom;
        to = lineAtHeight(doc, heightAtLine(getLine(doc, ensureFrom)) + display.wrapper.clientHeight);
      } else if (Math.min(ensureTo, doc.lastLine()) >= to) {
        from = lineAtHeight(doc, heightAtLine(getLine(doc, ensureTo)) - display.wrapper.clientHeight);
        to = ensureTo;
      }
    }
    return {from: from, to: Math.max(to, from + 1)};
  }

  // LINE NUMBERS

  // Re-align line numbers and gutter marks to compensate for
  // horizontal scrolling.
  function alignHorizontally(cm) {
    var display = cm.display, view = display.view;
    if (!display.alignWidgets && (!display.gutters.firstChild || !cm.options.fixedGutter)) return;
    var comp = compensateForHScroll(display) - display.scroller.scrollLeft + cm.doc.scrollLeft;
    var gutterW = display.gutters.offsetWidth, left = comp + "px";
    for (var i = 0; i < view.length; i++) if (!view[i].hidden) {
      if (cm.options.fixedGutter && view[i].gutter)
        view[i].gutter.style.left = left;
      var align = view[i].alignable;
      if (align) for (var j = 0; j < align.length; j++)
        align[j].style.left = left;
    }
    if (cm.options.fixedGutter)
      display.gutters.style.left = (comp + gutterW) + "px";
  }

  // Used to ensure that the line number gutter is still the right
  // size for the current document size. Returns true when an update
  // is needed.
  function maybeUpdateLineNumberWidth(cm) {
    if (!cm.options.lineNumbers) return false;
    var doc = cm.doc, last = lineNumberFor(cm.options, doc.first + doc.size - 1), display = cm.display;
    if (last.length != display.lineNumChars) {
      var test = display.measure.appendChild(elt("div", [elt("div", last)],
                                                 "CodeMirror-linenumber CodeMirror-gutter-elt"));
      var innerW = test.firstChild.offsetWidth, padding = test.offsetWidth - innerW;
      display.lineGutter.style.width = "";
      display.lineNumInnerWidth = Math.max(innerW, display.lineGutter.offsetWidth - padding) + 1;
      display.lineNumWidth = display.lineNumInnerWidth + padding;
      display.lineNumChars = display.lineNumInnerWidth ? last.length : -1;
      display.lineGutter.style.width = display.lineNumWidth + "px";
      updateGutterSpace(cm);
      return true;
    }
    return false;
  }

  function lineNumberFor(options, i) {
    return String(options.lineNumberFormatter(i + options.firstLineNumber));
  }

  // Computes display.scroller.scrollLeft + display.gutters.offsetWidth,
  // but using getBoundingClientRect to get a sub-pixel-accurate
  // result.
  function compensateForHScroll(display) {
    return display.scroller.getBoundingClientRect().left - display.sizer.getBoundingClientRect().left;
  }

  // DISPLAY DRAWING

  function DisplayUpdate(cm, viewport, force) {
    var display = cm.display;

    this.viewport = viewport;
    // Store some values that we'll need later (but don't want to force a relayout for)
    this.visible = visibleLines(display, cm.doc, viewport);
    this.editorIsHidden = !display.wrapper.offsetWidth;
    this.wrapperHeight = display.wrapper.clientHeight;
    this.wrapperWidth = display.wrapper.clientWidth;
    this.oldDisplayWidth = displayWidth(cm);
    this.force = force;
    this.dims = getDimensions(cm);
    this.events = [];
  }

  DisplayUpdate.prototype.signal = function(emitter, type) {
    if (hasHandler(emitter, type))
      this.events.push(arguments);
  };
  DisplayUpdate.prototype.finish = function() {
    for (var i = 0; i < this.events.length; i++)
      signal.apply(null, this.events[i]);
  };

  function maybeClipScrollbars(cm) {
    var display = cm.display;
    if (!display.scrollbarsClipped && display.scroller.offsetWidth) {
      display.nativeBarWidth = display.scroller.offsetWidth - display.scroller.clientWidth;
      display.heightForcer.style.height = scrollGap(cm) + "px";
      display.sizer.style.marginBottom = -display.nativeBarWidth + "px";
      display.sizer.style.borderRightWidth = scrollGap(cm) + "px";
      display.scrollbarsClipped = true;
    }
  }

  // Does the actual updating of the line display. Bails out
  // (returning false) when there is nothing to be done and forced is
  // false.
  function updateDisplayIfNeeded(cm, update) {
    var display = cm.display, doc = cm.doc;

    if (update.editorIsHidden) {
      resetView(cm);
      return false;
    }

    // Bail out if the visible area is already rendered and nothing changed.
    if (!update.force &&
        update.visible.from >= display.viewFrom && update.visible.to <= display.viewTo &&
        (display.updateLineNumbers == null || display.updateLineNumbers >= display.viewTo) &&
        display.renderedView == display.view && countDirtyView(cm) == 0)
      return false;

    if (maybeUpdateLineNumberWidth(cm)) {
      resetView(cm);
      update.dims = getDimensions(cm);
    }

    // Compute a suitable new viewport (from & to)
    var end = doc.first + doc.size;
    var from = Math.max(update.visible.from - cm.options.viewportMargin, doc.first);
    var to = Math.min(end, update.visible.to + cm.options.viewportMargin);
    if (display.viewFrom < from && from - display.viewFrom < 20) from = Math.max(doc.first, display.viewFrom);
    if (display.viewTo > to && display.viewTo - to < 20) to = Math.min(end, display.viewTo);
    if (sawCollapsedSpans) {
      from = visualLineNo(cm.doc, from);
      to = visualLineEndNo(cm.doc, to);
    }

    var different = from != display.viewFrom || to != display.viewTo ||
      display.lastWrapHeight != update.wrapperHeight || display.lastWrapWidth != update.wrapperWidth;
    adjustView(cm, from, to);

    display.viewOffset = heightAtLine(getLine(cm.doc, display.viewFrom));
    // Position the mover div to align with the current scroll position
    cm.display.mover.style.top = display.viewOffset + "px";

    var toUpdate = countDirtyView(cm);
    if (!different && toUpdate == 0 && !update.force && display.renderedView == display.view &&
        (display.updateLineNumbers == null || display.updateLineNumbers >= display.viewTo))
      return false;

    // For big changes, we hide the enclosing element during the
    // update, since that speeds up the operations on most browsers.
    var focused = activeElt();
    if (toUpdate > 4) display.lineDiv.style.display = "none";
    patchDisplay(cm, display.updateLineNumbers, update.dims);
    if (toUpdate > 4) display.lineDiv.style.display = "";
    display.renderedView = display.view;
    // There might have been a widget with a focused element that got
    // hidden or updated, if so re-focus it.
    if (focused && activeElt() != focused && focused.offsetHeight) focused.focus();

    // Prevent selection and cursors from interfering with the scroll
    // width and height.
    removeChildren(display.cursorDiv);
    removeChildren(display.selectionDiv);
    display.gutters.style.height = display.sizer.style.minHeight = 0;

    if (different) {
      display.lastWrapHeight = update.wrapperHeight;
      display.lastWrapWidth = update.wrapperWidth;
      startWorker(cm, 400);
    }

    display.updateLineNumbers = null;

    return true;
  }

  function postUpdateDisplay(cm, update) {
    var viewport = update.viewport;
    for (var first = true;; first = false) {
      if (!first || !cm.options.lineWrapping || update.oldDisplayWidth == displayWidth(cm)) {
        // Clip forced viewport to actual scrollable area.
        if (viewport && viewport.top != null)
          viewport = {top: Math.min(cm.doc.height + paddingVert(cm.display) - displayHeight(cm), viewport.top)};
        // Updated line heights might result in the drawn area not
        // actually covering the viewport. Keep looping until it does.
        update.visible = visibleLines(cm.display, cm.doc, viewport);
        if (update.visible.from >= cm.display.viewFrom && update.visible.to <= cm.display.viewTo)
          break;
      }
      if (!updateDisplayIfNeeded(cm, update)) break;
      updateHeightsInViewport(cm);
      var barMeasure = measureForScrollbars(cm);
      updateSelection(cm);
      setDocumentHeight(cm, barMeasure);
      updateScrollbars(cm, barMeasure);
    }

    update.signal(cm, "update", cm);
    if (cm.display.viewFrom != cm.display.reportedViewFrom || cm.display.viewTo != cm.display.reportedViewTo) {
      update.signal(cm, "viewportChange", cm, cm.display.viewFrom, cm.display.viewTo);
      cm.display.reportedViewFrom = cm.display.viewFrom; cm.display.reportedViewTo = cm.display.viewTo;
    }
  }

  function updateDisplaySimple(cm, viewport) {
    var update = new DisplayUpdate(cm, viewport);
    if (updateDisplayIfNeeded(cm, update)) {
      updateHeightsInViewport(cm);
      postUpdateDisplay(cm, update);
      var barMeasure = measureForScrollbars(cm);
      updateSelection(cm);
      setDocumentHeight(cm, barMeasure);
      updateScrollbars(cm, barMeasure);
      update.finish();
    }
  }

  function setDocumentHeight(cm, measure) {
    cm.display.sizer.style.minHeight = measure.docHeight + "px";
    var total = measure.docHeight + cm.display.barHeight;
    cm.display.heightForcer.style.top = total + "px";
    cm.display.gutters.style.height = Math.max(total + scrollGap(cm), measure.clientHeight) + "px";
  }

  // Read the actual heights of the rendered lines, and update their
  // stored heights to match.
  function updateHeightsInViewport(cm) {
    var display = cm.display;
    var prevBottom = display.lineDiv.offsetTop;
    for (var i = 0; i < display.view.length; i++) {
      var cur = display.view[i], height;
      if (cur.hidden) continue;
      if (ie && ie_version < 8) {
        var bot = cur.node.offsetTop + cur.node.offsetHeight;
        height = bot - prevBottom;
        prevBottom = bot;
      } else {
        var box = cur.node.getBoundingClientRect();
        height = box.bottom - box.top;
      }
      var diff = cur.line.height - height;
      if (height < 2) height = textHeight(display);
      if (diff > .001 || diff < -.001) {
        updateLineHeight(cur.line, height);
        updateWidgetHeight(cur.line);
        if (cur.rest) for (var j = 0; j < cur.rest.length; j++)
          updateWidgetHeight(cur.rest[j]);
      }
    }
  }

  // Read and store the height of line widgets associated with the
  // given line.
  function updateWidgetHeight(line) {
    if (line.widgets) for (var i = 0; i < line.widgets.length; ++i)
      line.widgets[i].height = line.widgets[i].node.offsetHeight;
  }

  // Do a bulk-read of the DOM positions and sizes needed to draw the
  // view, so that we don't interleave reading and writing to the DOM.
  function getDimensions(cm) {
    var d = cm.display, left = {}, width = {};
    var gutterLeft = d.gutters.clientLeft;
    for (var n = d.gutters.firstChild, i = 0; n; n = n.nextSibling, ++i) {
      left[cm.options.gutters[i]] = n.offsetLeft + n.clientLeft + gutterLeft;
      width[cm.options.gutters[i]] = n.clientWidth;
    }
    return {fixedPos: compensateForHScroll(d),
            gutterTotalWidth: d.gutters.offsetWidth,
            gutterLeft: left,
            gutterWidth: width,
            wrapperWidth: d.wrapper.clientWidth};
  }

  // Sync the actual display DOM structure with display.view, removing
  // nodes for lines that are no longer in view, and creating the ones
  // that are not there yet, and updating the ones that are out of
  // date.
  function patchDisplay(cm, updateNumbersFrom, dims) {
    var display = cm.display, lineNumbers = cm.options.lineNumbers;
    var container = display.lineDiv, cur = container.firstChild;

    function rm(node) {
      var next = node.nextSibling;
      // Works around a throw-scroll bug in OS X Webkit
      if (webkit && mac && cm.display.currentWheelTarget == node)
        node.style.display = "none";
      else
        node.parentNode.removeChild(node);
      return next;
    }

    var view = display.view, lineN = display.viewFrom;
    // Loop over the elements in the view, syncing cur (the DOM nodes
    // in display.lineDiv) with the view as we go.
    for (var i = 0; i < view.length; i++) {
      var lineView = view[i];
      if (lineView.hidden) {
      } else if (!lineView.node || lineView.node.parentNode != container) { // Not drawn yet
        var node = buildLineElement(cm, lineView, lineN, dims);
        container.insertBefore(node, cur);
      } else { // Already drawn
        while (cur != lineView.node) cur = rm(cur);
        var updateNumber = lineNumbers && updateNumbersFrom != null &&
          updateNumbersFrom <= lineN && lineView.lineNumber;
        if (lineView.changes) {
          if (indexOf(lineView.changes, "gutter") > -1) updateNumber = false;
          updateLineForChanges(cm, lineView, lineN, dims);
        }
        if (updateNumber) {
          removeChildren(lineView.lineNumber);
          lineView.lineNumber.appendChild(document.createTextNode(lineNumberFor(cm.options, lineN)));
        }
        cur = lineView.node.nextSibling;
      }
      lineN += lineView.size;
    }
    while (cur) cur = rm(cur);
  }

  // When an aspect of a line changes, a string is added to
  // lineView.changes. This updates the relevant part of the line's
  // DOM structure.
  function updateLineForChanges(cm, lineView, lineN, dims) {
    for (var j = 0; j < lineView.changes.length; j++) {
      var type = lineView.changes[j];
      if (type == "text") updateLineText(cm, lineView);
      else if (type == "gutter") updateLineGutter(cm, lineView, lineN, dims);
      else if (type == "class") updateLineClasses(lineView);
      else if (type == "widget") updateLineWidgets(cm, lineView, dims);
    }
    lineView.changes = null;
  }

  // Lines with gutter elements, widgets or a background class need to
  // be wrapped, and have the extra elements added to the wrapper div
  function ensureLineWrapped(lineView) {
    if (lineView.node == lineView.text) {
      lineView.node = elt("div", null, null, "position: relative");
      if (lineView.text.parentNode)
        lineView.text.parentNode.replaceChild(lineView.node, lineView.text);
      lineView.node.appendChild(lineView.text);
      if (ie && ie_version < 8) lineView.node.style.zIndex = 2;
    }
    return lineView.node;
  }

  function updateLineBackground(lineView) {
    var cls = lineView.bgClass ? lineView.bgClass + " " + (lineView.line.bgClass || "") : lineView.line.bgClass;
    if (cls) cls += " CodeMirror-linebackground";
    if (lineView.background) {
      if (cls) lineView.background.className = cls;
      else { lineView.background.parentNode.removeChild(lineView.background); lineView.background = null; }
    } else if (cls) {
      var wrap = ensureLineWrapped(lineView);
      lineView.background = wrap.insertBefore(elt("div", null, cls), wrap.firstChild);
    }
  }

  // Wrapper around buildLineContent which will reuse the structure
  // in display.externalMeasured when possible.
  function getLineContent(cm, lineView) {
    var ext = cm.display.externalMeasured;
    if (ext && ext.line == lineView.line) {
      cm.display.externalMeasured = null;
      lineView.measure = ext.measure;
      return ext.built;
    }
    return buildLineContent(cm, lineView);
  }

  // Redraw the line's text. Interacts with the background and text
  // classes because the mode may output tokens that influence these
  // classes.
  function updateLineText(cm, lineView) {
    var cls = lineView.text.className;
    var built = getLineContent(cm, lineView);
    if (lineView.text == lineView.node) lineView.node = built.pre;
    lineView.text.parentNode.replaceChild(built.pre, lineView.text);
    lineView.text = built.pre;
    if (built.bgClass != lineView.bgClass || built.textClass != lineView.textClass) {
      lineView.bgClass = built.bgClass;
      lineView.textClass = built.textClass;
      updateLineClasses(lineView);
    } else if (cls) {
      lineView.text.className = cls;
    }
  }

  function updateLineClasses(lineView) {
    updateLineBackground(lineView);
    if (lineView.line.wrapClass)
      ensureLineWrapped(lineView).className = lineView.line.wrapClass;
    else if (lineView.node != lineView.text)
      lineView.node.className = "";
    var textClass = lineView.textClass ? lineView.textClass + " " + (lineView.line.textClass || "") : lineView.line.textClass;
    lineView.text.className = textClass || "";
  }

  function updateLineGutter(cm, lineView, lineN, dims) {
    if (lineView.gutter) {
      lineView.node.removeChild(lineView.gutter);
      lineView.gutter = null;
    }
    if (lineView.gutterBackground) {
      lineView.node.removeChild(lineView.gutterBackground);
      lineView.gutterBackground = null;
    }
    if (lineView.line.gutterClass) {
      var wrap = ensureLineWrapped(lineView);
      lineView.gutterBackground = elt("div", null, "CodeMirror-gutter-background " + lineView.line.gutterClass,
                                      "left: " + (cm.options.fixedGutter ? dims.fixedPos : -dims.gutterTotalWidth) +
                                      "px; width: " + dims.gutterTotalWidth + "px");
      wrap.insertBefore(lineView.gutterBackground, lineView.text);
    }
    var markers = lineView.line.gutterMarkers;
    if (cm.options.lineNumbers || markers) {
      var wrap = ensureLineWrapped(lineView);
      var gutterWrap = lineView.gutter = elt("div", null, "CodeMirror-gutter-wrapper", "left: " +
                                             (cm.options.fixedGutter ? dims.fixedPos : -dims.gutterTotalWidth) + "px");
      cm.display.input.setUneditable(gutterWrap);
      wrap.insertBefore(gutterWrap, lineView.text);
      if (lineView.line.gutterClass)
        gutterWrap.className += " " + lineView.line.gutterClass;
      if (cm.options.lineNumbers && (!markers || !markers["CodeMirror-linenumbers"]))
        lineView.lineNumber = gutterWrap.appendChild(
          elt("div", lineNumberFor(cm.options, lineN),
              "CodeMirror-linenumber CodeMirror-gutter-elt",
              "left: " + dims.gutterLeft["CodeMirror-linenumbers"] + "px; width: "
              + cm.display.lineNumInnerWidth + "px"));
      if (markers) for (var k = 0; k < cm.options.gutters.length; ++k) {
        var id = cm.options.gutters[k], found = markers.hasOwnProperty(id) && markers[id];
        if (found)
          gutterWrap.appendChild(elt("div", [found], "CodeMirror-gutter-elt", "left: " +
                                     dims.gutterLeft[id] + "px; width: " + dims.gutterWidth[id] + "px"));
      }
    }
  }

  function updateLineWidgets(cm, lineView, dims) {
    if (lineView.alignable) lineView.alignable = null;
    for (var node = lineView.node.firstChild, next; node; node = next) {
      var next = node.nextSibling;
      if (node.className == "CodeMirror-linewidget")
        lineView.node.removeChild(node);
    }
    insertLineWidgets(cm, lineView, dims);
  }

  // Build a line's DOM representation from scratch
  function buildLineElement(cm, lineView, lineN, dims) {
    var built = getLineContent(cm, lineView);
    lineView.text = lineView.node = built.pre;
    if (built.bgClass) lineView.bgClass = built.bgClass;
    if (built.textClass) lineView.textClass = built.textClass;

    updateLineClasses(lineView);
    updateLineGutter(cm, lineView, lineN, dims);
    insertLineWidgets(cm, lineView, dims);
    return lineView.node;
  }

  // A lineView may contain multiple logical lines (when merged by
  // collapsed spans). The widgets for all of them need to be drawn.
  function insertLineWidgets(cm, lineView, dims) {
    insertLineWidgetsFor(cm, lineView.line, lineView, dims, true);
    if (lineView.rest) for (var i = 0; i < lineView.rest.length; i++)
      insertLineWidgetsFor(cm, lineView.rest[i], lineView, dims, false);
  }

  function insertLineWidgetsFor(cm, line, lineView, dims, allowAbove) {
    if (!line.widgets) return;
    var wrap = ensureLineWrapped(lineView);
    for (var i = 0, ws = line.widgets; i < ws.length; ++i) {
      var widget = ws[i], node = elt("div", [widget.node], "CodeMirror-linewidget");
      if (!widget.handleMouseEvents) node.setAttribute("cm-ignore-events", "true");
      positionLineWidget(widget, node, lineView, dims);
      cm.display.input.setUneditable(node);
      if (allowAbove && widget.above)
        wrap.insertBefore(node, lineView.gutter || lineView.text);
      else
        wrap.appendChild(node);
      signalLater(widget, "redraw");
    }
  }

  function positionLineWidget(widget, node, lineView, dims) {
    if (widget.noHScroll) {
      (lineView.alignable || (lineView.alignable = [])).push(node);
      var width = dims.wrapperWidth;
      node.style.left = dims.fixedPos + "px";
      if (!widget.coverGutter) {
        width -= dims.gutterTotalWidth;
        node.style.paddingLeft = dims.gutterTotalWidth + "px";
      }
      node.style.width = width + "px";
    }
    if (widget.coverGutter) {
      node.style.zIndex = 5;
      node.style.position = "relative";
      if (!widget.noHScroll) node.style.marginLeft = -dims.gutterTotalWidth + "px";
    }
  }

  // POSITION OBJECT

  // A Pos instance represents a position within the text.
  var Pos = CodeMirror.Pos = function(line, ch) {
    if (!(this instanceof Pos)) return new Pos(line, ch);
    this.line = line; this.ch = ch;
  };

  // Compare two positions, return 0 if they are the same, a negative
  // number when a is less, and a positive number otherwise.
  var cmp = CodeMirror.cmpPos = function(a, b) { return a.line - b.line || a.ch - b.ch; };

  function copyPos(x) {return Pos(x.line, x.ch);}
  function maxPos(a, b) { return cmp(a, b) < 0 ? b : a; }
  function minPos(a, b) { return cmp(a, b) < 0 ? a : b; }

  // INPUT HANDLING

  function ensureFocus(cm) {
    if (!cm.state.focused) { cm.display.input.focus(); onFocus(cm); }
  }

  function isReadOnly(cm) {
    return cm.options.readOnly || cm.doc.cantEdit;
  }

  // This will be set to an array of strings when copying, so that,
  // when pasting, we know what kind of selections the copied text
  // was made out of.
  var lastCopied = null;

  function applyTextInput(cm, inserted, deleted, sel, origin) {
    var doc = cm.doc;
    cm.display.shift = false;
    if (!sel) sel = doc.sel;

    var paste = cm.state.pasteIncoming || origin == "paste";
    var textLines = doc.splitLines(inserted), multiPaste = null;
    // When pasing N lines into N selections, insert one line per selection
    if (paste && sel.ranges.length > 1) {
      if (lastCopied && lastCopied.join("\n") == inserted) {
        if (sel.ranges.length % lastCopied.length == 0) {
          multiPaste = [];
          for (var i = 0; i < lastCopied.length; i++)
            multiPaste.push(doc.splitLines(lastCopied[i]));
        }
      } else if (textLines.length == sel.ranges.length) {
        multiPaste = map(textLines, function(l) { return [l]; });
      }
    }

    // Normal behavior is to insert the new text into every selection
    for (var i = sel.ranges.length - 1; i >= 0; i--) {
      var range = sel.ranges[i];
      var from = range.from(), to = range.to();
      if (range.empty()) {
        if (deleted && deleted > 0) // Handle deletion
          from = Pos(from.line, from.ch - deleted);
        else if (cm.state.overwrite && !paste) // Handle overwrite
          to = Pos(to.line, Math.min(getLine(doc, to.line).text.length, to.ch + lst(textLines).length));
      }
      var updateInput = cm.curOp.updateInput;
      var changeEvent = {from: from, to: to, text: multiPaste ? multiPaste[i % multiPaste.length] : textLines,
                         origin: origin || (paste ? "paste" : cm.state.cutIncoming ? "cut" : "+input")};
      makeChange(cm.doc, changeEvent);
      signalLater(cm, "inputRead", cm, changeEvent);
    }
    if (inserted && !paste)
      triggerElectric(cm, inserted);

    ensureCursorVisible(cm);
    cm.curOp.updateInput = updateInput;
    cm.curOp.typing = true;
    cm.state.pasteIncoming = cm.state.cutIncoming = false;
  }

  function handlePaste(e, cm) {
    var pasted = e.clipboardData && e.clipboardData.getData("text/plain");
    if (pasted) {
      e.preventDefault();
      if (!isReadOnly(cm) && !cm.options.disableInput)
        runInOp(cm, function() { applyTextInput(cm, pasted, 0, null, "paste"); });
      return true;
    }
  }

  function triggerElectric(cm, inserted) {
    // When an 'electric' character is inserted, immediately trigger a reindent
    if (!cm.options.electricChars || !cm.options.smartIndent) return;
    var sel = cm.doc.sel;

    for (var i = sel.ranges.length - 1; i >= 0; i--) {
      var range = sel.ranges[i];
      if (range.head.ch > 100 || (i && sel.ranges[i - 1].head.line == range.head.line)) continue;
      var mode = cm.getModeAt(range.head);
      var indented = false;
      if (mode.electricChars) {
        for (var j = 0; j < mode.electricChars.length; j++)
          if (inserted.indexOf(mode.electricChars.charAt(j)) > -1) {
            indented = indentLine(cm, range.head.line, "smart");
            break;
          }
      } else if (mode.electricInput) {
        if (mode.electricInput.test(getLine(cm.doc, range.head.line).text.slice(0, range.head.ch)))
          indented = indentLine(cm, range.head.line, "smart");
      }
      if (indented) signalLater(cm, "electricInput", cm, range.head.line);
    }
  }

  function copyableRanges(cm) {
    var text = [], ranges = [];
    for (var i = 0; i < cm.doc.sel.ranges.length; i++) {
      var line = cm.doc.sel.ranges[i].head.line;
      var lineRange = {anchor: Pos(line, 0), head: Pos(line + 1, 0)};
      ranges.push(lineRange);
      text.push(cm.getRange(lineRange.anchor, lineRange.head));
    }
    return {text: text, ranges: ranges};
  }

  function disableBrowserMagic(field) {
    field.setAttribute("autocorrect", "off");
    field.setAttribute("autocapitalize", "off");
    field.setAttribute("spellcheck", "false");
  }

  // TEXTAREA INPUT STYLE

  function TextareaInput(cm) {
    this.cm = cm;
    // See input.poll and input.reset
    this.prevInput = "";

    // Flag that indicates whether we expect input to appear real soon
    // now (after some event like 'keypress' or 'input') and are
    // polling intensively.
    this.pollingFast = false;
    // Self-resetting timeout for the poller
    this.polling = new Delayed();
    // Tracks when input.reset has punted to just putting a short
    // string into the textarea instead of the full selection.
    this.inaccurateSelection = false;
    // Used to work around IE issue with selection being forgotten when focus moves away from textarea
    this.hasSelection = false;
    this.composing = null;
  };

  function hiddenTextarea() {
    var te = elt("textarea", null, null, "position: absolute; padding: 0; width: 1px; height: 1em; outline: none");
    var div = elt("div", [te], null, "overflow: hidden; position: relative; width: 3px; height: 0px;");
    // The textarea is kept positioned near the cursor to prevent the
    // fact that it'll be scrolled into view on input from scrolling
    // our fake cursor out of view. On webkit, when wrap=off, paste is
    // very slow. So make the area wide instead.
    if (webkit) te.style.width = "1000px";
    else te.setAttribute("wrap", "off");
    // If border: 0; -- iOS fails to open keyboard (issue #1287)
    if (ios) te.style.border = "1px solid black";
    disableBrowserMagic(te);
    return div;
  }

  TextareaInput.prototype = copyObj({
    init: function(display) {
      var input = this, cm = this.cm;

      // Wraps and hides input textarea
      var div = this.wrapper = hiddenTextarea();
      // The semihidden textarea that is focused when the editor is
      // focused, and receives input.
      var te = this.textarea = div.firstChild;
      display.wrapper.insertBefore(div, display.wrapper.firstChild);

      // Needed to hide big blue blinking cursor on Mobile Safari (doesn't seem to work in iOS 8 anymore)
      if (ios) te.style.width = "0px";

      on(te, "input", function() {
        if (ie && ie_version >= 9 && input.hasSelection) input.hasSelection = null;
        input.poll();
      });

      on(te, "paste", function(e) {
        if (handlePaste(e, cm)) return true;

        cm.state.pasteIncoming = true;
        input.fastPoll();
      });

      function prepareCopyCut(e) {
        if (cm.somethingSelected()) {
          lastCopied = cm.getSelections();
          if (input.inaccurateSelection) {
            input.prevInput = "";
            input.inaccurateSelection = false;
            te.value = lastCopied.join("\n");
            selectInput(te);
          }
        } else if (!cm.options.lineWiseCopyCut) {
          return;
        } else {
          var ranges = copyableRanges(cm);
          lastCopied = ranges.text;
          if (e.type == "cut") {
            cm.setSelections(ranges.ranges, null, sel_dontScroll);
          } else {
            input.prevInput = "";
            te.value = ranges.text.join("\n");
            selectInput(te);
          }
        }
        if (e.type == "cut") cm.state.cutIncoming = true;
      }
      on(te, "cut", prepareCopyCut);
      on(te, "copy", prepareCopyCut);

      on(display.scroller, "paste", function(e) {
        if (eventInWidget(display, e)) return;
        cm.state.pasteIncoming = true;
        input.focus();
      });

      // Prevent normal selection in the editor (we handle our own)
      on(display.lineSpace, "selectstart", function(e) {
        if (!eventInWidget(display, e)) e_preventDefault(e);
      });

      on(te, "compositionstart", function() {
        var start = cm.getCursor("from");
        if (input.composing) input.composing.range.clear()
        input.composing = {
          start: start,
          range: cm.markText(start, cm.getCursor("to"), {className: "CodeMirror-composing"})
        };
      });
      on(te, "compositionend", function() {
        if (input.composing) {
          input.poll();
          input.composing.range.clear();
          input.composing = null;
        }
      });
    },

    prepareSelection: function() {
      // Redraw the selection and/or cursor
      var cm = this.cm, display = cm.display, doc = cm.doc;
      var result = prepareSelection(cm);

      // Move the hidden textarea near the cursor to prevent scrolling artifacts
      if (cm.options.moveInputWithCursor) {
        var headPos = cursorCoords(cm, doc.sel.primary().head, "div");
        var wrapOff = display.wrapper.getBoundingClientRect(), lineOff = display.lineDiv.getBoundingClientRect();
        result.teTop = Math.max(0, Math.min(display.wrapper.clientHeight - 10,
                                            headPos.top + lineOff.top - wrapOff.top));
        result.teLeft = Math.max(0, Math.min(display.wrapper.clientWidth - 10,
                                             headPos.left + lineOff.left - wrapOff.left));
      }

      return result;
    },

    showSelection: function(drawn) {
      var cm = this.cm, display = cm.display;
      removeChildrenAndAdd(display.cursorDiv, drawn.cursors);
      removeChildrenAndAdd(display.selectionDiv, drawn.selection);
      if (drawn.teTop != null) {
        this.wrapper.style.top = drawn.teTop + "px";
        this.wrapper.style.left = drawn.teLeft + "px";
      }
    },

    // Reset the input to correspond to the selection (or to be empty,
    // when not typing and nothing is selected)
    reset: function(typing) {
      if (this.contextMenuPending) return;
      var minimal, selected, cm = this.cm, doc = cm.doc;
      if (cm.somethingSelected()) {
        this.prevInput = "";
        var range = doc.sel.primary();
        minimal = hasCopyEvent &&
          (range.to().line - range.from().line > 100 || (selected = cm.getSelection()).length > 1000);
        var content = minimal ? "-" : selected || cm.getSelection();
        this.textarea.value = content;
        if (cm.state.focused) selectInput(this.textarea);
        if (ie && ie_version >= 9) this.hasSelection = content;
      } else if (!typing) {
        this.prevInput = this.textarea.value = "";
        if (ie && ie_version >= 9) this.hasSelection = null;
      }
      this.inaccurateSelection = minimal;
    },

    getField: function() { return this.textarea; },

    supportsTouch: function() { return false; },

    focus: function() {
      if (this.cm.options.readOnly != "nocursor" && (!mobile || activeElt() != this.textarea)) {
        try { this.textarea.focus(); }
        catch (e) {} // IE8 will throw if the textarea is display: none or not in DOM
      }
    },

    blur: function() { this.textarea.blur(); },

    resetPosition: function() {
      this.wrapper.style.top = this.wrapper.style.left = 0;
    },

    receivedFocus: function() { this.slowPoll(); },

    // Poll for input changes, using the normal rate of polling. This
    // runs as long as the editor is focused.
    slowPoll: function() {
      var input = this;
      if (input.pollingFast) return;
      input.polling.set(this.cm.options.pollInterval, function() {
        input.poll();
        if (input.cm.state.focused) input.slowPoll();
      });
    },

    // When an event has just come in that is likely to add or change
    // something in the input textarea, we poll faster, to ensure that
    // the change appears on the screen quickly.
    fastPoll: function() {
      var missed = false, input = this;
      input.pollingFast = true;
      function p() {
        var changed = input.poll();
        if (!changed && !missed) {missed = true; input.polling.set(60, p);}
        else {input.pollingFast = false; input.slowPoll();}
      }
      input.polling.set(20, p);
    },

    // Read input from the textarea, and update the document to match.
    // When something is selected, it is present in the textarea, and
    // selected (unless it is huge, in which case a placeholder is
    // used). When nothing is selected, the cursor sits after previously
    // seen text (can be empty), which is stored in prevInput (we must
    // not reset the textarea when typing, because that breaks IME).
    poll: function() {
      var cm = this.cm, input = this.textarea, prevInput = this.prevInput;
      // Since this is called a *lot*, try to bail out as cheaply as
      // possible when it is clear that nothing happened. hasSelection
      // will be the case when there is a lot of text in the textarea,
      // in which case reading its value would be expensive.
      if (this.contextMenuPending || !cm.state.focused ||
          (hasSelection(input) && !prevInput && !this.composing) ||
          isReadOnly(cm) || cm.options.disableInput || cm.state.keySeq)
        return false;

      var text = input.value;
      // If nothing changed, bail.
      if (text == prevInput && !cm.somethingSelected()) return false;
      // Work around nonsensical selection resetting in IE9/10, and
      // inexplicable appearance of private area unicode characters on
      // some key combos in Mac (#2689).
      if (ie && ie_version >= 9 && this.hasSelection === text ||
          mac && /[\uf700-\uf7ff]/.test(text)) {
        cm.display.input.reset();
        return false;
      }

      if (cm.doc.sel == cm.display.selForContextMenu) {
        var first = text.charCodeAt(0);
        if (first == 0x200b && !prevInput) prevInput = "\u200b";
        if (first == 0x21da) { this.reset(); return this.cm.execCommand("undo"); }
      }
      // Find the part of the input that is actually new
      var same = 0, l = Math.min(prevInput.length, text.length);
      while (same < l && prevInput.charCodeAt(same) == text.charCodeAt(same)) ++same;

      var self = this;
      runInOp(cm, function() {
        applyTextInput(cm, text.slice(same), prevInput.length - same,
                       null, self.composing ? "*compose" : null);

        // Don't leave long text in the textarea, since it makes further polling slow
        if (text.length > 1000 || text.indexOf("\n") > -1) input.value = self.prevInput = "";
        else self.prevInput = text;

        if (self.composing) {
          self.composing.range.clear();
          self.composing.range = cm.markText(self.composing.start, cm.getCursor("to"),
                                             {className: "CodeMirror-composing"});
        }
      });
      return true;
    },

    ensurePolled: function() {
      if (this.pollingFast && this.poll()) this.pollingFast = false;
    },

    onKeyPress: function() {
      if (ie && ie_version >= 9) this.hasSelection = null;
      this.fastPoll();
    },

    onContextMenu: function(e) {
      var input = this, cm = input.cm, display = cm.display, te = input.textarea;
      var pos = posFromMouse(cm, e), scrollPos = display.scroller.scrollTop;
      if (!pos || presto) return; // Opera is difficult.

      // Reset the current text selection only if the click is done outside of the selection
      // and 'resetSelectionOnContextMenu' option is true.
      var reset = cm.options.resetSelectionOnContextMenu;
      if (reset && cm.doc.sel.contains(pos) == -1)
        operation(cm, setSelection)(cm.doc, simpleSelection(pos), sel_dontScroll);

      var oldCSS = te.style.cssText;
      input.wrapper.style.position = "absolute";
      te.style.cssText = "position: fixed; width: 30px; height: 30px; top: " + (e.clientY - 5) +
        "px; left: " + (e.clientX - 5) + "px; z-index: 1000; background: " +
        (ie ? "rgba(255, 255, 255, .05)" : "transparent") +
        "; outline: none; border-width: 0; outline: none; overflow: hidden; opacity: .05; filter: alpha(opacity=5);";
      if (webkit) var oldScrollY = window.scrollY; // Work around Chrome issue (#2712)
      display.input.focus();
      if (webkit) window.scrollTo(null, oldScrollY);
      display.input.reset();
      // Adds "Select all" to context menu in FF
      if (!cm.somethingSelected()) te.value = input.prevInput = " ";
      input.contextMenuPending = true;
      display.selForContextMenu = cm.doc.sel;
      clearTimeout(display.detectingSelectAll);

      // Select-all will be greyed out if there's nothing to select, so
      // this adds a zero-width space so that we can later check whether
      // it got selected.
      function prepareSelectAllHack() {
        if (te.selectionStart != null) {
          var selected = cm.somethingSelected();
          var extval = "\u200b" + (selected ? te.value : "");
          te.value = "\u21da"; // Used to catch context-menu undo
          te.value = extval;
          input.prevInput = selected ? "" : "\u200b";
          te.selectionStart = 1; te.selectionEnd = extval.length;
          // Re-set this, in case some other handler touched the
          // selection in the meantime.
          display.selForContextMenu = cm.doc.sel;
        }
      }
      function rehide() {
        input.contextMenuPending = false;
        input.wrapper.style.position = "relative";
        te.style.cssText = oldCSS;
        if (ie && ie_version < 9) display.scrollbars.setScrollTop(display.scroller.scrollTop = scrollPos);

        // Try to detect the user choosing select-all
        if (te.selectionStart != null) {
          if (!ie || (ie && ie_version < 9)) prepareSelectAllHack();
          var i = 0, poll = function() {
            if (display.selForContextMenu == cm.doc.sel && te.selectionStart == 0 &&
                te.selectionEnd > 0 && input.prevInput == "\u200b")
              operation(cm, commands.selectAll)(cm);
            else if (i++ < 10) display.detectingSelectAll = setTimeout(poll, 500);
            else display.input.reset();
          };
          display.detectingSelectAll = setTimeout(poll, 200);
        }
      }

      if (ie && ie_version >= 9) prepareSelectAllHack();
      if (captureRightClick) {
        e_stop(e);
        var mouseup = function() {
          off(window, "mouseup", mouseup);
          setTimeout(rehide, 20);
        };
        on(window, "mouseup", mouseup);
      } else {
        setTimeout(rehide, 50);
      }
    },

    readOnlyChanged: function(val) {
      if (!val) this.reset();
    },

    setUneditable: nothing,

    needsContentAttribute: false
  }, TextareaInput.prototype);

  // CONTENTEDITABLE INPUT STYLE

  function ContentEditableInput(cm) {
    this.cm = cm;
    this.lastAnchorNode = this.lastAnchorOffset = this.lastFocusNode = this.lastFocusOffset = null;
    this.polling = new Delayed();
    this.gracePeriod = false;
  }

  ContentEditableInput.prototype = copyObj({
    init: function(display) {
      var input = this, cm = input.cm;
      var div = input.div = display.lineDiv;
      disableBrowserMagic(div);

      on(div, "paste", function(e) { handlePaste(e, cm); })

      on(div, "compositionstart", function(e) {
        var data = e.data;
        input.composing = {sel: cm.doc.sel, data: data, startData: data};
        if (!data) return;
        var prim = cm.doc.sel.primary();
        var line = cm.getLine(prim.head.line);
        var found = line.indexOf(data, Math.max(0, prim.head.ch - data.length));
        if (found > -1 && found <= prim.head.ch)
          input.composing.sel = simpleSelection(Pos(prim.head.line, found),
                                                Pos(prim.head.line, found + data.length));
      });
      on(div, "compositionupdate", function(e) {
        input.composing.data = e.data;
      });
      on(div, "compositionend", function(e) {
        var ours = input.composing;
        if (!ours) return;
        if (e.data != ours.startData && !/\u200b/.test(e.data))
          ours.data = e.data;
        // Need a small delay to prevent other code (input event,
        // selection polling) from doing damage when fired right after
        // compositionend.
        setTimeout(function() {
          if (!ours.handled)
            input.applyComposition(ours);
          if (input.composing == ours)
            input.composing = null;
        }, 50);
      });

      on(div, "touchstart", function() {
        input.forceCompositionEnd();
      });

      on(div, "input", function() {
        if (input.composing) return;
        if (isReadOnly(cm) || !input.pollContent())
          runInOp(input.cm, function() {regChange(cm);});
      });

      function onCopyCut(e) {
        if (cm.somethingSelected()) {
          lastCopied = cm.getSelections();
          if (e.type == "cut") cm.replaceSelection("", null, "cut");
        } else if (!cm.options.lineWiseCopyCut) {
          return;
        } else {
          var ranges = copyableRanges(cm);
          lastCopied = ranges.text;
          if (e.type == "cut") {
            cm.operation(function() {
              cm.setSelections(ranges.ranges, 0, sel_dontScroll);
              cm.replaceSelection("", null, "cut");
            });
          }
        }
        // iOS exposes the clipboard API, but seems to discard content inserted into it
        if (e.clipboardData && !ios) {
          e.preventDefault();
          e.clipboardData.clearData();
          e.clipboardData.setData("text/plain", lastCopied.join("\n"));
        } else {
          // Old-fashioned briefly-focus-a-textarea hack
          var kludge = hiddenTextarea(), te = kludge.firstChild;
          cm.display.lineSpace.insertBefore(kludge, cm.display.lineSpace.firstChild);
          te.value = lastCopied.join("\n");
          var hadFocus = document.activeElement;
          selectInput(te);
          setTimeout(function() {
            cm.display.lineSpace.removeChild(kludge);
            hadFocus.focus();
          }, 50);
        }
      }
      on(div, "copy", onCopyCut);
      on(div, "cut", onCopyCut);
    },

    prepareSelection: function() {
      var result = prepareSelection(this.cm, false);
      result.focus = this.cm.state.focused;
      return result;
    },

    showSelection: function(info) {
      if (!info || !this.cm.display.view.length) return;
      if (info.focus) this.showPrimarySelection();
      this.showMultipleSelections(info);
    },

    showPrimarySelection: function() {
      var sel = window.getSelection(), prim = this.cm.doc.sel.primary();
      var curAnchor = domToPos(this.cm, sel.anchorNode, sel.anchorOffset);
      var curFocus = domToPos(this.cm, sel.focusNode, sel.focusOffset);
      if (curAnchor && !curAnchor.bad && curFocus && !curFocus.bad &&
          cmp(minPos(curAnchor, curFocus), prim.from()) == 0 &&
          cmp(maxPos(curAnchor, curFocus), prim.to()) == 0)
        return;

      var start = posToDOM(this.cm, prim.from());
      var end = posToDOM(this.cm, prim.to());
      if (!start && !end) return;

      var view = this.cm.display.view;
      var old = sel.rangeCount && sel.getRangeAt(0);
      if (!start) {
        start = {node: view[0].measure.map[2], offset: 0};
      } else if (!end) { // FIXME dangerously hacky
        var measure = view[view.length - 1].measure;
        var map = measure.maps ? measure.maps[measure.maps.length - 1] : measure.map;
        end = {node: map[map.length - 1], offset: map[map.length - 2] - map[map.length - 3]};
      }

      try { var rng = range(start.node, start.offset, end.offset, end.node); }
      catch(e) {} // Our model of the DOM might be outdated, in which case the range we try to set can be impossible
      if (rng) {
        sel.removeAllRanges();
        sel.addRange(rng);
        if (old && sel.anchorNode == null) sel.addRange(old);
        else if (gecko) this.startGracePeriod();
      }
      this.rememberSelection();
    },

    startGracePeriod: function() {
      var input = this;
      clearTimeout(this.gracePeriod);
      this.gracePeriod = setTimeout(function() {
        input.gracePeriod = false;
        if (input.selectionChanged())
          input.cm.operation(function() { input.cm.curOp.selectionChanged = true; });
      }, 20);
    },

    showMultipleSelections: function(info) {
      removeChildrenAndAdd(this.cm.display.cursorDiv, info.cursors);
      removeChildrenAndAdd(this.cm.display.selectionDiv, info.selection);
    },

    rememberSelection: function() {
      var sel = window.getSelection();
      this.lastAnchorNode = sel.anchorNode; this.lastAnchorOffset = sel.anchorOffset;
      this.lastFocusNode = sel.focusNode; this.lastFocusOffset = sel.focusOffset;
    },

    selectionInEditor: function() {
      var sel = window.getSelection();
      if (!sel.rangeCount) return false;
      var node = sel.getRangeAt(0).commonAncestorContainer;
      return contains(this.div, node);
    },

    focus: function() {
      if (this.cm.options.readOnly != "nocursor") this.div.focus();
    },
    blur: function() { this.div.blur(); },
    getField: function() { return this.div; },

    supportsTouch: function() { return true; },

    receivedFocus: function() {
      var input = this;
      if (this.selectionInEditor())
        this.pollSelection();
      else
        runInOp(this.cm, function() { input.cm.curOp.selectionChanged = true; });

      function poll() {
        if (input.cm.state.focused) {
          input.pollSelection();
          input.polling.set(input.cm.options.pollInterval, poll);
        }
      }
      this.polling.set(this.cm.options.pollInterval, poll);
    },

    selectionChanged: function() {
      var sel = window.getSelection();
      return sel.anchorNode != this.lastAnchorNode || sel.anchorOffset != this.lastAnchorOffset ||
        sel.focusNode != this.lastFocusNode || sel.focusOffset != this.lastFocusOffset;
    },

    pollSelection: function() {
      if (!this.composing && !this.gracePeriod && this.selectionChanged()) {
        var sel = window.getSelection(), cm = this.cm;
        this.rememberSelection();
        var anchor = domToPos(cm, sel.anchorNode, sel.anchorOffset);
        var head = domToPos(cm, sel.focusNode, sel.focusOffset);
        if (anchor && head) runInOp(cm, function() {
          setSelection(cm.doc, simpleSelection(anchor, head), sel_dontScroll);
          if (anchor.bad || head.bad) cm.curOp.selectionChanged = true;
        });
      }
    },

    pollContent: function() {
      var cm = this.cm, display = cm.display, sel = cm.doc.sel.primary();
      var from = sel.from(), to = sel.to();
      if (from.line < display.viewFrom || to.line > display.viewTo - 1) return false;

      var fromIndex;
      if (from.line == display.viewFrom || (fromIndex = findViewIndex(cm, from.line)) == 0) {
        var fromLine = lineNo(display.view[0].line);
        var fromNode = display.view[0].node;
      } else {
        var fromLine = lineNo(display.view[fromIndex].line);
        var fromNode = display.view[fromIndex - 1].node.nextSibling;
      }
      var toIndex = findViewIndex(cm, to.line);
      if (toIndex == display.view.length - 1) {
        var toLine = display.viewTo - 1;
        var toNode = display.lineDiv.lastChild;
      } else {
        var toLine = lineNo(display.view[toIndex + 1].line) - 1;
        var toNode = display.view[toIndex + 1].node.previousSibling;
      }

      var newText = cm.doc.splitLines(domTextBetween(cm, fromNode, toNode, fromLine, toLine));
      var oldText = getBetween(cm.doc, Pos(fromLine, 0), Pos(toLine, getLine(cm.doc, toLine).text.length));
      while (newText.length > 1 && oldText.length > 1) {
        if (lst(newText) == lst(oldText)) { newText.pop(); oldText.pop(); toLine--; }
        else if (newText[0] == oldText[0]) { newText.shift(); oldText.shift(); fromLine++; }
        else break;
      }

      var cutFront = 0, cutEnd = 0;
      var newTop = newText[0], oldTop = oldText[0], maxCutFront = Math.min(newTop.length, oldTop.length);
      while (cutFront < maxCutFront && newTop.charCodeAt(cutFront) == oldTop.charCodeAt(cutFront))
        ++cutFront;
      var newBot = lst(newText), oldBot = lst(oldText);
      var maxCutEnd = Math.min(newBot.length - (newText.length == 1 ? cutFront : 0),
                               oldBot.length - (oldText.length == 1 ? cutFront : 0));
      while (cutEnd < maxCutEnd &&
             newBot.charCodeAt(newBot.length - cutEnd - 1) == oldBot.charCodeAt(oldBot.length - cutEnd - 1))
        ++cutEnd;

      newText[newText.length - 1] = newBot.slice(0, newBot.length - cutEnd);
      newText[0] = newText[0].slice(cutFront);

      var chFrom = Pos(fromLine, cutFront);
      var chTo = Pos(toLine, oldText.length ? lst(oldText).length - cutEnd : 0);
      if (newText.length > 1 || newText[0] || cmp(chFrom, chTo)) {
        replaceRange(cm.doc, newText, chFrom, chTo, "+input");
        return true;
      }
    },

    ensurePolled: function() {
      this.forceCompositionEnd();
    },
    reset: function() {
      this.forceCompositionEnd();
    },
    forceCompositionEnd: function() {
      if (!this.composing || this.composing.handled) return;
      this.applyComposition(this.composing);
      this.composing.handled = true;
      this.div.blur();
      this.div.focus();
    },
    applyComposition: function(composing) {
      if (isReadOnly(this.cm))
        operation(this.cm, regChange)(this.cm)
      else if (composing.data && composing.data != composing.startData)
        operation(this.cm, applyTextInput)(this.cm, composing.data, 0, composing.sel);
    },

    setUneditable: function(node) {
      node.contentEditable = "false"
    },

    onKeyPress: function(e) {
      e.preventDefault();
      if (!isReadOnly(this.cm))
        operation(this.cm, applyTextInput)(this.cm, String.fromCharCode(e.charCode == null ? e.keyCode : e.charCode), 0);
    },

    readOnlyChanged: function(val) {
      this.div.contentEditable = String(val != "nocursor")
    },

    onContextMenu: nothing,
    resetPosition: nothing,

    needsContentAttribute: true
  }, ContentEditableInput.prototype);

  function posToDOM(cm, pos) {
    var view = findViewForLine(cm, pos.line);
    if (!view || view.hidden) return null;
    var line = getLine(cm.doc, pos.line);
    var info = mapFromLineView(view, line, pos.line);

    var order = getOrder(line), side = "left";
    if (order) {
      var partPos = getBidiPartAt(order, pos.ch);
      side = partPos % 2 ? "right" : "left";
    }
    var result = nodeAndOffsetInLineMap(info.map, pos.ch, side);
    result.offset = result.collapse == "right" ? result.end : result.start;
    return result;
  }

  function badPos(pos, bad) { if (bad) pos.bad = true; return pos; }

  function domToPos(cm, node, offset) {
    var lineNode;
    if (node == cm.display.lineDiv) {
      lineNode = cm.display.lineDiv.childNodes[offset];
      if (!lineNode) return badPos(cm.clipPos(Pos(cm.display.viewTo - 1)), true);
      node = null; offset = 0;
    } else {
      for (lineNode = node;; lineNode = lineNode.parentNode) {
        if (!lineNode || lineNode == cm.display.lineDiv) return null;
        if (lineNode.parentNode && lineNode.parentNode == cm.display.lineDiv) break;
      }
    }
    for (var i = 0; i < cm.display.view.length; i++) {
      var lineView = cm.display.view[i];
      if (lineView.node == lineNode)
        return locateNodeInLineView(lineView, node, offset);
    }
  }

  function locateNodeInLineView(lineView, node, offset) {
    var wrapper = lineView.text.firstChild, bad = false;
    if (!node || !contains(wrapper, node)) return badPos(Pos(lineNo(lineView.line), 0), true);
    if (node == wrapper) {
      bad = true;
      node = wrapper.childNodes[offset];
      offset = 0;
      if (!node) {
        var line = lineView.rest ? lst(lineView.rest) : lineView.line;
        return badPos(Pos(lineNo(line), line.text.length), bad);
      }
    }

    var textNode = node.nodeType == 3 ? node : null, topNode = node;
    if (!textNode && node.childNodes.length == 1 && node.firstChild.nodeType == 3) {
      textNode = node.firstChild;
      if (offset) offset = textNode.nodeValue.length;
    }
    while (topNode.parentNode != wrapper) topNode = topNode.parentNode;
    var measure = lineView.measure, maps = measure.maps;

    function find(textNode, topNode, offset) {
      for (var i = -1; i < (maps ? maps.length : 0); i++) {
        var map = i < 0 ? measure.map : maps[i];
        for (var j = 0; j < map.length; j += 3) {
          var curNode = map[j + 2];
          if (curNode == textNode || curNode == topNode) {
            var line = lineNo(i < 0 ? lineView.line : lineView.rest[i]);
            var ch = map[j] + offset;
            if (offset < 0 || curNode != textNode) ch = map[j + (offset ? 1 : 0)];
            return Pos(line, ch);
          }
        }
      }
    }
    var found = find(textNode, topNode, offset);
    if (found) return badPos(found, bad);

    // FIXME this is all really shaky. might handle the few cases it needs to handle, but likely to cause problems
    for (var after = topNode.nextSibling, dist = textNode ? textNode.nodeValue.length - offset : 0; after; after = after.nextSibling) {
      found = find(after, after.firstChild, 0);
      if (found)
        return badPos(Pos(found.line, found.ch - dist), bad);
      else
        dist += after.textContent.length;
    }
    for (var before = topNode.previousSibling, dist = offset; before; before = before.previousSibling) {
      found = find(before, before.firstChild, -1);
      if (found)
        return badPos(Pos(found.line, found.ch + dist), bad);
      else
        dist += after.textContent.length;
    }
  }

  function domTextBetween(cm, from, to, fromLine, toLine) {
    var text = "", closing = false, lineSep = cm.doc.lineSeparator();
    function recognizeMarker(id) { return function(marker) { return marker.id == id; }; }
    function walk(node) {
      if (node.nodeType == 1) {
        var cmText = node.getAttribute("cm-text");
        if (cmText != null) {
          if (cmText == "") cmText = node.textContent.replace(/\u200b/g, "");
          text += cmText;
          return;
        }
        var markerID = node.getAttribute("cm-marker"), range;
        if (markerID) {
          var found = cm.findMarks(Pos(fromLine, 0), Pos(toLine + 1, 0), recognizeMarker(+markerID));
          if (found.length && (range = found[0].find()))
            text += getBetween(cm.doc, range.from, range.to).join(lineSep);
          return;
        }
        if (node.getAttribute("contenteditable") == "false") return;
        for (var i = 0; i < node.childNodes.length; i++)
          walk(node.childNodes[i]);
        if (/^(pre|div|p)$/i.test(node.nodeName))
          closing = true;
      } else if (node.nodeType == 3) {
        var val = node.nodeValue;
        if (!val) return;
        if (closing) {
          text += lineSep;
          closing = false;
        }
        text += val;
      }
    }
    for (;;) {
      walk(from);
      if (from == to) break;
      from = from.nextSibling;
    }
    return text;
  }

  CodeMirror.inputStyles = {"textarea": TextareaInput, "contenteditable": ContentEditableInput};

  // SELECTION / CURSOR

  // Selection objects are immutable. A new one is created every time
  // the selection changes. A selection is one or more non-overlapping
  // (and non-touching) ranges, sorted, and an integer that indicates
  // which one is the primary selection (the one that's scrolled into
  // view, that getCursor returns, etc).
  function Selection(ranges, primIndex) {
    this.ranges = ranges;
    this.primIndex = primIndex;
  }

  Selection.prototype = {
    primary: function() { return this.ranges[this.primIndex]; },
    equals: function(other) {
      if (other == this) return true;
      if (other.primIndex != this.primIndex || other.ranges.length != this.ranges.length) return false;
      for (var i = 0; i < this.ranges.length; i++) {
        var here = this.ranges[i], there = other.ranges[i];
        if (cmp(here.anchor, there.anchor) != 0 || cmp(here.head, there.head) != 0) return false;
      }
      return true;
    },
    deepCopy: function() {
      for (var out = [], i = 0; i < this.ranges.length; i++)
        out[i] = new Range(copyPos(this.ranges[i].anchor), copyPos(this.ranges[i].head));
      return new Selection(out, this.primIndex);
    },
    somethingSelected: function() {
      for (var i = 0; i < this.ranges.length; i++)
        if (!this.ranges[i].empty()) return true;
      return false;
    },
    contains: function(pos, end) {
      if (!end) end = pos;
      for (var i = 0; i < this.ranges.length; i++) {
        var range = this.ranges[i];
        if (cmp(end, range.from()) >= 0 && cmp(pos, range.to()) <= 0)
          return i;
      }
      return -1;
    }
  };

  function Range(anchor, head) {
    this.anchor = anchor; this.head = head;
  }

  Range.prototype = {
    from: function() { return minPos(this.anchor, this.head); },
    to: function() { return maxPos(this.anchor, this.head); },
    empty: function() {
      return this.head.line == this.anchor.line && this.head.ch == this.anchor.ch;
    }
  };

  // Take an unsorted, potentially overlapping set of ranges, and
  // build a selection out of it. 'Consumes' ranges array (modifying
  // it).
  function normalizeSelection(ranges, primIndex) {
    var prim = ranges[primIndex];
    ranges.sort(function(a, b) { return cmp(a.from(), b.from()); });
    primIndex = indexOf(ranges, prim);
    for (var i = 1; i < ranges.length; i++) {
      var cur = ranges[i], prev = ranges[i - 1];
      if (cmp(prev.to(), cur.from()) >= 0) {
        var from = minPos(prev.from(), cur.from()), to = maxPos(prev.to(), cur.to());
        var inv = prev.empty() ? cur.from() == cur.head : prev.from() == prev.head;
        if (i <= primIndex) --primIndex;
        ranges.splice(--i, 2, new Range(inv ? to : from, inv ? from : to));
      }
    }
    return new Selection(ranges, primIndex);
  }

  function simpleSelection(anchor, head) {
    return new Selection([new Range(anchor, head || anchor)], 0);
  }

  // Most of the external API clips given positions to make sure they
  // actually exist within the document.
  function clipLine(doc, n) {return Math.max(doc.first, Math.min(n, doc.first + doc.size - 1));}
  function clipPos(doc, pos) {
    if (pos.line < doc.first) return Pos(doc.first, 0);
    var last = doc.first + doc.size - 1;
    if (pos.line > last) return Pos(last, getLine(doc, last).text.length);
    return clipToLen(pos, getLine(doc, pos.line).text.length);
  }
  function clipToLen(pos, linelen) {
    var ch = pos.ch;
    if (ch == null || ch > linelen) return Pos(pos.line, linelen);
    else if (ch < 0) return Pos(pos.line, 0);
    else return pos;
  }
  function isLine(doc, l) {return l >= doc.first && l < doc.first + doc.size;}
  function clipPosArray(doc, array) {
    for (var out = [], i = 0; i < array.length; i++) out[i] = clipPos(doc, array[i]);
    return out;
  }

  // SELECTION UPDATES

  // The 'scroll' parameter given to many of these indicated whether
  // the new cursor position should be scrolled into view after
  // modifying the selection.

  // If shift is held or the extend flag is set, extends a range to
  // include a given position (and optionally a second position).
  // Otherwise, simply returns the range between the given positions.
  // Used for cursor motion and such.
  function extendRange(doc, range, head, other) {
    if (doc.cm && doc.cm.display.shift || doc.extend) {
      var anchor = range.anchor;
      if (other) {
        var posBefore = cmp(head, anchor) < 0;
        if (posBefore != (cmp(other, anchor) < 0)) {
          anchor = head;
          head = other;
        } else if (posBefore != (cmp(head, other) < 0)) {
          head = other;
        }
      }
      return new Range(anchor, head);
    } else {
      return new Range(other || head, head);
    }
  }

  // Extend the primary selection range, discard the rest.
  function extendSelection(doc, head, other, options) {
    setSelection(doc, new Selection([extendRange(doc, doc.sel.primary(), head, other)], 0), options);
  }

  // Extend all selections (pos is an array of selections with length
  // equal the number of selections)
  function extendSelections(doc, heads, options) {
    for (var out = [], i = 0; i < doc.sel.ranges.length; i++)
      out[i] = extendRange(doc, doc.sel.ranges[i], heads[i], null);
    var newSel = normalizeSelection(out, doc.sel.primIndex);
    setSelection(doc, newSel, options);
  }

  // Updates a single range in the selection.
  function replaceOneSelection(doc, i, range, options) {
    var ranges = doc.sel.ranges.slice(0);
    ranges[i] = range;
    setSelection(doc, normalizeSelection(ranges, doc.sel.primIndex), options);
  }

  // Reset the selection to a single range.
  function setSimpleSelection(doc, anchor, head, options) {
    setSelection(doc, simpleSelection(anchor, head), options);
  }

  // Give beforeSelectionChange handlers a change to influence a
  // selection update.
  function filterSelectionChange(doc, sel) {
    var obj = {
      ranges: sel.ranges,
      update: function(ranges) {
        this.ranges = [];
        for (var i = 0; i < ranges.length; i++)
          this.ranges[i] = new Range(clipPos(doc, ranges[i].anchor),
                                     clipPos(doc, ranges[i].head));
      }
    };
    signal(doc, "beforeSelectionChange", doc, obj);
    if (doc.cm) signal(doc.cm, "beforeSelectionChange", doc.cm, obj);
    if (obj.ranges != sel.ranges) return normalizeSelection(obj.ranges, obj.ranges.length - 1);
    else return sel;
  }

  function setSelectionReplaceHistory(doc, sel, options) {
    var done = doc.history.done, last = lst(done);
    if (last && last.ranges) {
      done[done.length - 1] = sel;
      setSelectionNoUndo(doc, sel, options);
    } else {
      setSelection(doc, sel, options);
    }
  }

  // Set a new selection.
  function setSelection(doc, sel, options) {
    setSelectionNoUndo(doc, sel, options);
    addSelectionToHistory(doc, doc.sel, doc.cm ? doc.cm.curOp.id : NaN, options);
  }

  function setSelectionNoUndo(doc, sel, options) {
    if (hasHandler(doc, "beforeSelectionChange") || doc.cm && hasHandler(doc.cm, "beforeSelectionChange"))
      sel = filterSelectionChange(doc, sel);

    var bias = options && options.bias ||
      (cmp(sel.primary().head, doc.sel.primary().head) < 0 ? -1 : 1);
    setSelectionInner(doc, skipAtomicInSelection(doc, sel, bias, true));

    if (!(options && options.scroll === false) && doc.cm)
      ensureCursorVisible(doc.cm);
  }

  function setSelectionInner(doc, sel) {
    if (sel.equals(doc.sel)) return;

    doc.sel = sel;

    if (doc.cm) {
      doc.cm.curOp.updateInput = doc.cm.curOp.selectionChanged = true;
      signalCursorActivity(doc.cm);
    }
    signalLater(doc, "cursorActivity", doc);
  }

  // Verify that the selection does not partially select any atomic
  // marked ranges.
  function reCheckSelection(doc) {
    setSelectionInner(doc, skipAtomicInSelection(doc, doc.sel, null, false), sel_dontScroll);
  }

  // Return a selection that does not partially select any atomic
  // ranges.
  function skipAtomicInSelection(doc, sel, bias, mayClear) {
    var out;
    for (var i = 0; i < sel.ranges.length; i++) {
      var range = sel.ranges[i];
      var newAnchor = skipAtomic(doc, range.anchor, bias, mayClear);
      var newHead = skipAtomic(doc, range.head, bias, mayClear);
      if (out || newAnchor != range.anchor || newHead != range.head) {
        if (!out) out = sel.ranges.slice(0, i);
        out[i] = new Range(newAnchor, newHead);
      }
    }
    return out ? normalizeSelection(out, sel.primIndex) : sel;
  }

  // Ensure a given position is not inside an atomic range.
  function skipAtomic(doc, pos, bias, mayClear) {
    var flipped = false, curPos = pos;
    var dir = bias || 1;
    doc.cantEdit = false;
    search: for (;;) {
      var line = getLine(doc, curPos.line);
      if (line.markedSpans) {
        for (var i = 0; i < line.markedSpans.length; ++i) {
          var sp = line.markedSpans[i], m = sp.marker;
          if ((sp.from == null || (m.inclusiveLeft ? sp.from <= curPos.ch : sp.from < curPos.ch)) &&
              (sp.to == null || (m.inclusiveRight ? sp.to >= curPos.ch : sp.to > curPos.ch))) {
            if (mayClear) {
              signal(m, "beforeCursorEnter");
              if (m.explicitlyCleared) {
                if (!line.markedSpans) break;
                else {--i; continue;}
              }
            }
            if (!m.atomic) continue;
            var newPos = m.find(dir < 0 ? -1 : 1);
            if (cmp(newPos, curPos) == 0) {
              newPos.ch += dir;
              if (newPos.ch < 0) {
                if (newPos.line > doc.first) newPos = clipPos(doc, Pos(newPos.line - 1));
                else newPos = null;
              } else if (newPos.ch > line.text.length) {
                if (newPos.line < doc.first + doc.size - 1) newPos = Pos(newPos.line + 1, 0);
                else newPos = null;
              }
              if (!newPos) {
                if (flipped) {
                  // Driven in a corner -- no valid cursor position found at all
                  // -- try again *with* clearing, if we didn't already
                  if (!mayClear) return skipAtomic(doc, pos, bias, true);
                  // Otherwise, turn off editing until further notice, and return the start of the doc
                  doc.cantEdit = true;
                  return Pos(doc.first, 0);
                }
                flipped = true; newPos = pos; dir = -dir;
              }
            }
            curPos = newPos;
            continue search;
          }
        }
      }
      return curPos;
    }
  }

  // SELECTION DRAWING

  function updateSelection(cm) {
    cm.display.input.showSelection(cm.display.input.prepareSelection());
  }

  function prepareSelection(cm, primary) {
    var doc = cm.doc, result = {};
    var curFragment = result.cursors = document.createDocumentFragment();
    var selFragment = result.selection = document.createDocumentFragment();

    for (var i = 0; i < doc.sel.ranges.length; i++) {
      if (primary === false && i == doc.sel.primIndex) continue;
      var range = doc.sel.ranges[i];
      var collapsed = range.empty();
      if (collapsed || cm.options.showCursorWhenSelecting)
        drawSelectionCursor(cm, range.head, curFragment);
      if (!collapsed)
        drawSelectionRange(cm, range, selFragment);
    }
    return result;
  }

  // Draws a cursor for the given range
  function drawSelectionCursor(cm, head, output) {
    var pos = cursorCoords(cm, head, "div", null, null, !cm.options.singleCursorHeightPerLine);

    var cursor = output.appendChild(elt("div", "\u00a0", "CodeMirror-cursor"));
    cursor.style.left = pos.left + "px";
    cursor.style.top = pos.top + "px";
    cursor.style.height = Math.max(0, pos.bottom - pos.top) * cm.options.cursorHeight + "px";

    if (pos.other) {
      // Secondary cursor, shown when on a 'jump' in bi-directional text
      var otherCursor = output.appendChild(elt("div", "\u00a0", "CodeMirror-cursor CodeMirror-secondarycursor"));
      otherCursor.style.display = "";
      otherCursor.style.left = pos.other.left + "px";
      otherCursor.style.top = pos.other.top + "px";
      otherCursor.style.height = (pos.other.bottom - pos.other.top) * .85 + "px";
    }
  }

  // Draws the given range as a highlighted selection
  function drawSelectionRange(cm, range, output) {
    var display = cm.display, doc = cm.doc;
    var fragment = document.createDocumentFragment();
    var padding = paddingH(cm.display), leftSide = padding.left;
    var rightSide = Math.max(display.sizerWidth, displayWidth(cm) - display.sizer.offsetLeft) - padding.right;

    function add(left, top, width, bottom) {
      if (top < 0) top = 0;
      top = Math.round(top);
      bottom = Math.round(bottom);
      fragment.appendChild(elt("div", null, "CodeMirror-selected", "position: absolute; left: " + left +
                               "px; top: " + top + "px; width: " + (width == null ? rightSide - left : width) +
                               "px; height: " + (bottom - top) + "px"));
    }

    function drawForLine(line, fromArg, toArg) {
      var lineObj = getLine(doc, line);
      var lineLen = lineObj.text.length;
      var start, end;
      function coords(ch, bias) {
        return charCoords(cm, Pos(line, ch), "div", lineObj, bias);
      }

      iterateBidiSections(getOrder(lineObj), fromArg || 0, toArg == null ? lineLen : toArg, function(from, to, dir) {
        var leftPos = coords(from, "left"), rightPos, left, right;
        if (from == to) {
          rightPos = leftPos;
          left = right = leftPos.left;
        } else {
          rightPos = coords(to - 1, "right");
          if (dir == "rtl") { var tmp = leftPos; leftPos = rightPos; rightPos = tmp; }
          left = leftPos.left;
          right = rightPos.right;
        }
        if (fromArg == null && from == 0) left = leftSide;
        if (rightPos.top - leftPos.top > 3) { // Different lines, draw top part
          add(left, leftPos.top, null, leftPos.bottom);
          left = leftSide;
          if (leftPos.bottom < rightPos.top) add(left, leftPos.bottom, null, rightPos.top);
        }
        if (toArg == null && to == lineLen) right = rightSide;
        if (!start || leftPos.top < start.top || leftPos.top == start.top && leftPos.left < start.left)
          start = leftPos;
        if (!end || rightPos.bottom > end.bottom || rightPos.bottom == end.bottom && rightPos.right > end.right)
          end = rightPos;
        if (left < leftSide + 1) left = leftSide;
        add(left, rightPos.top, right - left, rightPos.bottom);
      });
      return {start: start, end: end};
    }

    var sFrom = range.from(), sTo = range.to();
    if (sFrom.line == sTo.line) {
      drawForLine(sFrom.line, sFrom.ch, sTo.ch);
    } else {
      var fromLine = getLine(doc, sFrom.line), toLine = getLine(doc, sTo.line);
      var singleVLine = visualLine(fromLine) == visualLine(toLine);
      var leftEnd = drawForLine(sFrom.line, sFrom.ch, singleVLine ? fromLine.text.length + 1 : null).end;
      var rightStart = drawForLine(sTo.line, singleVLine ? 0 : null, sTo.ch).start;
      if (singleVLine) {
        if (leftEnd.top < rightStart.top - 2) {
          add(leftEnd.right, leftEnd.top, null, leftEnd.bottom);
          add(leftSide, rightStart.top, rightStart.left, rightStart.bottom);
        } else {
          add(leftEnd.right, leftEnd.top, rightStart.left - leftEnd.right, leftEnd.bottom);
        }
      }
      if (leftEnd.bottom < rightStart.top)
        add(leftSide, leftEnd.bottom, null, rightStart.top);
    }

    output.appendChild(fragment);
  }

  // Cursor-blinking
  function restartBlink(cm) {
    if (!cm.state.focused) return;
    var display = cm.display;
    clearInterval(display.blinker);
    var on = true;
    display.cursorDiv.style.visibility = "";
    if (cm.options.cursorBlinkRate > 0)
      display.blinker = setInterval(function() {
        display.cursorDiv.style.visibility = (on = !on) ? "" : "hidden";
      }, cm.options.cursorBlinkRate);
    else if (cm.options.cursorBlinkRate < 0)
      display.cursorDiv.style.visibility = "hidden";
  }

  // HIGHLIGHT WORKER

  function startWorker(cm, time) {
    if (cm.doc.mode.startState && cm.doc.frontier < cm.display.viewTo)
      cm.state.highlight.set(time, bind(highlightWorker, cm));
  }

  function highlightWorker(cm) {
    var doc = cm.doc;
    if (doc.frontier < doc.first) doc.frontier = doc.first;
    if (doc.frontier >= cm.display.viewTo) return;
    var end = +new Date + cm.options.workTime;
    var state = copyState(doc.mode, getStateBefore(cm, doc.frontier));
    var changedLines = [];

    doc.iter(doc.frontier, Math.min(doc.first + doc.size, cm.display.viewTo + 500), function(line) {
      if (doc.frontier >= cm.display.viewFrom) { // Visible
        var oldStyles = line.styles, tooLong = line.text.length > cm.options.maxHighlightLength;
        var highlighted = highlightLine(cm, line, tooLong ? copyState(doc.mode, state) : state, true);
        line.styles = highlighted.styles;
        var oldCls = line.styleClasses, newCls = highlighted.classes;
        if (newCls) line.styleClasses = newCls;
        else if (oldCls) line.styleClasses = null;
        var ischange = !oldStyles || oldStyles.length != line.styles.length ||
          oldCls != newCls && (!oldCls || !newCls || oldCls.bgClass != newCls.bgClass || oldCls.textClass != newCls.textClass);
        for (var i = 0; !ischange && i < oldStyles.length; ++i) ischange = oldStyles[i] != line.styles[i];
        if (ischange) changedLines.push(doc.frontier);
        line.stateAfter = tooLong ? state : copyState(doc.mode, state);
      } else {
        if (line.text.length <= cm.options.maxHighlightLength)
          processLine(cm, line.text, state);
        line.stateAfter = doc.frontier % 5 == 0 ? copyState(doc.mode, state) : null;
      }
      ++doc.frontier;
      if (+new Date > end) {
        startWorker(cm, cm.options.workDelay);
        return true;
      }
    });
    if (changedLines.length) runInOp(cm, function() {
      for (var i = 0; i < changedLines.length; i++)
        regLineChange(cm, changedLines[i], "text");
    });
  }

  // Finds the line to start with when starting a parse. Tries to
  // find a line with a stateAfter, so that it can start with a
  // valid state. If that fails, it returns the line with the
  // smallest indentation, which tends to need the least context to
  // parse correctly.
  function findStartLine(cm, n, precise) {
    var minindent, minline, doc = cm.doc;
    var lim = precise ? -1 : n - (cm.doc.mode.innerMode ? 1000 : 100);
    for (var search = n; search > lim; --search) {
      if (search <= doc.first) return doc.first;
      var line = getLine(doc, search - 1);
      if (line.stateAfter && (!precise || search <= doc.frontier)) return search;
      var indented = countColumn(line.text, null, cm.options.tabSize);
      if (minline == null || minindent > indented) {
        minline = search - 1;
        minindent = indented;
      }
    }
    return minline;
  }

  function getStateBefore(cm, n, precise) {
    var doc = cm.doc, display = cm.display;
    if (!doc.mode.startState) return true;
    var pos = findStartLine(cm, n, precise), state = pos > doc.first && getLine(doc, pos-1).stateAfter;
    if (!state) state = startState(doc.mode);
    else state = copyState(doc.mode, state);
    doc.iter(pos, n, function(line) {
      processLine(cm, line.text, state);
      var save = pos == n - 1 || pos % 5 == 0 || pos >= display.viewFrom && pos < display.viewTo;
      line.stateAfter = save ? copyState(doc.mode, state) : null;
      ++pos;
    });
    if (precise) doc.frontier = pos;
    return state;
  }

  // POSITION MEASUREMENT

  function paddingTop(display) {return display.lineSpace.offsetTop;}
  function paddingVert(display) {return display.mover.offsetHeight - display.lineSpace.offsetHeight;}
  function paddingH(display) {
    if (display.cachedPaddingH) return display.cachedPaddingH;
    var e = removeChildrenAndAdd(display.measure, elt("pre", "x"));
    var style = window.getComputedStyle ? window.getComputedStyle(e) : e.currentStyle;
    var data = {left: parseInt(style.paddingLeft), right: parseInt(style.paddingRight)};
    if (!isNaN(data.left) && !isNaN(data.right)) display.cachedPaddingH = data;
    return data;
  }

  function scrollGap(cm) { return scrollerGap - cm.display.nativeBarWidth; }
  function displayWidth(cm) {
    return cm.display.scroller.clientWidth - scrollGap(cm) - cm.display.barWidth;
  }
  function displayHeight(cm) {
    return cm.display.scroller.clientHeight - scrollGap(cm) - cm.display.barHeight;
  }

  // Ensure the lineView.wrapping.heights array is populated. This is
  // an array of bottom offsets for the lines that make up a drawn
  // line. When lineWrapping is on, there might be more than one
  // height.
  function ensureLineHeights(cm, lineView, rect) {
    var wrapping = cm.options.lineWrapping;
    var curWidth = wrapping && displayWidth(cm);
    if (!lineView.measure.heights || wrapping && lineView.measure.width != curWidth) {
      var heights = lineView.measure.heights = [];
      if (wrapping) {
        lineView.measure.width = curWidth;
        var rects = lineView.text.firstChild.getClientRects();
        for (var i = 0; i < rects.length - 1; i++) {
          var cur = rects[i], next = rects[i + 1];
          if (Math.abs(cur.bottom - next.bottom) > 2)
            heights.push((cur.bottom + next.top) / 2 - rect.top);
        }
      }
      heights.push(rect.bottom - rect.top);
    }
  }

  // Find a line map (mapping character offsets to text nodes) and a
  // measurement cache for the given line number. (A line view might
  // contain multiple lines when collapsed ranges are present.)
  function mapFromLineView(lineView, line, lineN) {
    if (lineView.line == line)
      return {map: lineView.measure.map, cache: lineView.measure.cache};
    for (var i = 0; i < lineView.rest.length; i++)
      if (lineView.rest[i] == line)
        return {map: lineView.measure.maps[i], cache: lineView.measure.caches[i]};
    for (var i = 0; i < lineView.rest.length; i++)
      if (lineNo(lineView.rest[i]) > lineN)
        return {map: lineView.measure.maps[i], cache: lineView.measure.caches[i], before: true};
  }

  // Render a line into the hidden node display.externalMeasured. Used
  // when measurement is needed for a line that's not in the viewport.
  function updateExternalMeasurement(cm, line) {
    line = visualLine(line);
    var lineN = lineNo(line);
    var view = cm.display.externalMeasured = new LineView(cm.doc, line, lineN);
    view.lineN = lineN;
    var built = view.built = buildLineContent(cm, view);
    view.text = built.pre;
    removeChildrenAndAdd(cm.display.lineMeasure, built.pre);
    return view;
  }

  // Get a {top, bottom, left, right} box (in line-local coordinates)
  // for a given character.
  function measureChar(cm, line, ch, bias) {
    return measureCharPrepared(cm, prepareMeasureForLine(cm, line), ch, bias);
  }

  // Find a line view that corresponds to the given line number.
  function findViewForLine(cm, lineN) {
    if (lineN >= cm.display.viewFrom && lineN < cm.display.viewTo)
      return cm.display.view[findViewIndex(cm, lineN)];
    var ext = cm.display.externalMeasured;
    if (ext && lineN >= ext.lineN && lineN < ext.lineN + ext.size)
      return ext;
  }

  // Measurement can be split in two steps, the set-up work that
  // applies to the whole line, and the measurement of the actual
  // character. Functions like coordsChar, that need to do a lot of
  // measurements in a row, can thus ensure that the set-up work is
  // only done once.
  function prepareMeasureForLine(cm, line) {
    var lineN = lineNo(line);
    var view = findViewForLine(cm, lineN);
    if (view && !view.text) {
      view = null;
    } else if (view && view.changes) {
      updateLineForChanges(cm, view, lineN, getDimensions(cm));
      cm.curOp.forceUpdate = true;
    }
    if (!view)
      view = updateExternalMeasurement(cm, line);

    var info = mapFromLineView(view, line, lineN);
    return {
      line: line, view: view, rect: null,
      map: info.map, cache: info.cache, before: info.before,
      hasHeights: false
    };
  }

  // Given a prepared measurement object, measures the position of an
  // actual character (or fetches it from the cache).
  function measureCharPrepared(cm, prepared, ch, bias, varHeight) {
    if (prepared.before) ch = -1;
    var key = ch + (bias || ""), found;
    if (prepared.cache.hasOwnProperty(key)) {
      found = prepared.cache[key];
    } else {
      if (!prepared.rect)
        prepared.rect = prepared.view.text.getBoundingClientRect();
      if (!prepared.hasHeights) {
        ensureLineHeights(cm, prepared.view, prepared.rect);
        prepared.hasHeights = true;
      }
      found = measureCharInner(cm, prepared, ch, bias);
      if (!found.bogus) prepared.cache[key] = found;
    }
    return {left: found.left, right: found.right,
            top: varHeight ? found.rtop : found.top,
            bottom: varHeight ? found.rbottom : found.bottom};
  }

  var nullRect = {left: 0, right: 0, top: 0, bottom: 0};

  function nodeAndOffsetInLineMap(map, ch, bias) {
    var node, start, end, collapse;
    // First, search the line map for the text node corresponding to,
    // or closest to, the target character.
    for (var i = 0; i < map.length; i += 3) {
      var mStart = map[i], mEnd = map[i + 1];
      if (ch < mStart) {
        start = 0; end = 1;
        collapse = "left";
      } else if (ch < mEnd) {
        start = ch - mStart;
        end = start + 1;
      } else if (i == map.length - 3 || ch == mEnd && map[i + 3] > ch) {
        end = mEnd - mStart;
        start = end - 1;
        if (ch >= mEnd) collapse = "right";
      }
      if (start != null) {
        node = map[i + 2];
        if (mStart == mEnd && bias == (node.insertLeft ? "left" : "right"))
          collapse = bias;
        if (bias == "left" && start == 0)
          while (i && map[i - 2] == map[i - 3] && map[i - 1].insertLeft) {
            node = map[(i -= 3) + 2];
            collapse = "left";
          }
        if (bias == "right" && start == mEnd - mStart)
          while (i < map.length - 3 && map[i + 3] == map[i + 4] && !map[i + 5].insertLeft) {
            node = map[(i += 3) + 2];
            collapse = "right";
          }
        break;
      }
    }
    return {node: node, start: start, end: end, collapse: collapse, coverStart: mStart, coverEnd: mEnd};
  }

  function measureCharInner(cm, prepared, ch, bias) {
    var place = nodeAndOffsetInLineMap(prepared.map, ch, bias);
    var node = place.node, start = place.start, end = place.end, collapse = place.collapse;

    var rect;
    if (node.nodeType == 3) { // If it is a text node, use a range to retrieve the coordinates.
      for (var i = 0; i < 4; i++) { // Retry a maximum of 4 times when nonsense rectangles are returned
        while (start && isExtendingChar(prepared.line.text.charAt(place.coverStart + start))) --start;
        while (place.coverStart + end < place.coverEnd && isExtendingChar(prepared.line.text.charAt(place.coverStart + end))) ++end;
        if (ie && ie_version < 9 && start == 0 && end == place.coverEnd - place.coverStart) {
          rect = node.parentNode.getBoundingClientRect();
        } else if (ie && cm.options.lineWrapping) {
          var rects = range(node, start, end).getClientRects();
          if (rects.length)
            rect = rects[bias == "right" ? rects.length - 1 : 0];
          else
            rect = nullRect;
        } else {
          rect = range(node, start, end).getBoundingClientRect() || nullRect;
        }
        if (rect.left || rect.right || start == 0) break;
        end = start;
        start = start - 1;
        collapse = "right";
      }
      if (ie && ie_version < 11) rect = maybeUpdateRectForZooming(cm.display.measure, rect);
    } else { // If it is a widget, simply get the box for the whole widget.
      if (start > 0) collapse = bias = "right";
      var rects;
      if (cm.options.lineWrapping && (rects = node.getClientRects()).length > 1)
        rect = rects[bias == "right" ? rects.length - 1 : 0];
      else
        rect = node.getBoundingClientRect();
    }
    if (ie && ie_version < 9 && !start && (!rect || !rect.left && !rect.right)) {
      var rSpan = node.parentNode.getClientRects()[0];
      if (rSpan)
        rect = {left: rSpan.left, right: rSpan.left + charWidth(cm.display), top: rSpan.top, bottom: rSpan.bottom};
      else
        rect = nullRect;
    }

    var rtop = rect.top - prepared.rect.top, rbot = rect.bottom - prepared.rect.top;
    var mid = (rtop + rbot) / 2;
    var heights = prepared.view.measure.heights;
    for (var i = 0; i < heights.length - 1; i++)
      if (mid < heights[i]) break;
    var top = i ? heights[i - 1] : 0, bot = heights[i];
    var result = {left: (collapse == "right" ? rect.right : rect.left) - prepared.rect.left,
                  right: (collapse == "left" ? rect.left : rect.right) - prepared.rect.left,
                  top: top, bottom: bot};
    if (!rect.left && !rect.right) result.bogus = true;
    if (!cm.options.singleCursorHeightPerLine) { result.rtop = rtop; result.rbottom = rbot; }

    return result;
  }

  // Work around problem with bounding client rects on ranges being
  // returned incorrectly when zoomed on IE10 and below.
  function maybeUpdateRectForZooming(measure, rect) {
    if (!window.screen || screen.logicalXDPI == null ||
        screen.logicalXDPI == screen.deviceXDPI || !hasBadZoomedRects(measure))
      return rect;
    var scaleX = screen.logicalXDPI / screen.deviceXDPI;
    var scaleY = screen.logicalYDPI / screen.deviceYDPI;
    return {left: rect.left * scaleX, right: rect.right * scaleX,
            top: rect.top * scaleY, bottom: rect.bottom * scaleY};
  }

  function clearLineMeasurementCacheFor(lineView) {
    if (lineView.measure) {
      lineView.measure.cache = {};
      lineView.measure.heights = null;
      if (lineView.rest) for (var i = 0; i < lineView.rest.length; i++)
        lineView.measure.caches[i] = {};
    }
  }

  function clearLineMeasurementCache(cm) {
    cm.display.externalMeasure = null;
    removeChildren(cm.display.lineMeasure);
    for (var i = 0; i < cm.display.view.length; i++)
      clearLineMeasurementCacheFor(cm.display.view[i]);
  }

  function clearCaches(cm) {
    clearLineMeasurementCache(cm);
    cm.display.cachedCharWidth = cm.display.cachedTextHeight = cm.display.cachedPaddingH = null;
    if (!cm.options.lineWrapping) cm.display.maxLineChanged = true;
    cm.display.lineNumChars = null;
  }

  function pageScrollX() { return window.pageXOffset || (document.documentElement || document.body).scrollLeft; }
  function pageScrollY() { return window.pageYOffset || (document.documentElement || document.body).scrollTop; }

  // Converts a {top, bottom, left, right} box from line-local
  // coordinates into another coordinate system. Context may be one of
  // "line", "div" (display.lineDiv), "local"/null (editor), "window",
  // or "page".
  function intoCoordSystem(cm, lineObj, rect, context) {
    if (lineObj.widgets) for (var i = 0; i < lineObj.widgets.length; ++i) if (lineObj.widgets[i].above) {
      var size = widgetHeight(lineObj.widgets[i]);
      rect.top += size; rect.bottom += size;
    }
    if (context == "line") return rect;
    if (!context) context = "local";
    var yOff = heightAtLine(lineObj);
    if (context == "local") yOff += paddingTop(cm.display);
    else yOff -= cm.display.viewOffset;
    if (context == "page" || context == "window") {
      var lOff = cm.display.lineSpace.getBoundingClientRect();
      yOff += lOff.top + (context == "window" ? 0 : pageScrollY());
      var xOff = lOff.left + (context == "window" ? 0 : pageScrollX());
      rect.left += xOff; rect.right += xOff;
    }
    rect.top += yOff; rect.bottom += yOff;
    return rect;
  }

  // Coverts a box from "div" coords to another coordinate system.
  // Context may be "window", "page", "div", or "local"/null.
  function fromCoordSystem(cm, coords, context) {
    if (context == "div") return coords;
    var left = coords.left, top = coords.top;
    // First move into "page" coordinate system
    if (context == "page") {
      left -= pageScrollX();
      top -= pageScrollY();
    } else if (context == "local" || !context) {
      var localBox = cm.display.sizer.getBoundingClientRect();
      left += localBox.left;
      top += localBox.top;
    }

    var lineSpaceBox = cm.display.lineSpace.getBoundingClientRect();
    return {left: left - lineSpaceBox.left, top: top - lineSpaceBox.top};
  }

  function charCoords(cm, pos, context, lineObj, bias) {
    if (!lineObj) lineObj = getLine(cm.doc, pos.line);
    return intoCoordSystem(cm, lineObj, measureChar(cm, lineObj, pos.ch, bias), context);
  }

  // Returns a box for a given cursor position, which may have an
  // 'other' property containing the position of the secondary cursor
  // on a bidi boundary.
  function cursorCoords(cm, pos, context, lineObj, preparedMeasure, varHeight) {
    lineObj = lineObj || getLine(cm.doc, pos.line);
    if (!preparedMeasure) preparedMeasure = prepareMeasureForLine(cm, lineObj);
    function get(ch, right) {
      var m = measureCharPrepared(cm, preparedMeasure, ch, right ? "right" : "left", varHeight);
      if (right) m.left = m.right; else m.right = m.left;
      return intoCoordSystem(cm, lineObj, m, context);
    }
    function getBidi(ch, partPos) {
      var part = order[partPos], right = part.level % 2;
      if (ch == bidiLeft(part) && partPos && part.level < order[partPos - 1].level) {
        part = order[--partPos];
        ch = bidiRight(part) - (part.level % 2 ? 0 : 1);
        right = true;
      } else if (ch == bidiRight(part) && partPos < order.length - 1 && part.level < order[partPos + 1].level) {
        part = order[++partPos];
        ch = bidiLeft(part) - part.level % 2;
        right = false;
      }
      if (right && ch == part.to && ch > part.from) return get(ch - 1);
      return get(ch, right);
    }
    var order = getOrder(lineObj), ch = pos.ch;
    if (!order) return get(ch);
    var partPos = getBidiPartAt(order, ch);
    var val = getBidi(ch, partPos);
    if (bidiOther != null) val.other = getBidi(ch, bidiOther);
    return val;
  }

  // Used to cheaply estimate the coordinates for a position. Used for
  // intermediate scroll updates.
  function estimateCoords(cm, pos) {
    var left = 0, pos = clipPos(cm.doc, pos);
    if (!cm.options.lineWrapping) left = charWidth(cm.display) * pos.ch;
    var lineObj = getLine(cm.doc, pos.line);
    var top = heightAtLine(lineObj) + paddingTop(cm.display);
    return {left: left, right: left, top: top, bottom: top + lineObj.height};
  }

  // Positions returned by coordsChar contain some extra information.
  // xRel is the relative x position of the input coordinates compared
  // to the found position (so xRel > 0 means the coordinates are to
  // the right of the character position, for example). When outside
  // is true, that means the coordinates lie outside the line's
  // vertical range.
  function PosWithInfo(line, ch, outside, xRel) {
    var pos = Pos(line, ch);
    pos.xRel = xRel;
    if (outside) pos.outside = true;
    return pos;
  }

  // Compute the character position closest to the given coordinates.
  // Input must be lineSpace-local ("div" coordinate system).
  function coordsChar(cm, x, y) {
    var doc = cm.doc;
    y += cm.display.viewOffset;
    if (y < 0) return PosWithInfo(doc.first, 0, true, -1);
    var lineN = lineAtHeight(doc, y), last = doc.first + doc.size - 1;
    if (lineN > last)
      return PosWithInfo(doc.first + doc.size - 1, getLine(doc, last).text.length, true, 1);
    if (x < 0) x = 0;

    var lineObj = getLine(doc, lineN);
    for (;;) {
      var found = coordsCharInner(cm, lineObj, lineN, x, y);
      var merged = collapsedSpanAtEnd(lineObj);
      var mergedPos = merged && merged.find(0, true);
      if (merged && (found.ch > mergedPos.from.ch || found.ch == mergedPos.from.ch && found.xRel > 0))
        lineN = lineNo(lineObj = mergedPos.to.line);
      else
        return found;
    }
  }

  function coordsCharInner(cm, lineObj, lineNo, x, y) {
    var innerOff = y - heightAtLine(lineObj);
    var wrongLine = false, adjust = 2 * cm.display.wrapper.clientWidth;
    var preparedMeasure = prepareMeasureForLine(cm, lineObj);

    function getX(ch) {
      var sp = cursorCoords(cm, Pos(lineNo, ch), "line", lineObj, preparedMeasure);
      wrongLine = true;
      if (innerOff > sp.bottom) return sp.left - adjust;
      else if (innerOff < sp.top) return sp.left + adjust;
      else wrongLine = false;
      return sp.left;
    }

    var bidi = getOrder(lineObj), dist = lineObj.text.length;
    var from = lineLeft(lineObj), to = lineRight(lineObj);
    var fromX = getX(from), fromOutside = wrongLine, toX = getX(to), toOutside = wrongLine;

    if (x > toX) return PosWithInfo(lineNo, to, toOutside, 1);
    // Do a binary search between these bounds.
    for (;;) {
      if (bidi ? to == from || to == moveVisually(lineObj, from, 1) : to - from <= 1) {
        var ch = x < fromX || x - fromX <= toX - x ? from : to;
        var xDiff = x - (ch == from ? fromX : toX);
        while (isExtendingChar(lineObj.text.charAt(ch))) ++ch;
        var pos = PosWithInfo(lineNo, ch, ch == from ? fromOutside : toOutside,
                              xDiff < -1 ? -1 : xDiff > 1 ? 1 : 0);
        return pos;
      }
      var step = Math.ceil(dist / 2), middle = from + step;
      if (bidi) {
        middle = from;
        for (var i = 0; i < step; ++i) middle = moveVisually(lineObj, middle, 1);
      }
      var middleX = getX(middle);
      if (middleX > x) {to = middle; toX = middleX; if (toOutside = wrongLine) toX += 1000; dist = step;}
      else {from = middle; fromX = middleX; fromOutside = wrongLine; dist -= step;}
    }
  }

  var measureText;
  // Compute the default text height.
  function textHeight(display) {
    if (display.cachedTextHeight != null) return display.cachedTextHeight;
    if (measureText == null) {
      measureText = elt("pre");
      // Measure a bunch of lines, for browsers that compute
      // fractional heights.
      for (var i = 0; i < 49; ++i) {
        measureText.appendChild(document.createTextNode("x"));
        measureText.appendChild(elt("br"));
      }
      measureText.appendChild(document.createTextNode("x"));
    }
    removeChildrenAndAdd(display.measure, measureText);
    var height = measureText.offsetHeight / 50;
    if (height > 3) display.cachedTextHeight = height;
    removeChildren(display.measure);
    return height || 1;
  }

  // Compute the default character width.
  function charWidth(display) {
    if (display.cachedCharWidth != null) return display.cachedCharWidth;
    var anchor = elt("span", "xxxxxxxxxx");
    var pre = elt("pre", [anchor]);
    removeChildrenAndAdd(display.measure, pre);
    var rect = anchor.getBoundingClientRect(), width = (rect.right - rect.left) / 10;
    if (width > 2) display.cachedCharWidth = width;
    return width || 10;
  }

  // OPERATIONS

  // Operations are used to wrap a series of changes to the editor
  // state in such a way that each change won't have to update the
  // cursor and display (which would be awkward, slow, and
  // error-prone). Instead, display updates are batched and then all
  // combined and executed at once.

  var operationGroup = null;

  var nextOpId = 0;
  // Start a new operation.
  function startOperation(cm) {
    cm.curOp = {
      cm: cm,
      viewChanged: false,      // Flag that indicates that lines might need to be redrawn
      startHeight: cm.doc.height, // Used to detect need to update scrollbar
      forceUpdate: false,      // Used to force a redraw
      updateInput: null,       // Whether to reset the input textarea
      typing: false,           // Whether this reset should be careful to leave existing text (for compositing)
      changeObjs: null,        // Accumulated changes, for firing change events
      cursorActivityHandlers: null, // Set of handlers to fire cursorActivity on
      cursorActivityCalled: 0, // Tracks which cursorActivity handlers have been called already
      selectionChanged: false, // Whether the selection needs to be redrawn
      updateMaxLine: false,    // Set when the widest line needs to be determined anew
      scrollLeft: null, scrollTop: null, // Intermediate scroll position, not pushed to DOM yet
      scrollToPos: null,       // Used to scroll to a specific position
      focus: false,
      id: ++nextOpId           // Unique ID
    };
    if (operationGroup) {
      operationGroup.ops.push(cm.curOp);
    } else {
      cm.curOp.ownsGroup = operationGroup = {
        ops: [cm.curOp],
        delayedCallbacks: []
      };
    }
  }

  function fireCallbacksForOps(group) {
    // Calls delayed callbacks and cursorActivity handlers until no
    // new ones appear
    var callbacks = group.delayedCallbacks, i = 0;
    do {
      for (; i < callbacks.length; i++)
        callbacks[i].call(null);
      for (var j = 0; j < group.ops.length; j++) {
        var op = group.ops[j];
        if (op.cursorActivityHandlers)
          while (op.cursorActivityCalled < op.cursorActivityHandlers.length)
            op.cursorActivityHandlers[op.cursorActivityCalled++].call(null, op.cm);
      }
    } while (i < callbacks.length);
  }

  // Finish an operation, updating the display and signalling delayed events
  function endOperation(cm) {
    var op = cm.curOp, group = op.ownsGroup;
    if (!group) return;

    try { fireCallbacksForOps(group); }
    finally {
      operationGroup = null;
      for (var i = 0; i < group.ops.length; i++)
        group.ops[i].cm.curOp = null;
      endOperations(group);
    }
  }

  // The DOM updates done when an operation finishes are batched so
  // that the minimum number of relayouts are required.
  function endOperations(group) {
    var ops = group.ops;
    for (var i = 0; i < ops.length; i++) // Read DOM
      endOperation_R1(ops[i]);
    for (var i = 0; i < ops.length; i++) // Write DOM (maybe)
      endOperation_W1(ops[i]);
    for (var i = 0; i < ops.length; i++) // Read DOM
      endOperation_R2(ops[i]);
    for (var i = 0; i < ops.length; i++) // Write DOM (maybe)
      endOperation_W2(ops[i]);
    for (var i = 0; i < ops.length; i++) // Read DOM
      endOperation_finish(ops[i]);
  }

  function endOperation_R1(op) {
    var cm = op.cm, display = cm.display;
    maybeClipScrollbars(cm);
    if (op.updateMaxLine) findMaxLine(cm);

    op.mustUpdate = op.viewChanged || op.forceUpdate || op.scrollTop != null ||
      op.scrollToPos && (op.scrollToPos.from.line < display.viewFrom ||
                         op.scrollToPos.to.line >= display.viewTo) ||
      display.maxLineChanged && cm.options.lineWrapping;
    op.update = op.mustUpdate &&
      new DisplayUpdate(cm, op.mustUpdate && {top: op.scrollTop, ensure: op.scrollToPos}, op.forceUpdate);
  }

  function endOperation_W1(op) {
    op.updatedDisplay = op.mustUpdate && updateDisplayIfNeeded(op.cm, op.update);
  }

  function endOperation_R2(op) {
    var cm = op.cm, display = cm.display;
    if (op.updatedDisplay) updateHeightsInViewport(cm);

    op.barMeasure = measureForScrollbars(cm);

    // If the max line changed since it was last measured, measure it,
    // and ensure the document's width matches it.
    // updateDisplay_W2 will use these properties to do the actual resizing
    if (display.maxLineChanged && !cm.options.lineWrapping) {
      op.adjustWidthTo = measureChar(cm, display.maxLine, display.maxLine.text.length).left + 3;
      cm.display.sizerWidth = op.adjustWidthTo;
      op.barMeasure.scrollWidth =
        Math.max(display.scroller.clientWidth, display.sizer.offsetLeft + op.adjustWidthTo + scrollGap(cm) + cm.display.barWidth);
      op.maxScrollLeft = Math.max(0, display.sizer.offsetLeft + op.adjustWidthTo - displayWidth(cm));
    }

    if (op.updatedDisplay || op.selectionChanged)
      op.preparedSelection = display.input.prepareSelection();
  }

  function endOperation_W2(op) {
    var cm = op.cm;

    if (op.adjustWidthTo != null) {
      cm.display.sizer.style.minWidth = op.adjustWidthTo + "px";
      if (op.maxScrollLeft < cm.doc.scrollLeft)
        setScrollLeft(cm, Math.min(cm.display.scroller.scrollLeft, op.maxScrollLeft), true);
      cm.display.maxLineChanged = false;
    }

    if (op.preparedSelection)
      cm.display.input.showSelection(op.preparedSelection);
    if (op.updatedDisplay)
      setDocumentHeight(cm, op.barMeasure);
    if (op.updatedDisplay || op.startHeight != cm.doc.height)
      updateScrollbars(cm, op.barMeasure);

    if (op.selectionChanged) restartBlink(cm);

    if (cm.state.focused && op.updateInput)
      cm.display.input.reset(op.typing);
    if (op.focus && op.focus == activeElt() && (!document.hasFocus || document.hasFocus()))
      ensureFocus(op.cm);
  }

  function endOperation_finish(op) {
    var cm = op.cm, display = cm.display, doc = cm.doc;

    if (op.updatedDisplay) postUpdateDisplay(cm, op.update);

    // Abort mouse wheel delta measurement, when scrolling explicitly
    if (display.wheelStartX != null && (op.scrollTop != null || op.scrollLeft != null || op.scrollToPos))
      display.wheelStartX = display.wheelStartY = null;

    // Propagate the scroll position to the actual DOM scroller
    if (op.scrollTop != null && (display.scroller.scrollTop != op.scrollTop || op.forceScroll)) {
      doc.scrollTop = Math.max(0, Math.min(display.scroller.scrollHeight - display.scroller.clientHeight, op.scrollTop));
      display.scrollbars.setScrollTop(doc.scrollTop);
      display.scroller.scrollTop = doc.scrollTop;
    }
    if (op.scrollLeft != null && (display.scroller.scrollLeft != op.scrollLeft || op.forceScroll)) {
      doc.scrollLeft = Math.max(0, Math.min(display.scroller.scrollWidth - displayWidth(cm), op.scrollLeft));
      display.scrollbars.setScrollLeft(doc.scrollLeft);
      display.scroller.scrollLeft = doc.scrollLeft;
      alignHorizontally(cm);
    }
    // If we need to scroll a specific position into view, do so.
    if (op.scrollToPos) {
      var coords = scrollPosIntoView(cm, clipPos(doc, op.scrollToPos.from),
                                     clipPos(doc, op.scrollToPos.to), op.scrollToPos.margin);
      if (op.scrollToPos.isCursor && cm.state.focused) maybeScrollWindow(cm, coords);
    }

    // Fire events for markers that are hidden/unidden by editing or
    // undoing
    var hidden = op.maybeHiddenMarkers, unhidden = op.maybeUnhiddenMarkers;
    if (hidden) for (var i = 0; i < hidden.length; ++i)
      if (!hidden[i].lines.length) signal(hidden[i], "hide");
    if (unhidden) for (var i = 0; i < unhidden.length; ++i)
      if (unhidden[i].lines.length) signal(unhidden[i], "unhide");

    if (display.wrapper.offsetHeight)
      doc.scrollTop = cm.display.scroller.scrollTop;

    // Fire change events, and delayed event handlers
    if (op.changeObjs)
      signal(cm, "changes", cm, op.changeObjs);
    if (op.update)
      op.update.finish();
  }

  // Run the given function in an operation
  function runInOp(cm, f) {
    if (cm.curOp) return f();
    startOperation(cm);
    try { return f(); }
    finally { endOperation(cm); }
  }
  // Wraps a function in an operation. Returns the wrapped function.
  function operation(cm, f) {
    return function() {
      if (cm.curOp) return f.apply(cm, arguments);
      startOperation(cm);
      try { return f.apply(cm, arguments); }
      finally { endOperation(cm); }
    };
  }
  // Used to add methods to editor and doc instances, wrapping them in
  // operations.
  function methodOp(f) {
    return function() {
      if (this.curOp) return f.apply(this, arguments);
      startOperation(this);
      try { return f.apply(this, arguments); }
      finally { endOperation(this); }
    };
  }
  function docMethodOp(f) {
    return function() {
      var cm = this.cm;
      if (!cm || cm.curOp) return f.apply(this, arguments);
      startOperation(cm);
      try { return f.apply(this, arguments); }
      finally { endOperation(cm); }
    };
  }

  // VIEW TRACKING

  // These objects are used to represent the visible (currently drawn)
  // part of the document. A LineView may correspond to multiple
  // logical lines, if those are connected by collapsed ranges.
  function LineView(doc, line, lineN) {
    // The starting line
    this.line = line;
    // Continuing lines, if any
    this.rest = visualLineContinued(line);
    // Number of logical lines in this visual line
    this.size = this.rest ? lineNo(lst(this.rest)) - lineN + 1 : 1;
    this.node = this.text = null;
    this.hidden = lineIsHidden(doc, line);
  }

  // Create a range of LineView objects for the given lines.
  function buildViewArray(cm, from, to) {
    var array = [], nextPos;
    for (var pos = from; pos < to; pos = nextPos) {
      var view = new LineView(cm.doc, getLine(cm.doc, pos), pos);
      nextPos = pos + view.size;
      array.push(view);
    }
    return array;
  }

  // Updates the display.view data structure for a given change to the
  // document. From and to are in pre-change coordinates. Lendiff is
  // the amount of lines added or subtracted by the change. This is
  // used for changes that span multiple lines, or change the way
  // lines are divided into visual lines. regLineChange (below)
  // registers single-line changes.
  function regChange(cm, from, to, lendiff) {
    if (from == null) from = cm.doc.first;
    if (to == null) to = cm.doc.first + cm.doc.size;
    if (!lendiff) lendiff = 0;

    var display = cm.display;
    if (lendiff && to < display.viewTo &&
        (display.updateLineNumbers == null || display.updateLineNumbers > from))
      display.updateLineNumbers = from;

    cm.curOp.viewChanged = true;

    if (from >= display.viewTo) { // Change after
      if (sawCollapsedSpans && visualLineNo(cm.doc, from) < display.viewTo)
        resetView(cm);
    } else if (to <= display.viewFrom) { // Change before
      if (sawCollapsedSpans && visualLineEndNo(cm.doc, to + lendiff) > display.viewFrom) {
        resetView(cm);
      } else {
        display.viewFrom += lendiff;
        display.viewTo += lendiff;
      }
    } else if (from <= display.viewFrom && to >= display.viewTo) { // Full overlap
      resetView(cm);
    } else if (from <= display.viewFrom) { // Top overlap
      var cut = viewCuttingPoint(cm, to, to + lendiff, 1);
      if (cut) {
        display.view = display.view.slice(cut.index);
        display.viewFrom = cut.lineN;
        display.viewTo += lendiff;
      } else {
        resetView(cm);
      }
    } else if (to >= display.viewTo) { // Bottom overlap
      var cut = viewCuttingPoint(cm, from, from, -1);
      if (cut) {
        display.view = display.view.slice(0, cut.index);
        display.viewTo = cut.lineN;
      } else {
        resetView(cm);
      }
    } else { // Gap in the middle
      var cutTop = viewCuttingPoint(cm, from, from, -1);
      var cutBot = viewCuttingPoint(cm, to, to + lendiff, 1);
      if (cutTop && cutBot) {
        display.view = display.view.slice(0, cutTop.index)
          .concat(buildViewArray(cm, cutTop.lineN, cutBot.lineN))
          .concat(display.view.slice(cutBot.index));
        display.viewTo += lendiff;
      } else {
        resetView(cm);
      }
    }

    var ext = display.externalMeasured;
    if (ext) {
      if (to < ext.lineN)
        ext.lineN += lendiff;
      else if (from < ext.lineN + ext.size)
        display.externalMeasured = null;
    }
  }

  // Register a change to a single line. Type must be one of "text",
  // "gutter", "class", "widget"
  function regLineChange(cm, line, type) {
    cm.curOp.viewChanged = true;
    var display = cm.display, ext = cm.display.externalMeasured;
    if (ext && line >= ext.lineN && line < ext.lineN + ext.size)
      display.externalMeasured = null;

    if (line < display.viewFrom || line >= display.viewTo) return;
    var lineView = display.view[findViewIndex(cm, line)];
    if (lineView.node == null) return;
    var arr = lineView.changes || (lineView.changes = []);
    if (indexOf(arr, type) == -1) arr.push(type);
  }

  // Clear the view.
  function resetView(cm) {
    cm.display.viewFrom = cm.display.viewTo = cm.doc.first;
    cm.display.view = [];
    cm.display.viewOffset = 0;
  }

  // Find the view element corresponding to a given line. Return null
  // when the line isn't visible.
  function findViewIndex(cm, n) {
    if (n >= cm.display.viewTo) return null;
    n -= cm.display.viewFrom;
    if (n < 0) return null;
    var view = cm.display.view;
    for (var i = 0; i < view.length; i++) {
      n -= view[i].size;
      if (n < 0) return i;
    }
  }

  function viewCuttingPoint(cm, oldN, newN, dir) {
    var index = findViewIndex(cm, oldN), diff, view = cm.display.view;
    if (!sawCollapsedSpans || newN == cm.doc.first + cm.doc.size)
      return {index: index, lineN: newN};
    for (var i = 0, n = cm.display.viewFrom; i < index; i++)
      n += view[i].size;
    if (n != oldN) {
      if (dir > 0) {
        if (index == view.length - 1) return null;
        diff = (n + view[index].size) - oldN;
        index++;
      } else {
        diff = n - oldN;
      }
      oldN += diff; newN += diff;
    }
    while (visualLineNo(cm.doc, newN) != newN) {
      if (index == (dir < 0 ? 0 : view.length - 1)) return null;
      newN += dir * view[index - (dir < 0 ? 1 : 0)].size;
      index += dir;
    }
    return {index: index, lineN: newN};
  }

  // Force the view to cover a given range, adding empty view element
  // or clipping off existing ones as needed.
  function adjustView(cm, from, to) {
    var display = cm.display, view = display.view;
    if (view.length == 0 || from >= display.viewTo || to <= display.viewFrom) {
      display.view = buildViewArray(cm, from, to);
      display.viewFrom = from;
    } else {
      if (display.viewFrom > from)
        display.view = buildViewArray(cm, from, display.viewFrom).concat(display.view);
      else if (display.viewFrom < from)
        display.view = display.view.slice(findViewIndex(cm, from));
      display.viewFrom = from;
      if (display.viewTo < to)
        display.view = display.view.concat(buildViewArray(cm, display.viewTo, to));
      else if (display.viewTo > to)
        display.view = display.view.slice(0, findViewIndex(cm, to));
    }
    display.viewTo = to;
  }

  // Count the number of lines in the view whose DOM representation is
  // out of date (or nonexistent).
  function countDirtyView(cm) {
    var view = cm.display.view, dirty = 0;
    for (var i = 0; i < view.length; i++) {
      var lineView = view[i];
      if (!lineView.hidden && (!lineView.node || lineView.changes)) ++dirty;
    }
    return dirty;
  }

  // EVENT HANDLERS

  // Attach the necessary event handlers when initializing the editor
  function registerEventHandlers(cm) {
    var d = cm.display;
    on(d.scroller, "mousedown", operation(cm, onMouseDown));
    // Older IE's will not fire a second mousedown for a double click
    if (ie && ie_version < 11)
      on(d.scroller, "dblclick", operation(cm, function(e) {
        if (signalDOMEvent(cm, e)) return;
        var pos = posFromMouse(cm, e);
        if (!pos || clickInGutter(cm, e) || eventInWidget(cm.display, e)) return;
        e_preventDefault(e);
        var word = cm.findWordAt(pos);
        extendSelection(cm.doc, word.anchor, word.head);
      }));
    else
      on(d.scroller, "dblclick", function(e) { signalDOMEvent(cm, e) || e_preventDefault(e); });
    // Some browsers fire contextmenu *after* opening the menu, at
    // which point we can't mess with it anymore. Context menu is
    // handled in onMouseDown for these browsers.
    if (!captureRightClick) on(d.scroller, "contextmenu", function(e) {onContextMenu(cm, e);});

    // Used to suppress mouse event handling when a touch happens
    var touchFinished, prevTouch = {end: 0};
    function finishTouch() {
      if (d.activeTouch) {
        touchFinished = setTimeout(function() {d.activeTouch = null;}, 1000);
        prevTouch = d.activeTouch;
        prevTouch.end = +new Date;
      }
    };
    function isMouseLikeTouchEvent(e) {
      if (e.touches.length != 1) return false;
      var touch = e.touches[0];
      return touch.radiusX <= 1 && touch.radiusY <= 1;
    }
    function farAway(touch, other) {
      if (other.left == null) return true;
      var dx = other.left - touch.left, dy = other.top - touch.top;
      return dx * dx + dy * dy > 20 * 20;
    }
    on(d.scroller, "touchstart", function(e) {
      if (!isMouseLikeTouchEvent(e)) {
        clearTimeout(touchFinished);
        var now = +new Date;
        d.activeTouch = {start: now, moved: false,
                         prev: now - prevTouch.end <= 300 ? prevTouch : null};
        if (e.touches.length == 1) {
          d.activeTouch.left = e.touches[0].pageX;
          d.activeTouch.top = e.touches[0].pageY;
        }
      }
    });
    on(d.scroller, "touchmove", function() {
      if (d.activeTouch) d.activeTouch.moved = true;
    });
    on(d.scroller, "touchend", function(e) {
      var touch = d.activeTouch;
      if (touch && !eventInWidget(d, e) && touch.left != null &&
          !touch.moved && new Date - touch.start < 300) {
        var pos = cm.coordsChar(d.activeTouch, "page"), range;
        if (!touch.prev || farAway(touch, touch.prev)) // Single tap
          range = new Range(pos, pos);
        else if (!touch.prev.prev || farAway(touch, touch.prev.prev)) // Double tap
          range = cm.findWordAt(pos);
        else // Triple tap
          range = new Range(Pos(pos.line, 0), clipPos(cm.doc, Pos(pos.line + 1, 0)));
        cm.setSelection(range.anchor, range.head);
        cm.focus();
        e_preventDefault(e);
      }
      finishTouch();
    });
    on(d.scroller, "touchcancel", finishTouch);

    // Sync scrolling between fake scrollbars and real scrollable
    // area, ensure viewport is updated when scrolling.
    on(d.scroller, "scroll", function() {
      if (d.scroller.clientHeight) {
        setScrollTop(cm, d.scroller.scrollTop);
        setScrollLeft(cm, d.scroller.scrollLeft, true);
        signal(cm, "scroll", cm);
      }
    });

    // Listen to wheel events in order to try and update the viewport on time.
    on(d.scroller, "mousewheel", function(e){onScrollWheel(cm, e);});
    on(d.scroller, "DOMMouseScroll", function(e){onScrollWheel(cm, e);});

    // Prevent wrapper from ever scrolling
    on(d.wrapper, "scroll", function() { d.wrapper.scrollTop = d.wrapper.scrollLeft = 0; });

    d.dragFunctions = {
      enter: function(e) {if (!signalDOMEvent(cm, e)) e_stop(e);},
      over: function(e) {if (!signalDOMEvent(cm, e)) { onDragOver(cm, e); e_stop(e); }},
      start: function(e){onDragStart(cm, e);},
      drop: operation(cm, onDrop),
      leave: function() {clearDragCursor(cm);}
    };

    var inp = d.input.getField();
    on(inp, "keyup", function(e) { onKeyUp.call(cm, e); });
    on(inp, "keydown", operation(cm, onKeyDown));
    on(inp, "keypress", operation(cm, onKeyPress));
    on(inp, "focus", bind(onFocus, cm));
    on(inp, "blur", bind(onBlur, cm));
  }

  function dragDropChanged(cm, value, old) {
    var wasOn = old && old != CodeMirror.Init;
    if (!value != !wasOn) {
      var funcs = cm.display.dragFunctions;
      var toggle = value ? on : off;
      toggle(cm.display.scroller, "dragstart", funcs.start);
      toggle(cm.display.scroller, "dragenter", funcs.enter);
      toggle(cm.display.scroller, "dragover", funcs.over);
      toggle(cm.display.scroller, "dragleave", funcs.leave);
      toggle(cm.display.scroller, "drop", funcs.drop);
    }
  }

  // Called when the window resizes
  function onResize(cm) {
    var d = cm.display;
    if (d.lastWrapHeight == d.wrapper.clientHeight && d.lastWrapWidth == d.wrapper.clientWidth)
      return;
    // Might be a text scaling operation, clear size caches.
    d.cachedCharWidth = d.cachedTextHeight = d.cachedPaddingH = null;
    d.scrollbarsClipped = false;
    cm.setSize();
  }

  // MOUSE EVENTS

  // Return true when the given mouse event happened in a widget
  function eventInWidget(display, e) {
    for (var n = e_target(e); n != display.wrapper; n = n.parentNode) {
      if (!n || (n.nodeType == 1 && n.getAttribute("cm-ignore-events") == "true") ||
          (n.parentNode == display.sizer && n != display.mover))
        return true;
    }
  }

  // Given a mouse event, find the corresponding position. If liberal
  // is false, it checks whether a gutter or scrollbar was clicked,
  // and returns null if it was. forRect is used by rectangular
  // selections, and tries to estimate a character position even for
  // coordinates beyond the right of the text.
  function posFromMouse(cm, e, liberal, forRect) {
    var display = cm.display;
    if (!liberal && e_target(e).getAttribute("cm-not-content") == "true") return null;

    var x, y, space = display.lineSpace.getBoundingClientRect();
    // Fails unpredictably on IE[67] when mouse is dragged around quickly.
    try { x = e.clientX - space.left; y = e.clientY - space.top; }
    catch (e) { return null; }
    var coords = coordsChar(cm, x, y), line;
    if (forRect && coords.xRel == 1 && (line = getLine(cm.doc, coords.line).text).length == coords.ch) {
      var colDiff = countColumn(line, line.length, cm.options.tabSize) - line.length;
      coords = Pos(coords.line, Math.max(0, Math.round((x - paddingH(cm.display).left) / charWidth(cm.display)) - colDiff));
    }
    return coords;
  }

  // A mouse down can be a single click, double click, triple click,
  // start of selection drag, start of text drag, new cursor
  // (ctrl-click), rectangle drag (alt-drag), or xwin
  // middle-click-paste. Or it might be a click on something we should
  // not interfere with, such as a scrollbar or widget.
  function onMouseDown(e) {
    var cm = this, display = cm.display;
    if (display.activeTouch && display.input.supportsTouch() || signalDOMEvent(cm, e)) return;
    display.shift = e.shiftKey;

    if (eventInWidget(display, e)) {
      if (!webkit) {
        // Briefly turn off draggability, to allow widgets to do
        // normal dragging things.
        display.scroller.draggable = false;
        setTimeout(function(){display.scroller.draggable = true;}, 100);
      }
      return;
    }
    if (clickInGutter(cm, e)) return;
    var start = posFromMouse(cm, e);
    window.focus();

    switch (e_button(e)) {
    case 1:
      // #3261: make sure, that we're not starting a second selection
      if (cm.state.selectingText)
        cm.state.selectingText(e);
      else if (start)
        leftButtonDown(cm, e, start);
      else if (e_target(e) == display.scroller)
        e_preventDefault(e);
      break;
    case 2:
      if (webkit) cm.state.lastMiddleDown = +new Date;
      if (start) extendSelection(cm.doc, start);
      setTimeout(function() {display.input.focus();}, 20);
      e_preventDefault(e);
      break;
    case 3:
      if (captureRightClick) onContextMenu(cm, e);
      else delayBlurEvent(cm);
      break;
    }
  }

  var lastClick, lastDoubleClick;
  function leftButtonDown(cm, e, start) {
    if (ie) setTimeout(bind(ensureFocus, cm), 0);
    else cm.curOp.focus = activeElt();

    var now = +new Date, type;
    if (lastDoubleClick && lastDoubleClick.time > now - 400 && cmp(lastDoubleClick.pos, start) == 0) {
      type = "triple";
    } else if (lastClick && lastClick.time > now - 400 && cmp(lastClick.pos, start) == 0) {
      type = "double";
      lastDoubleClick = {time: now, pos: start};
    } else {
      type = "single";
      lastClick = {time: now, pos: start};
    }

    var sel = cm.doc.sel, modifier = mac ? e.metaKey : e.ctrlKey, contained;
    if (cm.options.dragDrop && dragAndDrop && !isReadOnly(cm) &&
        type == "single" && (contained = sel.contains(start)) > -1 &&
        (cmp((contained = sel.ranges[contained]).from(), start) < 0 || start.xRel > 0) &&
        (cmp(contained.to(), start) > 0 || start.xRel < 0))
      leftButtonStartDrag(cm, e, start, modifier);
    else
      leftButtonSelect(cm, e, start, type, modifier);
  }

  // Start a text drag. When it ends, see if any dragging actually
  // happen, and treat as a click if it didn't.
  function leftButtonStartDrag(cm, e, start, modifier) {
    var display = cm.display, startTime = +new Date;
    var dragEnd = operation(cm, function(e2) {
      if (webkit) display.scroller.draggable = false;
      cm.state.draggingText = false;
      off(document, "mouseup", dragEnd);
      off(display.scroller, "drop", dragEnd);
      if (Math.abs(e.clientX - e2.clientX) + Math.abs(e.clientY - e2.clientY) < 10) {
        e_preventDefault(e2);
        if (!modifier && +new Date - 200 < startTime)
          extendSelection(cm.doc, start);
        // Work around unexplainable focus problem in IE9 (#2127) and Chrome (#3081)
        if (webkit || ie && ie_version == 9)
          setTimeout(function() {document.body.focus(); display.input.focus();}, 20);
        else
          display.input.focus();
      }
    });
    // Let the drag handler handle this.
    if (webkit) display.scroller.draggable = true;
    cm.state.draggingText = dragEnd;
    // IE's approach to draggable
    if (display.scroller.dragDrop) display.scroller.dragDrop();
    on(document, "mouseup", dragEnd);
    on(display.scroller, "drop", dragEnd);
  }

  // Normal selection, as opposed to text dragging.
  function leftButtonSelect(cm, e, start, type, addNew) {
    var display = cm.display, doc = cm.doc;
    e_preventDefault(e);

    var ourRange, ourIndex, startSel = doc.sel, ranges = startSel.ranges;
    if (addNew && !e.shiftKey) {
      ourIndex = doc.sel.contains(start);
      if (ourIndex > -1)
        ourRange = ranges[ourIndex];
      else
        ourRange = new Range(start, start);
    } else {
      ourRange = doc.sel.primary();
      ourIndex = doc.sel.primIndex;
    }

    if (e.altKey) {
      type = "rect";
      if (!addNew) ourRange = new Range(start, start);
      start = posFromMouse(cm, e, true, true);
      ourIndex = -1;
    } else if (type == "double") {
      var word = cm.findWordAt(start);
      if (cm.display.shift || doc.extend)
        ourRange = extendRange(doc, ourRange, word.anchor, word.head);
      else
        ourRange = word;
    } else if (type == "triple") {
      var line = new Range(Pos(start.line, 0), clipPos(doc, Pos(start.line + 1, 0)));
      if (cm.display.shift || doc.extend)
        ourRange = extendRange(doc, ourRange, line.anchor, line.head);
      else
        ourRange = line;
    } else {
      ourRange = extendRange(doc, ourRange, start);
    }

    if (!addNew) {
      ourIndex = 0;
      setSelection(doc, new Selection([ourRange], 0), sel_mouse);
      startSel = doc.sel;
    } else if (ourIndex == -1) {
      ourIndex = ranges.length;
      setSelection(doc, normalizeSelection(ranges.concat([ourRange]), ourIndex),
                   {scroll: false, origin: "*mouse"});
    } else if (ranges.length > 1 && ranges[ourIndex].empty() && type == "single" && !e.shiftKey) {
      setSelection(doc, normalizeSelection(ranges.slice(0, ourIndex).concat(ranges.slice(ourIndex + 1)), 0),
                   {scroll: false, origin: "*mouse"});
      startSel = doc.sel;
    } else {
      replaceOneSelection(doc, ourIndex, ourRange, sel_mouse);
    }

    var lastPos = start;
    function extendTo(pos) {
      if (cmp(lastPos, pos) == 0) return;
      lastPos = pos;

      if (type == "rect") {
        var ranges = [], tabSize = cm.options.tabSize;
        var startCol = countColumn(getLine(doc, start.line).text, start.ch, tabSize);
        var posCol = countColumn(getLine(doc, pos.line).text, pos.ch, tabSize);
        var left = Math.min(startCol, posCol), right = Math.max(startCol, posCol);
        for (var line = Math.min(start.line, pos.line), end = Math.min(cm.lastLine(), Math.max(start.line, pos.line));
             line <= end; line++) {
          var text = getLine(doc, line).text, leftPos = findColumn(text, left, tabSize);
          if (left == right)
            ranges.push(new Range(Pos(line, leftPos), Pos(line, leftPos)));
          else if (text.length > leftPos)
            ranges.push(new Range(Pos(line, leftPos), Pos(line, findColumn(text, right, tabSize))));
        }
        if (!ranges.length) ranges.push(new Range(start, start));
        setSelection(doc, normalizeSelection(startSel.ranges.slice(0, ourIndex).concat(ranges), ourIndex),
                     {origin: "*mouse", scroll: false});
        cm.scrollIntoView(pos);
      } else {
        var oldRange = ourRange;
        var anchor = oldRange.anchor, head = pos;
        if (type != "single") {
          if (type == "double")
            var range = cm.findWordAt(pos);
          else
            var range = new Range(Pos(pos.line, 0), clipPos(doc, Pos(pos.line + 1, 0)));
          if (cmp(range.anchor, anchor) > 0) {
            head = range.head;
            anchor = minPos(oldRange.from(), range.anchor);
          } else {
            head = range.anchor;
            anchor = maxPos(oldRange.to(), range.head);
          }
        }
        var ranges = startSel.ranges.slice(0);
        ranges[ourIndex] = new Range(clipPos(doc, anchor), head);
        setSelection(doc, normalizeSelection(ranges, ourIndex), sel_mouse);
      }
    }

    var editorSize = display.wrapper.getBoundingClientRect();
    // Used to ensure timeout re-tries don't fire when another extend
    // happened in the meantime (clearTimeout isn't reliable -- at
    // least on Chrome, the timeouts still happen even when cleared,
    // if the clear happens after their scheduled firing time).
    var counter = 0;

    function extend(e) {
      var curCount = ++counter;
      var cur = posFromMouse(cm, e, true, type == "rect");
      if (!cur) return;
      if (cmp(cur, lastPos) != 0) {
        cm.curOp.focus = activeElt();
        extendTo(cur);
        var visible = visibleLines(display, doc);
        if (cur.line >= visible.to || cur.line < visible.from)
          setTimeout(operation(cm, function(){if (counter == curCount) extend(e);}), 150);
      } else {
        var outside = e.clientY < editorSize.top ? -20 : e.clientY > editorSize.bottom ? 20 : 0;
        if (outside) setTimeout(operation(cm, function() {
          if (counter != curCount) return;
          display.scroller.scrollTop += outside;
          extend(e);
        }), 50);
      }
    }

    function done(e) {
      cm.state.selectingText = false;
      counter = Infinity;
      e_preventDefault(e);
      display.input.focus();
      off(document, "mousemove", move);
      off(document, "mouseup", up);
      doc.history.lastSelOrigin = null;
    }

    var move = operation(cm, function(e) {
      if (!e_button(e)) done(e);
      else extend(e);
    });
    var up = operation(cm, done);
    cm.state.selectingText = up;
    on(document, "mousemove", move);
    on(document, "mouseup", up);
  }

  // Determines whether an event happened in the gutter, and fires the
  // handlers for the corresponding event.
  function gutterEvent(cm, e, type, prevent) {
    try { var mX = e.clientX, mY = e.clientY; }
    catch(e) { return false; }
    if (mX >= Math.floor(cm.display.gutters.getBoundingClientRect().right)) return false;
    if (prevent) e_preventDefault(e);

    var display = cm.display;
    var lineBox = display.lineDiv.getBoundingClientRect();

    if (mY > lineBox.bottom || !hasHandler(cm, type)) return e_defaultPrevented(e);
    mY -= lineBox.top - display.viewOffset;

    for (var i = 0; i < cm.options.gutters.length; ++i) {
      var g = display.gutters.childNodes[i];
      if (g && g.getBoundingClientRect().right >= mX) {
        var line = lineAtHeight(cm.doc, mY);
        var gutter = cm.options.gutters[i];
        signal(cm, type, cm, line, gutter, e);
        return e_defaultPrevented(e);
      }
    }
  }

  function clickInGutter(cm, e) {
    return gutterEvent(cm, e, "gutterClick", true);
  }

  // Kludge to work around strange IE behavior where it'll sometimes
  // re-fire a series of drag-related events right after the drop (#1551)
  var lastDrop = 0;

  function onDrop(e) {
    var cm = this;
    clearDragCursor(cm);
    if (signalDOMEvent(cm, e) || eventInWidget(cm.display, e))
      return;
    e_preventDefault(e);
    if (ie) lastDrop = +new Date;
    var pos = posFromMouse(cm, e, true), files = e.dataTransfer.files;
    if (!pos || isReadOnly(cm)) return;
    // Might be a file drop, in which case we simply extract the text
    // and insert it.
    if (files && files.length && window.FileReader && window.File) {
      var n = files.length, text = Array(n), read = 0;
      var loadFile = function(file, i) {
        if (cm.options.allowDropFileTypes &&
            indexOf(cm.options.allowDropFileTypes, file.type) == -1)
          return;

        var reader = new FileReader;
        reader.onload = operation(cm, function() {
          var content = reader.result;
          if (/[\x00-\x08\x0e-\x1f]{2}/.test(content)) content = "";
          text[i] = content;
          if (++read == n) {
            pos = clipPos(cm.doc, pos);
            var change = {from: pos, to: pos,
                          text: cm.doc.splitLines(text.join(cm.doc.lineSeparator())),
                          origin: "paste"};
            makeChange(cm.doc, change);
            setSelectionReplaceHistory(cm.doc, simpleSelection(pos, changeEnd(change)));
          }
        });
        reader.readAsText(file);
      };
      for (var i = 0; i < n; ++i) loadFile(files[i], i);
    } else { // Normal drop
      // Don't do a replace if the drop happened inside of the selected text.
      if (cm.state.draggingText && cm.doc.sel.contains(pos) > -1) {
        cm.state.draggingText(e);
        // Ensure the editor is re-focused
        setTimeout(function() {cm.display.input.focus();}, 20);
        return;
      }
      try {
        var text = e.dataTransfer.getData("Text");
        if (text) {
          if (cm.state.draggingText && !(mac ? e.altKey : e.ctrlKey))
            var selected = cm.listSelections();
          setSelectionNoUndo(cm.doc, simpleSelection(pos, pos));
          if (selected) for (var i = 0; i < selected.length; ++i)
            replaceRange(cm.doc, "", selected[i].anchor, selected[i].head, "drag");
          cm.replaceSelection(text, "around", "paste");
          cm.display.input.focus();
        }
      }
      catch(e){}
    }
  }

  function onDragStart(cm, e) {
    if (ie && (!cm.state.draggingText || +new Date - lastDrop < 100)) { e_stop(e); return; }
    if (signalDOMEvent(cm, e) || eventInWidget(cm.display, e)) return;

    e.dataTransfer.setData("Text", cm.getSelection());

    // Use dummy image instead of default browsers image.
    // Recent Safari (~6.0.2) have a tendency to segfault when this happens, so we don't do it there.
    if (e.dataTransfer.setDragImage && !safari) {
      var img = elt("img", null, null, "position: fixed; left: 0; top: 0;");
      img.src = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
      if (presto) {
        img.width = img.height = 1;
        cm.display.wrapper.appendChild(img);
        // Force a relayout, or Opera won't use our image for some obscure reason
        img._top = img.offsetTop;
      }
      e.dataTransfer.setDragImage(img, 0, 0);
      if (presto) img.parentNode.removeChild(img);
    }
  }

  function onDragOver(cm, e) {
    var pos = posFromMouse(cm, e);
    if (!pos) return;
    var frag = document.createDocumentFragment();
    drawSelectionCursor(cm, pos, frag);
    if (!cm.display.dragCursor) {
      cm.display.dragCursor = elt("div", null, "CodeMirror-cursors CodeMirror-dragcursors");
      cm.display.lineSpace.insertBefore(cm.display.dragCursor, cm.display.cursorDiv);
    }
    removeChildrenAndAdd(cm.display.dragCursor, frag);
  }

  function clearDragCursor(cm) {
    if (cm.display.dragCursor) {
      cm.display.lineSpace.removeChild(cm.display.dragCursor);
      cm.display.dragCursor = null;
    }
  }

  // SCROLL EVENTS

  // Sync the scrollable area and scrollbars, ensure the viewport
  // covers the visible area.
  function setScrollTop(cm, val) {
    if (Math.abs(cm.doc.scrollTop - val) < 2) return;
    cm.doc.scrollTop = val;
    if (!gecko) updateDisplaySimple(cm, {top: val});
    if (cm.display.scroller.scrollTop != val) cm.display.scroller.scrollTop = val;
    cm.display.scrollbars.setScrollTop(val);
    if (gecko) updateDisplaySimple(cm);
    startWorker(cm, 100);
  }
  // Sync scroller and scrollbar, ensure the gutter elements are
  // aligned.
  function setScrollLeft(cm, val, isScroller) {
    if (isScroller ? val == cm.doc.scrollLeft : Math.abs(cm.doc.scrollLeft - val) < 2) return;
    val = Math.min(val, cm.display.scroller.scrollWidth - cm.display.scroller.clientWidth);
    cm.doc.scrollLeft = val;
    alignHorizontally(cm);
    if (cm.display.scroller.scrollLeft != val) cm.display.scroller.scrollLeft = val;
    cm.display.scrollbars.setScrollLeft(val);
  }

  // Since the delta values reported on mouse wheel events are
  // unstandardized between browsers and even browser versions, and
  // generally horribly unpredictable, this code starts by measuring
  // the scroll effect that the first few mouse wheel events have,
  // and, from that, detects the way it can convert deltas to pixel
  // offsets afterwards.
  //
  // The reason we want to know the amount a wheel event will scroll
  // is that it gives us a chance to update the display before the
  // actual scrolling happens, reducing flickering.

  var wheelSamples = 0, wheelPixelsPerUnit = null;
  // Fill in a browser-detected starting value on browsers where we
  // know one. These don't have to be accurate -- the result of them
  // being wrong would just be a slight flicker on the first wheel
  // scroll (if it is large enough).
  if (ie) wheelPixelsPerUnit = -.53;
  else if (gecko) wheelPixelsPerUnit = 15;
  else if (chrome) wheelPixelsPerUnit = -.7;
  else if (safari) wheelPixelsPerUnit = -1/3;

  var wheelEventDelta = function(e) {
    var dx = e.wheelDeltaX, dy = e.wheelDeltaY;
    if (dx == null && e.detail && e.axis == e.HORIZONTAL_AXIS) dx = e.detail;
    if (dy == null && e.detail && e.axis == e.VERTICAL_AXIS) dy = e.detail;
    else if (dy == null) dy = e.wheelDelta;
    return {x: dx, y: dy};
  };
  CodeMirror.wheelEventPixels = function(e) {
    var delta = wheelEventDelta(e);
    delta.x *= wheelPixelsPerUnit;
    delta.y *= wheelPixelsPerUnit;
    return delta;
  };

  function onScrollWheel(cm, e) {
    var delta = wheelEventDelta(e), dx = delta.x, dy = delta.y;

    var display = cm.display, scroll = display.scroller;
    // Quit if there's nothing to scroll here
    var canScrollX = scroll.scrollWidth > scroll.clientWidth;
    var canScrollY = scroll.scrollHeight > scroll.clientHeight;
    if (!(dx && canScrollX || dy && canScrollY)) return;

    // Webkit browsers on OS X abort momentum scrolls when the target
    // of the scroll event is removed from the scrollable element.
    // This hack (see related code in patchDisplay) makes sure the
    // element is kept around.
    if (dy && mac && webkit) {
      outer: for (var cur = e.target, view = display.view; cur != scroll; cur = cur.parentNode) {
        for (var i = 0; i < view.length; i++) {
          if (view[i].node == cur) {
            cm.display.currentWheelTarget = cur;
            break outer;
          }
        }
      }
    }

    // On some browsers, horizontal scrolling will cause redraws to
    // happen before the gutter has been realigned, causing it to
    // wriggle around in a most unseemly way. When we have an
    // estimated pixels/delta value, we just handle horizontal
    // scrolling entirely here. It'll be slightly off from native, but
    // better than glitching out.
    if (dx && !gecko && !presto && wheelPixelsPerUnit != null) {
      if (dy && canScrollY)
        setScrollTop(cm, Math.max(0, Math.min(scroll.scrollTop + dy * wheelPixelsPerUnit, scroll.scrollHeight - scroll.clientHeight)));
      setScrollLeft(cm, Math.max(0, Math.min(scroll.scrollLeft + dx * wheelPixelsPerUnit, scroll.scrollWidth - scroll.clientWidth)));
      // Only prevent default scrolling if vertical scrolling is
      // actually possible. Otherwise, it causes vertical scroll
      // jitter on OSX trackpads when deltaX is small and deltaY
      // is large (issue #3579)
      if (!dy || (dy && canScrollY))
        e_preventDefault(e);
      display.wheelStartX = null; // Abort measurement, if in progress
      return;
    }

    // 'Project' the visible viewport to cover the area that is being
    // scrolled into view (if we know enough to estimate it).
    if (dy && wheelPixelsPerUnit != null) {
      var pixels = dy * wheelPixelsPerUnit;
      var top = cm.doc.scrollTop, bot = top + display.wrapper.clientHeight;
      if (pixels < 0) top = Math.max(0, top + pixels - 50);
      else bot = Math.min(cm.doc.height, bot + pixels + 50);
      updateDisplaySimple(cm, {top: top, bottom: bot});
    }

    if (wheelSamples < 20) {
      if (display.wheelStartX == null) {
        display.wheelStartX = scroll.scrollLeft; display.wheelStartY = scroll.scrollTop;
        display.wheelDX = dx; display.wheelDY = dy;
        setTimeout(function() {
          if (display.wheelStartX == null) return;
          var movedX = scroll.scrollLeft - display.wheelStartX;
          var movedY = scroll.scrollTop - display.wheelStartY;
          var sample = (movedY && display.wheelDY && movedY / display.wheelDY) ||
            (movedX && display.wheelDX && movedX / display.wheelDX);
          display.wheelStartX = display.wheelStartY = null;
          if (!sample) return;
          wheelPixelsPerUnit = (wheelPixelsPerUnit * wheelSamples + sample) / (wheelSamples + 1);
          ++wheelSamples;
        }, 200);
      } else {
        display.wheelDX += dx; display.wheelDY += dy;
      }
    }
  }

  // KEY EVENTS

  // Run a handler that was bound to a key.
  function doHandleBinding(cm, bound, dropShift) {
    if (typeof bound == "string") {
      bound = commands[bound];
      if (!bound) return false;
    }
    // Ensure previous input has been read, so that the handler sees a
    // consistent view of the document
    cm.display.input.ensurePolled();
    var prevShift = cm.display.shift, done = false;
    try {
      if (isReadOnly(cm)) cm.state.suppressEdits = true;
      if (dropShift) cm.display.shift = false;
      done = bound(cm) != Pass;
    } finally {
      cm.display.shift = prevShift;
      cm.state.suppressEdits = false;
    }
    return done;
  }

  function lookupKeyForEditor(cm, name, handle) {
    for (var i = 0; i < cm.state.keyMaps.length; i++) {
      var result = lookupKey(name, cm.state.keyMaps[i], handle, cm);
      if (result) return result;
    }
    return (cm.options.extraKeys && lookupKey(name, cm.options.extraKeys, handle, cm))
      || lookupKey(name, cm.options.keyMap, handle, cm);
  }

  var stopSeq = new Delayed;
  function dispatchKey(cm, name, e, handle) {
    var seq = cm.state.keySeq;
    if (seq) {
      if (isModifierKey(name)) return "handled";
      stopSeq.set(50, function() {
        if (cm.state.keySeq == seq) {
          cm.state.keySeq = null;
          cm.display.input.reset();
        }
      });
      name = seq + " " + name;
    }
    var result = lookupKeyForEditor(cm, name, handle);

    if (result == "multi")
      cm.state.keySeq = name;
    if (result == "handled")
      signalLater(cm, "keyHandled", cm, name, e);

    if (result == "handled" || result == "multi") {
      e_preventDefault(e);
      restartBlink(cm);
    }

    if (seq && !result && /\'$/.test(name)) {
      e_preventDefault(e);
      return true;
    }
    return !!result;
  }

  // Handle a key from the keydown event.
  function handleKeyBinding(cm, e) {
    var name = keyName(e, true);
    if (!name) return false;

    if (e.shiftKey && !cm.state.keySeq) {
      // First try to resolve full name (including 'Shift-'). Failing
      // that, see if there is a cursor-motion command (starting with
      // 'go') bound to the keyname without 'Shift-'.
      return dispatchKey(cm, "Shift-" + name, e, function(b) {return doHandleBinding(cm, b, true);})
          || dispatchKey(cm, name, e, function(b) {
               if (typeof b == "string" ? /^go[A-Z]/.test(b) : b.motion)
                 return doHandleBinding(cm, b);
             });
    } else {
      return dispatchKey(cm, name, e, function(b) { return doHandleBinding(cm, b); });
    }
  }

  // Handle a key from the keypress event
  function handleCharBinding(cm, e, ch) {
    return dispatchKey(cm, "'" + ch + "'", e,
                       function(b) { return doHandleBinding(cm, b, true); });
  }

  var lastStoppedKey = null;
  function onKeyDown(e) {
    var cm = this;
    cm.curOp.focus = activeElt();
    if (signalDOMEvent(cm, e)) return;
    // IE does strange things with escape.
    if (ie && ie_version < 11 && e.keyCode == 27) e.returnValue = false;
    var code = e.keyCode;
    cm.display.shift = code == 16 || e.shiftKey;
    var handled = handleKeyBinding(cm, e);
    if (presto) {
      lastStoppedKey = handled ? code : null;
      // Opera has no cut event... we try to at least catch the key combo
      if (!handled && code == 88 && !hasCopyEvent && (mac ? e.metaKey : e.ctrlKey))
        cm.replaceSelection("", null, "cut");
    }

    // Turn mouse into crosshair when Alt is held on Mac.
    if (code == 18 && !/\bCodeMirror-crosshair\b/.test(cm.display.lineDiv.className))
      showCrossHair(cm);
  }

  function showCrossHair(cm) {
    var lineDiv = cm.display.lineDiv;
    addClass(lineDiv, "CodeMirror-crosshair");

    function up(e) {
      if (e.keyCode == 18 || !e.altKey) {
        rmClass(lineDiv, "CodeMirror-crosshair");
        off(document, "keyup", up);
        off(document, "mouseover", up);
      }
    }
    on(document, "keyup", up);
    on(document, "mouseover", up);
  }

  function onKeyUp(e) {
    if (e.keyCode == 16) this.doc.sel.shift = false;
    signalDOMEvent(this, e);
  }

  function onKeyPress(e) {
    var cm = this;
    if (eventInWidget(cm.display, e) || signalDOMEvent(cm, e) || e.ctrlKey && !e.altKey || mac && e.metaKey) return;
    var keyCode = e.keyCode, charCode = e.charCode;
    if (presto && keyCode == lastStoppedKey) {lastStoppedKey = null; e_preventDefault(e); return;}
    if ((presto && (!e.which || e.which < 10)) && handleKeyBinding(cm, e)) return;
    var ch = String.fromCharCode(charCode == null ? keyCode : charCode);
    if (handleCharBinding(cm, e, ch)) return;
    cm.display.input.onKeyPress(e);
  }

  // FOCUS/BLUR EVENTS

  function delayBlurEvent(cm) {
    cm.state.delayingBlurEvent = true;
    setTimeout(function() {
      if (cm.state.delayingBlurEvent) {
        cm.state.delayingBlurEvent = false;
        onBlur(cm);
      }
    }, 100);
  }

  function onFocus(cm) {
    if (cm.state.delayingBlurEvent) cm.state.delayingBlurEvent = false;

    if (cm.options.readOnly == "nocursor") return;
    if (!cm.state.focused) {
      signal(cm, "focus", cm);
      cm.state.focused = true;
      addClass(cm.display.wrapper, "CodeMirror-focused");
      // This test prevents this from firing when a context
      // menu is closed (since the input reset would kill the
      // select-all detection hack)
      if (!cm.curOp && cm.display.selForContextMenu != cm.doc.sel) {
        cm.display.input.reset();
        if (webkit) setTimeout(function() { cm.display.input.reset(true); }, 20); // Issue #1730
      }
      cm.display.input.receivedFocus();
    }
    restartBlink(cm);
  }
  function onBlur(cm) {
    if (cm.state.delayingBlurEvent) return;

    if (cm.state.focused) {
      signal(cm, "blur", cm);
      cm.state.focused = false;
      rmClass(cm.display.wrapper, "CodeMirror-focused");
    }
    clearInterval(cm.display.blinker);
    setTimeout(function() {if (!cm.state.focused) cm.display.shift = false;}, 150);
  }

  // CONTEXT MENU HANDLING

  // To make the context menu work, we need to briefly unhide the
  // textarea (making it as unobtrusive as possible) to let the
  // right-click take effect on it.
  function onContextMenu(cm, e) {
    if (eventInWidget(cm.display, e) || contextMenuInGutter(cm, e)) return;
    if (signalDOMEvent(cm, e, "contextmenu")) return;
    cm.display.input.onContextMenu(e);
  }

  function contextMenuInGutter(cm, e) {
    if (!hasHandler(cm, "gutterContextMenu")) return false;
    return gutterEvent(cm, e, "gutterContextMenu", false);
  }

  // UPDATING

  // Compute the position of the end of a change (its 'to' property
  // refers to the pre-change end).
  var changeEnd = CodeMirror.changeEnd = function(change) {
    if (!change.text) return change.to;
    return Pos(change.from.line + change.text.length - 1,
               lst(change.text).length + (change.text.length == 1 ? change.from.ch : 0));
  };

  // Adjust a position to refer to the post-change position of the
  // same text, or the end of the change if the change covers it.
  function adjustForChange(pos, change) {
    if (cmp(pos, change.from) < 0) return pos;
    if (cmp(pos, change.to) <= 0) return changeEnd(change);

    var line = pos.line + change.text.length - (change.to.line - change.from.line) - 1, ch = pos.ch;
    if (pos.line == change.to.line) ch += changeEnd(change).ch - change.to.ch;
    return Pos(line, ch);
  }

  function computeSelAfterChange(doc, change) {
    var out = [];
    for (var i = 0; i < doc.sel.ranges.length; i++) {
      var range = doc.sel.ranges[i];
      out.push(new Range(adjustForChange(range.anchor, change),
                         adjustForChange(range.head, change)));
    }
    return normalizeSelection(out, doc.sel.primIndex);
  }

  function offsetPos(pos, old, nw) {
    if (pos.line == old.line)
      return Pos(nw.line, pos.ch - old.ch + nw.ch);
    else
      return Pos(nw.line + (pos.line - old.line), pos.ch);
  }

  // Used by replaceSelections to allow moving the selection to the
  // start or around the replaced test. Hint may be "start" or "around".
  function computeReplacedSel(doc, changes, hint) {
    var out = [];
    var oldPrev = Pos(doc.first, 0), newPrev = oldPrev;
    for (var i = 0; i < changes.length; i++) {
      var change = changes[i];
      var from = offsetPos(change.from, oldPrev, newPrev);
      var to = offsetPos(changeEnd(change), oldPrev, newPrev);
      oldPrev = change.to;
      newPrev = to;
      if (hint == "around") {
        var range = doc.sel.ranges[i], inv = cmp(range.head, range.anchor) < 0;
        out[i] = new Range(inv ? to : from, inv ? from : to);
      } else {
        out[i] = new Range(from, from);
      }
    }
    return new Selection(out, doc.sel.primIndex);
  }

  // Allow "beforeChange" event handlers to influence a change
  function filterChange(doc, change, update) {
    var obj = {
      canceled: false,
      from: change.from,
      to: change.to,
      text: change.text,
      origin: change.origin,
      cancel: function() { this.canceled = true; }
    };
    if (update) obj.update = function(from, to, text, origin) {
      if (from) this.from = clipPos(doc, from);
      if (to) this.to = clipPos(doc, to);
      if (text) this.text = text;
      if (origin !== undefined) this.origin = origin;
    };
    signal(doc, "beforeChange", doc, obj);
    if (doc.cm) signal(doc.cm, "beforeChange", doc.cm, obj);

    if (obj.canceled) return null;
    return {from: obj.from, to: obj.to, text: obj.text, origin: obj.origin};
  }

  // Apply a change to a document, and add it to the document's
  // history, and propagating it to all linked documents.
  function makeChange(doc, change, ignoreReadOnly) {
    if (doc.cm) {
      if (!doc.cm.curOp) return operation(doc.cm, makeChange)(doc, change, ignoreReadOnly);
      if (doc.cm.state.suppressEdits) return;
    }

    if (hasHandler(doc, "beforeChange") || doc.cm && hasHandler(doc.cm, "beforeChange")) {
      change = filterChange(doc, change, true);
      if (!change) return;
    }

    // Possibly split or suppress the update based on the presence
    // of read-only spans in its range.
    var split = sawReadOnlySpans && !ignoreReadOnly && removeReadOnlyRanges(doc, change.from, change.to);
    if (split) {
      for (var i = split.length - 1; i >= 0; --i)
        makeChangeInner(doc, {from: split[i].from, to: split[i].to, text: i ? [""] : change.text});
    } else {
      makeChangeInner(doc, change);
    }
  }

  function makeChangeInner(doc, change) {
    if (change.text.length == 1 && change.text[0] == "" && cmp(change.from, change.to) == 0) return;
    var selAfter = computeSelAfterChange(doc, change);
    addChangeToHistory(doc, change, selAfter, doc.cm ? doc.cm.curOp.id : NaN);

    makeChangeSingleDoc(doc, change, selAfter, stretchSpansOverChange(doc, change));
    var rebased = [];

    linkedDocs(doc, function(doc, sharedHist) {
      if (!sharedHist && indexOf(rebased, doc.history) == -1) {
        rebaseHist(doc.history, change);
        rebased.push(doc.history);
      }
      makeChangeSingleDoc(doc, change, null, stretchSpansOverChange(doc, change));
    });
  }

  // Revert a change stored in a document's history.
  function makeChangeFromHistory(doc, type, allowSelectionOnly) {
    if (doc.cm && doc.cm.state.suppressEdits) return;

    var hist = doc.history, event, selAfter = doc.sel;
    var source = type == "undo" ? hist.done : hist.undone, dest = type == "undo" ? hist.undone : hist.done;

    // Verify that there is a useable event (so that ctrl-z won't
    // needlessly clear selection events)
    for (var i = 0; i < source.length; i++) {
      event = source[i];
      if (allowSelectionOnly ? event.ranges && !event.equals(doc.sel) : !event.ranges)
        break;
    }
    if (i == source.length) return;
    hist.lastOrigin = hist.lastSelOrigin = null;

    for (;;) {
      event = source.pop();
      if (event.ranges) {
        pushSelectionToHistory(event, dest);
        if (allowSelectionOnly && !event.equals(doc.sel)) {
          setSelection(doc, event, {clearRedo: false});
          return;
        }
        selAfter = event;
      }
      else break;
    }

    // Build up a reverse change object to add to the opposite history
    // stack (redo when undoing, and vice versa).
    var antiChanges = [];
    pushSelectionToHistory(selAfter, dest);
    dest.push({changes: antiChanges, generation: hist.generation});
    hist.generation = event.generation || ++hist.maxGeneration;

    var filter = hasHandler(doc, "beforeChange") || doc.cm && hasHandler(doc.cm, "beforeChange");

    for (var i = event.changes.length - 1; i >= 0; --i) {
      var change = event.changes[i];
      change.origin = type;
      if (filter && !filterChange(doc, change, false)) {
        source.length = 0;
        return;
      }

      antiChanges.push(historyChangeFromChange(doc, change));

      var after = i ? computeSelAfterChange(doc, change) : lst(source);
      makeChangeSingleDoc(doc, change, after, mergeOldSpans(doc, change));
      if (!i && doc.cm) doc.cm.scrollIntoView({from: change.from, to: changeEnd(change)});
      var rebased = [];

      // Propagate to the linked documents
      linkedDocs(doc, function(doc, sharedHist) {
        if (!sharedHist && indexOf(rebased, doc.history) == -1) {
          rebaseHist(doc.history, change);
          rebased.push(doc.history);
        }
        makeChangeSingleDoc(doc, change, null, mergeOldSpans(doc, change));
      });
    }
  }

  // Sub-views need their line numbers shifted when text is added
  // above or below them in the parent document.
  function shiftDoc(doc, distance) {
    if (distance == 0) return;
    doc.first += distance;
    doc.sel = new Selection(map(doc.sel.ranges, function(range) {
      return new Range(Pos(range.anchor.line + distance, range.anchor.ch),
                       Pos(range.head.line + distance, range.head.ch));
    }), doc.sel.primIndex);
    if (doc.cm) {
      regChange(doc.cm, doc.first, doc.first - distance, distance);
      for (var d = doc.cm.display, l = d.viewFrom; l < d.viewTo; l++)
        regLineChange(doc.cm, l, "gutter");
    }
  }

  // More lower-level change function, handling only a single document
  // (not linked ones).
  function makeChangeSingleDoc(doc, change, selAfter, spans) {
    if (doc.cm && !doc.cm.curOp)
      return operation(doc.cm, makeChangeSingleDoc)(doc, change, selAfter, spans);

    if (change.to.line < doc.first) {
      shiftDoc(doc, change.text.length - 1 - (change.to.line - change.from.line));
      return;
    }
    if (change.from.line > doc.lastLine()) return;

    // Clip the change to the size of this doc
    if (change.from.line < doc.first) {
      var shift = change.text.length - 1 - (doc.first - change.from.line);
      shiftDoc(doc, shift);
      change = {from: Pos(doc.first, 0), to: Pos(change.to.line + shift, change.to.ch),
                text: [lst(change.text)], origin: change.origin};
    }
    var last = doc.lastLine();
    if (change.to.line > last) {
      change = {from: change.from, to: Pos(last, getLine(doc, last).text.length),
                text: [change.text[0]], origin: change.origin};
    }

    change.removed = getBetween(doc, change.from, change.to);

    if (!selAfter) selAfter = computeSelAfterChange(doc, change);
    if (doc.cm) makeChangeSingleDocInEditor(doc.cm, change, spans);
    else updateDoc(doc, change, spans);
    setSelectionNoUndo(doc, selAfter, sel_dontScroll);
  }

  // Handle the interaction of a change to a document with the editor
  // that this document is part of.
  function makeChangeSingleDocInEditor(cm, change, spans) {
    var doc = cm.doc, display = cm.display, from = change.from, to = change.to;

    var recomputeMaxLength = false, checkWidthStart = from.line;
    if (!cm.options.lineWrapping) {
      checkWidthStart = lineNo(visualLine(getLine(doc, from.line)));
      doc.iter(checkWidthStart, to.line + 1, function(line) {
        if (line == display.maxLine) {
          recomputeMaxLength = true;
          return true;
        }
      });
    }

    if (doc.sel.contains(change.from, change.to) > -1)
      signalCursorActivity(cm);

    updateDoc(doc, change, spans, estimateHeight(cm));

    if (!cm.options.lineWrapping) {
      doc.iter(checkWidthStart, from.line + change.text.length, function(line) {
        var len = lineLength(line);
        if (len > display.maxLineLength) {
          display.maxLine = line;
          display.maxLineLength = len;
          display.maxLineChanged = true;
          recomputeMaxLength = false;
        }
      });
      if (recomputeMaxLength) cm.curOp.updateMaxLine = true;
    }

    // Adjust frontier, schedule worker
    doc.frontier = Math.min(doc.frontier, from.line);
    startWorker(cm, 400);

    var lendiff = change.text.length - (to.line - from.line) - 1;
    // Remember that these lines changed, for updating the display
    if (change.full)
      regChange(cm);
    else if (from.line == to.line && change.text.length == 1 && !isWholeLineUpdate(cm.doc, change))
      regLineChange(cm, from.line, "text");
    else
      regChange(cm, from.line, to.line + 1, lendiff);

    var changesHandler = hasHandler(cm, "changes"), changeHandler = hasHandler(cm, "change");
    if (changeHandler || changesHandler) {
      var obj = {
        from: from, to: to,
        text: change.text,
        removed: change.removed,
        origin: change.origin
      };
      if (changeHandler) signalLater(cm, "change", cm, obj);
      if (changesHandler) (cm.curOp.changeObjs || (cm.curOp.changeObjs = [])).push(obj);
    }
    cm.display.selForContextMenu = null;
  }

  function replaceRange(doc, code, from, to, origin) {
    if (!to) to = from;
    if (cmp(to, from) < 0) { var tmp = to; to = from; from = tmp; }
    if (typeof code == "string") code = doc.splitLines(code);
    makeChange(doc, {from: from, to: to, text: code, origin: origin});
  }

  // SCROLLING THINGS INTO VIEW

  // If an editor sits on the top or bottom of the window, partially
  // scrolled out of view, this ensures that the cursor is visible.
  function maybeScrollWindow(cm, coords) {
    if (signalDOMEvent(cm, "scrollCursorIntoView")) return;

    var display = cm.display, box = display.sizer.getBoundingClientRect(), doScroll = null;
    if (coords.top + box.top < 0) doScroll = true;
    else if (coords.bottom + box.top > (window.innerHeight || document.documentElement.clientHeight)) doScroll = false;
    if (doScroll != null && !phantom) {
      var scrollNode = elt("div", "\u200b", null, "position: absolute; top: " +
                           (coords.top - display.viewOffset - paddingTop(cm.display)) + "px; height: " +
                           (coords.bottom - coords.top + scrollGap(cm) + display.barHeight) + "px; left: " +
                           coords.left + "px; width: 2px;");
      cm.display.lineSpace.appendChild(scrollNode);
      scrollNode.scrollIntoView(doScroll);
      cm.display.lineSpace.removeChild(scrollNode);
    }
  }

  // Scroll a given position into view (immediately), verifying that
  // it actually became visible (as line heights are accurately
  // measured, the position of something may 'drift' during drawing).
  function scrollPosIntoView(cm, pos, end, margin) {
    if (margin == null) margin = 0;
    for (var limit = 0; limit < 5; limit++) {
      var changed = false, coords = cursorCoords(cm, pos);
      var endCoords = !end || end == pos ? coords : cursorCoords(cm, end);
      var scrollPos = calculateScrollPos(cm, Math.min(coords.left, endCoords.left),
                                         Math.min(coords.top, endCoords.top) - margin,
                                         Math.max(coords.left, endCoords.left),
                                         Math.max(coords.bottom, endCoords.bottom) + margin);
      var startTop = cm.doc.scrollTop, startLeft = cm.doc.scrollLeft;
      if (scrollPos.scrollTop != null) {
        setScrollTop(cm, scrollPos.scrollTop);
        if (Math.abs(cm.doc.scrollTop - startTop) > 1) changed = true;
      }
      if (scrollPos.scrollLeft != null) {
        setScrollLeft(cm, scrollPos.scrollLeft);
        if (Math.abs(cm.doc.scrollLeft - startLeft) > 1) changed = true;
      }
      if (!changed) break;
    }
    return coords;
  }

  // Scroll a given set of coordinates into view (immediately).
  function scrollIntoView(cm, x1, y1, x2, y2) {
    var scrollPos = calculateScrollPos(cm, x1, y1, x2, y2);
    if (scrollPos.scrollTop != null) setScrollTop(cm, scrollPos.scrollTop);
    if (scrollPos.scrollLeft != null) setScrollLeft(cm, scrollPos.scrollLeft);
  }

  // Calculate a new scroll position needed to scroll the given
  // rectangle into view. Returns an object with scrollTop and
  // scrollLeft properties. When these are undefined, the
  // vertical/horizontal position does not need to be adjusted.
  function calculateScrollPos(cm, x1, y1, x2, y2) {
    var display = cm.display, snapMargin = textHeight(cm.display);
    if (y1 < 0) y1 = 0;
    var screentop = cm.curOp && cm.curOp.scrollTop != null ? cm.curOp.scrollTop : display.scroller.scrollTop;
    var screen = displayHeight(cm), result = {};
    if (y2 - y1 > screen) y2 = y1 + screen;
    var docBottom = cm.doc.height + paddingVert(display);
    var atTop = y1 < snapMargin, atBottom = y2 > docBottom - snapMargin;
    if (y1 < screentop) {
      result.scrollTop = atTop ? 0 : y1;
    } else if (y2 > screentop + screen) {
      var newTop = Math.min(y1, (atBottom ? docBottom : y2) - screen);
      if (newTop != screentop) result.scrollTop = newTop;
    }

    var screenleft = cm.curOp && cm.curOp.scrollLeft != null ? cm.curOp.scrollLeft : display.scroller.scrollLeft;
    var screenw = displayWidth(cm) - (cm.options.fixedGutter ? display.gutters.offsetWidth : 0);
    var tooWide = x2 - x1 > screenw;
    if (tooWide) x2 = x1 + screenw;
    if (x1 < 10)
      result.scrollLeft = 0;
    else if (x1 < screenleft)
      result.scrollLeft = Math.max(0, x1 - (tooWide ? 0 : 10));
    else if (x2 > screenw + screenleft - 3)
      result.scrollLeft = x2 + (tooWide ? 0 : 10) - screenw;
    return result;
  }

  // Store a relative adjustment to the scroll position in the current
  // operation (to be applied when the operation finishes).
  function addToScrollPos(cm, left, top) {
    if (left != null || top != null) resolveScrollToPos(cm);
    if (left != null)
      cm.curOp.scrollLeft = (cm.curOp.scrollLeft == null ? cm.doc.scrollLeft : cm.curOp.scrollLeft) + left;
    if (top != null)
      cm.curOp.scrollTop = (cm.curOp.scrollTop == null ? cm.doc.scrollTop : cm.curOp.scrollTop) + top;
  }

  // Make sure that at the end of the operation the current cursor is
  // shown.
  function ensureCursorVisible(cm) {
    resolveScrollToPos(cm);
    var cur = cm.getCursor(), from = cur, to = cur;
    if (!cm.options.lineWrapping) {
      from = cur.ch ? Pos(cur.line, cur.ch - 1) : cur;
      to = Pos(cur.line, cur.ch + 1);
    }
    cm.curOp.scrollToPos = {from: from, to: to, margin: cm.options.cursorScrollMargin, isCursor: true};
  }

  // When an operation has its scrollToPos property set, and another
  // scroll action is applied before the end of the operation, this
  // 'simulates' scrolling that position into view in a cheap way, so
  // that the effect of intermediate scroll commands is not ignored.
  function resolveScrollToPos(cm) {
    var range = cm.curOp.scrollToPos;
    if (range) {
      cm.curOp.scrollToPos = null;
      var from = estimateCoords(cm, range.from), to = estimateCoords(cm, range.to);
      var sPos = calculateScrollPos(cm, Math.min(from.left, to.left),
                                    Math.min(from.top, to.top) - range.margin,
                                    Math.max(from.right, to.right),
                                    Math.max(from.bottom, to.bottom) + range.margin);
      cm.scrollTo(sPos.scrollLeft, sPos.scrollTop);
    }
  }

  // API UTILITIES

  // Indent the given line. The how parameter can be "smart",
  // "add"/null, "subtract", or "prev". When aggressive is false
  // (typically set to true for forced single-line indents), empty
  // lines are not indented, and places where the mode returns Pass
  // are left alone.
  function indentLine(cm, n, how, aggressive) {
    var doc = cm.doc, state;
    if (how == null) how = "add";
    if (how == "smart") {
      // Fall back to "prev" when the mode doesn't have an indentation
      // method.
      if (!doc.mode.indent) how = "prev";
      else state = getStateBefore(cm, n);
    }

    var tabSize = cm.options.tabSize;
    var line = getLine(doc, n), curSpace = countColumn(line.text, null, tabSize);
    if (line.stateAfter) line.stateAfter = null;
    var curSpaceString = line.text.match(/^\s*/)[0], indentation;
    if (!aggressive && !/\S/.test(line.text)) {
      indentation = 0;
      how = "not";
    } else if (how == "smart") {
      indentation = doc.mode.indent(state, line.text.slice(curSpaceString.length), line.text);
      if (indentation == Pass || indentation > 150) {
        if (!aggressive) return;
        how = "prev";
      }
    }
    if (how == "prev") {
      if (n > doc.first) indentation = countColumn(getLine(doc, n-1).text, null, tabSize);
      else indentation = 0;
    } else if (how == "add") {
      indentation = curSpace + cm.options.indentUnit;
    } else if (how == "subtract") {
      indentation = curSpace - cm.options.indentUnit;
    } else if (typeof how == "number") {
      indentation = curSpace + how;
    }
    indentation = Math.max(0, indentation);

    var indentString = "", pos = 0;
    if (cm.options.indentWithTabs)
      for (var i = Math.floor(indentation / tabSize); i; --i) {pos += tabSize; indentString += "\t";}
    if (pos < indentation) indentString += spaceStr(indentation - pos);

    if (indentString != curSpaceString) {
      replaceRange(doc, indentString, Pos(n, 0), Pos(n, curSpaceString.length), "+input");
      line.stateAfter = null;
      return true;
    } else {
      // Ensure that, if the cursor was in the whitespace at the start
      // of the line, it is moved to the end of that space.
      for (var i = 0; i < doc.sel.ranges.length; i++) {
        var range = doc.sel.ranges[i];
        if (range.head.line == n && range.head.ch < curSpaceString.length) {
          var pos = Pos(n, curSpaceString.length);
          replaceOneSelection(doc, i, new Range(pos, pos));
          break;
        }
      }
    }
  }

  // Utility for applying a change to a line by handle or number,
  // returning the number and optionally registering the line as
  // changed.
  function changeLine(doc, handle, changeType, op) {
    var no = handle, line = handle;
    if (typeof handle == "number") line = getLine(doc, clipLine(doc, handle));
    else no = lineNo(handle);
    if (no == null) return null;
    if (op(line, no) && doc.cm) regLineChange(doc.cm, no, changeType);
    return line;
  }

  // Helper for deleting text near the selection(s), used to implement
  // backspace, delete, and similar functionality.
  function deleteNearSelection(cm, compute) {
    var ranges = cm.doc.sel.ranges, kill = [];
    // Build up a set of ranges to kill first, merging overlapping
    // ranges.
    for (var i = 0; i < ranges.length; i++) {
      var toKill = compute(ranges[i]);
      while (kill.length && cmp(toKill.from, lst(kill).to) <= 0) {
        var replaced = kill.pop();
        if (cmp(replaced.from, toKill.from) < 0) {
          toKill.from = replaced.from;
          break;
        }
      }
      kill.push(toKill);
    }
    // Next, remove those actual ranges.
    runInOp(cm, function() {
      for (var i = kill.length - 1; i >= 0; i--)
        replaceRange(cm.doc, "", kill[i].from, kill[i].to, "+delete");
      ensureCursorVisible(cm);
    });
  }

  // Used for horizontal relative motion. Dir is -1 or 1 (left or
  // right), unit can be "char", "column" (like char, but doesn't
  // cross line boundaries), "word" (across next word), or "group" (to
  // the start of next group of word or non-word-non-whitespace
  // chars). The visually param controls whether, in right-to-left
  // text, direction 1 means to move towards the next index in the
  // string, or towards the character to the right of the current
  // position. The resulting position will have a hitSide=true
  // property if it reached the end of the document.
  function findPosH(doc, pos, dir, unit, visually) {
    var line = pos.line, ch = pos.ch, origDir = dir;
    var lineObj = getLine(doc, line);
    var possible = true;
    function findNextLine() {
      var l = line + dir;
      if (l < doc.first || l >= doc.first + doc.size) return (possible = false);
      line = l;
      return lineObj = getLine(doc, l);
    }
    function moveOnce(boundToLine) {
      var next = (visually ? moveVisually : moveLogically)(lineObj, ch, dir, true);
      if (next == null) {
        if (!boundToLine && findNextLine()) {
          if (visually) ch = (dir < 0 ? lineRight : lineLeft)(lineObj);
          else ch = dir < 0 ? lineObj.text.length : 0;
        } else return (possible = false);
      } else ch = next;
      return true;
    }

    if (unit == "char") moveOnce();
    else if (unit == "column") moveOnce(true);
    else if (unit == "word" || unit == "group") {
      var sawType = null, group = unit == "group";
      var helper = doc.cm && doc.cm.getHelper(pos, "wordChars");
      for (var first = true;; first = false) {
        if (dir < 0 && !moveOnce(!first)) break;
        var cur = lineObj.text.charAt(ch) || "\n";
        var type = isWordChar(cur, helper) ? "w"
          : group && cur == "\n" ? "n"
          : !group || /\s/.test(cur) ? null
          : "p";
        if (group && !first && !type) type = "s";
        if (sawType && sawType != type) {
          if (dir < 0) {dir = 1; moveOnce();}
          break;
        }

        if (type) sawType = type;
        if (dir > 0 && !moveOnce(!first)) break;
      }
    }
    var result = skipAtomic(doc, Pos(line, ch), origDir, true);
    if (!possible) result.hitSide = true;
    return result;
  }

  // For relative vertical movement. Dir may be -1 or 1. Unit can be
  // "page" or "line". The resulting position will have a hitSide=true
  // property if it reached the end of the document.
  function findPosV(cm, pos, dir, unit) {
    var doc = cm.doc, x = pos.left, y;
    if (unit == "page") {
      var pageSize = Math.min(cm.display.wrapper.clientHeight, window.innerHeight || document.documentElement.clientHeight);
      y = pos.top + dir * (pageSize - (dir < 0 ? 1.5 : .5) * textHeight(cm.display));
    } else if (unit == "line") {
      y = dir > 0 ? pos.bottom + 3 : pos.top - 3;
    }
    for (;;) {
      var target = coordsChar(cm, x, y);
      if (!target.outside) break;
      if (dir < 0 ? y <= 0 : y >= doc.height) { target.hitSide = true; break; }
      y += dir * 5;
    }
    return target;
  }

  // EDITOR METHODS

  // The publicly visible API. Note that methodOp(f) means
  // 'wrap f in an operation, performed on its `this` parameter'.

  // This is not the complete set of editor methods. Most of the
  // methods defined on the Doc type are also injected into
  // CodeMirror.prototype, for backwards compatibility and
  // convenience.

  CodeMirror.prototype = {
    constructor: CodeMirror,
    focus: function(){window.focus(); this.display.input.focus();},

    setOption: function(option, value) {
      var options = this.options, old = options[option];
      if (options[option] == value && option != "mode") return;
      options[option] = value;
      if (optionHandlers.hasOwnProperty(option))
        operation(this, optionHandlers[option])(this, value, old);
    },

    getOption: function(option) {return this.options[option];},
    getDoc: function() {return this.doc;},

    addKeyMap: function(map, bottom) {
      this.state.keyMaps[bottom ? "push" : "unshift"](getKeyMap(map));
    },
    removeKeyMap: function(map) {
      var maps = this.state.keyMaps;
      for (var i = 0; i < maps.length; ++i)
        if (maps[i] == map || maps[i].name == map) {
          maps.splice(i, 1);
          return true;
        }
    },

    addOverlay: methodOp(function(spec, options) {
      var mode = spec.token ? spec : CodeMirror.getMode(this.options, spec);
      if (mode.startState) throw new Error("Overlays may not be stateful.");
      this.state.overlays.push({mode: mode, modeSpec: spec, opaque: options && options.opaque});
      this.state.modeGen++;
      regChange(this);
    }),
    removeOverlay: methodOp(function(spec) {
      var overlays = this.state.overlays;
      for (var i = 0; i < overlays.length; ++i) {
        var cur = overlays[i].modeSpec;
        if (cur == spec || typeof spec == "string" && cur.name == spec) {
          overlays.splice(i, 1);
          this.state.modeGen++;
          regChange(this);
          return;
        }
      }
    }),

    indentLine: methodOp(function(n, dir, aggressive) {
      if (typeof dir != "string" && typeof dir != "number") {
        if (dir == null) dir = this.options.smartIndent ? "smart" : "prev";
        else dir = dir ? "add" : "subtract";
      }
      if (isLine(this.doc, n)) indentLine(this, n, dir, aggressive);
    }),
    indentSelection: methodOp(function(how) {
      var ranges = this.doc.sel.ranges, end = -1;
      for (var i = 0; i < ranges.length; i++) {
        var range = ranges[i];
        if (!range.empty()) {
          var from = range.from(), to = range.to();
          var start = Math.max(end, from.line);
          end = Math.min(this.lastLine(), to.line - (to.ch ? 0 : 1)) + 1;
          for (var j = start; j < end; ++j)
            indentLine(this, j, how);
          var newRanges = this.doc.sel.ranges;
          if (from.ch == 0 && ranges.length == newRanges.length && newRanges[i].from().ch > 0)
            replaceOneSelection(this.doc, i, new Range(from, newRanges[i].to()), sel_dontScroll);
        } else if (range.head.line > end) {
          indentLine(this, range.head.line, how, true);
          end = range.head.line;
          if (i == this.doc.sel.primIndex) ensureCursorVisible(this);
        }
      }
    }),

    // Fetch the parser token for a given character. Useful for hacks
    // that want to inspect the mode state (say, for completion).
    getTokenAt: function(pos, precise) {
      return takeToken(this, pos, precise);
    },

    getLineTokens: function(line, precise) {
      return takeToken(this, Pos(line), precise, true);
    },

    getTokenTypeAt: function(pos) {
      pos = clipPos(this.doc, pos);
      var styles = getLineStyles(this, getLine(this.doc, pos.line));
      var before = 0, after = (styles.length - 1) / 2, ch = pos.ch;
      var type;
      if (ch == 0) type = styles[2];
      else for (;;) {
        var mid = (before + after) >> 1;
        if ((mid ? styles[mid * 2 - 1] : 0) >= ch) after = mid;
        else if (styles[mid * 2 + 1] < ch) before = mid + 1;
        else { type = styles[mid * 2 + 2]; break; }
      }
      var cut = type ? type.indexOf("cm-overlay ") : -1;
      return cut < 0 ? type : cut == 0 ? null : type.slice(0, cut - 1);
    },

    getModeAt: function(pos) {
      var mode = this.doc.mode;
      if (!mode.innerMode) return mode;
      return CodeMirror.innerMode(mode, this.getTokenAt(pos).state).mode;
    },

    getHelper: function(pos, type) {
      return this.getHelpers(pos, type)[0];
    },

    getHelpers: function(pos, type) {
      var found = [];
      if (!helpers.hasOwnProperty(type)) return found;
      var help = helpers[type], mode = this.getModeAt(pos);
      if (typeof mode[type] == "string") {
        if (help[mode[type]]) found.push(help[mode[type]]);
      } else if (mode[type]) {
        for (var i = 0; i < mode[type].length; i++) {
          var val = help[mode[type][i]];
          if (val) found.push(val);
        }
      } else if (mode.helperType && help[mode.helperType]) {
        found.push(help[mode.helperType]);
      } else if (help[mode.name]) {
        found.push(help[mode.name]);
      }
      for (var i = 0; i < help._global.length; i++) {
        var cur = help._global[i];
        if (cur.pred(mode, this) && indexOf(found, cur.val) == -1)
          found.push(cur.val);
      }
      return found;
    },

    getStateAfter: function(line, precise) {
      var doc = this.doc;
      line = clipLine(doc, line == null ? doc.first + doc.size - 1: line);
      return getStateBefore(this, line + 1, precise);
    },

    cursorCoords: function(start, mode) {
      var pos, range = this.doc.sel.primary();
      if (start == null) pos = range.head;
      else if (typeof start == "object") pos = clipPos(this.doc, start);
      else pos = start ? range.from() : range.to();
      return cursorCoords(this, pos, mode || "page");
    },

    charCoords: function(pos, mode) {
      return charCoords(this, clipPos(this.doc, pos), mode || "page");
    },

    coordsChar: function(coords, mode) {
      coords = fromCoordSystem(this, coords, mode || "page");
      return coordsChar(this, coords.left, coords.top);
    },

    lineAtHeight: function(height, mode) {
      height = fromCoordSystem(this, {top: height, left: 0}, mode || "page").top;
      return lineAtHeight(this.doc, height + this.display.viewOffset);
    },
    heightAtLine: function(line, mode) {
      var end = false, lineObj;
      if (typeof line == "number") {
        var last = this.doc.first + this.doc.size - 1;
        if (line < this.doc.first) line = this.doc.first;
        else if (line > last) { line = last; end = true; }
        lineObj = getLine(this.doc, line);
      } else {
        lineObj = line;
      }
      return intoCoordSystem(this, lineObj, {top: 0, left: 0}, mode || "page").top +
        (end ? this.doc.height - heightAtLine(lineObj) : 0);
    },

    defaultTextHeight: function() { return textHeight(this.display); },
    defaultCharWidth: function() { return charWidth(this.display); },

    setGutterMarker: methodOp(function(line, gutterID, value) {
      return changeLine(this.doc, line, "gutter", function(line) {
        var markers = line.gutterMarkers || (line.gutterMarkers = {});
        markers[gutterID] = value;
        if (!value && isEmpty(markers)) line.gutterMarkers = null;
        return true;
      });
    }),

    clearGutter: methodOp(function(gutterID) {
      var cm = this, doc = cm.doc, i = doc.first;
      doc.iter(function(line) {
        if (line.gutterMarkers && line.gutterMarkers[gutterID]) {
          line.gutterMarkers[gutterID] = null;
          regLineChange(cm, i, "gutter");
          if (isEmpty(line.gutterMarkers)) line.gutterMarkers = null;
        }
        ++i;
      });
    }),

    lineInfo: function(line) {
      if (typeof line == "number") {
        if (!isLine(this.doc, line)) return null;
        var n = line;
        line = getLine(this.doc, line);
        if (!line) return null;
      } else {
        var n = lineNo(line);
        if (n == null) return null;
      }
      return {line: n, handle: line, text: line.text, gutterMarkers: line.gutterMarkers,
              textClass: line.textClass, bgClass: line.bgClass, wrapClass: line.wrapClass,
              widgets: line.widgets};
    },

    getViewport: function() { return {from: this.display.viewFrom, to: this.display.viewTo};},

    addWidget: function(pos, node, scroll, vert, horiz) {
      var display = this.display;
      pos = cursorCoords(this, clipPos(this.doc, pos));
      var top = pos.bottom, left = pos.left;
      node.style.position = "absolute";
      node.setAttribute("cm-ignore-events", "true");
      this.display.input.setUneditable(node);
      display.sizer.appendChild(node);
      if (vert == "over") {
        top = pos.top;
      } else if (vert == "above" || vert == "near") {
        var vspace = Math.max(display.wrapper.clientHeight, this.doc.height),
        hspace = Math.max(display.sizer.clientWidth, display.lineSpace.clientWidth);
        // Default to positioning above (if specified and possible); otherwise default to positioning below
        if ((vert == 'above' || pos.bottom + node.offsetHeight > vspace) && pos.top > node.offsetHeight)
          top = pos.top - node.offsetHeight;
        else if (pos.bottom + node.offsetHeight <= vspace)
          top = pos.bottom;
        if (left + node.offsetWidth > hspace)
          left = hspace - node.offsetWidth;
      }
      node.style.top = top + "px";
      node.style.left = node.style.right = "";
      if (horiz == "right") {
        left = display.sizer.clientWidth - node.offsetWidth;
        node.style.right = "0px";
      } else {
        if (horiz == "left") left = 0;
        else if (horiz == "middle") left = (display.sizer.clientWidth - node.offsetWidth) / 2;
        node.style.left = left + "px";
      }
      if (scroll)
        scrollIntoView(this, left, top, left + node.offsetWidth, top + node.offsetHeight);
    },

    triggerOnKeyDown: methodOp(onKeyDown),
    triggerOnKeyPress: methodOp(onKeyPress),
    triggerOnKeyUp: onKeyUp,

    execCommand: function(cmd) {
      if (commands.hasOwnProperty(cmd))
        return commands[cmd].call(null, this);
    },

    triggerElectric: methodOp(function(text) { triggerElectric(this, text); }),

    findPosH: function(from, amount, unit, visually) {
      var dir = 1;
      if (amount < 0) { dir = -1; amount = -amount; }
      for (var i = 0, cur = clipPos(this.doc, from); i < amount; ++i) {
        cur = findPosH(this.doc, cur, dir, unit, visually);
        if (cur.hitSide) break;
      }
      return cur;
    },

    moveH: methodOp(function(dir, unit) {
      var cm = this;
      cm.extendSelectionsBy(function(range) {
        if (cm.display.shift || cm.doc.extend || range.empty())
          return findPosH(cm.doc, range.head, dir, unit, cm.options.rtlMoveVisually);
        else
          return dir < 0 ? range.from() : range.to();
      }, sel_move);
    }),

    deleteH: methodOp(function(dir, unit) {
      var sel = this.doc.sel, doc = this.doc;
      if (sel.somethingSelected())
        doc.replaceSelection("", null, "+delete");
      else
        deleteNearSelection(this, function(range) {
          var other = findPosH(doc, range.head, dir, unit, false);
          return dir < 0 ? {from: other, to: range.head} : {from: range.head, to: other};
        });
    }),

    findPosV: function(from, amount, unit, goalColumn) {
      var dir = 1, x = goalColumn;
      if (amount < 0) { dir = -1; amount = -amount; }
      for (var i = 0, cur = clipPos(this.doc, from); i < amount; ++i) {
        var coords = cursorCoords(this, cur, "div");
        if (x == null) x = coords.left;
        else coords.left = x;
        cur = findPosV(this, coords, dir, unit);
        if (cur.hitSide) break;
      }
      return cur;
    },

    moveV: methodOp(function(dir, unit) {
      var cm = this, doc = this.doc, goals = [];
      var collapse = !cm.display.shift && !doc.extend && doc.sel.somethingSelected();
      doc.extendSelectionsBy(function(range) {
        if (collapse)
          return dir < 0 ? range.from() : range.to();
        var headPos = cursorCoords(cm, range.head, "div");
        if (range.goalColumn != null) headPos.left = range.goalColumn;
        goals.push(headPos.left);
        var pos = findPosV(cm, headPos, dir, unit);
        if (unit == "page" && range == doc.sel.primary())
          addToScrollPos(cm, null, charCoords(cm, pos, "div").top - headPos.top);
        return pos;
      }, sel_move);
      if (goals.length) for (var i = 0; i < doc.sel.ranges.length; i++)
        doc.sel.ranges[i].goalColumn = goals[i];
    }),

    // Find the word at the given position (as returned by coordsChar).
    findWordAt: function(pos) {
      var doc = this.doc, line = getLine(doc, pos.line).text;
      var start = pos.ch, end = pos.ch;
      if (line) {
        var helper = this.getHelper(pos, "wordChars");
        if ((pos.xRel < 0 || end == line.length) && start) --start; else ++end;
        var startChar = line.charAt(start);
        var check = isWordChar(startChar, helper)
          ? function(ch) { return isWordChar(ch, helper); }
          : /\s/.test(startChar) ? function(ch) {return /\s/.test(ch);}
          : function(ch) {return !/\s/.test(ch) && !isWordChar(ch);};
        while (start > 0 && check(line.charAt(start - 1))) --start;
        while (end < line.length && check(line.charAt(end))) ++end;
      }
      return new Range(Pos(pos.line, start), Pos(pos.line, end));
    },

    toggleOverwrite: function(value) {
      if (value != null && value == this.state.overwrite) return;
      if (this.state.overwrite = !this.state.overwrite)
        addClass(this.display.cursorDiv, "CodeMirror-overwrite");
      else
        rmClass(this.display.cursorDiv, "CodeMirror-overwrite");

      signal(this, "overwriteToggle", this, this.state.overwrite);
    },
    hasFocus: function() { return this.display.input.getField() == activeElt(); },

    scrollTo: methodOp(function(x, y) {
      if (x != null || y != null) resolveScrollToPos(this);
      if (x != null) this.curOp.scrollLeft = x;
      if (y != null) this.curOp.scrollTop = y;
    }),
    getScrollInfo: function() {
      var scroller = this.display.scroller;
      return {left: scroller.scrollLeft, top: scroller.scrollTop,
              height: scroller.scrollHeight - scrollGap(this) - this.display.barHeight,
              width: scroller.scrollWidth - scrollGap(this) - this.display.barWidth,
              clientHeight: displayHeight(this), clientWidth: displayWidth(this)};
    },

    scrollIntoView: methodOp(function(range, margin) {
      if (range == null) {
        range = {from: this.doc.sel.primary().head, to: null};
        if (margin == null) margin = this.options.cursorScrollMargin;
      } else if (typeof range == "number") {
        range = {from: Pos(range, 0), to: null};
      } else if (range.from == null) {
        range = {from: range, to: null};
      }
      if (!range.to) range.to = range.from;
      range.margin = margin || 0;

      if (range.from.line != null) {
        resolveScrollToPos(this);
        this.curOp.scrollToPos = range;
      } else {
        var sPos = calculateScrollPos(this, Math.min(range.from.left, range.to.left),
                                      Math.min(range.from.top, range.to.top) - range.margin,
                                      Math.max(range.from.right, range.to.right),
                                      Math.max(range.from.bottom, range.to.bottom) + range.margin);
        this.scrollTo(sPos.scrollLeft, sPos.scrollTop);
      }
    }),

    setSize: methodOp(function(width, height) {
      var cm = this;
      function interpret(val) {
        return typeof val == "number" || /^\d+$/.test(String(val)) ? val + "px" : val;
      }
      if (width != null) cm.display.wrapper.style.width = interpret(width);
      if (height != null) cm.display.wrapper.style.height = interpret(height);
      if (cm.options.lineWrapping) clearLineMeasurementCache(this);
      var lineNo = cm.display.viewFrom;
      cm.doc.iter(lineNo, cm.display.viewTo, function(line) {
        if (line.widgets) for (var i = 0; i < line.widgets.length; i++)
          if (line.widgets[i].noHScroll) { regLineChange(cm, lineNo, "widget"); break; }
        ++lineNo;
      });
      cm.curOp.forceUpdate = true;
      signal(cm, "refresh", this);
    }),

    operation: function(f){return runInOp(this, f);},

    refresh: methodOp(function() {
      var oldHeight = this.display.cachedTextHeight;
      regChange(this);
      this.curOp.forceUpdate = true;
      clearCaches(this);
      this.scrollTo(this.doc.scrollLeft, this.doc.scrollTop);
      updateGutterSpace(this);
      if (oldHeight == null || Math.abs(oldHeight - textHeight(this.display)) > .5)
        estimateLineHeights(this);
      signal(this, "refresh", this);
    }),

    swapDoc: methodOp(function(doc) {
      var old = this.doc;
      old.cm = null;
      attachDoc(this, doc);
      clearCaches(this);
      this.display.input.reset();
      this.scrollTo(doc.scrollLeft, doc.scrollTop);
      this.curOp.forceScroll = true;
      signalLater(this, "swapDoc", this, old);
      return old;
    }),

    getInputField: function(){return this.display.input.getField();},
    getWrapperElement: function(){return this.display.wrapper;},
    getScrollerElement: function(){return this.display.scroller;},
    getGutterElement: function(){return this.display.gutters;}
  };
  eventMixin(CodeMirror);

  // OPTION DEFAULTS

  // The default configuration options.
  var defaults = CodeMirror.defaults = {};
  // Functions to run when options are changed.
  var optionHandlers = CodeMirror.optionHandlers = {};

  function option(name, deflt, handle, notOnInit) {
    CodeMirror.defaults[name] = deflt;
    if (handle) optionHandlers[name] =
      notOnInit ? function(cm, val, old) {if (old != Init) handle(cm, val, old);} : handle;
  }

  // Passed to option handlers when there is no old value.
  var Init = CodeMirror.Init = {toString: function(){return "CodeMirror.Init";}};

  // These two are, on init, called from the constructor because they
  // have to be initialized before the editor can start at all.
  option("value", "", function(cm, val) {
    cm.setValue(val);
  }, true);
  option("mode", null, function(cm, val) {
    cm.doc.modeOption = val;
    loadMode(cm);
  }, true);

  option("indentUnit", 2, loadMode, true);
  option("indentWithTabs", false);
  option("smartIndent", true);
  option("tabSize", 4, function(cm) {
    resetModeState(cm);
    clearCaches(cm);
    regChange(cm);
  }, true);
  option("lineSeparator", null, function(cm, val) {
    cm.doc.lineSep = val;
    if (!val) return;
    var newBreaks = [], lineNo = cm.doc.first;
    cm.doc.iter(function(line) {
      for (var pos = 0;;) {
        var found = line.text.indexOf(val, pos);
        if (found == -1) break;
        pos = found + val.length;
        newBreaks.push(Pos(lineNo, found));
      }
      lineNo++;
    });
    for (var i = newBreaks.length - 1; i >= 0; i--)
      replaceRange(cm.doc, val, newBreaks[i], Pos(newBreaks[i].line, newBreaks[i].ch + val.length))
  });
  option("specialChars", /[\t\u0000-\u0019\u00ad\u200b-\u200f\u2028\u2029\ufeff]/g, function(cm, val, old) {
    cm.state.specialChars = new RegExp(val.source + (val.test("\t") ? "" : "|\t"), "g");
    if (old != CodeMirror.Init) cm.refresh();
  });
  option("specialCharPlaceholder", defaultSpecialCharPlaceholder, function(cm) {cm.refresh();}, true);
  option("electricChars", true);
  option("inputStyle", mobile ? "contenteditable" : "textarea", function() {
    throw new Error("inputStyle can not (yet) be changed in a running editor"); // FIXME
  }, true);
  option("rtlMoveVisually", !windows);
  option("wholeLineUpdateBefore", true);

  option("theme", "default", function(cm) {
    themeChanged(cm);
    guttersChanged(cm);
  }, true);
  option("keyMap", "default", function(cm, val, old) {
    var next = getKeyMap(val);
    var prev = old != CodeMirror.Init && getKeyMap(old);
    if (prev && prev.detach) prev.detach(cm, next);
    if (next.attach) next.attach(cm, prev || null);
  });
  option("extraKeys", null);

  option("lineWrapping", false, wrappingChanged, true);
  option("gutters", [], function(cm) {
    setGuttersForLineNumbers(cm.options);
    guttersChanged(cm);
  }, true);
  option("fixedGutter", true, function(cm, val) {
    cm.display.gutters.style.left = val ? compensateForHScroll(cm.display) + "px" : "0";
    cm.refresh();
  }, true);
  option("coverGutterNextToScrollbar", false, function(cm) {updateScrollbars(cm);}, true);
  option("scrollbarStyle", "native", function(cm) {
    initScrollbars(cm);
    updateScrollbars(cm);
    cm.display.scrollbars.setScrollTop(cm.doc.scrollTop);
    cm.display.scrollbars.setScrollLeft(cm.doc.scrollLeft);
  }, true);
  option("lineNumbers", false, function(cm) {
    setGuttersForLineNumbers(cm.options);
    guttersChanged(cm);
  }, true);
  option("firstLineNumber", 1, guttersChanged, true);
  option("lineNumberFormatter", function(integer) {return integer;}, guttersChanged, true);
  option("showCursorWhenSelecting", false, updateSelection, true);

  option("resetSelectionOnContextMenu", true);
  option("lineWiseCopyCut", true);

  option("readOnly", false, function(cm, val) {
    if (val == "nocursor") {
      onBlur(cm);
      cm.display.input.blur();
      cm.display.disabled = true;
    } else {
      cm.display.disabled = false;
    }
    cm.display.input.readOnlyChanged(val)
  });
  option("disableInput", false, function(cm, val) {if (!val) cm.display.input.reset();}, true);
  option("dragDrop", true, dragDropChanged);
  option("allowDropFileTypes", null);

  option("cursorBlinkRate", 530);
  option("cursorScrollMargin", 0);
  option("cursorHeight", 1, updateSelection, true);
  option("singleCursorHeightPerLine", true, updateSelection, true);
  option("workTime", 100);
  option("workDelay", 100);
  option("flattenSpans", true, resetModeState, true);
  option("addModeClass", false, resetModeState, true);
  option("pollInterval", 100);
  option("undoDepth", 200, function(cm, val){cm.doc.history.undoDepth = val;});
  option("historyEventDelay", 1250);
  option("viewportMargin", 10, function(cm){cm.refresh();}, true);
  option("maxHighlightLength", 10000, resetModeState, true);
  option("moveInputWithCursor", true, function(cm, val) {
    if (!val) cm.display.input.resetPosition();
  });

  option("tabindex", null, function(cm, val) {
    cm.display.input.getField().tabIndex = val || "";
  });
  option("autofocus", null);

  // MODE DEFINITION AND QUERYING

  // Known modes, by name and by MIME
  var modes = CodeMirror.modes = {}, mimeModes = CodeMirror.mimeModes = {};

  // Extra arguments are stored as the mode's dependencies, which is
  // used by (legacy) mechanisms like loadmode.js to automatically
  // load a mode. (Preferred mechanism is the require/define calls.)
  CodeMirror.defineMode = function(name, mode) {
    if (!CodeMirror.defaults.mode && name != "null") CodeMirror.defaults.mode = name;
    if (arguments.length > 2)
      mode.dependencies = Array.prototype.slice.call(arguments, 2);
    modes[name] = mode;
  };

  CodeMirror.defineMIME = function(mime, spec) {
    mimeModes[mime] = spec;
  };

  // Given a MIME type, a {name, ...options} config object, or a name
  // string, return a mode config object.
  CodeMirror.resolveMode = function(spec) {
    if (typeof spec == "string" && mimeModes.hasOwnProperty(spec)) {
      spec = mimeModes[spec];
    } else if (spec && typeof spec.name == "string" && mimeModes.hasOwnProperty(spec.name)) {
      var found = mimeModes[spec.name];
      if (typeof found == "string") found = {name: found};
      spec = createObj(found, spec);
      spec.name = found.name;
    } else if (typeof spec == "string" && /^[\w\-]+\/[\w\-]+\+xml$/.test(spec)) {
      return CodeMirror.resolveMode("application/xml");
    }
    if (typeof spec == "string") return {name: spec};
    else return spec || {name: "null"};
  };

  // Given a mode spec (anything that resolveMode accepts), find and
  // initialize an actual mode object.
  CodeMirror.getMode = function(options, spec) {
    var spec = CodeMirror.resolveMode(spec);
    var mfactory = modes[spec.name];
    if (!mfactory) return CodeMirror.getMode(options, "text/plain");
    var modeObj = mfactory(options, spec);
    if (modeExtensions.hasOwnProperty(spec.name)) {
      var exts = modeExtensions[spec.name];
      for (var prop in exts) {
        if (!exts.hasOwnProperty(prop)) continue;
        if (modeObj.hasOwnProperty(prop)) modeObj["_" + prop] = modeObj[prop];
        modeObj[prop] = exts[prop];
      }
    }
    modeObj.name = spec.name;
    if (spec.helperType) modeObj.helperType = spec.helperType;
    if (spec.modeProps) for (var prop in spec.modeProps)
      modeObj[prop] = spec.modeProps[prop];

    return modeObj;
  };

  // Minimal default mode.
  CodeMirror.defineMode("null", function() {
    return {token: function(stream) {stream.skipToEnd();}};
  });
  CodeMirror.defineMIME("text/plain", "null");

  // This can be used to attach properties to mode objects from
  // outside the actual mode definition.
  var modeExtensions = CodeMirror.modeExtensions = {};
  CodeMirror.extendMode = function(mode, properties) {
    var exts = modeExtensions.hasOwnProperty(mode) ? modeExtensions[mode] : (modeExtensions[mode] = {});
    copyObj(properties, exts);
  };

  // EXTENSIONS

  CodeMirror.defineExtension = function(name, func) {
    CodeMirror.prototype[name] = func;
  };
  CodeMirror.defineDocExtension = function(name, func) {
    Doc.prototype[name] = func;
  };
  CodeMirror.defineOption = option;

  var initHooks = [];
  CodeMirror.defineInitHook = function(f) {initHooks.push(f);};

  var helpers = CodeMirror.helpers = {};
  CodeMirror.registerHelper = function(type, name, value) {
    if (!helpers.hasOwnProperty(type)) helpers[type] = CodeMirror[type] = {_global: []};
    helpers[type][name] = value;
  };
  CodeMirror.registerGlobalHelper = function(type, name, predicate, value) {
    CodeMirror.registerHelper(type, name, value);
    helpers[type]._global.push({pred: predicate, val: value});
  };

  // MODE STATE HANDLING

  // Utility functions for working with state. Exported because nested
  // modes need to do this for their inner modes.

  var copyState = CodeMirror.copyState = function(mode, state) {
    if (state === true) return state;
    if (mode.copyState) return mode.copyState(state);
    var nstate = {};
    for (var n in state) {
      var val = state[n];
      if (val instanceof Array) val = val.concat([]);
      nstate[n] = val;
    }
    return nstate;
  };

  var startState = CodeMirror.startState = function(mode, a1, a2) {
    return mode.startState ? mode.startState(a1, a2) : true;
  };

  // Given a mode and a state (for that mode), find the inner mode and
  // state at the position that the state refers to.
  CodeMirror.innerMode = function(mode, state) {
    while (mode.innerMode) {
      var info = mode.innerMode(state);
      if (!info || info.mode == mode) break;
      state = info.state;
      mode = info.mode;
    }
    return info || {mode: mode, state: state};
  };

  // STANDARD COMMANDS

  // Commands are parameter-less actions that can be performed on an
  // editor, mostly used for keybindings.
  var commands = CodeMirror.commands = {
    selectAll: function(cm) {cm.setSelection(Pos(cm.firstLine(), 0), Pos(cm.lastLine()), sel_dontScroll);},
    singleSelection: function(cm) {
      cm.setSelection(cm.getCursor("anchor"), cm.getCursor("head"), sel_dontScroll);
    },
    killLine: function(cm) {
      deleteNearSelection(cm, function(range) {
        if (range.empty()) {
          var len = getLine(cm.doc, range.head.line).text.length;
          if (range.head.ch == len && range.head.line < cm.lastLine())
            return {from: range.head, to: Pos(range.head.line + 1, 0)};
          else
            return {from: range.head, to: Pos(range.head.line, len)};
        } else {
          return {from: range.from(), to: range.to()};
        }
      });
    },
    deleteLine: function(cm) {
      deleteNearSelection(cm, function(range) {
        return {from: Pos(range.from().line, 0),
                to: clipPos(cm.doc, Pos(range.to().line + 1, 0))};
      });
    },
    delLineLeft: function(cm) {
      deleteNearSelection(cm, function(range) {
        return {from: Pos(range.from().line, 0), to: range.from()};
      });
    },
    delWrappedLineLeft: function(cm) {
      deleteNearSelection(cm, function(range) {
        var top = cm.charCoords(range.head, "div").top + 5;
        var leftPos = cm.coordsChar({left: 0, top: top}, "div");
        return {from: leftPos, to: range.from()};
      });
    },
    delWrappedLineRight: function(cm) {
      deleteNearSelection(cm, function(range) {
        var top = cm.charCoords(range.head, "div").top + 5;
        var rightPos = cm.coordsChar({left: cm.display.lineDiv.offsetWidth + 100, top: top}, "div");
        return {from: range.from(), to: rightPos };
      });
    },
    undo: function(cm) {cm.undo();},
    redo: function(cm) {cm.redo();},
    undoSelection: function(cm) {cm.undoSelection();},
    redoSelection: function(cm) {cm.redoSelection();},
    goDocStart: function(cm) {cm.extendSelection(Pos(cm.firstLine(), 0));},
    goDocEnd: function(cm) {cm.extendSelection(Pos(cm.lastLine()));},
    goLineStart: function(cm) {
      cm.extendSelectionsBy(function(range) { return lineStart(cm, range.head.line); },
                            {origin: "+move", bias: 1});
    },
    goLineStartSmart: function(cm) {
      cm.extendSelectionsBy(function(range) {
        return lineStartSmart(cm, range.head);
      }, {origin: "+move", bias: 1});
    },
    goLineEnd: function(cm) {
      cm.extendSelectionsBy(function(range) { return lineEnd(cm, range.head.line); },
                            {origin: "+move", bias: -1});
    },
    goLineRight: function(cm) {
      cm.extendSelectionsBy(function(range) {
        var top = cm.charCoords(range.head, "div").top + 5;
        return cm.coordsChar({left: cm.display.lineDiv.offsetWidth + 100, top: top}, "div");
      }, sel_move);
    },
    goLineLeft: function(cm) {
      cm.extendSelectionsBy(function(range) {
        var top = cm.charCoords(range.head, "div").top + 5;
        return cm.coordsChar({left: 0, top: top}, "div");
      }, sel_move);
    },
    goLineLeftSmart: function(cm) {
      cm.extendSelectionsBy(function(range) {
        var top = cm.charCoords(range.head, "div").top + 5;
        var pos = cm.coordsChar({left: 0, top: top}, "div");
        if (pos.ch < cm.getLine(pos.line).search(/\S/)) return lineStartSmart(cm, range.head);
        return pos;
      }, sel_move);
    },
    goLineUp: function(cm) {cm.moveV(-1, "line");},
    goLineDown: function(cm) {cm.moveV(1, "line");},
    goPageUp: function(cm) {cm.moveV(-1, "page");},
    goPageDown: function(cm) {cm.moveV(1, "page");},
    goCharLeft: function(cm) {cm.moveH(-1, "char");},
    goCharRight: function(cm) {cm.moveH(1, "char");},
    goColumnLeft: function(cm) {cm.moveH(-1, "column");},
    goColumnRight: function(cm) {cm.moveH(1, "column");},
    goWordLeft: function(cm) {cm.moveH(-1, "word");},
    goGroupRight: function(cm) {cm.moveH(1, "group");},
    goGroupLeft: function(cm) {cm.moveH(-1, "group");},
    goWordRight: function(cm) {cm.moveH(1, "word");},
    delCharBefore: function(cm) {cm.deleteH(-1, "char");},
    delCharAfter: function(cm) {cm.deleteH(1, "char");},
    delWordBefore: function(cm) {cm.deleteH(-1, "word");},
    delWordAfter: function(cm) {cm.deleteH(1, "word");},
    delGroupBefore: function(cm) {cm.deleteH(-1, "group");},
    delGroupAfter: function(cm) {cm.deleteH(1, "group");},
    indentAuto: function(cm) {cm.indentSelection("smart");},
    indentMore: function(cm) {cm.indentSelection("add");},
    indentLess: function(cm) {cm.indentSelection("subtract");},
    insertTab: function(cm) {cm.replaceSelection("\t");},
    insertSoftTab: function(cm) {
      var spaces = [], ranges = cm.listSelections(), tabSize = cm.options.tabSize;
      for (var i = 0; i < ranges.length; i++) {
        var pos = ranges[i].from();
        var col = countColumn(cm.getLine(pos.line), pos.ch, tabSize);
        spaces.push(new Array(tabSize - col % tabSize + 1).join(" "));
      }
      cm.replaceSelections(spaces);
    },
    defaultTab: function(cm) {
      if (cm.somethingSelected()) cm.indentSelection("add");
      else cm.execCommand("insertTab");
    },
    transposeChars: function(cm) {
      runInOp(cm, function() {
        var ranges = cm.listSelections(), newSel = [];
        for (var i = 0; i < ranges.length; i++) {
          var cur = ranges[i].head, line = getLine(cm.doc, cur.line).text;
          if (line) {
            if (cur.ch == line.length) cur = new Pos(cur.line, cur.ch - 1);
            if (cur.ch > 0) {
              cur = new Pos(cur.line, cur.ch + 1);
              cm.replaceRange(line.charAt(cur.ch - 1) + line.charAt(cur.ch - 2),
                              Pos(cur.line, cur.ch - 2), cur, "+transpose");
            } else if (cur.line > cm.doc.first) {
              var prev = getLine(cm.doc, cur.line - 1).text;
              if (prev)
                cm.replaceRange(line.charAt(0) + cm.doc.lineSeparator() +
                                prev.charAt(prev.length - 1),
                                Pos(cur.line - 1, prev.length - 1), Pos(cur.line, 1), "+transpose");
            }
          }
          newSel.push(new Range(cur, cur));
        }
        cm.setSelections(newSel);
      });
    },
    newlineAndIndent: function(cm) {
      runInOp(cm, function() {
        var len = cm.listSelections().length;
        for (var i = 0; i < len; i++) {
          var range = cm.listSelections()[i];
          cm.replaceRange(cm.doc.lineSeparator(), range.anchor, range.head, "+input");
          cm.indentLine(range.from().line + 1, null, true);
        }
        ensureCursorVisible(cm);
      });
    },
    toggleOverwrite: function(cm) {cm.toggleOverwrite();}
  };


  // STANDARD KEYMAPS

  var keyMap = CodeMirror.keyMap = {};

  keyMap.basic = {
    "Left": "goCharLeft", "Right": "goCharRight", "Up": "goLineUp", "Down": "goLineDown",
    "End": "goLineEnd", "Home": "goLineStartSmart", "PageUp": "goPageUp", "PageDown": "goPageDown",
    "Delete": "delCharAfter", "Backspace": "delCharBefore", "Shift-Backspace": "delCharBefore",
    "Tab": "defaultTab", "Shift-Tab": "indentAuto",
    "Enter": "newlineAndIndent", "Insert": "toggleOverwrite",
    "Esc": "singleSelection"
  };
  // Note that the save and find-related commands aren't defined by
  // default. User code or addons can define them. Unknown commands
  // are simply ignored.
  keyMap.pcDefault = {
    "Ctrl-A": "selectAll", "Ctrl-D": "deleteLine", "Ctrl-Z": "undo", "Shift-Ctrl-Z": "redo", "Ctrl-Y": "redo",
    "Ctrl-Home": "goDocStart", "Ctrl-End": "goDocEnd", "Ctrl-Up": "goLineUp", "Ctrl-Down": "goLineDown",
    "Ctrl-Left": "goGroupLeft", "Ctrl-Right": "goGroupRight", "Alt-Left": "goLineStart", "Alt-Right": "goLineEnd",
    "Ctrl-Backspace": "delGroupBefore", "Ctrl-Delete": "delGroupAfter", "Ctrl-S": "save", "Ctrl-F": "find",
    "Ctrl-G": "findNext", "Shift-Ctrl-G": "findPrev", "Shift-Ctrl-F": "replace", "Shift-Ctrl-R": "replaceAll",
    "Ctrl-[": "indentLess", "Ctrl-]": "indentMore",
    "Ctrl-U": "undoSelection", "Shift-Ctrl-U": "redoSelection", "Alt-U": "redoSelection",
    fallthrough: "basic"
  };
  // Very basic readline/emacs-style bindings, which are standard on Mac.
  keyMap.emacsy = {
    "Ctrl-F": "goCharRight", "Ctrl-B": "goCharLeft", "Ctrl-P": "goLineUp", "Ctrl-N": "goLineDown",
    "Alt-F": "goWordRight", "Alt-B": "goWordLeft", "Ctrl-A": "goLineStart", "Ctrl-E": "goLineEnd",
    "Ctrl-V": "goPageDown", "Shift-Ctrl-V": "goPageUp", "Ctrl-D": "delCharAfter", "Ctrl-H": "delCharBefore",
    "Alt-D": "delWordAfter", "Alt-Backspace": "delWordBefore", "Ctrl-K": "killLine", "Ctrl-T": "transposeChars"
  };
  keyMap.macDefault = {
    "Cmd-A": "selectAll", "Cmd-D": "deleteLine", "Cmd-Z": "undo", "Shift-Cmd-Z": "redo", "Cmd-Y": "redo",
    "Cmd-Home": "goDocStart", "Cmd-Up": "goDocStart", "Cmd-End": "goDocEnd", "Cmd-Down": "goDocEnd", "Alt-Left": "goGroupLeft",
    "Alt-Right": "goGroupRight", "Cmd-Left": "goLineLeft", "Cmd-Right": "goLineRight", "Alt-Backspace": "delGroupBefore",
    "Ctrl-Alt-Backspace": "delGroupAfter", "Alt-Delete": "delGroupAfter", "Cmd-S": "save", "Cmd-F": "find",
    "Cmd-G": "findNext", "Shift-Cmd-G": "findPrev", "Cmd-Alt-F": "replace", "Shift-Cmd-Alt-F": "replaceAll",
    "Cmd-[": "indentLess", "Cmd-]": "indentMore", "Cmd-Backspace": "delWrappedLineLeft", "Cmd-Delete": "delWrappedLineRight",
    "Cmd-U": "undoSelection", "Shift-Cmd-U": "redoSelection", "Ctrl-Up": "goDocStart", "Ctrl-Down": "goDocEnd",
    fallthrough: ["basic", "emacsy"]
  };
  keyMap["default"] = mac ? keyMap.macDefault : keyMap.pcDefault;

  // KEYMAP DISPATCH

  function normalizeKeyName(name) {
    var parts = name.split(/-(?!$)/), name = parts[parts.length - 1];
    var alt, ctrl, shift, cmd;
    for (var i = 0; i < parts.length - 1; i++) {
      var mod = parts[i];
      if (/^(cmd|meta|m)$/i.test(mod)) cmd = true;
      else if (/^a(lt)?$/i.test(mod)) alt = true;
      else if (/^(c|ctrl|control)$/i.test(mod)) ctrl = true;
      else if (/^s(hift)$/i.test(mod)) shift = true;
      else throw new Error("Unrecognized modifier name: " + mod);
    }
    if (alt) name = "Alt-" + name;
    if (ctrl) name = "Ctrl-" + name;
    if (cmd) name = "Cmd-" + name;
    if (shift) name = "Shift-" + name;
    return name;
  }

  // This is a kludge to keep keymaps mostly working as raw objects
  // (backwards compatibility) while at the same time support features
  // like normalization and multi-stroke key bindings. It compiles a
  // new normalized keymap, and then updates the old object to reflect
  // this.
  CodeMirror.normalizeKeyMap = function(keymap) {
    var copy = {};
    for (var keyname in keymap) if (keymap.hasOwnProperty(keyname)) {
      var value = keymap[keyname];
      if (/^(name|fallthrough|(de|at)tach)$/.test(keyname)) continue;
      if (value == "...") { delete keymap[keyname]; continue; }

      var keys = map(keyname.split(" "), normalizeKeyName);
      for (var i = 0; i < keys.length; i++) {
        var val, name;
        if (i == keys.length - 1) {
          name = keys.join(" ");
          val = value;
        } else {
          name = keys.slice(0, i + 1).join(" ");
          val = "...";
        }
        var prev = copy[name];
        if (!prev) copy[name] = val;
        else if (prev != val) throw new Error("Inconsistent bindings for " + name);
      }
      delete keymap[keyname];
    }
    for (var prop in copy) keymap[prop] = copy[prop];
    return keymap;
  };

  var lookupKey = CodeMirror.lookupKey = function(key, map, handle, context) {
    map = getKeyMap(map);
    var found = map.call ? map.call(key, context) : map[key];
    if (found === false) return "nothing";
    if (found === "...") return "multi";
    if (found != null && handle(found)) return "handled";

    if (map.fallthrough) {
      if (Object.prototype.toString.call(map.fallthrough) != "[object Array]")
        return lookupKey(key, map.fallthrough, handle, context);
      for (var i = 0; i < map.fallthrough.length; i++) {
        var result = lookupKey(key, map.fallthrough[i], handle, context);
        if (result) return result;
      }
    }
  };

  // Modifier key presses don't count as 'real' key presses for the
  // purpose of keymap fallthrough.
  var isModifierKey = CodeMirror.isModifierKey = function(value) {
    var name = typeof value == "string" ? value : keyNames[value.keyCode];
    return name == "Ctrl" || name == "Alt" || name == "Shift" || name == "Mod";
  };

  // Look up the name of a key as indicated by an event object.
  var keyName = CodeMirror.keyName = function(event, noShift) {
    if (presto && event.keyCode == 34 && event["char"]) return false;
    var base = keyNames[event.keyCode], name = base;
    if (name == null || event.altGraphKey) return false;
    if (event.altKey && base != "Alt") name = "Alt-" + name;
    if ((flipCtrlCmd ? event.metaKey : event.ctrlKey) && base != "Ctrl") name = "Ctrl-" + name;
    if ((flipCtrlCmd ? event.ctrlKey : event.metaKey) && base != "Cmd") name = "Cmd-" + name;
    if (!noShift && event.shiftKey && base != "Shift") name = "Shift-" + name;
    return name;
  };

  function getKeyMap(val) {
    return typeof val == "string" ? keyMap[val] : val;
  }

  // FROMTEXTAREA

  CodeMirror.fromTextArea = function(textarea, options) {
    options = options ? copyObj(options) : {};
    options.value = textarea.value;
    if (!options.tabindex && textarea.tabIndex)
      options.tabindex = textarea.tabIndex;
    if (!options.placeholder && textarea.placeholder)
      options.placeholder = textarea.placeholder;
    // Set autofocus to true if this textarea is focused, or if it has
    // autofocus and no other element is focused.
    if (options.autofocus == null) {
      var hasFocus = activeElt();
      options.autofocus = hasFocus == textarea ||
        textarea.getAttribute("autofocus") != null && hasFocus == document.body;
    }

    function save() {textarea.value = cm.getValue();}
    if (textarea.form) {
      on(textarea.form, "submit", save);
      // Deplorable hack to make the submit method do the right thing.
      if (!options.leaveSubmitMethodAlone) {
        var form = textarea.form, realSubmit = form.submit;
        try {
          var wrappedSubmit = form.submit = function() {
            save();
            form.submit = realSubmit;
            form.submit();
            form.submit = wrappedSubmit;
          };
        } catch(e) {}
      }
    }

    options.finishInit = function(cm) {
      cm.save = save;
      cm.getTextArea = function() { return textarea; };
      cm.toTextArea = function() {
        cm.toTextArea = isNaN; // Prevent this from being ran twice
        save();
        textarea.parentNode.removeChild(cm.getWrapperElement());
        textarea.style.display = "";
        if (textarea.form) {
          off(textarea.form, "submit", save);
          if (typeof textarea.form.submit == "function")
            textarea.form.submit = realSubmit;
        }
      };
    };

    textarea.style.display = "none";
    var cm = CodeMirror(function(node) {
      textarea.parentNode.insertBefore(node, textarea.nextSibling);
    }, options);
    return cm;
  };

  // STRING STREAM

  // Fed to the mode parsers, provides helper functions to make
  // parsers more succinct.

  var StringStream = CodeMirror.StringStream = function(string, tabSize) {
    this.pos = this.start = 0;
    this.string = string;
    this.tabSize = tabSize || 8;
    this.lastColumnPos = this.lastColumnValue = 0;
    this.lineStart = 0;
  };

  StringStream.prototype = {
    eol: function() {return this.pos >= this.string.length;},
    sol: function() {return this.pos == this.lineStart;},
    peek: function() {return this.string.charAt(this.pos) || undefined;},
    next: function() {
      if (this.pos < this.string.length)
        return this.string.charAt(this.pos++);
    },
    eat: function(match) {
      var ch = this.string.charAt(this.pos);
      if (typeof match == "string") var ok = ch == match;
      else var ok = ch && (match.test ? match.test(ch) : match(ch));
      if (ok) {++this.pos; return ch;}
    },
    eatWhile: function(match) {
      var start = this.pos;
      while (this.eat(match)){}
      return this.pos > start;
    },
    eatSpace: function() {
      var start = this.pos;
      while (/[\s\u00a0]/.test(this.string.charAt(this.pos))) ++this.pos;
      return this.pos > start;
    },
    skipToEnd: function() {this.pos = this.string.length;},
    skipTo: function(ch) {
      var found = this.string.indexOf(ch, this.pos);
      if (found > -1) {this.pos = found; return true;}
    },
    backUp: function(n) {this.pos -= n;},
    column: function() {
      if (this.lastColumnPos < this.start) {
        this.lastColumnValue = countColumn(this.string, this.start, this.tabSize, this.lastColumnPos, this.lastColumnValue);
        this.lastColumnPos = this.start;
      }
      return this.lastColumnValue - (this.lineStart ? countColumn(this.string, this.lineStart, this.tabSize) : 0);
    },
    indentation: function() {
      return countColumn(this.string, null, this.tabSize) -
        (this.lineStart ? countColumn(this.string, this.lineStart, this.tabSize) : 0);
    },
    match: function(pattern, consume, caseInsensitive) {
      if (typeof pattern == "string") {
        var cased = function(str) {return caseInsensitive ? str.toLowerCase() : str;};
        var substr = this.string.substr(this.pos, pattern.length);
        if (cased(substr) == cased(pattern)) {
          if (consume !== false) this.pos += pattern.length;
          return true;
        }
      } else {
        var match = this.string.slice(this.pos).match(pattern);
        if (match && match.index > 0) return null;
        if (match && consume !== false) this.pos += match[0].length;
        return match;
      }
    },
    current: function(){return this.string.slice(this.start, this.pos);},
    hideFirstChars: function(n, inner) {
      this.lineStart += n;
      try { return inner(); }
      finally { this.lineStart -= n; }
    }
  };

  // TEXTMARKERS

  // Created with markText and setBookmark methods. A TextMarker is a
  // handle that can be used to clear or find a marked position in the
  // document. Line objects hold arrays (markedSpans) containing
  // {from, to, marker} object pointing to such marker objects, and
  // indicating that such a marker is present on that line. Multiple
  // lines may point to the same marker when it spans across lines.
  // The spans will have null for their from/to properties when the
  // marker continues beyond the start/end of the line. Markers have
  // links back to the lines they currently touch.

  var nextMarkerId = 0;

  var TextMarker = CodeMirror.TextMarker = function(doc, type) {
    this.lines = [];
    this.type = type;
    this.doc = doc;
    this.id = ++nextMarkerId;
  };
  eventMixin(TextMarker);

  // Clear the marker.
  TextMarker.prototype.clear = function() {
    if (this.explicitlyCleared) return;
    var cm = this.doc.cm, withOp = cm && !cm.curOp;
    if (withOp) startOperation(cm);
    if (hasHandler(this, "clear")) {
      var found = this.find();
      if (found) signalLater(this, "clear", found.from, found.to);
    }
    var min = null, max = null;
    for (var i = 0; i < this.lines.length; ++i) {
      var line = this.lines[i];
      var span = getMarkedSpanFor(line.markedSpans, this);
      if (cm && !this.collapsed) regLineChange(cm, lineNo(line), "text");
      else if (cm) {
        if (span.to != null) max = lineNo(line);
        if (span.from != null) min = lineNo(line);
      }
      line.markedSpans = removeMarkedSpan(line.markedSpans, span);
      if (span.from == null && this.collapsed && !lineIsHidden(this.doc, line) && cm)
        updateLineHeight(line, textHeight(cm.display));
    }
    if (cm && this.collapsed && !cm.options.lineWrapping) for (var i = 0; i < this.lines.length; ++i) {
      var visual = visualLine(this.lines[i]), len = lineLength(visual);
      if (len > cm.display.maxLineLength) {
        cm.display.maxLine = visual;
        cm.display.maxLineLength = len;
        cm.display.maxLineChanged = true;
      }
    }

    if (min != null && cm && this.collapsed) regChange(cm, min, max + 1);
    this.lines.length = 0;
    this.explicitlyCleared = true;
    if (this.atomic && this.doc.cantEdit) {
      this.doc.cantEdit = false;
      if (cm) reCheckSelection(cm.doc);
    }
    if (cm) signalLater(cm, "markerCleared", cm, this);
    if (withOp) endOperation(cm);
    if (this.parent) this.parent.clear();
  };

  // Find the position of the marker in the document. Returns a {from,
  // to} object by default. Side can be passed to get a specific side
  // -- 0 (both), -1 (left), or 1 (right). When lineObj is true, the
  // Pos objects returned contain a line object, rather than a line
  // number (used to prevent looking up the same line twice).
  TextMarker.prototype.find = function(side, lineObj) {
    if (side == null && this.type == "bookmark") side = 1;
    var from, to;
    for (var i = 0; i < this.lines.length; ++i) {
      var line = this.lines[i];
      var span = getMarkedSpanFor(line.markedSpans, this);
      if (span.from != null) {
        from = Pos(lineObj ? line : lineNo(line), span.from);
        if (side == -1) return from;
      }
      if (span.to != null) {
        to = Pos(lineObj ? line : lineNo(line), span.to);
        if (side == 1) return to;
      }
    }
    return from && {from: from, to: to};
  };

  // Signals that the marker's widget changed, and surrounding layout
  // should be recomputed.
  TextMarker.prototype.changed = function() {
    var pos = this.find(-1, true), widget = this, cm = this.doc.cm;
    if (!pos || !cm) return;
    runInOp(cm, function() {
      var line = pos.line, lineN = lineNo(pos.line);
      var view = findViewForLine(cm, lineN);
      if (view) {
        clearLineMeasurementCacheFor(view);
        cm.curOp.selectionChanged = cm.curOp.forceUpdate = true;
      }
      cm.curOp.updateMaxLine = true;
      if (!lineIsHidden(widget.doc, line) && widget.height != null) {
        var oldHeight = widget.height;
        widget.height = null;
        var dHeight = widgetHeight(widget) - oldHeight;
        if (dHeight)
          updateLineHeight(line, line.height + dHeight);
      }
    });
  };

  TextMarker.prototype.attachLine = function(line) {
    if (!this.lines.length && this.doc.cm) {
      var op = this.doc.cm.curOp;
      if (!op.maybeHiddenMarkers || indexOf(op.maybeHiddenMarkers, this) == -1)
        (op.maybeUnhiddenMarkers || (op.maybeUnhiddenMarkers = [])).push(this);
    }
    this.lines.push(line);
  };
  TextMarker.prototype.detachLine = function(line) {
    this.lines.splice(indexOf(this.lines, line), 1);
    if (!this.lines.length && this.doc.cm) {
      var op = this.doc.cm.curOp;
      (op.maybeHiddenMarkers || (op.maybeHiddenMarkers = [])).push(this);
    }
  };

  // Collapsed markers have unique ids, in order to be able to order
  // them, which is needed for uniquely determining an outer marker
  // when they overlap (they may nest, but not partially overlap).
  var nextMarkerId = 0;

  // Create a marker, wire it up to the right lines, and
  function markText(doc, from, to, options, type) {
    // Shared markers (across linked documents) are handled separately
    // (markTextShared will call out to this again, once per
    // document).
    if (options && options.shared) return markTextShared(doc, from, to, options, type);
    // Ensure we are in an operation.
    if (doc.cm && !doc.cm.curOp) return operation(doc.cm, markText)(doc, from, to, options, type);

    var marker = new TextMarker(doc, type), diff = cmp(from, to);
    if (options) copyObj(options, marker, false);
    // Don't connect empty markers unless clearWhenEmpty is false
    if (diff > 0 || diff == 0 && marker.clearWhenEmpty !== false)
      return marker;
    if (marker.replacedWith) {
      // Showing up as a widget implies collapsed (widget replaces text)
      marker.collapsed = true;
      marker.widgetNode = elt("span", [marker.replacedWith], "CodeMirror-widget");
      if (!options.handleMouseEvents) marker.widgetNode.setAttribute("cm-ignore-events", "true");
      if (options.insertLeft) marker.widgetNode.insertLeft = true;
    }
    if (marker.collapsed) {
      if (conflictingCollapsedRange(doc, from.line, from, to, marker) ||
          from.line != to.line && conflictingCollapsedRange(doc, to.line, from, to, marker))
        throw new Error("Inserting collapsed marker partially overlapping an existing one");
      sawCollapsedSpans = true;
    }

    if (marker.addToHistory)
      addChangeToHistory(doc, {from: from, to: to, origin: "markText"}, doc.sel, NaN);

    var curLine = from.line, cm = doc.cm, updateMaxLine;
    doc.iter(curLine, to.line + 1, function(line) {
      if (cm && marker.collapsed && !cm.options.lineWrapping && visualLine(line) == cm.display.maxLine)
        updateMaxLine = true;
      if (marker.collapsed && curLine != from.line) updateLineHeight(line, 0);
      addMarkedSpan(line, new MarkedSpan(marker,
                                         curLine == from.line ? from.ch : null,
                                         curLine == to.line ? to.ch : null));
      ++curLine;
    });
    // lineIsHidden depends on the presence of the spans, so needs a second pass
    if (marker.collapsed) doc.iter(from.line, to.line + 1, function(line) {
      if (lineIsHidden(doc, line)) updateLineHeight(line, 0);
    });

    if (marker.clearOnEnter) on(marker, "beforeCursorEnter", function() { marker.clear(); });

    if (marker.readOnly) {
      sawReadOnlySpans = true;
      if (doc.history.done.length || doc.history.undone.length)
        doc.clearHistory();
    }
    if (marker.collapsed) {
      marker.id = ++nextMarkerId;
      marker.atomic = true;
    }
    if (cm) {
      // Sync editor state
      if (updateMaxLine) cm.curOp.updateMaxLine = true;
      if (marker.collapsed)
        regChange(cm, from.line, to.line + 1);
      else if (marker.className || marker.title || marker.startStyle || marker.endStyle || marker.css)
        for (var i = from.line; i <= to.line; i++) regLineChange(cm, i, "text");
      if (marker.atomic) reCheckSelection(cm.doc);
      signalLater(cm, "markerAdded", cm, marker);
    }
    return marker;
  }

  // SHARED TEXTMARKERS

  // A shared marker spans multiple linked documents. It is
  // implemented as a meta-marker-object controlling multiple normal
  // markers.
  var SharedTextMarker = CodeMirror.SharedTextMarker = function(markers, primary) {
    this.markers = markers;
    this.primary = primary;
    for (var i = 0; i < markers.length; ++i)
      markers[i].parent = this;
  };
  eventMixin(SharedTextMarker);

  SharedTextMarker.prototype.clear = function() {
    if (this.explicitlyCleared) return;
    this.explicitlyCleared = true;
    for (var i = 0; i < this.markers.length; ++i)
      this.markers[i].clear();
    signalLater(this, "clear");
  };
  SharedTextMarker.prototype.find = function(side, lineObj) {
    return this.primary.find(side, lineObj);
  };

  function markTextShared(doc, from, to, options, type) {
    options = copyObj(options);
    options.shared = false;
    var markers = [markText(doc, from, to, options, type)], primary = markers[0];
    var widget = options.widgetNode;
    linkedDocs(doc, function(doc) {
      if (widget) options.widgetNode = widget.cloneNode(true);
      markers.push(markText(doc, clipPos(doc, from), clipPos(doc, to), options, type));
      for (var i = 0; i < doc.linked.length; ++i)
        if (doc.linked[i].isParent) return;
      primary = lst(markers);
    });
    return new SharedTextMarker(markers, primary);
  }

  function findSharedMarkers(doc) {
    return doc.findMarks(Pos(doc.first, 0), doc.clipPos(Pos(doc.lastLine())),
                         function(m) { return m.parent; });
  }

  function copySharedMarkers(doc, markers) {
    for (var i = 0; i < markers.length; i++) {
      var marker = markers[i], pos = marker.find();
      var mFrom = doc.clipPos(pos.from), mTo = doc.clipPos(pos.to);
      if (cmp(mFrom, mTo)) {
        var subMark = markText(doc, mFrom, mTo, marker.primary, marker.primary.type);
        marker.markers.push(subMark);
        subMark.parent = marker;
      }
    }
  }

  function detachSharedMarkers(markers) {
    for (var i = 0; i < markers.length; i++) {
      var marker = markers[i], linked = [marker.primary.doc];;
      linkedDocs(marker.primary.doc, function(d) { linked.push(d); });
      for (var j = 0; j < marker.markers.length; j++) {
        var subMarker = marker.markers[j];
        if (indexOf(linked, subMarker.doc) == -1) {
          subMarker.parent = null;
          marker.markers.splice(j--, 1);
        }
      }
    }
  }

  // TEXTMARKER SPANS

  function MarkedSpan(marker, from, to) {
    this.marker = marker;
    this.from = from; this.to = to;
  }

  // Search an array of spans for a span matching the given marker.
  function getMarkedSpanFor(spans, marker) {
    if (spans) for (var i = 0; i < spans.length; ++i) {
      var span = spans[i];
      if (span.marker == marker) return span;
    }
  }
  // Remove a span from an array, returning undefined if no spans are
  // left (we don't store arrays for lines without spans).
  function removeMarkedSpan(spans, span) {
    for (var r, i = 0; i < spans.length; ++i)
      if (spans[i] != span) (r || (r = [])).push(spans[i]);
    return r;
  }
  // Add a span to a line.
  function addMarkedSpan(line, span) {
    line.markedSpans = line.markedSpans ? line.markedSpans.concat([span]) : [span];
    span.marker.attachLine(line);
  }

  // Used for the algorithm that adjusts markers for a change in the
  // document. These functions cut an array of spans at a given
  // character position, returning an array of remaining chunks (or
  // undefined if nothing remains).
  function markedSpansBefore(old, startCh, isInsert) {
    if (old) for (var i = 0, nw; i < old.length; ++i) {
      var span = old[i], marker = span.marker;
      var startsBefore = span.from == null || (marker.inclusiveLeft ? span.from <= startCh : span.from < startCh);
      if (startsBefore || span.from == startCh && marker.type == "bookmark" && (!isInsert || !span.marker.insertLeft)) {
        var endsAfter = span.to == null || (marker.inclusiveRight ? span.to >= startCh : span.to > startCh);
        (nw || (nw = [])).push(new MarkedSpan(marker, span.from, endsAfter ? null : span.to));
      }
    }
    return nw;
  }
  function markedSpansAfter(old, endCh, isInsert) {
    if (old) for (var i = 0, nw; i < old.length; ++i) {
      var span = old[i], marker = span.marker;
      var endsAfter = span.to == null || (marker.inclusiveRight ? span.to >= endCh : span.to > endCh);
      if (endsAfter || span.from == endCh && marker.type == "bookmark" && (!isInsert || span.marker.insertLeft)) {
        var startsBefore = span.from == null || (marker.inclusiveLeft ? span.from <= endCh : span.from < endCh);
        (nw || (nw = [])).push(new MarkedSpan(marker, startsBefore ? null : span.from - endCh,
                                              span.to == null ? null : span.to - endCh));
      }
    }
    return nw;
  }

  // Given a change object, compute the new set of marker spans that
  // cover the line in which the change took place. Removes spans
  // entirely within the change, reconnects spans belonging to the
  // same marker that appear on both sides of the change, and cuts off
  // spans partially within the change. Returns an array of span
  // arrays with one element for each line in (after) the change.
  function stretchSpansOverChange(doc, change) {
    if (change.full) return null;
    var oldFirst = isLine(doc, change.from.line) && getLine(doc, change.from.line).markedSpans;
    var oldLast = isLine(doc, change.to.line) && getLine(doc, change.to.line).markedSpans;
    if (!oldFirst && !oldLast) return null;

    var startCh = change.from.ch, endCh = change.to.ch, isInsert = cmp(change.from, change.to) == 0;
    // Get the spans that 'stick out' on both sides
    var first = markedSpansBefore(oldFirst, startCh, isInsert);
    var last = markedSpansAfter(oldLast, endCh, isInsert);

    // Next, merge those two ends
    var sameLine = change.text.length == 1, offset = lst(change.text).length + (sameLine ? startCh : 0);
    if (first) {
      // Fix up .to properties of first
      for (var i = 0; i < first.length; ++i) {
        var span = first[i];
        if (span.to == null) {
          var found = getMarkedSpanFor(last, span.marker);
          if (!found) span.to = startCh;
          else if (sameLine) span.to = found.to == null ? null : found.to + offset;
        }
      }
    }
    if (last) {
      // Fix up .from in last (or move them into first in case of sameLine)
      for (var i = 0; i < last.length; ++i) {
        var span = last[i];
        if (span.to != null) span.to += offset;
        if (span.from == null) {
          var found = getMarkedSpanFor(first, span.marker);
          if (!found) {
            span.from = offset;
            if (sameLine) (first || (first = [])).push(span);
          }
        } else {
          span.from += offset;
          if (sameLine) (first || (first = [])).push(span);
        }
      }
    }
    // Make sure we didn't create any zero-length spans
    if (first) first = clearEmptySpans(first);
    if (last && last != first) last = clearEmptySpans(last);

    var newMarkers = [first];
    if (!sameLine) {
      // Fill gap with whole-line-spans
      var gap = change.text.length - 2, gapMarkers;
      if (gap > 0 && first)
        for (var i = 0; i < first.length; ++i)
          if (first[i].to == null)
            (gapMarkers || (gapMarkers = [])).push(new MarkedSpan(first[i].marker, null, null));
      for (var i = 0; i < gap; ++i)
        newMarkers.push(gapMarkers);
      newMarkers.push(last);
    }
    return newMarkers;
  }

  // Remove spans that are empty and don't have a clearWhenEmpty
  // option of false.
  function clearEmptySpans(spans) {
    for (var i = 0; i < spans.length; ++i) {
      var span = spans[i];
      if (span.from != null && span.from == span.to && span.marker.clearWhenEmpty !== false)
        spans.splice(i--, 1);
    }
    if (!spans.length) return null;
    return spans;
  }

  // Used for un/re-doing changes from the history. Combines the
  // result of computing the existing spans with the set of spans that
  // existed in the history (so that deleting around a span and then
  // undoing brings back the span).
  function mergeOldSpans(doc, change) {
    var old = getOldSpans(doc, change);
    var stretched = stretchSpansOverChange(doc, change);
    if (!old) return stretched;
    if (!stretched) return old;

    for (var i = 0; i < old.length; ++i) {
      var oldCur = old[i], stretchCur = stretched[i];
      if (oldCur && stretchCur) {
        spans: for (var j = 0; j < stretchCur.length; ++j) {
          var span = stretchCur[j];
          for (var k = 0; k < oldCur.length; ++k)
            if (oldCur[k].marker == span.marker) continue spans;
          oldCur.push(span);
        }
      } else if (stretchCur) {
        old[i] = stretchCur;
      }
    }
    return old;
  }

  // Used to 'clip' out readOnly ranges when making a change.
  function removeReadOnlyRanges(doc, from, to) {
    var markers = null;
    doc.iter(from.line, to.line + 1, function(line) {
      if (line.markedSpans) for (var i = 0; i < line.markedSpans.length; ++i) {
        var mark = line.markedSpans[i].marker;
        if (mark.readOnly && (!markers || indexOf(markers, mark) == -1))
          (markers || (markers = [])).push(mark);
      }
    });
    if (!markers) return null;
    var parts = [{from: from, to: to}];
    for (var i = 0; i < markers.length; ++i) {
      var mk = markers[i], m = mk.find(0);
      for (var j = 0; j < parts.length; ++j) {
        var p = parts[j];
        if (cmp(p.to, m.from) < 0 || cmp(p.from, m.to) > 0) continue;
        var newParts = [j, 1], dfrom = cmp(p.from, m.from), dto = cmp(p.to, m.to);
        if (dfrom < 0 || !mk.inclusiveLeft && !dfrom)
          newParts.push({from: p.from, to: m.from});
        if (dto > 0 || !mk.inclusiveRight && !dto)
          newParts.push({from: m.to, to: p.to});
        parts.splice.apply(parts, newParts);
        j += newParts.length - 1;
      }
    }
    return parts;
  }

  // Connect or disconnect spans from a line.
  function detachMarkedSpans(line) {
    var spans = line.markedSpans;
    if (!spans) return;
    for (var i = 0; i < spans.length; ++i)
      spans[i].marker.detachLine(line);
    line.markedSpans = null;
  }
  function attachMarkedSpans(line, spans) {
    if (!spans) return;
    for (var i = 0; i < spans.length; ++i)
      spans[i].marker.attachLine(line);
    line.markedSpans = spans;
  }

  // Helpers used when computing which overlapping collapsed span
  // counts as the larger one.
  function extraLeft(marker) { return marker.inclusiveLeft ? -1 : 0; }
  function extraRight(marker) { return marker.inclusiveRight ? 1 : 0; }

  // Returns a number indicating which of two overlapping collapsed
  // spans is larger (and thus includes the other). Falls back to
  // comparing ids when the spans cover exactly the same range.
  function compareCollapsedMarkers(a, b) {
    var lenDiff = a.lines.length - b.lines.length;
    if (lenDiff != 0) return lenDiff;
    var aPos = a.find(), bPos = b.find();
    var fromCmp = cmp(aPos.from, bPos.from) || extraLeft(a) - extraLeft(b);
    if (fromCmp) return -fromCmp;
    var toCmp = cmp(aPos.to, bPos.to) || extraRight(a) - extraRight(b);
    if (toCmp) return toCmp;
    return b.id - a.id;
  }

  // Find out whether a line ends or starts in a collapsed span. If
  // so, return the marker for that span.
  function collapsedSpanAtSide(line, start) {
    var sps = sawCollapsedSpans && line.markedSpans, found;
    if (sps) for (var sp, i = 0; i < sps.length; ++i) {
      sp = sps[i];
      if (sp.marker.collapsed && (start ? sp.from : sp.to) == null &&
          (!found || compareCollapsedMarkers(found, sp.marker) < 0))
        found = sp.marker;
    }
    return found;
  }
  function collapsedSpanAtStart(line) { return collapsedSpanAtSide(line, true); }
  function collapsedSpanAtEnd(line) { return collapsedSpanAtSide(line, false); }

  // Test whether there exists a collapsed span that partially
  // overlaps (covers the start or end, but not both) of a new span.
  // Such overlap is not allowed.
  function conflictingCollapsedRange(doc, lineNo, from, to, marker) {
    var line = getLine(doc, lineNo);
    var sps = sawCollapsedSpans && line.markedSpans;
    if (sps) for (var i = 0; i < sps.length; ++i) {
      var sp = sps[i];
      if (!sp.marker.collapsed) continue;
      var found = sp.marker.find(0);
      var fromCmp = cmp(found.from, from) || extraLeft(sp.marker) - extraLeft(marker);
      var toCmp = cmp(found.to, to) || extraRight(sp.marker) - extraRight(marker);
      if (fromCmp >= 0 && toCmp <= 0 || fromCmp <= 0 && toCmp >= 0) continue;
      if (fromCmp <= 0 && (cmp(found.to, from) > 0 || (sp.marker.inclusiveRight && marker.inclusiveLeft)) ||
          fromCmp >= 0 && (cmp(found.from, to) < 0 || (sp.marker.inclusiveLeft && marker.inclusiveRight)))
        return true;
    }
  }

  // A visual line is a line as drawn on the screen. Folding, for
  // example, can cause multiple logical lines to appear on the same
  // visual line. This finds the start of the visual line that the
  // given line is part of (usually that is the line itself).
  function visualLine(line) {
    var merged;
    while (merged = collapsedSpanAtStart(line))
      line = merged.find(-1, true).line;
    return line;
  }

  // Returns an array of logical lines that continue the visual line
  // started by the argument, or undefined if there are no such lines.
  function visualLineContinued(line) {
    var merged, lines;
    while (merged = collapsedSpanAtEnd(line)) {
      line = merged.find(1, true).line;
      (lines || (lines = [])).push(line);
    }
    return lines;
  }

  // Get the line number of the start of the visual line that the
  // given line number is part of.
  function visualLineNo(doc, lineN) {
    var line = getLine(doc, lineN), vis = visualLine(line);
    if (line == vis) return lineN;
    return lineNo(vis);
  }
  // Get the line number of the start of the next visual line after
  // the given line.
  function visualLineEndNo(doc, lineN) {
    if (lineN > doc.lastLine()) return lineN;
    var line = getLine(doc, lineN), merged;
    if (!lineIsHidden(doc, line)) return lineN;
    while (merged = collapsedSpanAtEnd(line))
      line = merged.find(1, true).line;
    return lineNo(line) + 1;
  }

  // Compute whether a line is hidden. Lines count as hidden when they
  // are part of a visual line that starts with another line, or when
  // they are entirely covered by collapsed, non-widget span.
  function lineIsHidden(doc, line) {
    var sps = sawCollapsedSpans && line.markedSpans;
    if (sps) for (var sp, i = 0; i < sps.length; ++i) {
      sp = sps[i];
      if (!sp.marker.collapsed) continue;
      if (sp.from == null) return true;
      if (sp.marker.widgetNode) continue;
      if (sp.from == 0 && sp.marker.inclusiveLeft && lineIsHiddenInner(doc, line, sp))
        return true;
    }
  }
  function lineIsHiddenInner(doc, line, span) {
    if (span.to == null) {
      var end = span.marker.find(1, true);
      return lineIsHiddenInner(doc, end.line, getMarkedSpanFor(end.line.markedSpans, span.marker));
    }
    if (span.marker.inclusiveRight && span.to == line.text.length)
      return true;
    for (var sp, i = 0; i < line.markedSpans.length; ++i) {
      sp = line.markedSpans[i];
      if (sp.marker.collapsed && !sp.marker.widgetNode && sp.from == span.to &&
          (sp.to == null || sp.to != span.from) &&
          (sp.marker.inclusiveLeft || span.marker.inclusiveRight) &&
          lineIsHiddenInner(doc, line, sp)) return true;
    }
  }

  // LINE WIDGETS

  // Line widgets are block elements displayed above or below a line.

  var LineWidget = CodeMirror.LineWidget = function(doc, node, options) {
    if (options) for (var opt in options) if (options.hasOwnProperty(opt))
      this[opt] = options[opt];
    this.doc = doc;
    this.node = node;
  };
  eventMixin(LineWidget);

  function adjustScrollWhenAboveVisible(cm, line, diff) {
    if (heightAtLine(line) < ((cm.curOp && cm.curOp.scrollTop) || cm.doc.scrollTop))
      addToScrollPos(cm, null, diff);
  }

  LineWidget.prototype.clear = function() {
    var cm = this.doc.cm, ws = this.line.widgets, line = this.line, no = lineNo(line);
    if (no == null || !ws) return;
    for (var i = 0; i < ws.length; ++i) if (ws[i] == this) ws.splice(i--, 1);
    if (!ws.length) line.widgets = null;
    var height = widgetHeight(this);
    updateLineHeight(line, Math.max(0, line.height - height));
    if (cm) runInOp(cm, function() {
      adjustScrollWhenAboveVisible(cm, line, -height);
      regLineChange(cm, no, "widget");
    });
  };
  LineWidget.prototype.changed = function() {
    var oldH = this.height, cm = this.doc.cm, line = this.line;
    this.height = null;
    var diff = widgetHeight(this) - oldH;
    if (!diff) return;
    updateLineHeight(line, line.height + diff);
    if (cm) runInOp(cm, function() {
      cm.curOp.forceUpdate = true;
      adjustScrollWhenAboveVisible(cm, line, diff);
    });
  };

  function widgetHeight(widget) {
    if (widget.height != null) return widget.height;
    var cm = widget.doc.cm;
    if (!cm) return 0;
    if (!contains(document.body, widget.node)) {
      var parentStyle = "position: relative;";
      if (widget.coverGutter)
        parentStyle += "margin-left: -" + cm.display.gutters.offsetWidth + "px;";
      if (widget.noHScroll)
        parentStyle += "width: " + cm.display.wrapper.clientWidth + "px;";
      removeChildrenAndAdd(cm.display.measure, elt("div", [widget.node], null, parentStyle));
    }
    return widget.height = widget.node.offsetHeight;
  }

  function addLineWidget(doc, handle, node, options) {
    var widget = new LineWidget(doc, node, options);
    var cm = doc.cm;
    if (cm && widget.noHScroll) cm.display.alignWidgets = true;
    changeLine(doc, handle, "widget", function(line) {
      var widgets = line.widgets || (line.widgets = []);
      if (widget.insertAt == null) widgets.push(widget);
      else widgets.splice(Math.min(widgets.length - 1, Math.max(0, widget.insertAt)), 0, widget);
      widget.line = line;
      if (cm && !lineIsHidden(doc, line)) {
        var aboveVisible = heightAtLine(line) < doc.scrollTop;
        updateLineHeight(line, line.height + widgetHeight(widget));
        if (aboveVisible) addToScrollPos(cm, null, widget.height);
        cm.curOp.forceUpdate = true;
      }
      return true;
    });
    return widget;
  }

  // LINE DATA STRUCTURE

  // Line objects. These hold state related to a line, including
  // highlighting info (the styles array).
  var Line = CodeMirror.Line = function(text, markedSpans, estimateHeight) {
    this.text = text;
    attachMarkedSpans(this, markedSpans);
    this.height = estimateHeight ? estimateHeight(this) : 1;
  };
  eventMixin(Line);
  Line.prototype.lineNo = function() { return lineNo(this); };

  // Change the content (text, markers) of a line. Automatically
  // invalidates cached information and tries to re-estimate the
  // line's height.
  function updateLine(line, text, markedSpans, estimateHeight) {
    line.text = text;
    if (line.stateAfter) line.stateAfter = null;
    if (line.styles) line.styles = null;
    if (line.order != null) line.order = null;
    detachMarkedSpans(line);
    attachMarkedSpans(line, markedSpans);
    var estHeight = estimateHeight ? estimateHeight(line) : 1;
    if (estHeight != line.height) updateLineHeight(line, estHeight);
  }

  // Detach a line from the document tree and its markers.
  function cleanUpLine(line) {
    line.parent = null;
    detachMarkedSpans(line);
  }

  function extractLineClasses(type, output) {
    if (type) for (;;) {
      var lineClass = type.match(/(?:^|\s+)line-(background-)?(\S+)/);
      if (!lineClass) break;
      type = type.slice(0, lineClass.index) + type.slice(lineClass.index + lineClass[0].length);
      var prop = lineClass[1] ? "bgClass" : "textClass";
      if (output[prop] == null)
        output[prop] = lineClass[2];
      else if (!(new RegExp("(?:^|\s)" + lineClass[2] + "(?:$|\s)")).test(output[prop]))
        output[prop] += " " + lineClass[2];
    }
    return type;
  }

  function callBlankLine(mode, state) {
    if (mode.blankLine) return mode.blankLine(state);
    if (!mode.innerMode) return;
    var inner = CodeMirror.innerMode(mode, state);
    if (inner.mode.blankLine) return inner.mode.blankLine(inner.state);
  }

  function readToken(mode, stream, state, inner) {
    for (var i = 0; i < 10; i++) {
      if (inner) inner[0] = CodeMirror.innerMode(mode, state).mode;
      var style = mode.token(stream, state);
      if (stream.pos > stream.start) return style;
    }
    throw new Error("Mode " + mode.name + " failed to advance stream.");
  }

  // Utility for getTokenAt and getLineTokens
  function takeToken(cm, pos, precise, asArray) {
    function getObj(copy) {
      return {start: stream.start, end: stream.pos,
              string: stream.current(),
              type: style || null,
              state: copy ? copyState(doc.mode, state) : state};
    }

    var doc = cm.doc, mode = doc.mode, style;
    pos = clipPos(doc, pos);
    var line = getLine(doc, pos.line), state = getStateBefore(cm, pos.line, precise);
    var stream = new StringStream(line.text, cm.options.tabSize), tokens;
    if (asArray) tokens = [];
    while ((asArray || stream.pos < pos.ch) && !stream.eol()) {
      stream.start = stream.pos;
      style = readToken(mode, stream, state);
      if (asArray) tokens.push(getObj(true));
    }
    return asArray ? tokens : getObj();
  }

  // Run the given mode's parser over a line, calling f for each token.
  function runMode(cm, text, mode, state, f, lineClasses, forceToEnd) {
    var flattenSpans = mode.flattenSpans;
    if (flattenSpans == null) flattenSpans = cm.options.flattenSpans;
    var curStart = 0, curStyle = null;
    var stream = new StringStream(text, cm.options.tabSize), style;
    var inner = cm.options.addModeClass && [null];
    if (text == "") extractLineClasses(callBlankLine(mode, state), lineClasses);
    while (!stream.eol()) {
      if (stream.pos > cm.options.maxHighlightLength) {
        flattenSpans = false;
        if (forceToEnd) processLine(cm, text, state, stream.pos);
        stream.pos = text.length;
        style = null;
      } else {
        style = extractLineClasses(readToken(mode, stream, state, inner), lineClasses);
      }
      if (inner) {
        var mName = inner[0].name;
        if (mName) style = "m-" + (style ? mName + " " + style : mName);
      }
      if (!flattenSpans || curStyle != style) {
        while (curStart < stream.start) {
          curStart = Math.min(stream.start, curStart + 50000);
          f(curStart, curStyle);
        }
        curStyle = style;
      }
      stream.start = stream.pos;
    }
    while (curStart < stream.pos) {
      // Webkit seems to refuse to render text nodes longer than 57444 characters
      var pos = Math.min(stream.pos, curStart + 50000);
      f(pos, curStyle);
      curStart = pos;
    }
  }

  // Compute a style array (an array starting with a mode generation
  // -- for invalidation -- followed by pairs of end positions and
  // style strings), which is used to highlight the tokens on the
  // line.
  function highlightLine(cm, line, state, forceToEnd) {
    // A styles array always starts with a number identifying the
    // mode/overlays that it is based on (for easy invalidation).
    var st = [cm.state.modeGen], lineClasses = {};
    // Compute the base array of styles
    runMode(cm, line.text, cm.doc.mode, state, function(end, style) {
      st.push(end, style);
    }, lineClasses, forceToEnd);

    // Run overlays, adjust style array.
    for (var o = 0; o < cm.state.overlays.length; ++o) {
      var overlay = cm.state.overlays[o], i = 1, at = 0;
      runMode(cm, line.text, overlay.mode, true, function(end, style) {
        var start = i;
        // Ensure there's a token end at the current position, and that i points at it
        while (at < end) {
          var i_end = st[i];
          if (i_end > end)
            st.splice(i, 1, end, st[i+1], i_end);
          i += 2;
          at = Math.min(end, i_end);
        }
        if (!style) return;
        if (overlay.opaque) {
          st.splice(start, i - start, end, "cm-overlay " + style);
          i = start + 2;
        } else {
          for (; start < i; start += 2) {
            var cur = st[start+1];
            st[start+1] = (cur ? cur + " " : "") + "cm-overlay " + style;
          }
        }
      }, lineClasses);
    }

    return {styles: st, classes: lineClasses.bgClass || lineClasses.textClass ? lineClasses : null};
  }

  function getLineStyles(cm, line, updateFrontier) {
    if (!line.styles || line.styles[0] != cm.state.modeGen) {
      var state = getStateBefore(cm, lineNo(line));
      var result = highlightLine(cm, line, line.text.length > cm.options.maxHighlightLength ? copyState(cm.doc.mode, state) : state);
      line.stateAfter = state;
      line.styles = result.styles;
      if (result.classes) line.styleClasses = result.classes;
      else if (line.styleClasses) line.styleClasses = null;
      if (updateFrontier === cm.doc.frontier) cm.doc.frontier++;
    }
    return line.styles;
  }

  // Lightweight form of highlight -- proceed over this line and
  // update state, but don't save a style array. Used for lines that
  // aren't currently visible.
  function processLine(cm, text, state, startAt) {
    var mode = cm.doc.mode;
    var stream = new StringStream(text, cm.options.tabSize);
    stream.start = stream.pos = startAt || 0;
    if (text == "") callBlankLine(mode, state);
    while (!stream.eol()) {
      readToken(mode, stream, state);
      stream.start = stream.pos;
    }
  }

  // Convert a style as returned by a mode (either null, or a string
  // containing one or more styles) to a CSS style. This is cached,
  // and also looks for line-wide styles.
  var styleToClassCache = {}, styleToClassCacheWithMode = {};
  function interpretTokenStyle(style, options) {
    if (!style || /^\s*$/.test(style)) return null;
    var cache = options.addModeClass ? styleToClassCacheWithMode : styleToClassCache;
    return cache[style] ||
      (cache[style] = style.replace(/\S+/g, "cm-$&"));
  }

  // Render the DOM representation of the text of a line. Also builds
  // up a 'line map', which points at the DOM nodes that represent
  // specific stretches of text, and is used by the measuring code.
  // The returned object contains the DOM node, this map, and
  // information about line-wide styles that were set by the mode.
  function buildLineContent(cm, lineView) {
    // The padding-right forces the element to have a 'border', which
    // is needed on Webkit to be able to get line-level bounding
    // rectangles for it (in measureChar).
    var content = elt("span", null, null, webkit ? "padding-right: .1px" : null);
    var builder = {pre: elt("pre", [content], "CodeMirror-line"), content: content,
                   col: 0, pos: 0, cm: cm,
                   splitSpaces: (ie || webkit) && cm.getOption("lineWrapping")};
    lineView.measure = {};

    // Iterate over the logical lines that make up this visual line.
    for (var i = 0; i <= (lineView.rest ? lineView.rest.length : 0); i++) {
      var line = i ? lineView.rest[i - 1] : lineView.line, order;
      builder.pos = 0;
      builder.addToken = buildToken;
      // Optionally wire in some hacks into the token-rendering
      // algorithm, to deal with browser quirks.
      if (hasBadBidiRects(cm.display.measure) && (order = getOrder(line)))
        builder.addToken = buildTokenBadBidi(builder.addToken, order);
      builder.map = [];
      var allowFrontierUpdate = lineView != cm.display.externalMeasured && lineNo(line);
      insertLineContent(line, builder, getLineStyles(cm, line, allowFrontierUpdate));
      if (line.styleClasses) {
        if (line.styleClasses.bgClass)
          builder.bgClass = joinClasses(line.styleClasses.bgClass, builder.bgClass || "");
        if (line.styleClasses.textClass)
          builder.textClass = joinClasses(line.styleClasses.textClass, builder.textClass || "");
      }

      // Ensure at least a single node is present, for measuring.
      if (builder.map.length == 0)
        builder.map.push(0, 0, builder.content.appendChild(zeroWidthElement(cm.display.measure)));

      // Store the map and a cache object for the current logical line
      if (i == 0) {
        lineView.measure.map = builder.map;
        lineView.measure.cache = {};
      } else {
        (lineView.measure.maps || (lineView.measure.maps = [])).push(builder.map);
        (lineView.measure.caches || (lineView.measure.caches = [])).push({});
      }
    }

    // See issue #2901
    if (webkit && /\bcm-tab\b/.test(builder.content.lastChild.className))
      builder.content.className = "cm-tab-wrap-hack";

    signal(cm, "renderLine", cm, lineView.line, builder.pre);
    if (builder.pre.className)
      builder.textClass = joinClasses(builder.pre.className, builder.textClass || "");

    return builder;
  }

  function defaultSpecialCharPlaceholder(ch) {
    var token = elt("span", "\u2022", "cm-invalidchar");
    token.title = "\\u" + ch.charCodeAt(0).toString(16);
    token.setAttribute("aria-label", token.title);
    return token;
  }

  // Build up the DOM representation for a single token, and add it to
  // the line map. Takes care to render special characters separately.
  function buildToken(builder, text, style, startStyle, endStyle, title, css) {
    if (!text) return;
    var displayText = builder.splitSpaces ? text.replace(/ {3,}/g, splitSpaces) : text;
    var special = builder.cm.state.specialChars, mustWrap = false;
    if (!special.test(text)) {
      builder.col += text.length;
      var content = document.createTextNode(displayText);
      builder.map.push(builder.pos, builder.pos + text.length, content);
      if (ie && ie_version < 9) mustWrap = true;
      builder.pos += text.length;
    } else {
      var content = document.createDocumentFragment(), pos = 0;
      while (true) {
        special.lastIndex = pos;
        var m = special.exec(text);
        var skipped = m ? m.index - pos : text.length - pos;
        if (skipped) {
          var txt = document.createTextNode(displayText.slice(pos, pos + skipped));
          if (ie && ie_version < 9) content.appendChild(elt("span", [txt]));
          else content.appendChild(txt);
          builder.map.push(builder.pos, builder.pos + skipped, txt);
          builder.col += skipped;
          builder.pos += skipped;
        }
        if (!m) break;
        pos += skipped + 1;
        if (m[0] == "\t") {
          var tabSize = builder.cm.options.tabSize, tabWidth = tabSize - builder.col % tabSize;
          var txt = content.appendChild(elt("span", spaceStr(tabWidth), "cm-tab"));
          txt.setAttribute("role", "presentation");
          txt.setAttribute("cm-text", "\t");
          builder.col += tabWidth;
        } else if (m[0] == "\r" || m[0] == "\n") {
          var txt = content.appendChild(elt("span", m[0] == "\r" ? "\u240d" : "\u2424", "cm-invalidchar"));
          txt.setAttribute("cm-text", m[0]);
          builder.col += 1;
        } else {
          var txt = builder.cm.options.specialCharPlaceholder(m[0]);
          txt.setAttribute("cm-text", m[0]);
          if (ie && ie_version < 9) content.appendChild(elt("span", [txt]));
          else content.appendChild(txt);
          builder.col += 1;
        }
        builder.map.push(builder.pos, builder.pos + 1, txt);
        builder.pos++;
      }
    }
    if (style || startStyle || endStyle || mustWrap || css) {
      var fullStyle = style || "";
      if (startStyle) fullStyle += startStyle;
      if (endStyle) fullStyle += endStyle;
      var token = elt("span", [content], fullStyle, css);
      if (title) token.title = title;
      return builder.content.appendChild(token);
    }
    builder.content.appendChild(content);
  }

  function splitSpaces(old) {
    var out = " ";
    for (var i = 0; i < old.length - 2; ++i) out += i % 2 ? " " : "\u00a0";
    out += " ";
    return out;
  }

  // Work around nonsense dimensions being reported for stretches of
  // right-to-left text.
  function buildTokenBadBidi(inner, order) {
    return function(builder, text, style, startStyle, endStyle, title, css) {
      style = style ? style + " cm-force-border" : "cm-force-border";
      var start = builder.pos, end = start + text.length;
      for (;;) {
        // Find the part that overlaps with the start of this text
        for (var i = 0; i < order.length; i++) {
          var part = order[i];
          if (part.to > start && part.from <= start) break;
        }
        if (part.to >= end) return inner(builder, text, style, startStyle, endStyle, title, css);
        inner(builder, text.slice(0, part.to - start), style, startStyle, null, title, css);
        startStyle = null;
        text = text.slice(part.to - start);
        start = part.to;
      }
    };
  }

  function buildCollapsedSpan(builder, size, marker, ignoreWidget) {
    var widget = !ignoreWidget && marker.widgetNode;
    if (widget) builder.map.push(builder.pos, builder.pos + size, widget);
    if (!ignoreWidget && builder.cm.display.input.needsContentAttribute) {
      if (!widget)
        widget = builder.content.appendChild(document.createElement("span"));
      widget.setAttribute("cm-marker", marker.id);
    }
    if (widget) {
      builder.cm.display.input.setUneditable(widget);
      builder.content.appendChild(widget);
    }
    builder.pos += size;
  }

  // Outputs a number of spans to make up a line, taking highlighting
  // and marked text into account.
  function insertLineContent(line, builder, styles) {
    var spans = line.markedSpans, allText = line.text, at = 0;
    if (!spans) {
      for (var i = 1; i < styles.length; i+=2)
        builder.addToken(builder, allText.slice(at, at = styles[i]), interpretTokenStyle(styles[i+1], builder.cm.options));
      return;
    }

    var len = allText.length, pos = 0, i = 1, text = "", style, css;
    var nextChange = 0, spanStyle, spanEndStyle, spanStartStyle, title, collapsed;
    for (;;) {
      if (nextChange == pos) { // Update current marker set
        spanStyle = spanEndStyle = spanStartStyle = title = css = "";
        collapsed = null; nextChange = Infinity;
        var foundBookmarks = [];
        for (var j = 0; j < spans.length; ++j) {
          var sp = spans[j], m = sp.marker;
          if (m.type == "bookmark" && sp.from == pos && m.widgetNode) {
            foundBookmarks.push(m);
          } else if (sp.from <= pos && (sp.to == null || sp.to > pos || m.collapsed && sp.to == pos && sp.from == pos)) {
            if (sp.to != null && sp.to != pos && nextChange > sp.to) {
              nextChange = sp.to;
              spanEndStyle = "";
            }
            if (m.className) spanStyle += " " + m.className;
            if (m.css) css = (css ? css + ";" : "") + m.css;
            if (m.startStyle && sp.from == pos) spanStartStyle += " " + m.startStyle;
            if (m.endStyle && sp.to == nextChange) spanEndStyle += " " + m.endStyle;
            if (m.title && !title) title = m.title;
            if (m.collapsed && (!collapsed || compareCollapsedMarkers(collapsed.marker, m) < 0))
              collapsed = sp;
          } else if (sp.from > pos && nextChange > sp.from) {
            nextChange = sp.from;
          }
        }
        if (collapsed && (collapsed.from || 0) == pos) {
          buildCollapsedSpan(builder, (collapsed.to == null ? len + 1 : collapsed.to) - pos,
                             collapsed.marker, collapsed.from == null);
          if (collapsed.to == null) return;
          if (collapsed.to == pos) collapsed = false;
        }
        if (!collapsed && foundBookmarks.length) for (var j = 0; j < foundBookmarks.length; ++j)
          buildCollapsedSpan(builder, 0, foundBookmarks[j]);
      }
      if (pos >= len) break;

      var upto = Math.min(len, nextChange);
      while (true) {
        if (text) {
          var end = pos + text.length;
          if (!collapsed) {
            var tokenText = end > upto ? text.slice(0, upto - pos) : text;
            builder.addToken(builder, tokenText, style ? style + spanStyle : spanStyle,
                             spanStartStyle, pos + tokenText.length == nextChange ? spanEndStyle : "", title, css);
          }
          if (end >= upto) {text = text.slice(upto - pos); pos = upto; break;}
          pos = end;
          spanStartStyle = "";
        }
        text = allText.slice(at, at = styles[i++]);
        style = interpretTokenStyle(styles[i++], builder.cm.options);
      }
    }
  }

  // DOCUMENT DATA STRUCTURE

  // By default, updates that start and end at the beginning of a line
  // are treated specially, in order to make the association of line
  // widgets and marker elements with the text behave more intuitive.
  function isWholeLineUpdate(doc, change) {
    return change.from.ch == 0 && change.to.ch == 0 && lst(change.text) == "" &&
      (!doc.cm || doc.cm.options.wholeLineUpdateBefore);
  }

  // Perform a change on the document data structure.
  function updateDoc(doc, change, markedSpans, estimateHeight) {
    function spansFor(n) {return markedSpans ? markedSpans[n] : null;}
    function update(line, text, spans) {
      updateLine(line, text, spans, estimateHeight);
      signalLater(line, "change", line, change);
    }
    function linesFor(start, end) {
      for (var i = start, result = []; i < end; ++i)
        result.push(new Line(text[i], spansFor(i), estimateHeight));
      return result;
    }

    var from = change.from, to = change.to, text = change.text;
    var firstLine = getLine(doc, from.line), lastLine = getLine(doc, to.line);
    var lastText = lst(text), lastSpans = spansFor(text.length - 1), nlines = to.line - from.line;

    // Adjust the line structure
    if (change.full) {
      doc.insert(0, linesFor(0, text.length));
      doc.remove(text.length, doc.size - text.length);
    } else if (isWholeLineUpdate(doc, change)) {
      // This is a whole-line replace. Treated specially to make
      // sure line objects move the way they are supposed to.
      var added = linesFor(0, text.length - 1);
      update(lastLine, lastLine.text, lastSpans);
      if (nlines) doc.remove(from.line, nlines);
      if (added.length) doc.insert(from.line, added);
    } else if (firstLine == lastLine) {
      if (text.length == 1) {
        update(firstLine, firstLine.text.slice(0, from.ch) + lastText + firstLine.text.slice(to.ch), lastSpans);
      } else {
        var added = linesFor(1, text.length - 1);
        added.push(new Line(lastText + firstLine.text.slice(to.ch), lastSpans, estimateHeight));
        update(firstLine, firstLine.text.slice(0, from.ch) + text[0], spansFor(0));
        doc.insert(from.line + 1, added);
      }
    } else if (text.length == 1) {
      update(firstLine, firstLine.text.slice(0, from.ch) + text[0] + lastLine.text.slice(to.ch), spansFor(0));
      doc.remove(from.line + 1, nlines);
    } else {
      update(firstLine, firstLine.text.slice(0, from.ch) + text[0], spansFor(0));
      update(lastLine, lastText + lastLine.text.slice(to.ch), lastSpans);
      var added = linesFor(1, text.length - 1);
      if (nlines > 1) doc.remove(from.line + 1, nlines - 1);
      doc.insert(from.line + 1, added);
    }

    signalLater(doc, "change", doc, change);
  }

  // The document is represented as a BTree consisting of leaves, with
  // chunk of lines in them, and branches, with up to ten leaves or
  // other branch nodes below them. The top node is always a branch
  // node, and is the document object itself (meaning it has
  // additional methods and properties).
  //
  // All nodes have parent links. The tree is used both to go from
  // line numbers to line objects, and to go from objects to numbers.
  // It also indexes by height, and is used to convert between height
  // and line object, and to find the total height of the document.
  //
  // See also http://marijnhaverbeke.nl/blog/codemirror-line-tree.html

  function LeafChunk(lines) {
    this.lines = lines;
    this.parent = null;
    for (var i = 0, height = 0; i < lines.length; ++i) {
      lines[i].parent = this;
      height += lines[i].height;
    }
    this.height = height;
  }

  LeafChunk.prototype = {
    chunkSize: function() { return this.lines.length; },
    // Remove the n lines at offset 'at'.
    removeInner: function(at, n) {
      for (var i = at, e = at + n; i < e; ++i) {
        var line = this.lines[i];
        this.height -= line.height;
        cleanUpLine(line);
        signalLater(line, "delete");
      }
      this.lines.splice(at, n);
    },
    // Helper used to collapse a small branch into a single leaf.
    collapse: function(lines) {
      lines.push.apply(lines, this.lines);
    },
    // Insert the given array of lines at offset 'at', count them as
    // having the given height.
    insertInner: function(at, lines, height) {
      this.height += height;
      this.lines = this.lines.slice(0, at).concat(lines).concat(this.lines.slice(at));
      for (var i = 0; i < lines.length; ++i) lines[i].parent = this;
    },
    // Used to iterate over a part of the tree.
    iterN: function(at, n, op) {
      for (var e = at + n; at < e; ++at)
        if (op(this.lines[at])) return true;
    }
  };

  function BranchChunk(children) {
    this.children = children;
    var size = 0, height = 0;
    for (var i = 0; i < children.length; ++i) {
      var ch = children[i];
      size += ch.chunkSize(); height += ch.height;
      ch.parent = this;
    }
    this.size = size;
    this.height = height;
    this.parent = null;
  }

  BranchChunk.prototype = {
    chunkSize: function() { return this.size; },
    removeInner: function(at, n) {
      this.size -= n;
      for (var i = 0; i < this.children.length; ++i) {
        var child = this.children[i], sz = child.chunkSize();
        if (at < sz) {
          var rm = Math.min(n, sz - at), oldHeight = child.height;
          child.removeInner(at, rm);
          this.height -= oldHeight - child.height;
          if (sz == rm) { this.children.splice(i--, 1); child.parent = null; }
          if ((n -= rm) == 0) break;
          at = 0;
        } else at -= sz;
      }
      // If the result is smaller than 25 lines, ensure that it is a
      // single leaf node.
      if (this.size - n < 25 &&
          (this.children.length > 1 || !(this.children[0] instanceof LeafChunk))) {
        var lines = [];
        this.collapse(lines);
        this.children = [new LeafChunk(lines)];
        this.children[0].parent = this;
      }
    },
    collapse: function(lines) {
      for (var i = 0; i < this.children.length; ++i) this.children[i].collapse(lines);
    },
    insertInner: function(at, lines, height) {
      this.size += lines.length;
      this.height += height;
      for (var i = 0; i < this.children.length; ++i) {
        var child = this.children[i], sz = child.chunkSize();
        if (at <= sz) {
          child.insertInner(at, lines, height);
          if (child.lines && child.lines.length > 50) {
            while (child.lines.length > 50) {
              var spilled = child.lines.splice(child.lines.length - 25, 25);
              var newleaf = new LeafChunk(spilled);
              child.height -= newleaf.height;
              this.children.splice(i + 1, 0, newleaf);
              newleaf.parent = this;
            }
            this.maybeSpill();
          }
          break;
        }
        at -= sz;
      }
    },
    // When a node has grown, check whether it should be split.
    maybeSpill: function() {
      if (this.children.length <= 10) return;
      var me = this;
      do {
        var spilled = me.children.splice(me.children.length - 5, 5);
        var sibling = new BranchChunk(spilled);
        if (!me.parent) { // Become the parent node
          var copy = new BranchChunk(me.children);
          copy.parent = me;
          me.children = [copy, sibling];
          me = copy;
        } else {
          me.size -= sibling.size;
          me.height -= sibling.height;
          var myIndex = indexOf(me.parent.children, me);
          me.parent.children.splice(myIndex + 1, 0, sibling);
        }
        sibling.parent = me.parent;
      } while (me.children.length > 10);
      me.parent.maybeSpill();
    },
    iterN: function(at, n, op) {
      for (var i = 0; i < this.children.length; ++i) {
        var child = this.children[i], sz = child.chunkSize();
        if (at < sz) {
          var used = Math.min(n, sz - at);
          if (child.iterN(at, used, op)) return true;
          if ((n -= used) == 0) break;
          at = 0;
        } else at -= sz;
      }
    }
  };

  var nextDocId = 0;
  var Doc = CodeMirror.Doc = function(text, mode, firstLine, lineSep) {
    if (!(this instanceof Doc)) return new Doc(text, mode, firstLine, lineSep);
    if (firstLine == null) firstLine = 0;

    BranchChunk.call(this, [new LeafChunk([new Line("", null)])]);
    this.first = firstLine;
    this.scrollTop = this.scrollLeft = 0;
    this.cantEdit = false;
    this.cleanGeneration = 1;
    this.frontier = firstLine;
    var start = Pos(firstLine, 0);
    this.sel = simpleSelection(start);
    this.history = new History(null);
    this.id = ++nextDocId;
    this.modeOption = mode;
    this.lineSep = lineSep;
    this.extend = false;

    if (typeof text == "string") text = this.splitLines(text);
    updateDoc(this, {from: start, to: start, text: text});
    setSelection(this, simpleSelection(start), sel_dontScroll);
  };

  Doc.prototype = createObj(BranchChunk.prototype, {
    constructor: Doc,
    // Iterate over the document. Supports two forms -- with only one
    // argument, it calls that for each line in the document. With
    // three, it iterates over the range given by the first two (with
    // the second being non-inclusive).
    iter: function(from, to, op) {
      if (op) this.iterN(from - this.first, to - from, op);
      else this.iterN(this.first, this.first + this.size, from);
    },

    // Non-public interface for adding and removing lines.
    insert: function(at, lines) {
      var height = 0;
      for (var i = 0; i < lines.length; ++i) height += lines[i].height;
      this.insertInner(at - this.first, lines, height);
    },
    remove: function(at, n) { this.removeInner(at - this.first, n); },

    // From here, the methods are part of the public interface. Most
    // are also available from CodeMirror (editor) instances.

    getValue: function(lineSep) {
      var lines = getLines(this, this.first, this.first + this.size);
      if (lineSep === false) return lines;
      return lines.join(lineSep || this.lineSeparator());
    },
    setValue: docMethodOp(function(code) {
      var top = Pos(this.first, 0), last = this.first + this.size - 1;
      makeChange(this, {from: top, to: Pos(last, getLine(this, last).text.length),
                        text: this.splitLines(code), origin: "setValue", full: true}, true);
      setSelection(this, simpleSelection(top));
    }),
    replaceRange: function(code, from, to, origin) {
      from = clipPos(this, from);
      to = to ? clipPos(this, to) : from;
      replaceRange(this, code, from, to, origin);
    },
    getRange: function(from, to, lineSep) {
      var lines = getBetween(this, clipPos(this, from), clipPos(this, to));
      if (lineSep === false) return lines;
      return lines.join(lineSep || this.lineSeparator());
    },

    getLine: function(line) {var l = this.getLineHandle(line); return l && l.text;},

    getLineHandle: function(line) {if (isLine(this, line)) return getLine(this, line);},
    getLineNumber: function(line) {return lineNo(line);},

    getLineHandleVisualStart: function(line) {
      if (typeof line == "number") line = getLine(this, line);
      return visualLine(line);
    },

    lineCount: function() {return this.size;},
    firstLine: function() {return this.first;},
    lastLine: function() {return this.first + this.size - 1;},

    clipPos: function(pos) {return clipPos(this, pos);},

    getCursor: function(start) {
      var range = this.sel.primary(), pos;
      if (start == null || start == "head") pos = range.head;
      else if (start == "anchor") pos = range.anchor;
      else if (start == "end" || start == "to" || start === false) pos = range.to();
      else pos = range.from();
      return pos;
    },
    listSelections: function() { return this.sel.ranges; },
    somethingSelected: function() {return this.sel.somethingSelected();},

    setCursor: docMethodOp(function(line, ch, options) {
      setSimpleSelection(this, clipPos(this, typeof line == "number" ? Pos(line, ch || 0) : line), null, options);
    }),
    setSelection: docMethodOp(function(anchor, head, options) {
      setSimpleSelection(this, clipPos(this, anchor), clipPos(this, head || anchor), options);
    }),
    extendSelection: docMethodOp(function(head, other, options) {
      extendSelection(this, clipPos(this, head), other && clipPos(this, other), options);
    }),
    extendSelections: docMethodOp(function(heads, options) {
      extendSelections(this, clipPosArray(this, heads, options));
    }),
    extendSelectionsBy: docMethodOp(function(f, options) {
      extendSelections(this, map(this.sel.ranges, f), options);
    }),
    setSelections: docMethodOp(function(ranges, primary, options) {
      if (!ranges.length) return;
      for (var i = 0, out = []; i < ranges.length; i++)
        out[i] = new Range(clipPos(this, ranges[i].anchor),
                           clipPos(this, ranges[i].head));
      if (primary == null) primary = Math.min(ranges.length - 1, this.sel.primIndex);
      setSelection(this, normalizeSelection(out, primary), options);
    }),
    addSelection: docMethodOp(function(anchor, head, options) {
      var ranges = this.sel.ranges.slice(0);
      ranges.push(new Range(clipPos(this, anchor), clipPos(this, head || anchor)));
      setSelection(this, normalizeSelection(ranges, ranges.length - 1), options);
    }),

    getSelection: function(lineSep) {
      var ranges = this.sel.ranges, lines;
      for (var i = 0; i < ranges.length; i++) {
        var sel = getBetween(this, ranges[i].from(), ranges[i].to());
        lines = lines ? lines.concat(sel) : sel;
      }
      if (lineSep === false) return lines;
      else return lines.join(lineSep || this.lineSeparator());
    },
    getSelections: function(lineSep) {
      var parts = [], ranges = this.sel.ranges;
      for (var i = 0; i < ranges.length; i++) {
        var sel = getBetween(this, ranges[i].from(), ranges[i].to());
        if (lineSep !== false) sel = sel.join(lineSep || this.lineSeparator());
        parts[i] = sel;
      }
      return parts;
    },
    replaceSelection: function(code, collapse, origin) {
      var dup = [];
      for (var i = 0; i < this.sel.ranges.length; i++)
        dup[i] = code;
      this.replaceSelections(dup, collapse, origin || "+input");
    },
    replaceSelections: docMethodOp(function(code, collapse, origin) {
      var changes = [], sel = this.sel;
      for (var i = 0; i < sel.ranges.length; i++) {
        var range = sel.ranges[i];
        changes[i] = {from: range.from(), to: range.to(), text: this.splitLines(code[i]), origin: origin};
      }
      var newSel = collapse && collapse != "end" && computeReplacedSel(this, changes, collapse);
      for (var i = changes.length - 1; i >= 0; i--)
        makeChange(this, changes[i]);
      if (newSel) setSelectionReplaceHistory(this, newSel);
      else if (this.cm) ensureCursorVisible(this.cm);
    }),
    undo: docMethodOp(function() {makeChangeFromHistory(this, "undo");}),
    redo: docMethodOp(function() {makeChangeFromHistory(this, "redo");}),
    undoSelection: docMethodOp(function() {makeChangeFromHistory(this, "undo", true);}),
    redoSelection: docMethodOp(function() {makeChangeFromHistory(this, "redo", true);}),

    setExtending: function(val) {this.extend = val;},
    getExtending: function() {return this.extend;},

    historySize: function() {
      var hist = this.history, done = 0, undone = 0;
      for (var i = 0; i < hist.done.length; i++) if (!hist.done[i].ranges) ++done;
      for (var i = 0; i < hist.undone.length; i++) if (!hist.undone[i].ranges) ++undone;
      return {undo: done, redo: undone};
    },
    clearHistory: function() {this.history = new History(this.history.maxGeneration);},

    markClean: function() {
      this.cleanGeneration = this.changeGeneration(true);
    },
    changeGeneration: function(forceSplit) {
      if (forceSplit)
        this.history.lastOp = this.history.lastSelOp = this.history.lastOrigin = null;
      return this.history.generation;
    },
    isClean: function (gen) {
      return this.history.generation == (gen || this.cleanGeneration);
    },

    getHistory: function() {
      return {done: copyHistoryArray(this.history.done),
              undone: copyHistoryArray(this.history.undone)};
    },
    setHistory: function(histData) {
      var hist = this.history = new History(this.history.maxGeneration);
      hist.done = copyHistoryArray(histData.done.slice(0), null, true);
      hist.undone = copyHistoryArray(histData.undone.slice(0), null, true);
    },

    addLineClass: docMethodOp(function(handle, where, cls) {
      return changeLine(this, handle, where == "gutter" ? "gutter" : "class", function(line) {
        var prop = where == "text" ? "textClass"
                 : where == "background" ? "bgClass"
                 : where == "gutter" ? "gutterClass" : "wrapClass";
        if (!line[prop]) line[prop] = cls;
        else if (classTest(cls).test(line[prop])) return false;
        else line[prop] += " " + cls;
        return true;
      });
    }),
    removeLineClass: docMethodOp(function(handle, where, cls) {
      return changeLine(this, handle, where == "gutter" ? "gutter" : "class", function(line) {
        var prop = where == "text" ? "textClass"
                 : where == "background" ? "bgClass"
                 : where == "gutter" ? "gutterClass" : "wrapClass";
        var cur = line[prop];
        if (!cur) return false;
        else if (cls == null) line[prop] = null;
        else {
          var found = cur.match(classTest(cls));
          if (!found) return false;
          var end = found.index + found[0].length;
          line[prop] = cur.slice(0, found.index) + (!found.index || end == cur.length ? "" : " ") + cur.slice(end) || null;
        }
        return true;
      });
    }),

    addLineWidget: docMethodOp(function(handle, node, options) {
      return addLineWidget(this, handle, node, options);
    }),
    removeLineWidget: function(widget) { widget.clear(); },

    markText: function(from, to, options) {
      return markText(this, clipPos(this, from), clipPos(this, to), options, options && options.type || "range");
    },
    setBookmark: function(pos, options) {
      var realOpts = {replacedWith: options && (options.nodeType == null ? options.widget : options),
                      insertLeft: options && options.insertLeft,
                      clearWhenEmpty: false, shared: options && options.shared,
                      handleMouseEvents: options && options.handleMouseEvents};
      pos = clipPos(this, pos);
      return markText(this, pos, pos, realOpts, "bookmark");
    },
    findMarksAt: function(pos) {
      pos = clipPos(this, pos);
      var markers = [], spans = getLine(this, pos.line).markedSpans;
      if (spans) for (var i = 0; i < spans.length; ++i) {
        var span = spans[i];
        if ((span.from == null || span.from <= pos.ch) &&
            (span.to == null || span.to >= pos.ch))
          markers.push(span.marker.parent || span.marker);
      }
      return markers;
    },
    findMarks: function(from, to, filter) {
      from = clipPos(this, from); to = clipPos(this, to);
      var found = [], lineNo = from.line;
      this.iter(from.line, to.line + 1, function(line) {
        var spans = line.markedSpans;
        if (spans) for (var i = 0; i < spans.length; i++) {
          var span = spans[i];
          if (!(lineNo == from.line && from.ch > span.to ||
                span.from == null && lineNo != from.line||
                lineNo == to.line && span.from > to.ch) &&
              (!filter || filter(span.marker)))
            found.push(span.marker.parent || span.marker);
        }
        ++lineNo;
      });
      return found;
    },
    getAllMarks: function() {
      var markers = [];
      this.iter(function(line) {
        var sps = line.markedSpans;
        if (sps) for (var i = 0; i < sps.length; ++i)
          if (sps[i].from != null) markers.push(sps[i].marker);
      });
      return markers;
    },

    posFromIndex: function(off) {
      var ch, lineNo = this.first;
      this.iter(function(line) {
        var sz = line.text.length + 1;
        if (sz > off) { ch = off; return true; }
        off -= sz;
        ++lineNo;
      });
      return clipPos(this, Pos(lineNo, ch));
    },
    indexFromPos: function (coords) {
      coords = clipPos(this, coords);
      var index = coords.ch;
      if (coords.line < this.first || coords.ch < 0) return 0;
      this.iter(this.first, coords.line, function (line) {
        index += line.text.length + 1;
      });
      return index;
    },

    copy: function(copyHistory) {
      var doc = new Doc(getLines(this, this.first, this.first + this.size),
                        this.modeOption, this.first, this.lineSep);
      doc.scrollTop = this.scrollTop; doc.scrollLeft = this.scrollLeft;
      doc.sel = this.sel;
      doc.extend = false;
      if (copyHistory) {
        doc.history.undoDepth = this.history.undoDepth;
        doc.setHistory(this.getHistory());
      }
      return doc;
    },

    linkedDoc: function(options) {
      if (!options) options = {};
      var from = this.first, to = this.first + this.size;
      if (options.from != null && options.from > from) from = options.from;
      if (options.to != null && options.to < to) to = options.to;
      var copy = new Doc(getLines(this, from, to), options.mode || this.modeOption, from, this.lineSep);
      if (options.sharedHist) copy.history = this.history;
      (this.linked || (this.linked = [])).push({doc: copy, sharedHist: options.sharedHist});
      copy.linked = [{doc: this, isParent: true, sharedHist: options.sharedHist}];
      copySharedMarkers(copy, findSharedMarkers(this));
      return copy;
    },
    unlinkDoc: function(other) {
      if (other instanceof CodeMirror) other = other.doc;
      if (this.linked) for (var i = 0; i < this.linked.length; ++i) {
        var link = this.linked[i];
        if (link.doc != other) continue;
        this.linked.splice(i, 1);
        other.unlinkDoc(this);
        detachSharedMarkers(findSharedMarkers(this));
        break;
      }
      // If the histories were shared, split them again
      if (other.history == this.history) {
        var splitIds = [other.id];
        linkedDocs(other, function(doc) {splitIds.push(doc.id);}, true);
        other.history = new History(null);
        other.history.done = copyHistoryArray(this.history.done, splitIds);
        other.history.undone = copyHistoryArray(this.history.undone, splitIds);
      }
    },
    iterLinkedDocs: function(f) {linkedDocs(this, f);},

    getMode: function() {return this.mode;},
    getEditor: function() {return this.cm;},

    splitLines: function(str) {
      if (this.lineSep) return str.split(this.lineSep);
      return splitLinesAuto(str);
    },
    lineSeparator: function() { return this.lineSep || "\n"; }
  });

  // Public alias.
  Doc.prototype.eachLine = Doc.prototype.iter;

  // Set up methods on CodeMirror's prototype to redirect to the editor's document.
  var dontDelegate = "iter insert remove copy getEditor constructor".split(" ");
  for (var prop in Doc.prototype) if (Doc.prototype.hasOwnProperty(prop) && indexOf(dontDelegate, prop) < 0)
    CodeMirror.prototype[prop] = (function(method) {
      return function() {return method.apply(this.doc, arguments);};
    })(Doc.prototype[prop]);

  eventMixin(Doc);

  // Call f for all linked documents.
  function linkedDocs(doc, f, sharedHistOnly) {
    function propagate(doc, skip, sharedHist) {
      if (doc.linked) for (var i = 0; i < doc.linked.length; ++i) {
        var rel = doc.linked[i];
        if (rel.doc == skip) continue;
        var shared = sharedHist && rel.sharedHist;
        if (sharedHistOnly && !shared) continue;
        f(rel.doc, shared);
        propagate(rel.doc, doc, shared);
      }
    }
    propagate(doc, null, true);
  }

  // Attach a document to an editor.
  function attachDoc(cm, doc) {
    if (doc.cm) throw new Error("This document is already in use.");
    cm.doc = doc;
    doc.cm = cm;
    estimateLineHeights(cm);
    loadMode(cm);
    if (!cm.options.lineWrapping) findMaxLine(cm);
    cm.options.mode = doc.modeOption;
    regChange(cm);
  }

  // LINE UTILITIES

  // Find the line object corresponding to the given line number.
  function getLine(doc, n) {
    n -= doc.first;
    if (n < 0 || n >= doc.size) throw new Error("There is no line " + (n + doc.first) + " in the document.");
    for (var chunk = doc; !chunk.lines;) {
      for (var i = 0;; ++i) {
        var child = chunk.children[i], sz = child.chunkSize();
        if (n < sz) { chunk = child; break; }
        n -= sz;
      }
    }
    return chunk.lines[n];
  }

  // Get the part of a document between two positions, as an array of
  // strings.
  function getBetween(doc, start, end) {
    var out = [], n = start.line;
    doc.iter(start.line, end.line + 1, function(line) {
      var text = line.text;
      if (n == end.line) text = text.slice(0, end.ch);
      if (n == start.line) text = text.slice(start.ch);
      out.push(text);
      ++n;
    });
    return out;
  }
  // Get the lines between from and to, as array of strings.
  function getLines(doc, from, to) {
    var out = [];
    doc.iter(from, to, function(line) { out.push(line.text); });
    return out;
  }

  // Update the height of a line, propagating the height change
  // upwards to parent nodes.
  function updateLineHeight(line, height) {
    var diff = height - line.height;
    if (diff) for (var n = line; n; n = n.parent) n.height += diff;
  }

  // Given a line object, find its line number by walking up through
  // its parent links.
  function lineNo(line) {
    if (line.parent == null) return null;
    var cur = line.parent, no = indexOf(cur.lines, line);
    for (var chunk = cur.parent; chunk; cur = chunk, chunk = chunk.parent) {
      for (var i = 0;; ++i) {
        if (chunk.children[i] == cur) break;
        no += chunk.children[i].chunkSize();
      }
    }
    return no + cur.first;
  }

  // Find the line at the given vertical position, using the height
  // information in the document tree.
  function lineAtHeight(chunk, h) {
    var n = chunk.first;
    outer: do {
      for (var i = 0; i < chunk.children.length; ++i) {
        var child = chunk.children[i], ch = child.height;
        if (h < ch) { chunk = child; continue outer; }
        h -= ch;
        n += child.chunkSize();
      }
      return n;
    } while (!chunk.lines);
    for (var i = 0; i < chunk.lines.length; ++i) {
      var line = chunk.lines[i], lh = line.height;
      if (h < lh) break;
      h -= lh;
    }
    return n + i;
  }


  // Find the height above the given line.
  function heightAtLine(lineObj) {
    lineObj = visualLine(lineObj);

    var h = 0, chunk = lineObj.parent;
    for (var i = 0; i < chunk.lines.length; ++i) {
      var line = chunk.lines[i];
      if (line == lineObj) break;
      else h += line.height;
    }
    for (var p = chunk.parent; p; chunk = p, p = chunk.parent) {
      for (var i = 0; i < p.children.length; ++i) {
        var cur = p.children[i];
        if (cur == chunk) break;
        else h += cur.height;
      }
    }
    return h;
  }

  // Get the bidi ordering for the given line (and cache it). Returns
  // false for lines that are fully left-to-right, and an array of
  // BidiSpan objects otherwise.
  function getOrder(line) {
    var order = line.order;
    if (order == null) order = line.order = bidiOrdering(line.text);
    return order;
  }

  // HISTORY

  function History(startGen) {
    // Arrays of change events and selections. Doing something adds an
    // event to done and clears undo. Undoing moves events from done
    // to undone, redoing moves them in the other direction.
    this.done = []; this.undone = [];
    this.undoDepth = Infinity;
    // Used to track when changes can be merged into a single undo
    // event
    this.lastModTime = this.lastSelTime = 0;
    this.lastOp = this.lastSelOp = null;
    this.lastOrigin = this.lastSelOrigin = null;
    // Used by the isClean() method
    this.generation = this.maxGeneration = startGen || 1;
  }

  // Create a history change event from an updateDoc-style change
  // object.
  function historyChangeFromChange(doc, change) {
    var histChange = {from: copyPos(change.from), to: changeEnd(change), text: getBetween(doc, change.from, change.to)};
    attachLocalSpans(doc, histChange, change.from.line, change.to.line + 1);
    linkedDocs(doc, function(doc) {attachLocalSpans(doc, histChange, change.from.line, change.to.line + 1);}, true);
    return histChange;
  }

  // Pop all selection events off the end of a history array. Stop at
  // a change event.
  function clearSelectionEvents(array) {
    while (array.length) {
      var last = lst(array);
      if (last.ranges) array.pop();
      else break;
    }
  }

  // Find the top change event in the history. Pop off selection
  // events that are in the way.
  function lastChangeEvent(hist, force) {
    if (force) {
      clearSelectionEvents(hist.done);
      return lst(hist.done);
    } else if (hist.done.length && !lst(hist.done).ranges) {
      return lst(hist.done);
    } else if (hist.done.length > 1 && !hist.done[hist.done.length - 2].ranges) {
      hist.done.pop();
      return lst(hist.done);
    }
  }

  // Register a change in the history. Merges changes that are within
  // a single operation, ore are close together with an origin that
  // allows merging (starting with "+") into a single event.
  function addChangeToHistory(doc, change, selAfter, opId) {
    var hist = doc.history;
    hist.undone.length = 0;
    var time = +new Date, cur;

    if ((hist.lastOp == opId ||
         hist.lastOrigin == change.origin && change.origin &&
         ((change.origin.charAt(0) == "+" && doc.cm && hist.lastModTime > time - doc.cm.options.historyEventDelay) ||
          change.origin.charAt(0) == "*")) &&
        (cur = lastChangeEvent(hist, hist.lastOp == opId))) {
      // Merge this change into the last event
      var last = lst(cur.changes);
      if (cmp(change.from, change.to) == 0 && cmp(change.from, last.to) == 0) {
        // Optimized case for simple insertion -- don't want to add
        // new changesets for every character typed
        last.to = changeEnd(change);
      } else {
        // Add new sub-event
        cur.changes.push(historyChangeFromChange(doc, change));
      }
    } else {
      // Can not be merged, start a new event.
      var before = lst(hist.done);
      if (!before || !before.ranges)
        pushSelectionToHistory(doc.sel, hist.done);
      cur = {changes: [historyChangeFromChange(doc, change)],
             generation: hist.generation};
      hist.done.push(cur);
      while (hist.done.length > hist.undoDepth) {
        hist.done.shift();
        if (!hist.done[0].ranges) hist.done.shift();
      }
    }
    hist.done.push(selAfter);
    hist.generation = ++hist.maxGeneration;
    hist.lastModTime = hist.lastSelTime = time;
    hist.lastOp = hist.lastSelOp = opId;
    hist.lastOrigin = hist.lastSelOrigin = change.origin;

    if (!last) signal(doc, "historyAdded");
  }

  function selectionEventCanBeMerged(doc, origin, prev, sel) {
    var ch = origin.charAt(0);
    return ch == "*" ||
      ch == "+" &&
      prev.ranges.length == sel.ranges.length &&
      prev.somethingSelected() == sel.somethingSelected() &&
      new Date - doc.history.lastSelTime <= (doc.cm ? doc.cm.options.historyEventDelay : 500);
  }

  // Called whenever the selection changes, sets the new selection as
  // the pending selection in the history, and pushes the old pending
  // selection into the 'done' array when it was significantly
  // different (in number of selected ranges, emptiness, or time).
  function addSelectionToHistory(doc, sel, opId, options) {
    var hist = doc.history, origin = options && options.origin;

    // A new event is started when the previous origin does not match
    // the current, or the origins don't allow matching. Origins
    // starting with * are always merged, those starting with + are
    // merged when similar and close together in time.
    if (opId == hist.lastSelOp ||
        (origin && hist.lastSelOrigin == origin &&
         (hist.lastModTime == hist.lastSelTime && hist.lastOrigin == origin ||
          selectionEventCanBeMerged(doc, origin, lst(hist.done), sel))))
      hist.done[hist.done.length - 1] = sel;
    else
      pushSelectionToHistory(sel, hist.done);

    hist.lastSelTime = +new Date;
    hist.lastSelOrigin = origin;
    hist.lastSelOp = opId;
    if (options && options.clearRedo !== false)
      clearSelectionEvents(hist.undone);
  }

  function pushSelectionToHistory(sel, dest) {
    var top = lst(dest);
    if (!(top && top.ranges && top.equals(sel)))
      dest.push(sel);
  }

  // Used to store marked span information in the history.
  function attachLocalSpans(doc, change, from, to) {
    var existing = change["spans_" + doc.id], n = 0;
    doc.iter(Math.max(doc.first, from), Math.min(doc.first + doc.size, to), function(line) {
      if (line.markedSpans)
        (existing || (existing = change["spans_" + doc.id] = {}))[n] = line.markedSpans;
      ++n;
    });
  }

  // When un/re-doing restores text containing marked spans, those
  // that have been explicitly cleared should not be restored.
  function removeClearedSpans(spans) {
    if (!spans) return null;
    for (var i = 0, out; i < spans.length; ++i) {
      if (spans[i].marker.explicitlyCleared) { if (!out) out = spans.slice(0, i); }
      else if (out) out.push(spans[i]);
    }
    return !out ? spans : out.length ? out : null;
  }

  // Retrieve and filter the old marked spans stored in a change event.
  function getOldSpans(doc, change) {
    var found = change["spans_" + doc.id];
    if (!found) return null;
    for (var i = 0, nw = []; i < change.text.length; ++i)
      nw.push(removeClearedSpans(found[i]));
    return nw;
  }

  // Used both to provide a JSON-safe object in .getHistory, and, when
  // detaching a document, to split the history in two
  function copyHistoryArray(events, newGroup, instantiateSel) {
    for (var i = 0, copy = []; i < events.length; ++i) {
      var event = events[i];
      if (event.ranges) {
        copy.push(instantiateSel ? Selection.prototype.deepCopy.call(event) : event);
        continue;
      }
      var changes = event.changes, newChanges = [];
      copy.push({changes: newChanges});
      for (var j = 0; j < changes.length; ++j) {
        var change = changes[j], m;
        newChanges.push({from: change.from, to: change.to, text: change.text});
        if (newGroup) for (var prop in change) if (m = prop.match(/^spans_(\d+)$/)) {
          if (indexOf(newGroup, Number(m[1])) > -1) {
            lst(newChanges)[prop] = change[prop];
            delete change[prop];
          }
        }
      }
    }
    return copy;
  }

  // Rebasing/resetting history to deal with externally-sourced changes

  function rebaseHistSelSingle(pos, from, to, diff) {
    if (to < pos.line) {
      pos.line += diff;
    } else if (from < pos.line) {
      pos.line = from;
      pos.ch = 0;
    }
  }

  // Tries to rebase an array of history events given a change in the
  // document. If the change touches the same lines as the event, the
  // event, and everything 'behind' it, is discarded. If the change is
  // before the event, the event's positions are updated. Uses a
  // copy-on-write scheme for the positions, to avoid having to
  // reallocate them all on every rebase, but also avoid problems with
  // shared position objects being unsafely updated.
  function rebaseHistArray(array, from, to, diff) {
    for (var i = 0; i < array.length; ++i) {
      var sub = array[i], ok = true;
      if (sub.ranges) {
        if (!sub.copied) { sub = array[i] = sub.deepCopy(); sub.copied = true; }
        for (var j = 0; j < sub.ranges.length; j++) {
          rebaseHistSelSingle(sub.ranges[j].anchor, from, to, diff);
          rebaseHistSelSingle(sub.ranges[j].head, from, to, diff);
        }
        continue;
      }
      for (var j = 0; j < sub.changes.length; ++j) {
        var cur = sub.changes[j];
        if (to < cur.from.line) {
          cur.from = Pos(cur.from.line + diff, cur.from.ch);
          cur.to = Pos(cur.to.line + diff, cur.to.ch);
        } else if (from <= cur.to.line) {
          ok = false;
          break;
        }
      }
      if (!ok) {
        array.splice(0, i + 1);
        i = 0;
      }
    }
  }

  function rebaseHist(hist, change) {
    var from = change.from.line, to = change.to.line, diff = change.text.length - (to - from) - 1;
    rebaseHistArray(hist.done, from, to, diff);
    rebaseHistArray(hist.undone, from, to, diff);
  }

  // EVENT UTILITIES

  // Due to the fact that we still support jurassic IE versions, some
  // compatibility wrappers are needed.

  var e_preventDefault = CodeMirror.e_preventDefault = function(e) {
    if (e.preventDefault) e.preventDefault();
    else e.returnValue = false;
  };
  var e_stopPropagation = CodeMirror.e_stopPropagation = function(e) {
    if (e.stopPropagation) e.stopPropagation();
    else e.cancelBubble = true;
  };
  function e_defaultPrevented(e) {
    return e.defaultPrevented != null ? e.defaultPrevented : e.returnValue == false;
  }
  var e_stop = CodeMirror.e_stop = function(e) {e_preventDefault(e); e_stopPropagation(e);};

  function e_target(e) {return e.target || e.srcElement;}
  function e_button(e) {
    var b = e.which;
    if (b == null) {
      if (e.button & 1) b = 1;
      else if (e.button & 2) b = 3;
      else if (e.button & 4) b = 2;
    }
    if (mac && e.ctrlKey && b == 1) b = 3;
    return b;
  }

  // EVENT HANDLING

  // Lightweight event framework. on/off also work on DOM nodes,
  // registering native DOM handlers.

  var on = CodeMirror.on = function(emitter, type, f) {
    if (emitter.addEventListener)
      emitter.addEventListener(type, f, false);
    else if (emitter.attachEvent)
      emitter.attachEvent("on" + type, f);
    else {
      var map = emitter._handlers || (emitter._handlers = {});
      var arr = map[type] || (map[type] = []);
      arr.push(f);
    }
  };

  var noHandlers = []
  function getHandlers(emitter, type, copy) {
    var arr = emitter._handlers && emitter._handlers[type]
    if (copy) return arr && arr.length > 0 ? arr.slice() : noHandlers
    else return arr || noHandlers
  }

  var off = CodeMirror.off = function(emitter, type, f) {
    if (emitter.removeEventListener)
      emitter.removeEventListener(type, f, false);
    else if (emitter.detachEvent)
      emitter.detachEvent("on" + type, f);
    else {
      var handlers = getHandlers(emitter, type, false)
      for (var i = 0; i < handlers.length; ++i)
        if (handlers[i] == f) { handlers.splice(i, 1); break; }
    }
  };

  var signal = CodeMirror.signal = function(emitter, type /*, values...*/) {
    var handlers = getHandlers(emitter, type, true)
    if (!handlers.length) return;
    var args = Array.prototype.slice.call(arguments, 2);
    for (var i = 0; i < handlers.length; ++i) handlers[i].apply(null, args);
  };

  var orphanDelayedCallbacks = null;

  // Often, we want to signal events at a point where we are in the
  // middle of some work, but don't want the handler to start calling
  // other methods on the editor, which might be in an inconsistent
  // state or simply not expect any other events to happen.
  // signalLater looks whether there are any handlers, and schedules
  // them to be executed when the last operation ends, or, if no
  // operation is active, when a timeout fires.
  function signalLater(emitter, type /*, values...*/) {
    var arr = getHandlers(emitter, type, false)
    if (!arr.length) return;
    var args = Array.prototype.slice.call(arguments, 2), list;
    if (operationGroup) {
      list = operationGroup.delayedCallbacks;
    } else if (orphanDelayedCallbacks) {
      list = orphanDelayedCallbacks;
    } else {
      list = orphanDelayedCallbacks = [];
      setTimeout(fireOrphanDelayed, 0);
    }
    function bnd(f) {return function(){f.apply(null, args);};};
    for (var i = 0; i < arr.length; ++i)
      list.push(bnd(arr[i]));
  }

  function fireOrphanDelayed() {
    var delayed = orphanDelayedCallbacks;
    orphanDelayedCallbacks = null;
    for (var i = 0; i < delayed.length; ++i) delayed[i]();
  }

  // The DOM events that CodeMirror handles can be overridden by
  // registering a (non-DOM) handler on the editor for the event name,
  // and preventDefault-ing the event in that handler.
  function signalDOMEvent(cm, e, override) {
    if (typeof e == "string")
      e = {type: e, preventDefault: function() { this.defaultPrevented = true; }};
    signal(cm, override || e.type, cm, e);
    return e_defaultPrevented(e) || e.codemirrorIgnore;
  }

  function signalCursorActivity(cm) {
    var arr = cm._handlers && cm._handlers.cursorActivity;
    if (!arr) return;
    var set = cm.curOp.cursorActivityHandlers || (cm.curOp.cursorActivityHandlers = []);
    for (var i = 0; i < arr.length; ++i) if (indexOf(set, arr[i]) == -1)
      set.push(arr[i]);
  }

  function hasHandler(emitter, type) {
    return getHandlers(emitter, type).length > 0
  }

  // Add on and off methods to a constructor's prototype, to make
  // registering events on such objects more convenient.
  function eventMixin(ctor) {
    ctor.prototype.on = function(type, f) {on(this, type, f);};
    ctor.prototype.off = function(type, f) {off(this, type, f);};
  }

  // MISC UTILITIES

  // Number of pixels added to scroller and sizer to hide scrollbar
  var scrollerGap = 30;

  // Returned or thrown by various protocols to signal 'I'm not
  // handling this'.
  var Pass = CodeMirror.Pass = {toString: function(){return "CodeMirror.Pass";}};

  // Reused option objects for setSelection & friends
  var sel_dontScroll = {scroll: false}, sel_mouse = {origin: "*mouse"}, sel_move = {origin: "+move"};

  function Delayed() {this.id = null;}
  Delayed.prototype.set = function(ms, f) {
    clearTimeout(this.id);
    this.id = setTimeout(f, ms);
  };

  // Counts the column offset in a string, taking tabs into account.
  // Used mostly to find indentation.
  var countColumn = CodeMirror.countColumn = function(string, end, tabSize, startIndex, startValue) {
    if (end == null) {
      end = string.search(/[^\s\u00a0]/);
      if (end == -1) end = string.length;
    }
    for (var i = startIndex || 0, n = startValue || 0;;) {
      var nextTab = string.indexOf("\t", i);
      if (nextTab < 0 || nextTab >= end)
        return n + (end - i);
      n += nextTab - i;
      n += tabSize - (n % tabSize);
      i = nextTab + 1;
    }
  };

  // The inverse of countColumn -- find the offset that corresponds to
  // a particular column.
  var findColumn = CodeMirror.findColumn = function(string, goal, tabSize) {
    for (var pos = 0, col = 0;;) {
      var nextTab = string.indexOf("\t", pos);
      if (nextTab == -1) nextTab = string.length;
      var skipped = nextTab - pos;
      if (nextTab == string.length || col + skipped >= goal)
        return pos + Math.min(skipped, goal - col);
      col += nextTab - pos;
      col += tabSize - (col % tabSize);
      pos = nextTab + 1;
      if (col >= goal) return pos;
    }
  }

  var spaceStrs = [""];
  function spaceStr(n) {
    while (spaceStrs.length <= n)
      spaceStrs.push(lst(spaceStrs) + " ");
    return spaceStrs[n];
  }

  function lst(arr) { return arr[arr.length-1]; }

  var selectInput = function(node) { node.select(); };
  if (ios) // Mobile Safari apparently has a bug where select() is broken.
    selectInput = function(node) { node.selectionStart = 0; node.selectionEnd = node.value.length; };
  else if (ie) // Suppress mysterious IE10 errors
    selectInput = function(node) { try { node.select(); } catch(_e) {} };

  function indexOf(array, elt) {
    for (var i = 0; i < array.length; ++i)
      if (array[i] == elt) return i;
    return -1;
  }
  function map(array, f) {
    var out = [];
    for (var i = 0; i < array.length; i++) out[i] = f(array[i], i);
    return out;
  }

  function nothing() {}

  function createObj(base, props) {
    var inst;
    if (Object.create) {
      inst = Object.create(base);
    } else {
      nothing.prototype = base;
      inst = new nothing();
    }
    if (props) copyObj(props, inst);
    return inst;
  };

  function copyObj(obj, target, overwrite) {
    if (!target) target = {};
    for (var prop in obj)
      if (obj.hasOwnProperty(prop) && (overwrite !== false || !target.hasOwnProperty(prop)))
        target[prop] = obj[prop];
    return target;
  }

  function bind(f) {
    var args = Array.prototype.slice.call(arguments, 1);
    return function(){return f.apply(null, args);};
  }

  var nonASCIISingleCaseWordChar = /[\u00df\u0587\u0590-\u05f4\u0600-\u06ff\u3040-\u309f\u30a0-\u30ff\u3400-\u4db5\u4e00-\u9fcc\uac00-\ud7af]/;
  var isWordCharBasic = CodeMirror.isWordChar = function(ch) {
    return /\w/.test(ch) || ch > "\x80" &&
      (ch.toUpperCase() != ch.toLowerCase() || nonASCIISingleCaseWordChar.test(ch));
  };
  function isWordChar(ch, helper) {
    if (!helper) return isWordCharBasic(ch);
    if (helper.source.indexOf("\\w") > -1 && isWordCharBasic(ch)) return true;
    return helper.test(ch);
  }

  function isEmpty(obj) {
    for (var n in obj) if (obj.hasOwnProperty(n) && obj[n]) return false;
    return true;
  }

  // Extending unicode characters. A series of a non-extending char +
  // any number of extending chars is treated as a single unit as far
  // as editing and measuring is concerned. This is not fully correct,
  // since some scripts/fonts/browsers also treat other configurations
  // of code points as a group.
  var extendingChars = /[\u0300-\u036f\u0483-\u0489\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u065e\u0670\u06d6-\u06dc\u06de-\u06e4\u06e7\u06e8\u06ea-\u06ed\u0711\u0730-\u074a\u07a6-\u07b0\u07eb-\u07f3\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0900-\u0902\u093c\u0941-\u0948\u094d\u0951-\u0955\u0962\u0963\u0981\u09bc\u09be\u09c1-\u09c4\u09cd\u09d7\u09e2\u09e3\u0a01\u0a02\u0a3c\u0a41\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a70\u0a71\u0a75\u0a81\u0a82\u0abc\u0ac1-\u0ac5\u0ac7\u0ac8\u0acd\u0ae2\u0ae3\u0b01\u0b3c\u0b3e\u0b3f\u0b41-\u0b44\u0b4d\u0b56\u0b57\u0b62\u0b63\u0b82\u0bbe\u0bc0\u0bcd\u0bd7\u0c3e-\u0c40\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0cbc\u0cbf\u0cc2\u0cc6\u0ccc\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0d3e\u0d41-\u0d44\u0d4d\u0d57\u0d62\u0d63\u0dca\u0dcf\u0dd2-\u0dd4\u0dd6\u0ddf\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0eb1\u0eb4-\u0eb9\u0ebb\u0ebc\u0ec8-\u0ecd\u0f18\u0f19\u0f35\u0f37\u0f39\u0f71-\u0f7e\u0f80-\u0f84\u0f86\u0f87\u0f90-\u0f97\u0f99-\u0fbc\u0fc6\u102d-\u1030\u1032-\u1037\u1039\u103a\u103d\u103e\u1058\u1059\u105e-\u1060\u1071-\u1074\u1082\u1085\u1086\u108d\u109d\u135f\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b7-\u17bd\u17c6\u17c9-\u17d3\u17dd\u180b-\u180d\u18a9\u1920-\u1922\u1927\u1928\u1932\u1939-\u193b\u1a17\u1a18\u1a56\u1a58-\u1a5e\u1a60\u1a62\u1a65-\u1a6c\u1a73-\u1a7c\u1a7f\u1b00-\u1b03\u1b34\u1b36-\u1b3a\u1b3c\u1b42\u1b6b-\u1b73\u1b80\u1b81\u1ba2-\u1ba5\u1ba8\u1ba9\u1c2c-\u1c33\u1c36\u1c37\u1cd0-\u1cd2\u1cd4-\u1ce0\u1ce2-\u1ce8\u1ced\u1dc0-\u1de6\u1dfd-\u1dff\u200c\u200d\u20d0-\u20f0\u2cef-\u2cf1\u2de0-\u2dff\u302a-\u302f\u3099\u309a\ua66f-\ua672\ua67c\ua67d\ua6f0\ua6f1\ua802\ua806\ua80b\ua825\ua826\ua8c4\ua8e0-\ua8f1\ua926-\ua92d\ua947-\ua951\ua980-\ua982\ua9b3\ua9b6-\ua9b9\ua9bc\uaa29-\uaa2e\uaa31\uaa32\uaa35\uaa36\uaa43\uaa4c\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uabe5\uabe8\uabed\udc00-\udfff\ufb1e\ufe00-\ufe0f\ufe20-\ufe26\uff9e\uff9f]/;
  function isExtendingChar(ch) { return ch.charCodeAt(0) >= 768 && extendingChars.test(ch); }

  // DOM UTILITIES

  function elt(tag, content, className, style) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (style) e.style.cssText = style;
    if (typeof content == "string") e.appendChild(document.createTextNode(content));
    else if (content) for (var i = 0; i < content.length; ++i) e.appendChild(content[i]);
    return e;
  }

  var range;
  if (document.createRange) range = function(node, start, end, endNode) {
    var r = document.createRange();
    r.setEnd(endNode || node, end);
    r.setStart(node, start);
    return r;
  };
  else range = function(node, start, end) {
    var r = document.body.createTextRange();
    try { r.moveToElementText(node.parentNode); }
    catch(e) { return r; }
    r.collapse(true);
    r.moveEnd("character", end);
    r.moveStart("character", start);
    return r;
  };

  function removeChildren(e) {
    for (var count = e.childNodes.length; count > 0; --count)
      e.removeChild(e.firstChild);
    return e;
  }

  function removeChildrenAndAdd(parent, e) {
    return removeChildren(parent).appendChild(e);
  }

  var contains = CodeMirror.contains = function(parent, child) {
    if (child.nodeType == 3) // Android browser always returns false when child is a textnode
      child = child.parentNode;
    if (parent.contains)
      return parent.contains(child);
    do {
      if (child.nodeType == 11) child = child.host;
      if (child == parent) return true;
    } while (child = child.parentNode);
  };

  function activeElt() {
    var activeElement = document.activeElement;
    while (activeElement && activeElement.root && activeElement.root.activeElement)
      activeElement = activeElement.root.activeElement;
    return activeElement;
  }
  // Older versions of IE throws unspecified error when touching
  // document.activeElement in some cases (during loading, in iframe)
  if (ie && ie_version < 11) activeElt = function() {
    try { return document.activeElement; }
    catch(e) { return document.body; }
  };

  function classTest(cls) { return new RegExp("(^|\\s)" + cls + "(?:$|\\s)\\s*"); }
  var rmClass = CodeMirror.rmClass = function(node, cls) {
    var current = node.className;
    var match = classTest(cls).exec(current);
    if (match) {
      var after = current.slice(match.index + match[0].length);
      node.className = current.slice(0, match.index) + (after ? match[1] + after : "");
    }
  };
  var addClass = CodeMirror.addClass = function(node, cls) {
    var current = node.className;
    if (!classTest(cls).test(current)) node.className += (current ? " " : "") + cls;
  };
  function joinClasses(a, b) {
    var as = a.split(" ");
    for (var i = 0; i < as.length; i++)
      if (as[i] && !classTest(as[i]).test(b)) b += " " + as[i];
    return b;
  }

  // WINDOW-WIDE EVENTS

  // These must be handled carefully, because naively registering a
  // handler for each editor will cause the editors to never be
  // garbage collected.

  function forEachCodeMirror(f) {
    if (!document.body.getElementsByClassName) return;
    var byClass = document.body.getElementsByClassName("CodeMirror");
    for (var i = 0; i < byClass.length; i++) {
      var cm = byClass[i].CodeMirror;
      if (cm) f(cm);
    }
  }

  var globalsRegistered = false;
  function ensureGlobalHandlers() {
    if (globalsRegistered) return;
    registerGlobalHandlers();
    globalsRegistered = true;
  }
  function registerGlobalHandlers() {
    // When the window resizes, we need to refresh active editors.
    var resizeTimer;
    on(window, "resize", function() {
      if (resizeTimer == null) resizeTimer = setTimeout(function() {
        resizeTimer = null;
        forEachCodeMirror(onResize);
      }, 100);
    });
    // When the window loses focus, we want to show the editor as blurred
    on(window, "blur", function() {
      forEachCodeMirror(onBlur);
    });
  }

  // FEATURE DETECTION

  // Detect drag-and-drop
  var dragAndDrop = function() {
    // There is *some* kind of drag-and-drop support in IE6-8, but I
    // couldn't get it to work yet.
    if (ie && ie_version < 9) return false;
    var div = elt('div');
    return "draggable" in div || "dragDrop" in div;
  }();

  var zwspSupported;
  function zeroWidthElement(measure) {
    if (zwspSupported == null) {
      var test = elt("span", "\u200b");
      removeChildrenAndAdd(measure, elt("span", [test, document.createTextNode("x")]));
      if (measure.firstChild.offsetHeight != 0)
        zwspSupported = test.offsetWidth <= 1 && test.offsetHeight > 2 && !(ie && ie_version < 8);
    }
    var node = zwspSupported ? elt("span", "\u200b") :
      elt("span", "\u00a0", null, "display: inline-block; width: 1px; margin-right: -1px");
    node.setAttribute("cm-text", "");
    return node;
  }

  // Feature-detect IE's crummy client rect reporting for bidi text
  var badBidiRects;
  function hasBadBidiRects(measure) {
    if (badBidiRects != null) return badBidiRects;
    var txt = removeChildrenAndAdd(measure, document.createTextNode("A\u062eA"));
    var r0 = range(txt, 0, 1).getBoundingClientRect();
    if (!r0 || r0.left == r0.right) return false; // Safari returns null in some cases (#2780)
    var r1 = range(txt, 1, 2).getBoundingClientRect();
    return badBidiRects = (r1.right - r0.right < 3);
  }

  // See if "".split is the broken IE version, if so, provide an
  // alternative way to split lines.
  var splitLinesAuto = CodeMirror.splitLines = "\n\nb".split(/\n/).length != 3 ? function(string) {
    var pos = 0, result = [], l = string.length;
    while (pos <= l) {
      var nl = string.indexOf("\n", pos);
      if (nl == -1) nl = string.length;
      var line = string.slice(pos, string.charAt(nl - 1) == "\r" ? nl - 1 : nl);
      var rt = line.indexOf("\r");
      if (rt != -1) {
        result.push(line.slice(0, rt));
        pos += rt + 1;
      } else {
        result.push(line);
        pos = nl + 1;
      }
    }
    return result;
  } : function(string){return string.split(/\r\n?|\n/);};

  var hasSelection = window.getSelection ? function(te) {
    try { return te.selectionStart != te.selectionEnd; }
    catch(e) { return false; }
  } : function(te) {
    try {var range = te.ownerDocument.selection.createRange();}
    catch(e) {}
    if (!range || range.parentElement() != te) return false;
    return range.compareEndPoints("StartToEnd", range) != 0;
  };

  var hasCopyEvent = (function() {
    var e = elt("div");
    if ("oncopy" in e) return true;
    e.setAttribute("oncopy", "return;");
    return typeof e.oncopy == "function";
  })();

  var badZoomedRects = null;
  function hasBadZoomedRects(measure) {
    if (badZoomedRects != null) return badZoomedRects;
    var node = removeChildrenAndAdd(measure, elt("span", "x"));
    var normal = node.getBoundingClientRect();
    var fromRange = range(node, 0, 1).getBoundingClientRect();
    return badZoomedRects = Math.abs(normal.left - fromRange.left) > 1;
  }

  // KEY NAMES

  var keyNames = CodeMirror.keyNames = {
    3: "Enter", 8: "Backspace", 9: "Tab", 13: "Enter", 16: "Shift", 17: "Ctrl", 18: "Alt",
    19: "Pause", 20: "CapsLock", 27: "Esc", 32: "Space", 33: "PageUp", 34: "PageDown", 35: "End",
    36: "Home", 37: "Left", 38: "Up", 39: "Right", 40: "Down", 44: "PrintScrn", 45: "Insert",
    46: "Delete", 59: ";", 61: "=", 91: "Mod", 92: "Mod", 93: "Mod",
    106: "*", 107: "=", 109: "-", 110: ".", 111: "/", 127: "Delete",
    173: "-", 186: ";", 187: "=", 188: ",", 189: "-", 190: ".", 191: "/", 192: "`", 219: "[", 220: "\\",
    221: "]", 222: "'", 63232: "Up", 63233: "Down", 63234: "Left", 63235: "Right", 63272: "Delete",
    63273: "Home", 63275: "End", 63276: "PageUp", 63277: "PageDown", 63302: "Insert"
  };
  (function() {
    // Number keys
    for (var i = 0; i < 10; i++) keyNames[i + 48] = keyNames[i + 96] = String(i);
    // Alphabetic keys
    for (var i = 65; i <= 90; i++) keyNames[i] = String.fromCharCode(i);
    // Function keys
    for (var i = 1; i <= 12; i++) keyNames[i + 111] = keyNames[i + 63235] = "F" + i;
  })();

  // BIDI HELPERS

  function iterateBidiSections(order, from, to, f) {
    if (!order) return f(from, to, "ltr");
    var found = false;
    for (var i = 0; i < order.length; ++i) {
      var part = order[i];
      if (part.from < to && part.to > from || from == to && part.to == from) {
        f(Math.max(part.from, from), Math.min(part.to, to), part.level == 1 ? "rtl" : "ltr");
        found = true;
      }
    }
    if (!found) f(from, to, "ltr");
  }

  function bidiLeft(part) { return part.level % 2 ? part.to : part.from; }
  function bidiRight(part) { return part.level % 2 ? part.from : part.to; }

  function lineLeft(line) { var order = getOrder(line); return order ? bidiLeft(order[0]) : 0; }
  function lineRight(line) {
    var order = getOrder(line);
    if (!order) return line.text.length;
    return bidiRight(lst(order));
  }

  function lineStart(cm, lineN) {
    var line = getLine(cm.doc, lineN);
    var visual = visualLine(line);
    if (visual != line) lineN = lineNo(visual);
    var order = getOrder(visual);
    var ch = !order ? 0 : order[0].level % 2 ? lineRight(visual) : lineLeft(visual);
    return Pos(lineN, ch);
  }
  function lineEnd(cm, lineN) {
    var merged, line = getLine(cm.doc, lineN);
    while (merged = collapsedSpanAtEnd(line)) {
      line = merged.find(1, true).line;
      lineN = null;
    }
    var order = getOrder(line);
    var ch = !order ? line.text.length : order[0].level % 2 ? lineLeft(line) : lineRight(line);
    return Pos(lineN == null ? lineNo(line) : lineN, ch);
  }
  function lineStartSmart(cm, pos) {
    var start = lineStart(cm, pos.line);
    var line = getLine(cm.doc, start.line);
    var order = getOrder(line);
    if (!order || order[0].level == 0) {
      var firstNonWS = Math.max(0, line.text.search(/\S/));
      var inWS = pos.line == start.line && pos.ch <= firstNonWS && pos.ch;
      return Pos(start.line, inWS ? 0 : firstNonWS);
    }
    return start;
  }

  function compareBidiLevel(order, a, b) {
    var linedir = order[0].level;
    if (a == linedir) return true;
    if (b == linedir) return false;
    return a < b;
  }
  var bidiOther;
  function getBidiPartAt(order, pos) {
    bidiOther = null;
    for (var i = 0, found; i < order.length; ++i) {
      var cur = order[i];
      if (cur.from < pos && cur.to > pos) return i;
      if ((cur.from == pos || cur.to == pos)) {
        if (found == null) {
          found = i;
        } else if (compareBidiLevel(order, cur.level, order[found].level)) {
          if (cur.from != cur.to) bidiOther = found;
          return i;
        } else {
          if (cur.from != cur.to) bidiOther = i;
          return found;
        }
      }
    }
    return found;
  }

  function moveInLine(line, pos, dir, byUnit) {
    if (!byUnit) return pos + dir;
    do pos += dir;
    while (pos > 0 && isExtendingChar(line.text.charAt(pos)));
    return pos;
  }

  // This is needed in order to move 'visually' through bi-directional
  // text -- i.e., pressing left should make the cursor go left, even
  // when in RTL text. The tricky part is the 'jumps', where RTL and
  // LTR text touch each other. This often requires the cursor offset
  // to move more than one unit, in order to visually move one unit.
  function moveVisually(line, start, dir, byUnit) {
    var bidi = getOrder(line);
    if (!bidi) return moveLogically(line, start, dir, byUnit);
    var pos = getBidiPartAt(bidi, start), part = bidi[pos];
    var target = moveInLine(line, start, part.level % 2 ? -dir : dir, byUnit);

    for (;;) {
      if (target > part.from && target < part.to) return target;
      if (target == part.from || target == part.to) {
        if (getBidiPartAt(bidi, target) == pos) return target;
        part = bidi[pos += dir];
        return (dir > 0) == part.level % 2 ? part.to : part.from;
      } else {
        part = bidi[pos += dir];
        if (!part) return null;
        if ((dir > 0) == part.level % 2)
          target = moveInLine(line, part.to, -1, byUnit);
        else
          target = moveInLine(line, part.from, 1, byUnit);
      }
    }
  }

  function moveLogically(line, start, dir, byUnit) {
    var target = start + dir;
    if (byUnit) while (target > 0 && isExtendingChar(line.text.charAt(target))) target += dir;
    return target < 0 || target > line.text.length ? null : target;
  }

  // Bidirectional ordering algorithm
  // See http://unicode.org/reports/tr9/tr9-13.html for the algorithm
  // that this (partially) implements.

  // One-char codes used for character types:
  // L (L):   Left-to-Right
  // R (R):   Right-to-Left
  // r (AL):  Right-to-Left Arabic
  // 1 (EN):  European Number
  // + (ES):  European Number Separator
  // % (ET):  European Number Terminator
  // n (AN):  Arabic Number
  // , (CS):  Common Number Separator
  // m (NSM): Non-Spacing Mark
  // b (BN):  Boundary Neutral
  // s (B):   Paragraph Separator
  // t (S):   Segment Separator
  // w (WS):  Whitespace
  // N (ON):  Other Neutrals

  // Returns null if characters are ordered as they appear
  // (left-to-right), or an array of sections ({from, to, level}
  // objects) in the order in which they occur visually.
  var bidiOrdering = (function() {
    // Character types for codepoints 0 to 0xff
    var lowTypes = "bbbbbbbbbtstwsbbbbbbbbbbbbbbssstwNN%%%NNNNNN,N,N1111111111NNNNNNNLLLLLLLLLLLLLLLLLLLLLLLLLLNNNNNNLLLLLLLLLLLLLLLLLLLLLLLLLLNNNNbbbbbbsbbbbbbbbbbbbbbbbbbbbbbbbbb,N%%%%NNNNLNNNNN%%11NLNNN1LNNNNNLLLLLLLLLLLLLLLLLLLLLLLNLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLN";
    // Character types for codepoints 0x600 to 0x6ff
    var arabicTypes = "rrrrrrrrrrrr,rNNmmmmmmrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrmmmmmmmmmmmmmmrrrrrrrnnnnnnnnnn%nnrrrmrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrmmmmmmmmmmmmmmmmmmmNmmmm";
    function charType(code) {
      if (code <= 0xf7) return lowTypes.charAt(code);
      else if (0x590 <= code && code <= 0x5f4) return "R";
      else if (0x600 <= code && code <= 0x6ed) return arabicTypes.charAt(code - 0x600);
      else if (0x6ee <= code && code <= 0x8ac) return "r";
      else if (0x2000 <= code && code <= 0x200b) return "w";
      else if (code == 0x200c) return "b";
      else return "L";
    }

    var bidiRE = /[\u0590-\u05f4\u0600-\u06ff\u0700-\u08ac]/;
    var isNeutral = /[stwN]/, isStrong = /[LRr]/, countsAsLeft = /[Lb1n]/, countsAsNum = /[1n]/;
    // Browsers seem to always treat the boundaries of block elements as being L.
    var outerType = "L";

    function BidiSpan(level, from, to) {
      this.level = level;
      this.from = from; this.to = to;
    }

    return function(str) {
      if (!bidiRE.test(str)) return false;
      var len = str.length, types = [];
      for (var i = 0, type; i < len; ++i)
        types.push(type = charType(str.charCodeAt(i)));

      // W1. Examine each non-spacing mark (NSM) in the level run, and
      // change the type of the NSM to the type of the previous
      // character. If the NSM is at the start of the level run, it will
      // get the type of sor.
      for (var i = 0, prev = outerType; i < len; ++i) {
        var type = types[i];
        if (type == "m") types[i] = prev;
        else prev = type;
      }

      // W2. Search backwards from each instance of a European number
      // until the first strong type (R, L, AL, or sor) is found. If an
      // AL is found, change the type of the European number to Arabic
      // number.
      // W3. Change all ALs to R.
      for (var i = 0, cur = outerType; i < len; ++i) {
        var type = types[i];
        if (type == "1" && cur == "r") types[i] = "n";
        else if (isStrong.test(type)) { cur = type; if (type == "r") types[i] = "R"; }
      }

      // W4. A single European separator between two European numbers
      // changes to a European number. A single common separator between
      // two numbers of the same type changes to that type.
      for (var i = 1, prev = types[0]; i < len - 1; ++i) {
        var type = types[i];
        if (type == "+" && prev == "1" && types[i+1] == "1") types[i] = "1";
        else if (type == "," && prev == types[i+1] &&
                 (prev == "1" || prev == "n")) types[i] = prev;
        prev = type;
      }

      // W5. A sequence of European terminators adjacent to European
      // numbers changes to all European numbers.
      // W6. Otherwise, separators and terminators change to Other
      // Neutral.
      for (var i = 0; i < len; ++i) {
        var type = types[i];
        if (type == ",") types[i] = "N";
        else if (type == "%") {
          for (var end = i + 1; end < len && types[end] == "%"; ++end) {}
          var replace = (i && types[i-1] == "!") || (end < len && types[end] == "1") ? "1" : "N";
          for (var j = i; j < end; ++j) types[j] = replace;
          i = end - 1;
        }
      }

      // W7. Search backwards from each instance of a European number
      // until the first strong type (R, L, or sor) is found. If an L is
      // found, then change the type of the European number to L.
      for (var i = 0, cur = outerType; i < len; ++i) {
        var type = types[i];
        if (cur == "L" && type == "1") types[i] = "L";
        else if (isStrong.test(type)) cur = type;
      }

      // N1. A sequence of neutrals takes the direction of the
      // surrounding strong text if the text on both sides has the same
      // direction. European and Arabic numbers act as if they were R in
      // terms of their influence on neutrals. Start-of-level-run (sor)
      // and end-of-level-run (eor) are used at level run boundaries.
      // N2. Any remaining neutrals take the embedding direction.
      for (var i = 0; i < len; ++i) {
        if (isNeutral.test(types[i])) {
          for (var end = i + 1; end < len && isNeutral.test(types[end]); ++end) {}
          var before = (i ? types[i-1] : outerType) == "L";
          var after = (end < len ? types[end] : outerType) == "L";
          var replace = before || after ? "L" : "R";
          for (var j = i; j < end; ++j) types[j] = replace;
          i = end - 1;
        }
      }

      // Here we depart from the documented algorithm, in order to avoid
      // building up an actual levels array. Since there are only three
      // levels (0, 1, 2) in an implementation that doesn't take
      // explicit embedding into account, we can build up the order on
      // the fly, without following the level-based algorithm.
      var order = [], m;
      for (var i = 0; i < len;) {
        if (countsAsLeft.test(types[i])) {
          var start = i;
          for (++i; i < len && countsAsLeft.test(types[i]); ++i) {}
          order.push(new BidiSpan(0, start, i));
        } else {
          var pos = i, at = order.length;
          for (++i; i < len && types[i] != "L"; ++i) {}
          for (var j = pos; j < i;) {
            if (countsAsNum.test(types[j])) {
              if (pos < j) order.splice(at, 0, new BidiSpan(1, pos, j));
              var nstart = j;
              for (++j; j < i && countsAsNum.test(types[j]); ++j) {}
              order.splice(at, 0, new BidiSpan(2, nstart, j));
              pos = j;
            } else ++j;
          }
          if (pos < i) order.splice(at, 0, new BidiSpan(1, pos, i));
        }
      }
      if (order[0].level == 1 && (m = str.match(/^\s+/))) {
        order[0].from = m[0].length;
        order.unshift(new BidiSpan(0, 0, m[0].length));
      }
      if (lst(order).level == 1 && (m = str.match(/\s+$/))) {
        lst(order).to -= m[0].length;
        order.push(new BidiSpan(0, len - m[0].length, len));
      }
      if (order[0].level == 2)
        order.unshift(new BidiSpan(1, order[0].to, order[0].to));
      if (order[0].level != lst(order).level)
        order.push(new BidiSpan(order[0].level, len, len));

      return order;
    };
  })();

  // THE END

  CodeMirror.version = "5.9.0";

  return CodeMirror;
});

},{}],5:[function(require,module,exports){
// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

// TODO actually recognize syntax of TypeScript constructs

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("javascript", function(config, parserConfig) {
  var indentUnit = config.indentUnit;
  var statementIndent = parserConfig.statementIndent;
  var jsonldMode = parserConfig.jsonld;
  var jsonMode = parserConfig.json || jsonldMode;
  var isTS = parserConfig.typescript;
  var wordRE = parserConfig.wordCharacters || /[\w$\xa1-\uffff]/;

  // Tokenizer

  var keywords = function(){
    function kw(type) {return {type: type, style: "keyword"};}
    var A = kw("keyword a"), B = kw("keyword b"), C = kw("keyword c");
    var operator = kw("operator"), atom = {type: "atom", style: "atom"};

    var jsKeywords = {
      "if": kw("if"), "while": A, "with": A, "else": B, "do": B, "try": B, "finally": B,
      "return": C, "break": C, "continue": C, "new": kw("new"), "delete": C, "throw": C, "debugger": C,
      "var": kw("var"), "const": kw("var"), "let": kw("var"),
      "function": kw("function"), "catch": kw("catch"),
      "for": kw("for"), "switch": kw("switch"), "case": kw("case"), "default": kw("default"),
      "in": operator, "typeof": operator, "instanceof": operator,
      "true": atom, "false": atom, "null": atom, "undefined": atom, "NaN": atom, "Infinity": atom,
      "this": kw("this"), "class": kw("class"), "super": kw("atom"),
      "yield": C, "export": kw("export"), "import": kw("import"), "extends": C
    };

    // Extend the 'normal' keywords with the TypeScript language extensions
    if (isTS) {
      var type = {type: "variable", style: "variable-3"};
      var tsKeywords = {
        // object-like things
        "interface": kw("interface"),
        "extends": kw("extends"),
        "constructor": kw("constructor"),

        // scope modifiers
        "public": kw("public"),
        "private": kw("private"),
        "protected": kw("protected"),
        "static": kw("static"),

        // types
        "string": type, "number": type, "boolean": type, "any": type
      };

      for (var attr in tsKeywords) {
        jsKeywords[attr] = tsKeywords[attr];
      }
    }

    return jsKeywords;
  }();

  var isOperatorChar = /[+\-*&%=<>!?|~^]/;
  var isJsonldKeyword = /^@(context|id|value|language|type|container|list|set|reverse|index|base|vocab|graph)"/;

  function readRegexp(stream) {
    var escaped = false, next, inSet = false;
    while ((next = stream.next()) != null) {
      if (!escaped) {
        if (next == "/" && !inSet) return;
        if (next == "[") inSet = true;
        else if (inSet && next == "]") inSet = false;
      }
      escaped = !escaped && next == "\\";
    }
  }

  // Used as scratch variables to communicate multiple values without
  // consing up tons of objects.
  var type, content;
  function ret(tp, style, cont) {
    type = tp; content = cont;
    return style;
  }
  function tokenBase(stream, state) {
    var ch = stream.next();
    if (ch == '"' || ch == "'") {
      state.tokenize = tokenString(ch);
      return state.tokenize(stream, state);
    } else if (ch == "." && stream.match(/^\d+(?:[eE][+\-]?\d+)?/)) {
      return ret("number", "number");
    } else if (ch == "." && stream.match("..")) {
      return ret("spread", "meta");
    } else if (/[\[\]{}\(\),;\:\.]/.test(ch)) {
      return ret(ch);
    } else if (ch == "=" && stream.eat(">")) {
      return ret("=>", "operator");
    } else if (ch == "0" && stream.eat(/x/i)) {
      stream.eatWhile(/[\da-f]/i);
      return ret("number", "number");
    } else if (ch == "0" && stream.eat(/o/i)) {
      stream.eatWhile(/[0-7]/i);
      return ret("number", "number");
    } else if (ch == "0" && stream.eat(/b/i)) {
      stream.eatWhile(/[01]/i);
      return ret("number", "number");
    } else if (/\d/.test(ch)) {
      stream.match(/^\d*(?:\.\d*)?(?:[eE][+\-]?\d+)?/);
      return ret("number", "number");
    } else if (ch == "/") {
      if (stream.eat("*")) {
        state.tokenize = tokenComment;
        return tokenComment(stream, state);
      } else if (stream.eat("/")) {
        stream.skipToEnd();
        return ret("comment", "comment");
      } else if (/^(?:operator|sof|keyword c|case|new|[\[{}\(,;:])$/.test(state.lastType)) {
        readRegexp(stream);
        stream.match(/^\b(([gimyu])(?![gimyu]*\2))+\b/);
        return ret("regexp", "string-2");
      } else {
        stream.eatWhile(isOperatorChar);
        return ret("operator", "operator", stream.current());
      }
    } else if (ch == "`") {
      state.tokenize = tokenQuasi;
      return tokenQuasi(stream, state);
    } else if (ch == "#") {
      stream.skipToEnd();
      return ret("error", "error");
    } else if (isOperatorChar.test(ch)) {
      stream.eatWhile(isOperatorChar);
      return ret("operator", "operator", stream.current());
    } else if (wordRE.test(ch)) {
      stream.eatWhile(wordRE);
      var word = stream.current(), known = keywords.propertyIsEnumerable(word) && keywords[word];
      return (known && state.lastType != ".") ? ret(known.type, known.style, word) :
                     ret("variable", "variable", word);
    }
  }

  function tokenString(quote) {
    return function(stream, state) {
      var escaped = false, next;
      if (jsonldMode && stream.peek() == "@" && stream.match(isJsonldKeyword)){
        state.tokenize = tokenBase;
        return ret("jsonld-keyword", "meta");
      }
      while ((next = stream.next()) != null) {
        if (next == quote && !escaped) break;
        escaped = !escaped && next == "\\";
      }
      if (!escaped) state.tokenize = tokenBase;
      return ret("string", "string");
    };
  }

  function tokenComment(stream, state) {
    var maybeEnd = false, ch;
    while (ch = stream.next()) {
      if (ch == "/" && maybeEnd) {
        state.tokenize = tokenBase;
        break;
      }
      maybeEnd = (ch == "*");
    }
    return ret("comment", "comment");
  }

  function tokenQuasi(stream, state) {
    var escaped = false, next;
    while ((next = stream.next()) != null) {
      if (!escaped && (next == "`" || next == "$" && stream.eat("{"))) {
        state.tokenize = tokenBase;
        break;
      }
      escaped = !escaped && next == "\\";
    }
    return ret("quasi", "string-2", stream.current());
  }

  var brackets = "([{}])";
  // This is a crude lookahead trick to try and notice that we're
  // parsing the argument patterns for a fat-arrow function before we
  // actually hit the arrow token. It only works if the arrow is on
  // the same line as the arguments and there's no strange noise
  // (comments) in between. Fallback is to only notice when we hit the
  // arrow, and not declare the arguments as locals for the arrow
  // body.
  function findFatArrow(stream, state) {
    if (state.fatArrowAt) state.fatArrowAt = null;
    var arrow = stream.string.indexOf("=>", stream.start);
    if (arrow < 0) return;

    var depth = 0, sawSomething = false;
    for (var pos = arrow - 1; pos >= 0; --pos) {
      var ch = stream.string.charAt(pos);
      var bracket = brackets.indexOf(ch);
      if (bracket >= 0 && bracket < 3) {
        if (!depth) { ++pos; break; }
        if (--depth == 0) break;
      } else if (bracket >= 3 && bracket < 6) {
        ++depth;
      } else if (wordRE.test(ch)) {
        sawSomething = true;
      } else if (/["'\/]/.test(ch)) {
        return;
      } else if (sawSomething && !depth) {
        ++pos;
        break;
      }
    }
    if (sawSomething && !depth) state.fatArrowAt = pos;
  }

  // Parser

  var atomicTypes = {"atom": true, "number": true, "variable": true, "string": true, "regexp": true, "this": true, "jsonld-keyword": true};

  function JSLexical(indented, column, type, align, prev, info) {
    this.indented = indented;
    this.column = column;
    this.type = type;
    this.prev = prev;
    this.info = info;
    if (align != null) this.align = align;
  }

  function inScope(state, varname) {
    for (var v = state.localVars; v; v = v.next)
      if (v.name == varname) return true;
    for (var cx = state.context; cx; cx = cx.prev) {
      for (var v = cx.vars; v; v = v.next)
        if (v.name == varname) return true;
    }
  }

  function parseJS(state, style, type, content, stream) {
    var cc = state.cc;
    // Communicate our context to the combinators.
    // (Less wasteful than consing up a hundred closures on every call.)
    cx.state = state; cx.stream = stream; cx.marked = null, cx.cc = cc; cx.style = style;

    if (!state.lexical.hasOwnProperty("align"))
      state.lexical.align = true;

    while(true) {
      var combinator = cc.length ? cc.pop() : jsonMode ? expression : statement;
      if (combinator(type, content)) {
        while(cc.length && cc[cc.length - 1].lex)
          cc.pop()();
        if (cx.marked) return cx.marked;
        if (type == "variable" && inScope(state, content)) return "variable-2";
        return style;
      }
    }
  }

  // Combinator utils

  var cx = {state: null, column: null, marked: null, cc: null};
  function pass() {
    for (var i = arguments.length - 1; i >= 0; i--) cx.cc.push(arguments[i]);
  }
  function cont() {
    pass.apply(null, arguments);
    return true;
  }
  function register(varname) {
    function inList(list) {
      for (var v = list; v; v = v.next)
        if (v.name == varname) return true;
      return false;
    }
    var state = cx.state;
    cx.marked = "def";
    if (state.context) {
      if (inList(state.localVars)) return;
      state.localVars = {name: varname, next: state.localVars};
    } else {
      if (inList(state.globalVars)) return;
      if (parserConfig.globalVars)
        state.globalVars = {name: varname, next: state.globalVars};
    }
  }

  // Combinators

  var defaultVars = {name: "this", next: {name: "arguments"}};
  function pushcontext() {
    cx.state.context = {prev: cx.state.context, vars: cx.state.localVars};
    cx.state.localVars = defaultVars;
  }
  function popcontext() {
    cx.state.localVars = cx.state.context.vars;
    cx.state.context = cx.state.context.prev;
  }
  function pushlex(type, info) {
    var result = function() {
      var state = cx.state, indent = state.indented;
      if (state.lexical.type == "stat") indent = state.lexical.indented;
      else for (var outer = state.lexical; outer && outer.type == ")" && outer.align; outer = outer.prev)
        indent = outer.indented;
      state.lexical = new JSLexical(indent, cx.stream.column(), type, null, state.lexical, info);
    };
    result.lex = true;
    return result;
  }
  function poplex() {
    var state = cx.state;
    if (state.lexical.prev) {
      if (state.lexical.type == ")")
        state.indented = state.lexical.indented;
      state.lexical = state.lexical.prev;
    }
  }
  poplex.lex = true;

  function expect(wanted) {
    function exp(type) {
      if (type == wanted) return cont();
      else if (wanted == ";") return pass();
      else return cont(exp);
    };
    return exp;
  }

  function statement(type, value) {
    if (type == "var") return cont(pushlex("vardef", value.length), vardef, expect(";"), poplex);
    if (type == "keyword a") return cont(pushlex("form"), expression, statement, poplex);
    if (type == "keyword b") return cont(pushlex("form"), statement, poplex);
    if (type == "{") return cont(pushlex("}"), block, poplex);
    if (type == ";") return cont();
    if (type == "if") {
      if (cx.state.lexical.info == "else" && cx.state.cc[cx.state.cc.length - 1] == poplex)
        cx.state.cc.pop()();
      return cont(pushlex("form"), expression, statement, poplex, maybeelse);
    }
    if (type == "function") return cont(functiondef);
    if (type == "for") return cont(pushlex("form"), forspec, statement, poplex);
    if (type == "variable") return cont(pushlex("stat"), maybelabel);
    if (type == "switch") return cont(pushlex("form"), expression, pushlex("}", "switch"), expect("{"),
                                      block, poplex, poplex);
    if (type == "case") return cont(expression, expect(":"));
    if (type == "default") return cont(expect(":"));
    if (type == "catch") return cont(pushlex("form"), pushcontext, expect("("), funarg, expect(")"),
                                     statement, poplex, popcontext);
    if (type == "class") return cont(pushlex("form"), className, poplex);
    if (type == "export") return cont(pushlex("stat"), afterExport, poplex);
    if (type == "import") return cont(pushlex("stat"), afterImport, poplex);
    return pass(pushlex("stat"), expression, expect(";"), poplex);
  }
  function expression(type) {
    return expressionInner(type, false);
  }
  function expressionNoComma(type) {
    return expressionInner(type, true);
  }
  function expressionInner(type, noComma) {
    if (cx.state.fatArrowAt == cx.stream.start) {
      var body = noComma ? arrowBodyNoComma : arrowBody;
      if (type == "(") return cont(pushcontext, pushlex(")"), commasep(pattern, ")"), poplex, expect("=>"), body, popcontext);
      else if (type == "variable") return pass(pushcontext, pattern, expect("=>"), body, popcontext);
    }

    var maybeop = noComma ? maybeoperatorNoComma : maybeoperatorComma;
    if (atomicTypes.hasOwnProperty(type)) return cont(maybeop);
    if (type == "function") return cont(functiondef, maybeop);
    if (type == "keyword c") return cont(noComma ? maybeexpressionNoComma : maybeexpression);
    if (type == "(") return cont(pushlex(")"), maybeexpression, comprehension, expect(")"), poplex, maybeop);
    if (type == "operator" || type == "spread") return cont(noComma ? expressionNoComma : expression);
    if (type == "[") return cont(pushlex("]"), arrayLiteral, poplex, maybeop);
    if (type == "{") return contCommasep(objprop, "}", null, maybeop);
    if (type == "quasi") return pass(quasi, maybeop);
    if (type == "new") return cont(maybeTarget(noComma));
    return cont();
  }
  function maybeexpression(type) {
    if (type.match(/[;\}\)\],]/)) return pass();
    return pass(expression);
  }
  function maybeexpressionNoComma(type) {
    if (type.match(/[;\}\)\],]/)) return pass();
    return pass(expressionNoComma);
  }

  function maybeoperatorComma(type, value) {
    if (type == ",") return cont(expression);
    return maybeoperatorNoComma(type, value, false);
  }
  function maybeoperatorNoComma(type, value, noComma) {
    var me = noComma == false ? maybeoperatorComma : maybeoperatorNoComma;
    var expr = noComma == false ? expression : expressionNoComma;
    if (type == "=>") return cont(pushcontext, noComma ? arrowBodyNoComma : arrowBody, popcontext);
    if (type == "operator") {
      if (/\+\+|--/.test(value)) return cont(me);
      if (value == "?") return cont(expression, expect(":"), expr);
      return cont(expr);
    }
    if (type == "quasi") { return pass(quasi, me); }
    if (type == ";") return;
    if (type == "(") return contCommasep(expressionNoComma, ")", "call", me);
    if (type == ".") return cont(property, me);
    if (type == "[") return cont(pushlex("]"), maybeexpression, expect("]"), poplex, me);
  }
  function quasi(type, value) {
    if (type != "quasi") return pass();
    if (value.slice(value.length - 2) != "${") return cont(quasi);
    return cont(expression, continueQuasi);
  }
  function continueQuasi(type) {
    if (type == "}") {
      cx.marked = "string-2";
      cx.state.tokenize = tokenQuasi;
      return cont(quasi);
    }
  }
  function arrowBody(type) {
    findFatArrow(cx.stream, cx.state);
    return pass(type == "{" ? statement : expression);
  }
  function arrowBodyNoComma(type) {
    findFatArrow(cx.stream, cx.state);
    return pass(type == "{" ? statement : expressionNoComma);
  }
  function maybeTarget(noComma) {
    return function(type) {
      if (type == ".") return cont(noComma ? targetNoComma : target);
      else return pass(noComma ? expressionNoComma : expression);
    };
  }
  function target(_, value) {
    if (value == "target") { cx.marked = "keyword"; return cont(maybeoperatorComma); }
  }
  function targetNoComma(_, value) {
    if (value == "target") { cx.marked = "keyword"; return cont(maybeoperatorNoComma); }
  }
  function maybelabel(type) {
    if (type == ":") return cont(poplex, statement);
    return pass(maybeoperatorComma, expect(";"), poplex);
  }
  function property(type) {
    if (type == "variable") {cx.marked = "property"; return cont();}
  }
  function objprop(type, value) {
    if (type == "variable" || cx.style == "keyword") {
      cx.marked = "property";
      if (value == "get" || value == "set") return cont(getterSetter);
      return cont(afterprop);
    } else if (type == "number" || type == "string") {
      cx.marked = jsonldMode ? "property" : (cx.style + " property");
      return cont(afterprop);
    } else if (type == "jsonld-keyword") {
      return cont(afterprop);
    } else if (type == "[") {
      return cont(expression, expect("]"), afterprop);
    } else if (type == "spread") {
      return cont(expression);
    }
  }
  function getterSetter(type) {
    if (type != "variable") return pass(afterprop);
    cx.marked = "property";
    return cont(functiondef);
  }
  function afterprop(type) {
    if (type == ":") return cont(expressionNoComma);
    if (type == "(") return pass(functiondef);
  }
  function commasep(what, end) {
    function proceed(type) {
      if (type == ",") {
        var lex = cx.state.lexical;
        if (lex.info == "call") lex.pos = (lex.pos || 0) + 1;
        return cont(what, proceed);
      }
      if (type == end) return cont();
      return cont(expect(end));
    }
    return function(type) {
      if (type == end) return cont();
      return pass(what, proceed);
    };
  }
  function contCommasep(what, end, info) {
    for (var i = 3; i < arguments.length; i++)
      cx.cc.push(arguments[i]);
    return cont(pushlex(end, info), commasep(what, end), poplex);
  }
  function block(type) {
    if (type == "}") return cont();
    return pass(statement, block);
  }
  function maybetype(type) {
    if (isTS && type == ":") return cont(typedef);
  }
  function maybedefault(_, value) {
    if (value == "=") return cont(expressionNoComma);
  }
  function typedef(type) {
    if (type == "variable") {cx.marked = "variable-3"; return cont();}
  }
  function vardef() {
    return pass(pattern, maybetype, maybeAssign, vardefCont);
  }
  function pattern(type, value) {
    if (type == "variable") { register(value); return cont(); }
    if (type == "spread") return cont(pattern);
    if (type == "[") return contCommasep(pattern, "]");
    if (type == "{") return contCommasep(proppattern, "}");
  }
  function proppattern(type, value) {
    if (type == "variable" && !cx.stream.match(/^\s*:/, false)) {
      register(value);
      return cont(maybeAssign);
    }
    if (type == "variable") cx.marked = "property";
    if (type == "spread") return cont(pattern);
    return cont(expect(":"), pattern, maybeAssign);
  }
  function maybeAssign(_type, value) {
    if (value == "=") return cont(expressionNoComma);
  }
  function vardefCont(type) {
    if (type == ",") return cont(vardef);
  }
  function maybeelse(type, value) {
    if (type == "keyword b" && value == "else") return cont(pushlex("form", "else"), statement, poplex);
  }
  function forspec(type) {
    if (type == "(") return cont(pushlex(")"), forspec1, expect(")"), poplex);
  }
  function forspec1(type) {
    if (type == "var") return cont(vardef, expect(";"), forspec2);
    if (type == ";") return cont(forspec2);
    if (type == "variable") return cont(formaybeinof);
    return pass(expression, expect(";"), forspec2);
  }
  function formaybeinof(_type, value) {
    if (value == "in" || value == "of") { cx.marked = "keyword"; return cont(expression); }
    return cont(maybeoperatorComma, forspec2);
  }
  function forspec2(type, value) {
    if (type == ";") return cont(forspec3);
    if (value == "in" || value == "of") { cx.marked = "keyword"; return cont(expression); }
    return pass(expression, expect(";"), forspec3);
  }
  function forspec3(type) {
    if (type != ")") cont(expression);
  }
  function functiondef(type, value) {
    if (value == "*") {cx.marked = "keyword"; return cont(functiondef);}
    if (type == "variable") {register(value); return cont(functiondef);}
    if (type == "(") return cont(pushcontext, pushlex(")"), commasep(funarg, ")"), poplex, statement, popcontext);
  }
  function funarg(type) {
    if (type == "spread") return cont(funarg);
    return pass(pattern, maybetype, maybedefault);
  }
  function className(type, value) {
    if (type == "variable") {register(value); return cont(classNameAfter);}
  }
  function classNameAfter(type, value) {
    if (value == "extends") return cont(expression, classNameAfter);
    if (type == "{") return cont(pushlex("}"), classBody, poplex);
  }
  function classBody(type, value) {
    if (type == "variable" || cx.style == "keyword") {
      if (value == "static") {
        cx.marked = "keyword";
        return cont(classBody);
      }
      cx.marked = "property";
      if (value == "get" || value == "set") return cont(classGetterSetter, functiondef, classBody);
      return cont(functiondef, classBody);
    }
    if (value == "*") {
      cx.marked = "keyword";
      return cont(classBody);
    }
    if (type == ";") return cont(classBody);
    if (type == "}") return cont();
  }
  function classGetterSetter(type) {
    if (type != "variable") return pass();
    cx.marked = "property";
    return cont();
  }
  function afterExport(_type, value) {
    if (value == "*") { cx.marked = "keyword"; return cont(maybeFrom, expect(";")); }
    if (value == "default") { cx.marked = "keyword"; return cont(expression, expect(";")); }
    return pass(statement);
  }
  function afterImport(type) {
    if (type == "string") return cont();
    return pass(importSpec, maybeFrom);
  }
  function importSpec(type, value) {
    if (type == "{") return contCommasep(importSpec, "}");
    if (type == "variable") register(value);
    if (value == "*") cx.marked = "keyword";
    return cont(maybeAs);
  }
  function maybeAs(_type, value) {
    if (value == "as") { cx.marked = "keyword"; return cont(importSpec); }
  }
  function maybeFrom(_type, value) {
    if (value == "from") { cx.marked = "keyword"; return cont(expression); }
  }
  function arrayLiteral(type) {
    if (type == "]") return cont();
    return pass(expressionNoComma, maybeArrayComprehension);
  }
  function maybeArrayComprehension(type) {
    if (type == "for") return pass(comprehension, expect("]"));
    if (type == ",") return cont(commasep(maybeexpressionNoComma, "]"));
    return pass(commasep(expressionNoComma, "]"));
  }
  function comprehension(type) {
    if (type == "for") return cont(forspec, comprehension);
    if (type == "if") return cont(expression, comprehension);
  }

  function isContinuedStatement(state, textAfter) {
    return state.lastType == "operator" || state.lastType == "," ||
      isOperatorChar.test(textAfter.charAt(0)) ||
      /[,.]/.test(textAfter.charAt(0));
  }

  // Interface

  return {
    startState: function(basecolumn) {
      var state = {
        tokenize: tokenBase,
        lastType: "sof",
        cc: [],
        lexical: new JSLexical((basecolumn || 0) - indentUnit, 0, "block", false),
        localVars: parserConfig.localVars,
        context: parserConfig.localVars && {vars: parserConfig.localVars},
        indented: 0
      };
      if (parserConfig.globalVars && typeof parserConfig.globalVars == "object")
        state.globalVars = parserConfig.globalVars;
      return state;
    },

    token: function(stream, state) {
      if (stream.sol()) {
        if (!state.lexical.hasOwnProperty("align"))
          state.lexical.align = false;
        state.indented = stream.indentation();
        findFatArrow(stream, state);
      }
      if (state.tokenize != tokenComment && stream.eatSpace()) return null;
      var style = state.tokenize(stream, state);
      if (type == "comment") return style;
      state.lastType = type == "operator" && (content == "++" || content == "--") ? "incdec" : type;
      return parseJS(state, style, type, content, stream);
    },

    indent: function(state, textAfter) {
      if (state.tokenize == tokenComment) return CodeMirror.Pass;
      if (state.tokenize != tokenBase) return 0;
      var firstChar = textAfter && textAfter.charAt(0), lexical = state.lexical;
      // Kludge to prevent 'maybelse' from blocking lexical scope pops
      if (!/^\s*else\b/.test(textAfter)) for (var i = state.cc.length - 1; i >= 0; --i) {
        var c = state.cc[i];
        if (c == poplex) lexical = lexical.prev;
        else if (c != maybeelse) break;
      }
      if (lexical.type == "stat" && firstChar == "}") lexical = lexical.prev;
      if (statementIndent && lexical.type == ")" && lexical.prev.type == "stat")
        lexical = lexical.prev;
      var type = lexical.type, closing = firstChar == type;

      if (type == "vardef") return lexical.indented + (state.lastType == "operator" || state.lastType == "," ? lexical.info + 1 : 0);
      else if (type == "form" && firstChar == "{") return lexical.indented;
      else if (type == "form") return lexical.indented + indentUnit;
      else if (type == "stat")
        return lexical.indented + (isContinuedStatement(state, textAfter) ? statementIndent || indentUnit : 0);
      else if (lexical.info == "switch" && !closing && parserConfig.doubleIndentSwitch != false)
        return lexical.indented + (/^(?:case|default)\b/.test(textAfter) ? indentUnit : 2 * indentUnit);
      else if (lexical.align) return lexical.column + (closing ? 0 : 1);
      else return lexical.indented + (closing ? 0 : indentUnit);
    },

    electricInput: /^\s*(?:case .*?:|default:|\{|\})$/,
    blockCommentStart: jsonMode ? null : "/*",
    blockCommentEnd: jsonMode ? null : "*/",
    lineComment: jsonMode ? null : "//",
    fold: "brace",
    closeBrackets: "()[]{}''\"\"``",

    helperType: jsonMode ? "json" : "javascript",
    jsonldMode: jsonldMode,
    jsonMode: jsonMode
  };
});

CodeMirror.registerHelper("wordChars", "javascript", /[\w$]/);

CodeMirror.defineMIME("text/javascript", "javascript");
CodeMirror.defineMIME("text/ecmascript", "javascript");
CodeMirror.defineMIME("application/javascript", "javascript");
CodeMirror.defineMIME("application/x-javascript", "javascript");
CodeMirror.defineMIME("application/ecmascript", "javascript");
CodeMirror.defineMIME("application/json", {name: "javascript", json: true});
CodeMirror.defineMIME("application/x-json", {name: "javascript", json: true});
CodeMirror.defineMIME("application/ld+json", {name: "javascript", jsonld: true});
CodeMirror.defineMIME("text/typescript", { name: "javascript", typescript: true });
CodeMirror.defineMIME("application/typescript", { name: "javascript", typescript: true });

});

},{"../../lib/codemirror":4}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqcy9naWJiZXIuanMiLCJqcy9pbmRleC5qcyIsImpzL21pZGkuanMiLCJub2RlX21vZHVsZXMvY29kZW1pcnJvci9saWIvY29kZW1pcnJvci5qcyIsIm5vZGVfbW9kdWxlcy9jb2RlbWlycm9yL21vZGUvamF2YXNjcmlwdC9qYXZhc2NyaXB0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hxUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIhZnVuY3Rpb24oKSB7XG5cbnZhciBDb2RlTWlycm9yID0gcmVxdWlyZSggJ2NvZGVtaXJyb3InIClcblxucmVxdWlyZSggJy4uL25vZGVfbW9kdWxlcy9jb2RlbWlycm9yL21vZGUvamF2YXNjcmlwdC9qYXZhc2NyaXB0LmpzJyApXG5cbnZhciBHaWJiZXIgPSB7XG4gIGNvZGVtaXJyb3I6IG51bGwsXG4gIG1heDogbnVsbCxcbiAgTUlESTogcmVxdWlyZSggJy4vbWlkaS5qcycgKSxcbiAgdGVzdDogZnVuY3Rpb24oKSB7IGNvbnNvbGUubG9nKCd0ZXN0JykgfSxcbiAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5tYXggPSB3aW5kb3cubWF4XG4gICAgdGhpcy5jcmVhdGVDb2RlTWlycm9yKClcbiAgfSxcbiAgY3JlYXRlQ29kZU1pcnJvcjogZnVuY3Rpb24oKSB7XG4gICAgQ29kZU1pcnJvci5rZXlNYXAuZ2liYmVyID0gdGhpcy5rZXltYXBcbiAgICB2YXIgY20gPSBDb2RlTWlycm9yKCBkb2N1bWVudC5ib2R5LCB7IG1vZGU6XCJqYXZhc2NyaXB0XCIsIGtleU1hcDonZ2liYmVyJyB9KSBcbiAgICB0aGlzLmNvZGVtaXJyb3IgPSBjbVxuICB9LFxuICBsb2c6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoIGFyZ3VtZW50cywgMCApXG5cbiAgICAvL3dpbmRvdy5tYXgub3V0bGV0KCAndGVzdCcgKSAvLyBhcmdzLmpvaW4oJyB8ICcgKSApXG4gIH0sXG4gIGtleW1hcCA6IHtcbiAgICBmYWxsdGhyb3VnaDonZGVmYXVsdCcsXG4gICAgJ0N0cmwtRW50ZXInOiBmdW5jdGlvbiggY20gKSB7XG4gICAgICB0cnkge1xuICAgICAgICB2YXIgc2VsZWN0ZWRDb2RlID0gR2liYmVyLmdldFNlbGVjdGlvbkNvZGVDb2x1bW4oIEdpYmJlci5jb2RlbWlycm9yLCBmYWxzZSApXG5cbiAgICAgICAgZXZhbCggc2VsZWN0ZWRDb2RlLmNvZGUgKVxuICAgICAgICBHaWJiZXIuZmxhc2goIEdpYmJlci5jb2RlbWlycm9yLCBzZWxlY3RlZENvZGUuc2VsZWN0aW9uIClcbiAgICAgICAgY29uc29sZS5sb2coIHNlbGVjdGVkQ29kZS5jb2RlICkgXG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiRVJST1JcIilcbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gXHRnZXRTZWxlY3Rpb25Db2RlQ29sdW1uIDogZnVuY3Rpb24oIGNtLCBmaW5kQmxvY2sgKSB7XG5cdFx0dmFyIHBvcyA9IGNtLmdldEN1cnNvcigpLCBcblx0XHRcdFx0dGV4dCA9IG51bGxcbiBcbiAgXHRpZiggIWZpbmRCbG9jayApIHtcbiAgICAgIHRleHQgPSBjbS5nZXREb2MoKS5nZXRTZWxlY3Rpb24oKVxuXG4gICAgICBpZiAoIHRleHQgPT09IFwiXCIpIHtcbiAgICAgICAgdGV4dCA9IGNtLmdldExpbmUoIHBvcy5saW5lIClcbiAgICAgIH1lbHNle1xuICAgICAgICBwb3MgPSB7IHN0YXJ0OiBjbS5nZXRDdXJzb3IoJ3N0YXJ0JyksIGVuZDogY20uZ2V0Q3Vyc29yKCdlbmQnKSB9XG4gICAgICAgIC8vcG9zID0gbnVsbFxuICAgICAgfVxuICAgIH1lbHNle1xuICAgICAgdmFyIHN0YXJ0bGluZSA9IHBvcy5saW5lLCBcbiAgICAgICAgICBlbmRsaW5lID0gcG9zLmxpbmUsXG4gICAgICAgICAgcG9zMSwgcG9zMiwgc2VsXG4gICAgXG4gICAgICB3aGlsZSAoIHN0YXJ0bGluZSA+IDAgJiYgY20uZ2V0TGluZSggc3RhcnRsaW5lICkgIT09IFwiXCIgKSB7IHN0YXJ0bGluZS0tIH1cbiAgICAgIHdoaWxlICggZW5kbGluZSA8IGNtLmxpbmVDb3VudCgpICYmIGNtLmdldExpbmUoIGVuZGxpbmUgKSAhPT0gXCJcIiApIHsgZW5kbGluZSsrIH1cbiAgICBcbiAgICAgIHBvczEgPSB7IGxpbmU6IHN0YXJ0bGluZSwgY2g6IDAgfVxuICAgICAgcG9zMiA9IHsgbGluZTogZW5kbGluZSwgY2g6IDAgfVxuICAgIFxuICAgICAgdGV4dCA9IGNtLmdldFJhbmdlKCBwb3MxLCBwb3MyIClcblxuICAgICAgcG9zID0geyBzdGFydDogcG9zMSwgZW5kOiBwb3MyIH1cbiAgICB9XG5cdFx0XG4gICAgLy9HRS5LZXltYXAuZmxhc2goY20sIHBvcylcblx0XHRcblx0XHRyZXR1cm4geyBzZWxlY3Rpb246IHBvcywgY29kZTogdGV4dCB9XG5cdH0sXG4gIGZsYXNoOiBmdW5jdGlvbihjbSwgcG9zKSB7XG4gICAgdmFyIHNlbCxcbiAgICAgICAgY2IgPSBmdW5jdGlvbigpIHsgc2VsLmNsZWFyKCkgfVxuICBcbiAgICBpZiAocG9zICE9PSBudWxsKSB7XG4gICAgICBpZiggcG9zLnN0YXJ0ICkgeyAvLyBpZiBjYWxsZWQgZnJvbSBhIGZpbmRCbG9jayBrZXltYXBcbiAgICAgICAgc2VsID0gY20ubWFya1RleHQoIHBvcy5zdGFydCwgcG9zLmVuZCwgeyBjbGFzc05hbWU6XCJDb2RlTWlycm9yLWhpZ2hsaWdodFwiIH0gKTtcbiAgICAgIH1lbHNleyAvLyBjYWxsZWQgd2l0aCBzaW5nbGUgbGluZVxuICAgICAgICBzZWwgPSBjbS5tYXJrVGV4dCggeyBsaW5lOiBwb3MubGluZSwgY2g6MCB9LCB7IGxpbmU6IHBvcy5saW5lLCBjaDpudWxsIH0sIHsgY2xhc3NOYW1lOiBcIkNvZGVNaXJyb3ItaGlnaGxpZ2h0XCIgfSApXG4gICAgICB9XG4gICAgfWVsc2V7IC8vIGNhbGxlZCB3aXRoIHNlbGVjdGVkIGJsb2NrXG4gICAgICBzZWwgPSBjbS5tYXJrVGV4dCggY20uZ2V0Q3Vyc29yKHRydWUpLCBjbS5nZXRDdXJzb3IoZmFsc2UpLCB7IGNsYXNzTmFtZTogXCJDb2RlTWlycm9yLWhpZ2hsaWdodFwiIH0gKTtcbiAgICB9XG4gIFxuICAgIHdpbmRvdy5zZXRUaW1lb3V0KGNiLCAyNTApO1xuICB9LFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEdpYmJlclxuXG59KClcbiIsIiFmdW5jdGlvbigpIHtcbiAgdmFyIEdpYmJlciA9IHJlcXVpcmUoICcuL2dpYmJlci5qcycgKSxcbiAgICAgIHVzZUF1ZGlvQ29udGV4dCA9IGZhbHNlLFxuICAgICAgY291bnQgPSAwXG4gICAgIFxuICBHaWJiZXIuaW5pdCgpXG4gIHdpbmRvdy5HaWJiZXIgPSBHaWJiZXJcbiAgd2luZG93Lk1JREkgPSBHaWJiZXIuTUlESVxuXG4gIC8vY29uc29sZS5sb2cgPSBHaWJiZXIubG9nLmJpbmQoIEdpYmJlciApIFxuICAvLyBjb25zb2xlLmxvZyggXCJURVNUSU5HXCIgKVxuICAvLyBjdHggPSBuZXcgQXVkaW9Db250ZXh0KClcblxuICAvKmlmKCB1c2VBdWRpb0NvbnRleHQgKSB7Ki9cbiAgICAvL3ZhciBjdHggPSBuZXcgQXVkaW9Db250ZXh0KCksXG4gICAgICAgIC8vY2xvY2sgPSBuZXcgV0FBQ2xvY2soIGN0eCApXG5cbiAgICAvL2Nsb2NrLnN0YXJ0KClcblxuICAgIC8vY2xvY2suc2V0VGltZW91dCggdGltZW91dCwgMCApLnJlcGVhdCggMSApIFxuXG4gIC8vfWVsc2V7XG4gICAvLy8vIHNldEludGVydmFsKCB0aW1lb3V0LCAxMDAwICkgXG4gIC8qfSovXG5cbn0oKVxuIiwiIWZ1bmN0aW9uKCkge1xuXG52YXIgTUlESSA9IHtcbiAgbm90ZSA6IGZ1bmN0aW9uKCBub3RlbnVtLCB2ZWxvY2l0eSwgZHVyYXRpb24gKSB7XG4gICAgd2luZG93Lm9wZW4oICdtYXhtZXNzYWdlOm1pZGkvbm90ZW9uLycgKyBub3RlbnVtICsgJy8nICsgdmVsb2NpdHkgKyAnLycgKyBkdXJhdGlvbiApXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBNSURJXG59KClcbiIsIi8vIENvZGVNaXJyb3IsIGNvcHlyaWdodCAoYykgYnkgTWFyaWpuIEhhdmVyYmVrZSBhbmQgb3RoZXJzXG4vLyBEaXN0cmlidXRlZCB1bmRlciBhbiBNSVQgbGljZW5zZTogaHR0cDovL2NvZGVtaXJyb3IubmV0L0xJQ0VOU0VcblxuLy8gVGhpcyBpcyBDb2RlTWlycm9yIChodHRwOi8vY29kZW1pcnJvci5uZXQpLCBhIGNvZGUgZWRpdG9yXG4vLyBpbXBsZW1lbnRlZCBpbiBKYXZhU2NyaXB0IG9uIHRvcCBvZiB0aGUgYnJvd3NlcidzIERPTS5cbi8vXG4vLyBZb3UgY2FuIGZpbmQgc29tZSB0ZWNobmljYWwgYmFja2dyb3VuZCBmb3Igc29tZSBvZiB0aGUgY29kZSBiZWxvd1xuLy8gYXQgaHR0cDovL21hcmlqbmhhdmVyYmVrZS5ubC9ibG9nLyNjbS1pbnRlcm5hbHMgLlxuXG4oZnVuY3Rpb24obW9kKSB7XG4gIGlmICh0eXBlb2YgZXhwb3J0cyA9PSBcIm9iamVjdFwiICYmIHR5cGVvZiBtb2R1bGUgPT0gXCJvYmplY3RcIikgLy8gQ29tbW9uSlNcbiAgICBtb2R1bGUuZXhwb3J0cyA9IG1vZCgpO1xuICBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kKSAvLyBBTURcbiAgICByZXR1cm4gZGVmaW5lKFtdLCBtb2QpO1xuICBlbHNlIC8vIFBsYWluIGJyb3dzZXIgZW52XG4gICAgdGhpcy5Db2RlTWlycm9yID0gbW9kKCk7XG59KShmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgLy8gQlJPV1NFUiBTTklGRklOR1xuXG4gIC8vIEtsdWRnZXMgZm9yIGJ1Z3MgYW5kIGJlaGF2aW9yIGRpZmZlcmVuY2VzIHRoYXQgY2FuJ3QgYmUgZmVhdHVyZVxuICAvLyBkZXRlY3RlZCBhcmUgZW5hYmxlZCBiYXNlZCBvbiB1c2VyQWdlbnQgZXRjIHNuaWZmaW5nLlxuICB2YXIgdXNlckFnZW50ID0gbmF2aWdhdG9yLnVzZXJBZ2VudDtcbiAgdmFyIHBsYXRmb3JtID0gbmF2aWdhdG9yLnBsYXRmb3JtO1xuXG4gIHZhciBnZWNrbyA9IC9nZWNrb1xcL1xcZC9pLnRlc3QodXNlckFnZW50KTtcbiAgdmFyIGllX3VwdG8xMCA9IC9NU0lFIFxcZC8udGVzdCh1c2VyQWdlbnQpO1xuICB2YXIgaWVfMTF1cCA9IC9UcmlkZW50XFwvKD86WzctOV18XFxkezIsfSlcXC4uKnJ2OihcXGQrKS8uZXhlYyh1c2VyQWdlbnQpO1xuICB2YXIgaWUgPSBpZV91cHRvMTAgfHwgaWVfMTF1cDtcbiAgdmFyIGllX3ZlcnNpb24gPSBpZSAmJiAoaWVfdXB0bzEwID8gZG9jdW1lbnQuZG9jdW1lbnRNb2RlIHx8IDYgOiBpZV8xMXVwWzFdKTtcbiAgdmFyIHdlYmtpdCA9IC9XZWJLaXRcXC8vLnRlc3QodXNlckFnZW50KTtcbiAgdmFyIHF0d2Via2l0ID0gd2Via2l0ICYmIC9RdFxcL1xcZCtcXC5cXGQrLy50ZXN0KHVzZXJBZ2VudCk7XG4gIHZhciBjaHJvbWUgPSAvQ2hyb21lXFwvLy50ZXN0KHVzZXJBZ2VudCk7XG4gIHZhciBwcmVzdG8gPSAvT3BlcmFcXC8vLnRlc3QodXNlckFnZW50KTtcbiAgdmFyIHNhZmFyaSA9IC9BcHBsZSBDb21wdXRlci8udGVzdChuYXZpZ2F0b3IudmVuZG9yKTtcbiAgdmFyIG1hY19nZU1vdW50YWluTGlvbiA9IC9NYWMgT1MgWCAxXFxkXFxEKFs4LTldfFxcZFxcZClcXEQvLnRlc3QodXNlckFnZW50KTtcbiAgdmFyIHBoYW50b20gPSAvUGhhbnRvbUpTLy50ZXN0KHVzZXJBZ2VudCk7XG5cbiAgdmFyIGlvcyA9IC9BcHBsZVdlYktpdC8udGVzdCh1c2VyQWdlbnQpICYmIC9Nb2JpbGVcXC9cXHcrLy50ZXN0KHVzZXJBZ2VudCk7XG4gIC8vIFRoaXMgaXMgd29lZnVsbHkgaW5jb21wbGV0ZS4gU3VnZ2VzdGlvbnMgZm9yIGFsdGVybmF0aXZlIG1ldGhvZHMgd2VsY29tZS5cbiAgdmFyIG1vYmlsZSA9IGlvcyB8fCAvQW5kcm9pZHx3ZWJPU3xCbGFja0JlcnJ5fE9wZXJhIE1pbml8T3BlcmEgTW9iaXxJRU1vYmlsZS9pLnRlc3QodXNlckFnZW50KTtcbiAgdmFyIG1hYyA9IGlvcyB8fCAvTWFjLy50ZXN0KHBsYXRmb3JtKTtcbiAgdmFyIHdpbmRvd3MgPSAvd2luL2kudGVzdChwbGF0Zm9ybSk7XG5cbiAgdmFyIHByZXN0b192ZXJzaW9uID0gcHJlc3RvICYmIHVzZXJBZ2VudC5tYXRjaCgvVmVyc2lvblxcLyhcXGQqXFwuXFxkKikvKTtcbiAgaWYgKHByZXN0b192ZXJzaW9uKSBwcmVzdG9fdmVyc2lvbiA9IE51bWJlcihwcmVzdG9fdmVyc2lvblsxXSk7XG4gIGlmIChwcmVzdG9fdmVyc2lvbiAmJiBwcmVzdG9fdmVyc2lvbiA+PSAxNSkgeyBwcmVzdG8gPSBmYWxzZTsgd2Via2l0ID0gdHJ1ZTsgfVxuICAvLyBTb21lIGJyb3dzZXJzIHVzZSB0aGUgd3JvbmcgZXZlbnQgcHJvcGVydGllcyB0byBzaWduYWwgY21kL2N0cmwgb24gT1MgWFxuICB2YXIgZmxpcEN0cmxDbWQgPSBtYWMgJiYgKHF0d2Via2l0IHx8IHByZXN0byAmJiAocHJlc3RvX3ZlcnNpb24gPT0gbnVsbCB8fCBwcmVzdG9fdmVyc2lvbiA8IDEyLjExKSk7XG4gIHZhciBjYXB0dXJlUmlnaHRDbGljayA9IGdlY2tvIHx8IChpZSAmJiBpZV92ZXJzaW9uID49IDkpO1xuXG4gIC8vIE9wdGltaXplIHNvbWUgY29kZSB3aGVuIHRoZXNlIGZlYXR1cmVzIGFyZSBub3QgdXNlZC5cbiAgdmFyIHNhd1JlYWRPbmx5U3BhbnMgPSBmYWxzZSwgc2F3Q29sbGFwc2VkU3BhbnMgPSBmYWxzZTtcblxuICAvLyBFRElUT1IgQ09OU1RSVUNUT1JcblxuICAvLyBBIENvZGVNaXJyb3IgaW5zdGFuY2UgcmVwcmVzZW50cyBhbiBlZGl0b3IuIFRoaXMgaXMgdGhlIG9iamVjdFxuICAvLyB0aGF0IHVzZXIgY29kZSBpcyB1c3VhbGx5IGRlYWxpbmcgd2l0aC5cblxuICBmdW5jdGlvbiBDb2RlTWlycm9yKHBsYWNlLCBvcHRpb25zKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIENvZGVNaXJyb3IpKSByZXR1cm4gbmV3IENvZGVNaXJyb3IocGxhY2UsIG9wdGlvbnMpO1xuXG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucyA9IG9wdGlvbnMgPyBjb3B5T2JqKG9wdGlvbnMpIDoge307XG4gICAgLy8gRGV0ZXJtaW5lIGVmZmVjdGl2ZSBvcHRpb25zIGJhc2VkIG9uIGdpdmVuIHZhbHVlcyBhbmQgZGVmYXVsdHMuXG4gICAgY29weU9iaihkZWZhdWx0cywgb3B0aW9ucywgZmFsc2UpO1xuICAgIHNldEd1dHRlcnNGb3JMaW5lTnVtYmVycyhvcHRpb25zKTtcblxuICAgIHZhciBkb2MgPSBvcHRpb25zLnZhbHVlO1xuICAgIGlmICh0eXBlb2YgZG9jID09IFwic3RyaW5nXCIpIGRvYyA9IG5ldyBEb2MoZG9jLCBvcHRpb25zLm1vZGUsIG51bGwsIG9wdGlvbnMubGluZVNlcGFyYXRvcik7XG4gICAgdGhpcy5kb2MgPSBkb2M7XG5cbiAgICB2YXIgaW5wdXQgPSBuZXcgQ29kZU1pcnJvci5pbnB1dFN0eWxlc1tvcHRpb25zLmlucHV0U3R5bGVdKHRoaXMpO1xuICAgIHZhciBkaXNwbGF5ID0gdGhpcy5kaXNwbGF5ID0gbmV3IERpc3BsYXkocGxhY2UsIGRvYywgaW5wdXQpO1xuICAgIGRpc3BsYXkud3JhcHBlci5Db2RlTWlycm9yID0gdGhpcztcbiAgICB1cGRhdGVHdXR0ZXJzKHRoaXMpO1xuICAgIHRoZW1lQ2hhbmdlZCh0aGlzKTtcbiAgICBpZiAob3B0aW9ucy5saW5lV3JhcHBpbmcpXG4gICAgICB0aGlzLmRpc3BsYXkud3JhcHBlci5jbGFzc05hbWUgKz0gXCIgQ29kZU1pcnJvci13cmFwXCI7XG4gICAgaWYgKG9wdGlvbnMuYXV0b2ZvY3VzICYmICFtb2JpbGUpIGRpc3BsYXkuaW5wdXQuZm9jdXMoKTtcbiAgICBpbml0U2Nyb2xsYmFycyh0aGlzKTtcblxuICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICBrZXlNYXBzOiBbXSwgIC8vIHN0b3JlcyBtYXBzIGFkZGVkIGJ5IGFkZEtleU1hcFxuICAgICAgb3ZlcmxheXM6IFtdLCAvLyBoaWdobGlnaHRpbmcgb3ZlcmxheXMsIGFzIGFkZGVkIGJ5IGFkZE92ZXJsYXlcbiAgICAgIG1vZGVHZW46IDAsICAgLy8gYnVtcGVkIHdoZW4gbW9kZS9vdmVybGF5IGNoYW5nZXMsIHVzZWQgdG8gaW52YWxpZGF0ZSBoaWdobGlnaHRpbmcgaW5mb1xuICAgICAgb3ZlcndyaXRlOiBmYWxzZSxcbiAgICAgIGRlbGF5aW5nQmx1ckV2ZW50OiBmYWxzZSxcbiAgICAgIGZvY3VzZWQ6IGZhbHNlLFxuICAgICAgc3VwcHJlc3NFZGl0czogZmFsc2UsIC8vIHVzZWQgdG8gZGlzYWJsZSBlZGl0aW5nIGR1cmluZyBrZXkgaGFuZGxlcnMgd2hlbiBpbiByZWFkT25seSBtb2RlXG4gICAgICBwYXN0ZUluY29taW5nOiBmYWxzZSwgY3V0SW5jb21pbmc6IGZhbHNlLCAvLyBoZWxwIHJlY29nbml6ZSBwYXN0ZS9jdXQgZWRpdHMgaW4gaW5wdXQucG9sbFxuICAgICAgc2VsZWN0aW5nVGV4dDogZmFsc2UsXG4gICAgICBkcmFnZ2luZ1RleHQ6IGZhbHNlLFxuICAgICAgaGlnaGxpZ2h0OiBuZXcgRGVsYXllZCgpLCAvLyBzdG9yZXMgaGlnaGxpZ2h0IHdvcmtlciB0aW1lb3V0XG4gICAgICBrZXlTZXE6IG51bGwsICAvLyBVbmZpbmlzaGVkIGtleSBzZXF1ZW5jZVxuICAgICAgc3BlY2lhbENoYXJzOiBudWxsXG4gICAgfTtcblxuICAgIHZhciBjbSA9IHRoaXM7XG5cbiAgICAvLyBPdmVycmlkZSBtYWdpYyB0ZXh0YXJlYSBjb250ZW50IHJlc3RvcmUgdGhhdCBJRSBzb21ldGltZXMgZG9lc1xuICAgIC8vIG9uIG91ciBoaWRkZW4gdGV4dGFyZWEgb24gcmVsb2FkXG4gICAgaWYgKGllICYmIGllX3ZlcnNpb24gPCAxMSkgc2V0VGltZW91dChmdW5jdGlvbigpIHsgY20uZGlzcGxheS5pbnB1dC5yZXNldCh0cnVlKTsgfSwgMjApO1xuXG4gICAgcmVnaXN0ZXJFdmVudEhhbmRsZXJzKHRoaXMpO1xuICAgIGVuc3VyZUdsb2JhbEhhbmRsZXJzKCk7XG5cbiAgICBzdGFydE9wZXJhdGlvbih0aGlzKTtcbiAgICB0aGlzLmN1ck9wLmZvcmNlVXBkYXRlID0gdHJ1ZTtcbiAgICBhdHRhY2hEb2ModGhpcywgZG9jKTtcblxuICAgIGlmICgob3B0aW9ucy5hdXRvZm9jdXMgJiYgIW1vYmlsZSkgfHwgY20uaGFzRm9jdXMoKSlcbiAgICAgIHNldFRpbWVvdXQoYmluZChvbkZvY3VzLCB0aGlzKSwgMjApO1xuICAgIGVsc2VcbiAgICAgIG9uQmx1cih0aGlzKTtcblxuICAgIGZvciAodmFyIG9wdCBpbiBvcHRpb25IYW5kbGVycykgaWYgKG9wdGlvbkhhbmRsZXJzLmhhc093blByb3BlcnR5KG9wdCkpXG4gICAgICBvcHRpb25IYW5kbGVyc1tvcHRdKHRoaXMsIG9wdGlvbnNbb3B0XSwgSW5pdCk7XG4gICAgbWF5YmVVcGRhdGVMaW5lTnVtYmVyV2lkdGgodGhpcyk7XG4gICAgaWYgKG9wdGlvbnMuZmluaXNoSW5pdCkgb3B0aW9ucy5maW5pc2hJbml0KHRoaXMpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaW5pdEhvb2tzLmxlbmd0aDsgKytpKSBpbml0SG9va3NbaV0odGhpcyk7XG4gICAgZW5kT3BlcmF0aW9uKHRoaXMpO1xuICAgIC8vIFN1cHByZXNzIG9wdGltaXplbGVnaWJpbGl0eSBpbiBXZWJraXQsIHNpbmNlIGl0IGJyZWFrcyB0ZXh0XG4gICAgLy8gbWVhc3VyaW5nIG9uIGxpbmUgd3JhcHBpbmcgYm91bmRhcmllcy5cbiAgICBpZiAod2Via2l0ICYmIG9wdGlvbnMubGluZVdyYXBwaW5nICYmXG4gICAgICAgIGdldENvbXB1dGVkU3R5bGUoZGlzcGxheS5saW5lRGl2KS50ZXh0UmVuZGVyaW5nID09IFwib3B0aW1pemVsZWdpYmlsaXR5XCIpXG4gICAgICBkaXNwbGF5LmxpbmVEaXYuc3R5bGUudGV4dFJlbmRlcmluZyA9IFwiYXV0b1wiO1xuICB9XG5cbiAgLy8gRElTUExBWSBDT05TVFJVQ1RPUlxuXG4gIC8vIFRoZSBkaXNwbGF5IGhhbmRsZXMgdGhlIERPTSBpbnRlZ3JhdGlvbiwgYm90aCBmb3IgaW5wdXQgcmVhZGluZ1xuICAvLyBhbmQgY29udGVudCBkcmF3aW5nLiBJdCBob2xkcyByZWZlcmVuY2VzIHRvIERPTSBub2RlcyBhbmRcbiAgLy8gZGlzcGxheS1yZWxhdGVkIHN0YXRlLlxuXG4gIGZ1bmN0aW9uIERpc3BsYXkocGxhY2UsIGRvYywgaW5wdXQpIHtcbiAgICB2YXIgZCA9IHRoaXM7XG4gICAgdGhpcy5pbnB1dCA9IGlucHV0O1xuXG4gICAgLy8gQ292ZXJzIGJvdHRvbS1yaWdodCBzcXVhcmUgd2hlbiBib3RoIHNjcm9sbGJhcnMgYXJlIHByZXNlbnQuXG4gICAgZC5zY3JvbGxiYXJGaWxsZXIgPSBlbHQoXCJkaXZcIiwgbnVsbCwgXCJDb2RlTWlycm9yLXNjcm9sbGJhci1maWxsZXJcIik7XG4gICAgZC5zY3JvbGxiYXJGaWxsZXIuc2V0QXR0cmlidXRlKFwiY20tbm90LWNvbnRlbnRcIiwgXCJ0cnVlXCIpO1xuICAgIC8vIENvdmVycyBib3R0b20gb2YgZ3V0dGVyIHdoZW4gY292ZXJHdXR0ZXJOZXh0VG9TY3JvbGxiYXIgaXMgb25cbiAgICAvLyBhbmQgaCBzY3JvbGxiYXIgaXMgcHJlc2VudC5cbiAgICBkLmd1dHRlckZpbGxlciA9IGVsdChcImRpdlwiLCBudWxsLCBcIkNvZGVNaXJyb3ItZ3V0dGVyLWZpbGxlclwiKTtcbiAgICBkLmd1dHRlckZpbGxlci5zZXRBdHRyaWJ1dGUoXCJjbS1ub3QtY29udGVudFwiLCBcInRydWVcIik7XG4gICAgLy8gV2lsbCBjb250YWluIHRoZSBhY3R1YWwgY29kZSwgcG9zaXRpb25lZCB0byBjb3ZlciB0aGUgdmlld3BvcnQuXG4gICAgZC5saW5lRGl2ID0gZWx0KFwiZGl2XCIsIG51bGwsIFwiQ29kZU1pcnJvci1jb2RlXCIpO1xuICAgIC8vIEVsZW1lbnRzIGFyZSBhZGRlZCB0byB0aGVzZSB0byByZXByZXNlbnQgc2VsZWN0aW9uIGFuZCBjdXJzb3JzLlxuICAgIGQuc2VsZWN0aW9uRGl2ID0gZWx0KFwiZGl2XCIsIG51bGwsIG51bGwsIFwicG9zaXRpb246IHJlbGF0aXZlOyB6LWluZGV4OiAxXCIpO1xuICAgIGQuY3Vyc29yRGl2ID0gZWx0KFwiZGl2XCIsIG51bGwsIFwiQ29kZU1pcnJvci1jdXJzb3JzXCIpO1xuICAgIC8vIEEgdmlzaWJpbGl0eTogaGlkZGVuIGVsZW1lbnQgdXNlZCB0byBmaW5kIHRoZSBzaXplIG9mIHRoaW5ncy5cbiAgICBkLm1lYXN1cmUgPSBlbHQoXCJkaXZcIiwgbnVsbCwgXCJDb2RlTWlycm9yLW1lYXN1cmVcIik7XG4gICAgLy8gV2hlbiBsaW5lcyBvdXRzaWRlIG9mIHRoZSB2aWV3cG9ydCBhcmUgbWVhc3VyZWQsIHRoZXkgYXJlIGRyYXduIGluIHRoaXMuXG4gICAgZC5saW5lTWVhc3VyZSA9IGVsdChcImRpdlwiLCBudWxsLCBcIkNvZGVNaXJyb3ItbWVhc3VyZVwiKTtcbiAgICAvLyBXcmFwcyBldmVyeXRoaW5nIHRoYXQgbmVlZHMgdG8gZXhpc3QgaW5zaWRlIHRoZSB2ZXJ0aWNhbGx5LXBhZGRlZCBjb29yZGluYXRlIHN5c3RlbVxuICAgIGQubGluZVNwYWNlID0gZWx0KFwiZGl2XCIsIFtkLm1lYXN1cmUsIGQubGluZU1lYXN1cmUsIGQuc2VsZWN0aW9uRGl2LCBkLmN1cnNvckRpdiwgZC5saW5lRGl2XSxcbiAgICAgICAgICAgICAgICAgICAgICBudWxsLCBcInBvc2l0aW9uOiByZWxhdGl2ZTsgb3V0bGluZTogbm9uZVwiKTtcbiAgICAvLyBNb3ZlZCBhcm91bmQgaXRzIHBhcmVudCB0byBjb3ZlciB2aXNpYmxlIHZpZXcuXG4gICAgZC5tb3ZlciA9IGVsdChcImRpdlwiLCBbZWx0KFwiZGl2XCIsIFtkLmxpbmVTcGFjZV0sIFwiQ29kZU1pcnJvci1saW5lc1wiKV0sIG51bGwsIFwicG9zaXRpb246IHJlbGF0aXZlXCIpO1xuICAgIC8vIFNldCB0byB0aGUgaGVpZ2h0IG9mIHRoZSBkb2N1bWVudCwgYWxsb3dpbmcgc2Nyb2xsaW5nLlxuICAgIGQuc2l6ZXIgPSBlbHQoXCJkaXZcIiwgW2QubW92ZXJdLCBcIkNvZGVNaXJyb3Itc2l6ZXJcIik7XG4gICAgZC5zaXplcldpZHRoID0gbnVsbDtcbiAgICAvLyBCZWhhdmlvciBvZiBlbHRzIHdpdGggb3ZlcmZsb3c6IGF1dG8gYW5kIHBhZGRpbmcgaXNcbiAgICAvLyBpbmNvbnNpc3RlbnQgYWNyb3NzIGJyb3dzZXJzLiBUaGlzIGlzIHVzZWQgdG8gZW5zdXJlIHRoZVxuICAgIC8vIHNjcm9sbGFibGUgYXJlYSBpcyBiaWcgZW5vdWdoLlxuICAgIGQuaGVpZ2h0Rm9yY2VyID0gZWx0KFwiZGl2XCIsIG51bGwsIG51bGwsIFwicG9zaXRpb246IGFic29sdXRlOyBoZWlnaHQ6IFwiICsgc2Nyb2xsZXJHYXAgKyBcInB4OyB3aWR0aDogMXB4O1wiKTtcbiAgICAvLyBXaWxsIGNvbnRhaW4gdGhlIGd1dHRlcnMsIGlmIGFueS5cbiAgICBkLmd1dHRlcnMgPSBlbHQoXCJkaXZcIiwgbnVsbCwgXCJDb2RlTWlycm9yLWd1dHRlcnNcIik7XG4gICAgZC5saW5lR3V0dGVyID0gbnVsbDtcbiAgICAvLyBBY3R1YWwgc2Nyb2xsYWJsZSBlbGVtZW50LlxuICAgIGQuc2Nyb2xsZXIgPSBlbHQoXCJkaXZcIiwgW2Quc2l6ZXIsIGQuaGVpZ2h0Rm9yY2VyLCBkLmd1dHRlcnNdLCBcIkNvZGVNaXJyb3Itc2Nyb2xsXCIpO1xuICAgIGQuc2Nyb2xsZXIuc2V0QXR0cmlidXRlKFwidGFiSW5kZXhcIiwgXCItMVwiKTtcbiAgICAvLyBUaGUgZWxlbWVudCBpbiB3aGljaCB0aGUgZWRpdG9yIGxpdmVzLlxuICAgIGQud3JhcHBlciA9IGVsdChcImRpdlwiLCBbZC5zY3JvbGxiYXJGaWxsZXIsIGQuZ3V0dGVyRmlsbGVyLCBkLnNjcm9sbGVyXSwgXCJDb2RlTWlycm9yXCIpO1xuXG4gICAgLy8gV29yayBhcm91bmQgSUU3IHotaW5kZXggYnVnIChub3QgcGVyZmVjdCwgaGVuY2UgSUU3IG5vdCByZWFsbHkgYmVpbmcgc3VwcG9ydGVkKVxuICAgIGlmIChpZSAmJiBpZV92ZXJzaW9uIDwgOCkgeyBkLmd1dHRlcnMuc3R5bGUuekluZGV4ID0gLTE7IGQuc2Nyb2xsZXIuc3R5bGUucGFkZGluZ1JpZ2h0ID0gMDsgfVxuICAgIGlmICghd2Via2l0ICYmICEoZ2Vja28gJiYgbW9iaWxlKSkgZC5zY3JvbGxlci5kcmFnZ2FibGUgPSB0cnVlO1xuXG4gICAgaWYgKHBsYWNlKSB7XG4gICAgICBpZiAocGxhY2UuYXBwZW5kQ2hpbGQpIHBsYWNlLmFwcGVuZENoaWxkKGQud3JhcHBlcik7XG4gICAgICBlbHNlIHBsYWNlKGQud3JhcHBlcik7XG4gICAgfVxuXG4gICAgLy8gQ3VycmVudCByZW5kZXJlZCByYW5nZSAobWF5IGJlIGJpZ2dlciB0aGFuIHRoZSB2aWV3IHdpbmRvdykuXG4gICAgZC52aWV3RnJvbSA9IGQudmlld1RvID0gZG9jLmZpcnN0O1xuICAgIGQucmVwb3J0ZWRWaWV3RnJvbSA9IGQucmVwb3J0ZWRWaWV3VG8gPSBkb2MuZmlyc3Q7XG4gICAgLy8gSW5mb3JtYXRpb24gYWJvdXQgdGhlIHJlbmRlcmVkIGxpbmVzLlxuICAgIGQudmlldyA9IFtdO1xuICAgIGQucmVuZGVyZWRWaWV3ID0gbnVsbDtcbiAgICAvLyBIb2xkcyBpbmZvIGFib3V0IGEgc2luZ2xlIHJlbmRlcmVkIGxpbmUgd2hlbiBpdCB3YXMgcmVuZGVyZWRcbiAgICAvLyBmb3IgbWVhc3VyZW1lbnQsIHdoaWxlIG5vdCBpbiB2aWV3LlxuICAgIGQuZXh0ZXJuYWxNZWFzdXJlZCA9IG51bGw7XG4gICAgLy8gRW1wdHkgc3BhY2UgKGluIHBpeGVscykgYWJvdmUgdGhlIHZpZXdcbiAgICBkLnZpZXdPZmZzZXQgPSAwO1xuICAgIGQubGFzdFdyYXBIZWlnaHQgPSBkLmxhc3RXcmFwV2lkdGggPSAwO1xuICAgIGQudXBkYXRlTGluZU51bWJlcnMgPSBudWxsO1xuXG4gICAgZC5uYXRpdmVCYXJXaWR0aCA9IGQuYmFySGVpZ2h0ID0gZC5iYXJXaWR0aCA9IDA7XG4gICAgZC5zY3JvbGxiYXJzQ2xpcHBlZCA9IGZhbHNlO1xuXG4gICAgLy8gVXNlZCB0byBvbmx5IHJlc2l6ZSB0aGUgbGluZSBudW1iZXIgZ3V0dGVyIHdoZW4gbmVjZXNzYXJ5ICh3aGVuXG4gICAgLy8gdGhlIGFtb3VudCBvZiBsaW5lcyBjcm9zc2VzIGEgYm91bmRhcnkgdGhhdCBtYWtlcyBpdHMgd2lkdGggY2hhbmdlKVxuICAgIGQubGluZU51bVdpZHRoID0gZC5saW5lTnVtSW5uZXJXaWR0aCA9IGQubGluZU51bUNoYXJzID0gbnVsbDtcbiAgICAvLyBTZXQgdG8gdHJ1ZSB3aGVuIGEgbm9uLWhvcml6b250YWwtc2Nyb2xsaW5nIGxpbmUgd2lkZ2V0IGlzXG4gICAgLy8gYWRkZWQuIEFzIGFuIG9wdGltaXphdGlvbiwgbGluZSB3aWRnZXQgYWxpZ25pbmcgaXMgc2tpcHBlZCB3aGVuXG4gICAgLy8gdGhpcyBpcyBmYWxzZS5cbiAgICBkLmFsaWduV2lkZ2V0cyA9IGZhbHNlO1xuXG4gICAgZC5jYWNoZWRDaGFyV2lkdGggPSBkLmNhY2hlZFRleHRIZWlnaHQgPSBkLmNhY2hlZFBhZGRpbmdIID0gbnVsbDtcblxuICAgIC8vIFRyYWNrcyB0aGUgbWF4aW11bSBsaW5lIGxlbmd0aCBzbyB0aGF0IHRoZSBob3Jpem9udGFsIHNjcm9sbGJhclxuICAgIC8vIGNhbiBiZSBrZXB0IHN0YXRpYyB3aGVuIHNjcm9sbGluZy5cbiAgICBkLm1heExpbmUgPSBudWxsO1xuICAgIGQubWF4TGluZUxlbmd0aCA9IDA7XG4gICAgZC5tYXhMaW5lQ2hhbmdlZCA9IGZhbHNlO1xuXG4gICAgLy8gVXNlZCBmb3IgbWVhc3VyaW5nIHdoZWVsIHNjcm9sbGluZyBncmFudWxhcml0eVxuICAgIGQud2hlZWxEWCA9IGQud2hlZWxEWSA9IGQud2hlZWxTdGFydFggPSBkLndoZWVsU3RhcnRZID0gbnVsbDtcblxuICAgIC8vIFRydWUgd2hlbiBzaGlmdCBpcyBoZWxkIGRvd24uXG4gICAgZC5zaGlmdCA9IGZhbHNlO1xuXG4gICAgLy8gVXNlZCB0byB0cmFjayB3aGV0aGVyIGFueXRoaW5nIGhhcHBlbmVkIHNpbmNlIHRoZSBjb250ZXh0IG1lbnVcbiAgICAvLyB3YXMgb3BlbmVkLlxuICAgIGQuc2VsRm9yQ29udGV4dE1lbnUgPSBudWxsO1xuXG4gICAgZC5hY3RpdmVUb3VjaCA9IG51bGw7XG5cbiAgICBpbnB1dC5pbml0KGQpO1xuICB9XG5cbiAgLy8gU1RBVEUgVVBEQVRFU1xuXG4gIC8vIFVzZWQgdG8gZ2V0IHRoZSBlZGl0b3IgaW50byBhIGNvbnNpc3RlbnQgc3RhdGUgYWdhaW4gd2hlbiBvcHRpb25zIGNoYW5nZS5cblxuICBmdW5jdGlvbiBsb2FkTW9kZShjbSkge1xuICAgIGNtLmRvYy5tb2RlID0gQ29kZU1pcnJvci5nZXRNb2RlKGNtLm9wdGlvbnMsIGNtLmRvYy5tb2RlT3B0aW9uKTtcbiAgICByZXNldE1vZGVTdGF0ZShjbSk7XG4gIH1cblxuICBmdW5jdGlvbiByZXNldE1vZGVTdGF0ZShjbSkge1xuICAgIGNtLmRvYy5pdGVyKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgIGlmIChsaW5lLnN0YXRlQWZ0ZXIpIGxpbmUuc3RhdGVBZnRlciA9IG51bGw7XG4gICAgICBpZiAobGluZS5zdHlsZXMpIGxpbmUuc3R5bGVzID0gbnVsbDtcbiAgICB9KTtcbiAgICBjbS5kb2MuZnJvbnRpZXIgPSBjbS5kb2MuZmlyc3Q7XG4gICAgc3RhcnRXb3JrZXIoY20sIDEwMCk7XG4gICAgY20uc3RhdGUubW9kZUdlbisrO1xuICAgIGlmIChjbS5jdXJPcCkgcmVnQ2hhbmdlKGNtKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHdyYXBwaW5nQ2hhbmdlZChjbSkge1xuICAgIGlmIChjbS5vcHRpb25zLmxpbmVXcmFwcGluZykge1xuICAgICAgYWRkQ2xhc3MoY20uZGlzcGxheS53cmFwcGVyLCBcIkNvZGVNaXJyb3Itd3JhcFwiKTtcbiAgICAgIGNtLmRpc3BsYXkuc2l6ZXIuc3R5bGUubWluV2lkdGggPSBcIlwiO1xuICAgICAgY20uZGlzcGxheS5zaXplcldpZHRoID0gbnVsbDtcbiAgICB9IGVsc2Uge1xuICAgICAgcm1DbGFzcyhjbS5kaXNwbGF5LndyYXBwZXIsIFwiQ29kZU1pcnJvci13cmFwXCIpO1xuICAgICAgZmluZE1heExpbmUoY20pO1xuICAgIH1cbiAgICBlc3RpbWF0ZUxpbmVIZWlnaHRzKGNtKTtcbiAgICByZWdDaGFuZ2UoY20pO1xuICAgIGNsZWFyQ2FjaGVzKGNtKTtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7dXBkYXRlU2Nyb2xsYmFycyhjbSk7fSwgMTAwKTtcbiAgfVxuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IGVzdGltYXRlcyB0aGUgaGVpZ2h0IG9mIGEgbGluZSwgdG8gdXNlIGFzXG4gIC8vIGZpcnN0IGFwcHJveGltYXRpb24gdW50aWwgdGhlIGxpbmUgYmVjb21lcyB2aXNpYmxlIChhbmQgaXMgdGh1c1xuICAvLyBwcm9wZXJseSBtZWFzdXJhYmxlKS5cbiAgZnVuY3Rpb24gZXN0aW1hdGVIZWlnaHQoY20pIHtcbiAgICB2YXIgdGggPSB0ZXh0SGVpZ2h0KGNtLmRpc3BsYXkpLCB3cmFwcGluZyA9IGNtLm9wdGlvbnMubGluZVdyYXBwaW5nO1xuICAgIHZhciBwZXJMaW5lID0gd3JhcHBpbmcgJiYgTWF0aC5tYXgoNSwgY20uZGlzcGxheS5zY3JvbGxlci5jbGllbnRXaWR0aCAvIGNoYXJXaWR0aChjbS5kaXNwbGF5KSAtIDMpO1xuICAgIHJldHVybiBmdW5jdGlvbihsaW5lKSB7XG4gICAgICBpZiAobGluZUlzSGlkZGVuKGNtLmRvYywgbGluZSkpIHJldHVybiAwO1xuXG4gICAgICB2YXIgd2lkZ2V0c0hlaWdodCA9IDA7XG4gICAgICBpZiAobGluZS53aWRnZXRzKSBmb3IgKHZhciBpID0gMDsgaSA8IGxpbmUud2lkZ2V0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAobGluZS53aWRnZXRzW2ldLmhlaWdodCkgd2lkZ2V0c0hlaWdodCArPSBsaW5lLndpZGdldHNbaV0uaGVpZ2h0O1xuICAgICAgfVxuXG4gICAgICBpZiAod3JhcHBpbmcpXG4gICAgICAgIHJldHVybiB3aWRnZXRzSGVpZ2h0ICsgKE1hdGguY2VpbChsaW5lLnRleHQubGVuZ3RoIC8gcGVyTGluZSkgfHwgMSkgKiB0aDtcbiAgICAgIGVsc2VcbiAgICAgICAgcmV0dXJuIHdpZGdldHNIZWlnaHQgKyB0aDtcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gZXN0aW1hdGVMaW5lSGVpZ2h0cyhjbSkge1xuICAgIHZhciBkb2MgPSBjbS5kb2MsIGVzdCA9IGVzdGltYXRlSGVpZ2h0KGNtKTtcbiAgICBkb2MuaXRlcihmdW5jdGlvbihsaW5lKSB7XG4gICAgICB2YXIgZXN0SGVpZ2h0ID0gZXN0KGxpbmUpO1xuICAgICAgaWYgKGVzdEhlaWdodCAhPSBsaW5lLmhlaWdodCkgdXBkYXRlTGluZUhlaWdodChsaW5lLCBlc3RIZWlnaHQpO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gdGhlbWVDaGFuZ2VkKGNtKSB7XG4gICAgY20uZGlzcGxheS53cmFwcGVyLmNsYXNzTmFtZSA9IGNtLmRpc3BsYXkud3JhcHBlci5jbGFzc05hbWUucmVwbGFjZSgvXFxzKmNtLXMtXFxTKy9nLCBcIlwiKSArXG4gICAgICBjbS5vcHRpb25zLnRoZW1lLnJlcGxhY2UoLyhefFxccylcXHMqL2csIFwiIGNtLXMtXCIpO1xuICAgIGNsZWFyQ2FjaGVzKGNtKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGd1dHRlcnNDaGFuZ2VkKGNtKSB7XG4gICAgdXBkYXRlR3V0dGVycyhjbSk7XG4gICAgcmVnQ2hhbmdlKGNtKTtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7YWxpZ25Ib3Jpem9udGFsbHkoY20pO30sIDIwKTtcbiAgfVxuXG4gIC8vIFJlYnVpbGQgdGhlIGd1dHRlciBlbGVtZW50cywgZW5zdXJlIHRoZSBtYXJnaW4gdG8gdGhlIGxlZnQgb2YgdGhlXG4gIC8vIGNvZGUgbWF0Y2hlcyB0aGVpciB3aWR0aC5cbiAgZnVuY3Rpb24gdXBkYXRlR3V0dGVycyhjbSkge1xuICAgIHZhciBndXR0ZXJzID0gY20uZGlzcGxheS5ndXR0ZXJzLCBzcGVjcyA9IGNtLm9wdGlvbnMuZ3V0dGVycztcbiAgICByZW1vdmVDaGlsZHJlbihndXR0ZXJzKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNwZWNzLmxlbmd0aDsgKytpKSB7XG4gICAgICB2YXIgZ3V0dGVyQ2xhc3MgPSBzcGVjc1tpXTtcbiAgICAgIHZhciBnRWx0ID0gZ3V0dGVycy5hcHBlbmRDaGlsZChlbHQoXCJkaXZcIiwgbnVsbCwgXCJDb2RlTWlycm9yLWd1dHRlciBcIiArIGd1dHRlckNsYXNzKSk7XG4gICAgICBpZiAoZ3V0dGVyQ2xhc3MgPT0gXCJDb2RlTWlycm9yLWxpbmVudW1iZXJzXCIpIHtcbiAgICAgICAgY20uZGlzcGxheS5saW5lR3V0dGVyID0gZ0VsdDtcbiAgICAgICAgZ0VsdC5zdHlsZS53aWR0aCA9IChjbS5kaXNwbGF5LmxpbmVOdW1XaWR0aCB8fCAxKSArIFwicHhcIjtcbiAgICAgIH1cbiAgICB9XG4gICAgZ3V0dGVycy5zdHlsZS5kaXNwbGF5ID0gaSA/IFwiXCIgOiBcIm5vbmVcIjtcbiAgICB1cGRhdGVHdXR0ZXJTcGFjZShjbSk7XG4gIH1cblxuICBmdW5jdGlvbiB1cGRhdGVHdXR0ZXJTcGFjZShjbSkge1xuICAgIHZhciB3aWR0aCA9IGNtLmRpc3BsYXkuZ3V0dGVycy5vZmZzZXRXaWR0aDtcbiAgICBjbS5kaXNwbGF5LnNpemVyLnN0eWxlLm1hcmdpbkxlZnQgPSB3aWR0aCArIFwicHhcIjtcbiAgfVxuXG4gIC8vIENvbXB1dGUgdGhlIGNoYXJhY3RlciBsZW5ndGggb2YgYSBsaW5lLCB0YWtpbmcgaW50byBhY2NvdW50XG4gIC8vIGNvbGxhcHNlZCByYW5nZXMgKHNlZSBtYXJrVGV4dCkgdGhhdCBtaWdodCBoaWRlIHBhcnRzLCBhbmQgam9pblxuICAvLyBvdGhlciBsaW5lcyBvbnRvIGl0LlxuICBmdW5jdGlvbiBsaW5lTGVuZ3RoKGxpbmUpIHtcbiAgICBpZiAobGluZS5oZWlnaHQgPT0gMCkgcmV0dXJuIDA7XG4gICAgdmFyIGxlbiA9IGxpbmUudGV4dC5sZW5ndGgsIG1lcmdlZCwgY3VyID0gbGluZTtcbiAgICB3aGlsZSAobWVyZ2VkID0gY29sbGFwc2VkU3BhbkF0U3RhcnQoY3VyKSkge1xuICAgICAgdmFyIGZvdW5kID0gbWVyZ2VkLmZpbmQoMCwgdHJ1ZSk7XG4gICAgICBjdXIgPSBmb3VuZC5mcm9tLmxpbmU7XG4gICAgICBsZW4gKz0gZm91bmQuZnJvbS5jaCAtIGZvdW5kLnRvLmNoO1xuICAgIH1cbiAgICBjdXIgPSBsaW5lO1xuICAgIHdoaWxlIChtZXJnZWQgPSBjb2xsYXBzZWRTcGFuQXRFbmQoY3VyKSkge1xuICAgICAgdmFyIGZvdW5kID0gbWVyZ2VkLmZpbmQoMCwgdHJ1ZSk7XG4gICAgICBsZW4gLT0gY3VyLnRleHQubGVuZ3RoIC0gZm91bmQuZnJvbS5jaDtcbiAgICAgIGN1ciA9IGZvdW5kLnRvLmxpbmU7XG4gICAgICBsZW4gKz0gY3VyLnRleHQubGVuZ3RoIC0gZm91bmQudG8uY2g7XG4gICAgfVxuICAgIHJldHVybiBsZW47XG4gIH1cblxuICAvLyBGaW5kIHRoZSBsb25nZXN0IGxpbmUgaW4gdGhlIGRvY3VtZW50LlxuICBmdW5jdGlvbiBmaW5kTWF4TGluZShjbSkge1xuICAgIHZhciBkID0gY20uZGlzcGxheSwgZG9jID0gY20uZG9jO1xuICAgIGQubWF4TGluZSA9IGdldExpbmUoZG9jLCBkb2MuZmlyc3QpO1xuICAgIGQubWF4TGluZUxlbmd0aCA9IGxpbmVMZW5ndGgoZC5tYXhMaW5lKTtcbiAgICBkLm1heExpbmVDaGFuZ2VkID0gdHJ1ZTtcbiAgICBkb2MuaXRlcihmdW5jdGlvbihsaW5lKSB7XG4gICAgICB2YXIgbGVuID0gbGluZUxlbmd0aChsaW5lKTtcbiAgICAgIGlmIChsZW4gPiBkLm1heExpbmVMZW5ndGgpIHtcbiAgICAgICAgZC5tYXhMaW5lTGVuZ3RoID0gbGVuO1xuICAgICAgICBkLm1heExpbmUgPSBsaW5lO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLy8gTWFrZSBzdXJlIHRoZSBndXR0ZXJzIG9wdGlvbnMgY29udGFpbnMgdGhlIGVsZW1lbnRcbiAgLy8gXCJDb2RlTWlycm9yLWxpbmVudW1iZXJzXCIgd2hlbiB0aGUgbGluZU51bWJlcnMgb3B0aW9uIGlzIHRydWUuXG4gIGZ1bmN0aW9uIHNldEd1dHRlcnNGb3JMaW5lTnVtYmVycyhvcHRpb25zKSB7XG4gICAgdmFyIGZvdW5kID0gaW5kZXhPZihvcHRpb25zLmd1dHRlcnMsIFwiQ29kZU1pcnJvci1saW5lbnVtYmVyc1wiKTtcbiAgICBpZiAoZm91bmQgPT0gLTEgJiYgb3B0aW9ucy5saW5lTnVtYmVycykge1xuICAgICAgb3B0aW9ucy5ndXR0ZXJzID0gb3B0aW9ucy5ndXR0ZXJzLmNvbmNhdChbXCJDb2RlTWlycm9yLWxpbmVudW1iZXJzXCJdKTtcbiAgICB9IGVsc2UgaWYgKGZvdW5kID4gLTEgJiYgIW9wdGlvbnMubGluZU51bWJlcnMpIHtcbiAgICAgIG9wdGlvbnMuZ3V0dGVycyA9IG9wdGlvbnMuZ3V0dGVycy5zbGljZSgwKTtcbiAgICAgIG9wdGlvbnMuZ3V0dGVycy5zcGxpY2UoZm91bmQsIDEpO1xuICAgIH1cbiAgfVxuXG4gIC8vIFNDUk9MTEJBUlNcblxuICAvLyBQcmVwYXJlIERPTSByZWFkcyBuZWVkZWQgdG8gdXBkYXRlIHRoZSBzY3JvbGxiYXJzLiBEb25lIGluIG9uZVxuICAvLyBzaG90IHRvIG1pbmltaXplIHVwZGF0ZS9tZWFzdXJlIHJvdW5kdHJpcHMuXG4gIGZ1bmN0aW9uIG1lYXN1cmVGb3JTY3JvbGxiYXJzKGNtKSB7XG4gICAgdmFyIGQgPSBjbS5kaXNwbGF5LCBndXR0ZXJXID0gZC5ndXR0ZXJzLm9mZnNldFdpZHRoO1xuICAgIHZhciBkb2NIID0gTWF0aC5yb3VuZChjbS5kb2MuaGVpZ2h0ICsgcGFkZGluZ1ZlcnQoY20uZGlzcGxheSkpO1xuICAgIHJldHVybiB7XG4gICAgICBjbGllbnRIZWlnaHQ6IGQuc2Nyb2xsZXIuY2xpZW50SGVpZ2h0LFxuICAgICAgdmlld0hlaWdodDogZC53cmFwcGVyLmNsaWVudEhlaWdodCxcbiAgICAgIHNjcm9sbFdpZHRoOiBkLnNjcm9sbGVyLnNjcm9sbFdpZHRoLCBjbGllbnRXaWR0aDogZC5zY3JvbGxlci5jbGllbnRXaWR0aCxcbiAgICAgIHZpZXdXaWR0aDogZC53cmFwcGVyLmNsaWVudFdpZHRoLFxuICAgICAgYmFyTGVmdDogY20ub3B0aW9ucy5maXhlZEd1dHRlciA/IGd1dHRlclcgOiAwLFxuICAgICAgZG9jSGVpZ2h0OiBkb2NILFxuICAgICAgc2Nyb2xsSGVpZ2h0OiBkb2NIICsgc2Nyb2xsR2FwKGNtKSArIGQuYmFySGVpZ2h0LFxuICAgICAgbmF0aXZlQmFyV2lkdGg6IGQubmF0aXZlQmFyV2lkdGgsXG4gICAgICBndXR0ZXJXaWR0aDogZ3V0dGVyV1xuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBOYXRpdmVTY3JvbGxiYXJzKHBsYWNlLCBzY3JvbGwsIGNtKSB7XG4gICAgdGhpcy5jbSA9IGNtO1xuICAgIHZhciB2ZXJ0ID0gdGhpcy52ZXJ0ID0gZWx0KFwiZGl2XCIsIFtlbHQoXCJkaXZcIiwgbnVsbCwgbnVsbCwgXCJtaW4td2lkdGg6IDFweFwiKV0sIFwiQ29kZU1pcnJvci12c2Nyb2xsYmFyXCIpO1xuICAgIHZhciBob3JpeiA9IHRoaXMuaG9yaXogPSBlbHQoXCJkaXZcIiwgW2VsdChcImRpdlwiLCBudWxsLCBudWxsLCBcImhlaWdodDogMTAwJTsgbWluLWhlaWdodDogMXB4XCIpXSwgXCJDb2RlTWlycm9yLWhzY3JvbGxiYXJcIik7XG4gICAgcGxhY2UodmVydCk7IHBsYWNlKGhvcml6KTtcblxuICAgIG9uKHZlcnQsIFwic2Nyb2xsXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHZlcnQuY2xpZW50SGVpZ2h0KSBzY3JvbGwodmVydC5zY3JvbGxUb3AsIFwidmVydGljYWxcIik7XG4gICAgfSk7XG4gICAgb24oaG9yaXosIFwic2Nyb2xsXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKGhvcml6LmNsaWVudFdpZHRoKSBzY3JvbGwoaG9yaXouc2Nyb2xsTGVmdCwgXCJob3Jpem9udGFsXCIpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5jaGVja2VkWmVyb1dpZHRoID0gZmFsc2U7XG4gICAgLy8gTmVlZCB0byBzZXQgYSBtaW5pbXVtIHdpZHRoIHRvIHNlZSB0aGUgc2Nyb2xsYmFyIG9uIElFNyAoYnV0IG11c3Qgbm90IHNldCBpdCBvbiBJRTgpLlxuICAgIGlmIChpZSAmJiBpZV92ZXJzaW9uIDwgOCkgdGhpcy5ob3Jpei5zdHlsZS5taW5IZWlnaHQgPSB0aGlzLnZlcnQuc3R5bGUubWluV2lkdGggPSBcIjE4cHhcIjtcbiAgfVxuXG4gIE5hdGl2ZVNjcm9sbGJhcnMucHJvdG90eXBlID0gY29weU9iaih7XG4gICAgdXBkYXRlOiBmdW5jdGlvbihtZWFzdXJlKSB7XG4gICAgICB2YXIgbmVlZHNIID0gbWVhc3VyZS5zY3JvbGxXaWR0aCA+IG1lYXN1cmUuY2xpZW50V2lkdGggKyAxO1xuICAgICAgdmFyIG5lZWRzViA9IG1lYXN1cmUuc2Nyb2xsSGVpZ2h0ID4gbWVhc3VyZS5jbGllbnRIZWlnaHQgKyAxO1xuICAgICAgdmFyIHNXaWR0aCA9IG1lYXN1cmUubmF0aXZlQmFyV2lkdGg7XG5cbiAgICAgIGlmIChuZWVkc1YpIHtcbiAgICAgICAgdGhpcy52ZXJ0LnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XG4gICAgICAgIHRoaXMudmVydC5zdHlsZS5ib3R0b20gPSBuZWVkc0ggPyBzV2lkdGggKyBcInB4XCIgOiBcIjBcIjtcbiAgICAgICAgdmFyIHRvdGFsSGVpZ2h0ID0gbWVhc3VyZS52aWV3SGVpZ2h0IC0gKG5lZWRzSCA/IHNXaWR0aCA6IDApO1xuICAgICAgICAvLyBBIGJ1ZyBpbiBJRTggY2FuIGNhdXNlIHRoaXMgdmFsdWUgdG8gYmUgbmVnYXRpdmUsIHNvIGd1YXJkIGl0LlxuICAgICAgICB0aGlzLnZlcnQuZmlyc3RDaGlsZC5zdHlsZS5oZWlnaHQgPVxuICAgICAgICAgIE1hdGgubWF4KDAsIG1lYXN1cmUuc2Nyb2xsSGVpZ2h0IC0gbWVhc3VyZS5jbGllbnRIZWlnaHQgKyB0b3RhbEhlaWdodCkgKyBcInB4XCI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnZlcnQuc3R5bGUuZGlzcGxheSA9IFwiXCI7XG4gICAgICAgIHRoaXMudmVydC5maXJzdENoaWxkLnN0eWxlLmhlaWdodCA9IFwiMFwiO1xuICAgICAgfVxuXG4gICAgICBpZiAobmVlZHNIKSB7XG4gICAgICAgIHRoaXMuaG9yaXouc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcbiAgICAgICAgdGhpcy5ob3Jpei5zdHlsZS5yaWdodCA9IG5lZWRzViA/IHNXaWR0aCArIFwicHhcIiA6IFwiMFwiO1xuICAgICAgICB0aGlzLmhvcml6LnN0eWxlLmxlZnQgPSBtZWFzdXJlLmJhckxlZnQgKyBcInB4XCI7XG4gICAgICAgIHZhciB0b3RhbFdpZHRoID0gbWVhc3VyZS52aWV3V2lkdGggLSBtZWFzdXJlLmJhckxlZnQgLSAobmVlZHNWID8gc1dpZHRoIDogMCk7XG4gICAgICAgIHRoaXMuaG9yaXouZmlyc3RDaGlsZC5zdHlsZS53aWR0aCA9XG4gICAgICAgICAgKG1lYXN1cmUuc2Nyb2xsV2lkdGggLSBtZWFzdXJlLmNsaWVudFdpZHRoICsgdG90YWxXaWR0aCkgKyBcInB4XCI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmhvcml6LnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xuICAgICAgICB0aGlzLmhvcml6LmZpcnN0Q2hpbGQuc3R5bGUud2lkdGggPSBcIjBcIjtcbiAgICAgIH1cblxuICAgICAgaWYgKCF0aGlzLmNoZWNrZWRaZXJvV2lkdGggJiYgbWVhc3VyZS5jbGllbnRIZWlnaHQgPiAwKSB7XG4gICAgICAgIGlmIChzV2lkdGggPT0gMCkgdGhpcy56ZXJvV2lkdGhIYWNrKCk7XG4gICAgICAgIHRoaXMuY2hlY2tlZFplcm9XaWR0aCA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7cmlnaHQ6IG5lZWRzViA/IHNXaWR0aCA6IDAsIGJvdHRvbTogbmVlZHNIID8gc1dpZHRoIDogMH07XG4gICAgfSxcbiAgICBzZXRTY3JvbGxMZWZ0OiBmdW5jdGlvbihwb3MpIHtcbiAgICAgIGlmICh0aGlzLmhvcml6LnNjcm9sbExlZnQgIT0gcG9zKSB0aGlzLmhvcml6LnNjcm9sbExlZnQgPSBwb3M7XG4gICAgICBpZiAodGhpcy5kaXNhYmxlSG9yaXopIHRoaXMuZW5hYmxlWmVyb1dpZHRoQmFyKHRoaXMuaG9yaXosIHRoaXMuZGlzYWJsZUhvcml6KTtcbiAgICB9LFxuICAgIHNldFNjcm9sbFRvcDogZnVuY3Rpb24ocG9zKSB7XG4gICAgICBpZiAodGhpcy52ZXJ0LnNjcm9sbFRvcCAhPSBwb3MpIHRoaXMudmVydC5zY3JvbGxUb3AgPSBwb3M7XG4gICAgICBpZiAodGhpcy5kaXNhYmxlVmVydCkgdGhpcy5lbmFibGVaZXJvV2lkdGhCYXIodGhpcy52ZXJ0LCB0aGlzLmRpc2FibGVWZXJ0KTtcbiAgICB9LFxuICAgIHplcm9XaWR0aEhhY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHcgPSBtYWMgJiYgIW1hY19nZU1vdW50YWluTGlvbiA/IFwiMTJweFwiIDogXCIxOHB4XCI7XG4gICAgICB0aGlzLmhvcml6LnN0eWxlLmhlaWdodCA9IHRoaXMudmVydC5zdHlsZS53aWR0aCA9IHc7XG4gICAgICB0aGlzLmhvcml6LnN0eWxlLnBvaW50ZXJFdmVudHMgPSB0aGlzLnZlcnQuc3R5bGUucG9pbnRlckV2ZW50cyA9IFwibm9uZVwiO1xuICAgICAgdGhpcy5kaXNhYmxlSG9yaXogPSBuZXcgRGVsYXllZDtcbiAgICAgIHRoaXMuZGlzYWJsZVZlcnQgPSBuZXcgRGVsYXllZDtcbiAgICB9LFxuICAgIGVuYWJsZVplcm9XaWR0aEJhcjogZnVuY3Rpb24oYmFyLCBkZWxheSkge1xuICAgICAgYmFyLnN0eWxlLnBvaW50ZXJFdmVudHMgPSBcImF1dG9cIjtcbiAgICAgIGZ1bmN0aW9uIG1heWJlRGlzYWJsZSgpIHtcbiAgICAgICAgLy8gVG8gZmluZCBvdXQgd2hldGhlciB0aGUgc2Nyb2xsYmFyIGlzIHN0aWxsIHZpc2libGUsIHdlXG4gICAgICAgIC8vIGNoZWNrIHdoZXRoZXIgdGhlIGVsZW1lbnQgdW5kZXIgdGhlIHBpeGVsIGluIHRoZSBib3R0b21cbiAgICAgICAgLy8gbGVmdCBjb3JuZXIgb2YgdGhlIHNjcm9sbGJhciBib3ggaXMgdGhlIHNjcm9sbGJhciBib3hcbiAgICAgICAgLy8gaXRzZWxmICh3aGVuIHRoZSBiYXIgaXMgc3RpbGwgdmlzaWJsZSkgb3IgaXRzIGZpbGxlciBjaGlsZFxuICAgICAgICAvLyAod2hlbiB0aGUgYmFyIGlzIGhpZGRlbikuIElmIGl0IGlzIHN0aWxsIHZpc2libGUsIHdlIGtlZXBcbiAgICAgICAgLy8gaXQgZW5hYmxlZCwgaWYgaXQncyBoaWRkZW4sIHdlIGRpc2FibGUgcG9pbnRlciBldmVudHMuXG4gICAgICAgIHZhciBib3ggPSBiYXIuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIHZhciBlbHQgPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KGJveC5sZWZ0ICsgMSwgYm94LmJvdHRvbSAtIDEpO1xuICAgICAgICBpZiAoZWx0ICE9IGJhcikgYmFyLnN0eWxlLnBvaW50ZXJFdmVudHMgPSBcIm5vbmVcIjtcbiAgICAgICAgZWxzZSBkZWxheS5zZXQoMTAwMCwgbWF5YmVEaXNhYmxlKTtcbiAgICAgIH1cbiAgICAgIGRlbGF5LnNldCgxMDAwLCBtYXliZURpc2FibGUpO1xuICAgIH0sXG4gICAgY2xlYXI6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHBhcmVudCA9IHRoaXMuaG9yaXoucGFyZW50Tm9kZTtcbiAgICAgIHBhcmVudC5yZW1vdmVDaGlsZCh0aGlzLmhvcml6KTtcbiAgICAgIHBhcmVudC5yZW1vdmVDaGlsZCh0aGlzLnZlcnQpO1xuICAgIH1cbiAgfSwgTmF0aXZlU2Nyb2xsYmFycy5wcm90b3R5cGUpO1xuXG4gIGZ1bmN0aW9uIE51bGxTY3JvbGxiYXJzKCkge31cblxuICBOdWxsU2Nyb2xsYmFycy5wcm90b3R5cGUgPSBjb3B5T2JqKHtcbiAgICB1cGRhdGU6IGZ1bmN0aW9uKCkgeyByZXR1cm4ge2JvdHRvbTogMCwgcmlnaHQ6IDB9OyB9LFxuICAgIHNldFNjcm9sbExlZnQ6IGZ1bmN0aW9uKCkge30sXG4gICAgc2V0U2Nyb2xsVG9wOiBmdW5jdGlvbigpIHt9LFxuICAgIGNsZWFyOiBmdW5jdGlvbigpIHt9XG4gIH0sIE51bGxTY3JvbGxiYXJzLnByb3RvdHlwZSk7XG5cbiAgQ29kZU1pcnJvci5zY3JvbGxiYXJNb2RlbCA9IHtcIm5hdGl2ZVwiOiBOYXRpdmVTY3JvbGxiYXJzLCBcIm51bGxcIjogTnVsbFNjcm9sbGJhcnN9O1xuXG4gIGZ1bmN0aW9uIGluaXRTY3JvbGxiYXJzKGNtKSB7XG4gICAgaWYgKGNtLmRpc3BsYXkuc2Nyb2xsYmFycykge1xuICAgICAgY20uZGlzcGxheS5zY3JvbGxiYXJzLmNsZWFyKCk7XG4gICAgICBpZiAoY20uZGlzcGxheS5zY3JvbGxiYXJzLmFkZENsYXNzKVxuICAgICAgICBybUNsYXNzKGNtLmRpc3BsYXkud3JhcHBlciwgY20uZGlzcGxheS5zY3JvbGxiYXJzLmFkZENsYXNzKTtcbiAgICB9XG5cbiAgICBjbS5kaXNwbGF5LnNjcm9sbGJhcnMgPSBuZXcgQ29kZU1pcnJvci5zY3JvbGxiYXJNb2RlbFtjbS5vcHRpb25zLnNjcm9sbGJhclN0eWxlXShmdW5jdGlvbihub2RlKSB7XG4gICAgICBjbS5kaXNwbGF5LndyYXBwZXIuaW5zZXJ0QmVmb3JlKG5vZGUsIGNtLmRpc3BsYXkuc2Nyb2xsYmFyRmlsbGVyKTtcbiAgICAgIC8vIFByZXZlbnQgY2xpY2tzIGluIHRoZSBzY3JvbGxiYXJzIGZyb20ga2lsbGluZyBmb2N1c1xuICAgICAgb24obm9kZSwgXCJtb3VzZWRvd25cIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChjbS5zdGF0ZS5mb2N1c2VkKSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBjbS5kaXNwbGF5LmlucHV0LmZvY3VzKCk7IH0sIDApO1xuICAgICAgfSk7XG4gICAgICBub2RlLnNldEF0dHJpYnV0ZShcImNtLW5vdC1jb250ZW50XCIsIFwidHJ1ZVwiKTtcbiAgICB9LCBmdW5jdGlvbihwb3MsIGF4aXMpIHtcbiAgICAgIGlmIChheGlzID09IFwiaG9yaXpvbnRhbFwiKSBzZXRTY3JvbGxMZWZ0KGNtLCBwb3MpO1xuICAgICAgZWxzZSBzZXRTY3JvbGxUb3AoY20sIHBvcyk7XG4gICAgfSwgY20pO1xuICAgIGlmIChjbS5kaXNwbGF5LnNjcm9sbGJhcnMuYWRkQ2xhc3MpXG4gICAgICBhZGRDbGFzcyhjbS5kaXNwbGF5LndyYXBwZXIsIGNtLmRpc3BsYXkuc2Nyb2xsYmFycy5hZGRDbGFzcyk7XG4gIH1cblxuICBmdW5jdGlvbiB1cGRhdGVTY3JvbGxiYXJzKGNtLCBtZWFzdXJlKSB7XG4gICAgaWYgKCFtZWFzdXJlKSBtZWFzdXJlID0gbWVhc3VyZUZvclNjcm9sbGJhcnMoY20pO1xuICAgIHZhciBzdGFydFdpZHRoID0gY20uZGlzcGxheS5iYXJXaWR0aCwgc3RhcnRIZWlnaHQgPSBjbS5kaXNwbGF5LmJhckhlaWdodDtcbiAgICB1cGRhdGVTY3JvbGxiYXJzSW5uZXIoY20sIG1lYXN1cmUpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgNCAmJiBzdGFydFdpZHRoICE9IGNtLmRpc3BsYXkuYmFyV2lkdGggfHwgc3RhcnRIZWlnaHQgIT0gY20uZGlzcGxheS5iYXJIZWlnaHQ7IGkrKykge1xuICAgICAgaWYgKHN0YXJ0V2lkdGggIT0gY20uZGlzcGxheS5iYXJXaWR0aCAmJiBjbS5vcHRpb25zLmxpbmVXcmFwcGluZylcbiAgICAgICAgdXBkYXRlSGVpZ2h0c0luVmlld3BvcnQoY20pO1xuICAgICAgdXBkYXRlU2Nyb2xsYmFyc0lubmVyKGNtLCBtZWFzdXJlRm9yU2Nyb2xsYmFycyhjbSkpO1xuICAgICAgc3RhcnRXaWR0aCA9IGNtLmRpc3BsYXkuYmFyV2lkdGg7IHN0YXJ0SGVpZ2h0ID0gY20uZGlzcGxheS5iYXJIZWlnaHQ7XG4gICAgfVxuICB9XG5cbiAgLy8gUmUtc3luY2hyb25pemUgdGhlIGZha2Ugc2Nyb2xsYmFycyB3aXRoIHRoZSBhY3R1YWwgc2l6ZSBvZiB0aGVcbiAgLy8gY29udGVudC5cbiAgZnVuY3Rpb24gdXBkYXRlU2Nyb2xsYmFyc0lubmVyKGNtLCBtZWFzdXJlKSB7XG4gICAgdmFyIGQgPSBjbS5kaXNwbGF5O1xuICAgIHZhciBzaXplcyA9IGQuc2Nyb2xsYmFycy51cGRhdGUobWVhc3VyZSk7XG5cbiAgICBkLnNpemVyLnN0eWxlLnBhZGRpbmdSaWdodCA9IChkLmJhcldpZHRoID0gc2l6ZXMucmlnaHQpICsgXCJweFwiO1xuICAgIGQuc2l6ZXIuc3R5bGUucGFkZGluZ0JvdHRvbSA9IChkLmJhckhlaWdodCA9IHNpemVzLmJvdHRvbSkgKyBcInB4XCI7XG5cbiAgICBpZiAoc2l6ZXMucmlnaHQgJiYgc2l6ZXMuYm90dG9tKSB7XG4gICAgICBkLnNjcm9sbGJhckZpbGxlci5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xuICAgICAgZC5zY3JvbGxiYXJGaWxsZXIuc3R5bGUuaGVpZ2h0ID0gc2l6ZXMuYm90dG9tICsgXCJweFwiO1xuICAgICAgZC5zY3JvbGxiYXJGaWxsZXIuc3R5bGUud2lkdGggPSBzaXplcy5yaWdodCArIFwicHhcIjtcbiAgICB9IGVsc2UgZC5zY3JvbGxiYXJGaWxsZXIuc3R5bGUuZGlzcGxheSA9IFwiXCI7XG4gICAgaWYgKHNpemVzLmJvdHRvbSAmJiBjbS5vcHRpb25zLmNvdmVyR3V0dGVyTmV4dFRvU2Nyb2xsYmFyICYmIGNtLm9wdGlvbnMuZml4ZWRHdXR0ZXIpIHtcbiAgICAgIGQuZ3V0dGVyRmlsbGVyLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XG4gICAgICBkLmd1dHRlckZpbGxlci5zdHlsZS5oZWlnaHQgPSBzaXplcy5ib3R0b20gKyBcInB4XCI7XG4gICAgICBkLmd1dHRlckZpbGxlci5zdHlsZS53aWR0aCA9IG1lYXN1cmUuZ3V0dGVyV2lkdGggKyBcInB4XCI7XG4gICAgfSBlbHNlIGQuZ3V0dGVyRmlsbGVyLnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xuICB9XG5cbiAgLy8gQ29tcHV0ZSB0aGUgbGluZXMgdGhhdCBhcmUgdmlzaWJsZSBpbiBhIGdpdmVuIHZpZXdwb3J0IChkZWZhdWx0c1xuICAvLyB0aGUgdGhlIGN1cnJlbnQgc2Nyb2xsIHBvc2l0aW9uKS4gdmlld3BvcnQgbWF5IGNvbnRhaW4gdG9wLFxuICAvLyBoZWlnaHQsIGFuZCBlbnN1cmUgKHNlZSBvcC5zY3JvbGxUb1BvcykgcHJvcGVydGllcy5cbiAgZnVuY3Rpb24gdmlzaWJsZUxpbmVzKGRpc3BsYXksIGRvYywgdmlld3BvcnQpIHtcbiAgICB2YXIgdG9wID0gdmlld3BvcnQgJiYgdmlld3BvcnQudG9wICE9IG51bGwgPyBNYXRoLm1heCgwLCB2aWV3cG9ydC50b3ApIDogZGlzcGxheS5zY3JvbGxlci5zY3JvbGxUb3A7XG4gICAgdG9wID0gTWF0aC5mbG9vcih0b3AgLSBwYWRkaW5nVG9wKGRpc3BsYXkpKTtcbiAgICB2YXIgYm90dG9tID0gdmlld3BvcnQgJiYgdmlld3BvcnQuYm90dG9tICE9IG51bGwgPyB2aWV3cG9ydC5ib3R0b20gOiB0b3AgKyBkaXNwbGF5LndyYXBwZXIuY2xpZW50SGVpZ2h0O1xuXG4gICAgdmFyIGZyb20gPSBsaW5lQXRIZWlnaHQoZG9jLCB0b3ApLCB0byA9IGxpbmVBdEhlaWdodChkb2MsIGJvdHRvbSk7XG4gICAgLy8gRW5zdXJlIGlzIGEge2Zyb206IHtsaW5lLCBjaH0sIHRvOiB7bGluZSwgY2h9fSBvYmplY3QsIGFuZFxuICAgIC8vIGZvcmNlcyB0aG9zZSBsaW5lcyBpbnRvIHRoZSB2aWV3cG9ydCAoaWYgcG9zc2libGUpLlxuICAgIGlmICh2aWV3cG9ydCAmJiB2aWV3cG9ydC5lbnN1cmUpIHtcbiAgICAgIHZhciBlbnN1cmVGcm9tID0gdmlld3BvcnQuZW5zdXJlLmZyb20ubGluZSwgZW5zdXJlVG8gPSB2aWV3cG9ydC5lbnN1cmUudG8ubGluZTtcbiAgICAgIGlmIChlbnN1cmVGcm9tIDwgZnJvbSkge1xuICAgICAgICBmcm9tID0gZW5zdXJlRnJvbTtcbiAgICAgICAgdG8gPSBsaW5lQXRIZWlnaHQoZG9jLCBoZWlnaHRBdExpbmUoZ2V0TGluZShkb2MsIGVuc3VyZUZyb20pKSArIGRpc3BsYXkud3JhcHBlci5jbGllbnRIZWlnaHQpO1xuICAgICAgfSBlbHNlIGlmIChNYXRoLm1pbihlbnN1cmVUbywgZG9jLmxhc3RMaW5lKCkpID49IHRvKSB7XG4gICAgICAgIGZyb20gPSBsaW5lQXRIZWlnaHQoZG9jLCBoZWlnaHRBdExpbmUoZ2V0TGluZShkb2MsIGVuc3VyZVRvKSkgLSBkaXNwbGF5LndyYXBwZXIuY2xpZW50SGVpZ2h0KTtcbiAgICAgICAgdG8gPSBlbnN1cmVUbztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHtmcm9tOiBmcm9tLCB0bzogTWF0aC5tYXgodG8sIGZyb20gKyAxKX07XG4gIH1cblxuICAvLyBMSU5FIE5VTUJFUlNcblxuICAvLyBSZS1hbGlnbiBsaW5lIG51bWJlcnMgYW5kIGd1dHRlciBtYXJrcyB0byBjb21wZW5zYXRlIGZvclxuICAvLyBob3Jpem9udGFsIHNjcm9sbGluZy5cbiAgZnVuY3Rpb24gYWxpZ25Ib3Jpem9udGFsbHkoY20pIHtcbiAgICB2YXIgZGlzcGxheSA9IGNtLmRpc3BsYXksIHZpZXcgPSBkaXNwbGF5LnZpZXc7XG4gICAgaWYgKCFkaXNwbGF5LmFsaWduV2lkZ2V0cyAmJiAoIWRpc3BsYXkuZ3V0dGVycy5maXJzdENoaWxkIHx8ICFjbS5vcHRpb25zLmZpeGVkR3V0dGVyKSkgcmV0dXJuO1xuICAgIHZhciBjb21wID0gY29tcGVuc2F0ZUZvckhTY3JvbGwoZGlzcGxheSkgLSBkaXNwbGF5LnNjcm9sbGVyLnNjcm9sbExlZnQgKyBjbS5kb2Muc2Nyb2xsTGVmdDtcbiAgICB2YXIgZ3V0dGVyVyA9IGRpc3BsYXkuZ3V0dGVycy5vZmZzZXRXaWR0aCwgbGVmdCA9IGNvbXAgKyBcInB4XCI7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2aWV3Lmxlbmd0aDsgaSsrKSBpZiAoIXZpZXdbaV0uaGlkZGVuKSB7XG4gICAgICBpZiAoY20ub3B0aW9ucy5maXhlZEd1dHRlciAmJiB2aWV3W2ldLmd1dHRlcilcbiAgICAgICAgdmlld1tpXS5ndXR0ZXIuc3R5bGUubGVmdCA9IGxlZnQ7XG4gICAgICB2YXIgYWxpZ24gPSB2aWV3W2ldLmFsaWduYWJsZTtcbiAgICAgIGlmIChhbGlnbikgZm9yICh2YXIgaiA9IDA7IGogPCBhbGlnbi5sZW5ndGg7IGorKylcbiAgICAgICAgYWxpZ25bal0uc3R5bGUubGVmdCA9IGxlZnQ7XG4gICAgfVxuICAgIGlmIChjbS5vcHRpb25zLmZpeGVkR3V0dGVyKVxuICAgICAgZGlzcGxheS5ndXR0ZXJzLnN0eWxlLmxlZnQgPSAoY29tcCArIGd1dHRlclcpICsgXCJweFwiO1xuICB9XG5cbiAgLy8gVXNlZCB0byBlbnN1cmUgdGhhdCB0aGUgbGluZSBudW1iZXIgZ3V0dGVyIGlzIHN0aWxsIHRoZSByaWdodFxuICAvLyBzaXplIGZvciB0aGUgY3VycmVudCBkb2N1bWVudCBzaXplLiBSZXR1cm5zIHRydWUgd2hlbiBhbiB1cGRhdGVcbiAgLy8gaXMgbmVlZGVkLlxuICBmdW5jdGlvbiBtYXliZVVwZGF0ZUxpbmVOdW1iZXJXaWR0aChjbSkge1xuICAgIGlmICghY20ub3B0aW9ucy5saW5lTnVtYmVycykgcmV0dXJuIGZhbHNlO1xuICAgIHZhciBkb2MgPSBjbS5kb2MsIGxhc3QgPSBsaW5lTnVtYmVyRm9yKGNtLm9wdGlvbnMsIGRvYy5maXJzdCArIGRvYy5zaXplIC0gMSksIGRpc3BsYXkgPSBjbS5kaXNwbGF5O1xuICAgIGlmIChsYXN0Lmxlbmd0aCAhPSBkaXNwbGF5LmxpbmVOdW1DaGFycykge1xuICAgICAgdmFyIHRlc3QgPSBkaXNwbGF5Lm1lYXN1cmUuYXBwZW5kQ2hpbGQoZWx0KFwiZGl2XCIsIFtlbHQoXCJkaXZcIiwgbGFzdCldLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiQ29kZU1pcnJvci1saW5lbnVtYmVyIENvZGVNaXJyb3ItZ3V0dGVyLWVsdFwiKSk7XG4gICAgICB2YXIgaW5uZXJXID0gdGVzdC5maXJzdENoaWxkLm9mZnNldFdpZHRoLCBwYWRkaW5nID0gdGVzdC5vZmZzZXRXaWR0aCAtIGlubmVyVztcbiAgICAgIGRpc3BsYXkubGluZUd1dHRlci5zdHlsZS53aWR0aCA9IFwiXCI7XG4gICAgICBkaXNwbGF5LmxpbmVOdW1Jbm5lcldpZHRoID0gTWF0aC5tYXgoaW5uZXJXLCBkaXNwbGF5LmxpbmVHdXR0ZXIub2Zmc2V0V2lkdGggLSBwYWRkaW5nKSArIDE7XG4gICAgICBkaXNwbGF5LmxpbmVOdW1XaWR0aCA9IGRpc3BsYXkubGluZU51bUlubmVyV2lkdGggKyBwYWRkaW5nO1xuICAgICAgZGlzcGxheS5saW5lTnVtQ2hhcnMgPSBkaXNwbGF5LmxpbmVOdW1Jbm5lcldpZHRoID8gbGFzdC5sZW5ndGggOiAtMTtcbiAgICAgIGRpc3BsYXkubGluZUd1dHRlci5zdHlsZS53aWR0aCA9IGRpc3BsYXkubGluZU51bVdpZHRoICsgXCJweFwiO1xuICAgICAgdXBkYXRlR3V0dGVyU3BhY2UoY20pO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGxpbmVOdW1iZXJGb3Iob3B0aW9ucywgaSkge1xuICAgIHJldHVybiBTdHJpbmcob3B0aW9ucy5saW5lTnVtYmVyRm9ybWF0dGVyKGkgKyBvcHRpb25zLmZpcnN0TGluZU51bWJlcikpO1xuICB9XG5cbiAgLy8gQ29tcHV0ZXMgZGlzcGxheS5zY3JvbGxlci5zY3JvbGxMZWZ0ICsgZGlzcGxheS5ndXR0ZXJzLm9mZnNldFdpZHRoLFxuICAvLyBidXQgdXNpbmcgZ2V0Qm91bmRpbmdDbGllbnRSZWN0IHRvIGdldCBhIHN1Yi1waXhlbC1hY2N1cmF0ZVxuICAvLyByZXN1bHQuXG4gIGZ1bmN0aW9uIGNvbXBlbnNhdGVGb3JIU2Nyb2xsKGRpc3BsYXkpIHtcbiAgICByZXR1cm4gZGlzcGxheS5zY3JvbGxlci5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0IC0gZGlzcGxheS5zaXplci5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0O1xuICB9XG5cbiAgLy8gRElTUExBWSBEUkFXSU5HXG5cbiAgZnVuY3Rpb24gRGlzcGxheVVwZGF0ZShjbSwgdmlld3BvcnQsIGZvcmNlKSB7XG4gICAgdmFyIGRpc3BsYXkgPSBjbS5kaXNwbGF5O1xuXG4gICAgdGhpcy52aWV3cG9ydCA9IHZpZXdwb3J0O1xuICAgIC8vIFN0b3JlIHNvbWUgdmFsdWVzIHRoYXQgd2UnbGwgbmVlZCBsYXRlciAoYnV0IGRvbid0IHdhbnQgdG8gZm9yY2UgYSByZWxheW91dCBmb3IpXG4gICAgdGhpcy52aXNpYmxlID0gdmlzaWJsZUxpbmVzKGRpc3BsYXksIGNtLmRvYywgdmlld3BvcnQpO1xuICAgIHRoaXMuZWRpdG9ySXNIaWRkZW4gPSAhZGlzcGxheS53cmFwcGVyLm9mZnNldFdpZHRoO1xuICAgIHRoaXMud3JhcHBlckhlaWdodCA9IGRpc3BsYXkud3JhcHBlci5jbGllbnRIZWlnaHQ7XG4gICAgdGhpcy53cmFwcGVyV2lkdGggPSBkaXNwbGF5LndyYXBwZXIuY2xpZW50V2lkdGg7XG4gICAgdGhpcy5vbGREaXNwbGF5V2lkdGggPSBkaXNwbGF5V2lkdGgoY20pO1xuICAgIHRoaXMuZm9yY2UgPSBmb3JjZTtcbiAgICB0aGlzLmRpbXMgPSBnZXREaW1lbnNpb25zKGNtKTtcbiAgICB0aGlzLmV2ZW50cyA9IFtdO1xuICB9XG5cbiAgRGlzcGxheVVwZGF0ZS5wcm90b3R5cGUuc2lnbmFsID0gZnVuY3Rpb24oZW1pdHRlciwgdHlwZSkge1xuICAgIGlmIChoYXNIYW5kbGVyKGVtaXR0ZXIsIHR5cGUpKVxuICAgICAgdGhpcy5ldmVudHMucHVzaChhcmd1bWVudHMpO1xuICB9O1xuICBEaXNwbGF5VXBkYXRlLnByb3RvdHlwZS5maW5pc2ggPSBmdW5jdGlvbigpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZXZlbnRzLmxlbmd0aDsgaSsrKVxuICAgICAgc2lnbmFsLmFwcGx5KG51bGwsIHRoaXMuZXZlbnRzW2ldKTtcbiAgfTtcblxuICBmdW5jdGlvbiBtYXliZUNsaXBTY3JvbGxiYXJzKGNtKSB7XG4gICAgdmFyIGRpc3BsYXkgPSBjbS5kaXNwbGF5O1xuICAgIGlmICghZGlzcGxheS5zY3JvbGxiYXJzQ2xpcHBlZCAmJiBkaXNwbGF5LnNjcm9sbGVyLm9mZnNldFdpZHRoKSB7XG4gICAgICBkaXNwbGF5Lm5hdGl2ZUJhcldpZHRoID0gZGlzcGxheS5zY3JvbGxlci5vZmZzZXRXaWR0aCAtIGRpc3BsYXkuc2Nyb2xsZXIuY2xpZW50V2lkdGg7XG4gICAgICBkaXNwbGF5LmhlaWdodEZvcmNlci5zdHlsZS5oZWlnaHQgPSBzY3JvbGxHYXAoY20pICsgXCJweFwiO1xuICAgICAgZGlzcGxheS5zaXplci5zdHlsZS5tYXJnaW5Cb3R0b20gPSAtZGlzcGxheS5uYXRpdmVCYXJXaWR0aCArIFwicHhcIjtcbiAgICAgIGRpc3BsYXkuc2l6ZXIuc3R5bGUuYm9yZGVyUmlnaHRXaWR0aCA9IHNjcm9sbEdhcChjbSkgKyBcInB4XCI7XG4gICAgICBkaXNwbGF5LnNjcm9sbGJhcnNDbGlwcGVkID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICAvLyBEb2VzIHRoZSBhY3R1YWwgdXBkYXRpbmcgb2YgdGhlIGxpbmUgZGlzcGxheS4gQmFpbHMgb3V0XG4gIC8vIChyZXR1cm5pbmcgZmFsc2UpIHdoZW4gdGhlcmUgaXMgbm90aGluZyB0byBiZSBkb25lIGFuZCBmb3JjZWQgaXNcbiAgLy8gZmFsc2UuXG4gIGZ1bmN0aW9uIHVwZGF0ZURpc3BsYXlJZk5lZWRlZChjbSwgdXBkYXRlKSB7XG4gICAgdmFyIGRpc3BsYXkgPSBjbS5kaXNwbGF5LCBkb2MgPSBjbS5kb2M7XG5cbiAgICBpZiAodXBkYXRlLmVkaXRvcklzSGlkZGVuKSB7XG4gICAgICByZXNldFZpZXcoY20pO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIEJhaWwgb3V0IGlmIHRoZSB2aXNpYmxlIGFyZWEgaXMgYWxyZWFkeSByZW5kZXJlZCBhbmQgbm90aGluZyBjaGFuZ2VkLlxuICAgIGlmICghdXBkYXRlLmZvcmNlICYmXG4gICAgICAgIHVwZGF0ZS52aXNpYmxlLmZyb20gPj0gZGlzcGxheS52aWV3RnJvbSAmJiB1cGRhdGUudmlzaWJsZS50byA8PSBkaXNwbGF5LnZpZXdUbyAmJlxuICAgICAgICAoZGlzcGxheS51cGRhdGVMaW5lTnVtYmVycyA9PSBudWxsIHx8IGRpc3BsYXkudXBkYXRlTGluZU51bWJlcnMgPj0gZGlzcGxheS52aWV3VG8pICYmXG4gICAgICAgIGRpc3BsYXkucmVuZGVyZWRWaWV3ID09IGRpc3BsYXkudmlldyAmJiBjb3VudERpcnR5VmlldyhjbSkgPT0gMClcbiAgICAgIHJldHVybiBmYWxzZTtcblxuICAgIGlmIChtYXliZVVwZGF0ZUxpbmVOdW1iZXJXaWR0aChjbSkpIHtcbiAgICAgIHJlc2V0VmlldyhjbSk7XG4gICAgICB1cGRhdGUuZGltcyA9IGdldERpbWVuc2lvbnMoY20pO1xuICAgIH1cblxuICAgIC8vIENvbXB1dGUgYSBzdWl0YWJsZSBuZXcgdmlld3BvcnQgKGZyb20gJiB0bylcbiAgICB2YXIgZW5kID0gZG9jLmZpcnN0ICsgZG9jLnNpemU7XG4gICAgdmFyIGZyb20gPSBNYXRoLm1heCh1cGRhdGUudmlzaWJsZS5mcm9tIC0gY20ub3B0aW9ucy52aWV3cG9ydE1hcmdpbiwgZG9jLmZpcnN0KTtcbiAgICB2YXIgdG8gPSBNYXRoLm1pbihlbmQsIHVwZGF0ZS52aXNpYmxlLnRvICsgY20ub3B0aW9ucy52aWV3cG9ydE1hcmdpbik7XG4gICAgaWYgKGRpc3BsYXkudmlld0Zyb20gPCBmcm9tICYmIGZyb20gLSBkaXNwbGF5LnZpZXdGcm9tIDwgMjApIGZyb20gPSBNYXRoLm1heChkb2MuZmlyc3QsIGRpc3BsYXkudmlld0Zyb20pO1xuICAgIGlmIChkaXNwbGF5LnZpZXdUbyA+IHRvICYmIGRpc3BsYXkudmlld1RvIC0gdG8gPCAyMCkgdG8gPSBNYXRoLm1pbihlbmQsIGRpc3BsYXkudmlld1RvKTtcbiAgICBpZiAoc2F3Q29sbGFwc2VkU3BhbnMpIHtcbiAgICAgIGZyb20gPSB2aXN1YWxMaW5lTm8oY20uZG9jLCBmcm9tKTtcbiAgICAgIHRvID0gdmlzdWFsTGluZUVuZE5vKGNtLmRvYywgdG8pO1xuICAgIH1cblxuICAgIHZhciBkaWZmZXJlbnQgPSBmcm9tICE9IGRpc3BsYXkudmlld0Zyb20gfHwgdG8gIT0gZGlzcGxheS52aWV3VG8gfHxcbiAgICAgIGRpc3BsYXkubGFzdFdyYXBIZWlnaHQgIT0gdXBkYXRlLndyYXBwZXJIZWlnaHQgfHwgZGlzcGxheS5sYXN0V3JhcFdpZHRoICE9IHVwZGF0ZS53cmFwcGVyV2lkdGg7XG4gICAgYWRqdXN0VmlldyhjbSwgZnJvbSwgdG8pO1xuXG4gICAgZGlzcGxheS52aWV3T2Zmc2V0ID0gaGVpZ2h0QXRMaW5lKGdldExpbmUoY20uZG9jLCBkaXNwbGF5LnZpZXdGcm9tKSk7XG4gICAgLy8gUG9zaXRpb24gdGhlIG1vdmVyIGRpdiB0byBhbGlnbiB3aXRoIHRoZSBjdXJyZW50IHNjcm9sbCBwb3NpdGlvblxuICAgIGNtLmRpc3BsYXkubW92ZXIuc3R5bGUudG9wID0gZGlzcGxheS52aWV3T2Zmc2V0ICsgXCJweFwiO1xuXG4gICAgdmFyIHRvVXBkYXRlID0gY291bnREaXJ0eVZpZXcoY20pO1xuICAgIGlmICghZGlmZmVyZW50ICYmIHRvVXBkYXRlID09IDAgJiYgIXVwZGF0ZS5mb3JjZSAmJiBkaXNwbGF5LnJlbmRlcmVkVmlldyA9PSBkaXNwbGF5LnZpZXcgJiZcbiAgICAgICAgKGRpc3BsYXkudXBkYXRlTGluZU51bWJlcnMgPT0gbnVsbCB8fCBkaXNwbGF5LnVwZGF0ZUxpbmVOdW1iZXJzID49IGRpc3BsYXkudmlld1RvKSlcbiAgICAgIHJldHVybiBmYWxzZTtcblxuICAgIC8vIEZvciBiaWcgY2hhbmdlcywgd2UgaGlkZSB0aGUgZW5jbG9zaW5nIGVsZW1lbnQgZHVyaW5nIHRoZVxuICAgIC8vIHVwZGF0ZSwgc2luY2UgdGhhdCBzcGVlZHMgdXAgdGhlIG9wZXJhdGlvbnMgb24gbW9zdCBicm93c2Vycy5cbiAgICB2YXIgZm9jdXNlZCA9IGFjdGl2ZUVsdCgpO1xuICAgIGlmICh0b1VwZGF0ZSA+IDQpIGRpc3BsYXkubGluZURpdi5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgcGF0Y2hEaXNwbGF5KGNtLCBkaXNwbGF5LnVwZGF0ZUxpbmVOdW1iZXJzLCB1cGRhdGUuZGltcyk7XG4gICAgaWYgKHRvVXBkYXRlID4gNCkgZGlzcGxheS5saW5lRGl2LnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xuICAgIGRpc3BsYXkucmVuZGVyZWRWaWV3ID0gZGlzcGxheS52aWV3O1xuICAgIC8vIFRoZXJlIG1pZ2h0IGhhdmUgYmVlbiBhIHdpZGdldCB3aXRoIGEgZm9jdXNlZCBlbGVtZW50IHRoYXQgZ290XG4gICAgLy8gaGlkZGVuIG9yIHVwZGF0ZWQsIGlmIHNvIHJlLWZvY3VzIGl0LlxuICAgIGlmIChmb2N1c2VkICYmIGFjdGl2ZUVsdCgpICE9IGZvY3VzZWQgJiYgZm9jdXNlZC5vZmZzZXRIZWlnaHQpIGZvY3VzZWQuZm9jdXMoKTtcblxuICAgIC8vIFByZXZlbnQgc2VsZWN0aW9uIGFuZCBjdXJzb3JzIGZyb20gaW50ZXJmZXJpbmcgd2l0aCB0aGUgc2Nyb2xsXG4gICAgLy8gd2lkdGggYW5kIGhlaWdodC5cbiAgICByZW1vdmVDaGlsZHJlbihkaXNwbGF5LmN1cnNvckRpdik7XG4gICAgcmVtb3ZlQ2hpbGRyZW4oZGlzcGxheS5zZWxlY3Rpb25EaXYpO1xuICAgIGRpc3BsYXkuZ3V0dGVycy5zdHlsZS5oZWlnaHQgPSBkaXNwbGF5LnNpemVyLnN0eWxlLm1pbkhlaWdodCA9IDA7XG5cbiAgICBpZiAoZGlmZmVyZW50KSB7XG4gICAgICBkaXNwbGF5Lmxhc3RXcmFwSGVpZ2h0ID0gdXBkYXRlLndyYXBwZXJIZWlnaHQ7XG4gICAgICBkaXNwbGF5Lmxhc3RXcmFwV2lkdGggPSB1cGRhdGUud3JhcHBlcldpZHRoO1xuICAgICAgc3RhcnRXb3JrZXIoY20sIDQwMCk7XG4gICAgfVxuXG4gICAgZGlzcGxheS51cGRhdGVMaW5lTnVtYmVycyA9IG51bGw7XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBvc3RVcGRhdGVEaXNwbGF5KGNtLCB1cGRhdGUpIHtcbiAgICB2YXIgdmlld3BvcnQgPSB1cGRhdGUudmlld3BvcnQ7XG4gICAgZm9yICh2YXIgZmlyc3QgPSB0cnVlOzsgZmlyc3QgPSBmYWxzZSkge1xuICAgICAgaWYgKCFmaXJzdCB8fCAhY20ub3B0aW9ucy5saW5lV3JhcHBpbmcgfHwgdXBkYXRlLm9sZERpc3BsYXlXaWR0aCA9PSBkaXNwbGF5V2lkdGgoY20pKSB7XG4gICAgICAgIC8vIENsaXAgZm9yY2VkIHZpZXdwb3J0IHRvIGFjdHVhbCBzY3JvbGxhYmxlIGFyZWEuXG4gICAgICAgIGlmICh2aWV3cG9ydCAmJiB2aWV3cG9ydC50b3AgIT0gbnVsbClcbiAgICAgICAgICB2aWV3cG9ydCA9IHt0b3A6IE1hdGgubWluKGNtLmRvYy5oZWlnaHQgKyBwYWRkaW5nVmVydChjbS5kaXNwbGF5KSAtIGRpc3BsYXlIZWlnaHQoY20pLCB2aWV3cG9ydC50b3ApfTtcbiAgICAgICAgLy8gVXBkYXRlZCBsaW5lIGhlaWdodHMgbWlnaHQgcmVzdWx0IGluIHRoZSBkcmF3biBhcmVhIG5vdFxuICAgICAgICAvLyBhY3R1YWxseSBjb3ZlcmluZyB0aGUgdmlld3BvcnQuIEtlZXAgbG9vcGluZyB1bnRpbCBpdCBkb2VzLlxuICAgICAgICB1cGRhdGUudmlzaWJsZSA9IHZpc2libGVMaW5lcyhjbS5kaXNwbGF5LCBjbS5kb2MsIHZpZXdwb3J0KTtcbiAgICAgICAgaWYgKHVwZGF0ZS52aXNpYmxlLmZyb20gPj0gY20uZGlzcGxheS52aWV3RnJvbSAmJiB1cGRhdGUudmlzaWJsZS50byA8PSBjbS5kaXNwbGF5LnZpZXdUbylcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGlmICghdXBkYXRlRGlzcGxheUlmTmVlZGVkKGNtLCB1cGRhdGUpKSBicmVhaztcbiAgICAgIHVwZGF0ZUhlaWdodHNJblZpZXdwb3J0KGNtKTtcbiAgICAgIHZhciBiYXJNZWFzdXJlID0gbWVhc3VyZUZvclNjcm9sbGJhcnMoY20pO1xuICAgICAgdXBkYXRlU2VsZWN0aW9uKGNtKTtcbiAgICAgIHNldERvY3VtZW50SGVpZ2h0KGNtLCBiYXJNZWFzdXJlKTtcbiAgICAgIHVwZGF0ZVNjcm9sbGJhcnMoY20sIGJhck1lYXN1cmUpO1xuICAgIH1cblxuICAgIHVwZGF0ZS5zaWduYWwoY20sIFwidXBkYXRlXCIsIGNtKTtcbiAgICBpZiAoY20uZGlzcGxheS52aWV3RnJvbSAhPSBjbS5kaXNwbGF5LnJlcG9ydGVkVmlld0Zyb20gfHwgY20uZGlzcGxheS52aWV3VG8gIT0gY20uZGlzcGxheS5yZXBvcnRlZFZpZXdUbykge1xuICAgICAgdXBkYXRlLnNpZ25hbChjbSwgXCJ2aWV3cG9ydENoYW5nZVwiLCBjbSwgY20uZGlzcGxheS52aWV3RnJvbSwgY20uZGlzcGxheS52aWV3VG8pO1xuICAgICAgY20uZGlzcGxheS5yZXBvcnRlZFZpZXdGcm9tID0gY20uZGlzcGxheS52aWV3RnJvbTsgY20uZGlzcGxheS5yZXBvcnRlZFZpZXdUbyA9IGNtLmRpc3BsYXkudmlld1RvO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHVwZGF0ZURpc3BsYXlTaW1wbGUoY20sIHZpZXdwb3J0KSB7XG4gICAgdmFyIHVwZGF0ZSA9IG5ldyBEaXNwbGF5VXBkYXRlKGNtLCB2aWV3cG9ydCk7XG4gICAgaWYgKHVwZGF0ZURpc3BsYXlJZk5lZWRlZChjbSwgdXBkYXRlKSkge1xuICAgICAgdXBkYXRlSGVpZ2h0c0luVmlld3BvcnQoY20pO1xuICAgICAgcG9zdFVwZGF0ZURpc3BsYXkoY20sIHVwZGF0ZSk7XG4gICAgICB2YXIgYmFyTWVhc3VyZSA9IG1lYXN1cmVGb3JTY3JvbGxiYXJzKGNtKTtcbiAgICAgIHVwZGF0ZVNlbGVjdGlvbihjbSk7XG4gICAgICBzZXREb2N1bWVudEhlaWdodChjbSwgYmFyTWVhc3VyZSk7XG4gICAgICB1cGRhdGVTY3JvbGxiYXJzKGNtLCBiYXJNZWFzdXJlKTtcbiAgICAgIHVwZGF0ZS5maW5pc2goKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzZXREb2N1bWVudEhlaWdodChjbSwgbWVhc3VyZSkge1xuICAgIGNtLmRpc3BsYXkuc2l6ZXIuc3R5bGUubWluSGVpZ2h0ID0gbWVhc3VyZS5kb2NIZWlnaHQgKyBcInB4XCI7XG4gICAgdmFyIHRvdGFsID0gbWVhc3VyZS5kb2NIZWlnaHQgKyBjbS5kaXNwbGF5LmJhckhlaWdodDtcbiAgICBjbS5kaXNwbGF5LmhlaWdodEZvcmNlci5zdHlsZS50b3AgPSB0b3RhbCArIFwicHhcIjtcbiAgICBjbS5kaXNwbGF5Lmd1dHRlcnMuc3R5bGUuaGVpZ2h0ID0gTWF0aC5tYXgodG90YWwgKyBzY3JvbGxHYXAoY20pLCBtZWFzdXJlLmNsaWVudEhlaWdodCkgKyBcInB4XCI7XG4gIH1cblxuICAvLyBSZWFkIHRoZSBhY3R1YWwgaGVpZ2h0cyBvZiB0aGUgcmVuZGVyZWQgbGluZXMsIGFuZCB1cGRhdGUgdGhlaXJcbiAgLy8gc3RvcmVkIGhlaWdodHMgdG8gbWF0Y2guXG4gIGZ1bmN0aW9uIHVwZGF0ZUhlaWdodHNJblZpZXdwb3J0KGNtKSB7XG4gICAgdmFyIGRpc3BsYXkgPSBjbS5kaXNwbGF5O1xuICAgIHZhciBwcmV2Qm90dG9tID0gZGlzcGxheS5saW5lRGl2Lm9mZnNldFRvcDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRpc3BsYXkudmlldy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGN1ciA9IGRpc3BsYXkudmlld1tpXSwgaGVpZ2h0O1xuICAgICAgaWYgKGN1ci5oaWRkZW4pIGNvbnRpbnVlO1xuICAgICAgaWYgKGllICYmIGllX3ZlcnNpb24gPCA4KSB7XG4gICAgICAgIHZhciBib3QgPSBjdXIubm9kZS5vZmZzZXRUb3AgKyBjdXIubm9kZS5vZmZzZXRIZWlnaHQ7XG4gICAgICAgIGhlaWdodCA9IGJvdCAtIHByZXZCb3R0b207XG4gICAgICAgIHByZXZCb3R0b20gPSBib3Q7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgYm94ID0gY3VyLm5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIGhlaWdodCA9IGJveC5ib3R0b20gLSBib3gudG9wO1xuICAgICAgfVxuICAgICAgdmFyIGRpZmYgPSBjdXIubGluZS5oZWlnaHQgLSBoZWlnaHQ7XG4gICAgICBpZiAoaGVpZ2h0IDwgMikgaGVpZ2h0ID0gdGV4dEhlaWdodChkaXNwbGF5KTtcbiAgICAgIGlmIChkaWZmID4gLjAwMSB8fCBkaWZmIDwgLS4wMDEpIHtcbiAgICAgICAgdXBkYXRlTGluZUhlaWdodChjdXIubGluZSwgaGVpZ2h0KTtcbiAgICAgICAgdXBkYXRlV2lkZ2V0SGVpZ2h0KGN1ci5saW5lKTtcbiAgICAgICAgaWYgKGN1ci5yZXN0KSBmb3IgKHZhciBqID0gMDsgaiA8IGN1ci5yZXN0Lmxlbmd0aDsgaisrKVxuICAgICAgICAgIHVwZGF0ZVdpZGdldEhlaWdodChjdXIucmVzdFtqXSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gUmVhZCBhbmQgc3RvcmUgdGhlIGhlaWdodCBvZiBsaW5lIHdpZGdldHMgYXNzb2NpYXRlZCB3aXRoIHRoZVxuICAvLyBnaXZlbiBsaW5lLlxuICBmdW5jdGlvbiB1cGRhdGVXaWRnZXRIZWlnaHQobGluZSkge1xuICAgIGlmIChsaW5lLndpZGdldHMpIGZvciAodmFyIGkgPSAwOyBpIDwgbGluZS53aWRnZXRzLmxlbmd0aDsgKytpKVxuICAgICAgbGluZS53aWRnZXRzW2ldLmhlaWdodCA9IGxpbmUud2lkZ2V0c1tpXS5ub2RlLm9mZnNldEhlaWdodDtcbiAgfVxuXG4gIC8vIERvIGEgYnVsay1yZWFkIG9mIHRoZSBET00gcG9zaXRpb25zIGFuZCBzaXplcyBuZWVkZWQgdG8gZHJhdyB0aGVcbiAgLy8gdmlldywgc28gdGhhdCB3ZSBkb24ndCBpbnRlcmxlYXZlIHJlYWRpbmcgYW5kIHdyaXRpbmcgdG8gdGhlIERPTS5cbiAgZnVuY3Rpb24gZ2V0RGltZW5zaW9ucyhjbSkge1xuICAgIHZhciBkID0gY20uZGlzcGxheSwgbGVmdCA9IHt9LCB3aWR0aCA9IHt9O1xuICAgIHZhciBndXR0ZXJMZWZ0ID0gZC5ndXR0ZXJzLmNsaWVudExlZnQ7XG4gICAgZm9yICh2YXIgbiA9IGQuZ3V0dGVycy5maXJzdENoaWxkLCBpID0gMDsgbjsgbiA9IG4ubmV4dFNpYmxpbmcsICsraSkge1xuICAgICAgbGVmdFtjbS5vcHRpb25zLmd1dHRlcnNbaV1dID0gbi5vZmZzZXRMZWZ0ICsgbi5jbGllbnRMZWZ0ICsgZ3V0dGVyTGVmdDtcbiAgICAgIHdpZHRoW2NtLm9wdGlvbnMuZ3V0dGVyc1tpXV0gPSBuLmNsaWVudFdpZHRoO1xuICAgIH1cbiAgICByZXR1cm4ge2ZpeGVkUG9zOiBjb21wZW5zYXRlRm9ySFNjcm9sbChkKSxcbiAgICAgICAgICAgIGd1dHRlclRvdGFsV2lkdGg6IGQuZ3V0dGVycy5vZmZzZXRXaWR0aCxcbiAgICAgICAgICAgIGd1dHRlckxlZnQ6IGxlZnQsXG4gICAgICAgICAgICBndXR0ZXJXaWR0aDogd2lkdGgsXG4gICAgICAgICAgICB3cmFwcGVyV2lkdGg6IGQud3JhcHBlci5jbGllbnRXaWR0aH07XG4gIH1cblxuICAvLyBTeW5jIHRoZSBhY3R1YWwgZGlzcGxheSBET00gc3RydWN0dXJlIHdpdGggZGlzcGxheS52aWV3LCByZW1vdmluZ1xuICAvLyBub2RlcyBmb3IgbGluZXMgdGhhdCBhcmUgbm8gbG9uZ2VyIGluIHZpZXcsIGFuZCBjcmVhdGluZyB0aGUgb25lc1xuICAvLyB0aGF0IGFyZSBub3QgdGhlcmUgeWV0LCBhbmQgdXBkYXRpbmcgdGhlIG9uZXMgdGhhdCBhcmUgb3V0IG9mXG4gIC8vIGRhdGUuXG4gIGZ1bmN0aW9uIHBhdGNoRGlzcGxheShjbSwgdXBkYXRlTnVtYmVyc0Zyb20sIGRpbXMpIHtcbiAgICB2YXIgZGlzcGxheSA9IGNtLmRpc3BsYXksIGxpbmVOdW1iZXJzID0gY20ub3B0aW9ucy5saW5lTnVtYmVycztcbiAgICB2YXIgY29udGFpbmVyID0gZGlzcGxheS5saW5lRGl2LCBjdXIgPSBjb250YWluZXIuZmlyc3RDaGlsZDtcblxuICAgIGZ1bmN0aW9uIHJtKG5vZGUpIHtcbiAgICAgIHZhciBuZXh0ID0gbm9kZS5uZXh0U2libGluZztcbiAgICAgIC8vIFdvcmtzIGFyb3VuZCBhIHRocm93LXNjcm9sbCBidWcgaW4gT1MgWCBXZWJraXRcbiAgICAgIGlmICh3ZWJraXQgJiYgbWFjICYmIGNtLmRpc3BsYXkuY3VycmVudFdoZWVsVGFyZ2V0ID09IG5vZGUpXG4gICAgICAgIG5vZGUuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgZWxzZVxuICAgICAgICBub2RlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobm9kZSk7XG4gICAgICByZXR1cm4gbmV4dDtcbiAgICB9XG5cbiAgICB2YXIgdmlldyA9IGRpc3BsYXkudmlldywgbGluZU4gPSBkaXNwbGF5LnZpZXdGcm9tO1xuICAgIC8vIExvb3Agb3ZlciB0aGUgZWxlbWVudHMgaW4gdGhlIHZpZXcsIHN5bmNpbmcgY3VyICh0aGUgRE9NIG5vZGVzXG4gICAgLy8gaW4gZGlzcGxheS5saW5lRGl2KSB3aXRoIHRoZSB2aWV3IGFzIHdlIGdvLlxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdmlldy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGxpbmVWaWV3ID0gdmlld1tpXTtcbiAgICAgIGlmIChsaW5lVmlldy5oaWRkZW4pIHtcbiAgICAgIH0gZWxzZSBpZiAoIWxpbmVWaWV3Lm5vZGUgfHwgbGluZVZpZXcubm9kZS5wYXJlbnROb2RlICE9IGNvbnRhaW5lcikgeyAvLyBOb3QgZHJhd24geWV0XG4gICAgICAgIHZhciBub2RlID0gYnVpbGRMaW5lRWxlbWVudChjbSwgbGluZVZpZXcsIGxpbmVOLCBkaW1zKTtcbiAgICAgICAgY29udGFpbmVyLmluc2VydEJlZm9yZShub2RlLCBjdXIpO1xuICAgICAgfSBlbHNlIHsgLy8gQWxyZWFkeSBkcmF3blxuICAgICAgICB3aGlsZSAoY3VyICE9IGxpbmVWaWV3Lm5vZGUpIGN1ciA9IHJtKGN1cik7XG4gICAgICAgIHZhciB1cGRhdGVOdW1iZXIgPSBsaW5lTnVtYmVycyAmJiB1cGRhdGVOdW1iZXJzRnJvbSAhPSBudWxsICYmXG4gICAgICAgICAgdXBkYXRlTnVtYmVyc0Zyb20gPD0gbGluZU4gJiYgbGluZVZpZXcubGluZU51bWJlcjtcbiAgICAgICAgaWYgKGxpbmVWaWV3LmNoYW5nZXMpIHtcbiAgICAgICAgICBpZiAoaW5kZXhPZihsaW5lVmlldy5jaGFuZ2VzLCBcImd1dHRlclwiKSA+IC0xKSB1cGRhdGVOdW1iZXIgPSBmYWxzZTtcbiAgICAgICAgICB1cGRhdGVMaW5lRm9yQ2hhbmdlcyhjbSwgbGluZVZpZXcsIGxpbmVOLCBkaW1zKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodXBkYXRlTnVtYmVyKSB7XG4gICAgICAgICAgcmVtb3ZlQ2hpbGRyZW4obGluZVZpZXcubGluZU51bWJlcik7XG4gICAgICAgICAgbGluZVZpZXcubGluZU51bWJlci5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShsaW5lTnVtYmVyRm9yKGNtLm9wdGlvbnMsIGxpbmVOKSkpO1xuICAgICAgICB9XG4gICAgICAgIGN1ciA9IGxpbmVWaWV3Lm5vZGUubmV4dFNpYmxpbmc7XG4gICAgICB9XG4gICAgICBsaW5lTiArPSBsaW5lVmlldy5zaXplO1xuICAgIH1cbiAgICB3aGlsZSAoY3VyKSBjdXIgPSBybShjdXIpO1xuICB9XG5cbiAgLy8gV2hlbiBhbiBhc3BlY3Qgb2YgYSBsaW5lIGNoYW5nZXMsIGEgc3RyaW5nIGlzIGFkZGVkIHRvXG4gIC8vIGxpbmVWaWV3LmNoYW5nZXMuIFRoaXMgdXBkYXRlcyB0aGUgcmVsZXZhbnQgcGFydCBvZiB0aGUgbGluZSdzXG4gIC8vIERPTSBzdHJ1Y3R1cmUuXG4gIGZ1bmN0aW9uIHVwZGF0ZUxpbmVGb3JDaGFuZ2VzKGNtLCBsaW5lVmlldywgbGluZU4sIGRpbXMpIHtcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IGxpbmVWaWV3LmNoYW5nZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgIHZhciB0eXBlID0gbGluZVZpZXcuY2hhbmdlc1tqXTtcbiAgICAgIGlmICh0eXBlID09IFwidGV4dFwiKSB1cGRhdGVMaW5lVGV4dChjbSwgbGluZVZpZXcpO1xuICAgICAgZWxzZSBpZiAodHlwZSA9PSBcImd1dHRlclwiKSB1cGRhdGVMaW5lR3V0dGVyKGNtLCBsaW5lVmlldywgbGluZU4sIGRpbXMpO1xuICAgICAgZWxzZSBpZiAodHlwZSA9PSBcImNsYXNzXCIpIHVwZGF0ZUxpbmVDbGFzc2VzKGxpbmVWaWV3KTtcbiAgICAgIGVsc2UgaWYgKHR5cGUgPT0gXCJ3aWRnZXRcIikgdXBkYXRlTGluZVdpZGdldHMoY20sIGxpbmVWaWV3LCBkaW1zKTtcbiAgICB9XG4gICAgbGluZVZpZXcuY2hhbmdlcyA9IG51bGw7XG4gIH1cblxuICAvLyBMaW5lcyB3aXRoIGd1dHRlciBlbGVtZW50cywgd2lkZ2V0cyBvciBhIGJhY2tncm91bmQgY2xhc3MgbmVlZCB0b1xuICAvLyBiZSB3cmFwcGVkLCBhbmQgaGF2ZSB0aGUgZXh0cmEgZWxlbWVudHMgYWRkZWQgdG8gdGhlIHdyYXBwZXIgZGl2XG4gIGZ1bmN0aW9uIGVuc3VyZUxpbmVXcmFwcGVkKGxpbmVWaWV3KSB7XG4gICAgaWYgKGxpbmVWaWV3Lm5vZGUgPT0gbGluZVZpZXcudGV4dCkge1xuICAgICAgbGluZVZpZXcubm9kZSA9IGVsdChcImRpdlwiLCBudWxsLCBudWxsLCBcInBvc2l0aW9uOiByZWxhdGl2ZVwiKTtcbiAgICAgIGlmIChsaW5lVmlldy50ZXh0LnBhcmVudE5vZGUpXG4gICAgICAgIGxpbmVWaWV3LnRleHQucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQobGluZVZpZXcubm9kZSwgbGluZVZpZXcudGV4dCk7XG4gICAgICBsaW5lVmlldy5ub2RlLmFwcGVuZENoaWxkKGxpbmVWaWV3LnRleHQpO1xuICAgICAgaWYgKGllICYmIGllX3ZlcnNpb24gPCA4KSBsaW5lVmlldy5ub2RlLnN0eWxlLnpJbmRleCA9IDI7XG4gICAgfVxuICAgIHJldHVybiBsaW5lVmlldy5ub2RlO1xuICB9XG5cbiAgZnVuY3Rpb24gdXBkYXRlTGluZUJhY2tncm91bmQobGluZVZpZXcpIHtcbiAgICB2YXIgY2xzID0gbGluZVZpZXcuYmdDbGFzcyA/IGxpbmVWaWV3LmJnQ2xhc3MgKyBcIiBcIiArIChsaW5lVmlldy5saW5lLmJnQ2xhc3MgfHwgXCJcIikgOiBsaW5lVmlldy5saW5lLmJnQ2xhc3M7XG4gICAgaWYgKGNscykgY2xzICs9IFwiIENvZGVNaXJyb3ItbGluZWJhY2tncm91bmRcIjtcbiAgICBpZiAobGluZVZpZXcuYmFja2dyb3VuZCkge1xuICAgICAgaWYgKGNscykgbGluZVZpZXcuYmFja2dyb3VuZC5jbGFzc05hbWUgPSBjbHM7XG4gICAgICBlbHNlIHsgbGluZVZpZXcuYmFja2dyb3VuZC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGxpbmVWaWV3LmJhY2tncm91bmQpOyBsaW5lVmlldy5iYWNrZ3JvdW5kID0gbnVsbDsgfVxuICAgIH0gZWxzZSBpZiAoY2xzKSB7XG4gICAgICB2YXIgd3JhcCA9IGVuc3VyZUxpbmVXcmFwcGVkKGxpbmVWaWV3KTtcbiAgICAgIGxpbmVWaWV3LmJhY2tncm91bmQgPSB3cmFwLmluc2VydEJlZm9yZShlbHQoXCJkaXZcIiwgbnVsbCwgY2xzKSwgd3JhcC5maXJzdENoaWxkKTtcbiAgICB9XG4gIH1cblxuICAvLyBXcmFwcGVyIGFyb3VuZCBidWlsZExpbmVDb250ZW50IHdoaWNoIHdpbGwgcmV1c2UgdGhlIHN0cnVjdHVyZVxuICAvLyBpbiBkaXNwbGF5LmV4dGVybmFsTWVhc3VyZWQgd2hlbiBwb3NzaWJsZS5cbiAgZnVuY3Rpb24gZ2V0TGluZUNvbnRlbnQoY20sIGxpbmVWaWV3KSB7XG4gICAgdmFyIGV4dCA9IGNtLmRpc3BsYXkuZXh0ZXJuYWxNZWFzdXJlZDtcbiAgICBpZiAoZXh0ICYmIGV4dC5saW5lID09IGxpbmVWaWV3LmxpbmUpIHtcbiAgICAgIGNtLmRpc3BsYXkuZXh0ZXJuYWxNZWFzdXJlZCA9IG51bGw7XG4gICAgICBsaW5lVmlldy5tZWFzdXJlID0gZXh0Lm1lYXN1cmU7XG4gICAgICByZXR1cm4gZXh0LmJ1aWx0O1xuICAgIH1cbiAgICByZXR1cm4gYnVpbGRMaW5lQ29udGVudChjbSwgbGluZVZpZXcpO1xuICB9XG5cbiAgLy8gUmVkcmF3IHRoZSBsaW5lJ3MgdGV4dC4gSW50ZXJhY3RzIHdpdGggdGhlIGJhY2tncm91bmQgYW5kIHRleHRcbiAgLy8gY2xhc3NlcyBiZWNhdXNlIHRoZSBtb2RlIG1heSBvdXRwdXQgdG9rZW5zIHRoYXQgaW5mbHVlbmNlIHRoZXNlXG4gIC8vIGNsYXNzZXMuXG4gIGZ1bmN0aW9uIHVwZGF0ZUxpbmVUZXh0KGNtLCBsaW5lVmlldykge1xuICAgIHZhciBjbHMgPSBsaW5lVmlldy50ZXh0LmNsYXNzTmFtZTtcbiAgICB2YXIgYnVpbHQgPSBnZXRMaW5lQ29udGVudChjbSwgbGluZVZpZXcpO1xuICAgIGlmIChsaW5lVmlldy50ZXh0ID09IGxpbmVWaWV3Lm5vZGUpIGxpbmVWaWV3Lm5vZGUgPSBidWlsdC5wcmU7XG4gICAgbGluZVZpZXcudGV4dC5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChidWlsdC5wcmUsIGxpbmVWaWV3LnRleHQpO1xuICAgIGxpbmVWaWV3LnRleHQgPSBidWlsdC5wcmU7XG4gICAgaWYgKGJ1aWx0LmJnQ2xhc3MgIT0gbGluZVZpZXcuYmdDbGFzcyB8fCBidWlsdC50ZXh0Q2xhc3MgIT0gbGluZVZpZXcudGV4dENsYXNzKSB7XG4gICAgICBsaW5lVmlldy5iZ0NsYXNzID0gYnVpbHQuYmdDbGFzcztcbiAgICAgIGxpbmVWaWV3LnRleHRDbGFzcyA9IGJ1aWx0LnRleHRDbGFzcztcbiAgICAgIHVwZGF0ZUxpbmVDbGFzc2VzKGxpbmVWaWV3KTtcbiAgICB9IGVsc2UgaWYgKGNscykge1xuICAgICAgbGluZVZpZXcudGV4dC5jbGFzc05hbWUgPSBjbHM7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdXBkYXRlTGluZUNsYXNzZXMobGluZVZpZXcpIHtcbiAgICB1cGRhdGVMaW5lQmFja2dyb3VuZChsaW5lVmlldyk7XG4gICAgaWYgKGxpbmVWaWV3LmxpbmUud3JhcENsYXNzKVxuICAgICAgZW5zdXJlTGluZVdyYXBwZWQobGluZVZpZXcpLmNsYXNzTmFtZSA9IGxpbmVWaWV3LmxpbmUud3JhcENsYXNzO1xuICAgIGVsc2UgaWYgKGxpbmVWaWV3Lm5vZGUgIT0gbGluZVZpZXcudGV4dClcbiAgICAgIGxpbmVWaWV3Lm5vZGUuY2xhc3NOYW1lID0gXCJcIjtcbiAgICB2YXIgdGV4dENsYXNzID0gbGluZVZpZXcudGV4dENsYXNzID8gbGluZVZpZXcudGV4dENsYXNzICsgXCIgXCIgKyAobGluZVZpZXcubGluZS50ZXh0Q2xhc3MgfHwgXCJcIikgOiBsaW5lVmlldy5saW5lLnRleHRDbGFzcztcbiAgICBsaW5lVmlldy50ZXh0LmNsYXNzTmFtZSA9IHRleHRDbGFzcyB8fCBcIlwiO1xuICB9XG5cbiAgZnVuY3Rpb24gdXBkYXRlTGluZUd1dHRlcihjbSwgbGluZVZpZXcsIGxpbmVOLCBkaW1zKSB7XG4gICAgaWYgKGxpbmVWaWV3Lmd1dHRlcikge1xuICAgICAgbGluZVZpZXcubm9kZS5yZW1vdmVDaGlsZChsaW5lVmlldy5ndXR0ZXIpO1xuICAgICAgbGluZVZpZXcuZ3V0dGVyID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKGxpbmVWaWV3Lmd1dHRlckJhY2tncm91bmQpIHtcbiAgICAgIGxpbmVWaWV3Lm5vZGUucmVtb3ZlQ2hpbGQobGluZVZpZXcuZ3V0dGVyQmFja2dyb3VuZCk7XG4gICAgICBsaW5lVmlldy5ndXR0ZXJCYWNrZ3JvdW5kID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKGxpbmVWaWV3LmxpbmUuZ3V0dGVyQ2xhc3MpIHtcbiAgICAgIHZhciB3cmFwID0gZW5zdXJlTGluZVdyYXBwZWQobGluZVZpZXcpO1xuICAgICAgbGluZVZpZXcuZ3V0dGVyQmFja2dyb3VuZCA9IGVsdChcImRpdlwiLCBudWxsLCBcIkNvZGVNaXJyb3ItZ3V0dGVyLWJhY2tncm91bmQgXCIgKyBsaW5lVmlldy5saW5lLmd1dHRlckNsYXNzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImxlZnQ6IFwiICsgKGNtLm9wdGlvbnMuZml4ZWRHdXR0ZXIgPyBkaW1zLmZpeGVkUG9zIDogLWRpbXMuZ3V0dGVyVG90YWxXaWR0aCkgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInB4OyB3aWR0aDogXCIgKyBkaW1zLmd1dHRlclRvdGFsV2lkdGggKyBcInB4XCIpO1xuICAgICAgd3JhcC5pbnNlcnRCZWZvcmUobGluZVZpZXcuZ3V0dGVyQmFja2dyb3VuZCwgbGluZVZpZXcudGV4dCk7XG4gICAgfVxuICAgIHZhciBtYXJrZXJzID0gbGluZVZpZXcubGluZS5ndXR0ZXJNYXJrZXJzO1xuICAgIGlmIChjbS5vcHRpb25zLmxpbmVOdW1iZXJzIHx8IG1hcmtlcnMpIHtcbiAgICAgIHZhciB3cmFwID0gZW5zdXJlTGluZVdyYXBwZWQobGluZVZpZXcpO1xuICAgICAgdmFyIGd1dHRlcldyYXAgPSBsaW5lVmlldy5ndXR0ZXIgPSBlbHQoXCJkaXZcIiwgbnVsbCwgXCJDb2RlTWlycm9yLWd1dHRlci13cmFwcGVyXCIsIFwibGVmdDogXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGNtLm9wdGlvbnMuZml4ZWRHdXR0ZXIgPyBkaW1zLmZpeGVkUG9zIDogLWRpbXMuZ3V0dGVyVG90YWxXaWR0aCkgKyBcInB4XCIpO1xuICAgICAgY20uZGlzcGxheS5pbnB1dC5zZXRVbmVkaXRhYmxlKGd1dHRlcldyYXApO1xuICAgICAgd3JhcC5pbnNlcnRCZWZvcmUoZ3V0dGVyV3JhcCwgbGluZVZpZXcudGV4dCk7XG4gICAgICBpZiAobGluZVZpZXcubGluZS5ndXR0ZXJDbGFzcylcbiAgICAgICAgZ3V0dGVyV3JhcC5jbGFzc05hbWUgKz0gXCIgXCIgKyBsaW5lVmlldy5saW5lLmd1dHRlckNsYXNzO1xuICAgICAgaWYgKGNtLm9wdGlvbnMubGluZU51bWJlcnMgJiYgKCFtYXJrZXJzIHx8ICFtYXJrZXJzW1wiQ29kZU1pcnJvci1saW5lbnVtYmVyc1wiXSkpXG4gICAgICAgIGxpbmVWaWV3LmxpbmVOdW1iZXIgPSBndXR0ZXJXcmFwLmFwcGVuZENoaWxkKFxuICAgICAgICAgIGVsdChcImRpdlwiLCBsaW5lTnVtYmVyRm9yKGNtLm9wdGlvbnMsIGxpbmVOKSxcbiAgICAgICAgICAgICAgXCJDb2RlTWlycm9yLWxpbmVudW1iZXIgQ29kZU1pcnJvci1ndXR0ZXItZWx0XCIsXG4gICAgICAgICAgICAgIFwibGVmdDogXCIgKyBkaW1zLmd1dHRlckxlZnRbXCJDb2RlTWlycm9yLWxpbmVudW1iZXJzXCJdICsgXCJweDsgd2lkdGg6IFwiXG4gICAgICAgICAgICAgICsgY20uZGlzcGxheS5saW5lTnVtSW5uZXJXaWR0aCArIFwicHhcIikpO1xuICAgICAgaWYgKG1hcmtlcnMpIGZvciAodmFyIGsgPSAwOyBrIDwgY20ub3B0aW9ucy5ndXR0ZXJzLmxlbmd0aDsgKytrKSB7XG4gICAgICAgIHZhciBpZCA9IGNtLm9wdGlvbnMuZ3V0dGVyc1trXSwgZm91bmQgPSBtYXJrZXJzLmhhc093blByb3BlcnR5KGlkKSAmJiBtYXJrZXJzW2lkXTtcbiAgICAgICAgaWYgKGZvdW5kKVxuICAgICAgICAgIGd1dHRlcldyYXAuYXBwZW5kQ2hpbGQoZWx0KFwiZGl2XCIsIFtmb3VuZF0sIFwiQ29kZU1pcnJvci1ndXR0ZXItZWx0XCIsIFwibGVmdDogXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpbXMuZ3V0dGVyTGVmdFtpZF0gKyBcInB4OyB3aWR0aDogXCIgKyBkaW1zLmd1dHRlcldpZHRoW2lkXSArIFwicHhcIikpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHVwZGF0ZUxpbmVXaWRnZXRzKGNtLCBsaW5lVmlldywgZGltcykge1xuICAgIGlmIChsaW5lVmlldy5hbGlnbmFibGUpIGxpbmVWaWV3LmFsaWduYWJsZSA9IG51bGw7XG4gICAgZm9yICh2YXIgbm9kZSA9IGxpbmVWaWV3Lm5vZGUuZmlyc3RDaGlsZCwgbmV4dDsgbm9kZTsgbm9kZSA9IG5leHQpIHtcbiAgICAgIHZhciBuZXh0ID0gbm9kZS5uZXh0U2libGluZztcbiAgICAgIGlmIChub2RlLmNsYXNzTmFtZSA9PSBcIkNvZGVNaXJyb3ItbGluZXdpZGdldFwiKVxuICAgICAgICBsaW5lVmlldy5ub2RlLnJlbW92ZUNoaWxkKG5vZGUpO1xuICAgIH1cbiAgICBpbnNlcnRMaW5lV2lkZ2V0cyhjbSwgbGluZVZpZXcsIGRpbXMpO1xuICB9XG5cbiAgLy8gQnVpbGQgYSBsaW5lJ3MgRE9NIHJlcHJlc2VudGF0aW9uIGZyb20gc2NyYXRjaFxuICBmdW5jdGlvbiBidWlsZExpbmVFbGVtZW50KGNtLCBsaW5lVmlldywgbGluZU4sIGRpbXMpIHtcbiAgICB2YXIgYnVpbHQgPSBnZXRMaW5lQ29udGVudChjbSwgbGluZVZpZXcpO1xuICAgIGxpbmVWaWV3LnRleHQgPSBsaW5lVmlldy5ub2RlID0gYnVpbHQucHJlO1xuICAgIGlmIChidWlsdC5iZ0NsYXNzKSBsaW5lVmlldy5iZ0NsYXNzID0gYnVpbHQuYmdDbGFzcztcbiAgICBpZiAoYnVpbHQudGV4dENsYXNzKSBsaW5lVmlldy50ZXh0Q2xhc3MgPSBidWlsdC50ZXh0Q2xhc3M7XG5cbiAgICB1cGRhdGVMaW5lQ2xhc3NlcyhsaW5lVmlldyk7XG4gICAgdXBkYXRlTGluZUd1dHRlcihjbSwgbGluZVZpZXcsIGxpbmVOLCBkaW1zKTtcbiAgICBpbnNlcnRMaW5lV2lkZ2V0cyhjbSwgbGluZVZpZXcsIGRpbXMpO1xuICAgIHJldHVybiBsaW5lVmlldy5ub2RlO1xuICB9XG5cbiAgLy8gQSBsaW5lVmlldyBtYXkgY29udGFpbiBtdWx0aXBsZSBsb2dpY2FsIGxpbmVzICh3aGVuIG1lcmdlZCBieVxuICAvLyBjb2xsYXBzZWQgc3BhbnMpLiBUaGUgd2lkZ2V0cyBmb3IgYWxsIG9mIHRoZW0gbmVlZCB0byBiZSBkcmF3bi5cbiAgZnVuY3Rpb24gaW5zZXJ0TGluZVdpZGdldHMoY20sIGxpbmVWaWV3LCBkaW1zKSB7XG4gICAgaW5zZXJ0TGluZVdpZGdldHNGb3IoY20sIGxpbmVWaWV3LmxpbmUsIGxpbmVWaWV3LCBkaW1zLCB0cnVlKTtcbiAgICBpZiAobGluZVZpZXcucmVzdCkgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5lVmlldy5yZXN0Lmxlbmd0aDsgaSsrKVxuICAgICAgaW5zZXJ0TGluZVdpZGdldHNGb3IoY20sIGxpbmVWaWV3LnJlc3RbaV0sIGxpbmVWaWV3LCBkaW1zLCBmYWxzZSk7XG4gIH1cblxuICBmdW5jdGlvbiBpbnNlcnRMaW5lV2lkZ2V0c0ZvcihjbSwgbGluZSwgbGluZVZpZXcsIGRpbXMsIGFsbG93QWJvdmUpIHtcbiAgICBpZiAoIWxpbmUud2lkZ2V0cykgcmV0dXJuO1xuICAgIHZhciB3cmFwID0gZW5zdXJlTGluZVdyYXBwZWQobGluZVZpZXcpO1xuICAgIGZvciAodmFyIGkgPSAwLCB3cyA9IGxpbmUud2lkZ2V0czsgaSA8IHdzLmxlbmd0aDsgKytpKSB7XG4gICAgICB2YXIgd2lkZ2V0ID0gd3NbaV0sIG5vZGUgPSBlbHQoXCJkaXZcIiwgW3dpZGdldC5ub2RlXSwgXCJDb2RlTWlycm9yLWxpbmV3aWRnZXRcIik7XG4gICAgICBpZiAoIXdpZGdldC5oYW5kbGVNb3VzZUV2ZW50cykgbm9kZS5zZXRBdHRyaWJ1dGUoXCJjbS1pZ25vcmUtZXZlbnRzXCIsIFwidHJ1ZVwiKTtcbiAgICAgIHBvc2l0aW9uTGluZVdpZGdldCh3aWRnZXQsIG5vZGUsIGxpbmVWaWV3LCBkaW1zKTtcbiAgICAgIGNtLmRpc3BsYXkuaW5wdXQuc2V0VW5lZGl0YWJsZShub2RlKTtcbiAgICAgIGlmIChhbGxvd0Fib3ZlICYmIHdpZGdldC5hYm92ZSlcbiAgICAgICAgd3JhcC5pbnNlcnRCZWZvcmUobm9kZSwgbGluZVZpZXcuZ3V0dGVyIHx8IGxpbmVWaWV3LnRleHQpO1xuICAgICAgZWxzZVxuICAgICAgICB3cmFwLmFwcGVuZENoaWxkKG5vZGUpO1xuICAgICAgc2lnbmFsTGF0ZXIod2lkZ2V0LCBcInJlZHJhd1wiKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBwb3NpdGlvbkxpbmVXaWRnZXQod2lkZ2V0LCBub2RlLCBsaW5lVmlldywgZGltcykge1xuICAgIGlmICh3aWRnZXQubm9IU2Nyb2xsKSB7XG4gICAgICAobGluZVZpZXcuYWxpZ25hYmxlIHx8IChsaW5lVmlldy5hbGlnbmFibGUgPSBbXSkpLnB1c2gobm9kZSk7XG4gICAgICB2YXIgd2lkdGggPSBkaW1zLndyYXBwZXJXaWR0aDtcbiAgICAgIG5vZGUuc3R5bGUubGVmdCA9IGRpbXMuZml4ZWRQb3MgKyBcInB4XCI7XG4gICAgICBpZiAoIXdpZGdldC5jb3Zlckd1dHRlcikge1xuICAgICAgICB3aWR0aCAtPSBkaW1zLmd1dHRlclRvdGFsV2lkdGg7XG4gICAgICAgIG5vZGUuc3R5bGUucGFkZGluZ0xlZnQgPSBkaW1zLmd1dHRlclRvdGFsV2lkdGggKyBcInB4XCI7XG4gICAgICB9XG4gICAgICBub2RlLnN0eWxlLndpZHRoID0gd2lkdGggKyBcInB4XCI7XG4gICAgfVxuICAgIGlmICh3aWRnZXQuY292ZXJHdXR0ZXIpIHtcbiAgICAgIG5vZGUuc3R5bGUuekluZGV4ID0gNTtcbiAgICAgIG5vZGUuc3R5bGUucG9zaXRpb24gPSBcInJlbGF0aXZlXCI7XG4gICAgICBpZiAoIXdpZGdldC5ub0hTY3JvbGwpIG5vZGUuc3R5bGUubWFyZ2luTGVmdCA9IC1kaW1zLmd1dHRlclRvdGFsV2lkdGggKyBcInB4XCI7XG4gICAgfVxuICB9XG5cbiAgLy8gUE9TSVRJT04gT0JKRUNUXG5cbiAgLy8gQSBQb3MgaW5zdGFuY2UgcmVwcmVzZW50cyBhIHBvc2l0aW9uIHdpdGhpbiB0aGUgdGV4dC5cbiAgdmFyIFBvcyA9IENvZGVNaXJyb3IuUG9zID0gZnVuY3Rpb24obGluZSwgY2gpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgUG9zKSkgcmV0dXJuIG5ldyBQb3MobGluZSwgY2gpO1xuICAgIHRoaXMubGluZSA9IGxpbmU7IHRoaXMuY2ggPSBjaDtcbiAgfTtcblxuICAvLyBDb21wYXJlIHR3byBwb3NpdGlvbnMsIHJldHVybiAwIGlmIHRoZXkgYXJlIHRoZSBzYW1lLCBhIG5lZ2F0aXZlXG4gIC8vIG51bWJlciB3aGVuIGEgaXMgbGVzcywgYW5kIGEgcG9zaXRpdmUgbnVtYmVyIG90aGVyd2lzZS5cbiAgdmFyIGNtcCA9IENvZGVNaXJyb3IuY21wUG9zID0gZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gYS5saW5lIC0gYi5saW5lIHx8IGEuY2ggLSBiLmNoOyB9O1xuXG4gIGZ1bmN0aW9uIGNvcHlQb3MoeCkge3JldHVybiBQb3MoeC5saW5lLCB4LmNoKTt9XG4gIGZ1bmN0aW9uIG1heFBvcyhhLCBiKSB7IHJldHVybiBjbXAoYSwgYikgPCAwID8gYiA6IGE7IH1cbiAgZnVuY3Rpb24gbWluUG9zKGEsIGIpIHsgcmV0dXJuIGNtcChhLCBiKSA8IDAgPyBhIDogYjsgfVxuXG4gIC8vIElOUFVUIEhBTkRMSU5HXG5cbiAgZnVuY3Rpb24gZW5zdXJlRm9jdXMoY20pIHtcbiAgICBpZiAoIWNtLnN0YXRlLmZvY3VzZWQpIHsgY20uZGlzcGxheS5pbnB1dC5mb2N1cygpOyBvbkZvY3VzKGNtKTsgfVxuICB9XG5cbiAgZnVuY3Rpb24gaXNSZWFkT25seShjbSkge1xuICAgIHJldHVybiBjbS5vcHRpb25zLnJlYWRPbmx5IHx8IGNtLmRvYy5jYW50RWRpdDtcbiAgfVxuXG4gIC8vIFRoaXMgd2lsbCBiZSBzZXQgdG8gYW4gYXJyYXkgb2Ygc3RyaW5ncyB3aGVuIGNvcHlpbmcsIHNvIHRoYXQsXG4gIC8vIHdoZW4gcGFzdGluZywgd2Uga25vdyB3aGF0IGtpbmQgb2Ygc2VsZWN0aW9ucyB0aGUgY29waWVkIHRleHRcbiAgLy8gd2FzIG1hZGUgb3V0IG9mLlxuICB2YXIgbGFzdENvcGllZCA9IG51bGw7XG5cbiAgZnVuY3Rpb24gYXBwbHlUZXh0SW5wdXQoY20sIGluc2VydGVkLCBkZWxldGVkLCBzZWwsIG9yaWdpbikge1xuICAgIHZhciBkb2MgPSBjbS5kb2M7XG4gICAgY20uZGlzcGxheS5zaGlmdCA9IGZhbHNlO1xuICAgIGlmICghc2VsKSBzZWwgPSBkb2Muc2VsO1xuXG4gICAgdmFyIHBhc3RlID0gY20uc3RhdGUucGFzdGVJbmNvbWluZyB8fCBvcmlnaW4gPT0gXCJwYXN0ZVwiO1xuICAgIHZhciB0ZXh0TGluZXMgPSBkb2Muc3BsaXRMaW5lcyhpbnNlcnRlZCksIG11bHRpUGFzdGUgPSBudWxsO1xuICAgIC8vIFdoZW4gcGFzaW5nIE4gbGluZXMgaW50byBOIHNlbGVjdGlvbnMsIGluc2VydCBvbmUgbGluZSBwZXIgc2VsZWN0aW9uXG4gICAgaWYgKHBhc3RlICYmIHNlbC5yYW5nZXMubGVuZ3RoID4gMSkge1xuICAgICAgaWYgKGxhc3RDb3BpZWQgJiYgbGFzdENvcGllZC5qb2luKFwiXFxuXCIpID09IGluc2VydGVkKSB7XG4gICAgICAgIGlmIChzZWwucmFuZ2VzLmxlbmd0aCAlIGxhc3RDb3BpZWQubGVuZ3RoID09IDApIHtcbiAgICAgICAgICBtdWx0aVBhc3RlID0gW107XG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsYXN0Q29waWVkLmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAgbXVsdGlQYXN0ZS5wdXNoKGRvYy5zcGxpdExpbmVzKGxhc3RDb3BpZWRbaV0pKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh0ZXh0TGluZXMubGVuZ3RoID09IHNlbC5yYW5nZXMubGVuZ3RoKSB7XG4gICAgICAgIG11bHRpUGFzdGUgPSBtYXAodGV4dExpbmVzLCBmdW5jdGlvbihsKSB7IHJldHVybiBbbF07IH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIE5vcm1hbCBiZWhhdmlvciBpcyB0byBpbnNlcnQgdGhlIG5ldyB0ZXh0IGludG8gZXZlcnkgc2VsZWN0aW9uXG4gICAgZm9yICh2YXIgaSA9IHNlbC5yYW5nZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIHZhciByYW5nZSA9IHNlbC5yYW5nZXNbaV07XG4gICAgICB2YXIgZnJvbSA9IHJhbmdlLmZyb20oKSwgdG8gPSByYW5nZS50bygpO1xuICAgICAgaWYgKHJhbmdlLmVtcHR5KCkpIHtcbiAgICAgICAgaWYgKGRlbGV0ZWQgJiYgZGVsZXRlZCA+IDApIC8vIEhhbmRsZSBkZWxldGlvblxuICAgICAgICAgIGZyb20gPSBQb3MoZnJvbS5saW5lLCBmcm9tLmNoIC0gZGVsZXRlZCk7XG4gICAgICAgIGVsc2UgaWYgKGNtLnN0YXRlLm92ZXJ3cml0ZSAmJiAhcGFzdGUpIC8vIEhhbmRsZSBvdmVyd3JpdGVcbiAgICAgICAgICB0byA9IFBvcyh0by5saW5lLCBNYXRoLm1pbihnZXRMaW5lKGRvYywgdG8ubGluZSkudGV4dC5sZW5ndGgsIHRvLmNoICsgbHN0KHRleHRMaW5lcykubGVuZ3RoKSk7XG4gICAgICB9XG4gICAgICB2YXIgdXBkYXRlSW5wdXQgPSBjbS5jdXJPcC51cGRhdGVJbnB1dDtcbiAgICAgIHZhciBjaGFuZ2VFdmVudCA9IHtmcm9tOiBmcm9tLCB0bzogdG8sIHRleHQ6IG11bHRpUGFzdGUgPyBtdWx0aVBhc3RlW2kgJSBtdWx0aVBhc3RlLmxlbmd0aF0gOiB0ZXh0TGluZXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgb3JpZ2luOiBvcmlnaW4gfHwgKHBhc3RlID8gXCJwYXN0ZVwiIDogY20uc3RhdGUuY3V0SW5jb21pbmcgPyBcImN1dFwiIDogXCIraW5wdXRcIil9O1xuICAgICAgbWFrZUNoYW5nZShjbS5kb2MsIGNoYW5nZUV2ZW50KTtcbiAgICAgIHNpZ25hbExhdGVyKGNtLCBcImlucHV0UmVhZFwiLCBjbSwgY2hhbmdlRXZlbnQpO1xuICAgIH1cbiAgICBpZiAoaW5zZXJ0ZWQgJiYgIXBhc3RlKVxuICAgICAgdHJpZ2dlckVsZWN0cmljKGNtLCBpbnNlcnRlZCk7XG5cbiAgICBlbnN1cmVDdXJzb3JWaXNpYmxlKGNtKTtcbiAgICBjbS5jdXJPcC51cGRhdGVJbnB1dCA9IHVwZGF0ZUlucHV0O1xuICAgIGNtLmN1ck9wLnR5cGluZyA9IHRydWU7XG4gICAgY20uc3RhdGUucGFzdGVJbmNvbWluZyA9IGNtLnN0YXRlLmN1dEluY29taW5nID0gZmFsc2U7XG4gIH1cblxuICBmdW5jdGlvbiBoYW5kbGVQYXN0ZShlLCBjbSkge1xuICAgIHZhciBwYXN0ZWQgPSBlLmNsaXBib2FyZERhdGEgJiYgZS5jbGlwYm9hcmREYXRhLmdldERhdGEoXCJ0ZXh0L3BsYWluXCIpO1xuICAgIGlmIChwYXN0ZWQpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGlmICghaXNSZWFkT25seShjbSkgJiYgIWNtLm9wdGlvbnMuZGlzYWJsZUlucHV0KVxuICAgICAgICBydW5Jbk9wKGNtLCBmdW5jdGlvbigpIHsgYXBwbHlUZXh0SW5wdXQoY20sIHBhc3RlZCwgMCwgbnVsbCwgXCJwYXN0ZVwiKTsgfSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB0cmlnZ2VyRWxlY3RyaWMoY20sIGluc2VydGVkKSB7XG4gICAgLy8gV2hlbiBhbiAnZWxlY3RyaWMnIGNoYXJhY3RlciBpcyBpbnNlcnRlZCwgaW1tZWRpYXRlbHkgdHJpZ2dlciBhIHJlaW5kZW50XG4gICAgaWYgKCFjbS5vcHRpb25zLmVsZWN0cmljQ2hhcnMgfHwgIWNtLm9wdGlvbnMuc21hcnRJbmRlbnQpIHJldHVybjtcbiAgICB2YXIgc2VsID0gY20uZG9jLnNlbDtcblxuICAgIGZvciAodmFyIGkgPSBzZWwucmFuZ2VzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICB2YXIgcmFuZ2UgPSBzZWwucmFuZ2VzW2ldO1xuICAgICAgaWYgKHJhbmdlLmhlYWQuY2ggPiAxMDAgfHwgKGkgJiYgc2VsLnJhbmdlc1tpIC0gMV0uaGVhZC5saW5lID09IHJhbmdlLmhlYWQubGluZSkpIGNvbnRpbnVlO1xuICAgICAgdmFyIG1vZGUgPSBjbS5nZXRNb2RlQXQocmFuZ2UuaGVhZCk7XG4gICAgICB2YXIgaW5kZW50ZWQgPSBmYWxzZTtcbiAgICAgIGlmIChtb2RlLmVsZWN0cmljQ2hhcnMpIHtcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBtb2RlLmVsZWN0cmljQ2hhcnMubGVuZ3RoOyBqKyspXG4gICAgICAgICAgaWYgKGluc2VydGVkLmluZGV4T2YobW9kZS5lbGVjdHJpY0NoYXJzLmNoYXJBdChqKSkgPiAtMSkge1xuICAgICAgICAgICAgaW5kZW50ZWQgPSBpbmRlbnRMaW5lKGNtLCByYW5nZS5oZWFkLmxpbmUsIFwic21hcnRcIik7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKG1vZGUuZWxlY3RyaWNJbnB1dCkge1xuICAgICAgICBpZiAobW9kZS5lbGVjdHJpY0lucHV0LnRlc3QoZ2V0TGluZShjbS5kb2MsIHJhbmdlLmhlYWQubGluZSkudGV4dC5zbGljZSgwLCByYW5nZS5oZWFkLmNoKSkpXG4gICAgICAgICAgaW5kZW50ZWQgPSBpbmRlbnRMaW5lKGNtLCByYW5nZS5oZWFkLmxpbmUsIFwic21hcnRcIik7XG4gICAgICB9XG4gICAgICBpZiAoaW5kZW50ZWQpIHNpZ25hbExhdGVyKGNtLCBcImVsZWN0cmljSW5wdXRcIiwgY20sIHJhbmdlLmhlYWQubGluZSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gY29weWFibGVSYW5nZXMoY20pIHtcbiAgICB2YXIgdGV4dCA9IFtdLCByYW5nZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNtLmRvYy5zZWwucmFuZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgbGluZSA9IGNtLmRvYy5zZWwucmFuZ2VzW2ldLmhlYWQubGluZTtcbiAgICAgIHZhciBsaW5lUmFuZ2UgPSB7YW5jaG9yOiBQb3MobGluZSwgMCksIGhlYWQ6IFBvcyhsaW5lICsgMSwgMCl9O1xuICAgICAgcmFuZ2VzLnB1c2gobGluZVJhbmdlKTtcbiAgICAgIHRleHQucHVzaChjbS5nZXRSYW5nZShsaW5lUmFuZ2UuYW5jaG9yLCBsaW5lUmFuZ2UuaGVhZCkpO1xuICAgIH1cbiAgICByZXR1cm4ge3RleHQ6IHRleHQsIHJhbmdlczogcmFuZ2VzfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRpc2FibGVCcm93c2VyTWFnaWMoZmllbGQpIHtcbiAgICBmaWVsZC5zZXRBdHRyaWJ1dGUoXCJhdXRvY29ycmVjdFwiLCBcIm9mZlwiKTtcbiAgICBmaWVsZC5zZXRBdHRyaWJ1dGUoXCJhdXRvY2FwaXRhbGl6ZVwiLCBcIm9mZlwiKTtcbiAgICBmaWVsZC5zZXRBdHRyaWJ1dGUoXCJzcGVsbGNoZWNrXCIsIFwiZmFsc2VcIik7XG4gIH1cblxuICAvLyBURVhUQVJFQSBJTlBVVCBTVFlMRVxuXG4gIGZ1bmN0aW9uIFRleHRhcmVhSW5wdXQoY20pIHtcbiAgICB0aGlzLmNtID0gY207XG4gICAgLy8gU2VlIGlucHV0LnBvbGwgYW5kIGlucHV0LnJlc2V0XG4gICAgdGhpcy5wcmV2SW5wdXQgPSBcIlwiO1xuXG4gICAgLy8gRmxhZyB0aGF0IGluZGljYXRlcyB3aGV0aGVyIHdlIGV4cGVjdCBpbnB1dCB0byBhcHBlYXIgcmVhbCBzb29uXG4gICAgLy8gbm93IChhZnRlciBzb21lIGV2ZW50IGxpa2UgJ2tleXByZXNzJyBvciAnaW5wdXQnKSBhbmQgYXJlXG4gICAgLy8gcG9sbGluZyBpbnRlbnNpdmVseS5cbiAgICB0aGlzLnBvbGxpbmdGYXN0ID0gZmFsc2U7XG4gICAgLy8gU2VsZi1yZXNldHRpbmcgdGltZW91dCBmb3IgdGhlIHBvbGxlclxuICAgIHRoaXMucG9sbGluZyA9IG5ldyBEZWxheWVkKCk7XG4gICAgLy8gVHJhY2tzIHdoZW4gaW5wdXQucmVzZXQgaGFzIHB1bnRlZCB0byBqdXN0IHB1dHRpbmcgYSBzaG9ydFxuICAgIC8vIHN0cmluZyBpbnRvIHRoZSB0ZXh0YXJlYSBpbnN0ZWFkIG9mIHRoZSBmdWxsIHNlbGVjdGlvbi5cbiAgICB0aGlzLmluYWNjdXJhdGVTZWxlY3Rpb24gPSBmYWxzZTtcbiAgICAvLyBVc2VkIHRvIHdvcmsgYXJvdW5kIElFIGlzc3VlIHdpdGggc2VsZWN0aW9uIGJlaW5nIGZvcmdvdHRlbiB3aGVuIGZvY3VzIG1vdmVzIGF3YXkgZnJvbSB0ZXh0YXJlYVxuICAgIHRoaXMuaGFzU2VsZWN0aW9uID0gZmFsc2U7XG4gICAgdGhpcy5jb21wb3NpbmcgPSBudWxsO1xuICB9O1xuXG4gIGZ1bmN0aW9uIGhpZGRlblRleHRhcmVhKCkge1xuICAgIHZhciB0ZSA9IGVsdChcInRleHRhcmVhXCIsIG51bGwsIG51bGwsIFwicG9zaXRpb246IGFic29sdXRlOyBwYWRkaW5nOiAwOyB3aWR0aDogMXB4OyBoZWlnaHQ6IDFlbTsgb3V0bGluZTogbm9uZVwiKTtcbiAgICB2YXIgZGl2ID0gZWx0KFwiZGl2XCIsIFt0ZV0sIG51bGwsIFwib3ZlcmZsb3c6IGhpZGRlbjsgcG9zaXRpb246IHJlbGF0aXZlOyB3aWR0aDogM3B4OyBoZWlnaHQ6IDBweDtcIik7XG4gICAgLy8gVGhlIHRleHRhcmVhIGlzIGtlcHQgcG9zaXRpb25lZCBuZWFyIHRoZSBjdXJzb3IgdG8gcHJldmVudCB0aGVcbiAgICAvLyBmYWN0IHRoYXQgaXQnbGwgYmUgc2Nyb2xsZWQgaW50byB2aWV3IG9uIGlucHV0IGZyb20gc2Nyb2xsaW5nXG4gICAgLy8gb3VyIGZha2UgY3Vyc29yIG91dCBvZiB2aWV3LiBPbiB3ZWJraXQsIHdoZW4gd3JhcD1vZmYsIHBhc3RlIGlzXG4gICAgLy8gdmVyeSBzbG93LiBTbyBtYWtlIHRoZSBhcmVhIHdpZGUgaW5zdGVhZC5cbiAgICBpZiAod2Via2l0KSB0ZS5zdHlsZS53aWR0aCA9IFwiMTAwMHB4XCI7XG4gICAgZWxzZSB0ZS5zZXRBdHRyaWJ1dGUoXCJ3cmFwXCIsIFwib2ZmXCIpO1xuICAgIC8vIElmIGJvcmRlcjogMDsgLS0gaU9TIGZhaWxzIHRvIG9wZW4ga2V5Ym9hcmQgKGlzc3VlICMxMjg3KVxuICAgIGlmIChpb3MpIHRlLnN0eWxlLmJvcmRlciA9IFwiMXB4IHNvbGlkIGJsYWNrXCI7XG4gICAgZGlzYWJsZUJyb3dzZXJNYWdpYyh0ZSk7XG4gICAgcmV0dXJuIGRpdjtcbiAgfVxuXG4gIFRleHRhcmVhSW5wdXQucHJvdG90eXBlID0gY29weU9iaih7XG4gICAgaW5pdDogZnVuY3Rpb24oZGlzcGxheSkge1xuICAgICAgdmFyIGlucHV0ID0gdGhpcywgY20gPSB0aGlzLmNtO1xuXG4gICAgICAvLyBXcmFwcyBhbmQgaGlkZXMgaW5wdXQgdGV4dGFyZWFcbiAgICAgIHZhciBkaXYgPSB0aGlzLndyYXBwZXIgPSBoaWRkZW5UZXh0YXJlYSgpO1xuICAgICAgLy8gVGhlIHNlbWloaWRkZW4gdGV4dGFyZWEgdGhhdCBpcyBmb2N1c2VkIHdoZW4gdGhlIGVkaXRvciBpc1xuICAgICAgLy8gZm9jdXNlZCwgYW5kIHJlY2VpdmVzIGlucHV0LlxuICAgICAgdmFyIHRlID0gdGhpcy50ZXh0YXJlYSA9IGRpdi5maXJzdENoaWxkO1xuICAgICAgZGlzcGxheS53cmFwcGVyLmluc2VydEJlZm9yZShkaXYsIGRpc3BsYXkud3JhcHBlci5maXJzdENoaWxkKTtcblxuICAgICAgLy8gTmVlZGVkIHRvIGhpZGUgYmlnIGJsdWUgYmxpbmtpbmcgY3Vyc29yIG9uIE1vYmlsZSBTYWZhcmkgKGRvZXNuJ3Qgc2VlbSB0byB3b3JrIGluIGlPUyA4IGFueW1vcmUpXG4gICAgICBpZiAoaW9zKSB0ZS5zdHlsZS53aWR0aCA9IFwiMHB4XCI7XG5cbiAgICAgIG9uKHRlLCBcImlucHV0XCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoaWUgJiYgaWVfdmVyc2lvbiA+PSA5ICYmIGlucHV0Lmhhc1NlbGVjdGlvbikgaW5wdXQuaGFzU2VsZWN0aW9uID0gbnVsbDtcbiAgICAgICAgaW5wdXQucG9sbCgpO1xuICAgICAgfSk7XG5cbiAgICAgIG9uKHRlLCBcInBhc3RlXCIsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKGhhbmRsZVBhc3RlKGUsIGNtKSkgcmV0dXJuIHRydWU7XG5cbiAgICAgICAgY20uc3RhdGUucGFzdGVJbmNvbWluZyA9IHRydWU7XG4gICAgICAgIGlucHV0LmZhc3RQb2xsKCk7XG4gICAgICB9KTtcblxuICAgICAgZnVuY3Rpb24gcHJlcGFyZUNvcHlDdXQoZSkge1xuICAgICAgICBpZiAoY20uc29tZXRoaW5nU2VsZWN0ZWQoKSkge1xuICAgICAgICAgIGxhc3RDb3BpZWQgPSBjbS5nZXRTZWxlY3Rpb25zKCk7XG4gICAgICAgICAgaWYgKGlucHV0LmluYWNjdXJhdGVTZWxlY3Rpb24pIHtcbiAgICAgICAgICAgIGlucHV0LnByZXZJbnB1dCA9IFwiXCI7XG4gICAgICAgICAgICBpbnB1dC5pbmFjY3VyYXRlU2VsZWN0aW9uID0gZmFsc2U7XG4gICAgICAgICAgICB0ZS52YWx1ZSA9IGxhc3RDb3BpZWQuam9pbihcIlxcblwiKTtcbiAgICAgICAgICAgIHNlbGVjdElucHV0KHRlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoIWNtLm9wdGlvbnMubGluZVdpc2VDb3B5Q3V0KSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciByYW5nZXMgPSBjb3B5YWJsZVJhbmdlcyhjbSk7XG4gICAgICAgICAgbGFzdENvcGllZCA9IHJhbmdlcy50ZXh0O1xuICAgICAgICAgIGlmIChlLnR5cGUgPT0gXCJjdXRcIikge1xuICAgICAgICAgICAgY20uc2V0U2VsZWN0aW9ucyhyYW5nZXMucmFuZ2VzLCBudWxsLCBzZWxfZG9udFNjcm9sbCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlucHV0LnByZXZJbnB1dCA9IFwiXCI7XG4gICAgICAgICAgICB0ZS52YWx1ZSA9IHJhbmdlcy50ZXh0LmpvaW4oXCJcXG5cIik7XG4gICAgICAgICAgICBzZWxlY3RJbnB1dCh0ZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChlLnR5cGUgPT0gXCJjdXRcIikgY20uc3RhdGUuY3V0SW5jb21pbmcgPSB0cnVlO1xuICAgICAgfVxuICAgICAgb24odGUsIFwiY3V0XCIsIHByZXBhcmVDb3B5Q3V0KTtcbiAgICAgIG9uKHRlLCBcImNvcHlcIiwgcHJlcGFyZUNvcHlDdXQpO1xuXG4gICAgICBvbihkaXNwbGF5LnNjcm9sbGVyLCBcInBhc3RlXCIsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKGV2ZW50SW5XaWRnZXQoZGlzcGxheSwgZSkpIHJldHVybjtcbiAgICAgICAgY20uc3RhdGUucGFzdGVJbmNvbWluZyA9IHRydWU7XG4gICAgICAgIGlucHV0LmZvY3VzKCk7XG4gICAgICB9KTtcblxuICAgICAgLy8gUHJldmVudCBub3JtYWwgc2VsZWN0aW9uIGluIHRoZSBlZGl0b3IgKHdlIGhhbmRsZSBvdXIgb3duKVxuICAgICAgb24oZGlzcGxheS5saW5lU3BhY2UsIFwic2VsZWN0c3RhcnRcIiwgZnVuY3Rpb24oZSkge1xuICAgICAgICBpZiAoIWV2ZW50SW5XaWRnZXQoZGlzcGxheSwgZSkpIGVfcHJldmVudERlZmF1bHQoZSk7XG4gICAgICB9KTtcblxuICAgICAgb24odGUsIFwiY29tcG9zaXRpb25zdGFydFwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHN0YXJ0ID0gY20uZ2V0Q3Vyc29yKFwiZnJvbVwiKTtcbiAgICAgICAgaWYgKGlucHV0LmNvbXBvc2luZykgaW5wdXQuY29tcG9zaW5nLnJhbmdlLmNsZWFyKClcbiAgICAgICAgaW5wdXQuY29tcG9zaW5nID0ge1xuICAgICAgICAgIHN0YXJ0OiBzdGFydCxcbiAgICAgICAgICByYW5nZTogY20ubWFya1RleHQoc3RhcnQsIGNtLmdldEN1cnNvcihcInRvXCIpLCB7Y2xhc3NOYW1lOiBcIkNvZGVNaXJyb3ItY29tcG9zaW5nXCJ9KVxuICAgICAgICB9O1xuICAgICAgfSk7XG4gICAgICBvbih0ZSwgXCJjb21wb3NpdGlvbmVuZFwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKGlucHV0LmNvbXBvc2luZykge1xuICAgICAgICAgIGlucHV0LnBvbGwoKTtcbiAgICAgICAgICBpbnB1dC5jb21wb3NpbmcucmFuZ2UuY2xlYXIoKTtcbiAgICAgICAgICBpbnB1dC5jb21wb3NpbmcgPSBudWxsO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgcHJlcGFyZVNlbGVjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAvLyBSZWRyYXcgdGhlIHNlbGVjdGlvbiBhbmQvb3IgY3Vyc29yXG4gICAgICB2YXIgY20gPSB0aGlzLmNtLCBkaXNwbGF5ID0gY20uZGlzcGxheSwgZG9jID0gY20uZG9jO1xuICAgICAgdmFyIHJlc3VsdCA9IHByZXBhcmVTZWxlY3Rpb24oY20pO1xuXG4gICAgICAvLyBNb3ZlIHRoZSBoaWRkZW4gdGV4dGFyZWEgbmVhciB0aGUgY3Vyc29yIHRvIHByZXZlbnQgc2Nyb2xsaW5nIGFydGlmYWN0c1xuICAgICAgaWYgKGNtLm9wdGlvbnMubW92ZUlucHV0V2l0aEN1cnNvcikge1xuICAgICAgICB2YXIgaGVhZFBvcyA9IGN1cnNvckNvb3JkcyhjbSwgZG9jLnNlbC5wcmltYXJ5KCkuaGVhZCwgXCJkaXZcIik7XG4gICAgICAgIHZhciB3cmFwT2ZmID0gZGlzcGxheS53cmFwcGVyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLCBsaW5lT2ZmID0gZGlzcGxheS5saW5lRGl2LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICByZXN1bHQudGVUb3AgPSBNYXRoLm1heCgwLCBNYXRoLm1pbihkaXNwbGF5LndyYXBwZXIuY2xpZW50SGVpZ2h0IC0gMTAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlYWRQb3MudG9wICsgbGluZU9mZi50b3AgLSB3cmFwT2ZmLnRvcCkpO1xuICAgICAgICByZXN1bHQudGVMZWZ0ID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oZGlzcGxheS53cmFwcGVyLmNsaWVudFdpZHRoIC0gMTAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWFkUG9zLmxlZnQgKyBsaW5lT2ZmLmxlZnQgLSB3cmFwT2ZmLmxlZnQpKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LFxuXG4gICAgc2hvd1NlbGVjdGlvbjogZnVuY3Rpb24oZHJhd24pIHtcbiAgICAgIHZhciBjbSA9IHRoaXMuY20sIGRpc3BsYXkgPSBjbS5kaXNwbGF5O1xuICAgICAgcmVtb3ZlQ2hpbGRyZW5BbmRBZGQoZGlzcGxheS5jdXJzb3JEaXYsIGRyYXduLmN1cnNvcnMpO1xuICAgICAgcmVtb3ZlQ2hpbGRyZW5BbmRBZGQoZGlzcGxheS5zZWxlY3Rpb25EaXYsIGRyYXduLnNlbGVjdGlvbik7XG4gICAgICBpZiAoZHJhd24udGVUb3AgIT0gbnVsbCkge1xuICAgICAgICB0aGlzLndyYXBwZXIuc3R5bGUudG9wID0gZHJhd24udGVUb3AgKyBcInB4XCI7XG4gICAgICAgIHRoaXMud3JhcHBlci5zdHlsZS5sZWZ0ID0gZHJhd24udGVMZWZ0ICsgXCJweFwiO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyBSZXNldCB0aGUgaW5wdXQgdG8gY29ycmVzcG9uZCB0byB0aGUgc2VsZWN0aW9uIChvciB0byBiZSBlbXB0eSxcbiAgICAvLyB3aGVuIG5vdCB0eXBpbmcgYW5kIG5vdGhpbmcgaXMgc2VsZWN0ZWQpXG4gICAgcmVzZXQ6IGZ1bmN0aW9uKHR5cGluZykge1xuICAgICAgaWYgKHRoaXMuY29udGV4dE1lbnVQZW5kaW5nKSByZXR1cm47XG4gICAgICB2YXIgbWluaW1hbCwgc2VsZWN0ZWQsIGNtID0gdGhpcy5jbSwgZG9jID0gY20uZG9jO1xuICAgICAgaWYgKGNtLnNvbWV0aGluZ1NlbGVjdGVkKCkpIHtcbiAgICAgICAgdGhpcy5wcmV2SW5wdXQgPSBcIlwiO1xuICAgICAgICB2YXIgcmFuZ2UgPSBkb2Muc2VsLnByaW1hcnkoKTtcbiAgICAgICAgbWluaW1hbCA9IGhhc0NvcHlFdmVudCAmJlxuICAgICAgICAgIChyYW5nZS50bygpLmxpbmUgLSByYW5nZS5mcm9tKCkubGluZSA+IDEwMCB8fCAoc2VsZWN0ZWQgPSBjbS5nZXRTZWxlY3Rpb24oKSkubGVuZ3RoID4gMTAwMCk7XG4gICAgICAgIHZhciBjb250ZW50ID0gbWluaW1hbCA/IFwiLVwiIDogc2VsZWN0ZWQgfHwgY20uZ2V0U2VsZWN0aW9uKCk7XG4gICAgICAgIHRoaXMudGV4dGFyZWEudmFsdWUgPSBjb250ZW50O1xuICAgICAgICBpZiAoY20uc3RhdGUuZm9jdXNlZCkgc2VsZWN0SW5wdXQodGhpcy50ZXh0YXJlYSk7XG4gICAgICAgIGlmIChpZSAmJiBpZV92ZXJzaW9uID49IDkpIHRoaXMuaGFzU2VsZWN0aW9uID0gY29udGVudDtcbiAgICAgIH0gZWxzZSBpZiAoIXR5cGluZykge1xuICAgICAgICB0aGlzLnByZXZJbnB1dCA9IHRoaXMudGV4dGFyZWEudmFsdWUgPSBcIlwiO1xuICAgICAgICBpZiAoaWUgJiYgaWVfdmVyc2lvbiA+PSA5KSB0aGlzLmhhc1NlbGVjdGlvbiA9IG51bGw7XG4gICAgICB9XG4gICAgICB0aGlzLmluYWNjdXJhdGVTZWxlY3Rpb24gPSBtaW5pbWFsO1xuICAgIH0sXG5cbiAgICBnZXRGaWVsZDogZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLnRleHRhcmVhOyB9LFxuXG4gICAgc3VwcG9ydHNUb3VjaDogZnVuY3Rpb24oKSB7IHJldHVybiBmYWxzZTsgfSxcblxuICAgIGZvY3VzOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICh0aGlzLmNtLm9wdGlvbnMucmVhZE9ubHkgIT0gXCJub2N1cnNvclwiICYmICghbW9iaWxlIHx8IGFjdGl2ZUVsdCgpICE9IHRoaXMudGV4dGFyZWEpKSB7XG4gICAgICAgIHRyeSB7IHRoaXMudGV4dGFyZWEuZm9jdXMoKTsgfVxuICAgICAgICBjYXRjaCAoZSkge30gLy8gSUU4IHdpbGwgdGhyb3cgaWYgdGhlIHRleHRhcmVhIGlzIGRpc3BsYXk6IG5vbmUgb3Igbm90IGluIERPTVxuICAgICAgfVxuICAgIH0sXG5cbiAgICBibHVyOiBmdW5jdGlvbigpIHsgdGhpcy50ZXh0YXJlYS5ibHVyKCk7IH0sXG5cbiAgICByZXNldFBvc2l0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMud3JhcHBlci5zdHlsZS50b3AgPSB0aGlzLndyYXBwZXIuc3R5bGUubGVmdCA9IDA7XG4gICAgfSxcblxuICAgIHJlY2VpdmVkRm9jdXM6IGZ1bmN0aW9uKCkgeyB0aGlzLnNsb3dQb2xsKCk7IH0sXG5cbiAgICAvLyBQb2xsIGZvciBpbnB1dCBjaGFuZ2VzLCB1c2luZyB0aGUgbm9ybWFsIHJhdGUgb2YgcG9sbGluZy4gVGhpc1xuICAgIC8vIHJ1bnMgYXMgbG9uZyBhcyB0aGUgZWRpdG9yIGlzIGZvY3VzZWQuXG4gICAgc2xvd1BvbGw6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGlucHV0ID0gdGhpcztcbiAgICAgIGlmIChpbnB1dC5wb2xsaW5nRmFzdCkgcmV0dXJuO1xuICAgICAgaW5wdXQucG9sbGluZy5zZXQodGhpcy5jbS5vcHRpb25zLnBvbGxJbnRlcnZhbCwgZnVuY3Rpb24oKSB7XG4gICAgICAgIGlucHV0LnBvbGwoKTtcbiAgICAgICAgaWYgKGlucHV0LmNtLnN0YXRlLmZvY3VzZWQpIGlucHV0LnNsb3dQb2xsKCk7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgLy8gV2hlbiBhbiBldmVudCBoYXMganVzdCBjb21lIGluIHRoYXQgaXMgbGlrZWx5IHRvIGFkZCBvciBjaGFuZ2VcbiAgICAvLyBzb21ldGhpbmcgaW4gdGhlIGlucHV0IHRleHRhcmVhLCB3ZSBwb2xsIGZhc3RlciwgdG8gZW5zdXJlIHRoYXRcbiAgICAvLyB0aGUgY2hhbmdlIGFwcGVhcnMgb24gdGhlIHNjcmVlbiBxdWlja2x5LlxuICAgIGZhc3RQb2xsOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBtaXNzZWQgPSBmYWxzZSwgaW5wdXQgPSB0aGlzO1xuICAgICAgaW5wdXQucG9sbGluZ0Zhc3QgPSB0cnVlO1xuICAgICAgZnVuY3Rpb24gcCgpIHtcbiAgICAgICAgdmFyIGNoYW5nZWQgPSBpbnB1dC5wb2xsKCk7XG4gICAgICAgIGlmICghY2hhbmdlZCAmJiAhbWlzc2VkKSB7bWlzc2VkID0gdHJ1ZTsgaW5wdXQucG9sbGluZy5zZXQoNjAsIHApO31cbiAgICAgICAgZWxzZSB7aW5wdXQucG9sbGluZ0Zhc3QgPSBmYWxzZTsgaW5wdXQuc2xvd1BvbGwoKTt9XG4gICAgICB9XG4gICAgICBpbnB1dC5wb2xsaW5nLnNldCgyMCwgcCk7XG4gICAgfSxcblxuICAgIC8vIFJlYWQgaW5wdXQgZnJvbSB0aGUgdGV4dGFyZWEsIGFuZCB1cGRhdGUgdGhlIGRvY3VtZW50IHRvIG1hdGNoLlxuICAgIC8vIFdoZW4gc29tZXRoaW5nIGlzIHNlbGVjdGVkLCBpdCBpcyBwcmVzZW50IGluIHRoZSB0ZXh0YXJlYSwgYW5kXG4gICAgLy8gc2VsZWN0ZWQgKHVubGVzcyBpdCBpcyBodWdlLCBpbiB3aGljaCBjYXNlIGEgcGxhY2Vob2xkZXIgaXNcbiAgICAvLyB1c2VkKS4gV2hlbiBub3RoaW5nIGlzIHNlbGVjdGVkLCB0aGUgY3Vyc29yIHNpdHMgYWZ0ZXIgcHJldmlvdXNseVxuICAgIC8vIHNlZW4gdGV4dCAoY2FuIGJlIGVtcHR5KSwgd2hpY2ggaXMgc3RvcmVkIGluIHByZXZJbnB1dCAod2UgbXVzdFxuICAgIC8vIG5vdCByZXNldCB0aGUgdGV4dGFyZWEgd2hlbiB0eXBpbmcsIGJlY2F1c2UgdGhhdCBicmVha3MgSU1FKS5cbiAgICBwb2xsOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBjbSA9IHRoaXMuY20sIGlucHV0ID0gdGhpcy50ZXh0YXJlYSwgcHJldklucHV0ID0gdGhpcy5wcmV2SW5wdXQ7XG4gICAgICAvLyBTaW5jZSB0aGlzIGlzIGNhbGxlZCBhICpsb3QqLCB0cnkgdG8gYmFpbCBvdXQgYXMgY2hlYXBseSBhc1xuICAgICAgLy8gcG9zc2libGUgd2hlbiBpdCBpcyBjbGVhciB0aGF0IG5vdGhpbmcgaGFwcGVuZWQuIGhhc1NlbGVjdGlvblxuICAgICAgLy8gd2lsbCBiZSB0aGUgY2FzZSB3aGVuIHRoZXJlIGlzIGEgbG90IG9mIHRleHQgaW4gdGhlIHRleHRhcmVhLFxuICAgICAgLy8gaW4gd2hpY2ggY2FzZSByZWFkaW5nIGl0cyB2YWx1ZSB3b3VsZCBiZSBleHBlbnNpdmUuXG4gICAgICBpZiAodGhpcy5jb250ZXh0TWVudVBlbmRpbmcgfHwgIWNtLnN0YXRlLmZvY3VzZWQgfHxcbiAgICAgICAgICAoaGFzU2VsZWN0aW9uKGlucHV0KSAmJiAhcHJldklucHV0ICYmICF0aGlzLmNvbXBvc2luZykgfHxcbiAgICAgICAgICBpc1JlYWRPbmx5KGNtKSB8fCBjbS5vcHRpb25zLmRpc2FibGVJbnB1dCB8fCBjbS5zdGF0ZS5rZXlTZXEpXG4gICAgICAgIHJldHVybiBmYWxzZTtcblxuICAgICAgdmFyIHRleHQgPSBpbnB1dC52YWx1ZTtcbiAgICAgIC8vIElmIG5vdGhpbmcgY2hhbmdlZCwgYmFpbC5cbiAgICAgIGlmICh0ZXh0ID09IHByZXZJbnB1dCAmJiAhY20uc29tZXRoaW5nU2VsZWN0ZWQoKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgLy8gV29yayBhcm91bmQgbm9uc2Vuc2ljYWwgc2VsZWN0aW9uIHJlc2V0dGluZyBpbiBJRTkvMTAsIGFuZFxuICAgICAgLy8gaW5leHBsaWNhYmxlIGFwcGVhcmFuY2Ugb2YgcHJpdmF0ZSBhcmVhIHVuaWNvZGUgY2hhcmFjdGVycyBvblxuICAgICAgLy8gc29tZSBrZXkgY29tYm9zIGluIE1hYyAoIzI2ODkpLlxuICAgICAgaWYgKGllICYmIGllX3ZlcnNpb24gPj0gOSAmJiB0aGlzLmhhc1NlbGVjdGlvbiA9PT0gdGV4dCB8fFxuICAgICAgICAgIG1hYyAmJiAvW1xcdWY3MDAtXFx1ZjdmZl0vLnRlc3QodGV4dCkpIHtcbiAgICAgICAgY20uZGlzcGxheS5pbnB1dC5yZXNldCgpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmIChjbS5kb2Muc2VsID09IGNtLmRpc3BsYXkuc2VsRm9yQ29udGV4dE1lbnUpIHtcbiAgICAgICAgdmFyIGZpcnN0ID0gdGV4dC5jaGFyQ29kZUF0KDApO1xuICAgICAgICBpZiAoZmlyc3QgPT0gMHgyMDBiICYmICFwcmV2SW5wdXQpIHByZXZJbnB1dCA9IFwiXFx1MjAwYlwiO1xuICAgICAgICBpZiAoZmlyc3QgPT0gMHgyMWRhKSB7IHRoaXMucmVzZXQoKTsgcmV0dXJuIHRoaXMuY20uZXhlY0NvbW1hbmQoXCJ1bmRvXCIpOyB9XG4gICAgICB9XG4gICAgICAvLyBGaW5kIHRoZSBwYXJ0IG9mIHRoZSBpbnB1dCB0aGF0IGlzIGFjdHVhbGx5IG5ld1xuICAgICAgdmFyIHNhbWUgPSAwLCBsID0gTWF0aC5taW4ocHJldklucHV0Lmxlbmd0aCwgdGV4dC5sZW5ndGgpO1xuICAgICAgd2hpbGUgKHNhbWUgPCBsICYmIHByZXZJbnB1dC5jaGFyQ29kZUF0KHNhbWUpID09IHRleHQuY2hhckNvZGVBdChzYW1lKSkgKytzYW1lO1xuXG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICBydW5Jbk9wKGNtLCBmdW5jdGlvbigpIHtcbiAgICAgICAgYXBwbHlUZXh0SW5wdXQoY20sIHRleHQuc2xpY2Uoc2FtZSksIHByZXZJbnB1dC5sZW5ndGggLSBzYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICBudWxsLCBzZWxmLmNvbXBvc2luZyA/IFwiKmNvbXBvc2VcIiA6IG51bGwpO1xuXG4gICAgICAgIC8vIERvbid0IGxlYXZlIGxvbmcgdGV4dCBpbiB0aGUgdGV4dGFyZWEsIHNpbmNlIGl0IG1ha2VzIGZ1cnRoZXIgcG9sbGluZyBzbG93XG4gICAgICAgIGlmICh0ZXh0Lmxlbmd0aCA+IDEwMDAgfHwgdGV4dC5pbmRleE9mKFwiXFxuXCIpID4gLTEpIGlucHV0LnZhbHVlID0gc2VsZi5wcmV2SW5wdXQgPSBcIlwiO1xuICAgICAgICBlbHNlIHNlbGYucHJldklucHV0ID0gdGV4dDtcblxuICAgICAgICBpZiAoc2VsZi5jb21wb3NpbmcpIHtcbiAgICAgICAgICBzZWxmLmNvbXBvc2luZy5yYW5nZS5jbGVhcigpO1xuICAgICAgICAgIHNlbGYuY29tcG9zaW5nLnJhbmdlID0gY20ubWFya1RleHQoc2VsZi5jb21wb3Npbmcuc3RhcnQsIGNtLmdldEN1cnNvcihcInRvXCIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2NsYXNzTmFtZTogXCJDb2RlTWlycm9yLWNvbXBvc2luZ1wifSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcblxuICAgIGVuc3VyZVBvbGxlZDogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAodGhpcy5wb2xsaW5nRmFzdCAmJiB0aGlzLnBvbGwoKSkgdGhpcy5wb2xsaW5nRmFzdCA9IGZhbHNlO1xuICAgIH0sXG5cbiAgICBvbktleVByZXNzOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmIChpZSAmJiBpZV92ZXJzaW9uID49IDkpIHRoaXMuaGFzU2VsZWN0aW9uID0gbnVsbDtcbiAgICAgIHRoaXMuZmFzdFBvbGwoKTtcbiAgICB9LFxuXG4gICAgb25Db250ZXh0TWVudTogZnVuY3Rpb24oZSkge1xuICAgICAgdmFyIGlucHV0ID0gdGhpcywgY20gPSBpbnB1dC5jbSwgZGlzcGxheSA9IGNtLmRpc3BsYXksIHRlID0gaW5wdXQudGV4dGFyZWE7XG4gICAgICB2YXIgcG9zID0gcG9zRnJvbU1vdXNlKGNtLCBlKSwgc2Nyb2xsUG9zID0gZGlzcGxheS5zY3JvbGxlci5zY3JvbGxUb3A7XG4gICAgICBpZiAoIXBvcyB8fCBwcmVzdG8pIHJldHVybjsgLy8gT3BlcmEgaXMgZGlmZmljdWx0LlxuXG4gICAgICAvLyBSZXNldCB0aGUgY3VycmVudCB0ZXh0IHNlbGVjdGlvbiBvbmx5IGlmIHRoZSBjbGljayBpcyBkb25lIG91dHNpZGUgb2YgdGhlIHNlbGVjdGlvblxuICAgICAgLy8gYW5kICdyZXNldFNlbGVjdGlvbk9uQ29udGV4dE1lbnUnIG9wdGlvbiBpcyB0cnVlLlxuICAgICAgdmFyIHJlc2V0ID0gY20ub3B0aW9ucy5yZXNldFNlbGVjdGlvbk9uQ29udGV4dE1lbnU7XG4gICAgICBpZiAocmVzZXQgJiYgY20uZG9jLnNlbC5jb250YWlucyhwb3MpID09IC0xKVxuICAgICAgICBvcGVyYXRpb24oY20sIHNldFNlbGVjdGlvbikoY20uZG9jLCBzaW1wbGVTZWxlY3Rpb24ocG9zKSwgc2VsX2RvbnRTY3JvbGwpO1xuXG4gICAgICB2YXIgb2xkQ1NTID0gdGUuc3R5bGUuY3NzVGV4dDtcbiAgICAgIGlucHV0LndyYXBwZXIuc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XG4gICAgICB0ZS5zdHlsZS5jc3NUZXh0ID0gXCJwb3NpdGlvbjogZml4ZWQ7IHdpZHRoOiAzMHB4OyBoZWlnaHQ6IDMwcHg7IHRvcDogXCIgKyAoZS5jbGllbnRZIC0gNSkgK1xuICAgICAgICBcInB4OyBsZWZ0OiBcIiArIChlLmNsaWVudFggLSA1KSArIFwicHg7IHotaW5kZXg6IDEwMDA7IGJhY2tncm91bmQ6IFwiICtcbiAgICAgICAgKGllID8gXCJyZ2JhKDI1NSwgMjU1LCAyNTUsIC4wNSlcIiA6IFwidHJhbnNwYXJlbnRcIikgK1xuICAgICAgICBcIjsgb3V0bGluZTogbm9uZTsgYm9yZGVyLXdpZHRoOiAwOyBvdXRsaW5lOiBub25lOyBvdmVyZmxvdzogaGlkZGVuOyBvcGFjaXR5OiAuMDU7IGZpbHRlcjogYWxwaGEob3BhY2l0eT01KTtcIjtcbiAgICAgIGlmICh3ZWJraXQpIHZhciBvbGRTY3JvbGxZID0gd2luZG93LnNjcm9sbFk7IC8vIFdvcmsgYXJvdW5kIENocm9tZSBpc3N1ZSAoIzI3MTIpXG4gICAgICBkaXNwbGF5LmlucHV0LmZvY3VzKCk7XG4gICAgICBpZiAod2Via2l0KSB3aW5kb3cuc2Nyb2xsVG8obnVsbCwgb2xkU2Nyb2xsWSk7XG4gICAgICBkaXNwbGF5LmlucHV0LnJlc2V0KCk7XG4gICAgICAvLyBBZGRzIFwiU2VsZWN0IGFsbFwiIHRvIGNvbnRleHQgbWVudSBpbiBGRlxuICAgICAgaWYgKCFjbS5zb21ldGhpbmdTZWxlY3RlZCgpKSB0ZS52YWx1ZSA9IGlucHV0LnByZXZJbnB1dCA9IFwiIFwiO1xuICAgICAgaW5wdXQuY29udGV4dE1lbnVQZW5kaW5nID0gdHJ1ZTtcbiAgICAgIGRpc3BsYXkuc2VsRm9yQ29udGV4dE1lbnUgPSBjbS5kb2Muc2VsO1xuICAgICAgY2xlYXJUaW1lb3V0KGRpc3BsYXkuZGV0ZWN0aW5nU2VsZWN0QWxsKTtcblxuICAgICAgLy8gU2VsZWN0LWFsbCB3aWxsIGJlIGdyZXllZCBvdXQgaWYgdGhlcmUncyBub3RoaW5nIHRvIHNlbGVjdCwgc29cbiAgICAgIC8vIHRoaXMgYWRkcyBhIHplcm8td2lkdGggc3BhY2Ugc28gdGhhdCB3ZSBjYW4gbGF0ZXIgY2hlY2sgd2hldGhlclxuICAgICAgLy8gaXQgZ290IHNlbGVjdGVkLlxuICAgICAgZnVuY3Rpb24gcHJlcGFyZVNlbGVjdEFsbEhhY2soKSB7XG4gICAgICAgIGlmICh0ZS5zZWxlY3Rpb25TdGFydCAhPSBudWxsKSB7XG4gICAgICAgICAgdmFyIHNlbGVjdGVkID0gY20uc29tZXRoaW5nU2VsZWN0ZWQoKTtcbiAgICAgICAgICB2YXIgZXh0dmFsID0gXCJcXHUyMDBiXCIgKyAoc2VsZWN0ZWQgPyB0ZS52YWx1ZSA6IFwiXCIpO1xuICAgICAgICAgIHRlLnZhbHVlID0gXCJcXHUyMWRhXCI7IC8vIFVzZWQgdG8gY2F0Y2ggY29udGV4dC1tZW51IHVuZG9cbiAgICAgICAgICB0ZS52YWx1ZSA9IGV4dHZhbDtcbiAgICAgICAgICBpbnB1dC5wcmV2SW5wdXQgPSBzZWxlY3RlZCA/IFwiXCIgOiBcIlxcdTIwMGJcIjtcbiAgICAgICAgICB0ZS5zZWxlY3Rpb25TdGFydCA9IDE7IHRlLnNlbGVjdGlvbkVuZCA9IGV4dHZhbC5sZW5ndGg7XG4gICAgICAgICAgLy8gUmUtc2V0IHRoaXMsIGluIGNhc2Ugc29tZSBvdGhlciBoYW5kbGVyIHRvdWNoZWQgdGhlXG4gICAgICAgICAgLy8gc2VsZWN0aW9uIGluIHRoZSBtZWFudGltZS5cbiAgICAgICAgICBkaXNwbGF5LnNlbEZvckNvbnRleHRNZW51ID0gY20uZG9jLnNlbDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZnVuY3Rpb24gcmVoaWRlKCkge1xuICAgICAgICBpbnB1dC5jb250ZXh0TWVudVBlbmRpbmcgPSBmYWxzZTtcbiAgICAgICAgaW5wdXQud3JhcHBlci5zdHlsZS5wb3NpdGlvbiA9IFwicmVsYXRpdmVcIjtcbiAgICAgICAgdGUuc3R5bGUuY3NzVGV4dCA9IG9sZENTUztcbiAgICAgICAgaWYgKGllICYmIGllX3ZlcnNpb24gPCA5KSBkaXNwbGF5LnNjcm9sbGJhcnMuc2V0U2Nyb2xsVG9wKGRpc3BsYXkuc2Nyb2xsZXIuc2Nyb2xsVG9wID0gc2Nyb2xsUG9zKTtcblxuICAgICAgICAvLyBUcnkgdG8gZGV0ZWN0IHRoZSB1c2VyIGNob29zaW5nIHNlbGVjdC1hbGxcbiAgICAgICAgaWYgKHRlLnNlbGVjdGlvblN0YXJ0ICE9IG51bGwpIHtcbiAgICAgICAgICBpZiAoIWllIHx8IChpZSAmJiBpZV92ZXJzaW9uIDwgOSkpIHByZXBhcmVTZWxlY3RBbGxIYWNrKCk7XG4gICAgICAgICAgdmFyIGkgPSAwLCBwb2xsID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoZGlzcGxheS5zZWxGb3JDb250ZXh0TWVudSA9PSBjbS5kb2Muc2VsICYmIHRlLnNlbGVjdGlvblN0YXJ0ID09IDAgJiZcbiAgICAgICAgICAgICAgICB0ZS5zZWxlY3Rpb25FbmQgPiAwICYmIGlucHV0LnByZXZJbnB1dCA9PSBcIlxcdTIwMGJcIilcbiAgICAgICAgICAgICAgb3BlcmF0aW9uKGNtLCBjb21tYW5kcy5zZWxlY3RBbGwpKGNtKTtcbiAgICAgICAgICAgIGVsc2UgaWYgKGkrKyA8IDEwKSBkaXNwbGF5LmRldGVjdGluZ1NlbGVjdEFsbCA9IHNldFRpbWVvdXQocG9sbCwgNTAwKTtcbiAgICAgICAgICAgIGVsc2UgZGlzcGxheS5pbnB1dC5yZXNldCgpO1xuICAgICAgICAgIH07XG4gICAgICAgICAgZGlzcGxheS5kZXRlY3RpbmdTZWxlY3RBbGwgPSBzZXRUaW1lb3V0KHBvbGwsIDIwMCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGllICYmIGllX3ZlcnNpb24gPj0gOSkgcHJlcGFyZVNlbGVjdEFsbEhhY2soKTtcbiAgICAgIGlmIChjYXB0dXJlUmlnaHRDbGljaykge1xuICAgICAgICBlX3N0b3AoZSk7XG4gICAgICAgIHZhciBtb3VzZXVwID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgb2ZmKHdpbmRvdywgXCJtb3VzZXVwXCIsIG1vdXNldXApO1xuICAgICAgICAgIHNldFRpbWVvdXQocmVoaWRlLCAyMCk7XG4gICAgICAgIH07XG4gICAgICAgIG9uKHdpbmRvdywgXCJtb3VzZXVwXCIsIG1vdXNldXApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0VGltZW91dChyZWhpZGUsIDUwKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgcmVhZE9ubHlDaGFuZ2VkOiBmdW5jdGlvbih2YWwpIHtcbiAgICAgIGlmICghdmFsKSB0aGlzLnJlc2V0KCk7XG4gICAgfSxcblxuICAgIHNldFVuZWRpdGFibGU6IG5vdGhpbmcsXG5cbiAgICBuZWVkc0NvbnRlbnRBdHRyaWJ1dGU6IGZhbHNlXG4gIH0sIFRleHRhcmVhSW5wdXQucHJvdG90eXBlKTtcblxuICAvLyBDT05URU5URURJVEFCTEUgSU5QVVQgU1RZTEVcblxuICBmdW5jdGlvbiBDb250ZW50RWRpdGFibGVJbnB1dChjbSkge1xuICAgIHRoaXMuY20gPSBjbTtcbiAgICB0aGlzLmxhc3RBbmNob3JOb2RlID0gdGhpcy5sYXN0QW5jaG9yT2Zmc2V0ID0gdGhpcy5sYXN0Rm9jdXNOb2RlID0gdGhpcy5sYXN0Rm9jdXNPZmZzZXQgPSBudWxsO1xuICAgIHRoaXMucG9sbGluZyA9IG5ldyBEZWxheWVkKCk7XG4gICAgdGhpcy5ncmFjZVBlcmlvZCA9IGZhbHNlO1xuICB9XG5cbiAgQ29udGVudEVkaXRhYmxlSW5wdXQucHJvdG90eXBlID0gY29weU9iaih7XG4gICAgaW5pdDogZnVuY3Rpb24oZGlzcGxheSkge1xuICAgICAgdmFyIGlucHV0ID0gdGhpcywgY20gPSBpbnB1dC5jbTtcbiAgICAgIHZhciBkaXYgPSBpbnB1dC5kaXYgPSBkaXNwbGF5LmxpbmVEaXY7XG4gICAgICBkaXNhYmxlQnJvd3Nlck1hZ2ljKGRpdik7XG5cbiAgICAgIG9uKGRpdiwgXCJwYXN0ZVwiLCBmdW5jdGlvbihlKSB7IGhhbmRsZVBhc3RlKGUsIGNtKTsgfSlcblxuICAgICAgb24oZGl2LCBcImNvbXBvc2l0aW9uc3RhcnRcIiwgZnVuY3Rpb24oZSkge1xuICAgICAgICB2YXIgZGF0YSA9IGUuZGF0YTtcbiAgICAgICAgaW5wdXQuY29tcG9zaW5nID0ge3NlbDogY20uZG9jLnNlbCwgZGF0YTogZGF0YSwgc3RhcnREYXRhOiBkYXRhfTtcbiAgICAgICAgaWYgKCFkYXRhKSByZXR1cm47XG4gICAgICAgIHZhciBwcmltID0gY20uZG9jLnNlbC5wcmltYXJ5KCk7XG4gICAgICAgIHZhciBsaW5lID0gY20uZ2V0TGluZShwcmltLmhlYWQubGluZSk7XG4gICAgICAgIHZhciBmb3VuZCA9IGxpbmUuaW5kZXhPZihkYXRhLCBNYXRoLm1heCgwLCBwcmltLmhlYWQuY2ggLSBkYXRhLmxlbmd0aCkpO1xuICAgICAgICBpZiAoZm91bmQgPiAtMSAmJiBmb3VuZCA8PSBwcmltLmhlYWQuY2gpXG4gICAgICAgICAgaW5wdXQuY29tcG9zaW5nLnNlbCA9IHNpbXBsZVNlbGVjdGlvbihQb3MocHJpbS5oZWFkLmxpbmUsIGZvdW5kKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFBvcyhwcmltLmhlYWQubGluZSwgZm91bmQgKyBkYXRhLmxlbmd0aCkpO1xuICAgICAgfSk7XG4gICAgICBvbihkaXYsIFwiY29tcG9zaXRpb251cGRhdGVcIiwgZnVuY3Rpb24oZSkge1xuICAgICAgICBpbnB1dC5jb21wb3NpbmcuZGF0YSA9IGUuZGF0YTtcbiAgICAgIH0pO1xuICAgICAgb24oZGl2LCBcImNvbXBvc2l0aW9uZW5kXCIsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdmFyIG91cnMgPSBpbnB1dC5jb21wb3Npbmc7XG4gICAgICAgIGlmICghb3VycykgcmV0dXJuO1xuICAgICAgICBpZiAoZS5kYXRhICE9IG91cnMuc3RhcnREYXRhICYmICEvXFx1MjAwYi8udGVzdChlLmRhdGEpKVxuICAgICAgICAgIG91cnMuZGF0YSA9IGUuZGF0YTtcbiAgICAgICAgLy8gTmVlZCBhIHNtYWxsIGRlbGF5IHRvIHByZXZlbnQgb3RoZXIgY29kZSAoaW5wdXQgZXZlbnQsXG4gICAgICAgIC8vIHNlbGVjdGlvbiBwb2xsaW5nKSBmcm9tIGRvaW5nIGRhbWFnZSB3aGVuIGZpcmVkIHJpZ2h0IGFmdGVyXG4gICAgICAgIC8vIGNvbXBvc2l0aW9uZW5kLlxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmICghb3Vycy5oYW5kbGVkKVxuICAgICAgICAgICAgaW5wdXQuYXBwbHlDb21wb3NpdGlvbihvdXJzKTtcbiAgICAgICAgICBpZiAoaW5wdXQuY29tcG9zaW5nID09IG91cnMpXG4gICAgICAgICAgICBpbnB1dC5jb21wb3NpbmcgPSBudWxsO1xuICAgICAgICB9LCA1MCk7XG4gICAgICB9KTtcblxuICAgICAgb24oZGl2LCBcInRvdWNoc3RhcnRcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgIGlucHV0LmZvcmNlQ29tcG9zaXRpb25FbmQoKTtcbiAgICAgIH0pO1xuXG4gICAgICBvbihkaXYsIFwiaW5wdXRcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChpbnB1dC5jb21wb3NpbmcpIHJldHVybjtcbiAgICAgICAgaWYgKGlzUmVhZE9ubHkoY20pIHx8ICFpbnB1dC5wb2xsQ29udGVudCgpKVxuICAgICAgICAgIHJ1bkluT3AoaW5wdXQuY20sIGZ1bmN0aW9uKCkge3JlZ0NoYW5nZShjbSk7fSk7XG4gICAgICB9KTtcblxuICAgICAgZnVuY3Rpb24gb25Db3B5Q3V0KGUpIHtcbiAgICAgICAgaWYgKGNtLnNvbWV0aGluZ1NlbGVjdGVkKCkpIHtcbiAgICAgICAgICBsYXN0Q29waWVkID0gY20uZ2V0U2VsZWN0aW9ucygpO1xuICAgICAgICAgIGlmIChlLnR5cGUgPT0gXCJjdXRcIikgY20ucmVwbGFjZVNlbGVjdGlvbihcIlwiLCBudWxsLCBcImN1dFwiKTtcbiAgICAgICAgfSBlbHNlIGlmICghY20ub3B0aW9ucy5saW5lV2lzZUNvcHlDdXQpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIHJhbmdlcyA9IGNvcHlhYmxlUmFuZ2VzKGNtKTtcbiAgICAgICAgICBsYXN0Q29waWVkID0gcmFuZ2VzLnRleHQ7XG4gICAgICAgICAgaWYgKGUudHlwZSA9PSBcImN1dFwiKSB7XG4gICAgICAgICAgICBjbS5vcGVyYXRpb24oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIGNtLnNldFNlbGVjdGlvbnMocmFuZ2VzLnJhbmdlcywgMCwgc2VsX2RvbnRTY3JvbGwpO1xuICAgICAgICAgICAgICBjbS5yZXBsYWNlU2VsZWN0aW9uKFwiXCIsIG51bGwsIFwiY3V0XCIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIGlPUyBleHBvc2VzIHRoZSBjbGlwYm9hcmQgQVBJLCBidXQgc2VlbXMgdG8gZGlzY2FyZCBjb250ZW50IGluc2VydGVkIGludG8gaXRcbiAgICAgICAgaWYgKGUuY2xpcGJvYXJkRGF0YSAmJiAhaW9zKSB7XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIGUuY2xpcGJvYXJkRGF0YS5jbGVhckRhdGEoKTtcbiAgICAgICAgICBlLmNsaXBib2FyZERhdGEuc2V0RGF0YShcInRleHQvcGxhaW5cIiwgbGFzdENvcGllZC5qb2luKFwiXFxuXCIpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBPbGQtZmFzaGlvbmVkIGJyaWVmbHktZm9jdXMtYS10ZXh0YXJlYSBoYWNrXG4gICAgICAgICAgdmFyIGtsdWRnZSA9IGhpZGRlblRleHRhcmVhKCksIHRlID0ga2x1ZGdlLmZpcnN0Q2hpbGQ7XG4gICAgICAgICAgY20uZGlzcGxheS5saW5lU3BhY2UuaW5zZXJ0QmVmb3JlKGtsdWRnZSwgY20uZGlzcGxheS5saW5lU3BhY2UuZmlyc3RDaGlsZCk7XG4gICAgICAgICAgdGUudmFsdWUgPSBsYXN0Q29waWVkLmpvaW4oXCJcXG5cIik7XG4gICAgICAgICAgdmFyIGhhZEZvY3VzID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcbiAgICAgICAgICBzZWxlY3RJbnB1dCh0ZSk7XG4gICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNtLmRpc3BsYXkubGluZVNwYWNlLnJlbW92ZUNoaWxkKGtsdWRnZSk7XG4gICAgICAgICAgICBoYWRGb2N1cy5mb2N1cygpO1xuICAgICAgICAgIH0sIDUwKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgb24oZGl2LCBcImNvcHlcIiwgb25Db3B5Q3V0KTtcbiAgICAgIG9uKGRpdiwgXCJjdXRcIiwgb25Db3B5Q3V0KTtcbiAgICB9LFxuXG4gICAgcHJlcGFyZVNlbGVjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgcmVzdWx0ID0gcHJlcGFyZVNlbGVjdGlvbih0aGlzLmNtLCBmYWxzZSk7XG4gICAgICByZXN1bHQuZm9jdXMgPSB0aGlzLmNtLnN0YXRlLmZvY3VzZWQ7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sXG5cbiAgICBzaG93U2VsZWN0aW9uOiBmdW5jdGlvbihpbmZvKSB7XG4gICAgICBpZiAoIWluZm8gfHwgIXRoaXMuY20uZGlzcGxheS52aWV3Lmxlbmd0aCkgcmV0dXJuO1xuICAgICAgaWYgKGluZm8uZm9jdXMpIHRoaXMuc2hvd1ByaW1hcnlTZWxlY3Rpb24oKTtcbiAgICAgIHRoaXMuc2hvd011bHRpcGxlU2VsZWN0aW9ucyhpbmZvKTtcbiAgICB9LFxuXG4gICAgc2hvd1ByaW1hcnlTZWxlY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHNlbCA9IHdpbmRvdy5nZXRTZWxlY3Rpb24oKSwgcHJpbSA9IHRoaXMuY20uZG9jLnNlbC5wcmltYXJ5KCk7XG4gICAgICB2YXIgY3VyQW5jaG9yID0gZG9tVG9Qb3ModGhpcy5jbSwgc2VsLmFuY2hvck5vZGUsIHNlbC5hbmNob3JPZmZzZXQpO1xuICAgICAgdmFyIGN1ckZvY3VzID0gZG9tVG9Qb3ModGhpcy5jbSwgc2VsLmZvY3VzTm9kZSwgc2VsLmZvY3VzT2Zmc2V0KTtcbiAgICAgIGlmIChjdXJBbmNob3IgJiYgIWN1ckFuY2hvci5iYWQgJiYgY3VyRm9jdXMgJiYgIWN1ckZvY3VzLmJhZCAmJlxuICAgICAgICAgIGNtcChtaW5Qb3MoY3VyQW5jaG9yLCBjdXJGb2N1cyksIHByaW0uZnJvbSgpKSA9PSAwICYmXG4gICAgICAgICAgY21wKG1heFBvcyhjdXJBbmNob3IsIGN1ckZvY3VzKSwgcHJpbS50bygpKSA9PSAwKVxuICAgICAgICByZXR1cm47XG5cbiAgICAgIHZhciBzdGFydCA9IHBvc1RvRE9NKHRoaXMuY20sIHByaW0uZnJvbSgpKTtcbiAgICAgIHZhciBlbmQgPSBwb3NUb0RPTSh0aGlzLmNtLCBwcmltLnRvKCkpO1xuICAgICAgaWYgKCFzdGFydCAmJiAhZW5kKSByZXR1cm47XG5cbiAgICAgIHZhciB2aWV3ID0gdGhpcy5jbS5kaXNwbGF5LnZpZXc7XG4gICAgICB2YXIgb2xkID0gc2VsLnJhbmdlQ291bnQgJiYgc2VsLmdldFJhbmdlQXQoMCk7XG4gICAgICBpZiAoIXN0YXJ0KSB7XG4gICAgICAgIHN0YXJ0ID0ge25vZGU6IHZpZXdbMF0ubWVhc3VyZS5tYXBbMl0sIG9mZnNldDogMH07XG4gICAgICB9IGVsc2UgaWYgKCFlbmQpIHsgLy8gRklYTUUgZGFuZ2Vyb3VzbHkgaGFja3lcbiAgICAgICAgdmFyIG1lYXN1cmUgPSB2aWV3W3ZpZXcubGVuZ3RoIC0gMV0ubWVhc3VyZTtcbiAgICAgICAgdmFyIG1hcCA9IG1lYXN1cmUubWFwcyA/IG1lYXN1cmUubWFwc1ttZWFzdXJlLm1hcHMubGVuZ3RoIC0gMV0gOiBtZWFzdXJlLm1hcDtcbiAgICAgICAgZW5kID0ge25vZGU6IG1hcFttYXAubGVuZ3RoIC0gMV0sIG9mZnNldDogbWFwW21hcC5sZW5ndGggLSAyXSAtIG1hcFttYXAubGVuZ3RoIC0gM119O1xuICAgICAgfVxuXG4gICAgICB0cnkgeyB2YXIgcm5nID0gcmFuZ2Uoc3RhcnQubm9kZSwgc3RhcnQub2Zmc2V0LCBlbmQub2Zmc2V0LCBlbmQubm9kZSk7IH1cbiAgICAgIGNhdGNoKGUpIHt9IC8vIE91ciBtb2RlbCBvZiB0aGUgRE9NIG1pZ2h0IGJlIG91dGRhdGVkLCBpbiB3aGljaCBjYXNlIHRoZSByYW5nZSB3ZSB0cnkgdG8gc2V0IGNhbiBiZSBpbXBvc3NpYmxlXG4gICAgICBpZiAocm5nKSB7XG4gICAgICAgIHNlbC5yZW1vdmVBbGxSYW5nZXMoKTtcbiAgICAgICAgc2VsLmFkZFJhbmdlKHJuZyk7XG4gICAgICAgIGlmIChvbGQgJiYgc2VsLmFuY2hvck5vZGUgPT0gbnVsbCkgc2VsLmFkZFJhbmdlKG9sZCk7XG4gICAgICAgIGVsc2UgaWYgKGdlY2tvKSB0aGlzLnN0YXJ0R3JhY2VQZXJpb2QoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMucmVtZW1iZXJTZWxlY3Rpb24oKTtcbiAgICB9LFxuXG4gICAgc3RhcnRHcmFjZVBlcmlvZDogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgaW5wdXQgPSB0aGlzO1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuZ3JhY2VQZXJpb2QpO1xuICAgICAgdGhpcy5ncmFjZVBlcmlvZCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIGlucHV0LmdyYWNlUGVyaW9kID0gZmFsc2U7XG4gICAgICAgIGlmIChpbnB1dC5zZWxlY3Rpb25DaGFuZ2VkKCkpXG4gICAgICAgICAgaW5wdXQuY20ub3BlcmF0aW9uKGZ1bmN0aW9uKCkgeyBpbnB1dC5jbS5jdXJPcC5zZWxlY3Rpb25DaGFuZ2VkID0gdHJ1ZTsgfSk7XG4gICAgICB9LCAyMCk7XG4gICAgfSxcblxuICAgIHNob3dNdWx0aXBsZVNlbGVjdGlvbnM6IGZ1bmN0aW9uKGluZm8pIHtcbiAgICAgIHJlbW92ZUNoaWxkcmVuQW5kQWRkKHRoaXMuY20uZGlzcGxheS5jdXJzb3JEaXYsIGluZm8uY3Vyc29ycyk7XG4gICAgICByZW1vdmVDaGlsZHJlbkFuZEFkZCh0aGlzLmNtLmRpc3BsYXkuc2VsZWN0aW9uRGl2LCBpbmZvLnNlbGVjdGlvbik7XG4gICAgfSxcblxuICAgIHJlbWVtYmVyU2VsZWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBzZWwgPSB3aW5kb3cuZ2V0U2VsZWN0aW9uKCk7XG4gICAgICB0aGlzLmxhc3RBbmNob3JOb2RlID0gc2VsLmFuY2hvck5vZGU7IHRoaXMubGFzdEFuY2hvck9mZnNldCA9IHNlbC5hbmNob3JPZmZzZXQ7XG4gICAgICB0aGlzLmxhc3RGb2N1c05vZGUgPSBzZWwuZm9jdXNOb2RlOyB0aGlzLmxhc3RGb2N1c09mZnNldCA9IHNlbC5mb2N1c09mZnNldDtcbiAgICB9LFxuXG4gICAgc2VsZWN0aW9uSW5FZGl0b3I6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHNlbCA9IHdpbmRvdy5nZXRTZWxlY3Rpb24oKTtcbiAgICAgIGlmICghc2VsLnJhbmdlQ291bnQpIHJldHVybiBmYWxzZTtcbiAgICAgIHZhciBub2RlID0gc2VsLmdldFJhbmdlQXQoMCkuY29tbW9uQW5jZXN0b3JDb250YWluZXI7XG4gICAgICByZXR1cm4gY29udGFpbnModGhpcy5kaXYsIG5vZGUpO1xuICAgIH0sXG5cbiAgICBmb2N1czogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAodGhpcy5jbS5vcHRpb25zLnJlYWRPbmx5ICE9IFwibm9jdXJzb3JcIikgdGhpcy5kaXYuZm9jdXMoKTtcbiAgICB9LFxuICAgIGJsdXI6IGZ1bmN0aW9uKCkgeyB0aGlzLmRpdi5ibHVyKCk7IH0sXG4gICAgZ2V0RmllbGQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy5kaXY7IH0sXG5cbiAgICBzdXBwb3J0c1RvdWNoOiBmdW5jdGlvbigpIHsgcmV0dXJuIHRydWU7IH0sXG5cbiAgICByZWNlaXZlZEZvY3VzOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBpbnB1dCA9IHRoaXM7XG4gICAgICBpZiAodGhpcy5zZWxlY3Rpb25JbkVkaXRvcigpKVxuICAgICAgICB0aGlzLnBvbGxTZWxlY3Rpb24oKTtcbiAgICAgIGVsc2VcbiAgICAgICAgcnVuSW5PcCh0aGlzLmNtLCBmdW5jdGlvbigpIHsgaW5wdXQuY20uY3VyT3Auc2VsZWN0aW9uQ2hhbmdlZCA9IHRydWU7IH0pO1xuXG4gICAgICBmdW5jdGlvbiBwb2xsKCkge1xuICAgICAgICBpZiAoaW5wdXQuY20uc3RhdGUuZm9jdXNlZCkge1xuICAgICAgICAgIGlucHV0LnBvbGxTZWxlY3Rpb24oKTtcbiAgICAgICAgICBpbnB1dC5wb2xsaW5nLnNldChpbnB1dC5jbS5vcHRpb25zLnBvbGxJbnRlcnZhbCwgcG9sbCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMucG9sbGluZy5zZXQodGhpcy5jbS5vcHRpb25zLnBvbGxJbnRlcnZhbCwgcG9sbCk7XG4gICAgfSxcblxuICAgIHNlbGVjdGlvbkNoYW5nZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHNlbCA9IHdpbmRvdy5nZXRTZWxlY3Rpb24oKTtcbiAgICAgIHJldHVybiBzZWwuYW5jaG9yTm9kZSAhPSB0aGlzLmxhc3RBbmNob3JOb2RlIHx8IHNlbC5hbmNob3JPZmZzZXQgIT0gdGhpcy5sYXN0QW5jaG9yT2Zmc2V0IHx8XG4gICAgICAgIHNlbC5mb2N1c05vZGUgIT0gdGhpcy5sYXN0Rm9jdXNOb2RlIHx8IHNlbC5mb2N1c09mZnNldCAhPSB0aGlzLmxhc3RGb2N1c09mZnNldDtcbiAgICB9LFxuXG4gICAgcG9sbFNlbGVjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoIXRoaXMuY29tcG9zaW5nICYmICF0aGlzLmdyYWNlUGVyaW9kICYmIHRoaXMuc2VsZWN0aW9uQ2hhbmdlZCgpKSB7XG4gICAgICAgIHZhciBzZWwgPSB3aW5kb3cuZ2V0U2VsZWN0aW9uKCksIGNtID0gdGhpcy5jbTtcbiAgICAgICAgdGhpcy5yZW1lbWJlclNlbGVjdGlvbigpO1xuICAgICAgICB2YXIgYW5jaG9yID0gZG9tVG9Qb3MoY20sIHNlbC5hbmNob3JOb2RlLCBzZWwuYW5jaG9yT2Zmc2V0KTtcbiAgICAgICAgdmFyIGhlYWQgPSBkb21Ub1BvcyhjbSwgc2VsLmZvY3VzTm9kZSwgc2VsLmZvY3VzT2Zmc2V0KTtcbiAgICAgICAgaWYgKGFuY2hvciAmJiBoZWFkKSBydW5Jbk9wKGNtLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICBzZXRTZWxlY3Rpb24oY20uZG9jLCBzaW1wbGVTZWxlY3Rpb24oYW5jaG9yLCBoZWFkKSwgc2VsX2RvbnRTY3JvbGwpO1xuICAgICAgICAgIGlmIChhbmNob3IuYmFkIHx8IGhlYWQuYmFkKSBjbS5jdXJPcC5zZWxlY3Rpb25DaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIHBvbGxDb250ZW50OiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBjbSA9IHRoaXMuY20sIGRpc3BsYXkgPSBjbS5kaXNwbGF5LCBzZWwgPSBjbS5kb2Muc2VsLnByaW1hcnkoKTtcbiAgICAgIHZhciBmcm9tID0gc2VsLmZyb20oKSwgdG8gPSBzZWwudG8oKTtcbiAgICAgIGlmIChmcm9tLmxpbmUgPCBkaXNwbGF5LnZpZXdGcm9tIHx8IHRvLmxpbmUgPiBkaXNwbGF5LnZpZXdUbyAtIDEpIHJldHVybiBmYWxzZTtcblxuICAgICAgdmFyIGZyb21JbmRleDtcbiAgICAgIGlmIChmcm9tLmxpbmUgPT0gZGlzcGxheS52aWV3RnJvbSB8fCAoZnJvbUluZGV4ID0gZmluZFZpZXdJbmRleChjbSwgZnJvbS5saW5lKSkgPT0gMCkge1xuICAgICAgICB2YXIgZnJvbUxpbmUgPSBsaW5lTm8oZGlzcGxheS52aWV3WzBdLmxpbmUpO1xuICAgICAgICB2YXIgZnJvbU5vZGUgPSBkaXNwbGF5LnZpZXdbMF0ubm9kZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBmcm9tTGluZSA9IGxpbmVObyhkaXNwbGF5LnZpZXdbZnJvbUluZGV4XS5saW5lKTtcbiAgICAgICAgdmFyIGZyb21Ob2RlID0gZGlzcGxheS52aWV3W2Zyb21JbmRleCAtIDFdLm5vZGUubmV4dFNpYmxpbmc7XG4gICAgICB9XG4gICAgICB2YXIgdG9JbmRleCA9IGZpbmRWaWV3SW5kZXgoY20sIHRvLmxpbmUpO1xuICAgICAgaWYgKHRvSW5kZXggPT0gZGlzcGxheS52aWV3Lmxlbmd0aCAtIDEpIHtcbiAgICAgICAgdmFyIHRvTGluZSA9IGRpc3BsYXkudmlld1RvIC0gMTtcbiAgICAgICAgdmFyIHRvTm9kZSA9IGRpc3BsYXkubGluZURpdi5sYXN0Q2hpbGQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgdG9MaW5lID0gbGluZU5vKGRpc3BsYXkudmlld1t0b0luZGV4ICsgMV0ubGluZSkgLSAxO1xuICAgICAgICB2YXIgdG9Ob2RlID0gZGlzcGxheS52aWV3W3RvSW5kZXggKyAxXS5ub2RlLnByZXZpb3VzU2libGluZztcbiAgICAgIH1cblxuICAgICAgdmFyIG5ld1RleHQgPSBjbS5kb2Muc3BsaXRMaW5lcyhkb21UZXh0QmV0d2VlbihjbSwgZnJvbU5vZGUsIHRvTm9kZSwgZnJvbUxpbmUsIHRvTGluZSkpO1xuICAgICAgdmFyIG9sZFRleHQgPSBnZXRCZXR3ZWVuKGNtLmRvYywgUG9zKGZyb21MaW5lLCAwKSwgUG9zKHRvTGluZSwgZ2V0TGluZShjbS5kb2MsIHRvTGluZSkudGV4dC5sZW5ndGgpKTtcbiAgICAgIHdoaWxlIChuZXdUZXh0Lmxlbmd0aCA+IDEgJiYgb2xkVGV4dC5sZW5ndGggPiAxKSB7XG4gICAgICAgIGlmIChsc3QobmV3VGV4dCkgPT0gbHN0KG9sZFRleHQpKSB7IG5ld1RleHQucG9wKCk7IG9sZFRleHQucG9wKCk7IHRvTGluZS0tOyB9XG4gICAgICAgIGVsc2UgaWYgKG5ld1RleHRbMF0gPT0gb2xkVGV4dFswXSkgeyBuZXdUZXh0LnNoaWZ0KCk7IG9sZFRleHQuc2hpZnQoKTsgZnJvbUxpbmUrKzsgfVxuICAgICAgICBlbHNlIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICB2YXIgY3V0RnJvbnQgPSAwLCBjdXRFbmQgPSAwO1xuICAgICAgdmFyIG5ld1RvcCA9IG5ld1RleHRbMF0sIG9sZFRvcCA9IG9sZFRleHRbMF0sIG1heEN1dEZyb250ID0gTWF0aC5taW4obmV3VG9wLmxlbmd0aCwgb2xkVG9wLmxlbmd0aCk7XG4gICAgICB3aGlsZSAoY3V0RnJvbnQgPCBtYXhDdXRGcm9udCAmJiBuZXdUb3AuY2hhckNvZGVBdChjdXRGcm9udCkgPT0gb2xkVG9wLmNoYXJDb2RlQXQoY3V0RnJvbnQpKVxuICAgICAgICArK2N1dEZyb250O1xuICAgICAgdmFyIG5ld0JvdCA9IGxzdChuZXdUZXh0KSwgb2xkQm90ID0gbHN0KG9sZFRleHQpO1xuICAgICAgdmFyIG1heEN1dEVuZCA9IE1hdGgubWluKG5ld0JvdC5sZW5ndGggLSAobmV3VGV4dC5sZW5ndGggPT0gMSA/IGN1dEZyb250IDogMCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2xkQm90Lmxlbmd0aCAtIChvbGRUZXh0Lmxlbmd0aCA9PSAxID8gY3V0RnJvbnQgOiAwKSk7XG4gICAgICB3aGlsZSAoY3V0RW5kIDwgbWF4Q3V0RW5kICYmXG4gICAgICAgICAgICAgbmV3Qm90LmNoYXJDb2RlQXQobmV3Qm90Lmxlbmd0aCAtIGN1dEVuZCAtIDEpID09IG9sZEJvdC5jaGFyQ29kZUF0KG9sZEJvdC5sZW5ndGggLSBjdXRFbmQgLSAxKSlcbiAgICAgICAgKytjdXRFbmQ7XG5cbiAgICAgIG5ld1RleHRbbmV3VGV4dC5sZW5ndGggLSAxXSA9IG5ld0JvdC5zbGljZSgwLCBuZXdCb3QubGVuZ3RoIC0gY3V0RW5kKTtcbiAgICAgIG5ld1RleHRbMF0gPSBuZXdUZXh0WzBdLnNsaWNlKGN1dEZyb250KTtcblxuICAgICAgdmFyIGNoRnJvbSA9IFBvcyhmcm9tTGluZSwgY3V0RnJvbnQpO1xuICAgICAgdmFyIGNoVG8gPSBQb3ModG9MaW5lLCBvbGRUZXh0Lmxlbmd0aCA/IGxzdChvbGRUZXh0KS5sZW5ndGggLSBjdXRFbmQgOiAwKTtcbiAgICAgIGlmIChuZXdUZXh0Lmxlbmd0aCA+IDEgfHwgbmV3VGV4dFswXSB8fCBjbXAoY2hGcm9tLCBjaFRvKSkge1xuICAgICAgICByZXBsYWNlUmFuZ2UoY20uZG9jLCBuZXdUZXh0LCBjaEZyb20sIGNoVG8sIFwiK2lucHV0XCIpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgZW5zdXJlUG9sbGVkOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuZm9yY2VDb21wb3NpdGlvbkVuZCgpO1xuICAgIH0sXG4gICAgcmVzZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5mb3JjZUNvbXBvc2l0aW9uRW5kKCk7XG4gICAgfSxcbiAgICBmb3JjZUNvbXBvc2l0aW9uRW5kOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICghdGhpcy5jb21wb3NpbmcgfHwgdGhpcy5jb21wb3NpbmcuaGFuZGxlZCkgcmV0dXJuO1xuICAgICAgdGhpcy5hcHBseUNvbXBvc2l0aW9uKHRoaXMuY29tcG9zaW5nKTtcbiAgICAgIHRoaXMuY29tcG9zaW5nLmhhbmRsZWQgPSB0cnVlO1xuICAgICAgdGhpcy5kaXYuYmx1cigpO1xuICAgICAgdGhpcy5kaXYuZm9jdXMoKTtcbiAgICB9LFxuICAgIGFwcGx5Q29tcG9zaXRpb246IGZ1bmN0aW9uKGNvbXBvc2luZykge1xuICAgICAgaWYgKGlzUmVhZE9ubHkodGhpcy5jbSkpXG4gICAgICAgIG9wZXJhdGlvbih0aGlzLmNtLCByZWdDaGFuZ2UpKHRoaXMuY20pXG4gICAgICBlbHNlIGlmIChjb21wb3NpbmcuZGF0YSAmJiBjb21wb3NpbmcuZGF0YSAhPSBjb21wb3Npbmcuc3RhcnREYXRhKVxuICAgICAgICBvcGVyYXRpb24odGhpcy5jbSwgYXBwbHlUZXh0SW5wdXQpKHRoaXMuY20sIGNvbXBvc2luZy5kYXRhLCAwLCBjb21wb3Npbmcuc2VsKTtcbiAgICB9LFxuXG4gICAgc2V0VW5lZGl0YWJsZTogZnVuY3Rpb24obm9kZSkge1xuICAgICAgbm9kZS5jb250ZW50RWRpdGFibGUgPSBcImZhbHNlXCJcbiAgICB9LFxuXG4gICAgb25LZXlQcmVzczogZnVuY3Rpb24oZSkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgaWYgKCFpc1JlYWRPbmx5KHRoaXMuY20pKVxuICAgICAgICBvcGVyYXRpb24odGhpcy5jbSwgYXBwbHlUZXh0SW5wdXQpKHRoaXMuY20sIFN0cmluZy5mcm9tQ2hhckNvZGUoZS5jaGFyQ29kZSA9PSBudWxsID8gZS5rZXlDb2RlIDogZS5jaGFyQ29kZSksIDApO1xuICAgIH0sXG5cbiAgICByZWFkT25seUNoYW5nZWQ6IGZ1bmN0aW9uKHZhbCkge1xuICAgICAgdGhpcy5kaXYuY29udGVudEVkaXRhYmxlID0gU3RyaW5nKHZhbCAhPSBcIm5vY3Vyc29yXCIpXG4gICAgfSxcblxuICAgIG9uQ29udGV4dE1lbnU6IG5vdGhpbmcsXG4gICAgcmVzZXRQb3NpdGlvbjogbm90aGluZyxcblxuICAgIG5lZWRzQ29udGVudEF0dHJpYnV0ZTogdHJ1ZVxuICB9LCBDb250ZW50RWRpdGFibGVJbnB1dC5wcm90b3R5cGUpO1xuXG4gIGZ1bmN0aW9uIHBvc1RvRE9NKGNtLCBwb3MpIHtcbiAgICB2YXIgdmlldyA9IGZpbmRWaWV3Rm9yTGluZShjbSwgcG9zLmxpbmUpO1xuICAgIGlmICghdmlldyB8fCB2aWV3LmhpZGRlbikgcmV0dXJuIG51bGw7XG4gICAgdmFyIGxpbmUgPSBnZXRMaW5lKGNtLmRvYywgcG9zLmxpbmUpO1xuICAgIHZhciBpbmZvID0gbWFwRnJvbUxpbmVWaWV3KHZpZXcsIGxpbmUsIHBvcy5saW5lKTtcblxuICAgIHZhciBvcmRlciA9IGdldE9yZGVyKGxpbmUpLCBzaWRlID0gXCJsZWZ0XCI7XG4gICAgaWYgKG9yZGVyKSB7XG4gICAgICB2YXIgcGFydFBvcyA9IGdldEJpZGlQYXJ0QXQob3JkZXIsIHBvcy5jaCk7XG4gICAgICBzaWRlID0gcGFydFBvcyAlIDIgPyBcInJpZ2h0XCIgOiBcImxlZnRcIjtcbiAgICB9XG4gICAgdmFyIHJlc3VsdCA9IG5vZGVBbmRPZmZzZXRJbkxpbmVNYXAoaW5mby5tYXAsIHBvcy5jaCwgc2lkZSk7XG4gICAgcmVzdWx0Lm9mZnNldCA9IHJlc3VsdC5jb2xsYXBzZSA9PSBcInJpZ2h0XCIgPyByZXN1bHQuZW5kIDogcmVzdWx0LnN0YXJ0O1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBmdW5jdGlvbiBiYWRQb3MocG9zLCBiYWQpIHsgaWYgKGJhZCkgcG9zLmJhZCA9IHRydWU7IHJldHVybiBwb3M7IH1cblxuICBmdW5jdGlvbiBkb21Ub1BvcyhjbSwgbm9kZSwgb2Zmc2V0KSB7XG4gICAgdmFyIGxpbmVOb2RlO1xuICAgIGlmIChub2RlID09IGNtLmRpc3BsYXkubGluZURpdikge1xuICAgICAgbGluZU5vZGUgPSBjbS5kaXNwbGF5LmxpbmVEaXYuY2hpbGROb2Rlc1tvZmZzZXRdO1xuICAgICAgaWYgKCFsaW5lTm9kZSkgcmV0dXJuIGJhZFBvcyhjbS5jbGlwUG9zKFBvcyhjbS5kaXNwbGF5LnZpZXdUbyAtIDEpKSwgdHJ1ZSk7XG4gICAgICBub2RlID0gbnVsbDsgb2Zmc2V0ID0gMDtcbiAgICB9IGVsc2Uge1xuICAgICAgZm9yIChsaW5lTm9kZSA9IG5vZGU7OyBsaW5lTm9kZSA9IGxpbmVOb2RlLnBhcmVudE5vZGUpIHtcbiAgICAgICAgaWYgKCFsaW5lTm9kZSB8fCBsaW5lTm9kZSA9PSBjbS5kaXNwbGF5LmxpbmVEaXYpIHJldHVybiBudWxsO1xuICAgICAgICBpZiAobGluZU5vZGUucGFyZW50Tm9kZSAmJiBsaW5lTm9kZS5wYXJlbnROb2RlID09IGNtLmRpc3BsYXkubGluZURpdikgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY20uZGlzcGxheS52aWV3Lmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgbGluZVZpZXcgPSBjbS5kaXNwbGF5LnZpZXdbaV07XG4gICAgICBpZiAobGluZVZpZXcubm9kZSA9PSBsaW5lTm9kZSlcbiAgICAgICAgcmV0dXJuIGxvY2F0ZU5vZGVJbkxpbmVWaWV3KGxpbmVWaWV3LCBub2RlLCBvZmZzZXQpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGxvY2F0ZU5vZGVJbkxpbmVWaWV3KGxpbmVWaWV3LCBub2RlLCBvZmZzZXQpIHtcbiAgICB2YXIgd3JhcHBlciA9IGxpbmVWaWV3LnRleHQuZmlyc3RDaGlsZCwgYmFkID0gZmFsc2U7XG4gICAgaWYgKCFub2RlIHx8ICFjb250YWlucyh3cmFwcGVyLCBub2RlKSkgcmV0dXJuIGJhZFBvcyhQb3MobGluZU5vKGxpbmVWaWV3LmxpbmUpLCAwKSwgdHJ1ZSk7XG4gICAgaWYgKG5vZGUgPT0gd3JhcHBlcikge1xuICAgICAgYmFkID0gdHJ1ZTtcbiAgICAgIG5vZGUgPSB3cmFwcGVyLmNoaWxkTm9kZXNbb2Zmc2V0XTtcbiAgICAgIG9mZnNldCA9IDA7XG4gICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgdmFyIGxpbmUgPSBsaW5lVmlldy5yZXN0ID8gbHN0KGxpbmVWaWV3LnJlc3QpIDogbGluZVZpZXcubGluZTtcbiAgICAgICAgcmV0dXJuIGJhZFBvcyhQb3MobGluZU5vKGxpbmUpLCBsaW5lLnRleHQubGVuZ3RoKSwgYmFkKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgdGV4dE5vZGUgPSBub2RlLm5vZGVUeXBlID09IDMgPyBub2RlIDogbnVsbCwgdG9wTm9kZSA9IG5vZGU7XG4gICAgaWYgKCF0ZXh0Tm9kZSAmJiBub2RlLmNoaWxkTm9kZXMubGVuZ3RoID09IDEgJiYgbm9kZS5maXJzdENoaWxkLm5vZGVUeXBlID09IDMpIHtcbiAgICAgIHRleHROb2RlID0gbm9kZS5maXJzdENoaWxkO1xuICAgICAgaWYgKG9mZnNldCkgb2Zmc2V0ID0gdGV4dE5vZGUubm9kZVZhbHVlLmxlbmd0aDtcbiAgICB9XG4gICAgd2hpbGUgKHRvcE5vZGUucGFyZW50Tm9kZSAhPSB3cmFwcGVyKSB0b3BOb2RlID0gdG9wTm9kZS5wYXJlbnROb2RlO1xuICAgIHZhciBtZWFzdXJlID0gbGluZVZpZXcubWVhc3VyZSwgbWFwcyA9IG1lYXN1cmUubWFwcztcblxuICAgIGZ1bmN0aW9uIGZpbmQodGV4dE5vZGUsIHRvcE5vZGUsIG9mZnNldCkge1xuICAgICAgZm9yICh2YXIgaSA9IC0xOyBpIDwgKG1hcHMgPyBtYXBzLmxlbmd0aCA6IDApOyBpKyspIHtcbiAgICAgICAgdmFyIG1hcCA9IGkgPCAwID8gbWVhc3VyZS5tYXAgOiBtYXBzW2ldO1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IG1hcC5sZW5ndGg7IGogKz0gMykge1xuICAgICAgICAgIHZhciBjdXJOb2RlID0gbWFwW2ogKyAyXTtcbiAgICAgICAgICBpZiAoY3VyTm9kZSA9PSB0ZXh0Tm9kZSB8fCBjdXJOb2RlID09IHRvcE5vZGUpIHtcbiAgICAgICAgICAgIHZhciBsaW5lID0gbGluZU5vKGkgPCAwID8gbGluZVZpZXcubGluZSA6IGxpbmVWaWV3LnJlc3RbaV0pO1xuICAgICAgICAgICAgdmFyIGNoID0gbWFwW2pdICsgb2Zmc2V0O1xuICAgICAgICAgICAgaWYgKG9mZnNldCA8IDAgfHwgY3VyTm9kZSAhPSB0ZXh0Tm9kZSkgY2ggPSBtYXBbaiArIChvZmZzZXQgPyAxIDogMCldO1xuICAgICAgICAgICAgcmV0dXJuIFBvcyhsaW5lLCBjaCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHZhciBmb3VuZCA9IGZpbmQodGV4dE5vZGUsIHRvcE5vZGUsIG9mZnNldCk7XG4gICAgaWYgKGZvdW5kKSByZXR1cm4gYmFkUG9zKGZvdW5kLCBiYWQpO1xuXG4gICAgLy8gRklYTUUgdGhpcyBpcyBhbGwgcmVhbGx5IHNoYWt5LiBtaWdodCBoYW5kbGUgdGhlIGZldyBjYXNlcyBpdCBuZWVkcyB0byBoYW5kbGUsIGJ1dCBsaWtlbHkgdG8gY2F1c2UgcHJvYmxlbXNcbiAgICBmb3IgKHZhciBhZnRlciA9IHRvcE5vZGUubmV4dFNpYmxpbmcsIGRpc3QgPSB0ZXh0Tm9kZSA/IHRleHROb2RlLm5vZGVWYWx1ZS5sZW5ndGggLSBvZmZzZXQgOiAwOyBhZnRlcjsgYWZ0ZXIgPSBhZnRlci5uZXh0U2libGluZykge1xuICAgICAgZm91bmQgPSBmaW5kKGFmdGVyLCBhZnRlci5maXJzdENoaWxkLCAwKTtcbiAgICAgIGlmIChmb3VuZClcbiAgICAgICAgcmV0dXJuIGJhZFBvcyhQb3MoZm91bmQubGluZSwgZm91bmQuY2ggLSBkaXN0KSwgYmFkKTtcbiAgICAgIGVsc2VcbiAgICAgICAgZGlzdCArPSBhZnRlci50ZXh0Q29udGVudC5sZW5ndGg7XG4gICAgfVxuICAgIGZvciAodmFyIGJlZm9yZSA9IHRvcE5vZGUucHJldmlvdXNTaWJsaW5nLCBkaXN0ID0gb2Zmc2V0OyBiZWZvcmU7IGJlZm9yZSA9IGJlZm9yZS5wcmV2aW91c1NpYmxpbmcpIHtcbiAgICAgIGZvdW5kID0gZmluZChiZWZvcmUsIGJlZm9yZS5maXJzdENoaWxkLCAtMSk7XG4gICAgICBpZiAoZm91bmQpXG4gICAgICAgIHJldHVybiBiYWRQb3MoUG9zKGZvdW5kLmxpbmUsIGZvdW5kLmNoICsgZGlzdCksIGJhZCk7XG4gICAgICBlbHNlXG4gICAgICAgIGRpc3QgKz0gYWZ0ZXIudGV4dENvbnRlbnQubGVuZ3RoO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGRvbVRleHRCZXR3ZWVuKGNtLCBmcm9tLCB0bywgZnJvbUxpbmUsIHRvTGluZSkge1xuICAgIHZhciB0ZXh0ID0gXCJcIiwgY2xvc2luZyA9IGZhbHNlLCBsaW5lU2VwID0gY20uZG9jLmxpbmVTZXBhcmF0b3IoKTtcbiAgICBmdW5jdGlvbiByZWNvZ25pemVNYXJrZXIoaWQpIHsgcmV0dXJuIGZ1bmN0aW9uKG1hcmtlcikgeyByZXR1cm4gbWFya2VyLmlkID09IGlkOyB9OyB9XG4gICAgZnVuY3Rpb24gd2Fsayhub2RlKSB7XG4gICAgICBpZiAobm9kZS5ub2RlVHlwZSA9PSAxKSB7XG4gICAgICAgIHZhciBjbVRleHQgPSBub2RlLmdldEF0dHJpYnV0ZShcImNtLXRleHRcIik7XG4gICAgICAgIGlmIChjbVRleHQgIT0gbnVsbCkge1xuICAgICAgICAgIGlmIChjbVRleHQgPT0gXCJcIikgY21UZXh0ID0gbm9kZS50ZXh0Q29udGVudC5yZXBsYWNlKC9cXHUyMDBiL2csIFwiXCIpO1xuICAgICAgICAgIHRleHQgKz0gY21UZXh0O1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbWFya2VySUQgPSBub2RlLmdldEF0dHJpYnV0ZShcImNtLW1hcmtlclwiKSwgcmFuZ2U7XG4gICAgICAgIGlmIChtYXJrZXJJRCkge1xuICAgICAgICAgIHZhciBmb3VuZCA9IGNtLmZpbmRNYXJrcyhQb3MoZnJvbUxpbmUsIDApLCBQb3ModG9MaW5lICsgMSwgMCksIHJlY29nbml6ZU1hcmtlcigrbWFya2VySUQpKTtcbiAgICAgICAgICBpZiAoZm91bmQubGVuZ3RoICYmIChyYW5nZSA9IGZvdW5kWzBdLmZpbmQoKSkpXG4gICAgICAgICAgICB0ZXh0ICs9IGdldEJldHdlZW4oY20uZG9jLCByYW5nZS5mcm9tLCByYW5nZS50bykuam9pbihsaW5lU2VwKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5vZGUuZ2V0QXR0cmlidXRlKFwiY29udGVudGVkaXRhYmxlXCIpID09IFwiZmFsc2VcIikgcmV0dXJuO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGUuY2hpbGROb2Rlcy5sZW5ndGg7IGkrKylcbiAgICAgICAgICB3YWxrKG5vZGUuY2hpbGROb2Rlc1tpXSk7XG4gICAgICAgIGlmICgvXihwcmV8ZGl2fHApJC9pLnRlc3Qobm9kZS5ub2RlTmFtZSkpXG4gICAgICAgICAgY2xvc2luZyA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKG5vZGUubm9kZVR5cGUgPT0gMykge1xuICAgICAgICB2YXIgdmFsID0gbm9kZS5ub2RlVmFsdWU7XG4gICAgICAgIGlmICghdmFsKSByZXR1cm47XG4gICAgICAgIGlmIChjbG9zaW5nKSB7XG4gICAgICAgICAgdGV4dCArPSBsaW5lU2VwO1xuICAgICAgICAgIGNsb3NpbmcgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB0ZXh0ICs9IHZhbDtcbiAgICAgIH1cbiAgICB9XG4gICAgZm9yICg7Oykge1xuICAgICAgd2Fsayhmcm9tKTtcbiAgICAgIGlmIChmcm9tID09IHRvKSBicmVhaztcbiAgICAgIGZyb20gPSBmcm9tLm5leHRTaWJsaW5nO1xuICAgIH1cbiAgICByZXR1cm4gdGV4dDtcbiAgfVxuXG4gIENvZGVNaXJyb3IuaW5wdXRTdHlsZXMgPSB7XCJ0ZXh0YXJlYVwiOiBUZXh0YXJlYUlucHV0LCBcImNvbnRlbnRlZGl0YWJsZVwiOiBDb250ZW50RWRpdGFibGVJbnB1dH07XG5cbiAgLy8gU0VMRUNUSU9OIC8gQ1VSU09SXG5cbiAgLy8gU2VsZWN0aW9uIG9iamVjdHMgYXJlIGltbXV0YWJsZS4gQSBuZXcgb25lIGlzIGNyZWF0ZWQgZXZlcnkgdGltZVxuICAvLyB0aGUgc2VsZWN0aW9uIGNoYW5nZXMuIEEgc2VsZWN0aW9uIGlzIG9uZSBvciBtb3JlIG5vbi1vdmVybGFwcGluZ1xuICAvLyAoYW5kIG5vbi10b3VjaGluZykgcmFuZ2VzLCBzb3J0ZWQsIGFuZCBhbiBpbnRlZ2VyIHRoYXQgaW5kaWNhdGVzXG4gIC8vIHdoaWNoIG9uZSBpcyB0aGUgcHJpbWFyeSBzZWxlY3Rpb24gKHRoZSBvbmUgdGhhdCdzIHNjcm9sbGVkIGludG9cbiAgLy8gdmlldywgdGhhdCBnZXRDdXJzb3IgcmV0dXJucywgZXRjKS5cbiAgZnVuY3Rpb24gU2VsZWN0aW9uKHJhbmdlcywgcHJpbUluZGV4KSB7XG4gICAgdGhpcy5yYW5nZXMgPSByYW5nZXM7XG4gICAgdGhpcy5wcmltSW5kZXggPSBwcmltSW5kZXg7XG4gIH1cblxuICBTZWxlY3Rpb24ucHJvdG90eXBlID0ge1xuICAgIHByaW1hcnk6IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy5yYW5nZXNbdGhpcy5wcmltSW5kZXhdOyB9LFxuICAgIGVxdWFsczogZnVuY3Rpb24ob3RoZXIpIHtcbiAgICAgIGlmIChvdGhlciA9PSB0aGlzKSByZXR1cm4gdHJ1ZTtcbiAgICAgIGlmIChvdGhlci5wcmltSW5kZXggIT0gdGhpcy5wcmltSW5kZXggfHwgb3RoZXIucmFuZ2VzLmxlbmd0aCAhPSB0aGlzLnJhbmdlcy5sZW5ndGgpIHJldHVybiBmYWxzZTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5yYW5nZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGhlcmUgPSB0aGlzLnJhbmdlc1tpXSwgdGhlcmUgPSBvdGhlci5yYW5nZXNbaV07XG4gICAgICAgIGlmIChjbXAoaGVyZS5hbmNob3IsIHRoZXJlLmFuY2hvcikgIT0gMCB8fCBjbXAoaGVyZS5oZWFkLCB0aGVyZS5oZWFkKSAhPSAwKSByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9LFxuICAgIGRlZXBDb3B5OiBmdW5jdGlvbigpIHtcbiAgICAgIGZvciAodmFyIG91dCA9IFtdLCBpID0gMDsgaSA8IHRoaXMucmFuZ2VzLmxlbmd0aDsgaSsrKVxuICAgICAgICBvdXRbaV0gPSBuZXcgUmFuZ2UoY29weVBvcyh0aGlzLnJhbmdlc1tpXS5hbmNob3IpLCBjb3B5UG9zKHRoaXMucmFuZ2VzW2ldLmhlYWQpKTtcbiAgICAgIHJldHVybiBuZXcgU2VsZWN0aW9uKG91dCwgdGhpcy5wcmltSW5kZXgpO1xuICAgIH0sXG4gICAgc29tZXRoaW5nU2VsZWN0ZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnJhbmdlcy5sZW5ndGg7IGkrKylcbiAgICAgICAgaWYgKCF0aGlzLnJhbmdlc1tpXS5lbXB0eSgpKSByZXR1cm4gdHJ1ZTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9LFxuICAgIGNvbnRhaW5zOiBmdW5jdGlvbihwb3MsIGVuZCkge1xuICAgICAgaWYgKCFlbmQpIGVuZCA9IHBvcztcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5yYW5nZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHJhbmdlID0gdGhpcy5yYW5nZXNbaV07XG4gICAgICAgIGlmIChjbXAoZW5kLCByYW5nZS5mcm9tKCkpID49IDAgJiYgY21wKHBvcywgcmFuZ2UudG8oKSkgPD0gMClcbiAgICAgICAgICByZXR1cm4gaTtcbiAgICAgIH1cbiAgICAgIHJldHVybiAtMTtcbiAgICB9XG4gIH07XG5cbiAgZnVuY3Rpb24gUmFuZ2UoYW5jaG9yLCBoZWFkKSB7XG4gICAgdGhpcy5hbmNob3IgPSBhbmNob3I7IHRoaXMuaGVhZCA9IGhlYWQ7XG4gIH1cblxuICBSYW5nZS5wcm90b3R5cGUgPSB7XG4gICAgZnJvbTogZnVuY3Rpb24oKSB7IHJldHVybiBtaW5Qb3ModGhpcy5hbmNob3IsIHRoaXMuaGVhZCk7IH0sXG4gICAgdG86IGZ1bmN0aW9uKCkgeyByZXR1cm4gbWF4UG9zKHRoaXMuYW5jaG9yLCB0aGlzLmhlYWQpOyB9LFxuICAgIGVtcHR5OiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLmhlYWQubGluZSA9PSB0aGlzLmFuY2hvci5saW5lICYmIHRoaXMuaGVhZC5jaCA9PSB0aGlzLmFuY2hvci5jaDtcbiAgICB9XG4gIH07XG5cbiAgLy8gVGFrZSBhbiB1bnNvcnRlZCwgcG90ZW50aWFsbHkgb3ZlcmxhcHBpbmcgc2V0IG9mIHJhbmdlcywgYW5kXG4gIC8vIGJ1aWxkIGEgc2VsZWN0aW9uIG91dCBvZiBpdC4gJ0NvbnN1bWVzJyByYW5nZXMgYXJyYXkgKG1vZGlmeWluZ1xuICAvLyBpdCkuXG4gIGZ1bmN0aW9uIG5vcm1hbGl6ZVNlbGVjdGlvbihyYW5nZXMsIHByaW1JbmRleCkge1xuICAgIHZhciBwcmltID0gcmFuZ2VzW3ByaW1JbmRleF07XG4gICAgcmFuZ2VzLnNvcnQoZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gY21wKGEuZnJvbSgpLCBiLmZyb20oKSk7IH0pO1xuICAgIHByaW1JbmRleCA9IGluZGV4T2YocmFuZ2VzLCBwcmltKTtcbiAgICBmb3IgKHZhciBpID0gMTsgaSA8IHJhbmdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGN1ciA9IHJhbmdlc1tpXSwgcHJldiA9IHJhbmdlc1tpIC0gMV07XG4gICAgICBpZiAoY21wKHByZXYudG8oKSwgY3VyLmZyb20oKSkgPj0gMCkge1xuICAgICAgICB2YXIgZnJvbSA9IG1pblBvcyhwcmV2LmZyb20oKSwgY3VyLmZyb20oKSksIHRvID0gbWF4UG9zKHByZXYudG8oKSwgY3VyLnRvKCkpO1xuICAgICAgICB2YXIgaW52ID0gcHJldi5lbXB0eSgpID8gY3VyLmZyb20oKSA9PSBjdXIuaGVhZCA6IHByZXYuZnJvbSgpID09IHByZXYuaGVhZDtcbiAgICAgICAgaWYgKGkgPD0gcHJpbUluZGV4KSAtLXByaW1JbmRleDtcbiAgICAgICAgcmFuZ2VzLnNwbGljZSgtLWksIDIsIG5ldyBSYW5nZShpbnYgPyB0byA6IGZyb20sIGludiA/IGZyb20gOiB0bykpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbmV3IFNlbGVjdGlvbihyYW5nZXMsIHByaW1JbmRleCk7XG4gIH1cblxuICBmdW5jdGlvbiBzaW1wbGVTZWxlY3Rpb24oYW5jaG9yLCBoZWFkKSB7XG4gICAgcmV0dXJuIG5ldyBTZWxlY3Rpb24oW25ldyBSYW5nZShhbmNob3IsIGhlYWQgfHwgYW5jaG9yKV0sIDApO1xuICB9XG5cbiAgLy8gTW9zdCBvZiB0aGUgZXh0ZXJuYWwgQVBJIGNsaXBzIGdpdmVuIHBvc2l0aW9ucyB0byBtYWtlIHN1cmUgdGhleVxuICAvLyBhY3R1YWxseSBleGlzdCB3aXRoaW4gdGhlIGRvY3VtZW50LlxuICBmdW5jdGlvbiBjbGlwTGluZShkb2MsIG4pIHtyZXR1cm4gTWF0aC5tYXgoZG9jLmZpcnN0LCBNYXRoLm1pbihuLCBkb2MuZmlyc3QgKyBkb2Muc2l6ZSAtIDEpKTt9XG4gIGZ1bmN0aW9uIGNsaXBQb3MoZG9jLCBwb3MpIHtcbiAgICBpZiAocG9zLmxpbmUgPCBkb2MuZmlyc3QpIHJldHVybiBQb3MoZG9jLmZpcnN0LCAwKTtcbiAgICB2YXIgbGFzdCA9IGRvYy5maXJzdCArIGRvYy5zaXplIC0gMTtcbiAgICBpZiAocG9zLmxpbmUgPiBsYXN0KSByZXR1cm4gUG9zKGxhc3QsIGdldExpbmUoZG9jLCBsYXN0KS50ZXh0Lmxlbmd0aCk7XG4gICAgcmV0dXJuIGNsaXBUb0xlbihwb3MsIGdldExpbmUoZG9jLCBwb3MubGluZSkudGV4dC5sZW5ndGgpO1xuICB9XG4gIGZ1bmN0aW9uIGNsaXBUb0xlbihwb3MsIGxpbmVsZW4pIHtcbiAgICB2YXIgY2ggPSBwb3MuY2g7XG4gICAgaWYgKGNoID09IG51bGwgfHwgY2ggPiBsaW5lbGVuKSByZXR1cm4gUG9zKHBvcy5saW5lLCBsaW5lbGVuKTtcbiAgICBlbHNlIGlmIChjaCA8IDApIHJldHVybiBQb3MocG9zLmxpbmUsIDApO1xuICAgIGVsc2UgcmV0dXJuIHBvcztcbiAgfVxuICBmdW5jdGlvbiBpc0xpbmUoZG9jLCBsKSB7cmV0dXJuIGwgPj0gZG9jLmZpcnN0ICYmIGwgPCBkb2MuZmlyc3QgKyBkb2Muc2l6ZTt9XG4gIGZ1bmN0aW9uIGNsaXBQb3NBcnJheShkb2MsIGFycmF5KSB7XG4gICAgZm9yICh2YXIgb3V0ID0gW10sIGkgPSAwOyBpIDwgYXJyYXkubGVuZ3RoOyBpKyspIG91dFtpXSA9IGNsaXBQb3MoZG9jLCBhcnJheVtpXSk7XG4gICAgcmV0dXJuIG91dDtcbiAgfVxuXG4gIC8vIFNFTEVDVElPTiBVUERBVEVTXG5cbiAgLy8gVGhlICdzY3JvbGwnIHBhcmFtZXRlciBnaXZlbiB0byBtYW55IG9mIHRoZXNlIGluZGljYXRlZCB3aGV0aGVyXG4gIC8vIHRoZSBuZXcgY3Vyc29yIHBvc2l0aW9uIHNob3VsZCBiZSBzY3JvbGxlZCBpbnRvIHZpZXcgYWZ0ZXJcbiAgLy8gbW9kaWZ5aW5nIHRoZSBzZWxlY3Rpb24uXG5cbiAgLy8gSWYgc2hpZnQgaXMgaGVsZCBvciB0aGUgZXh0ZW5kIGZsYWcgaXMgc2V0LCBleHRlbmRzIGEgcmFuZ2UgdG9cbiAgLy8gaW5jbHVkZSBhIGdpdmVuIHBvc2l0aW9uIChhbmQgb3B0aW9uYWxseSBhIHNlY29uZCBwb3NpdGlvbikuXG4gIC8vIE90aGVyd2lzZSwgc2ltcGx5IHJldHVybnMgdGhlIHJhbmdlIGJldHdlZW4gdGhlIGdpdmVuIHBvc2l0aW9ucy5cbiAgLy8gVXNlZCBmb3IgY3Vyc29yIG1vdGlvbiBhbmQgc3VjaC5cbiAgZnVuY3Rpb24gZXh0ZW5kUmFuZ2UoZG9jLCByYW5nZSwgaGVhZCwgb3RoZXIpIHtcbiAgICBpZiAoZG9jLmNtICYmIGRvYy5jbS5kaXNwbGF5LnNoaWZ0IHx8IGRvYy5leHRlbmQpIHtcbiAgICAgIHZhciBhbmNob3IgPSByYW5nZS5hbmNob3I7XG4gICAgICBpZiAob3RoZXIpIHtcbiAgICAgICAgdmFyIHBvc0JlZm9yZSA9IGNtcChoZWFkLCBhbmNob3IpIDwgMDtcbiAgICAgICAgaWYgKHBvc0JlZm9yZSAhPSAoY21wKG90aGVyLCBhbmNob3IpIDwgMCkpIHtcbiAgICAgICAgICBhbmNob3IgPSBoZWFkO1xuICAgICAgICAgIGhlYWQgPSBvdGhlcjtcbiAgICAgICAgfSBlbHNlIGlmIChwb3NCZWZvcmUgIT0gKGNtcChoZWFkLCBvdGhlcikgPCAwKSkge1xuICAgICAgICAgIGhlYWQgPSBvdGhlcjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIG5ldyBSYW5nZShhbmNob3IsIGhlYWQpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbmV3IFJhbmdlKG90aGVyIHx8IGhlYWQsIGhlYWQpO1xuICAgIH1cbiAgfVxuXG4gIC8vIEV4dGVuZCB0aGUgcHJpbWFyeSBzZWxlY3Rpb24gcmFuZ2UsIGRpc2NhcmQgdGhlIHJlc3QuXG4gIGZ1bmN0aW9uIGV4dGVuZFNlbGVjdGlvbihkb2MsIGhlYWQsIG90aGVyLCBvcHRpb25zKSB7XG4gICAgc2V0U2VsZWN0aW9uKGRvYywgbmV3IFNlbGVjdGlvbihbZXh0ZW5kUmFuZ2UoZG9jLCBkb2Muc2VsLnByaW1hcnkoKSwgaGVhZCwgb3RoZXIpXSwgMCksIG9wdGlvbnMpO1xuICB9XG5cbiAgLy8gRXh0ZW5kIGFsbCBzZWxlY3Rpb25zIChwb3MgaXMgYW4gYXJyYXkgb2Ygc2VsZWN0aW9ucyB3aXRoIGxlbmd0aFxuICAvLyBlcXVhbCB0aGUgbnVtYmVyIG9mIHNlbGVjdGlvbnMpXG4gIGZ1bmN0aW9uIGV4dGVuZFNlbGVjdGlvbnMoZG9jLCBoZWFkcywgb3B0aW9ucykge1xuICAgIGZvciAodmFyIG91dCA9IFtdLCBpID0gMDsgaSA8IGRvYy5zZWwucmFuZ2VzLmxlbmd0aDsgaSsrKVxuICAgICAgb3V0W2ldID0gZXh0ZW5kUmFuZ2UoZG9jLCBkb2Muc2VsLnJhbmdlc1tpXSwgaGVhZHNbaV0sIG51bGwpO1xuICAgIHZhciBuZXdTZWwgPSBub3JtYWxpemVTZWxlY3Rpb24ob3V0LCBkb2Muc2VsLnByaW1JbmRleCk7XG4gICAgc2V0U2VsZWN0aW9uKGRvYywgbmV3U2VsLCBvcHRpb25zKTtcbiAgfVxuXG4gIC8vIFVwZGF0ZXMgYSBzaW5nbGUgcmFuZ2UgaW4gdGhlIHNlbGVjdGlvbi5cbiAgZnVuY3Rpb24gcmVwbGFjZU9uZVNlbGVjdGlvbihkb2MsIGksIHJhbmdlLCBvcHRpb25zKSB7XG4gICAgdmFyIHJhbmdlcyA9IGRvYy5zZWwucmFuZ2VzLnNsaWNlKDApO1xuICAgIHJhbmdlc1tpXSA9IHJhbmdlO1xuICAgIHNldFNlbGVjdGlvbihkb2MsIG5vcm1hbGl6ZVNlbGVjdGlvbihyYW5nZXMsIGRvYy5zZWwucHJpbUluZGV4KSwgb3B0aW9ucyk7XG4gIH1cblxuICAvLyBSZXNldCB0aGUgc2VsZWN0aW9uIHRvIGEgc2luZ2xlIHJhbmdlLlxuICBmdW5jdGlvbiBzZXRTaW1wbGVTZWxlY3Rpb24oZG9jLCBhbmNob3IsIGhlYWQsIG9wdGlvbnMpIHtcbiAgICBzZXRTZWxlY3Rpb24oZG9jLCBzaW1wbGVTZWxlY3Rpb24oYW5jaG9yLCBoZWFkKSwgb3B0aW9ucyk7XG4gIH1cblxuICAvLyBHaXZlIGJlZm9yZVNlbGVjdGlvbkNoYW5nZSBoYW5kbGVycyBhIGNoYW5nZSB0byBpbmZsdWVuY2UgYVxuICAvLyBzZWxlY3Rpb24gdXBkYXRlLlxuICBmdW5jdGlvbiBmaWx0ZXJTZWxlY3Rpb25DaGFuZ2UoZG9jLCBzZWwpIHtcbiAgICB2YXIgb2JqID0ge1xuICAgICAgcmFuZ2VzOiBzZWwucmFuZ2VzLFxuICAgICAgdXBkYXRlOiBmdW5jdGlvbihyYW5nZXMpIHtcbiAgICAgICAgdGhpcy5yYW5nZXMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByYW5nZXMubGVuZ3RoOyBpKyspXG4gICAgICAgICAgdGhpcy5yYW5nZXNbaV0gPSBuZXcgUmFuZ2UoY2xpcFBvcyhkb2MsIHJhbmdlc1tpXS5hbmNob3IpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsaXBQb3MoZG9jLCByYW5nZXNbaV0uaGVhZCkpO1xuICAgICAgfVxuICAgIH07XG4gICAgc2lnbmFsKGRvYywgXCJiZWZvcmVTZWxlY3Rpb25DaGFuZ2VcIiwgZG9jLCBvYmopO1xuICAgIGlmIChkb2MuY20pIHNpZ25hbChkb2MuY20sIFwiYmVmb3JlU2VsZWN0aW9uQ2hhbmdlXCIsIGRvYy5jbSwgb2JqKTtcbiAgICBpZiAob2JqLnJhbmdlcyAhPSBzZWwucmFuZ2VzKSByZXR1cm4gbm9ybWFsaXplU2VsZWN0aW9uKG9iai5yYW5nZXMsIG9iai5yYW5nZXMubGVuZ3RoIC0gMSk7XG4gICAgZWxzZSByZXR1cm4gc2VsO1xuICB9XG5cbiAgZnVuY3Rpb24gc2V0U2VsZWN0aW9uUmVwbGFjZUhpc3RvcnkoZG9jLCBzZWwsIG9wdGlvbnMpIHtcbiAgICB2YXIgZG9uZSA9IGRvYy5oaXN0b3J5LmRvbmUsIGxhc3QgPSBsc3QoZG9uZSk7XG4gICAgaWYgKGxhc3QgJiYgbGFzdC5yYW5nZXMpIHtcbiAgICAgIGRvbmVbZG9uZS5sZW5ndGggLSAxXSA9IHNlbDtcbiAgICAgIHNldFNlbGVjdGlvbk5vVW5kbyhkb2MsIHNlbCwgb3B0aW9ucyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNldFNlbGVjdGlvbihkb2MsIHNlbCwgb3B0aW9ucyk7XG4gICAgfVxuICB9XG5cbiAgLy8gU2V0IGEgbmV3IHNlbGVjdGlvbi5cbiAgZnVuY3Rpb24gc2V0U2VsZWN0aW9uKGRvYywgc2VsLCBvcHRpb25zKSB7XG4gICAgc2V0U2VsZWN0aW9uTm9VbmRvKGRvYywgc2VsLCBvcHRpb25zKTtcbiAgICBhZGRTZWxlY3Rpb25Ub0hpc3RvcnkoZG9jLCBkb2Muc2VsLCBkb2MuY20gPyBkb2MuY20uY3VyT3AuaWQgOiBOYU4sIG9wdGlvbnMpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2V0U2VsZWN0aW9uTm9VbmRvKGRvYywgc2VsLCBvcHRpb25zKSB7XG4gICAgaWYgKGhhc0hhbmRsZXIoZG9jLCBcImJlZm9yZVNlbGVjdGlvbkNoYW5nZVwiKSB8fCBkb2MuY20gJiYgaGFzSGFuZGxlcihkb2MuY20sIFwiYmVmb3JlU2VsZWN0aW9uQ2hhbmdlXCIpKVxuICAgICAgc2VsID0gZmlsdGVyU2VsZWN0aW9uQ2hhbmdlKGRvYywgc2VsKTtcblxuICAgIHZhciBiaWFzID0gb3B0aW9ucyAmJiBvcHRpb25zLmJpYXMgfHxcbiAgICAgIChjbXAoc2VsLnByaW1hcnkoKS5oZWFkLCBkb2Muc2VsLnByaW1hcnkoKS5oZWFkKSA8IDAgPyAtMSA6IDEpO1xuICAgIHNldFNlbGVjdGlvbklubmVyKGRvYywgc2tpcEF0b21pY0luU2VsZWN0aW9uKGRvYywgc2VsLCBiaWFzLCB0cnVlKSk7XG5cbiAgICBpZiAoIShvcHRpb25zICYmIG9wdGlvbnMuc2Nyb2xsID09PSBmYWxzZSkgJiYgZG9jLmNtKVxuICAgICAgZW5zdXJlQ3Vyc29yVmlzaWJsZShkb2MuY20pO1xuICB9XG5cbiAgZnVuY3Rpb24gc2V0U2VsZWN0aW9uSW5uZXIoZG9jLCBzZWwpIHtcbiAgICBpZiAoc2VsLmVxdWFscyhkb2Muc2VsKSkgcmV0dXJuO1xuXG4gICAgZG9jLnNlbCA9IHNlbDtcblxuICAgIGlmIChkb2MuY20pIHtcbiAgICAgIGRvYy5jbS5jdXJPcC51cGRhdGVJbnB1dCA9IGRvYy5jbS5jdXJPcC5zZWxlY3Rpb25DaGFuZ2VkID0gdHJ1ZTtcbiAgICAgIHNpZ25hbEN1cnNvckFjdGl2aXR5KGRvYy5jbSk7XG4gICAgfVxuICAgIHNpZ25hbExhdGVyKGRvYywgXCJjdXJzb3JBY3Rpdml0eVwiLCBkb2MpO1xuICB9XG5cbiAgLy8gVmVyaWZ5IHRoYXQgdGhlIHNlbGVjdGlvbiBkb2VzIG5vdCBwYXJ0aWFsbHkgc2VsZWN0IGFueSBhdG9taWNcbiAgLy8gbWFya2VkIHJhbmdlcy5cbiAgZnVuY3Rpb24gcmVDaGVja1NlbGVjdGlvbihkb2MpIHtcbiAgICBzZXRTZWxlY3Rpb25Jbm5lcihkb2MsIHNraXBBdG9taWNJblNlbGVjdGlvbihkb2MsIGRvYy5zZWwsIG51bGwsIGZhbHNlKSwgc2VsX2RvbnRTY3JvbGwpO1xuICB9XG5cbiAgLy8gUmV0dXJuIGEgc2VsZWN0aW9uIHRoYXQgZG9lcyBub3QgcGFydGlhbGx5IHNlbGVjdCBhbnkgYXRvbWljXG4gIC8vIHJhbmdlcy5cbiAgZnVuY3Rpb24gc2tpcEF0b21pY0luU2VsZWN0aW9uKGRvYywgc2VsLCBiaWFzLCBtYXlDbGVhcikge1xuICAgIHZhciBvdXQ7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzZWwucmFuZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgcmFuZ2UgPSBzZWwucmFuZ2VzW2ldO1xuICAgICAgdmFyIG5ld0FuY2hvciA9IHNraXBBdG9taWMoZG9jLCByYW5nZS5hbmNob3IsIGJpYXMsIG1heUNsZWFyKTtcbiAgICAgIHZhciBuZXdIZWFkID0gc2tpcEF0b21pYyhkb2MsIHJhbmdlLmhlYWQsIGJpYXMsIG1heUNsZWFyKTtcbiAgICAgIGlmIChvdXQgfHwgbmV3QW5jaG9yICE9IHJhbmdlLmFuY2hvciB8fCBuZXdIZWFkICE9IHJhbmdlLmhlYWQpIHtcbiAgICAgICAgaWYgKCFvdXQpIG91dCA9IHNlbC5yYW5nZXMuc2xpY2UoMCwgaSk7XG4gICAgICAgIG91dFtpXSA9IG5ldyBSYW5nZShuZXdBbmNob3IsIG5ld0hlYWQpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb3V0ID8gbm9ybWFsaXplU2VsZWN0aW9uKG91dCwgc2VsLnByaW1JbmRleCkgOiBzZWw7XG4gIH1cblxuICAvLyBFbnN1cmUgYSBnaXZlbiBwb3NpdGlvbiBpcyBub3QgaW5zaWRlIGFuIGF0b21pYyByYW5nZS5cbiAgZnVuY3Rpb24gc2tpcEF0b21pYyhkb2MsIHBvcywgYmlhcywgbWF5Q2xlYXIpIHtcbiAgICB2YXIgZmxpcHBlZCA9IGZhbHNlLCBjdXJQb3MgPSBwb3M7XG4gICAgdmFyIGRpciA9IGJpYXMgfHwgMTtcbiAgICBkb2MuY2FudEVkaXQgPSBmYWxzZTtcbiAgICBzZWFyY2g6IGZvciAoOzspIHtcbiAgICAgIHZhciBsaW5lID0gZ2V0TGluZShkb2MsIGN1clBvcy5saW5lKTtcbiAgICAgIGlmIChsaW5lLm1hcmtlZFNwYW5zKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGluZS5tYXJrZWRTcGFucy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgIHZhciBzcCA9IGxpbmUubWFya2VkU3BhbnNbaV0sIG0gPSBzcC5tYXJrZXI7XG4gICAgICAgICAgaWYgKChzcC5mcm9tID09IG51bGwgfHwgKG0uaW5jbHVzaXZlTGVmdCA/IHNwLmZyb20gPD0gY3VyUG9zLmNoIDogc3AuZnJvbSA8IGN1clBvcy5jaCkpICYmXG4gICAgICAgICAgICAgIChzcC50byA9PSBudWxsIHx8IChtLmluY2x1c2l2ZVJpZ2h0ID8gc3AudG8gPj0gY3VyUG9zLmNoIDogc3AudG8gPiBjdXJQb3MuY2gpKSkge1xuICAgICAgICAgICAgaWYgKG1heUNsZWFyKSB7XG4gICAgICAgICAgICAgIHNpZ25hbChtLCBcImJlZm9yZUN1cnNvckVudGVyXCIpO1xuICAgICAgICAgICAgICBpZiAobS5leHBsaWNpdGx5Q2xlYXJlZCkge1xuICAgICAgICAgICAgICAgIGlmICghbGluZS5tYXJrZWRTcGFucykgYnJlYWs7XG4gICAgICAgICAgICAgICAgZWxzZSB7LS1pOyBjb250aW51ZTt9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghbS5hdG9taWMpIGNvbnRpbnVlO1xuICAgICAgICAgICAgdmFyIG5ld1BvcyA9IG0uZmluZChkaXIgPCAwID8gLTEgOiAxKTtcbiAgICAgICAgICAgIGlmIChjbXAobmV3UG9zLCBjdXJQb3MpID09IDApIHtcbiAgICAgICAgICAgICAgbmV3UG9zLmNoICs9IGRpcjtcbiAgICAgICAgICAgICAgaWYgKG5ld1Bvcy5jaCA8IDApIHtcbiAgICAgICAgICAgICAgICBpZiAobmV3UG9zLmxpbmUgPiBkb2MuZmlyc3QpIG5ld1BvcyA9IGNsaXBQb3MoZG9jLCBQb3MobmV3UG9zLmxpbmUgLSAxKSk7XG4gICAgICAgICAgICAgICAgZWxzZSBuZXdQb3MgPSBudWxsO1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKG5ld1Bvcy5jaCA+IGxpbmUudGV4dC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBpZiAobmV3UG9zLmxpbmUgPCBkb2MuZmlyc3QgKyBkb2Muc2l6ZSAtIDEpIG5ld1BvcyA9IFBvcyhuZXdQb3MubGluZSArIDEsIDApO1xuICAgICAgICAgICAgICAgIGVsc2UgbmV3UG9zID0gbnVsbDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoIW5ld1Bvcykge1xuICAgICAgICAgICAgICAgIGlmIChmbGlwcGVkKSB7XG4gICAgICAgICAgICAgICAgICAvLyBEcml2ZW4gaW4gYSBjb3JuZXIgLS0gbm8gdmFsaWQgY3Vyc29yIHBvc2l0aW9uIGZvdW5kIGF0IGFsbFxuICAgICAgICAgICAgICAgICAgLy8gLS0gdHJ5IGFnYWluICp3aXRoKiBjbGVhcmluZywgaWYgd2UgZGlkbid0IGFscmVhZHlcbiAgICAgICAgICAgICAgICAgIGlmICghbWF5Q2xlYXIpIHJldHVybiBza2lwQXRvbWljKGRvYywgcG9zLCBiaWFzLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgIC8vIE90aGVyd2lzZSwgdHVybiBvZmYgZWRpdGluZyB1bnRpbCBmdXJ0aGVyIG5vdGljZSwgYW5kIHJldHVybiB0aGUgc3RhcnQgb2YgdGhlIGRvY1xuICAgICAgICAgICAgICAgICAgZG9jLmNhbnRFZGl0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBQb3MoZG9jLmZpcnN0LCAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZmxpcHBlZCA9IHRydWU7IG5ld1BvcyA9IHBvczsgZGlyID0gLWRpcjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY3VyUG9zID0gbmV3UG9zO1xuICAgICAgICAgICAgY29udGludWUgc2VhcmNoO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGN1clBvcztcbiAgICB9XG4gIH1cblxuICAvLyBTRUxFQ1RJT04gRFJBV0lOR1xuXG4gIGZ1bmN0aW9uIHVwZGF0ZVNlbGVjdGlvbihjbSkge1xuICAgIGNtLmRpc3BsYXkuaW5wdXQuc2hvd1NlbGVjdGlvbihjbS5kaXNwbGF5LmlucHV0LnByZXBhcmVTZWxlY3Rpb24oKSk7XG4gIH1cblxuICBmdW5jdGlvbiBwcmVwYXJlU2VsZWN0aW9uKGNtLCBwcmltYXJ5KSB7XG4gICAgdmFyIGRvYyA9IGNtLmRvYywgcmVzdWx0ID0ge307XG4gICAgdmFyIGN1ckZyYWdtZW50ID0gcmVzdWx0LmN1cnNvcnMgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgdmFyIHNlbEZyYWdtZW50ID0gcmVzdWx0LnNlbGVjdGlvbiA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZG9jLnNlbC5yYW5nZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChwcmltYXJ5ID09PSBmYWxzZSAmJiBpID09IGRvYy5zZWwucHJpbUluZGV4KSBjb250aW51ZTtcbiAgICAgIHZhciByYW5nZSA9IGRvYy5zZWwucmFuZ2VzW2ldO1xuICAgICAgdmFyIGNvbGxhcHNlZCA9IHJhbmdlLmVtcHR5KCk7XG4gICAgICBpZiAoY29sbGFwc2VkIHx8IGNtLm9wdGlvbnMuc2hvd0N1cnNvcldoZW5TZWxlY3RpbmcpXG4gICAgICAgIGRyYXdTZWxlY3Rpb25DdXJzb3IoY20sIHJhbmdlLmhlYWQsIGN1ckZyYWdtZW50KTtcbiAgICAgIGlmICghY29sbGFwc2VkKVxuICAgICAgICBkcmF3U2VsZWN0aW9uUmFuZ2UoY20sIHJhbmdlLCBzZWxGcmFnbWVudCk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvLyBEcmF3cyBhIGN1cnNvciBmb3IgdGhlIGdpdmVuIHJhbmdlXG4gIGZ1bmN0aW9uIGRyYXdTZWxlY3Rpb25DdXJzb3IoY20sIGhlYWQsIG91dHB1dCkge1xuICAgIHZhciBwb3MgPSBjdXJzb3JDb29yZHMoY20sIGhlYWQsIFwiZGl2XCIsIG51bGwsIG51bGwsICFjbS5vcHRpb25zLnNpbmdsZUN1cnNvckhlaWdodFBlckxpbmUpO1xuXG4gICAgdmFyIGN1cnNvciA9IG91dHB1dC5hcHBlbmRDaGlsZChlbHQoXCJkaXZcIiwgXCJcXHUwMGEwXCIsIFwiQ29kZU1pcnJvci1jdXJzb3JcIikpO1xuICAgIGN1cnNvci5zdHlsZS5sZWZ0ID0gcG9zLmxlZnQgKyBcInB4XCI7XG4gICAgY3Vyc29yLnN0eWxlLnRvcCA9IHBvcy50b3AgKyBcInB4XCI7XG4gICAgY3Vyc29yLnN0eWxlLmhlaWdodCA9IE1hdGgubWF4KDAsIHBvcy5ib3R0b20gLSBwb3MudG9wKSAqIGNtLm9wdGlvbnMuY3Vyc29ySGVpZ2h0ICsgXCJweFwiO1xuXG4gICAgaWYgKHBvcy5vdGhlcikge1xuICAgICAgLy8gU2Vjb25kYXJ5IGN1cnNvciwgc2hvd24gd2hlbiBvbiBhICdqdW1wJyBpbiBiaS1kaXJlY3Rpb25hbCB0ZXh0XG4gICAgICB2YXIgb3RoZXJDdXJzb3IgPSBvdXRwdXQuYXBwZW5kQ2hpbGQoZWx0KFwiZGl2XCIsIFwiXFx1MDBhMFwiLCBcIkNvZGVNaXJyb3ItY3Vyc29yIENvZGVNaXJyb3Itc2Vjb25kYXJ5Y3Vyc29yXCIpKTtcbiAgICAgIG90aGVyQ3Vyc29yLnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xuICAgICAgb3RoZXJDdXJzb3Iuc3R5bGUubGVmdCA9IHBvcy5vdGhlci5sZWZ0ICsgXCJweFwiO1xuICAgICAgb3RoZXJDdXJzb3Iuc3R5bGUudG9wID0gcG9zLm90aGVyLnRvcCArIFwicHhcIjtcbiAgICAgIG90aGVyQ3Vyc29yLnN0eWxlLmhlaWdodCA9IChwb3Mub3RoZXIuYm90dG9tIC0gcG9zLm90aGVyLnRvcCkgKiAuODUgKyBcInB4XCI7XG4gICAgfVxuICB9XG5cbiAgLy8gRHJhd3MgdGhlIGdpdmVuIHJhbmdlIGFzIGEgaGlnaGxpZ2h0ZWQgc2VsZWN0aW9uXG4gIGZ1bmN0aW9uIGRyYXdTZWxlY3Rpb25SYW5nZShjbSwgcmFuZ2UsIG91dHB1dCkge1xuICAgIHZhciBkaXNwbGF5ID0gY20uZGlzcGxheSwgZG9jID0gY20uZG9jO1xuICAgIHZhciBmcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcbiAgICB2YXIgcGFkZGluZyA9IHBhZGRpbmdIKGNtLmRpc3BsYXkpLCBsZWZ0U2lkZSA9IHBhZGRpbmcubGVmdDtcbiAgICB2YXIgcmlnaHRTaWRlID0gTWF0aC5tYXgoZGlzcGxheS5zaXplcldpZHRoLCBkaXNwbGF5V2lkdGgoY20pIC0gZGlzcGxheS5zaXplci5vZmZzZXRMZWZ0KSAtIHBhZGRpbmcucmlnaHQ7XG5cbiAgICBmdW5jdGlvbiBhZGQobGVmdCwgdG9wLCB3aWR0aCwgYm90dG9tKSB7XG4gICAgICBpZiAodG9wIDwgMCkgdG9wID0gMDtcbiAgICAgIHRvcCA9IE1hdGgucm91bmQodG9wKTtcbiAgICAgIGJvdHRvbSA9IE1hdGgucm91bmQoYm90dG9tKTtcbiAgICAgIGZyYWdtZW50LmFwcGVuZENoaWxkKGVsdChcImRpdlwiLCBudWxsLCBcIkNvZGVNaXJyb3Itc2VsZWN0ZWRcIiwgXCJwb3NpdGlvbjogYWJzb2x1dGU7IGxlZnQ6IFwiICsgbGVmdCArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJweDsgdG9wOiBcIiArIHRvcCArIFwicHg7IHdpZHRoOiBcIiArICh3aWR0aCA9PSBudWxsID8gcmlnaHRTaWRlIC0gbGVmdCA6IHdpZHRoKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJweDsgaGVpZ2h0OiBcIiArIChib3R0b20gLSB0b3ApICsgXCJweFwiKSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZHJhd0ZvckxpbmUobGluZSwgZnJvbUFyZywgdG9BcmcpIHtcbiAgICAgIHZhciBsaW5lT2JqID0gZ2V0TGluZShkb2MsIGxpbmUpO1xuICAgICAgdmFyIGxpbmVMZW4gPSBsaW5lT2JqLnRleHQubGVuZ3RoO1xuICAgICAgdmFyIHN0YXJ0LCBlbmQ7XG4gICAgICBmdW5jdGlvbiBjb29yZHMoY2gsIGJpYXMpIHtcbiAgICAgICAgcmV0dXJuIGNoYXJDb29yZHMoY20sIFBvcyhsaW5lLCBjaCksIFwiZGl2XCIsIGxpbmVPYmosIGJpYXMpO1xuICAgICAgfVxuXG4gICAgICBpdGVyYXRlQmlkaVNlY3Rpb25zKGdldE9yZGVyKGxpbmVPYmopLCBmcm9tQXJnIHx8IDAsIHRvQXJnID09IG51bGwgPyBsaW5lTGVuIDogdG9BcmcsIGZ1bmN0aW9uKGZyb20sIHRvLCBkaXIpIHtcbiAgICAgICAgdmFyIGxlZnRQb3MgPSBjb29yZHMoZnJvbSwgXCJsZWZ0XCIpLCByaWdodFBvcywgbGVmdCwgcmlnaHQ7XG4gICAgICAgIGlmIChmcm9tID09IHRvKSB7XG4gICAgICAgICAgcmlnaHRQb3MgPSBsZWZ0UG9zO1xuICAgICAgICAgIGxlZnQgPSByaWdodCA9IGxlZnRQb3MubGVmdDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByaWdodFBvcyA9IGNvb3Jkcyh0byAtIDEsIFwicmlnaHRcIik7XG4gICAgICAgICAgaWYgKGRpciA9PSBcInJ0bFwiKSB7IHZhciB0bXAgPSBsZWZ0UG9zOyBsZWZ0UG9zID0gcmlnaHRQb3M7IHJpZ2h0UG9zID0gdG1wOyB9XG4gICAgICAgICAgbGVmdCA9IGxlZnRQb3MubGVmdDtcbiAgICAgICAgICByaWdodCA9IHJpZ2h0UG9zLnJpZ2h0O1xuICAgICAgICB9XG4gICAgICAgIGlmIChmcm9tQXJnID09IG51bGwgJiYgZnJvbSA9PSAwKSBsZWZ0ID0gbGVmdFNpZGU7XG4gICAgICAgIGlmIChyaWdodFBvcy50b3AgLSBsZWZ0UG9zLnRvcCA+IDMpIHsgLy8gRGlmZmVyZW50IGxpbmVzLCBkcmF3IHRvcCBwYXJ0XG4gICAgICAgICAgYWRkKGxlZnQsIGxlZnRQb3MudG9wLCBudWxsLCBsZWZ0UG9zLmJvdHRvbSk7XG4gICAgICAgICAgbGVmdCA9IGxlZnRTaWRlO1xuICAgICAgICAgIGlmIChsZWZ0UG9zLmJvdHRvbSA8IHJpZ2h0UG9zLnRvcCkgYWRkKGxlZnQsIGxlZnRQb3MuYm90dG9tLCBudWxsLCByaWdodFBvcy50b3ApO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0b0FyZyA9PSBudWxsICYmIHRvID09IGxpbmVMZW4pIHJpZ2h0ID0gcmlnaHRTaWRlO1xuICAgICAgICBpZiAoIXN0YXJ0IHx8IGxlZnRQb3MudG9wIDwgc3RhcnQudG9wIHx8IGxlZnRQb3MudG9wID09IHN0YXJ0LnRvcCAmJiBsZWZ0UG9zLmxlZnQgPCBzdGFydC5sZWZ0KVxuICAgICAgICAgIHN0YXJ0ID0gbGVmdFBvcztcbiAgICAgICAgaWYgKCFlbmQgfHwgcmlnaHRQb3MuYm90dG9tID4gZW5kLmJvdHRvbSB8fCByaWdodFBvcy5ib3R0b20gPT0gZW5kLmJvdHRvbSAmJiByaWdodFBvcy5yaWdodCA+IGVuZC5yaWdodClcbiAgICAgICAgICBlbmQgPSByaWdodFBvcztcbiAgICAgICAgaWYgKGxlZnQgPCBsZWZ0U2lkZSArIDEpIGxlZnQgPSBsZWZ0U2lkZTtcbiAgICAgICAgYWRkKGxlZnQsIHJpZ2h0UG9zLnRvcCwgcmlnaHQgLSBsZWZ0LCByaWdodFBvcy5ib3R0b20pO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4ge3N0YXJ0OiBzdGFydCwgZW5kOiBlbmR9O1xuICAgIH1cblxuICAgIHZhciBzRnJvbSA9IHJhbmdlLmZyb20oKSwgc1RvID0gcmFuZ2UudG8oKTtcbiAgICBpZiAoc0Zyb20ubGluZSA9PSBzVG8ubGluZSkge1xuICAgICAgZHJhd0ZvckxpbmUoc0Zyb20ubGluZSwgc0Zyb20uY2gsIHNUby5jaCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBmcm9tTGluZSA9IGdldExpbmUoZG9jLCBzRnJvbS5saW5lKSwgdG9MaW5lID0gZ2V0TGluZShkb2MsIHNUby5saW5lKTtcbiAgICAgIHZhciBzaW5nbGVWTGluZSA9IHZpc3VhbExpbmUoZnJvbUxpbmUpID09IHZpc3VhbExpbmUodG9MaW5lKTtcbiAgICAgIHZhciBsZWZ0RW5kID0gZHJhd0ZvckxpbmUoc0Zyb20ubGluZSwgc0Zyb20uY2gsIHNpbmdsZVZMaW5lID8gZnJvbUxpbmUudGV4dC5sZW5ndGggKyAxIDogbnVsbCkuZW5kO1xuICAgICAgdmFyIHJpZ2h0U3RhcnQgPSBkcmF3Rm9yTGluZShzVG8ubGluZSwgc2luZ2xlVkxpbmUgPyAwIDogbnVsbCwgc1RvLmNoKS5zdGFydDtcbiAgICAgIGlmIChzaW5nbGVWTGluZSkge1xuICAgICAgICBpZiAobGVmdEVuZC50b3AgPCByaWdodFN0YXJ0LnRvcCAtIDIpIHtcbiAgICAgICAgICBhZGQobGVmdEVuZC5yaWdodCwgbGVmdEVuZC50b3AsIG51bGwsIGxlZnRFbmQuYm90dG9tKTtcbiAgICAgICAgICBhZGQobGVmdFNpZGUsIHJpZ2h0U3RhcnQudG9wLCByaWdodFN0YXJ0LmxlZnQsIHJpZ2h0U3RhcnQuYm90dG9tKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhZGQobGVmdEVuZC5yaWdodCwgbGVmdEVuZC50b3AsIHJpZ2h0U3RhcnQubGVmdCAtIGxlZnRFbmQucmlnaHQsIGxlZnRFbmQuYm90dG9tKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGxlZnRFbmQuYm90dG9tIDwgcmlnaHRTdGFydC50b3ApXG4gICAgICAgIGFkZChsZWZ0U2lkZSwgbGVmdEVuZC5ib3R0b20sIG51bGwsIHJpZ2h0U3RhcnQudG9wKTtcbiAgICB9XG5cbiAgICBvdXRwdXQuYXBwZW5kQ2hpbGQoZnJhZ21lbnQpO1xuICB9XG5cbiAgLy8gQ3Vyc29yLWJsaW5raW5nXG4gIGZ1bmN0aW9uIHJlc3RhcnRCbGluayhjbSkge1xuICAgIGlmICghY20uc3RhdGUuZm9jdXNlZCkgcmV0dXJuO1xuICAgIHZhciBkaXNwbGF5ID0gY20uZGlzcGxheTtcbiAgICBjbGVhckludGVydmFsKGRpc3BsYXkuYmxpbmtlcik7XG4gICAgdmFyIG9uID0gdHJ1ZTtcbiAgICBkaXNwbGF5LmN1cnNvckRpdi5zdHlsZS52aXNpYmlsaXR5ID0gXCJcIjtcbiAgICBpZiAoY20ub3B0aW9ucy5jdXJzb3JCbGlua1JhdGUgPiAwKVxuICAgICAgZGlzcGxheS5ibGlua2VyID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gICAgICAgIGRpc3BsYXkuY3Vyc29yRGl2LnN0eWxlLnZpc2liaWxpdHkgPSAob24gPSAhb24pID8gXCJcIiA6IFwiaGlkZGVuXCI7XG4gICAgICB9LCBjbS5vcHRpb25zLmN1cnNvckJsaW5rUmF0ZSk7XG4gICAgZWxzZSBpZiAoY20ub3B0aW9ucy5jdXJzb3JCbGlua1JhdGUgPCAwKVxuICAgICAgZGlzcGxheS5jdXJzb3JEaXYuc3R5bGUudmlzaWJpbGl0eSA9IFwiaGlkZGVuXCI7XG4gIH1cblxuICAvLyBISUdITElHSFQgV09SS0VSXG5cbiAgZnVuY3Rpb24gc3RhcnRXb3JrZXIoY20sIHRpbWUpIHtcbiAgICBpZiAoY20uZG9jLm1vZGUuc3RhcnRTdGF0ZSAmJiBjbS5kb2MuZnJvbnRpZXIgPCBjbS5kaXNwbGF5LnZpZXdUbylcbiAgICAgIGNtLnN0YXRlLmhpZ2hsaWdodC5zZXQodGltZSwgYmluZChoaWdobGlnaHRXb3JrZXIsIGNtKSk7XG4gIH1cblxuICBmdW5jdGlvbiBoaWdobGlnaHRXb3JrZXIoY20pIHtcbiAgICB2YXIgZG9jID0gY20uZG9jO1xuICAgIGlmIChkb2MuZnJvbnRpZXIgPCBkb2MuZmlyc3QpIGRvYy5mcm9udGllciA9IGRvYy5maXJzdDtcbiAgICBpZiAoZG9jLmZyb250aWVyID49IGNtLmRpc3BsYXkudmlld1RvKSByZXR1cm47XG4gICAgdmFyIGVuZCA9ICtuZXcgRGF0ZSArIGNtLm9wdGlvbnMud29ya1RpbWU7XG4gICAgdmFyIHN0YXRlID0gY29weVN0YXRlKGRvYy5tb2RlLCBnZXRTdGF0ZUJlZm9yZShjbSwgZG9jLmZyb250aWVyKSk7XG4gICAgdmFyIGNoYW5nZWRMaW5lcyA9IFtdO1xuXG4gICAgZG9jLml0ZXIoZG9jLmZyb250aWVyLCBNYXRoLm1pbihkb2MuZmlyc3QgKyBkb2Muc2l6ZSwgY20uZGlzcGxheS52aWV3VG8gKyA1MDApLCBmdW5jdGlvbihsaW5lKSB7XG4gICAgICBpZiAoZG9jLmZyb250aWVyID49IGNtLmRpc3BsYXkudmlld0Zyb20pIHsgLy8gVmlzaWJsZVxuICAgICAgICB2YXIgb2xkU3R5bGVzID0gbGluZS5zdHlsZXMsIHRvb0xvbmcgPSBsaW5lLnRleHQubGVuZ3RoID4gY20ub3B0aW9ucy5tYXhIaWdobGlnaHRMZW5ndGg7XG4gICAgICAgIHZhciBoaWdobGlnaHRlZCA9IGhpZ2hsaWdodExpbmUoY20sIGxpbmUsIHRvb0xvbmcgPyBjb3B5U3RhdGUoZG9jLm1vZGUsIHN0YXRlKSA6IHN0YXRlLCB0cnVlKTtcbiAgICAgICAgbGluZS5zdHlsZXMgPSBoaWdobGlnaHRlZC5zdHlsZXM7XG4gICAgICAgIHZhciBvbGRDbHMgPSBsaW5lLnN0eWxlQ2xhc3NlcywgbmV3Q2xzID0gaGlnaGxpZ2h0ZWQuY2xhc3NlcztcbiAgICAgICAgaWYgKG5ld0NscykgbGluZS5zdHlsZUNsYXNzZXMgPSBuZXdDbHM7XG4gICAgICAgIGVsc2UgaWYgKG9sZENscykgbGluZS5zdHlsZUNsYXNzZXMgPSBudWxsO1xuICAgICAgICB2YXIgaXNjaGFuZ2UgPSAhb2xkU3R5bGVzIHx8IG9sZFN0eWxlcy5sZW5ndGggIT0gbGluZS5zdHlsZXMubGVuZ3RoIHx8XG4gICAgICAgICAgb2xkQ2xzICE9IG5ld0NscyAmJiAoIW9sZENscyB8fCAhbmV3Q2xzIHx8IG9sZENscy5iZ0NsYXNzICE9IG5ld0Nscy5iZ0NsYXNzIHx8IG9sZENscy50ZXh0Q2xhc3MgIT0gbmV3Q2xzLnRleHRDbGFzcyk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyAhaXNjaGFuZ2UgJiYgaSA8IG9sZFN0eWxlcy5sZW5ndGg7ICsraSkgaXNjaGFuZ2UgPSBvbGRTdHlsZXNbaV0gIT0gbGluZS5zdHlsZXNbaV07XG4gICAgICAgIGlmIChpc2NoYW5nZSkgY2hhbmdlZExpbmVzLnB1c2goZG9jLmZyb250aWVyKTtcbiAgICAgICAgbGluZS5zdGF0ZUFmdGVyID0gdG9vTG9uZyA/IHN0YXRlIDogY29weVN0YXRlKGRvYy5tb2RlLCBzdGF0ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAobGluZS50ZXh0Lmxlbmd0aCA8PSBjbS5vcHRpb25zLm1heEhpZ2hsaWdodExlbmd0aClcbiAgICAgICAgICBwcm9jZXNzTGluZShjbSwgbGluZS50ZXh0LCBzdGF0ZSk7XG4gICAgICAgIGxpbmUuc3RhdGVBZnRlciA9IGRvYy5mcm9udGllciAlIDUgPT0gMCA/IGNvcHlTdGF0ZShkb2MubW9kZSwgc3RhdGUpIDogbnVsbDtcbiAgICAgIH1cbiAgICAgICsrZG9jLmZyb250aWVyO1xuICAgICAgaWYgKCtuZXcgRGF0ZSA+IGVuZCkge1xuICAgICAgICBzdGFydFdvcmtlcihjbSwgY20ub3B0aW9ucy53b3JrRGVsYXkpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoY2hhbmdlZExpbmVzLmxlbmd0aCkgcnVuSW5PcChjbSwgZnVuY3Rpb24oKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoYW5nZWRMaW5lcy5sZW5ndGg7IGkrKylcbiAgICAgICAgcmVnTGluZUNoYW5nZShjbSwgY2hhbmdlZExpbmVzW2ldLCBcInRleHRcIik7XG4gICAgfSk7XG4gIH1cblxuICAvLyBGaW5kcyB0aGUgbGluZSB0byBzdGFydCB3aXRoIHdoZW4gc3RhcnRpbmcgYSBwYXJzZS4gVHJpZXMgdG9cbiAgLy8gZmluZCBhIGxpbmUgd2l0aCBhIHN0YXRlQWZ0ZXIsIHNvIHRoYXQgaXQgY2FuIHN0YXJ0IHdpdGggYVxuICAvLyB2YWxpZCBzdGF0ZS4gSWYgdGhhdCBmYWlscywgaXQgcmV0dXJucyB0aGUgbGluZSB3aXRoIHRoZVxuICAvLyBzbWFsbGVzdCBpbmRlbnRhdGlvbiwgd2hpY2ggdGVuZHMgdG8gbmVlZCB0aGUgbGVhc3QgY29udGV4dCB0b1xuICAvLyBwYXJzZSBjb3JyZWN0bHkuXG4gIGZ1bmN0aW9uIGZpbmRTdGFydExpbmUoY20sIG4sIHByZWNpc2UpIHtcbiAgICB2YXIgbWluaW5kZW50LCBtaW5saW5lLCBkb2MgPSBjbS5kb2M7XG4gICAgdmFyIGxpbSA9IHByZWNpc2UgPyAtMSA6IG4gLSAoY20uZG9jLm1vZGUuaW5uZXJNb2RlID8gMTAwMCA6IDEwMCk7XG4gICAgZm9yICh2YXIgc2VhcmNoID0gbjsgc2VhcmNoID4gbGltOyAtLXNlYXJjaCkge1xuICAgICAgaWYgKHNlYXJjaCA8PSBkb2MuZmlyc3QpIHJldHVybiBkb2MuZmlyc3Q7XG4gICAgICB2YXIgbGluZSA9IGdldExpbmUoZG9jLCBzZWFyY2ggLSAxKTtcbiAgICAgIGlmIChsaW5lLnN0YXRlQWZ0ZXIgJiYgKCFwcmVjaXNlIHx8IHNlYXJjaCA8PSBkb2MuZnJvbnRpZXIpKSByZXR1cm4gc2VhcmNoO1xuICAgICAgdmFyIGluZGVudGVkID0gY291bnRDb2x1bW4obGluZS50ZXh0LCBudWxsLCBjbS5vcHRpb25zLnRhYlNpemUpO1xuICAgICAgaWYgKG1pbmxpbmUgPT0gbnVsbCB8fCBtaW5pbmRlbnQgPiBpbmRlbnRlZCkge1xuICAgICAgICBtaW5saW5lID0gc2VhcmNoIC0gMTtcbiAgICAgICAgbWluaW5kZW50ID0gaW5kZW50ZWQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtaW5saW5lO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0U3RhdGVCZWZvcmUoY20sIG4sIHByZWNpc2UpIHtcbiAgICB2YXIgZG9jID0gY20uZG9jLCBkaXNwbGF5ID0gY20uZGlzcGxheTtcbiAgICBpZiAoIWRvYy5tb2RlLnN0YXJ0U3RhdGUpIHJldHVybiB0cnVlO1xuICAgIHZhciBwb3MgPSBmaW5kU3RhcnRMaW5lKGNtLCBuLCBwcmVjaXNlKSwgc3RhdGUgPSBwb3MgPiBkb2MuZmlyc3QgJiYgZ2V0TGluZShkb2MsIHBvcy0xKS5zdGF0ZUFmdGVyO1xuICAgIGlmICghc3RhdGUpIHN0YXRlID0gc3RhcnRTdGF0ZShkb2MubW9kZSk7XG4gICAgZWxzZSBzdGF0ZSA9IGNvcHlTdGF0ZShkb2MubW9kZSwgc3RhdGUpO1xuICAgIGRvYy5pdGVyKHBvcywgbiwgZnVuY3Rpb24obGluZSkge1xuICAgICAgcHJvY2Vzc0xpbmUoY20sIGxpbmUudGV4dCwgc3RhdGUpO1xuICAgICAgdmFyIHNhdmUgPSBwb3MgPT0gbiAtIDEgfHwgcG9zICUgNSA9PSAwIHx8IHBvcyA+PSBkaXNwbGF5LnZpZXdGcm9tICYmIHBvcyA8IGRpc3BsYXkudmlld1RvO1xuICAgICAgbGluZS5zdGF0ZUFmdGVyID0gc2F2ZSA/IGNvcHlTdGF0ZShkb2MubW9kZSwgc3RhdGUpIDogbnVsbDtcbiAgICAgICsrcG9zO1xuICAgIH0pO1xuICAgIGlmIChwcmVjaXNlKSBkb2MuZnJvbnRpZXIgPSBwb3M7XG4gICAgcmV0dXJuIHN0YXRlO1xuICB9XG5cbiAgLy8gUE9TSVRJT04gTUVBU1VSRU1FTlRcblxuICBmdW5jdGlvbiBwYWRkaW5nVG9wKGRpc3BsYXkpIHtyZXR1cm4gZGlzcGxheS5saW5lU3BhY2Uub2Zmc2V0VG9wO31cbiAgZnVuY3Rpb24gcGFkZGluZ1ZlcnQoZGlzcGxheSkge3JldHVybiBkaXNwbGF5Lm1vdmVyLm9mZnNldEhlaWdodCAtIGRpc3BsYXkubGluZVNwYWNlLm9mZnNldEhlaWdodDt9XG4gIGZ1bmN0aW9uIHBhZGRpbmdIKGRpc3BsYXkpIHtcbiAgICBpZiAoZGlzcGxheS5jYWNoZWRQYWRkaW5nSCkgcmV0dXJuIGRpc3BsYXkuY2FjaGVkUGFkZGluZ0g7XG4gICAgdmFyIGUgPSByZW1vdmVDaGlsZHJlbkFuZEFkZChkaXNwbGF5Lm1lYXN1cmUsIGVsdChcInByZVwiLCBcInhcIikpO1xuICAgIHZhciBzdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlID8gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZSkgOiBlLmN1cnJlbnRTdHlsZTtcbiAgICB2YXIgZGF0YSA9IHtsZWZ0OiBwYXJzZUludChzdHlsZS5wYWRkaW5nTGVmdCksIHJpZ2h0OiBwYXJzZUludChzdHlsZS5wYWRkaW5nUmlnaHQpfTtcbiAgICBpZiAoIWlzTmFOKGRhdGEubGVmdCkgJiYgIWlzTmFOKGRhdGEucmlnaHQpKSBkaXNwbGF5LmNhY2hlZFBhZGRpbmdIID0gZGF0YTtcbiAgICByZXR1cm4gZGF0YTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNjcm9sbEdhcChjbSkgeyByZXR1cm4gc2Nyb2xsZXJHYXAgLSBjbS5kaXNwbGF5Lm5hdGl2ZUJhcldpZHRoOyB9XG4gIGZ1bmN0aW9uIGRpc3BsYXlXaWR0aChjbSkge1xuICAgIHJldHVybiBjbS5kaXNwbGF5LnNjcm9sbGVyLmNsaWVudFdpZHRoIC0gc2Nyb2xsR2FwKGNtKSAtIGNtLmRpc3BsYXkuYmFyV2lkdGg7XG4gIH1cbiAgZnVuY3Rpb24gZGlzcGxheUhlaWdodChjbSkge1xuICAgIHJldHVybiBjbS5kaXNwbGF5LnNjcm9sbGVyLmNsaWVudEhlaWdodCAtIHNjcm9sbEdhcChjbSkgLSBjbS5kaXNwbGF5LmJhckhlaWdodDtcbiAgfVxuXG4gIC8vIEVuc3VyZSB0aGUgbGluZVZpZXcud3JhcHBpbmcuaGVpZ2h0cyBhcnJheSBpcyBwb3B1bGF0ZWQuIFRoaXMgaXNcbiAgLy8gYW4gYXJyYXkgb2YgYm90dG9tIG9mZnNldHMgZm9yIHRoZSBsaW5lcyB0aGF0IG1ha2UgdXAgYSBkcmF3blxuICAvLyBsaW5lLiBXaGVuIGxpbmVXcmFwcGluZyBpcyBvbiwgdGhlcmUgbWlnaHQgYmUgbW9yZSB0aGFuIG9uZVxuICAvLyBoZWlnaHQuXG4gIGZ1bmN0aW9uIGVuc3VyZUxpbmVIZWlnaHRzKGNtLCBsaW5lVmlldywgcmVjdCkge1xuICAgIHZhciB3cmFwcGluZyA9IGNtLm9wdGlvbnMubGluZVdyYXBwaW5nO1xuICAgIHZhciBjdXJXaWR0aCA9IHdyYXBwaW5nICYmIGRpc3BsYXlXaWR0aChjbSk7XG4gICAgaWYgKCFsaW5lVmlldy5tZWFzdXJlLmhlaWdodHMgfHwgd3JhcHBpbmcgJiYgbGluZVZpZXcubWVhc3VyZS53aWR0aCAhPSBjdXJXaWR0aCkge1xuICAgICAgdmFyIGhlaWdodHMgPSBsaW5lVmlldy5tZWFzdXJlLmhlaWdodHMgPSBbXTtcbiAgICAgIGlmICh3cmFwcGluZykge1xuICAgICAgICBsaW5lVmlldy5tZWFzdXJlLndpZHRoID0gY3VyV2lkdGg7XG4gICAgICAgIHZhciByZWN0cyA9IGxpbmVWaWV3LnRleHQuZmlyc3RDaGlsZC5nZXRDbGllbnRSZWN0cygpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlY3RzLmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgICAgIHZhciBjdXIgPSByZWN0c1tpXSwgbmV4dCA9IHJlY3RzW2kgKyAxXTtcbiAgICAgICAgICBpZiAoTWF0aC5hYnMoY3VyLmJvdHRvbSAtIG5leHQuYm90dG9tKSA+IDIpXG4gICAgICAgICAgICBoZWlnaHRzLnB1c2goKGN1ci5ib3R0b20gKyBuZXh0LnRvcCkgLyAyIC0gcmVjdC50b3ApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBoZWlnaHRzLnB1c2gocmVjdC5ib3R0b20gLSByZWN0LnRvcCk7XG4gICAgfVxuICB9XG5cbiAgLy8gRmluZCBhIGxpbmUgbWFwIChtYXBwaW5nIGNoYXJhY3RlciBvZmZzZXRzIHRvIHRleHQgbm9kZXMpIGFuZCBhXG4gIC8vIG1lYXN1cmVtZW50IGNhY2hlIGZvciB0aGUgZ2l2ZW4gbGluZSBudW1iZXIuIChBIGxpbmUgdmlldyBtaWdodFxuICAvLyBjb250YWluIG11bHRpcGxlIGxpbmVzIHdoZW4gY29sbGFwc2VkIHJhbmdlcyBhcmUgcHJlc2VudC4pXG4gIGZ1bmN0aW9uIG1hcEZyb21MaW5lVmlldyhsaW5lVmlldywgbGluZSwgbGluZU4pIHtcbiAgICBpZiAobGluZVZpZXcubGluZSA9PSBsaW5lKVxuICAgICAgcmV0dXJuIHttYXA6IGxpbmVWaWV3Lm1lYXN1cmUubWFwLCBjYWNoZTogbGluZVZpZXcubWVhc3VyZS5jYWNoZX07XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5lVmlldy5yZXN0Lmxlbmd0aDsgaSsrKVxuICAgICAgaWYgKGxpbmVWaWV3LnJlc3RbaV0gPT0gbGluZSlcbiAgICAgICAgcmV0dXJuIHttYXA6IGxpbmVWaWV3Lm1lYXN1cmUubWFwc1tpXSwgY2FjaGU6IGxpbmVWaWV3Lm1lYXN1cmUuY2FjaGVzW2ldfTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbmVWaWV3LnJlc3QubGVuZ3RoOyBpKyspXG4gICAgICBpZiAobGluZU5vKGxpbmVWaWV3LnJlc3RbaV0pID4gbGluZU4pXG4gICAgICAgIHJldHVybiB7bWFwOiBsaW5lVmlldy5tZWFzdXJlLm1hcHNbaV0sIGNhY2hlOiBsaW5lVmlldy5tZWFzdXJlLmNhY2hlc1tpXSwgYmVmb3JlOiB0cnVlfTtcbiAgfVxuXG4gIC8vIFJlbmRlciBhIGxpbmUgaW50byB0aGUgaGlkZGVuIG5vZGUgZGlzcGxheS5leHRlcm5hbE1lYXN1cmVkLiBVc2VkXG4gIC8vIHdoZW4gbWVhc3VyZW1lbnQgaXMgbmVlZGVkIGZvciBhIGxpbmUgdGhhdCdzIG5vdCBpbiB0aGUgdmlld3BvcnQuXG4gIGZ1bmN0aW9uIHVwZGF0ZUV4dGVybmFsTWVhc3VyZW1lbnQoY20sIGxpbmUpIHtcbiAgICBsaW5lID0gdmlzdWFsTGluZShsaW5lKTtcbiAgICB2YXIgbGluZU4gPSBsaW5lTm8obGluZSk7XG4gICAgdmFyIHZpZXcgPSBjbS5kaXNwbGF5LmV4dGVybmFsTWVhc3VyZWQgPSBuZXcgTGluZVZpZXcoY20uZG9jLCBsaW5lLCBsaW5lTik7XG4gICAgdmlldy5saW5lTiA9IGxpbmVOO1xuICAgIHZhciBidWlsdCA9IHZpZXcuYnVpbHQgPSBidWlsZExpbmVDb250ZW50KGNtLCB2aWV3KTtcbiAgICB2aWV3LnRleHQgPSBidWlsdC5wcmU7XG4gICAgcmVtb3ZlQ2hpbGRyZW5BbmRBZGQoY20uZGlzcGxheS5saW5lTWVhc3VyZSwgYnVpbHQucHJlKTtcbiAgICByZXR1cm4gdmlldztcbiAgfVxuXG4gIC8vIEdldCBhIHt0b3AsIGJvdHRvbSwgbGVmdCwgcmlnaHR9IGJveCAoaW4gbGluZS1sb2NhbCBjb29yZGluYXRlcylcbiAgLy8gZm9yIGEgZ2l2ZW4gY2hhcmFjdGVyLlxuICBmdW5jdGlvbiBtZWFzdXJlQ2hhcihjbSwgbGluZSwgY2gsIGJpYXMpIHtcbiAgICByZXR1cm4gbWVhc3VyZUNoYXJQcmVwYXJlZChjbSwgcHJlcGFyZU1lYXN1cmVGb3JMaW5lKGNtLCBsaW5lKSwgY2gsIGJpYXMpO1xuICB9XG5cbiAgLy8gRmluZCBhIGxpbmUgdmlldyB0aGF0IGNvcnJlc3BvbmRzIHRvIHRoZSBnaXZlbiBsaW5lIG51bWJlci5cbiAgZnVuY3Rpb24gZmluZFZpZXdGb3JMaW5lKGNtLCBsaW5lTikge1xuICAgIGlmIChsaW5lTiA+PSBjbS5kaXNwbGF5LnZpZXdGcm9tICYmIGxpbmVOIDwgY20uZGlzcGxheS52aWV3VG8pXG4gICAgICByZXR1cm4gY20uZGlzcGxheS52aWV3W2ZpbmRWaWV3SW5kZXgoY20sIGxpbmVOKV07XG4gICAgdmFyIGV4dCA9IGNtLmRpc3BsYXkuZXh0ZXJuYWxNZWFzdXJlZDtcbiAgICBpZiAoZXh0ICYmIGxpbmVOID49IGV4dC5saW5lTiAmJiBsaW5lTiA8IGV4dC5saW5lTiArIGV4dC5zaXplKVxuICAgICAgcmV0dXJuIGV4dDtcbiAgfVxuXG4gIC8vIE1lYXN1cmVtZW50IGNhbiBiZSBzcGxpdCBpbiB0d28gc3RlcHMsIHRoZSBzZXQtdXAgd29yayB0aGF0XG4gIC8vIGFwcGxpZXMgdG8gdGhlIHdob2xlIGxpbmUsIGFuZCB0aGUgbWVhc3VyZW1lbnQgb2YgdGhlIGFjdHVhbFxuICAvLyBjaGFyYWN0ZXIuIEZ1bmN0aW9ucyBsaWtlIGNvb3Jkc0NoYXIsIHRoYXQgbmVlZCB0byBkbyBhIGxvdCBvZlxuICAvLyBtZWFzdXJlbWVudHMgaW4gYSByb3csIGNhbiB0aHVzIGVuc3VyZSB0aGF0IHRoZSBzZXQtdXAgd29yayBpc1xuICAvLyBvbmx5IGRvbmUgb25jZS5cbiAgZnVuY3Rpb24gcHJlcGFyZU1lYXN1cmVGb3JMaW5lKGNtLCBsaW5lKSB7XG4gICAgdmFyIGxpbmVOID0gbGluZU5vKGxpbmUpO1xuICAgIHZhciB2aWV3ID0gZmluZFZpZXdGb3JMaW5lKGNtLCBsaW5lTik7XG4gICAgaWYgKHZpZXcgJiYgIXZpZXcudGV4dCkge1xuICAgICAgdmlldyA9IG51bGw7XG4gICAgfSBlbHNlIGlmICh2aWV3ICYmIHZpZXcuY2hhbmdlcykge1xuICAgICAgdXBkYXRlTGluZUZvckNoYW5nZXMoY20sIHZpZXcsIGxpbmVOLCBnZXREaW1lbnNpb25zKGNtKSk7XG4gICAgICBjbS5jdXJPcC5mb3JjZVVwZGF0ZSA9IHRydWU7XG4gICAgfVxuICAgIGlmICghdmlldylcbiAgICAgIHZpZXcgPSB1cGRhdGVFeHRlcm5hbE1lYXN1cmVtZW50KGNtLCBsaW5lKTtcblxuICAgIHZhciBpbmZvID0gbWFwRnJvbUxpbmVWaWV3KHZpZXcsIGxpbmUsIGxpbmVOKTtcbiAgICByZXR1cm4ge1xuICAgICAgbGluZTogbGluZSwgdmlldzogdmlldywgcmVjdDogbnVsbCxcbiAgICAgIG1hcDogaW5mby5tYXAsIGNhY2hlOiBpbmZvLmNhY2hlLCBiZWZvcmU6IGluZm8uYmVmb3JlLFxuICAgICAgaGFzSGVpZ2h0czogZmFsc2VcbiAgICB9O1xuICB9XG5cbiAgLy8gR2l2ZW4gYSBwcmVwYXJlZCBtZWFzdXJlbWVudCBvYmplY3QsIG1lYXN1cmVzIHRoZSBwb3NpdGlvbiBvZiBhblxuICAvLyBhY3R1YWwgY2hhcmFjdGVyIChvciBmZXRjaGVzIGl0IGZyb20gdGhlIGNhY2hlKS5cbiAgZnVuY3Rpb24gbWVhc3VyZUNoYXJQcmVwYXJlZChjbSwgcHJlcGFyZWQsIGNoLCBiaWFzLCB2YXJIZWlnaHQpIHtcbiAgICBpZiAocHJlcGFyZWQuYmVmb3JlKSBjaCA9IC0xO1xuICAgIHZhciBrZXkgPSBjaCArIChiaWFzIHx8IFwiXCIpLCBmb3VuZDtcbiAgICBpZiAocHJlcGFyZWQuY2FjaGUuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgZm91bmQgPSBwcmVwYXJlZC5jYWNoZVtrZXldO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoIXByZXBhcmVkLnJlY3QpXG4gICAgICAgIHByZXBhcmVkLnJlY3QgPSBwcmVwYXJlZC52aWV3LnRleHQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICBpZiAoIXByZXBhcmVkLmhhc0hlaWdodHMpIHtcbiAgICAgICAgZW5zdXJlTGluZUhlaWdodHMoY20sIHByZXBhcmVkLnZpZXcsIHByZXBhcmVkLnJlY3QpO1xuICAgICAgICBwcmVwYXJlZC5oYXNIZWlnaHRzID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGZvdW5kID0gbWVhc3VyZUNoYXJJbm5lcihjbSwgcHJlcGFyZWQsIGNoLCBiaWFzKTtcbiAgICAgIGlmICghZm91bmQuYm9ndXMpIHByZXBhcmVkLmNhY2hlW2tleV0gPSBmb3VuZDtcbiAgICB9XG4gICAgcmV0dXJuIHtsZWZ0OiBmb3VuZC5sZWZ0LCByaWdodDogZm91bmQucmlnaHQsXG4gICAgICAgICAgICB0b3A6IHZhckhlaWdodCA/IGZvdW5kLnJ0b3AgOiBmb3VuZC50b3AsXG4gICAgICAgICAgICBib3R0b206IHZhckhlaWdodCA/IGZvdW5kLnJib3R0b20gOiBmb3VuZC5ib3R0b219O1xuICB9XG5cbiAgdmFyIG51bGxSZWN0ID0ge2xlZnQ6IDAsIHJpZ2h0OiAwLCB0b3A6IDAsIGJvdHRvbTogMH07XG5cbiAgZnVuY3Rpb24gbm9kZUFuZE9mZnNldEluTGluZU1hcChtYXAsIGNoLCBiaWFzKSB7XG4gICAgdmFyIG5vZGUsIHN0YXJ0LCBlbmQsIGNvbGxhcHNlO1xuICAgIC8vIEZpcnN0LCBzZWFyY2ggdGhlIGxpbmUgbWFwIGZvciB0aGUgdGV4dCBub2RlIGNvcnJlc3BvbmRpbmcgdG8sXG4gICAgLy8gb3IgY2xvc2VzdCB0bywgdGhlIHRhcmdldCBjaGFyYWN0ZXIuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtYXAubGVuZ3RoOyBpICs9IDMpIHtcbiAgICAgIHZhciBtU3RhcnQgPSBtYXBbaV0sIG1FbmQgPSBtYXBbaSArIDFdO1xuICAgICAgaWYgKGNoIDwgbVN0YXJ0KSB7XG4gICAgICAgIHN0YXJ0ID0gMDsgZW5kID0gMTtcbiAgICAgICAgY29sbGFwc2UgPSBcImxlZnRcIjtcbiAgICAgIH0gZWxzZSBpZiAoY2ggPCBtRW5kKSB7XG4gICAgICAgIHN0YXJ0ID0gY2ggLSBtU3RhcnQ7XG4gICAgICAgIGVuZCA9IHN0YXJ0ICsgMTtcbiAgICAgIH0gZWxzZSBpZiAoaSA9PSBtYXAubGVuZ3RoIC0gMyB8fCBjaCA9PSBtRW5kICYmIG1hcFtpICsgM10gPiBjaCkge1xuICAgICAgICBlbmQgPSBtRW5kIC0gbVN0YXJ0O1xuICAgICAgICBzdGFydCA9IGVuZCAtIDE7XG4gICAgICAgIGlmIChjaCA+PSBtRW5kKSBjb2xsYXBzZSA9IFwicmlnaHRcIjtcbiAgICAgIH1cbiAgICAgIGlmIChzdGFydCAhPSBudWxsKSB7XG4gICAgICAgIG5vZGUgPSBtYXBbaSArIDJdO1xuICAgICAgICBpZiAobVN0YXJ0ID09IG1FbmQgJiYgYmlhcyA9PSAobm9kZS5pbnNlcnRMZWZ0ID8gXCJsZWZ0XCIgOiBcInJpZ2h0XCIpKVxuICAgICAgICAgIGNvbGxhcHNlID0gYmlhcztcbiAgICAgICAgaWYgKGJpYXMgPT0gXCJsZWZ0XCIgJiYgc3RhcnQgPT0gMClcbiAgICAgICAgICB3aGlsZSAoaSAmJiBtYXBbaSAtIDJdID09IG1hcFtpIC0gM10gJiYgbWFwW2kgLSAxXS5pbnNlcnRMZWZ0KSB7XG4gICAgICAgICAgICBub2RlID0gbWFwWyhpIC09IDMpICsgMl07XG4gICAgICAgICAgICBjb2xsYXBzZSA9IFwibGVmdFwiO1xuICAgICAgICAgIH1cbiAgICAgICAgaWYgKGJpYXMgPT0gXCJyaWdodFwiICYmIHN0YXJ0ID09IG1FbmQgLSBtU3RhcnQpXG4gICAgICAgICAgd2hpbGUgKGkgPCBtYXAubGVuZ3RoIC0gMyAmJiBtYXBbaSArIDNdID09IG1hcFtpICsgNF0gJiYgIW1hcFtpICsgNV0uaW5zZXJ0TGVmdCkge1xuICAgICAgICAgICAgbm9kZSA9IG1hcFsoaSArPSAzKSArIDJdO1xuICAgICAgICAgICAgY29sbGFwc2UgPSBcInJpZ2h0XCI7XG4gICAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHtub2RlOiBub2RlLCBzdGFydDogc3RhcnQsIGVuZDogZW5kLCBjb2xsYXBzZTogY29sbGFwc2UsIGNvdmVyU3RhcnQ6IG1TdGFydCwgY292ZXJFbmQ6IG1FbmR9O1xuICB9XG5cbiAgZnVuY3Rpb24gbWVhc3VyZUNoYXJJbm5lcihjbSwgcHJlcGFyZWQsIGNoLCBiaWFzKSB7XG4gICAgdmFyIHBsYWNlID0gbm9kZUFuZE9mZnNldEluTGluZU1hcChwcmVwYXJlZC5tYXAsIGNoLCBiaWFzKTtcbiAgICB2YXIgbm9kZSA9IHBsYWNlLm5vZGUsIHN0YXJ0ID0gcGxhY2Uuc3RhcnQsIGVuZCA9IHBsYWNlLmVuZCwgY29sbGFwc2UgPSBwbGFjZS5jb2xsYXBzZTtcblxuICAgIHZhciByZWN0O1xuICAgIGlmIChub2RlLm5vZGVUeXBlID09IDMpIHsgLy8gSWYgaXQgaXMgYSB0ZXh0IG5vZGUsIHVzZSBhIHJhbmdlIHRvIHJldHJpZXZlIHRoZSBjb29yZGluYXRlcy5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgNDsgaSsrKSB7IC8vIFJldHJ5IGEgbWF4aW11bSBvZiA0IHRpbWVzIHdoZW4gbm9uc2Vuc2UgcmVjdGFuZ2xlcyBhcmUgcmV0dXJuZWRcbiAgICAgICAgd2hpbGUgKHN0YXJ0ICYmIGlzRXh0ZW5kaW5nQ2hhcihwcmVwYXJlZC5saW5lLnRleHQuY2hhckF0KHBsYWNlLmNvdmVyU3RhcnQgKyBzdGFydCkpKSAtLXN0YXJ0O1xuICAgICAgICB3aGlsZSAocGxhY2UuY292ZXJTdGFydCArIGVuZCA8IHBsYWNlLmNvdmVyRW5kICYmIGlzRXh0ZW5kaW5nQ2hhcihwcmVwYXJlZC5saW5lLnRleHQuY2hhckF0KHBsYWNlLmNvdmVyU3RhcnQgKyBlbmQpKSkgKytlbmQ7XG4gICAgICAgIGlmIChpZSAmJiBpZV92ZXJzaW9uIDwgOSAmJiBzdGFydCA9PSAwICYmIGVuZCA9PSBwbGFjZS5jb3ZlckVuZCAtIHBsYWNlLmNvdmVyU3RhcnQpIHtcbiAgICAgICAgICByZWN0ID0gbm9kZS5wYXJlbnROb2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICB9IGVsc2UgaWYgKGllICYmIGNtLm9wdGlvbnMubGluZVdyYXBwaW5nKSB7XG4gICAgICAgICAgdmFyIHJlY3RzID0gcmFuZ2Uobm9kZSwgc3RhcnQsIGVuZCkuZ2V0Q2xpZW50UmVjdHMoKTtcbiAgICAgICAgICBpZiAocmVjdHMubGVuZ3RoKVxuICAgICAgICAgICAgcmVjdCA9IHJlY3RzW2JpYXMgPT0gXCJyaWdodFwiID8gcmVjdHMubGVuZ3RoIC0gMSA6IDBdO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJlY3QgPSBudWxsUmVjdDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZWN0ID0gcmFuZ2Uobm9kZSwgc3RhcnQsIGVuZCkuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkgfHwgbnVsbFJlY3Q7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlY3QubGVmdCB8fCByZWN0LnJpZ2h0IHx8IHN0YXJ0ID09IDApIGJyZWFrO1xuICAgICAgICBlbmQgPSBzdGFydDtcbiAgICAgICAgc3RhcnQgPSBzdGFydCAtIDE7XG4gICAgICAgIGNvbGxhcHNlID0gXCJyaWdodFwiO1xuICAgICAgfVxuICAgICAgaWYgKGllICYmIGllX3ZlcnNpb24gPCAxMSkgcmVjdCA9IG1heWJlVXBkYXRlUmVjdEZvclpvb21pbmcoY20uZGlzcGxheS5tZWFzdXJlLCByZWN0KTtcbiAgICB9IGVsc2UgeyAvLyBJZiBpdCBpcyBhIHdpZGdldCwgc2ltcGx5IGdldCB0aGUgYm94IGZvciB0aGUgd2hvbGUgd2lkZ2V0LlxuICAgICAgaWYgKHN0YXJ0ID4gMCkgY29sbGFwc2UgPSBiaWFzID0gXCJyaWdodFwiO1xuICAgICAgdmFyIHJlY3RzO1xuICAgICAgaWYgKGNtLm9wdGlvbnMubGluZVdyYXBwaW5nICYmIChyZWN0cyA9IG5vZGUuZ2V0Q2xpZW50UmVjdHMoKSkubGVuZ3RoID4gMSlcbiAgICAgICAgcmVjdCA9IHJlY3RzW2JpYXMgPT0gXCJyaWdodFwiID8gcmVjdHMubGVuZ3RoIC0gMSA6IDBdO1xuICAgICAgZWxzZVxuICAgICAgICByZWN0ID0gbm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICB9XG4gICAgaWYgKGllICYmIGllX3ZlcnNpb24gPCA5ICYmICFzdGFydCAmJiAoIXJlY3QgfHwgIXJlY3QubGVmdCAmJiAhcmVjdC5yaWdodCkpIHtcbiAgICAgIHZhciByU3BhbiA9IG5vZGUucGFyZW50Tm9kZS5nZXRDbGllbnRSZWN0cygpWzBdO1xuICAgICAgaWYgKHJTcGFuKVxuICAgICAgICByZWN0ID0ge2xlZnQ6IHJTcGFuLmxlZnQsIHJpZ2h0OiByU3Bhbi5sZWZ0ICsgY2hhcldpZHRoKGNtLmRpc3BsYXkpLCB0b3A6IHJTcGFuLnRvcCwgYm90dG9tOiByU3Bhbi5ib3R0b219O1xuICAgICAgZWxzZVxuICAgICAgICByZWN0ID0gbnVsbFJlY3Q7XG4gICAgfVxuXG4gICAgdmFyIHJ0b3AgPSByZWN0LnRvcCAtIHByZXBhcmVkLnJlY3QudG9wLCByYm90ID0gcmVjdC5ib3R0b20gLSBwcmVwYXJlZC5yZWN0LnRvcDtcbiAgICB2YXIgbWlkID0gKHJ0b3AgKyByYm90KSAvIDI7XG4gICAgdmFyIGhlaWdodHMgPSBwcmVwYXJlZC52aWV3Lm1lYXN1cmUuaGVpZ2h0cztcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGhlaWdodHMubGVuZ3RoIC0gMTsgaSsrKVxuICAgICAgaWYgKG1pZCA8IGhlaWdodHNbaV0pIGJyZWFrO1xuICAgIHZhciB0b3AgPSBpID8gaGVpZ2h0c1tpIC0gMV0gOiAwLCBib3QgPSBoZWlnaHRzW2ldO1xuICAgIHZhciByZXN1bHQgPSB7bGVmdDogKGNvbGxhcHNlID09IFwicmlnaHRcIiA/IHJlY3QucmlnaHQgOiByZWN0LmxlZnQpIC0gcHJlcGFyZWQucmVjdC5sZWZ0LFxuICAgICAgICAgICAgICAgICAgcmlnaHQ6IChjb2xsYXBzZSA9PSBcImxlZnRcIiA/IHJlY3QubGVmdCA6IHJlY3QucmlnaHQpIC0gcHJlcGFyZWQucmVjdC5sZWZ0LFxuICAgICAgICAgICAgICAgICAgdG9wOiB0b3AsIGJvdHRvbTogYm90fTtcbiAgICBpZiAoIXJlY3QubGVmdCAmJiAhcmVjdC5yaWdodCkgcmVzdWx0LmJvZ3VzID0gdHJ1ZTtcbiAgICBpZiAoIWNtLm9wdGlvbnMuc2luZ2xlQ3Vyc29ySGVpZ2h0UGVyTGluZSkgeyByZXN1bHQucnRvcCA9IHJ0b3A7IHJlc3VsdC5yYm90dG9tID0gcmJvdDsgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8vIFdvcmsgYXJvdW5kIHByb2JsZW0gd2l0aCBib3VuZGluZyBjbGllbnQgcmVjdHMgb24gcmFuZ2VzIGJlaW5nXG4gIC8vIHJldHVybmVkIGluY29ycmVjdGx5IHdoZW4gem9vbWVkIG9uIElFMTAgYW5kIGJlbG93LlxuICBmdW5jdGlvbiBtYXliZVVwZGF0ZVJlY3RGb3Jab29taW5nKG1lYXN1cmUsIHJlY3QpIHtcbiAgICBpZiAoIXdpbmRvdy5zY3JlZW4gfHwgc2NyZWVuLmxvZ2ljYWxYRFBJID09IG51bGwgfHxcbiAgICAgICAgc2NyZWVuLmxvZ2ljYWxYRFBJID09IHNjcmVlbi5kZXZpY2VYRFBJIHx8ICFoYXNCYWRab29tZWRSZWN0cyhtZWFzdXJlKSlcbiAgICAgIHJldHVybiByZWN0O1xuICAgIHZhciBzY2FsZVggPSBzY3JlZW4ubG9naWNhbFhEUEkgLyBzY3JlZW4uZGV2aWNlWERQSTtcbiAgICB2YXIgc2NhbGVZID0gc2NyZWVuLmxvZ2ljYWxZRFBJIC8gc2NyZWVuLmRldmljZVlEUEk7XG4gICAgcmV0dXJuIHtsZWZ0OiByZWN0LmxlZnQgKiBzY2FsZVgsIHJpZ2h0OiByZWN0LnJpZ2h0ICogc2NhbGVYLFxuICAgICAgICAgICAgdG9wOiByZWN0LnRvcCAqIHNjYWxlWSwgYm90dG9tOiByZWN0LmJvdHRvbSAqIHNjYWxlWX07XG4gIH1cblxuICBmdW5jdGlvbiBjbGVhckxpbmVNZWFzdXJlbWVudENhY2hlRm9yKGxpbmVWaWV3KSB7XG4gICAgaWYgKGxpbmVWaWV3Lm1lYXN1cmUpIHtcbiAgICAgIGxpbmVWaWV3Lm1lYXN1cmUuY2FjaGUgPSB7fTtcbiAgICAgIGxpbmVWaWV3Lm1lYXN1cmUuaGVpZ2h0cyA9IG51bGw7XG4gICAgICBpZiAobGluZVZpZXcucmVzdCkgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5lVmlldy5yZXN0Lmxlbmd0aDsgaSsrKVxuICAgICAgICBsaW5lVmlldy5tZWFzdXJlLmNhY2hlc1tpXSA9IHt9O1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNsZWFyTGluZU1lYXN1cmVtZW50Q2FjaGUoY20pIHtcbiAgICBjbS5kaXNwbGF5LmV4dGVybmFsTWVhc3VyZSA9IG51bGw7XG4gICAgcmVtb3ZlQ2hpbGRyZW4oY20uZGlzcGxheS5saW5lTWVhc3VyZSk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjbS5kaXNwbGF5LnZpZXcubGVuZ3RoOyBpKyspXG4gICAgICBjbGVhckxpbmVNZWFzdXJlbWVudENhY2hlRm9yKGNtLmRpc3BsYXkudmlld1tpXSk7XG4gIH1cblxuICBmdW5jdGlvbiBjbGVhckNhY2hlcyhjbSkge1xuICAgIGNsZWFyTGluZU1lYXN1cmVtZW50Q2FjaGUoY20pO1xuICAgIGNtLmRpc3BsYXkuY2FjaGVkQ2hhcldpZHRoID0gY20uZGlzcGxheS5jYWNoZWRUZXh0SGVpZ2h0ID0gY20uZGlzcGxheS5jYWNoZWRQYWRkaW5nSCA9IG51bGw7XG4gICAgaWYgKCFjbS5vcHRpb25zLmxpbmVXcmFwcGluZykgY20uZGlzcGxheS5tYXhMaW5lQ2hhbmdlZCA9IHRydWU7XG4gICAgY20uZGlzcGxheS5saW5lTnVtQ2hhcnMgPSBudWxsO1xuICB9XG5cbiAgZnVuY3Rpb24gcGFnZVNjcm9sbFgoKSB7IHJldHVybiB3aW5kb3cucGFnZVhPZmZzZXQgfHwgKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCB8fCBkb2N1bWVudC5ib2R5KS5zY3JvbGxMZWZ0OyB9XG4gIGZ1bmN0aW9uIHBhZ2VTY3JvbGxZKCkgeyByZXR1cm4gd2luZG93LnBhZ2VZT2Zmc2V0IHx8IChkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgfHwgZG9jdW1lbnQuYm9keSkuc2Nyb2xsVG9wOyB9XG5cbiAgLy8gQ29udmVydHMgYSB7dG9wLCBib3R0b20sIGxlZnQsIHJpZ2h0fSBib3ggZnJvbSBsaW5lLWxvY2FsXG4gIC8vIGNvb3JkaW5hdGVzIGludG8gYW5vdGhlciBjb29yZGluYXRlIHN5c3RlbS4gQ29udGV4dCBtYXkgYmUgb25lIG9mXG4gIC8vIFwibGluZVwiLCBcImRpdlwiIChkaXNwbGF5LmxpbmVEaXYpLCBcImxvY2FsXCIvbnVsbCAoZWRpdG9yKSwgXCJ3aW5kb3dcIixcbiAgLy8gb3IgXCJwYWdlXCIuXG4gIGZ1bmN0aW9uIGludG9Db29yZFN5c3RlbShjbSwgbGluZU9iaiwgcmVjdCwgY29udGV4dCkge1xuICAgIGlmIChsaW5lT2JqLndpZGdldHMpIGZvciAodmFyIGkgPSAwOyBpIDwgbGluZU9iai53aWRnZXRzLmxlbmd0aDsgKytpKSBpZiAobGluZU9iai53aWRnZXRzW2ldLmFib3ZlKSB7XG4gICAgICB2YXIgc2l6ZSA9IHdpZGdldEhlaWdodChsaW5lT2JqLndpZGdldHNbaV0pO1xuICAgICAgcmVjdC50b3AgKz0gc2l6ZTsgcmVjdC5ib3R0b20gKz0gc2l6ZTtcbiAgICB9XG4gICAgaWYgKGNvbnRleHQgPT0gXCJsaW5lXCIpIHJldHVybiByZWN0O1xuICAgIGlmICghY29udGV4dCkgY29udGV4dCA9IFwibG9jYWxcIjtcbiAgICB2YXIgeU9mZiA9IGhlaWdodEF0TGluZShsaW5lT2JqKTtcbiAgICBpZiAoY29udGV4dCA9PSBcImxvY2FsXCIpIHlPZmYgKz0gcGFkZGluZ1RvcChjbS5kaXNwbGF5KTtcbiAgICBlbHNlIHlPZmYgLT0gY20uZGlzcGxheS52aWV3T2Zmc2V0O1xuICAgIGlmIChjb250ZXh0ID09IFwicGFnZVwiIHx8IGNvbnRleHQgPT0gXCJ3aW5kb3dcIikge1xuICAgICAgdmFyIGxPZmYgPSBjbS5kaXNwbGF5LmxpbmVTcGFjZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgIHlPZmYgKz0gbE9mZi50b3AgKyAoY29udGV4dCA9PSBcIndpbmRvd1wiID8gMCA6IHBhZ2VTY3JvbGxZKCkpO1xuICAgICAgdmFyIHhPZmYgPSBsT2ZmLmxlZnQgKyAoY29udGV4dCA9PSBcIndpbmRvd1wiID8gMCA6IHBhZ2VTY3JvbGxYKCkpO1xuICAgICAgcmVjdC5sZWZ0ICs9IHhPZmY7IHJlY3QucmlnaHQgKz0geE9mZjtcbiAgICB9XG4gICAgcmVjdC50b3AgKz0geU9mZjsgcmVjdC5ib3R0b20gKz0geU9mZjtcbiAgICByZXR1cm4gcmVjdDtcbiAgfVxuXG4gIC8vIENvdmVydHMgYSBib3ggZnJvbSBcImRpdlwiIGNvb3JkcyB0byBhbm90aGVyIGNvb3JkaW5hdGUgc3lzdGVtLlxuICAvLyBDb250ZXh0IG1heSBiZSBcIndpbmRvd1wiLCBcInBhZ2VcIiwgXCJkaXZcIiwgb3IgXCJsb2NhbFwiL251bGwuXG4gIGZ1bmN0aW9uIGZyb21Db29yZFN5c3RlbShjbSwgY29vcmRzLCBjb250ZXh0KSB7XG4gICAgaWYgKGNvbnRleHQgPT0gXCJkaXZcIikgcmV0dXJuIGNvb3JkcztcbiAgICB2YXIgbGVmdCA9IGNvb3Jkcy5sZWZ0LCB0b3AgPSBjb29yZHMudG9wO1xuICAgIC8vIEZpcnN0IG1vdmUgaW50byBcInBhZ2VcIiBjb29yZGluYXRlIHN5c3RlbVxuICAgIGlmIChjb250ZXh0ID09IFwicGFnZVwiKSB7XG4gICAgICBsZWZ0IC09IHBhZ2VTY3JvbGxYKCk7XG4gICAgICB0b3AgLT0gcGFnZVNjcm9sbFkoKTtcbiAgICB9IGVsc2UgaWYgKGNvbnRleHQgPT0gXCJsb2NhbFwiIHx8ICFjb250ZXh0KSB7XG4gICAgICB2YXIgbG9jYWxCb3ggPSBjbS5kaXNwbGF5LnNpemVyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgbGVmdCArPSBsb2NhbEJveC5sZWZ0O1xuICAgICAgdG9wICs9IGxvY2FsQm94LnRvcDtcbiAgICB9XG5cbiAgICB2YXIgbGluZVNwYWNlQm94ID0gY20uZGlzcGxheS5saW5lU3BhY2UuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgcmV0dXJuIHtsZWZ0OiBsZWZ0IC0gbGluZVNwYWNlQm94LmxlZnQsIHRvcDogdG9wIC0gbGluZVNwYWNlQm94LnRvcH07XG4gIH1cblxuICBmdW5jdGlvbiBjaGFyQ29vcmRzKGNtLCBwb3MsIGNvbnRleHQsIGxpbmVPYmosIGJpYXMpIHtcbiAgICBpZiAoIWxpbmVPYmopIGxpbmVPYmogPSBnZXRMaW5lKGNtLmRvYywgcG9zLmxpbmUpO1xuICAgIHJldHVybiBpbnRvQ29vcmRTeXN0ZW0oY20sIGxpbmVPYmosIG1lYXN1cmVDaGFyKGNtLCBsaW5lT2JqLCBwb3MuY2gsIGJpYXMpLCBjb250ZXh0KTtcbiAgfVxuXG4gIC8vIFJldHVybnMgYSBib3ggZm9yIGEgZ2l2ZW4gY3Vyc29yIHBvc2l0aW9uLCB3aGljaCBtYXkgaGF2ZSBhblxuICAvLyAnb3RoZXInIHByb3BlcnR5IGNvbnRhaW5pbmcgdGhlIHBvc2l0aW9uIG9mIHRoZSBzZWNvbmRhcnkgY3Vyc29yXG4gIC8vIG9uIGEgYmlkaSBib3VuZGFyeS5cbiAgZnVuY3Rpb24gY3Vyc29yQ29vcmRzKGNtLCBwb3MsIGNvbnRleHQsIGxpbmVPYmosIHByZXBhcmVkTWVhc3VyZSwgdmFySGVpZ2h0KSB7XG4gICAgbGluZU9iaiA9IGxpbmVPYmogfHwgZ2V0TGluZShjbS5kb2MsIHBvcy5saW5lKTtcbiAgICBpZiAoIXByZXBhcmVkTWVhc3VyZSkgcHJlcGFyZWRNZWFzdXJlID0gcHJlcGFyZU1lYXN1cmVGb3JMaW5lKGNtLCBsaW5lT2JqKTtcbiAgICBmdW5jdGlvbiBnZXQoY2gsIHJpZ2h0KSB7XG4gICAgICB2YXIgbSA9IG1lYXN1cmVDaGFyUHJlcGFyZWQoY20sIHByZXBhcmVkTWVhc3VyZSwgY2gsIHJpZ2h0ID8gXCJyaWdodFwiIDogXCJsZWZ0XCIsIHZhckhlaWdodCk7XG4gICAgICBpZiAocmlnaHQpIG0ubGVmdCA9IG0ucmlnaHQ7IGVsc2UgbS5yaWdodCA9IG0ubGVmdDtcbiAgICAgIHJldHVybiBpbnRvQ29vcmRTeXN0ZW0oY20sIGxpbmVPYmosIG0sIGNvbnRleHQpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBnZXRCaWRpKGNoLCBwYXJ0UG9zKSB7XG4gICAgICB2YXIgcGFydCA9IG9yZGVyW3BhcnRQb3NdLCByaWdodCA9IHBhcnQubGV2ZWwgJSAyO1xuICAgICAgaWYgKGNoID09IGJpZGlMZWZ0KHBhcnQpICYmIHBhcnRQb3MgJiYgcGFydC5sZXZlbCA8IG9yZGVyW3BhcnRQb3MgLSAxXS5sZXZlbCkge1xuICAgICAgICBwYXJ0ID0gb3JkZXJbLS1wYXJ0UG9zXTtcbiAgICAgICAgY2ggPSBiaWRpUmlnaHQocGFydCkgLSAocGFydC5sZXZlbCAlIDIgPyAwIDogMSk7XG4gICAgICAgIHJpZ2h0ID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZiAoY2ggPT0gYmlkaVJpZ2h0KHBhcnQpICYmIHBhcnRQb3MgPCBvcmRlci5sZW5ndGggLSAxICYmIHBhcnQubGV2ZWwgPCBvcmRlcltwYXJ0UG9zICsgMV0ubGV2ZWwpIHtcbiAgICAgICAgcGFydCA9IG9yZGVyWysrcGFydFBvc107XG4gICAgICAgIGNoID0gYmlkaUxlZnQocGFydCkgLSBwYXJ0LmxldmVsICUgMjtcbiAgICAgICAgcmlnaHQgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmIChyaWdodCAmJiBjaCA9PSBwYXJ0LnRvICYmIGNoID4gcGFydC5mcm9tKSByZXR1cm4gZ2V0KGNoIC0gMSk7XG4gICAgICByZXR1cm4gZ2V0KGNoLCByaWdodCk7XG4gICAgfVxuICAgIHZhciBvcmRlciA9IGdldE9yZGVyKGxpbmVPYmopLCBjaCA9IHBvcy5jaDtcbiAgICBpZiAoIW9yZGVyKSByZXR1cm4gZ2V0KGNoKTtcbiAgICB2YXIgcGFydFBvcyA9IGdldEJpZGlQYXJ0QXQob3JkZXIsIGNoKTtcbiAgICB2YXIgdmFsID0gZ2V0QmlkaShjaCwgcGFydFBvcyk7XG4gICAgaWYgKGJpZGlPdGhlciAhPSBudWxsKSB2YWwub3RoZXIgPSBnZXRCaWRpKGNoLCBiaWRpT3RoZXIpO1xuICAgIHJldHVybiB2YWw7XG4gIH1cblxuICAvLyBVc2VkIHRvIGNoZWFwbHkgZXN0aW1hdGUgdGhlIGNvb3JkaW5hdGVzIGZvciBhIHBvc2l0aW9uLiBVc2VkIGZvclxuICAvLyBpbnRlcm1lZGlhdGUgc2Nyb2xsIHVwZGF0ZXMuXG4gIGZ1bmN0aW9uIGVzdGltYXRlQ29vcmRzKGNtLCBwb3MpIHtcbiAgICB2YXIgbGVmdCA9IDAsIHBvcyA9IGNsaXBQb3MoY20uZG9jLCBwb3MpO1xuICAgIGlmICghY20ub3B0aW9ucy5saW5lV3JhcHBpbmcpIGxlZnQgPSBjaGFyV2lkdGgoY20uZGlzcGxheSkgKiBwb3MuY2g7XG4gICAgdmFyIGxpbmVPYmogPSBnZXRMaW5lKGNtLmRvYywgcG9zLmxpbmUpO1xuICAgIHZhciB0b3AgPSBoZWlnaHRBdExpbmUobGluZU9iaikgKyBwYWRkaW5nVG9wKGNtLmRpc3BsYXkpO1xuICAgIHJldHVybiB7bGVmdDogbGVmdCwgcmlnaHQ6IGxlZnQsIHRvcDogdG9wLCBib3R0b206IHRvcCArIGxpbmVPYmouaGVpZ2h0fTtcbiAgfVxuXG4gIC8vIFBvc2l0aW9ucyByZXR1cm5lZCBieSBjb29yZHNDaGFyIGNvbnRhaW4gc29tZSBleHRyYSBpbmZvcm1hdGlvbi5cbiAgLy8geFJlbCBpcyB0aGUgcmVsYXRpdmUgeCBwb3NpdGlvbiBvZiB0aGUgaW5wdXQgY29vcmRpbmF0ZXMgY29tcGFyZWRcbiAgLy8gdG8gdGhlIGZvdW5kIHBvc2l0aW9uIChzbyB4UmVsID4gMCBtZWFucyB0aGUgY29vcmRpbmF0ZXMgYXJlIHRvXG4gIC8vIHRoZSByaWdodCBvZiB0aGUgY2hhcmFjdGVyIHBvc2l0aW9uLCBmb3IgZXhhbXBsZSkuIFdoZW4gb3V0c2lkZVxuICAvLyBpcyB0cnVlLCB0aGF0IG1lYW5zIHRoZSBjb29yZGluYXRlcyBsaWUgb3V0c2lkZSB0aGUgbGluZSdzXG4gIC8vIHZlcnRpY2FsIHJhbmdlLlxuICBmdW5jdGlvbiBQb3NXaXRoSW5mbyhsaW5lLCBjaCwgb3V0c2lkZSwgeFJlbCkge1xuICAgIHZhciBwb3MgPSBQb3MobGluZSwgY2gpO1xuICAgIHBvcy54UmVsID0geFJlbDtcbiAgICBpZiAob3V0c2lkZSkgcG9zLm91dHNpZGUgPSB0cnVlO1xuICAgIHJldHVybiBwb3M7XG4gIH1cblxuICAvLyBDb21wdXRlIHRoZSBjaGFyYWN0ZXIgcG9zaXRpb24gY2xvc2VzdCB0byB0aGUgZ2l2ZW4gY29vcmRpbmF0ZXMuXG4gIC8vIElucHV0IG11c3QgYmUgbGluZVNwYWNlLWxvY2FsIChcImRpdlwiIGNvb3JkaW5hdGUgc3lzdGVtKS5cbiAgZnVuY3Rpb24gY29vcmRzQ2hhcihjbSwgeCwgeSkge1xuICAgIHZhciBkb2MgPSBjbS5kb2M7XG4gICAgeSArPSBjbS5kaXNwbGF5LnZpZXdPZmZzZXQ7XG4gICAgaWYgKHkgPCAwKSByZXR1cm4gUG9zV2l0aEluZm8oZG9jLmZpcnN0LCAwLCB0cnVlLCAtMSk7XG4gICAgdmFyIGxpbmVOID0gbGluZUF0SGVpZ2h0KGRvYywgeSksIGxhc3QgPSBkb2MuZmlyc3QgKyBkb2Muc2l6ZSAtIDE7XG4gICAgaWYgKGxpbmVOID4gbGFzdClcbiAgICAgIHJldHVybiBQb3NXaXRoSW5mbyhkb2MuZmlyc3QgKyBkb2Muc2l6ZSAtIDEsIGdldExpbmUoZG9jLCBsYXN0KS50ZXh0Lmxlbmd0aCwgdHJ1ZSwgMSk7XG4gICAgaWYgKHggPCAwKSB4ID0gMDtcblxuICAgIHZhciBsaW5lT2JqID0gZ2V0TGluZShkb2MsIGxpbmVOKTtcbiAgICBmb3IgKDs7KSB7XG4gICAgICB2YXIgZm91bmQgPSBjb29yZHNDaGFySW5uZXIoY20sIGxpbmVPYmosIGxpbmVOLCB4LCB5KTtcbiAgICAgIHZhciBtZXJnZWQgPSBjb2xsYXBzZWRTcGFuQXRFbmQobGluZU9iaik7XG4gICAgICB2YXIgbWVyZ2VkUG9zID0gbWVyZ2VkICYmIG1lcmdlZC5maW5kKDAsIHRydWUpO1xuICAgICAgaWYgKG1lcmdlZCAmJiAoZm91bmQuY2ggPiBtZXJnZWRQb3MuZnJvbS5jaCB8fCBmb3VuZC5jaCA9PSBtZXJnZWRQb3MuZnJvbS5jaCAmJiBmb3VuZC54UmVsID4gMCkpXG4gICAgICAgIGxpbmVOID0gbGluZU5vKGxpbmVPYmogPSBtZXJnZWRQb3MudG8ubGluZSk7XG4gICAgICBlbHNlXG4gICAgICAgIHJldHVybiBmb3VuZDtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBjb29yZHNDaGFySW5uZXIoY20sIGxpbmVPYmosIGxpbmVObywgeCwgeSkge1xuICAgIHZhciBpbm5lck9mZiA9IHkgLSBoZWlnaHRBdExpbmUobGluZU9iaik7XG4gICAgdmFyIHdyb25nTGluZSA9IGZhbHNlLCBhZGp1c3QgPSAyICogY20uZGlzcGxheS53cmFwcGVyLmNsaWVudFdpZHRoO1xuICAgIHZhciBwcmVwYXJlZE1lYXN1cmUgPSBwcmVwYXJlTWVhc3VyZUZvckxpbmUoY20sIGxpbmVPYmopO1xuXG4gICAgZnVuY3Rpb24gZ2V0WChjaCkge1xuICAgICAgdmFyIHNwID0gY3Vyc29yQ29vcmRzKGNtLCBQb3MobGluZU5vLCBjaCksIFwibGluZVwiLCBsaW5lT2JqLCBwcmVwYXJlZE1lYXN1cmUpO1xuICAgICAgd3JvbmdMaW5lID0gdHJ1ZTtcbiAgICAgIGlmIChpbm5lck9mZiA+IHNwLmJvdHRvbSkgcmV0dXJuIHNwLmxlZnQgLSBhZGp1c3Q7XG4gICAgICBlbHNlIGlmIChpbm5lck9mZiA8IHNwLnRvcCkgcmV0dXJuIHNwLmxlZnQgKyBhZGp1c3Q7XG4gICAgICBlbHNlIHdyb25nTGluZSA9IGZhbHNlO1xuICAgICAgcmV0dXJuIHNwLmxlZnQ7XG4gICAgfVxuXG4gICAgdmFyIGJpZGkgPSBnZXRPcmRlcihsaW5lT2JqKSwgZGlzdCA9IGxpbmVPYmoudGV4dC5sZW5ndGg7XG4gICAgdmFyIGZyb20gPSBsaW5lTGVmdChsaW5lT2JqKSwgdG8gPSBsaW5lUmlnaHQobGluZU9iaik7XG4gICAgdmFyIGZyb21YID0gZ2V0WChmcm9tKSwgZnJvbU91dHNpZGUgPSB3cm9uZ0xpbmUsIHRvWCA9IGdldFgodG8pLCB0b091dHNpZGUgPSB3cm9uZ0xpbmU7XG5cbiAgICBpZiAoeCA+IHRvWCkgcmV0dXJuIFBvc1dpdGhJbmZvKGxpbmVObywgdG8sIHRvT3V0c2lkZSwgMSk7XG4gICAgLy8gRG8gYSBiaW5hcnkgc2VhcmNoIGJldHdlZW4gdGhlc2UgYm91bmRzLlxuICAgIGZvciAoOzspIHtcbiAgICAgIGlmIChiaWRpID8gdG8gPT0gZnJvbSB8fCB0byA9PSBtb3ZlVmlzdWFsbHkobGluZU9iaiwgZnJvbSwgMSkgOiB0byAtIGZyb20gPD0gMSkge1xuICAgICAgICB2YXIgY2ggPSB4IDwgZnJvbVggfHwgeCAtIGZyb21YIDw9IHRvWCAtIHggPyBmcm9tIDogdG87XG4gICAgICAgIHZhciB4RGlmZiA9IHggLSAoY2ggPT0gZnJvbSA/IGZyb21YIDogdG9YKTtcbiAgICAgICAgd2hpbGUgKGlzRXh0ZW5kaW5nQ2hhcihsaW5lT2JqLnRleHQuY2hhckF0KGNoKSkpICsrY2g7XG4gICAgICAgIHZhciBwb3MgPSBQb3NXaXRoSW5mbyhsaW5lTm8sIGNoLCBjaCA9PSBmcm9tID8gZnJvbU91dHNpZGUgOiB0b091dHNpZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4RGlmZiA8IC0xID8gLTEgOiB4RGlmZiA+IDEgPyAxIDogMCk7XG4gICAgICAgIHJldHVybiBwb3M7XG4gICAgICB9XG4gICAgICB2YXIgc3RlcCA9IE1hdGguY2VpbChkaXN0IC8gMiksIG1pZGRsZSA9IGZyb20gKyBzdGVwO1xuICAgICAgaWYgKGJpZGkpIHtcbiAgICAgICAgbWlkZGxlID0gZnJvbTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdGVwOyArK2kpIG1pZGRsZSA9IG1vdmVWaXN1YWxseShsaW5lT2JqLCBtaWRkbGUsIDEpO1xuICAgICAgfVxuICAgICAgdmFyIG1pZGRsZVggPSBnZXRYKG1pZGRsZSk7XG4gICAgICBpZiAobWlkZGxlWCA+IHgpIHt0byA9IG1pZGRsZTsgdG9YID0gbWlkZGxlWDsgaWYgKHRvT3V0c2lkZSA9IHdyb25nTGluZSkgdG9YICs9IDEwMDA7IGRpc3QgPSBzdGVwO31cbiAgICAgIGVsc2Uge2Zyb20gPSBtaWRkbGU7IGZyb21YID0gbWlkZGxlWDsgZnJvbU91dHNpZGUgPSB3cm9uZ0xpbmU7IGRpc3QgLT0gc3RlcDt9XG4gICAgfVxuICB9XG5cbiAgdmFyIG1lYXN1cmVUZXh0O1xuICAvLyBDb21wdXRlIHRoZSBkZWZhdWx0IHRleHQgaGVpZ2h0LlxuICBmdW5jdGlvbiB0ZXh0SGVpZ2h0KGRpc3BsYXkpIHtcbiAgICBpZiAoZGlzcGxheS5jYWNoZWRUZXh0SGVpZ2h0ICE9IG51bGwpIHJldHVybiBkaXNwbGF5LmNhY2hlZFRleHRIZWlnaHQ7XG4gICAgaWYgKG1lYXN1cmVUZXh0ID09IG51bGwpIHtcbiAgICAgIG1lYXN1cmVUZXh0ID0gZWx0KFwicHJlXCIpO1xuICAgICAgLy8gTWVhc3VyZSBhIGJ1bmNoIG9mIGxpbmVzLCBmb3IgYnJvd3NlcnMgdGhhdCBjb21wdXRlXG4gICAgICAvLyBmcmFjdGlvbmFsIGhlaWdodHMuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDQ5OyArK2kpIHtcbiAgICAgICAgbWVhc3VyZVRleHQuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJ4XCIpKTtcbiAgICAgICAgbWVhc3VyZVRleHQuYXBwZW5kQ2hpbGQoZWx0KFwiYnJcIikpO1xuICAgICAgfVxuICAgICAgbWVhc3VyZVRleHQuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJ4XCIpKTtcbiAgICB9XG4gICAgcmVtb3ZlQ2hpbGRyZW5BbmRBZGQoZGlzcGxheS5tZWFzdXJlLCBtZWFzdXJlVGV4dCk7XG4gICAgdmFyIGhlaWdodCA9IG1lYXN1cmVUZXh0Lm9mZnNldEhlaWdodCAvIDUwO1xuICAgIGlmIChoZWlnaHQgPiAzKSBkaXNwbGF5LmNhY2hlZFRleHRIZWlnaHQgPSBoZWlnaHQ7XG4gICAgcmVtb3ZlQ2hpbGRyZW4oZGlzcGxheS5tZWFzdXJlKTtcbiAgICByZXR1cm4gaGVpZ2h0IHx8IDE7XG4gIH1cblxuICAvLyBDb21wdXRlIHRoZSBkZWZhdWx0IGNoYXJhY3RlciB3aWR0aC5cbiAgZnVuY3Rpb24gY2hhcldpZHRoKGRpc3BsYXkpIHtcbiAgICBpZiAoZGlzcGxheS5jYWNoZWRDaGFyV2lkdGggIT0gbnVsbCkgcmV0dXJuIGRpc3BsYXkuY2FjaGVkQ2hhcldpZHRoO1xuICAgIHZhciBhbmNob3IgPSBlbHQoXCJzcGFuXCIsIFwieHh4eHh4eHh4eFwiKTtcbiAgICB2YXIgcHJlID0gZWx0KFwicHJlXCIsIFthbmNob3JdKTtcbiAgICByZW1vdmVDaGlsZHJlbkFuZEFkZChkaXNwbGF5Lm1lYXN1cmUsIHByZSk7XG4gICAgdmFyIHJlY3QgPSBhbmNob3IuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksIHdpZHRoID0gKHJlY3QucmlnaHQgLSByZWN0LmxlZnQpIC8gMTA7XG4gICAgaWYgKHdpZHRoID4gMikgZGlzcGxheS5jYWNoZWRDaGFyV2lkdGggPSB3aWR0aDtcbiAgICByZXR1cm4gd2lkdGggfHwgMTA7XG4gIH1cblxuICAvLyBPUEVSQVRJT05TXG5cbiAgLy8gT3BlcmF0aW9ucyBhcmUgdXNlZCB0byB3cmFwIGEgc2VyaWVzIG9mIGNoYW5nZXMgdG8gdGhlIGVkaXRvclxuICAvLyBzdGF0ZSBpbiBzdWNoIGEgd2F5IHRoYXQgZWFjaCBjaGFuZ2Ugd29uJ3QgaGF2ZSB0byB1cGRhdGUgdGhlXG4gIC8vIGN1cnNvciBhbmQgZGlzcGxheSAod2hpY2ggd291bGQgYmUgYXdrd2FyZCwgc2xvdywgYW5kXG4gIC8vIGVycm9yLXByb25lKS4gSW5zdGVhZCwgZGlzcGxheSB1cGRhdGVzIGFyZSBiYXRjaGVkIGFuZCB0aGVuIGFsbFxuICAvLyBjb21iaW5lZCBhbmQgZXhlY3V0ZWQgYXQgb25jZS5cblxuICB2YXIgb3BlcmF0aW9uR3JvdXAgPSBudWxsO1xuXG4gIHZhciBuZXh0T3BJZCA9IDA7XG4gIC8vIFN0YXJ0IGEgbmV3IG9wZXJhdGlvbi5cbiAgZnVuY3Rpb24gc3RhcnRPcGVyYXRpb24oY20pIHtcbiAgICBjbS5jdXJPcCA9IHtcbiAgICAgIGNtOiBjbSxcbiAgICAgIHZpZXdDaGFuZ2VkOiBmYWxzZSwgICAgICAvLyBGbGFnIHRoYXQgaW5kaWNhdGVzIHRoYXQgbGluZXMgbWlnaHQgbmVlZCB0byBiZSByZWRyYXduXG4gICAgICBzdGFydEhlaWdodDogY20uZG9jLmhlaWdodCwgLy8gVXNlZCB0byBkZXRlY3QgbmVlZCB0byB1cGRhdGUgc2Nyb2xsYmFyXG4gICAgICBmb3JjZVVwZGF0ZTogZmFsc2UsICAgICAgLy8gVXNlZCB0byBmb3JjZSBhIHJlZHJhd1xuICAgICAgdXBkYXRlSW5wdXQ6IG51bGwsICAgICAgIC8vIFdoZXRoZXIgdG8gcmVzZXQgdGhlIGlucHV0IHRleHRhcmVhXG4gICAgICB0eXBpbmc6IGZhbHNlLCAgICAgICAgICAgLy8gV2hldGhlciB0aGlzIHJlc2V0IHNob3VsZCBiZSBjYXJlZnVsIHRvIGxlYXZlIGV4aXN0aW5nIHRleHQgKGZvciBjb21wb3NpdGluZylcbiAgICAgIGNoYW5nZU9ianM6IG51bGwsICAgICAgICAvLyBBY2N1bXVsYXRlZCBjaGFuZ2VzLCBmb3IgZmlyaW5nIGNoYW5nZSBldmVudHNcbiAgICAgIGN1cnNvckFjdGl2aXR5SGFuZGxlcnM6IG51bGwsIC8vIFNldCBvZiBoYW5kbGVycyB0byBmaXJlIGN1cnNvckFjdGl2aXR5IG9uXG4gICAgICBjdXJzb3JBY3Rpdml0eUNhbGxlZDogMCwgLy8gVHJhY2tzIHdoaWNoIGN1cnNvckFjdGl2aXR5IGhhbmRsZXJzIGhhdmUgYmVlbiBjYWxsZWQgYWxyZWFkeVxuICAgICAgc2VsZWN0aW9uQ2hhbmdlZDogZmFsc2UsIC8vIFdoZXRoZXIgdGhlIHNlbGVjdGlvbiBuZWVkcyB0byBiZSByZWRyYXduXG4gICAgICB1cGRhdGVNYXhMaW5lOiBmYWxzZSwgICAgLy8gU2V0IHdoZW4gdGhlIHdpZGVzdCBsaW5lIG5lZWRzIHRvIGJlIGRldGVybWluZWQgYW5ld1xuICAgICAgc2Nyb2xsTGVmdDogbnVsbCwgc2Nyb2xsVG9wOiBudWxsLCAvLyBJbnRlcm1lZGlhdGUgc2Nyb2xsIHBvc2l0aW9uLCBub3QgcHVzaGVkIHRvIERPTSB5ZXRcbiAgICAgIHNjcm9sbFRvUG9zOiBudWxsLCAgICAgICAvLyBVc2VkIHRvIHNjcm9sbCB0byBhIHNwZWNpZmljIHBvc2l0aW9uXG4gICAgICBmb2N1czogZmFsc2UsXG4gICAgICBpZDogKytuZXh0T3BJZCAgICAgICAgICAgLy8gVW5pcXVlIElEXG4gICAgfTtcbiAgICBpZiAob3BlcmF0aW9uR3JvdXApIHtcbiAgICAgIG9wZXJhdGlvbkdyb3VwLm9wcy5wdXNoKGNtLmN1ck9wKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY20uY3VyT3Aub3duc0dyb3VwID0gb3BlcmF0aW9uR3JvdXAgPSB7XG4gICAgICAgIG9wczogW2NtLmN1ck9wXSxcbiAgICAgICAgZGVsYXllZENhbGxiYWNrczogW11cbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZmlyZUNhbGxiYWNrc0Zvck9wcyhncm91cCkge1xuICAgIC8vIENhbGxzIGRlbGF5ZWQgY2FsbGJhY2tzIGFuZCBjdXJzb3JBY3Rpdml0eSBoYW5kbGVycyB1bnRpbCBub1xuICAgIC8vIG5ldyBvbmVzIGFwcGVhclxuICAgIHZhciBjYWxsYmFja3MgPSBncm91cC5kZWxheWVkQ2FsbGJhY2tzLCBpID0gMDtcbiAgICBkbyB7XG4gICAgICBmb3IgKDsgaSA8IGNhbGxiYWNrcy5sZW5ndGg7IGkrKylcbiAgICAgICAgY2FsbGJhY2tzW2ldLmNhbGwobnVsbCk7XG4gICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGdyb3VwLm9wcy5sZW5ndGg7IGorKykge1xuICAgICAgICB2YXIgb3AgPSBncm91cC5vcHNbal07XG4gICAgICAgIGlmIChvcC5jdXJzb3JBY3Rpdml0eUhhbmRsZXJzKVxuICAgICAgICAgIHdoaWxlIChvcC5jdXJzb3JBY3Rpdml0eUNhbGxlZCA8IG9wLmN1cnNvckFjdGl2aXR5SGFuZGxlcnMubGVuZ3RoKVxuICAgICAgICAgICAgb3AuY3Vyc29yQWN0aXZpdHlIYW5kbGVyc1tvcC5jdXJzb3JBY3Rpdml0eUNhbGxlZCsrXS5jYWxsKG51bGwsIG9wLmNtKTtcbiAgICAgIH1cbiAgICB9IHdoaWxlIChpIDwgY2FsbGJhY2tzLmxlbmd0aCk7XG4gIH1cblxuICAvLyBGaW5pc2ggYW4gb3BlcmF0aW9uLCB1cGRhdGluZyB0aGUgZGlzcGxheSBhbmQgc2lnbmFsbGluZyBkZWxheWVkIGV2ZW50c1xuICBmdW5jdGlvbiBlbmRPcGVyYXRpb24oY20pIHtcbiAgICB2YXIgb3AgPSBjbS5jdXJPcCwgZ3JvdXAgPSBvcC5vd25zR3JvdXA7XG4gICAgaWYgKCFncm91cCkgcmV0dXJuO1xuXG4gICAgdHJ5IHsgZmlyZUNhbGxiYWNrc0Zvck9wcyhncm91cCk7IH1cbiAgICBmaW5hbGx5IHtcbiAgICAgIG9wZXJhdGlvbkdyb3VwID0gbnVsbDtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZ3JvdXAub3BzLmxlbmd0aDsgaSsrKVxuICAgICAgICBncm91cC5vcHNbaV0uY20uY3VyT3AgPSBudWxsO1xuICAgICAgZW5kT3BlcmF0aW9ucyhncm91cCk7XG4gICAgfVxuICB9XG5cbiAgLy8gVGhlIERPTSB1cGRhdGVzIGRvbmUgd2hlbiBhbiBvcGVyYXRpb24gZmluaXNoZXMgYXJlIGJhdGNoZWQgc29cbiAgLy8gdGhhdCB0aGUgbWluaW11bSBudW1iZXIgb2YgcmVsYXlvdXRzIGFyZSByZXF1aXJlZC5cbiAgZnVuY3Rpb24gZW5kT3BlcmF0aW9ucyhncm91cCkge1xuICAgIHZhciBvcHMgPSBncm91cC5vcHM7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvcHMubGVuZ3RoOyBpKyspIC8vIFJlYWQgRE9NXG4gICAgICBlbmRPcGVyYXRpb25fUjEob3BzW2ldKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9wcy5sZW5ndGg7IGkrKykgLy8gV3JpdGUgRE9NIChtYXliZSlcbiAgICAgIGVuZE9wZXJhdGlvbl9XMShvcHNbaV0pO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3BzLmxlbmd0aDsgaSsrKSAvLyBSZWFkIERPTVxuICAgICAgZW5kT3BlcmF0aW9uX1IyKG9wc1tpXSk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvcHMubGVuZ3RoOyBpKyspIC8vIFdyaXRlIERPTSAobWF5YmUpXG4gICAgICBlbmRPcGVyYXRpb25fVzIob3BzW2ldKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9wcy5sZW5ndGg7IGkrKykgLy8gUmVhZCBET01cbiAgICAgIGVuZE9wZXJhdGlvbl9maW5pc2gob3BzW2ldKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGVuZE9wZXJhdGlvbl9SMShvcCkge1xuICAgIHZhciBjbSA9IG9wLmNtLCBkaXNwbGF5ID0gY20uZGlzcGxheTtcbiAgICBtYXliZUNsaXBTY3JvbGxiYXJzKGNtKTtcbiAgICBpZiAob3AudXBkYXRlTWF4TGluZSkgZmluZE1heExpbmUoY20pO1xuXG4gICAgb3AubXVzdFVwZGF0ZSA9IG9wLnZpZXdDaGFuZ2VkIHx8IG9wLmZvcmNlVXBkYXRlIHx8IG9wLnNjcm9sbFRvcCAhPSBudWxsIHx8XG4gICAgICBvcC5zY3JvbGxUb1BvcyAmJiAob3Auc2Nyb2xsVG9Qb3MuZnJvbS5saW5lIDwgZGlzcGxheS52aWV3RnJvbSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgIG9wLnNjcm9sbFRvUG9zLnRvLmxpbmUgPj0gZGlzcGxheS52aWV3VG8pIHx8XG4gICAgICBkaXNwbGF5Lm1heExpbmVDaGFuZ2VkICYmIGNtLm9wdGlvbnMubGluZVdyYXBwaW5nO1xuICAgIG9wLnVwZGF0ZSA9IG9wLm11c3RVcGRhdGUgJiZcbiAgICAgIG5ldyBEaXNwbGF5VXBkYXRlKGNtLCBvcC5tdXN0VXBkYXRlICYmIHt0b3A6IG9wLnNjcm9sbFRvcCwgZW5zdXJlOiBvcC5zY3JvbGxUb1Bvc30sIG9wLmZvcmNlVXBkYXRlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGVuZE9wZXJhdGlvbl9XMShvcCkge1xuICAgIG9wLnVwZGF0ZWREaXNwbGF5ID0gb3AubXVzdFVwZGF0ZSAmJiB1cGRhdGVEaXNwbGF5SWZOZWVkZWQob3AuY20sIG9wLnVwZGF0ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBlbmRPcGVyYXRpb25fUjIob3ApIHtcbiAgICB2YXIgY20gPSBvcC5jbSwgZGlzcGxheSA9IGNtLmRpc3BsYXk7XG4gICAgaWYgKG9wLnVwZGF0ZWREaXNwbGF5KSB1cGRhdGVIZWlnaHRzSW5WaWV3cG9ydChjbSk7XG5cbiAgICBvcC5iYXJNZWFzdXJlID0gbWVhc3VyZUZvclNjcm9sbGJhcnMoY20pO1xuXG4gICAgLy8gSWYgdGhlIG1heCBsaW5lIGNoYW5nZWQgc2luY2UgaXQgd2FzIGxhc3QgbWVhc3VyZWQsIG1lYXN1cmUgaXQsXG4gICAgLy8gYW5kIGVuc3VyZSB0aGUgZG9jdW1lbnQncyB3aWR0aCBtYXRjaGVzIGl0LlxuICAgIC8vIHVwZGF0ZURpc3BsYXlfVzIgd2lsbCB1c2UgdGhlc2UgcHJvcGVydGllcyB0byBkbyB0aGUgYWN0dWFsIHJlc2l6aW5nXG4gICAgaWYgKGRpc3BsYXkubWF4TGluZUNoYW5nZWQgJiYgIWNtLm9wdGlvbnMubGluZVdyYXBwaW5nKSB7XG4gICAgICBvcC5hZGp1c3RXaWR0aFRvID0gbWVhc3VyZUNoYXIoY20sIGRpc3BsYXkubWF4TGluZSwgZGlzcGxheS5tYXhMaW5lLnRleHQubGVuZ3RoKS5sZWZ0ICsgMztcbiAgICAgIGNtLmRpc3BsYXkuc2l6ZXJXaWR0aCA9IG9wLmFkanVzdFdpZHRoVG87XG4gICAgICBvcC5iYXJNZWFzdXJlLnNjcm9sbFdpZHRoID1cbiAgICAgICAgTWF0aC5tYXgoZGlzcGxheS5zY3JvbGxlci5jbGllbnRXaWR0aCwgZGlzcGxheS5zaXplci5vZmZzZXRMZWZ0ICsgb3AuYWRqdXN0V2lkdGhUbyArIHNjcm9sbEdhcChjbSkgKyBjbS5kaXNwbGF5LmJhcldpZHRoKTtcbiAgICAgIG9wLm1heFNjcm9sbExlZnQgPSBNYXRoLm1heCgwLCBkaXNwbGF5LnNpemVyLm9mZnNldExlZnQgKyBvcC5hZGp1c3RXaWR0aFRvIC0gZGlzcGxheVdpZHRoKGNtKSk7XG4gICAgfVxuXG4gICAgaWYgKG9wLnVwZGF0ZWREaXNwbGF5IHx8IG9wLnNlbGVjdGlvbkNoYW5nZWQpXG4gICAgICBvcC5wcmVwYXJlZFNlbGVjdGlvbiA9IGRpc3BsYXkuaW5wdXQucHJlcGFyZVNlbGVjdGlvbigpO1xuICB9XG5cbiAgZnVuY3Rpb24gZW5kT3BlcmF0aW9uX1cyKG9wKSB7XG4gICAgdmFyIGNtID0gb3AuY207XG5cbiAgICBpZiAob3AuYWRqdXN0V2lkdGhUbyAhPSBudWxsKSB7XG4gICAgICBjbS5kaXNwbGF5LnNpemVyLnN0eWxlLm1pbldpZHRoID0gb3AuYWRqdXN0V2lkdGhUbyArIFwicHhcIjtcbiAgICAgIGlmIChvcC5tYXhTY3JvbGxMZWZ0IDwgY20uZG9jLnNjcm9sbExlZnQpXG4gICAgICAgIHNldFNjcm9sbExlZnQoY20sIE1hdGgubWluKGNtLmRpc3BsYXkuc2Nyb2xsZXIuc2Nyb2xsTGVmdCwgb3AubWF4U2Nyb2xsTGVmdCksIHRydWUpO1xuICAgICAgY20uZGlzcGxheS5tYXhMaW5lQ2hhbmdlZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIGlmIChvcC5wcmVwYXJlZFNlbGVjdGlvbilcbiAgICAgIGNtLmRpc3BsYXkuaW5wdXQuc2hvd1NlbGVjdGlvbihvcC5wcmVwYXJlZFNlbGVjdGlvbik7XG4gICAgaWYgKG9wLnVwZGF0ZWREaXNwbGF5KVxuICAgICAgc2V0RG9jdW1lbnRIZWlnaHQoY20sIG9wLmJhck1lYXN1cmUpO1xuICAgIGlmIChvcC51cGRhdGVkRGlzcGxheSB8fCBvcC5zdGFydEhlaWdodCAhPSBjbS5kb2MuaGVpZ2h0KVxuICAgICAgdXBkYXRlU2Nyb2xsYmFycyhjbSwgb3AuYmFyTWVhc3VyZSk7XG5cbiAgICBpZiAob3Auc2VsZWN0aW9uQ2hhbmdlZCkgcmVzdGFydEJsaW5rKGNtKTtcblxuICAgIGlmIChjbS5zdGF0ZS5mb2N1c2VkICYmIG9wLnVwZGF0ZUlucHV0KVxuICAgICAgY20uZGlzcGxheS5pbnB1dC5yZXNldChvcC50eXBpbmcpO1xuICAgIGlmIChvcC5mb2N1cyAmJiBvcC5mb2N1cyA9PSBhY3RpdmVFbHQoKSAmJiAoIWRvY3VtZW50Lmhhc0ZvY3VzIHx8IGRvY3VtZW50Lmhhc0ZvY3VzKCkpKVxuICAgICAgZW5zdXJlRm9jdXMob3AuY20pO1xuICB9XG5cbiAgZnVuY3Rpb24gZW5kT3BlcmF0aW9uX2ZpbmlzaChvcCkge1xuICAgIHZhciBjbSA9IG9wLmNtLCBkaXNwbGF5ID0gY20uZGlzcGxheSwgZG9jID0gY20uZG9jO1xuXG4gICAgaWYgKG9wLnVwZGF0ZWREaXNwbGF5KSBwb3N0VXBkYXRlRGlzcGxheShjbSwgb3AudXBkYXRlKTtcblxuICAgIC8vIEFib3J0IG1vdXNlIHdoZWVsIGRlbHRhIG1lYXN1cmVtZW50LCB3aGVuIHNjcm9sbGluZyBleHBsaWNpdGx5XG4gICAgaWYgKGRpc3BsYXkud2hlZWxTdGFydFggIT0gbnVsbCAmJiAob3Auc2Nyb2xsVG9wICE9IG51bGwgfHwgb3Auc2Nyb2xsTGVmdCAhPSBudWxsIHx8IG9wLnNjcm9sbFRvUG9zKSlcbiAgICAgIGRpc3BsYXkud2hlZWxTdGFydFggPSBkaXNwbGF5LndoZWVsU3RhcnRZID0gbnVsbDtcblxuICAgIC8vIFByb3BhZ2F0ZSB0aGUgc2Nyb2xsIHBvc2l0aW9uIHRvIHRoZSBhY3R1YWwgRE9NIHNjcm9sbGVyXG4gICAgaWYgKG9wLnNjcm9sbFRvcCAhPSBudWxsICYmIChkaXNwbGF5LnNjcm9sbGVyLnNjcm9sbFRvcCAhPSBvcC5zY3JvbGxUb3AgfHwgb3AuZm9yY2VTY3JvbGwpKSB7XG4gICAgICBkb2Muc2Nyb2xsVG9wID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oZGlzcGxheS5zY3JvbGxlci5zY3JvbGxIZWlnaHQgLSBkaXNwbGF5LnNjcm9sbGVyLmNsaWVudEhlaWdodCwgb3Auc2Nyb2xsVG9wKSk7XG4gICAgICBkaXNwbGF5LnNjcm9sbGJhcnMuc2V0U2Nyb2xsVG9wKGRvYy5zY3JvbGxUb3ApO1xuICAgICAgZGlzcGxheS5zY3JvbGxlci5zY3JvbGxUb3AgPSBkb2Muc2Nyb2xsVG9wO1xuICAgIH1cbiAgICBpZiAob3Auc2Nyb2xsTGVmdCAhPSBudWxsICYmIChkaXNwbGF5LnNjcm9sbGVyLnNjcm9sbExlZnQgIT0gb3Auc2Nyb2xsTGVmdCB8fCBvcC5mb3JjZVNjcm9sbCkpIHtcbiAgICAgIGRvYy5zY3JvbGxMZWZ0ID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oZGlzcGxheS5zY3JvbGxlci5zY3JvbGxXaWR0aCAtIGRpc3BsYXlXaWR0aChjbSksIG9wLnNjcm9sbExlZnQpKTtcbiAgICAgIGRpc3BsYXkuc2Nyb2xsYmFycy5zZXRTY3JvbGxMZWZ0KGRvYy5zY3JvbGxMZWZ0KTtcbiAgICAgIGRpc3BsYXkuc2Nyb2xsZXIuc2Nyb2xsTGVmdCA9IGRvYy5zY3JvbGxMZWZ0O1xuICAgICAgYWxpZ25Ib3Jpem9udGFsbHkoY20pO1xuICAgIH1cbiAgICAvLyBJZiB3ZSBuZWVkIHRvIHNjcm9sbCBhIHNwZWNpZmljIHBvc2l0aW9uIGludG8gdmlldywgZG8gc28uXG4gICAgaWYgKG9wLnNjcm9sbFRvUG9zKSB7XG4gICAgICB2YXIgY29vcmRzID0gc2Nyb2xsUG9zSW50b1ZpZXcoY20sIGNsaXBQb3MoZG9jLCBvcC5zY3JvbGxUb1Bvcy5mcm9tKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGlwUG9zKGRvYywgb3Auc2Nyb2xsVG9Qb3MudG8pLCBvcC5zY3JvbGxUb1Bvcy5tYXJnaW4pO1xuICAgICAgaWYgKG9wLnNjcm9sbFRvUG9zLmlzQ3Vyc29yICYmIGNtLnN0YXRlLmZvY3VzZWQpIG1heWJlU2Nyb2xsV2luZG93KGNtLCBjb29yZHMpO1xuICAgIH1cblxuICAgIC8vIEZpcmUgZXZlbnRzIGZvciBtYXJrZXJzIHRoYXQgYXJlIGhpZGRlbi91bmlkZGVuIGJ5IGVkaXRpbmcgb3JcbiAgICAvLyB1bmRvaW5nXG4gICAgdmFyIGhpZGRlbiA9IG9wLm1heWJlSGlkZGVuTWFya2VycywgdW5oaWRkZW4gPSBvcC5tYXliZVVuaGlkZGVuTWFya2VycztcbiAgICBpZiAoaGlkZGVuKSBmb3IgKHZhciBpID0gMDsgaSA8IGhpZGRlbi5sZW5ndGg7ICsraSlcbiAgICAgIGlmICghaGlkZGVuW2ldLmxpbmVzLmxlbmd0aCkgc2lnbmFsKGhpZGRlbltpXSwgXCJoaWRlXCIpO1xuICAgIGlmICh1bmhpZGRlbikgZm9yICh2YXIgaSA9IDA7IGkgPCB1bmhpZGRlbi5sZW5ndGg7ICsraSlcbiAgICAgIGlmICh1bmhpZGRlbltpXS5saW5lcy5sZW5ndGgpIHNpZ25hbCh1bmhpZGRlbltpXSwgXCJ1bmhpZGVcIik7XG5cbiAgICBpZiAoZGlzcGxheS53cmFwcGVyLm9mZnNldEhlaWdodClcbiAgICAgIGRvYy5zY3JvbGxUb3AgPSBjbS5kaXNwbGF5LnNjcm9sbGVyLnNjcm9sbFRvcDtcblxuICAgIC8vIEZpcmUgY2hhbmdlIGV2ZW50cywgYW5kIGRlbGF5ZWQgZXZlbnQgaGFuZGxlcnNcbiAgICBpZiAob3AuY2hhbmdlT2JqcylcbiAgICAgIHNpZ25hbChjbSwgXCJjaGFuZ2VzXCIsIGNtLCBvcC5jaGFuZ2VPYmpzKTtcbiAgICBpZiAob3AudXBkYXRlKVxuICAgICAgb3AudXBkYXRlLmZpbmlzaCgpO1xuICB9XG5cbiAgLy8gUnVuIHRoZSBnaXZlbiBmdW5jdGlvbiBpbiBhbiBvcGVyYXRpb25cbiAgZnVuY3Rpb24gcnVuSW5PcChjbSwgZikge1xuICAgIGlmIChjbS5jdXJPcCkgcmV0dXJuIGYoKTtcbiAgICBzdGFydE9wZXJhdGlvbihjbSk7XG4gICAgdHJ5IHsgcmV0dXJuIGYoKTsgfVxuICAgIGZpbmFsbHkgeyBlbmRPcGVyYXRpb24oY20pOyB9XG4gIH1cbiAgLy8gV3JhcHMgYSBmdW5jdGlvbiBpbiBhbiBvcGVyYXRpb24uIFJldHVybnMgdGhlIHdyYXBwZWQgZnVuY3Rpb24uXG4gIGZ1bmN0aW9uIG9wZXJhdGlvbihjbSwgZikge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIGlmIChjbS5jdXJPcCkgcmV0dXJuIGYuYXBwbHkoY20sIGFyZ3VtZW50cyk7XG4gICAgICBzdGFydE9wZXJhdGlvbihjbSk7XG4gICAgICB0cnkgeyByZXR1cm4gZi5hcHBseShjbSwgYXJndW1lbnRzKTsgfVxuICAgICAgZmluYWxseSB7IGVuZE9wZXJhdGlvbihjbSk7IH1cbiAgICB9O1xuICB9XG4gIC8vIFVzZWQgdG8gYWRkIG1ldGhvZHMgdG8gZWRpdG9yIGFuZCBkb2MgaW5zdGFuY2VzLCB3cmFwcGluZyB0aGVtIGluXG4gIC8vIG9wZXJhdGlvbnMuXG4gIGZ1bmN0aW9uIG1ldGhvZE9wKGYpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAodGhpcy5jdXJPcCkgcmV0dXJuIGYuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIHN0YXJ0T3BlcmF0aW9uKHRoaXMpO1xuICAgICAgdHJ5IHsgcmV0dXJuIGYuYXBwbHkodGhpcywgYXJndW1lbnRzKTsgfVxuICAgICAgZmluYWxseSB7IGVuZE9wZXJhdGlvbih0aGlzKTsgfVxuICAgIH07XG4gIH1cbiAgZnVuY3Rpb24gZG9jTWV0aG9kT3AoZikge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBjbSA9IHRoaXMuY207XG4gICAgICBpZiAoIWNtIHx8IGNtLmN1ck9wKSByZXR1cm4gZi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgc3RhcnRPcGVyYXRpb24oY20pO1xuICAgICAgdHJ5IHsgcmV0dXJuIGYuYXBwbHkodGhpcywgYXJndW1lbnRzKTsgfVxuICAgICAgZmluYWxseSB7IGVuZE9wZXJhdGlvbihjbSk7IH1cbiAgICB9O1xuICB9XG5cbiAgLy8gVklFVyBUUkFDS0lOR1xuXG4gIC8vIFRoZXNlIG9iamVjdHMgYXJlIHVzZWQgdG8gcmVwcmVzZW50IHRoZSB2aXNpYmxlIChjdXJyZW50bHkgZHJhd24pXG4gIC8vIHBhcnQgb2YgdGhlIGRvY3VtZW50LiBBIExpbmVWaWV3IG1heSBjb3JyZXNwb25kIHRvIG11bHRpcGxlXG4gIC8vIGxvZ2ljYWwgbGluZXMsIGlmIHRob3NlIGFyZSBjb25uZWN0ZWQgYnkgY29sbGFwc2VkIHJhbmdlcy5cbiAgZnVuY3Rpb24gTGluZVZpZXcoZG9jLCBsaW5lLCBsaW5lTikge1xuICAgIC8vIFRoZSBzdGFydGluZyBsaW5lXG4gICAgdGhpcy5saW5lID0gbGluZTtcbiAgICAvLyBDb250aW51aW5nIGxpbmVzLCBpZiBhbnlcbiAgICB0aGlzLnJlc3QgPSB2aXN1YWxMaW5lQ29udGludWVkKGxpbmUpO1xuICAgIC8vIE51bWJlciBvZiBsb2dpY2FsIGxpbmVzIGluIHRoaXMgdmlzdWFsIGxpbmVcbiAgICB0aGlzLnNpemUgPSB0aGlzLnJlc3QgPyBsaW5lTm8obHN0KHRoaXMucmVzdCkpIC0gbGluZU4gKyAxIDogMTtcbiAgICB0aGlzLm5vZGUgPSB0aGlzLnRleHQgPSBudWxsO1xuICAgIHRoaXMuaGlkZGVuID0gbGluZUlzSGlkZGVuKGRvYywgbGluZSk7XG4gIH1cblxuICAvLyBDcmVhdGUgYSByYW5nZSBvZiBMaW5lVmlldyBvYmplY3RzIGZvciB0aGUgZ2l2ZW4gbGluZXMuXG4gIGZ1bmN0aW9uIGJ1aWxkVmlld0FycmF5KGNtLCBmcm9tLCB0bykge1xuICAgIHZhciBhcnJheSA9IFtdLCBuZXh0UG9zO1xuICAgIGZvciAodmFyIHBvcyA9IGZyb207IHBvcyA8IHRvOyBwb3MgPSBuZXh0UG9zKSB7XG4gICAgICB2YXIgdmlldyA9IG5ldyBMaW5lVmlldyhjbS5kb2MsIGdldExpbmUoY20uZG9jLCBwb3MpLCBwb3MpO1xuICAgICAgbmV4dFBvcyA9IHBvcyArIHZpZXcuc2l6ZTtcbiAgICAgIGFycmF5LnB1c2godmlldyk7XG4gICAgfVxuICAgIHJldHVybiBhcnJheTtcbiAgfVxuXG4gIC8vIFVwZGF0ZXMgdGhlIGRpc3BsYXkudmlldyBkYXRhIHN0cnVjdHVyZSBmb3IgYSBnaXZlbiBjaGFuZ2UgdG8gdGhlXG4gIC8vIGRvY3VtZW50LiBGcm9tIGFuZCB0byBhcmUgaW4gcHJlLWNoYW5nZSBjb29yZGluYXRlcy4gTGVuZGlmZiBpc1xuICAvLyB0aGUgYW1vdW50IG9mIGxpbmVzIGFkZGVkIG9yIHN1YnRyYWN0ZWQgYnkgdGhlIGNoYW5nZS4gVGhpcyBpc1xuICAvLyB1c2VkIGZvciBjaGFuZ2VzIHRoYXQgc3BhbiBtdWx0aXBsZSBsaW5lcywgb3IgY2hhbmdlIHRoZSB3YXlcbiAgLy8gbGluZXMgYXJlIGRpdmlkZWQgaW50byB2aXN1YWwgbGluZXMuIHJlZ0xpbmVDaGFuZ2UgKGJlbG93KVxuICAvLyByZWdpc3RlcnMgc2luZ2xlLWxpbmUgY2hhbmdlcy5cbiAgZnVuY3Rpb24gcmVnQ2hhbmdlKGNtLCBmcm9tLCB0bywgbGVuZGlmZikge1xuICAgIGlmIChmcm9tID09IG51bGwpIGZyb20gPSBjbS5kb2MuZmlyc3Q7XG4gICAgaWYgKHRvID09IG51bGwpIHRvID0gY20uZG9jLmZpcnN0ICsgY20uZG9jLnNpemU7XG4gICAgaWYgKCFsZW5kaWZmKSBsZW5kaWZmID0gMDtcblxuICAgIHZhciBkaXNwbGF5ID0gY20uZGlzcGxheTtcbiAgICBpZiAobGVuZGlmZiAmJiB0byA8IGRpc3BsYXkudmlld1RvICYmXG4gICAgICAgIChkaXNwbGF5LnVwZGF0ZUxpbmVOdW1iZXJzID09IG51bGwgfHwgZGlzcGxheS51cGRhdGVMaW5lTnVtYmVycyA+IGZyb20pKVxuICAgICAgZGlzcGxheS51cGRhdGVMaW5lTnVtYmVycyA9IGZyb207XG5cbiAgICBjbS5jdXJPcC52aWV3Q2hhbmdlZCA9IHRydWU7XG5cbiAgICBpZiAoZnJvbSA+PSBkaXNwbGF5LnZpZXdUbykgeyAvLyBDaGFuZ2UgYWZ0ZXJcbiAgICAgIGlmIChzYXdDb2xsYXBzZWRTcGFucyAmJiB2aXN1YWxMaW5lTm8oY20uZG9jLCBmcm9tKSA8IGRpc3BsYXkudmlld1RvKVxuICAgICAgICByZXNldFZpZXcoY20pO1xuICAgIH0gZWxzZSBpZiAodG8gPD0gZGlzcGxheS52aWV3RnJvbSkgeyAvLyBDaGFuZ2UgYmVmb3JlXG4gICAgICBpZiAoc2F3Q29sbGFwc2VkU3BhbnMgJiYgdmlzdWFsTGluZUVuZE5vKGNtLmRvYywgdG8gKyBsZW5kaWZmKSA+IGRpc3BsYXkudmlld0Zyb20pIHtcbiAgICAgICAgcmVzZXRWaWV3KGNtKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRpc3BsYXkudmlld0Zyb20gKz0gbGVuZGlmZjtcbiAgICAgICAgZGlzcGxheS52aWV3VG8gKz0gbGVuZGlmZjtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGZyb20gPD0gZGlzcGxheS52aWV3RnJvbSAmJiB0byA+PSBkaXNwbGF5LnZpZXdUbykgeyAvLyBGdWxsIG92ZXJsYXBcbiAgICAgIHJlc2V0VmlldyhjbSk7XG4gICAgfSBlbHNlIGlmIChmcm9tIDw9IGRpc3BsYXkudmlld0Zyb20pIHsgLy8gVG9wIG92ZXJsYXBcbiAgICAgIHZhciBjdXQgPSB2aWV3Q3V0dGluZ1BvaW50KGNtLCB0bywgdG8gKyBsZW5kaWZmLCAxKTtcbiAgICAgIGlmIChjdXQpIHtcbiAgICAgICAgZGlzcGxheS52aWV3ID0gZGlzcGxheS52aWV3LnNsaWNlKGN1dC5pbmRleCk7XG4gICAgICAgIGRpc3BsYXkudmlld0Zyb20gPSBjdXQubGluZU47XG4gICAgICAgIGRpc3BsYXkudmlld1RvICs9IGxlbmRpZmY7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXNldFZpZXcoY20pO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodG8gPj0gZGlzcGxheS52aWV3VG8pIHsgLy8gQm90dG9tIG92ZXJsYXBcbiAgICAgIHZhciBjdXQgPSB2aWV3Q3V0dGluZ1BvaW50KGNtLCBmcm9tLCBmcm9tLCAtMSk7XG4gICAgICBpZiAoY3V0KSB7XG4gICAgICAgIGRpc3BsYXkudmlldyA9IGRpc3BsYXkudmlldy5zbGljZSgwLCBjdXQuaW5kZXgpO1xuICAgICAgICBkaXNwbGF5LnZpZXdUbyA9IGN1dC5saW5lTjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc2V0VmlldyhjbSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHsgLy8gR2FwIGluIHRoZSBtaWRkbGVcbiAgICAgIHZhciBjdXRUb3AgPSB2aWV3Q3V0dGluZ1BvaW50KGNtLCBmcm9tLCBmcm9tLCAtMSk7XG4gICAgICB2YXIgY3V0Qm90ID0gdmlld0N1dHRpbmdQb2ludChjbSwgdG8sIHRvICsgbGVuZGlmZiwgMSk7XG4gICAgICBpZiAoY3V0VG9wICYmIGN1dEJvdCkge1xuICAgICAgICBkaXNwbGF5LnZpZXcgPSBkaXNwbGF5LnZpZXcuc2xpY2UoMCwgY3V0VG9wLmluZGV4KVxuICAgICAgICAgIC5jb25jYXQoYnVpbGRWaWV3QXJyYXkoY20sIGN1dFRvcC5saW5lTiwgY3V0Qm90LmxpbmVOKSlcbiAgICAgICAgICAuY29uY2F0KGRpc3BsYXkudmlldy5zbGljZShjdXRCb3QuaW5kZXgpKTtcbiAgICAgICAgZGlzcGxheS52aWV3VG8gKz0gbGVuZGlmZjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc2V0VmlldyhjbSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFyIGV4dCA9IGRpc3BsYXkuZXh0ZXJuYWxNZWFzdXJlZDtcbiAgICBpZiAoZXh0KSB7XG4gICAgICBpZiAodG8gPCBleHQubGluZU4pXG4gICAgICAgIGV4dC5saW5lTiArPSBsZW5kaWZmO1xuICAgICAgZWxzZSBpZiAoZnJvbSA8IGV4dC5saW5lTiArIGV4dC5zaXplKVxuICAgICAgICBkaXNwbGF5LmV4dGVybmFsTWVhc3VyZWQgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIC8vIFJlZ2lzdGVyIGEgY2hhbmdlIHRvIGEgc2luZ2xlIGxpbmUuIFR5cGUgbXVzdCBiZSBvbmUgb2YgXCJ0ZXh0XCIsXG4gIC8vIFwiZ3V0dGVyXCIsIFwiY2xhc3NcIiwgXCJ3aWRnZXRcIlxuICBmdW5jdGlvbiByZWdMaW5lQ2hhbmdlKGNtLCBsaW5lLCB0eXBlKSB7XG4gICAgY20uY3VyT3Audmlld0NoYW5nZWQgPSB0cnVlO1xuICAgIHZhciBkaXNwbGF5ID0gY20uZGlzcGxheSwgZXh0ID0gY20uZGlzcGxheS5leHRlcm5hbE1lYXN1cmVkO1xuICAgIGlmIChleHQgJiYgbGluZSA+PSBleHQubGluZU4gJiYgbGluZSA8IGV4dC5saW5lTiArIGV4dC5zaXplKVxuICAgICAgZGlzcGxheS5leHRlcm5hbE1lYXN1cmVkID0gbnVsbDtcblxuICAgIGlmIChsaW5lIDwgZGlzcGxheS52aWV3RnJvbSB8fCBsaW5lID49IGRpc3BsYXkudmlld1RvKSByZXR1cm47XG4gICAgdmFyIGxpbmVWaWV3ID0gZGlzcGxheS52aWV3W2ZpbmRWaWV3SW5kZXgoY20sIGxpbmUpXTtcbiAgICBpZiAobGluZVZpZXcubm9kZSA9PSBudWxsKSByZXR1cm47XG4gICAgdmFyIGFyciA9IGxpbmVWaWV3LmNoYW5nZXMgfHwgKGxpbmVWaWV3LmNoYW5nZXMgPSBbXSk7XG4gICAgaWYgKGluZGV4T2YoYXJyLCB0eXBlKSA9PSAtMSkgYXJyLnB1c2godHlwZSk7XG4gIH1cblxuICAvLyBDbGVhciB0aGUgdmlldy5cbiAgZnVuY3Rpb24gcmVzZXRWaWV3KGNtKSB7XG4gICAgY20uZGlzcGxheS52aWV3RnJvbSA9IGNtLmRpc3BsYXkudmlld1RvID0gY20uZG9jLmZpcnN0O1xuICAgIGNtLmRpc3BsYXkudmlldyA9IFtdO1xuICAgIGNtLmRpc3BsYXkudmlld09mZnNldCA9IDA7XG4gIH1cblxuICAvLyBGaW5kIHRoZSB2aWV3IGVsZW1lbnQgY29ycmVzcG9uZGluZyB0byBhIGdpdmVuIGxpbmUuIFJldHVybiBudWxsXG4gIC8vIHdoZW4gdGhlIGxpbmUgaXNuJ3QgdmlzaWJsZS5cbiAgZnVuY3Rpb24gZmluZFZpZXdJbmRleChjbSwgbikge1xuICAgIGlmIChuID49IGNtLmRpc3BsYXkudmlld1RvKSByZXR1cm4gbnVsbDtcbiAgICBuIC09IGNtLmRpc3BsYXkudmlld0Zyb207XG4gICAgaWYgKG4gPCAwKSByZXR1cm4gbnVsbDtcbiAgICB2YXIgdmlldyA9IGNtLmRpc3BsYXkudmlldztcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHZpZXcubGVuZ3RoOyBpKyspIHtcbiAgICAgIG4gLT0gdmlld1tpXS5zaXplO1xuICAgICAgaWYgKG4gPCAwKSByZXR1cm4gaTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB2aWV3Q3V0dGluZ1BvaW50KGNtLCBvbGROLCBuZXdOLCBkaXIpIHtcbiAgICB2YXIgaW5kZXggPSBmaW5kVmlld0luZGV4KGNtLCBvbGROKSwgZGlmZiwgdmlldyA9IGNtLmRpc3BsYXkudmlldztcbiAgICBpZiAoIXNhd0NvbGxhcHNlZFNwYW5zIHx8IG5ld04gPT0gY20uZG9jLmZpcnN0ICsgY20uZG9jLnNpemUpXG4gICAgICByZXR1cm4ge2luZGV4OiBpbmRleCwgbGluZU46IG5ld059O1xuICAgIGZvciAodmFyIGkgPSAwLCBuID0gY20uZGlzcGxheS52aWV3RnJvbTsgaSA8IGluZGV4OyBpKyspXG4gICAgICBuICs9IHZpZXdbaV0uc2l6ZTtcbiAgICBpZiAobiAhPSBvbGROKSB7XG4gICAgICBpZiAoZGlyID4gMCkge1xuICAgICAgICBpZiAoaW5kZXggPT0gdmlldy5sZW5ndGggLSAxKSByZXR1cm4gbnVsbDtcbiAgICAgICAgZGlmZiA9IChuICsgdmlld1tpbmRleF0uc2l6ZSkgLSBvbGROO1xuICAgICAgICBpbmRleCsrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZGlmZiA9IG4gLSBvbGROO1xuICAgICAgfVxuICAgICAgb2xkTiArPSBkaWZmOyBuZXdOICs9IGRpZmY7XG4gICAgfVxuICAgIHdoaWxlICh2aXN1YWxMaW5lTm8oY20uZG9jLCBuZXdOKSAhPSBuZXdOKSB7XG4gICAgICBpZiAoaW5kZXggPT0gKGRpciA8IDAgPyAwIDogdmlldy5sZW5ndGggLSAxKSkgcmV0dXJuIG51bGw7XG4gICAgICBuZXdOICs9IGRpciAqIHZpZXdbaW5kZXggLSAoZGlyIDwgMCA/IDEgOiAwKV0uc2l6ZTtcbiAgICAgIGluZGV4ICs9IGRpcjtcbiAgICB9XG4gICAgcmV0dXJuIHtpbmRleDogaW5kZXgsIGxpbmVOOiBuZXdOfTtcbiAgfVxuXG4gIC8vIEZvcmNlIHRoZSB2aWV3IHRvIGNvdmVyIGEgZ2l2ZW4gcmFuZ2UsIGFkZGluZyBlbXB0eSB2aWV3IGVsZW1lbnRcbiAgLy8gb3IgY2xpcHBpbmcgb2ZmIGV4aXN0aW5nIG9uZXMgYXMgbmVlZGVkLlxuICBmdW5jdGlvbiBhZGp1c3RWaWV3KGNtLCBmcm9tLCB0bykge1xuICAgIHZhciBkaXNwbGF5ID0gY20uZGlzcGxheSwgdmlldyA9IGRpc3BsYXkudmlldztcbiAgICBpZiAodmlldy5sZW5ndGggPT0gMCB8fCBmcm9tID49IGRpc3BsYXkudmlld1RvIHx8IHRvIDw9IGRpc3BsYXkudmlld0Zyb20pIHtcbiAgICAgIGRpc3BsYXkudmlldyA9IGJ1aWxkVmlld0FycmF5KGNtLCBmcm9tLCB0byk7XG4gICAgICBkaXNwbGF5LnZpZXdGcm9tID0gZnJvbTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGRpc3BsYXkudmlld0Zyb20gPiBmcm9tKVxuICAgICAgICBkaXNwbGF5LnZpZXcgPSBidWlsZFZpZXdBcnJheShjbSwgZnJvbSwgZGlzcGxheS52aWV3RnJvbSkuY29uY2F0KGRpc3BsYXkudmlldyk7XG4gICAgICBlbHNlIGlmIChkaXNwbGF5LnZpZXdGcm9tIDwgZnJvbSlcbiAgICAgICAgZGlzcGxheS52aWV3ID0gZGlzcGxheS52aWV3LnNsaWNlKGZpbmRWaWV3SW5kZXgoY20sIGZyb20pKTtcbiAgICAgIGRpc3BsYXkudmlld0Zyb20gPSBmcm9tO1xuICAgICAgaWYgKGRpc3BsYXkudmlld1RvIDwgdG8pXG4gICAgICAgIGRpc3BsYXkudmlldyA9IGRpc3BsYXkudmlldy5jb25jYXQoYnVpbGRWaWV3QXJyYXkoY20sIGRpc3BsYXkudmlld1RvLCB0bykpO1xuICAgICAgZWxzZSBpZiAoZGlzcGxheS52aWV3VG8gPiB0bylcbiAgICAgICAgZGlzcGxheS52aWV3ID0gZGlzcGxheS52aWV3LnNsaWNlKDAsIGZpbmRWaWV3SW5kZXgoY20sIHRvKSk7XG4gICAgfVxuICAgIGRpc3BsYXkudmlld1RvID0gdG87XG4gIH1cblxuICAvLyBDb3VudCB0aGUgbnVtYmVyIG9mIGxpbmVzIGluIHRoZSB2aWV3IHdob3NlIERPTSByZXByZXNlbnRhdGlvbiBpc1xuICAvLyBvdXQgb2YgZGF0ZSAob3Igbm9uZXhpc3RlbnQpLlxuICBmdW5jdGlvbiBjb3VudERpcnR5VmlldyhjbSkge1xuICAgIHZhciB2aWV3ID0gY20uZGlzcGxheS52aWV3LCBkaXJ0eSA9IDA7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2aWV3Lmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgbGluZVZpZXcgPSB2aWV3W2ldO1xuICAgICAgaWYgKCFsaW5lVmlldy5oaWRkZW4gJiYgKCFsaW5lVmlldy5ub2RlIHx8IGxpbmVWaWV3LmNoYW5nZXMpKSArK2RpcnR5O1xuICAgIH1cbiAgICByZXR1cm4gZGlydHk7XG4gIH1cblxuICAvLyBFVkVOVCBIQU5ETEVSU1xuXG4gIC8vIEF0dGFjaCB0aGUgbmVjZXNzYXJ5IGV2ZW50IGhhbmRsZXJzIHdoZW4gaW5pdGlhbGl6aW5nIHRoZSBlZGl0b3JcbiAgZnVuY3Rpb24gcmVnaXN0ZXJFdmVudEhhbmRsZXJzKGNtKSB7XG4gICAgdmFyIGQgPSBjbS5kaXNwbGF5O1xuICAgIG9uKGQuc2Nyb2xsZXIsIFwibW91c2Vkb3duXCIsIG9wZXJhdGlvbihjbSwgb25Nb3VzZURvd24pKTtcbiAgICAvLyBPbGRlciBJRSdzIHdpbGwgbm90IGZpcmUgYSBzZWNvbmQgbW91c2Vkb3duIGZvciBhIGRvdWJsZSBjbGlja1xuICAgIGlmIChpZSAmJiBpZV92ZXJzaW9uIDwgMTEpXG4gICAgICBvbihkLnNjcm9sbGVyLCBcImRibGNsaWNrXCIsIG9wZXJhdGlvbihjbSwgZnVuY3Rpb24oZSkge1xuICAgICAgICBpZiAoc2lnbmFsRE9NRXZlbnQoY20sIGUpKSByZXR1cm47XG4gICAgICAgIHZhciBwb3MgPSBwb3NGcm9tTW91c2UoY20sIGUpO1xuICAgICAgICBpZiAoIXBvcyB8fCBjbGlja0luR3V0dGVyKGNtLCBlKSB8fCBldmVudEluV2lkZ2V0KGNtLmRpc3BsYXksIGUpKSByZXR1cm47XG4gICAgICAgIGVfcHJldmVudERlZmF1bHQoZSk7XG4gICAgICAgIHZhciB3b3JkID0gY20uZmluZFdvcmRBdChwb3MpO1xuICAgICAgICBleHRlbmRTZWxlY3Rpb24oY20uZG9jLCB3b3JkLmFuY2hvciwgd29yZC5oZWFkKTtcbiAgICAgIH0pKTtcbiAgICBlbHNlXG4gICAgICBvbihkLnNjcm9sbGVyLCBcImRibGNsaWNrXCIsIGZ1bmN0aW9uKGUpIHsgc2lnbmFsRE9NRXZlbnQoY20sIGUpIHx8IGVfcHJldmVudERlZmF1bHQoZSk7IH0pO1xuICAgIC8vIFNvbWUgYnJvd3NlcnMgZmlyZSBjb250ZXh0bWVudSAqYWZ0ZXIqIG9wZW5pbmcgdGhlIG1lbnUsIGF0XG4gICAgLy8gd2hpY2ggcG9pbnQgd2UgY2FuJ3QgbWVzcyB3aXRoIGl0IGFueW1vcmUuIENvbnRleHQgbWVudSBpc1xuICAgIC8vIGhhbmRsZWQgaW4gb25Nb3VzZURvd24gZm9yIHRoZXNlIGJyb3dzZXJzLlxuICAgIGlmICghY2FwdHVyZVJpZ2h0Q2xpY2spIG9uKGQuc2Nyb2xsZXIsIFwiY29udGV4dG1lbnVcIiwgZnVuY3Rpb24oZSkge29uQ29udGV4dE1lbnUoY20sIGUpO30pO1xuXG4gICAgLy8gVXNlZCB0byBzdXBwcmVzcyBtb3VzZSBldmVudCBoYW5kbGluZyB3aGVuIGEgdG91Y2ggaGFwcGVuc1xuICAgIHZhciB0b3VjaEZpbmlzaGVkLCBwcmV2VG91Y2ggPSB7ZW5kOiAwfTtcbiAgICBmdW5jdGlvbiBmaW5pc2hUb3VjaCgpIHtcbiAgICAgIGlmIChkLmFjdGl2ZVRvdWNoKSB7XG4gICAgICAgIHRvdWNoRmluaXNoZWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge2QuYWN0aXZlVG91Y2ggPSBudWxsO30sIDEwMDApO1xuICAgICAgICBwcmV2VG91Y2ggPSBkLmFjdGl2ZVRvdWNoO1xuICAgICAgICBwcmV2VG91Y2guZW5kID0gK25ldyBEYXRlO1xuICAgICAgfVxuICAgIH07XG4gICAgZnVuY3Rpb24gaXNNb3VzZUxpa2VUb3VjaEV2ZW50KGUpIHtcbiAgICAgIGlmIChlLnRvdWNoZXMubGVuZ3RoICE9IDEpIHJldHVybiBmYWxzZTtcbiAgICAgIHZhciB0b3VjaCA9IGUudG91Y2hlc1swXTtcbiAgICAgIHJldHVybiB0b3VjaC5yYWRpdXNYIDw9IDEgJiYgdG91Y2gucmFkaXVzWSA8PSAxO1xuICAgIH1cbiAgICBmdW5jdGlvbiBmYXJBd2F5KHRvdWNoLCBvdGhlcikge1xuICAgICAgaWYgKG90aGVyLmxlZnQgPT0gbnVsbCkgcmV0dXJuIHRydWU7XG4gICAgICB2YXIgZHggPSBvdGhlci5sZWZ0IC0gdG91Y2gubGVmdCwgZHkgPSBvdGhlci50b3AgLSB0b3VjaC50b3A7XG4gICAgICByZXR1cm4gZHggKiBkeCArIGR5ICogZHkgPiAyMCAqIDIwO1xuICAgIH1cbiAgICBvbihkLnNjcm9sbGVyLCBcInRvdWNoc3RhcnRcIiwgZnVuY3Rpb24oZSkge1xuICAgICAgaWYgKCFpc01vdXNlTGlrZVRvdWNoRXZlbnQoZSkpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRvdWNoRmluaXNoZWQpO1xuICAgICAgICB2YXIgbm93ID0gK25ldyBEYXRlO1xuICAgICAgICBkLmFjdGl2ZVRvdWNoID0ge3N0YXJ0OiBub3csIG1vdmVkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICBwcmV2OiBub3cgLSBwcmV2VG91Y2guZW5kIDw9IDMwMCA/IHByZXZUb3VjaCA6IG51bGx9O1xuICAgICAgICBpZiAoZS50b3VjaGVzLmxlbmd0aCA9PSAxKSB7XG4gICAgICAgICAgZC5hY3RpdmVUb3VjaC5sZWZ0ID0gZS50b3VjaGVzWzBdLnBhZ2VYO1xuICAgICAgICAgIGQuYWN0aXZlVG91Y2gudG9wID0gZS50b3VjaGVzWzBdLnBhZ2VZO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgb24oZC5zY3JvbGxlciwgXCJ0b3VjaG1vdmVcIiwgZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoZC5hY3RpdmVUb3VjaCkgZC5hY3RpdmVUb3VjaC5tb3ZlZCA9IHRydWU7XG4gICAgfSk7XG4gICAgb24oZC5zY3JvbGxlciwgXCJ0b3VjaGVuZFwiLCBmdW5jdGlvbihlKSB7XG4gICAgICB2YXIgdG91Y2ggPSBkLmFjdGl2ZVRvdWNoO1xuICAgICAgaWYgKHRvdWNoICYmICFldmVudEluV2lkZ2V0KGQsIGUpICYmIHRvdWNoLmxlZnQgIT0gbnVsbCAmJlxuICAgICAgICAgICF0b3VjaC5tb3ZlZCAmJiBuZXcgRGF0ZSAtIHRvdWNoLnN0YXJ0IDwgMzAwKSB7XG4gICAgICAgIHZhciBwb3MgPSBjbS5jb29yZHNDaGFyKGQuYWN0aXZlVG91Y2gsIFwicGFnZVwiKSwgcmFuZ2U7XG4gICAgICAgIGlmICghdG91Y2gucHJldiB8fCBmYXJBd2F5KHRvdWNoLCB0b3VjaC5wcmV2KSkgLy8gU2luZ2xlIHRhcFxuICAgICAgICAgIHJhbmdlID0gbmV3IFJhbmdlKHBvcywgcG9zKTtcbiAgICAgICAgZWxzZSBpZiAoIXRvdWNoLnByZXYucHJldiB8fCBmYXJBd2F5KHRvdWNoLCB0b3VjaC5wcmV2LnByZXYpKSAvLyBEb3VibGUgdGFwXG4gICAgICAgICAgcmFuZ2UgPSBjbS5maW5kV29yZEF0KHBvcyk7XG4gICAgICAgIGVsc2UgLy8gVHJpcGxlIHRhcFxuICAgICAgICAgIHJhbmdlID0gbmV3IFJhbmdlKFBvcyhwb3MubGluZSwgMCksIGNsaXBQb3MoY20uZG9jLCBQb3MocG9zLmxpbmUgKyAxLCAwKSkpO1xuICAgICAgICBjbS5zZXRTZWxlY3Rpb24ocmFuZ2UuYW5jaG9yLCByYW5nZS5oZWFkKTtcbiAgICAgICAgY20uZm9jdXMoKTtcbiAgICAgICAgZV9wcmV2ZW50RGVmYXVsdChlKTtcbiAgICAgIH1cbiAgICAgIGZpbmlzaFRvdWNoKCk7XG4gICAgfSk7XG4gICAgb24oZC5zY3JvbGxlciwgXCJ0b3VjaGNhbmNlbFwiLCBmaW5pc2hUb3VjaCk7XG5cbiAgICAvLyBTeW5jIHNjcm9sbGluZyBiZXR3ZWVuIGZha2Ugc2Nyb2xsYmFycyBhbmQgcmVhbCBzY3JvbGxhYmxlXG4gICAgLy8gYXJlYSwgZW5zdXJlIHZpZXdwb3J0IGlzIHVwZGF0ZWQgd2hlbiBzY3JvbGxpbmcuXG4gICAgb24oZC5zY3JvbGxlciwgXCJzY3JvbGxcIiwgZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoZC5zY3JvbGxlci5jbGllbnRIZWlnaHQpIHtcbiAgICAgICAgc2V0U2Nyb2xsVG9wKGNtLCBkLnNjcm9sbGVyLnNjcm9sbFRvcCk7XG4gICAgICAgIHNldFNjcm9sbExlZnQoY20sIGQuc2Nyb2xsZXIuc2Nyb2xsTGVmdCwgdHJ1ZSk7XG4gICAgICAgIHNpZ25hbChjbSwgXCJzY3JvbGxcIiwgY20pO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gTGlzdGVuIHRvIHdoZWVsIGV2ZW50cyBpbiBvcmRlciB0byB0cnkgYW5kIHVwZGF0ZSB0aGUgdmlld3BvcnQgb24gdGltZS5cbiAgICBvbihkLnNjcm9sbGVyLCBcIm1vdXNld2hlZWxcIiwgZnVuY3Rpb24oZSl7b25TY3JvbGxXaGVlbChjbSwgZSk7fSk7XG4gICAgb24oZC5zY3JvbGxlciwgXCJET01Nb3VzZVNjcm9sbFwiLCBmdW5jdGlvbihlKXtvblNjcm9sbFdoZWVsKGNtLCBlKTt9KTtcblxuICAgIC8vIFByZXZlbnQgd3JhcHBlciBmcm9tIGV2ZXIgc2Nyb2xsaW5nXG4gICAgb24oZC53cmFwcGVyLCBcInNjcm9sbFwiLCBmdW5jdGlvbigpIHsgZC53cmFwcGVyLnNjcm9sbFRvcCA9IGQud3JhcHBlci5zY3JvbGxMZWZ0ID0gMDsgfSk7XG5cbiAgICBkLmRyYWdGdW5jdGlvbnMgPSB7XG4gICAgICBlbnRlcjogZnVuY3Rpb24oZSkge2lmICghc2lnbmFsRE9NRXZlbnQoY20sIGUpKSBlX3N0b3AoZSk7fSxcbiAgICAgIG92ZXI6IGZ1bmN0aW9uKGUpIHtpZiAoIXNpZ25hbERPTUV2ZW50KGNtLCBlKSkgeyBvbkRyYWdPdmVyKGNtLCBlKTsgZV9zdG9wKGUpOyB9fSxcbiAgICAgIHN0YXJ0OiBmdW5jdGlvbihlKXtvbkRyYWdTdGFydChjbSwgZSk7fSxcbiAgICAgIGRyb3A6IG9wZXJhdGlvbihjbSwgb25Ecm9wKSxcbiAgICAgIGxlYXZlOiBmdW5jdGlvbigpIHtjbGVhckRyYWdDdXJzb3IoY20pO31cbiAgICB9O1xuXG4gICAgdmFyIGlucCA9IGQuaW5wdXQuZ2V0RmllbGQoKTtcbiAgICBvbihpbnAsIFwia2V5dXBcIiwgZnVuY3Rpb24oZSkgeyBvbktleVVwLmNhbGwoY20sIGUpOyB9KTtcbiAgICBvbihpbnAsIFwia2V5ZG93blwiLCBvcGVyYXRpb24oY20sIG9uS2V5RG93bikpO1xuICAgIG9uKGlucCwgXCJrZXlwcmVzc1wiLCBvcGVyYXRpb24oY20sIG9uS2V5UHJlc3MpKTtcbiAgICBvbihpbnAsIFwiZm9jdXNcIiwgYmluZChvbkZvY3VzLCBjbSkpO1xuICAgIG9uKGlucCwgXCJibHVyXCIsIGJpbmQob25CbHVyLCBjbSkpO1xuICB9XG5cbiAgZnVuY3Rpb24gZHJhZ0Ryb3BDaGFuZ2VkKGNtLCB2YWx1ZSwgb2xkKSB7XG4gICAgdmFyIHdhc09uID0gb2xkICYmIG9sZCAhPSBDb2RlTWlycm9yLkluaXQ7XG4gICAgaWYgKCF2YWx1ZSAhPSAhd2FzT24pIHtcbiAgICAgIHZhciBmdW5jcyA9IGNtLmRpc3BsYXkuZHJhZ0Z1bmN0aW9ucztcbiAgICAgIHZhciB0b2dnbGUgPSB2YWx1ZSA/IG9uIDogb2ZmO1xuICAgICAgdG9nZ2xlKGNtLmRpc3BsYXkuc2Nyb2xsZXIsIFwiZHJhZ3N0YXJ0XCIsIGZ1bmNzLnN0YXJ0KTtcbiAgICAgIHRvZ2dsZShjbS5kaXNwbGF5LnNjcm9sbGVyLCBcImRyYWdlbnRlclwiLCBmdW5jcy5lbnRlcik7XG4gICAgICB0b2dnbGUoY20uZGlzcGxheS5zY3JvbGxlciwgXCJkcmFnb3ZlclwiLCBmdW5jcy5vdmVyKTtcbiAgICAgIHRvZ2dsZShjbS5kaXNwbGF5LnNjcm9sbGVyLCBcImRyYWdsZWF2ZVwiLCBmdW5jcy5sZWF2ZSk7XG4gICAgICB0b2dnbGUoY20uZGlzcGxheS5zY3JvbGxlciwgXCJkcm9wXCIsIGZ1bmNzLmRyb3ApO1xuICAgIH1cbiAgfVxuXG4gIC8vIENhbGxlZCB3aGVuIHRoZSB3aW5kb3cgcmVzaXplc1xuICBmdW5jdGlvbiBvblJlc2l6ZShjbSkge1xuICAgIHZhciBkID0gY20uZGlzcGxheTtcbiAgICBpZiAoZC5sYXN0V3JhcEhlaWdodCA9PSBkLndyYXBwZXIuY2xpZW50SGVpZ2h0ICYmIGQubGFzdFdyYXBXaWR0aCA9PSBkLndyYXBwZXIuY2xpZW50V2lkdGgpXG4gICAgICByZXR1cm47XG4gICAgLy8gTWlnaHQgYmUgYSB0ZXh0IHNjYWxpbmcgb3BlcmF0aW9uLCBjbGVhciBzaXplIGNhY2hlcy5cbiAgICBkLmNhY2hlZENoYXJXaWR0aCA9IGQuY2FjaGVkVGV4dEhlaWdodCA9IGQuY2FjaGVkUGFkZGluZ0ggPSBudWxsO1xuICAgIGQuc2Nyb2xsYmFyc0NsaXBwZWQgPSBmYWxzZTtcbiAgICBjbS5zZXRTaXplKCk7XG4gIH1cblxuICAvLyBNT1VTRSBFVkVOVFNcblxuICAvLyBSZXR1cm4gdHJ1ZSB3aGVuIHRoZSBnaXZlbiBtb3VzZSBldmVudCBoYXBwZW5lZCBpbiBhIHdpZGdldFxuICBmdW5jdGlvbiBldmVudEluV2lkZ2V0KGRpc3BsYXksIGUpIHtcbiAgICBmb3IgKHZhciBuID0gZV90YXJnZXQoZSk7IG4gIT0gZGlzcGxheS53cmFwcGVyOyBuID0gbi5wYXJlbnROb2RlKSB7XG4gICAgICBpZiAoIW4gfHwgKG4ubm9kZVR5cGUgPT0gMSAmJiBuLmdldEF0dHJpYnV0ZShcImNtLWlnbm9yZS1ldmVudHNcIikgPT0gXCJ0cnVlXCIpIHx8XG4gICAgICAgICAgKG4ucGFyZW50Tm9kZSA9PSBkaXNwbGF5LnNpemVyICYmIG4gIT0gZGlzcGxheS5tb3ZlcikpXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIC8vIEdpdmVuIGEgbW91c2UgZXZlbnQsIGZpbmQgdGhlIGNvcnJlc3BvbmRpbmcgcG9zaXRpb24uIElmIGxpYmVyYWxcbiAgLy8gaXMgZmFsc2UsIGl0IGNoZWNrcyB3aGV0aGVyIGEgZ3V0dGVyIG9yIHNjcm9sbGJhciB3YXMgY2xpY2tlZCxcbiAgLy8gYW5kIHJldHVybnMgbnVsbCBpZiBpdCB3YXMuIGZvclJlY3QgaXMgdXNlZCBieSByZWN0YW5ndWxhclxuICAvLyBzZWxlY3Rpb25zLCBhbmQgdHJpZXMgdG8gZXN0aW1hdGUgYSBjaGFyYWN0ZXIgcG9zaXRpb24gZXZlbiBmb3JcbiAgLy8gY29vcmRpbmF0ZXMgYmV5b25kIHRoZSByaWdodCBvZiB0aGUgdGV4dC5cbiAgZnVuY3Rpb24gcG9zRnJvbU1vdXNlKGNtLCBlLCBsaWJlcmFsLCBmb3JSZWN0KSB7XG4gICAgdmFyIGRpc3BsYXkgPSBjbS5kaXNwbGF5O1xuICAgIGlmICghbGliZXJhbCAmJiBlX3RhcmdldChlKS5nZXRBdHRyaWJ1dGUoXCJjbS1ub3QtY29udGVudFwiKSA9PSBcInRydWVcIikgcmV0dXJuIG51bGw7XG5cbiAgICB2YXIgeCwgeSwgc3BhY2UgPSBkaXNwbGF5LmxpbmVTcGFjZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAvLyBGYWlscyB1bnByZWRpY3RhYmx5IG9uIElFWzY3XSB3aGVuIG1vdXNlIGlzIGRyYWdnZWQgYXJvdW5kIHF1aWNrbHkuXG4gICAgdHJ5IHsgeCA9IGUuY2xpZW50WCAtIHNwYWNlLmxlZnQ7IHkgPSBlLmNsaWVudFkgLSBzcGFjZS50b3A7IH1cbiAgICBjYXRjaCAoZSkgeyByZXR1cm4gbnVsbDsgfVxuICAgIHZhciBjb29yZHMgPSBjb29yZHNDaGFyKGNtLCB4LCB5KSwgbGluZTtcbiAgICBpZiAoZm9yUmVjdCAmJiBjb29yZHMueFJlbCA9PSAxICYmIChsaW5lID0gZ2V0TGluZShjbS5kb2MsIGNvb3Jkcy5saW5lKS50ZXh0KS5sZW5ndGggPT0gY29vcmRzLmNoKSB7XG4gICAgICB2YXIgY29sRGlmZiA9IGNvdW50Q29sdW1uKGxpbmUsIGxpbmUubGVuZ3RoLCBjbS5vcHRpb25zLnRhYlNpemUpIC0gbGluZS5sZW5ndGg7XG4gICAgICBjb29yZHMgPSBQb3MoY29vcmRzLmxpbmUsIE1hdGgubWF4KDAsIE1hdGgucm91bmQoKHggLSBwYWRkaW5nSChjbS5kaXNwbGF5KS5sZWZ0KSAvIGNoYXJXaWR0aChjbS5kaXNwbGF5KSkgLSBjb2xEaWZmKSk7XG4gICAgfVxuICAgIHJldHVybiBjb29yZHM7XG4gIH1cblxuICAvLyBBIG1vdXNlIGRvd24gY2FuIGJlIGEgc2luZ2xlIGNsaWNrLCBkb3VibGUgY2xpY2ssIHRyaXBsZSBjbGljayxcbiAgLy8gc3RhcnQgb2Ygc2VsZWN0aW9uIGRyYWcsIHN0YXJ0IG9mIHRleHQgZHJhZywgbmV3IGN1cnNvclxuICAvLyAoY3RybC1jbGljayksIHJlY3RhbmdsZSBkcmFnIChhbHQtZHJhZyksIG9yIHh3aW5cbiAgLy8gbWlkZGxlLWNsaWNrLXBhc3RlLiBPciBpdCBtaWdodCBiZSBhIGNsaWNrIG9uIHNvbWV0aGluZyB3ZSBzaG91bGRcbiAgLy8gbm90IGludGVyZmVyZSB3aXRoLCBzdWNoIGFzIGEgc2Nyb2xsYmFyIG9yIHdpZGdldC5cbiAgZnVuY3Rpb24gb25Nb3VzZURvd24oZSkge1xuICAgIHZhciBjbSA9IHRoaXMsIGRpc3BsYXkgPSBjbS5kaXNwbGF5O1xuICAgIGlmIChkaXNwbGF5LmFjdGl2ZVRvdWNoICYmIGRpc3BsYXkuaW5wdXQuc3VwcG9ydHNUb3VjaCgpIHx8IHNpZ25hbERPTUV2ZW50KGNtLCBlKSkgcmV0dXJuO1xuICAgIGRpc3BsYXkuc2hpZnQgPSBlLnNoaWZ0S2V5O1xuXG4gICAgaWYgKGV2ZW50SW5XaWRnZXQoZGlzcGxheSwgZSkpIHtcbiAgICAgIGlmICghd2Via2l0KSB7XG4gICAgICAgIC8vIEJyaWVmbHkgdHVybiBvZmYgZHJhZ2dhYmlsaXR5LCB0byBhbGxvdyB3aWRnZXRzIHRvIGRvXG4gICAgICAgIC8vIG5vcm1hbCBkcmFnZ2luZyB0aGluZ3MuXG4gICAgICAgIGRpc3BsYXkuc2Nyb2xsZXIuZHJhZ2dhYmxlID0gZmFsc2U7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtkaXNwbGF5LnNjcm9sbGVyLmRyYWdnYWJsZSA9IHRydWU7fSwgMTAwKTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGNsaWNrSW5HdXR0ZXIoY20sIGUpKSByZXR1cm47XG4gICAgdmFyIHN0YXJ0ID0gcG9zRnJvbU1vdXNlKGNtLCBlKTtcbiAgICB3aW5kb3cuZm9jdXMoKTtcblxuICAgIHN3aXRjaCAoZV9idXR0b24oZSkpIHtcbiAgICBjYXNlIDE6XG4gICAgICAvLyAjMzI2MTogbWFrZSBzdXJlLCB0aGF0IHdlJ3JlIG5vdCBzdGFydGluZyBhIHNlY29uZCBzZWxlY3Rpb25cbiAgICAgIGlmIChjbS5zdGF0ZS5zZWxlY3RpbmdUZXh0KVxuICAgICAgICBjbS5zdGF0ZS5zZWxlY3RpbmdUZXh0KGUpO1xuICAgICAgZWxzZSBpZiAoc3RhcnQpXG4gICAgICAgIGxlZnRCdXR0b25Eb3duKGNtLCBlLCBzdGFydCk7XG4gICAgICBlbHNlIGlmIChlX3RhcmdldChlKSA9PSBkaXNwbGF5LnNjcm9sbGVyKVxuICAgICAgICBlX3ByZXZlbnREZWZhdWx0KGUpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAyOlxuICAgICAgaWYgKHdlYmtpdCkgY20uc3RhdGUubGFzdE1pZGRsZURvd24gPSArbmV3IERhdGU7XG4gICAgICBpZiAoc3RhcnQpIGV4dGVuZFNlbGVjdGlvbihjbS5kb2MsIHN0YXJ0KTtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7ZGlzcGxheS5pbnB1dC5mb2N1cygpO30sIDIwKTtcbiAgICAgIGVfcHJldmVudERlZmF1bHQoZSk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDM6XG4gICAgICBpZiAoY2FwdHVyZVJpZ2h0Q2xpY2spIG9uQ29udGV4dE1lbnUoY20sIGUpO1xuICAgICAgZWxzZSBkZWxheUJsdXJFdmVudChjbSk7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICB2YXIgbGFzdENsaWNrLCBsYXN0RG91YmxlQ2xpY2s7XG4gIGZ1bmN0aW9uIGxlZnRCdXR0b25Eb3duKGNtLCBlLCBzdGFydCkge1xuICAgIGlmIChpZSkgc2V0VGltZW91dChiaW5kKGVuc3VyZUZvY3VzLCBjbSksIDApO1xuICAgIGVsc2UgY20uY3VyT3AuZm9jdXMgPSBhY3RpdmVFbHQoKTtcblxuICAgIHZhciBub3cgPSArbmV3IERhdGUsIHR5cGU7XG4gICAgaWYgKGxhc3REb3VibGVDbGljayAmJiBsYXN0RG91YmxlQ2xpY2sudGltZSA+IG5vdyAtIDQwMCAmJiBjbXAobGFzdERvdWJsZUNsaWNrLnBvcywgc3RhcnQpID09IDApIHtcbiAgICAgIHR5cGUgPSBcInRyaXBsZVwiO1xuICAgIH0gZWxzZSBpZiAobGFzdENsaWNrICYmIGxhc3RDbGljay50aW1lID4gbm93IC0gNDAwICYmIGNtcChsYXN0Q2xpY2sucG9zLCBzdGFydCkgPT0gMCkge1xuICAgICAgdHlwZSA9IFwiZG91YmxlXCI7XG4gICAgICBsYXN0RG91YmxlQ2xpY2sgPSB7dGltZTogbm93LCBwb3M6IHN0YXJ0fTtcbiAgICB9IGVsc2Uge1xuICAgICAgdHlwZSA9IFwic2luZ2xlXCI7XG4gICAgICBsYXN0Q2xpY2sgPSB7dGltZTogbm93LCBwb3M6IHN0YXJ0fTtcbiAgICB9XG5cbiAgICB2YXIgc2VsID0gY20uZG9jLnNlbCwgbW9kaWZpZXIgPSBtYWMgPyBlLm1ldGFLZXkgOiBlLmN0cmxLZXksIGNvbnRhaW5lZDtcbiAgICBpZiAoY20ub3B0aW9ucy5kcmFnRHJvcCAmJiBkcmFnQW5kRHJvcCAmJiAhaXNSZWFkT25seShjbSkgJiZcbiAgICAgICAgdHlwZSA9PSBcInNpbmdsZVwiICYmIChjb250YWluZWQgPSBzZWwuY29udGFpbnMoc3RhcnQpKSA+IC0xICYmXG4gICAgICAgIChjbXAoKGNvbnRhaW5lZCA9IHNlbC5yYW5nZXNbY29udGFpbmVkXSkuZnJvbSgpLCBzdGFydCkgPCAwIHx8IHN0YXJ0LnhSZWwgPiAwKSAmJlxuICAgICAgICAoY21wKGNvbnRhaW5lZC50bygpLCBzdGFydCkgPiAwIHx8IHN0YXJ0LnhSZWwgPCAwKSlcbiAgICAgIGxlZnRCdXR0b25TdGFydERyYWcoY20sIGUsIHN0YXJ0LCBtb2RpZmllcik7XG4gICAgZWxzZVxuICAgICAgbGVmdEJ1dHRvblNlbGVjdChjbSwgZSwgc3RhcnQsIHR5cGUsIG1vZGlmaWVyKTtcbiAgfVxuXG4gIC8vIFN0YXJ0IGEgdGV4dCBkcmFnLiBXaGVuIGl0IGVuZHMsIHNlZSBpZiBhbnkgZHJhZ2dpbmcgYWN0dWFsbHlcbiAgLy8gaGFwcGVuLCBhbmQgdHJlYXQgYXMgYSBjbGljayBpZiBpdCBkaWRuJ3QuXG4gIGZ1bmN0aW9uIGxlZnRCdXR0b25TdGFydERyYWcoY20sIGUsIHN0YXJ0LCBtb2RpZmllcikge1xuICAgIHZhciBkaXNwbGF5ID0gY20uZGlzcGxheSwgc3RhcnRUaW1lID0gK25ldyBEYXRlO1xuICAgIHZhciBkcmFnRW5kID0gb3BlcmF0aW9uKGNtLCBmdW5jdGlvbihlMikge1xuICAgICAgaWYgKHdlYmtpdCkgZGlzcGxheS5zY3JvbGxlci5kcmFnZ2FibGUgPSBmYWxzZTtcbiAgICAgIGNtLnN0YXRlLmRyYWdnaW5nVGV4dCA9IGZhbHNlO1xuICAgICAgb2ZmKGRvY3VtZW50LCBcIm1vdXNldXBcIiwgZHJhZ0VuZCk7XG4gICAgICBvZmYoZGlzcGxheS5zY3JvbGxlciwgXCJkcm9wXCIsIGRyYWdFbmQpO1xuICAgICAgaWYgKE1hdGguYWJzKGUuY2xpZW50WCAtIGUyLmNsaWVudFgpICsgTWF0aC5hYnMoZS5jbGllbnRZIC0gZTIuY2xpZW50WSkgPCAxMCkge1xuICAgICAgICBlX3ByZXZlbnREZWZhdWx0KGUyKTtcbiAgICAgICAgaWYgKCFtb2RpZmllciAmJiArbmV3IERhdGUgLSAyMDAgPCBzdGFydFRpbWUpXG4gICAgICAgICAgZXh0ZW5kU2VsZWN0aW9uKGNtLmRvYywgc3RhcnQpO1xuICAgICAgICAvLyBXb3JrIGFyb3VuZCB1bmV4cGxhaW5hYmxlIGZvY3VzIHByb2JsZW0gaW4gSUU5ICgjMjEyNykgYW5kIENocm9tZSAoIzMwODEpXG4gICAgICAgIGlmICh3ZWJraXQgfHwgaWUgJiYgaWVfdmVyc2lvbiA9PSA5KVxuICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7ZG9jdW1lbnQuYm9keS5mb2N1cygpOyBkaXNwbGF5LmlucHV0LmZvY3VzKCk7fSwgMjApO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgZGlzcGxheS5pbnB1dC5mb2N1cygpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIC8vIExldCB0aGUgZHJhZyBoYW5kbGVyIGhhbmRsZSB0aGlzLlxuICAgIGlmICh3ZWJraXQpIGRpc3BsYXkuc2Nyb2xsZXIuZHJhZ2dhYmxlID0gdHJ1ZTtcbiAgICBjbS5zdGF0ZS5kcmFnZ2luZ1RleHQgPSBkcmFnRW5kO1xuICAgIC8vIElFJ3MgYXBwcm9hY2ggdG8gZHJhZ2dhYmxlXG4gICAgaWYgKGRpc3BsYXkuc2Nyb2xsZXIuZHJhZ0Ryb3ApIGRpc3BsYXkuc2Nyb2xsZXIuZHJhZ0Ryb3AoKTtcbiAgICBvbihkb2N1bWVudCwgXCJtb3VzZXVwXCIsIGRyYWdFbmQpO1xuICAgIG9uKGRpc3BsYXkuc2Nyb2xsZXIsIFwiZHJvcFwiLCBkcmFnRW5kKTtcbiAgfVxuXG4gIC8vIE5vcm1hbCBzZWxlY3Rpb24sIGFzIG9wcG9zZWQgdG8gdGV4dCBkcmFnZ2luZy5cbiAgZnVuY3Rpb24gbGVmdEJ1dHRvblNlbGVjdChjbSwgZSwgc3RhcnQsIHR5cGUsIGFkZE5ldykge1xuICAgIHZhciBkaXNwbGF5ID0gY20uZGlzcGxheSwgZG9jID0gY20uZG9jO1xuICAgIGVfcHJldmVudERlZmF1bHQoZSk7XG5cbiAgICB2YXIgb3VyUmFuZ2UsIG91ckluZGV4LCBzdGFydFNlbCA9IGRvYy5zZWwsIHJhbmdlcyA9IHN0YXJ0U2VsLnJhbmdlcztcbiAgICBpZiAoYWRkTmV3ICYmICFlLnNoaWZ0S2V5KSB7XG4gICAgICBvdXJJbmRleCA9IGRvYy5zZWwuY29udGFpbnMoc3RhcnQpO1xuICAgICAgaWYgKG91ckluZGV4ID4gLTEpXG4gICAgICAgIG91clJhbmdlID0gcmFuZ2VzW291ckluZGV4XTtcbiAgICAgIGVsc2VcbiAgICAgICAgb3VyUmFuZ2UgPSBuZXcgUmFuZ2Uoc3RhcnQsIHN0YXJ0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3VyUmFuZ2UgPSBkb2Muc2VsLnByaW1hcnkoKTtcbiAgICAgIG91ckluZGV4ID0gZG9jLnNlbC5wcmltSW5kZXg7XG4gICAgfVxuXG4gICAgaWYgKGUuYWx0S2V5KSB7XG4gICAgICB0eXBlID0gXCJyZWN0XCI7XG4gICAgICBpZiAoIWFkZE5ldykgb3VyUmFuZ2UgPSBuZXcgUmFuZ2Uoc3RhcnQsIHN0YXJ0KTtcbiAgICAgIHN0YXJ0ID0gcG9zRnJvbU1vdXNlKGNtLCBlLCB0cnVlLCB0cnVlKTtcbiAgICAgIG91ckluZGV4ID0gLTE7XG4gICAgfSBlbHNlIGlmICh0eXBlID09IFwiZG91YmxlXCIpIHtcbiAgICAgIHZhciB3b3JkID0gY20uZmluZFdvcmRBdChzdGFydCk7XG4gICAgICBpZiAoY20uZGlzcGxheS5zaGlmdCB8fCBkb2MuZXh0ZW5kKVxuICAgICAgICBvdXJSYW5nZSA9IGV4dGVuZFJhbmdlKGRvYywgb3VyUmFuZ2UsIHdvcmQuYW5jaG9yLCB3b3JkLmhlYWQpO1xuICAgICAgZWxzZVxuICAgICAgICBvdXJSYW5nZSA9IHdvcmQ7XG4gICAgfSBlbHNlIGlmICh0eXBlID09IFwidHJpcGxlXCIpIHtcbiAgICAgIHZhciBsaW5lID0gbmV3IFJhbmdlKFBvcyhzdGFydC5saW5lLCAwKSwgY2xpcFBvcyhkb2MsIFBvcyhzdGFydC5saW5lICsgMSwgMCkpKTtcbiAgICAgIGlmIChjbS5kaXNwbGF5LnNoaWZ0IHx8IGRvYy5leHRlbmQpXG4gICAgICAgIG91clJhbmdlID0gZXh0ZW5kUmFuZ2UoZG9jLCBvdXJSYW5nZSwgbGluZS5hbmNob3IsIGxpbmUuaGVhZCk7XG4gICAgICBlbHNlXG4gICAgICAgIG91clJhbmdlID0gbGluZTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3VyUmFuZ2UgPSBleHRlbmRSYW5nZShkb2MsIG91clJhbmdlLCBzdGFydCk7XG4gICAgfVxuXG4gICAgaWYgKCFhZGROZXcpIHtcbiAgICAgIG91ckluZGV4ID0gMDtcbiAgICAgIHNldFNlbGVjdGlvbihkb2MsIG5ldyBTZWxlY3Rpb24oW291clJhbmdlXSwgMCksIHNlbF9tb3VzZSk7XG4gICAgICBzdGFydFNlbCA9IGRvYy5zZWw7XG4gICAgfSBlbHNlIGlmIChvdXJJbmRleCA9PSAtMSkge1xuICAgICAgb3VySW5kZXggPSByYW5nZXMubGVuZ3RoO1xuICAgICAgc2V0U2VsZWN0aW9uKGRvYywgbm9ybWFsaXplU2VsZWN0aW9uKHJhbmdlcy5jb25jYXQoW291clJhbmdlXSksIG91ckluZGV4KSxcbiAgICAgICAgICAgICAgICAgICB7c2Nyb2xsOiBmYWxzZSwgb3JpZ2luOiBcIiptb3VzZVwifSk7XG4gICAgfSBlbHNlIGlmIChyYW5nZXMubGVuZ3RoID4gMSAmJiByYW5nZXNbb3VySW5kZXhdLmVtcHR5KCkgJiYgdHlwZSA9PSBcInNpbmdsZVwiICYmICFlLnNoaWZ0S2V5KSB7XG4gICAgICBzZXRTZWxlY3Rpb24oZG9jLCBub3JtYWxpemVTZWxlY3Rpb24ocmFuZ2VzLnNsaWNlKDAsIG91ckluZGV4KS5jb25jYXQocmFuZ2VzLnNsaWNlKG91ckluZGV4ICsgMSkpLCAwKSxcbiAgICAgICAgICAgICAgICAgICB7c2Nyb2xsOiBmYWxzZSwgb3JpZ2luOiBcIiptb3VzZVwifSk7XG4gICAgICBzdGFydFNlbCA9IGRvYy5zZWw7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlcGxhY2VPbmVTZWxlY3Rpb24oZG9jLCBvdXJJbmRleCwgb3VyUmFuZ2UsIHNlbF9tb3VzZSk7XG4gICAgfVxuXG4gICAgdmFyIGxhc3RQb3MgPSBzdGFydDtcbiAgICBmdW5jdGlvbiBleHRlbmRUbyhwb3MpIHtcbiAgICAgIGlmIChjbXAobGFzdFBvcywgcG9zKSA9PSAwKSByZXR1cm47XG4gICAgICBsYXN0UG9zID0gcG9zO1xuXG4gICAgICBpZiAodHlwZSA9PSBcInJlY3RcIikge1xuICAgICAgICB2YXIgcmFuZ2VzID0gW10sIHRhYlNpemUgPSBjbS5vcHRpb25zLnRhYlNpemU7XG4gICAgICAgIHZhciBzdGFydENvbCA9IGNvdW50Q29sdW1uKGdldExpbmUoZG9jLCBzdGFydC5saW5lKS50ZXh0LCBzdGFydC5jaCwgdGFiU2l6ZSk7XG4gICAgICAgIHZhciBwb3NDb2wgPSBjb3VudENvbHVtbihnZXRMaW5lKGRvYywgcG9zLmxpbmUpLnRleHQsIHBvcy5jaCwgdGFiU2l6ZSk7XG4gICAgICAgIHZhciBsZWZ0ID0gTWF0aC5taW4oc3RhcnRDb2wsIHBvc0NvbCksIHJpZ2h0ID0gTWF0aC5tYXgoc3RhcnRDb2wsIHBvc0NvbCk7XG4gICAgICAgIGZvciAodmFyIGxpbmUgPSBNYXRoLm1pbihzdGFydC5saW5lLCBwb3MubGluZSksIGVuZCA9IE1hdGgubWluKGNtLmxhc3RMaW5lKCksIE1hdGgubWF4KHN0YXJ0LmxpbmUsIHBvcy5saW5lKSk7XG4gICAgICAgICAgICAgbGluZSA8PSBlbmQ7IGxpbmUrKykge1xuICAgICAgICAgIHZhciB0ZXh0ID0gZ2V0TGluZShkb2MsIGxpbmUpLnRleHQsIGxlZnRQb3MgPSBmaW5kQ29sdW1uKHRleHQsIGxlZnQsIHRhYlNpemUpO1xuICAgICAgICAgIGlmIChsZWZ0ID09IHJpZ2h0KVxuICAgICAgICAgICAgcmFuZ2VzLnB1c2gobmV3IFJhbmdlKFBvcyhsaW5lLCBsZWZ0UG9zKSwgUG9zKGxpbmUsIGxlZnRQb3MpKSk7XG4gICAgICAgICAgZWxzZSBpZiAodGV4dC5sZW5ndGggPiBsZWZ0UG9zKVxuICAgICAgICAgICAgcmFuZ2VzLnB1c2gobmV3IFJhbmdlKFBvcyhsaW5lLCBsZWZ0UG9zKSwgUG9zKGxpbmUsIGZpbmRDb2x1bW4odGV4dCwgcmlnaHQsIHRhYlNpemUpKSkpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghcmFuZ2VzLmxlbmd0aCkgcmFuZ2VzLnB1c2gobmV3IFJhbmdlKHN0YXJ0LCBzdGFydCkpO1xuICAgICAgICBzZXRTZWxlY3Rpb24oZG9jLCBub3JtYWxpemVTZWxlY3Rpb24oc3RhcnRTZWwucmFuZ2VzLnNsaWNlKDAsIG91ckluZGV4KS5jb25jYXQocmFuZ2VzKSwgb3VySW5kZXgpLFxuICAgICAgICAgICAgICAgICAgICAge29yaWdpbjogXCIqbW91c2VcIiwgc2Nyb2xsOiBmYWxzZX0pO1xuICAgICAgICBjbS5zY3JvbGxJbnRvVmlldyhwb3MpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIG9sZFJhbmdlID0gb3VyUmFuZ2U7XG4gICAgICAgIHZhciBhbmNob3IgPSBvbGRSYW5nZS5hbmNob3IsIGhlYWQgPSBwb3M7XG4gICAgICAgIGlmICh0eXBlICE9IFwic2luZ2xlXCIpIHtcbiAgICAgICAgICBpZiAodHlwZSA9PSBcImRvdWJsZVwiKVxuICAgICAgICAgICAgdmFyIHJhbmdlID0gY20uZmluZFdvcmRBdChwb3MpO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHZhciByYW5nZSA9IG5ldyBSYW5nZShQb3MocG9zLmxpbmUsIDApLCBjbGlwUG9zKGRvYywgUG9zKHBvcy5saW5lICsgMSwgMCkpKTtcbiAgICAgICAgICBpZiAoY21wKHJhbmdlLmFuY2hvciwgYW5jaG9yKSA+IDApIHtcbiAgICAgICAgICAgIGhlYWQgPSByYW5nZS5oZWFkO1xuICAgICAgICAgICAgYW5jaG9yID0gbWluUG9zKG9sZFJhbmdlLmZyb20oKSwgcmFuZ2UuYW5jaG9yKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaGVhZCA9IHJhbmdlLmFuY2hvcjtcbiAgICAgICAgICAgIGFuY2hvciA9IG1heFBvcyhvbGRSYW5nZS50bygpLCByYW5nZS5oZWFkKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHJhbmdlcyA9IHN0YXJ0U2VsLnJhbmdlcy5zbGljZSgwKTtcbiAgICAgICAgcmFuZ2VzW291ckluZGV4XSA9IG5ldyBSYW5nZShjbGlwUG9zKGRvYywgYW5jaG9yKSwgaGVhZCk7XG4gICAgICAgIHNldFNlbGVjdGlvbihkb2MsIG5vcm1hbGl6ZVNlbGVjdGlvbihyYW5nZXMsIG91ckluZGV4KSwgc2VsX21vdXNlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgZWRpdG9yU2l6ZSA9IGRpc3BsYXkud3JhcHBlci5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAvLyBVc2VkIHRvIGVuc3VyZSB0aW1lb3V0IHJlLXRyaWVzIGRvbid0IGZpcmUgd2hlbiBhbm90aGVyIGV4dGVuZFxuICAgIC8vIGhhcHBlbmVkIGluIHRoZSBtZWFudGltZSAoY2xlYXJUaW1lb3V0IGlzbid0IHJlbGlhYmxlIC0tIGF0XG4gICAgLy8gbGVhc3Qgb24gQ2hyb21lLCB0aGUgdGltZW91dHMgc3RpbGwgaGFwcGVuIGV2ZW4gd2hlbiBjbGVhcmVkLFxuICAgIC8vIGlmIHRoZSBjbGVhciBoYXBwZW5zIGFmdGVyIHRoZWlyIHNjaGVkdWxlZCBmaXJpbmcgdGltZSkuXG4gICAgdmFyIGNvdW50ZXIgPSAwO1xuXG4gICAgZnVuY3Rpb24gZXh0ZW5kKGUpIHtcbiAgICAgIHZhciBjdXJDb3VudCA9ICsrY291bnRlcjtcbiAgICAgIHZhciBjdXIgPSBwb3NGcm9tTW91c2UoY20sIGUsIHRydWUsIHR5cGUgPT0gXCJyZWN0XCIpO1xuICAgICAgaWYgKCFjdXIpIHJldHVybjtcbiAgICAgIGlmIChjbXAoY3VyLCBsYXN0UG9zKSAhPSAwKSB7XG4gICAgICAgIGNtLmN1ck9wLmZvY3VzID0gYWN0aXZlRWx0KCk7XG4gICAgICAgIGV4dGVuZFRvKGN1cik7XG4gICAgICAgIHZhciB2aXNpYmxlID0gdmlzaWJsZUxpbmVzKGRpc3BsYXksIGRvYyk7XG4gICAgICAgIGlmIChjdXIubGluZSA+PSB2aXNpYmxlLnRvIHx8IGN1ci5saW5lIDwgdmlzaWJsZS5mcm9tKVxuICAgICAgICAgIHNldFRpbWVvdXQob3BlcmF0aW9uKGNtLCBmdW5jdGlvbigpe2lmIChjb3VudGVyID09IGN1ckNvdW50KSBleHRlbmQoZSk7fSksIDE1MCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgb3V0c2lkZSA9IGUuY2xpZW50WSA8IGVkaXRvclNpemUudG9wID8gLTIwIDogZS5jbGllbnRZID4gZWRpdG9yU2l6ZS5ib3R0b20gPyAyMCA6IDA7XG4gICAgICAgIGlmIChvdXRzaWRlKSBzZXRUaW1lb3V0KG9wZXJhdGlvbihjbSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKGNvdW50ZXIgIT0gY3VyQ291bnQpIHJldHVybjtcbiAgICAgICAgICBkaXNwbGF5LnNjcm9sbGVyLnNjcm9sbFRvcCArPSBvdXRzaWRlO1xuICAgICAgICAgIGV4dGVuZChlKTtcbiAgICAgICAgfSksIDUwKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkb25lKGUpIHtcbiAgICAgIGNtLnN0YXRlLnNlbGVjdGluZ1RleHQgPSBmYWxzZTtcbiAgICAgIGNvdW50ZXIgPSBJbmZpbml0eTtcbiAgICAgIGVfcHJldmVudERlZmF1bHQoZSk7XG4gICAgICBkaXNwbGF5LmlucHV0LmZvY3VzKCk7XG4gICAgICBvZmYoZG9jdW1lbnQsIFwibW91c2Vtb3ZlXCIsIG1vdmUpO1xuICAgICAgb2ZmKGRvY3VtZW50LCBcIm1vdXNldXBcIiwgdXApO1xuICAgICAgZG9jLmhpc3RvcnkubGFzdFNlbE9yaWdpbiA9IG51bGw7XG4gICAgfVxuXG4gICAgdmFyIG1vdmUgPSBvcGVyYXRpb24oY20sIGZ1bmN0aW9uKGUpIHtcbiAgICAgIGlmICghZV9idXR0b24oZSkpIGRvbmUoZSk7XG4gICAgICBlbHNlIGV4dGVuZChlKTtcbiAgICB9KTtcbiAgICB2YXIgdXAgPSBvcGVyYXRpb24oY20sIGRvbmUpO1xuICAgIGNtLnN0YXRlLnNlbGVjdGluZ1RleHQgPSB1cDtcbiAgICBvbihkb2N1bWVudCwgXCJtb3VzZW1vdmVcIiwgbW92ZSk7XG4gICAgb24oZG9jdW1lbnQsIFwibW91c2V1cFwiLCB1cCk7XG4gIH1cblxuICAvLyBEZXRlcm1pbmVzIHdoZXRoZXIgYW4gZXZlbnQgaGFwcGVuZWQgaW4gdGhlIGd1dHRlciwgYW5kIGZpcmVzIHRoZVxuICAvLyBoYW5kbGVycyBmb3IgdGhlIGNvcnJlc3BvbmRpbmcgZXZlbnQuXG4gIGZ1bmN0aW9uIGd1dHRlckV2ZW50KGNtLCBlLCB0eXBlLCBwcmV2ZW50KSB7XG4gICAgdHJ5IHsgdmFyIG1YID0gZS5jbGllbnRYLCBtWSA9IGUuY2xpZW50WTsgfVxuICAgIGNhdGNoKGUpIHsgcmV0dXJuIGZhbHNlOyB9XG4gICAgaWYgKG1YID49IE1hdGguZmxvb3IoY20uZGlzcGxheS5ndXR0ZXJzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnJpZ2h0KSkgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChwcmV2ZW50KSBlX3ByZXZlbnREZWZhdWx0KGUpO1xuXG4gICAgdmFyIGRpc3BsYXkgPSBjbS5kaXNwbGF5O1xuICAgIHZhciBsaW5lQm94ID0gZGlzcGxheS5saW5lRGl2LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gICAgaWYgKG1ZID4gbGluZUJveC5ib3R0b20gfHwgIWhhc0hhbmRsZXIoY20sIHR5cGUpKSByZXR1cm4gZV9kZWZhdWx0UHJldmVudGVkKGUpO1xuICAgIG1ZIC09IGxpbmVCb3gudG9wIC0gZGlzcGxheS52aWV3T2Zmc2V0O1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjbS5vcHRpb25zLmd1dHRlcnMubGVuZ3RoOyArK2kpIHtcbiAgICAgIHZhciBnID0gZGlzcGxheS5ndXR0ZXJzLmNoaWxkTm9kZXNbaV07XG4gICAgICBpZiAoZyAmJiBnLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnJpZ2h0ID49IG1YKSB7XG4gICAgICAgIHZhciBsaW5lID0gbGluZUF0SGVpZ2h0KGNtLmRvYywgbVkpO1xuICAgICAgICB2YXIgZ3V0dGVyID0gY20ub3B0aW9ucy5ndXR0ZXJzW2ldO1xuICAgICAgICBzaWduYWwoY20sIHR5cGUsIGNtLCBsaW5lLCBndXR0ZXIsIGUpO1xuICAgICAgICByZXR1cm4gZV9kZWZhdWx0UHJldmVudGVkKGUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNsaWNrSW5HdXR0ZXIoY20sIGUpIHtcbiAgICByZXR1cm4gZ3V0dGVyRXZlbnQoY20sIGUsIFwiZ3V0dGVyQ2xpY2tcIiwgdHJ1ZSk7XG4gIH1cblxuICAvLyBLbHVkZ2UgdG8gd29yayBhcm91bmQgc3RyYW5nZSBJRSBiZWhhdmlvciB3aGVyZSBpdCdsbCBzb21ldGltZXNcbiAgLy8gcmUtZmlyZSBhIHNlcmllcyBvZiBkcmFnLXJlbGF0ZWQgZXZlbnRzIHJpZ2h0IGFmdGVyIHRoZSBkcm9wICgjMTU1MSlcbiAgdmFyIGxhc3REcm9wID0gMDtcblxuICBmdW5jdGlvbiBvbkRyb3AoZSkge1xuICAgIHZhciBjbSA9IHRoaXM7XG4gICAgY2xlYXJEcmFnQ3Vyc29yKGNtKTtcbiAgICBpZiAoc2lnbmFsRE9NRXZlbnQoY20sIGUpIHx8IGV2ZW50SW5XaWRnZXQoY20uZGlzcGxheSwgZSkpXG4gICAgICByZXR1cm47XG4gICAgZV9wcmV2ZW50RGVmYXVsdChlKTtcbiAgICBpZiAoaWUpIGxhc3REcm9wID0gK25ldyBEYXRlO1xuICAgIHZhciBwb3MgPSBwb3NGcm9tTW91c2UoY20sIGUsIHRydWUpLCBmaWxlcyA9IGUuZGF0YVRyYW5zZmVyLmZpbGVzO1xuICAgIGlmICghcG9zIHx8IGlzUmVhZE9ubHkoY20pKSByZXR1cm47XG4gICAgLy8gTWlnaHQgYmUgYSBmaWxlIGRyb3AsIGluIHdoaWNoIGNhc2Ugd2Ugc2ltcGx5IGV4dHJhY3QgdGhlIHRleHRcbiAgICAvLyBhbmQgaW5zZXJ0IGl0LlxuICAgIGlmIChmaWxlcyAmJiBmaWxlcy5sZW5ndGggJiYgd2luZG93LkZpbGVSZWFkZXIgJiYgd2luZG93LkZpbGUpIHtcbiAgICAgIHZhciBuID0gZmlsZXMubGVuZ3RoLCB0ZXh0ID0gQXJyYXkobiksIHJlYWQgPSAwO1xuICAgICAgdmFyIGxvYWRGaWxlID0gZnVuY3Rpb24oZmlsZSwgaSkge1xuICAgICAgICBpZiAoY20ub3B0aW9ucy5hbGxvd0Ryb3BGaWxlVHlwZXMgJiZcbiAgICAgICAgICAgIGluZGV4T2YoY20ub3B0aW9ucy5hbGxvd0Ryb3BGaWxlVHlwZXMsIGZpbGUudHlwZSkgPT0gLTEpXG4gICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcjtcbiAgICAgICAgcmVhZGVyLm9ubG9hZCA9IG9wZXJhdGlvbihjbSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIGNvbnRlbnQgPSByZWFkZXIucmVzdWx0O1xuICAgICAgICAgIGlmICgvW1xceDAwLVxceDA4XFx4MGUtXFx4MWZdezJ9Ly50ZXN0KGNvbnRlbnQpKSBjb250ZW50ID0gXCJcIjtcbiAgICAgICAgICB0ZXh0W2ldID0gY29udGVudDtcbiAgICAgICAgICBpZiAoKytyZWFkID09IG4pIHtcbiAgICAgICAgICAgIHBvcyA9IGNsaXBQb3MoY20uZG9jLCBwb3MpO1xuICAgICAgICAgICAgdmFyIGNoYW5nZSA9IHtmcm9tOiBwb3MsIHRvOiBwb3MsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IGNtLmRvYy5zcGxpdExpbmVzKHRleHQuam9pbihjbS5kb2MubGluZVNlcGFyYXRvcigpKSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9yaWdpbjogXCJwYXN0ZVwifTtcbiAgICAgICAgICAgIG1ha2VDaGFuZ2UoY20uZG9jLCBjaGFuZ2UpO1xuICAgICAgICAgICAgc2V0U2VsZWN0aW9uUmVwbGFjZUhpc3RvcnkoY20uZG9jLCBzaW1wbGVTZWxlY3Rpb24ocG9zLCBjaGFuZ2VFbmQoY2hhbmdlKSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJlYWRlci5yZWFkQXNUZXh0KGZpbGUpO1xuICAgICAgfTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgKytpKSBsb2FkRmlsZShmaWxlc1tpXSwgaSk7XG4gICAgfSBlbHNlIHsgLy8gTm9ybWFsIGRyb3BcbiAgICAgIC8vIERvbid0IGRvIGEgcmVwbGFjZSBpZiB0aGUgZHJvcCBoYXBwZW5lZCBpbnNpZGUgb2YgdGhlIHNlbGVjdGVkIHRleHQuXG4gICAgICBpZiAoY20uc3RhdGUuZHJhZ2dpbmdUZXh0ICYmIGNtLmRvYy5zZWwuY29udGFpbnMocG9zKSA+IC0xKSB7XG4gICAgICAgIGNtLnN0YXRlLmRyYWdnaW5nVGV4dChlKTtcbiAgICAgICAgLy8gRW5zdXJlIHRoZSBlZGl0b3IgaXMgcmUtZm9jdXNlZFxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge2NtLmRpc3BsYXkuaW5wdXQuZm9jdXMoKTt9LCAyMCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHRyeSB7XG4gICAgICAgIHZhciB0ZXh0ID0gZS5kYXRhVHJhbnNmZXIuZ2V0RGF0YShcIlRleHRcIik7XG4gICAgICAgIGlmICh0ZXh0KSB7XG4gICAgICAgICAgaWYgKGNtLnN0YXRlLmRyYWdnaW5nVGV4dCAmJiAhKG1hYyA/IGUuYWx0S2V5IDogZS5jdHJsS2V5KSlcbiAgICAgICAgICAgIHZhciBzZWxlY3RlZCA9IGNtLmxpc3RTZWxlY3Rpb25zKCk7XG4gICAgICAgICAgc2V0U2VsZWN0aW9uTm9VbmRvKGNtLmRvYywgc2ltcGxlU2VsZWN0aW9uKHBvcywgcG9zKSk7XG4gICAgICAgICAgaWYgKHNlbGVjdGVkKSBmb3IgKHZhciBpID0gMDsgaSA8IHNlbGVjdGVkLmxlbmd0aDsgKytpKVxuICAgICAgICAgICAgcmVwbGFjZVJhbmdlKGNtLmRvYywgXCJcIiwgc2VsZWN0ZWRbaV0uYW5jaG9yLCBzZWxlY3RlZFtpXS5oZWFkLCBcImRyYWdcIik7XG4gICAgICAgICAgY20ucmVwbGFjZVNlbGVjdGlvbih0ZXh0LCBcImFyb3VuZFwiLCBcInBhc3RlXCIpO1xuICAgICAgICAgIGNtLmRpc3BsYXkuaW5wdXQuZm9jdXMoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY2F0Y2goZSl7fVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG9uRHJhZ1N0YXJ0KGNtLCBlKSB7XG4gICAgaWYgKGllICYmICghY20uc3RhdGUuZHJhZ2dpbmdUZXh0IHx8ICtuZXcgRGF0ZSAtIGxhc3REcm9wIDwgMTAwKSkgeyBlX3N0b3AoZSk7IHJldHVybjsgfVxuICAgIGlmIChzaWduYWxET01FdmVudChjbSwgZSkgfHwgZXZlbnRJbldpZGdldChjbS5kaXNwbGF5LCBlKSkgcmV0dXJuO1xuXG4gICAgZS5kYXRhVHJhbnNmZXIuc2V0RGF0YShcIlRleHRcIiwgY20uZ2V0U2VsZWN0aW9uKCkpO1xuXG4gICAgLy8gVXNlIGR1bW15IGltYWdlIGluc3RlYWQgb2YgZGVmYXVsdCBicm93c2VycyBpbWFnZS5cbiAgICAvLyBSZWNlbnQgU2FmYXJpICh+Ni4wLjIpIGhhdmUgYSB0ZW5kZW5jeSB0byBzZWdmYXVsdCB3aGVuIHRoaXMgaGFwcGVucywgc28gd2UgZG9uJ3QgZG8gaXQgdGhlcmUuXG4gICAgaWYgKGUuZGF0YVRyYW5zZmVyLnNldERyYWdJbWFnZSAmJiAhc2FmYXJpKSB7XG4gICAgICB2YXIgaW1nID0gZWx0KFwiaW1nXCIsIG51bGwsIG51bGwsIFwicG9zaXRpb246IGZpeGVkOyBsZWZ0OiAwOyB0b3A6IDA7XCIpO1xuICAgICAgaW1nLnNyYyA9IFwiZGF0YTppbWFnZS9naWY7YmFzZTY0LFIwbEdPRGxoQVFBQkFBQUFBQ0g1QkFFS0FBRUFMQUFBQUFBQkFBRUFBQUlDVEFFQU93PT1cIjtcbiAgICAgIGlmIChwcmVzdG8pIHtcbiAgICAgICAgaW1nLndpZHRoID0gaW1nLmhlaWdodCA9IDE7XG4gICAgICAgIGNtLmRpc3BsYXkud3JhcHBlci5hcHBlbmRDaGlsZChpbWcpO1xuICAgICAgICAvLyBGb3JjZSBhIHJlbGF5b3V0LCBvciBPcGVyYSB3b24ndCB1c2Ugb3VyIGltYWdlIGZvciBzb21lIG9ic2N1cmUgcmVhc29uXG4gICAgICAgIGltZy5fdG9wID0gaW1nLm9mZnNldFRvcDtcbiAgICAgIH1cbiAgICAgIGUuZGF0YVRyYW5zZmVyLnNldERyYWdJbWFnZShpbWcsIDAsIDApO1xuICAgICAgaWYgKHByZXN0bykgaW1nLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoaW1nKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBvbkRyYWdPdmVyKGNtLCBlKSB7XG4gICAgdmFyIHBvcyA9IHBvc0Zyb21Nb3VzZShjbSwgZSk7XG4gICAgaWYgKCFwb3MpIHJldHVybjtcbiAgICB2YXIgZnJhZyA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcbiAgICBkcmF3U2VsZWN0aW9uQ3Vyc29yKGNtLCBwb3MsIGZyYWcpO1xuICAgIGlmICghY20uZGlzcGxheS5kcmFnQ3Vyc29yKSB7XG4gICAgICBjbS5kaXNwbGF5LmRyYWdDdXJzb3IgPSBlbHQoXCJkaXZcIiwgbnVsbCwgXCJDb2RlTWlycm9yLWN1cnNvcnMgQ29kZU1pcnJvci1kcmFnY3Vyc29yc1wiKTtcbiAgICAgIGNtLmRpc3BsYXkubGluZVNwYWNlLmluc2VydEJlZm9yZShjbS5kaXNwbGF5LmRyYWdDdXJzb3IsIGNtLmRpc3BsYXkuY3Vyc29yRGl2KTtcbiAgICB9XG4gICAgcmVtb3ZlQ2hpbGRyZW5BbmRBZGQoY20uZGlzcGxheS5kcmFnQ3Vyc29yLCBmcmFnKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNsZWFyRHJhZ0N1cnNvcihjbSkge1xuICAgIGlmIChjbS5kaXNwbGF5LmRyYWdDdXJzb3IpIHtcbiAgICAgIGNtLmRpc3BsYXkubGluZVNwYWNlLnJlbW92ZUNoaWxkKGNtLmRpc3BsYXkuZHJhZ0N1cnNvcik7XG4gICAgICBjbS5kaXNwbGF5LmRyYWdDdXJzb3IgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIC8vIFNDUk9MTCBFVkVOVFNcblxuICAvLyBTeW5jIHRoZSBzY3JvbGxhYmxlIGFyZWEgYW5kIHNjcm9sbGJhcnMsIGVuc3VyZSB0aGUgdmlld3BvcnRcbiAgLy8gY292ZXJzIHRoZSB2aXNpYmxlIGFyZWEuXG4gIGZ1bmN0aW9uIHNldFNjcm9sbFRvcChjbSwgdmFsKSB7XG4gICAgaWYgKE1hdGguYWJzKGNtLmRvYy5zY3JvbGxUb3AgLSB2YWwpIDwgMikgcmV0dXJuO1xuICAgIGNtLmRvYy5zY3JvbGxUb3AgPSB2YWw7XG4gICAgaWYgKCFnZWNrbykgdXBkYXRlRGlzcGxheVNpbXBsZShjbSwge3RvcDogdmFsfSk7XG4gICAgaWYgKGNtLmRpc3BsYXkuc2Nyb2xsZXIuc2Nyb2xsVG9wICE9IHZhbCkgY20uZGlzcGxheS5zY3JvbGxlci5zY3JvbGxUb3AgPSB2YWw7XG4gICAgY20uZGlzcGxheS5zY3JvbGxiYXJzLnNldFNjcm9sbFRvcCh2YWwpO1xuICAgIGlmIChnZWNrbykgdXBkYXRlRGlzcGxheVNpbXBsZShjbSk7XG4gICAgc3RhcnRXb3JrZXIoY20sIDEwMCk7XG4gIH1cbiAgLy8gU3luYyBzY3JvbGxlciBhbmQgc2Nyb2xsYmFyLCBlbnN1cmUgdGhlIGd1dHRlciBlbGVtZW50cyBhcmVcbiAgLy8gYWxpZ25lZC5cbiAgZnVuY3Rpb24gc2V0U2Nyb2xsTGVmdChjbSwgdmFsLCBpc1Njcm9sbGVyKSB7XG4gICAgaWYgKGlzU2Nyb2xsZXIgPyB2YWwgPT0gY20uZG9jLnNjcm9sbExlZnQgOiBNYXRoLmFicyhjbS5kb2Muc2Nyb2xsTGVmdCAtIHZhbCkgPCAyKSByZXR1cm47XG4gICAgdmFsID0gTWF0aC5taW4odmFsLCBjbS5kaXNwbGF5LnNjcm9sbGVyLnNjcm9sbFdpZHRoIC0gY20uZGlzcGxheS5zY3JvbGxlci5jbGllbnRXaWR0aCk7XG4gICAgY20uZG9jLnNjcm9sbExlZnQgPSB2YWw7XG4gICAgYWxpZ25Ib3Jpem9udGFsbHkoY20pO1xuICAgIGlmIChjbS5kaXNwbGF5LnNjcm9sbGVyLnNjcm9sbExlZnQgIT0gdmFsKSBjbS5kaXNwbGF5LnNjcm9sbGVyLnNjcm9sbExlZnQgPSB2YWw7XG4gICAgY20uZGlzcGxheS5zY3JvbGxiYXJzLnNldFNjcm9sbExlZnQodmFsKTtcbiAgfVxuXG4gIC8vIFNpbmNlIHRoZSBkZWx0YSB2YWx1ZXMgcmVwb3J0ZWQgb24gbW91c2Ugd2hlZWwgZXZlbnRzIGFyZVxuICAvLyB1bnN0YW5kYXJkaXplZCBiZXR3ZWVuIGJyb3dzZXJzIGFuZCBldmVuIGJyb3dzZXIgdmVyc2lvbnMsIGFuZFxuICAvLyBnZW5lcmFsbHkgaG9ycmlibHkgdW5wcmVkaWN0YWJsZSwgdGhpcyBjb2RlIHN0YXJ0cyBieSBtZWFzdXJpbmdcbiAgLy8gdGhlIHNjcm9sbCBlZmZlY3QgdGhhdCB0aGUgZmlyc3QgZmV3IG1vdXNlIHdoZWVsIGV2ZW50cyBoYXZlLFxuICAvLyBhbmQsIGZyb20gdGhhdCwgZGV0ZWN0cyB0aGUgd2F5IGl0IGNhbiBjb252ZXJ0IGRlbHRhcyB0byBwaXhlbFxuICAvLyBvZmZzZXRzIGFmdGVyd2FyZHMuXG4gIC8vXG4gIC8vIFRoZSByZWFzb24gd2Ugd2FudCB0byBrbm93IHRoZSBhbW91bnQgYSB3aGVlbCBldmVudCB3aWxsIHNjcm9sbFxuICAvLyBpcyB0aGF0IGl0IGdpdmVzIHVzIGEgY2hhbmNlIHRvIHVwZGF0ZSB0aGUgZGlzcGxheSBiZWZvcmUgdGhlXG4gIC8vIGFjdHVhbCBzY3JvbGxpbmcgaGFwcGVucywgcmVkdWNpbmcgZmxpY2tlcmluZy5cblxuICB2YXIgd2hlZWxTYW1wbGVzID0gMCwgd2hlZWxQaXhlbHNQZXJVbml0ID0gbnVsbDtcbiAgLy8gRmlsbCBpbiBhIGJyb3dzZXItZGV0ZWN0ZWQgc3RhcnRpbmcgdmFsdWUgb24gYnJvd3NlcnMgd2hlcmUgd2VcbiAgLy8ga25vdyBvbmUuIFRoZXNlIGRvbid0IGhhdmUgdG8gYmUgYWNjdXJhdGUgLS0gdGhlIHJlc3VsdCBvZiB0aGVtXG4gIC8vIGJlaW5nIHdyb25nIHdvdWxkIGp1c3QgYmUgYSBzbGlnaHQgZmxpY2tlciBvbiB0aGUgZmlyc3Qgd2hlZWxcbiAgLy8gc2Nyb2xsIChpZiBpdCBpcyBsYXJnZSBlbm91Z2gpLlxuICBpZiAoaWUpIHdoZWVsUGl4ZWxzUGVyVW5pdCA9IC0uNTM7XG4gIGVsc2UgaWYgKGdlY2tvKSB3aGVlbFBpeGVsc1BlclVuaXQgPSAxNTtcbiAgZWxzZSBpZiAoY2hyb21lKSB3aGVlbFBpeGVsc1BlclVuaXQgPSAtLjc7XG4gIGVsc2UgaWYgKHNhZmFyaSkgd2hlZWxQaXhlbHNQZXJVbml0ID0gLTEvMztcblxuICB2YXIgd2hlZWxFdmVudERlbHRhID0gZnVuY3Rpb24oZSkge1xuICAgIHZhciBkeCA9IGUud2hlZWxEZWx0YVgsIGR5ID0gZS53aGVlbERlbHRhWTtcbiAgICBpZiAoZHggPT0gbnVsbCAmJiBlLmRldGFpbCAmJiBlLmF4aXMgPT0gZS5IT1JJWk9OVEFMX0FYSVMpIGR4ID0gZS5kZXRhaWw7XG4gICAgaWYgKGR5ID09IG51bGwgJiYgZS5kZXRhaWwgJiYgZS5heGlzID09IGUuVkVSVElDQUxfQVhJUykgZHkgPSBlLmRldGFpbDtcbiAgICBlbHNlIGlmIChkeSA9PSBudWxsKSBkeSA9IGUud2hlZWxEZWx0YTtcbiAgICByZXR1cm4ge3g6IGR4LCB5OiBkeX07XG4gIH07XG4gIENvZGVNaXJyb3Iud2hlZWxFdmVudFBpeGVscyA9IGZ1bmN0aW9uKGUpIHtcbiAgICB2YXIgZGVsdGEgPSB3aGVlbEV2ZW50RGVsdGEoZSk7XG4gICAgZGVsdGEueCAqPSB3aGVlbFBpeGVsc1BlclVuaXQ7XG4gICAgZGVsdGEueSAqPSB3aGVlbFBpeGVsc1BlclVuaXQ7XG4gICAgcmV0dXJuIGRlbHRhO1xuICB9O1xuXG4gIGZ1bmN0aW9uIG9uU2Nyb2xsV2hlZWwoY20sIGUpIHtcbiAgICB2YXIgZGVsdGEgPSB3aGVlbEV2ZW50RGVsdGEoZSksIGR4ID0gZGVsdGEueCwgZHkgPSBkZWx0YS55O1xuXG4gICAgdmFyIGRpc3BsYXkgPSBjbS5kaXNwbGF5LCBzY3JvbGwgPSBkaXNwbGF5LnNjcm9sbGVyO1xuICAgIC8vIFF1aXQgaWYgdGhlcmUncyBub3RoaW5nIHRvIHNjcm9sbCBoZXJlXG4gICAgdmFyIGNhblNjcm9sbFggPSBzY3JvbGwuc2Nyb2xsV2lkdGggPiBzY3JvbGwuY2xpZW50V2lkdGg7XG4gICAgdmFyIGNhblNjcm9sbFkgPSBzY3JvbGwuc2Nyb2xsSGVpZ2h0ID4gc2Nyb2xsLmNsaWVudEhlaWdodDtcbiAgICBpZiAoIShkeCAmJiBjYW5TY3JvbGxYIHx8IGR5ICYmIGNhblNjcm9sbFkpKSByZXR1cm47XG5cbiAgICAvLyBXZWJraXQgYnJvd3NlcnMgb24gT1MgWCBhYm9ydCBtb21lbnR1bSBzY3JvbGxzIHdoZW4gdGhlIHRhcmdldFxuICAgIC8vIG9mIHRoZSBzY3JvbGwgZXZlbnQgaXMgcmVtb3ZlZCBmcm9tIHRoZSBzY3JvbGxhYmxlIGVsZW1lbnQuXG4gICAgLy8gVGhpcyBoYWNrIChzZWUgcmVsYXRlZCBjb2RlIGluIHBhdGNoRGlzcGxheSkgbWFrZXMgc3VyZSB0aGVcbiAgICAvLyBlbGVtZW50IGlzIGtlcHQgYXJvdW5kLlxuICAgIGlmIChkeSAmJiBtYWMgJiYgd2Via2l0KSB7XG4gICAgICBvdXRlcjogZm9yICh2YXIgY3VyID0gZS50YXJnZXQsIHZpZXcgPSBkaXNwbGF5LnZpZXc7IGN1ciAhPSBzY3JvbGw7IGN1ciA9IGN1ci5wYXJlbnROb2RlKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdmlldy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmICh2aWV3W2ldLm5vZGUgPT0gY3VyKSB7XG4gICAgICAgICAgICBjbS5kaXNwbGF5LmN1cnJlbnRXaGVlbFRhcmdldCA9IGN1cjtcbiAgICAgICAgICAgIGJyZWFrIG91dGVyO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIE9uIHNvbWUgYnJvd3NlcnMsIGhvcml6b250YWwgc2Nyb2xsaW5nIHdpbGwgY2F1c2UgcmVkcmF3cyB0b1xuICAgIC8vIGhhcHBlbiBiZWZvcmUgdGhlIGd1dHRlciBoYXMgYmVlbiByZWFsaWduZWQsIGNhdXNpbmcgaXQgdG9cbiAgICAvLyB3cmlnZ2xlIGFyb3VuZCBpbiBhIG1vc3QgdW5zZWVtbHkgd2F5LiBXaGVuIHdlIGhhdmUgYW5cbiAgICAvLyBlc3RpbWF0ZWQgcGl4ZWxzL2RlbHRhIHZhbHVlLCB3ZSBqdXN0IGhhbmRsZSBob3Jpem9udGFsXG4gICAgLy8gc2Nyb2xsaW5nIGVudGlyZWx5IGhlcmUuIEl0J2xsIGJlIHNsaWdodGx5IG9mZiBmcm9tIG5hdGl2ZSwgYnV0XG4gICAgLy8gYmV0dGVyIHRoYW4gZ2xpdGNoaW5nIG91dC5cbiAgICBpZiAoZHggJiYgIWdlY2tvICYmICFwcmVzdG8gJiYgd2hlZWxQaXhlbHNQZXJVbml0ICE9IG51bGwpIHtcbiAgICAgIGlmIChkeSAmJiBjYW5TY3JvbGxZKVxuICAgICAgICBzZXRTY3JvbGxUb3AoY20sIE1hdGgubWF4KDAsIE1hdGgubWluKHNjcm9sbC5zY3JvbGxUb3AgKyBkeSAqIHdoZWVsUGl4ZWxzUGVyVW5pdCwgc2Nyb2xsLnNjcm9sbEhlaWdodCAtIHNjcm9sbC5jbGllbnRIZWlnaHQpKSk7XG4gICAgICBzZXRTY3JvbGxMZWZ0KGNtLCBNYXRoLm1heCgwLCBNYXRoLm1pbihzY3JvbGwuc2Nyb2xsTGVmdCArIGR4ICogd2hlZWxQaXhlbHNQZXJVbml0LCBzY3JvbGwuc2Nyb2xsV2lkdGggLSBzY3JvbGwuY2xpZW50V2lkdGgpKSk7XG4gICAgICAvLyBPbmx5IHByZXZlbnQgZGVmYXVsdCBzY3JvbGxpbmcgaWYgdmVydGljYWwgc2Nyb2xsaW5nIGlzXG4gICAgICAvLyBhY3R1YWxseSBwb3NzaWJsZS4gT3RoZXJ3aXNlLCBpdCBjYXVzZXMgdmVydGljYWwgc2Nyb2xsXG4gICAgICAvLyBqaXR0ZXIgb24gT1NYIHRyYWNrcGFkcyB3aGVuIGRlbHRhWCBpcyBzbWFsbCBhbmQgZGVsdGFZXG4gICAgICAvLyBpcyBsYXJnZSAoaXNzdWUgIzM1NzkpXG4gICAgICBpZiAoIWR5IHx8IChkeSAmJiBjYW5TY3JvbGxZKSlcbiAgICAgICAgZV9wcmV2ZW50RGVmYXVsdChlKTtcbiAgICAgIGRpc3BsYXkud2hlZWxTdGFydFggPSBudWxsOyAvLyBBYm9ydCBtZWFzdXJlbWVudCwgaWYgaW4gcHJvZ3Jlc3NcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyAnUHJvamVjdCcgdGhlIHZpc2libGUgdmlld3BvcnQgdG8gY292ZXIgdGhlIGFyZWEgdGhhdCBpcyBiZWluZ1xuICAgIC8vIHNjcm9sbGVkIGludG8gdmlldyAoaWYgd2Uga25vdyBlbm91Z2ggdG8gZXN0aW1hdGUgaXQpLlxuICAgIGlmIChkeSAmJiB3aGVlbFBpeGVsc1BlclVuaXQgIT0gbnVsbCkge1xuICAgICAgdmFyIHBpeGVscyA9IGR5ICogd2hlZWxQaXhlbHNQZXJVbml0O1xuICAgICAgdmFyIHRvcCA9IGNtLmRvYy5zY3JvbGxUb3AsIGJvdCA9IHRvcCArIGRpc3BsYXkud3JhcHBlci5jbGllbnRIZWlnaHQ7XG4gICAgICBpZiAocGl4ZWxzIDwgMCkgdG9wID0gTWF0aC5tYXgoMCwgdG9wICsgcGl4ZWxzIC0gNTApO1xuICAgICAgZWxzZSBib3QgPSBNYXRoLm1pbihjbS5kb2MuaGVpZ2h0LCBib3QgKyBwaXhlbHMgKyA1MCk7XG4gICAgICB1cGRhdGVEaXNwbGF5U2ltcGxlKGNtLCB7dG9wOiB0b3AsIGJvdHRvbTogYm90fSk7XG4gICAgfVxuXG4gICAgaWYgKHdoZWVsU2FtcGxlcyA8IDIwKSB7XG4gICAgICBpZiAoZGlzcGxheS53aGVlbFN0YXJ0WCA9PSBudWxsKSB7XG4gICAgICAgIGRpc3BsYXkud2hlZWxTdGFydFggPSBzY3JvbGwuc2Nyb2xsTGVmdDsgZGlzcGxheS53aGVlbFN0YXJ0WSA9IHNjcm9sbC5zY3JvbGxUb3A7XG4gICAgICAgIGRpc3BsYXkud2hlZWxEWCA9IGR4OyBkaXNwbGF5LndoZWVsRFkgPSBkeTtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoZGlzcGxheS53aGVlbFN0YXJ0WCA9PSBudWxsKSByZXR1cm47XG4gICAgICAgICAgdmFyIG1vdmVkWCA9IHNjcm9sbC5zY3JvbGxMZWZ0IC0gZGlzcGxheS53aGVlbFN0YXJ0WDtcbiAgICAgICAgICB2YXIgbW92ZWRZID0gc2Nyb2xsLnNjcm9sbFRvcCAtIGRpc3BsYXkud2hlZWxTdGFydFk7XG4gICAgICAgICAgdmFyIHNhbXBsZSA9IChtb3ZlZFkgJiYgZGlzcGxheS53aGVlbERZICYmIG1vdmVkWSAvIGRpc3BsYXkud2hlZWxEWSkgfHxcbiAgICAgICAgICAgIChtb3ZlZFggJiYgZGlzcGxheS53aGVlbERYICYmIG1vdmVkWCAvIGRpc3BsYXkud2hlZWxEWCk7XG4gICAgICAgICAgZGlzcGxheS53aGVlbFN0YXJ0WCA9IGRpc3BsYXkud2hlZWxTdGFydFkgPSBudWxsO1xuICAgICAgICAgIGlmICghc2FtcGxlKSByZXR1cm47XG4gICAgICAgICAgd2hlZWxQaXhlbHNQZXJVbml0ID0gKHdoZWVsUGl4ZWxzUGVyVW5pdCAqIHdoZWVsU2FtcGxlcyArIHNhbXBsZSkgLyAod2hlZWxTYW1wbGVzICsgMSk7XG4gICAgICAgICAgKyt3aGVlbFNhbXBsZXM7XG4gICAgICAgIH0sIDIwMCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkaXNwbGF5LndoZWVsRFggKz0gZHg7IGRpc3BsYXkud2hlZWxEWSArPSBkeTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBLRVkgRVZFTlRTXG5cbiAgLy8gUnVuIGEgaGFuZGxlciB0aGF0IHdhcyBib3VuZCB0byBhIGtleS5cbiAgZnVuY3Rpb24gZG9IYW5kbGVCaW5kaW5nKGNtLCBib3VuZCwgZHJvcFNoaWZ0KSB7XG4gICAgaWYgKHR5cGVvZiBib3VuZCA9PSBcInN0cmluZ1wiKSB7XG4gICAgICBib3VuZCA9IGNvbW1hbmRzW2JvdW5kXTtcbiAgICAgIGlmICghYm91bmQpIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gRW5zdXJlIHByZXZpb3VzIGlucHV0IGhhcyBiZWVuIHJlYWQsIHNvIHRoYXQgdGhlIGhhbmRsZXIgc2VlcyBhXG4gICAgLy8gY29uc2lzdGVudCB2aWV3IG9mIHRoZSBkb2N1bWVudFxuICAgIGNtLmRpc3BsYXkuaW5wdXQuZW5zdXJlUG9sbGVkKCk7XG4gICAgdmFyIHByZXZTaGlmdCA9IGNtLmRpc3BsYXkuc2hpZnQsIGRvbmUgPSBmYWxzZTtcbiAgICB0cnkge1xuICAgICAgaWYgKGlzUmVhZE9ubHkoY20pKSBjbS5zdGF0ZS5zdXBwcmVzc0VkaXRzID0gdHJ1ZTtcbiAgICAgIGlmIChkcm9wU2hpZnQpIGNtLmRpc3BsYXkuc2hpZnQgPSBmYWxzZTtcbiAgICAgIGRvbmUgPSBib3VuZChjbSkgIT0gUGFzcztcbiAgICB9IGZpbmFsbHkge1xuICAgICAgY20uZGlzcGxheS5zaGlmdCA9IHByZXZTaGlmdDtcbiAgICAgIGNtLnN0YXRlLnN1cHByZXNzRWRpdHMgPSBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIGRvbmU7XG4gIH1cblxuICBmdW5jdGlvbiBsb29rdXBLZXlGb3JFZGl0b3IoY20sIG5hbWUsIGhhbmRsZSkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY20uc3RhdGUua2V5TWFwcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHJlc3VsdCA9IGxvb2t1cEtleShuYW1lLCBjbS5zdGF0ZS5rZXlNYXBzW2ldLCBoYW5kbGUsIGNtKTtcbiAgICAgIGlmIChyZXN1bHQpIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIHJldHVybiAoY20ub3B0aW9ucy5leHRyYUtleXMgJiYgbG9va3VwS2V5KG5hbWUsIGNtLm9wdGlvbnMuZXh0cmFLZXlzLCBoYW5kbGUsIGNtKSlcbiAgICAgIHx8IGxvb2t1cEtleShuYW1lLCBjbS5vcHRpb25zLmtleU1hcCwgaGFuZGxlLCBjbSk7XG4gIH1cblxuICB2YXIgc3RvcFNlcSA9IG5ldyBEZWxheWVkO1xuICBmdW5jdGlvbiBkaXNwYXRjaEtleShjbSwgbmFtZSwgZSwgaGFuZGxlKSB7XG4gICAgdmFyIHNlcSA9IGNtLnN0YXRlLmtleVNlcTtcbiAgICBpZiAoc2VxKSB7XG4gICAgICBpZiAoaXNNb2RpZmllcktleShuYW1lKSkgcmV0dXJuIFwiaGFuZGxlZFwiO1xuICAgICAgc3RvcFNlcS5zZXQoNTAsIGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoY20uc3RhdGUua2V5U2VxID09IHNlcSkge1xuICAgICAgICAgIGNtLnN0YXRlLmtleVNlcSA9IG51bGw7XG4gICAgICAgICAgY20uZGlzcGxheS5pbnB1dC5yZXNldCgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIG5hbWUgPSBzZXEgKyBcIiBcIiArIG5hbWU7XG4gICAgfVxuICAgIHZhciByZXN1bHQgPSBsb29rdXBLZXlGb3JFZGl0b3IoY20sIG5hbWUsIGhhbmRsZSk7XG5cbiAgICBpZiAocmVzdWx0ID09IFwibXVsdGlcIilcbiAgICAgIGNtLnN0YXRlLmtleVNlcSA9IG5hbWU7XG4gICAgaWYgKHJlc3VsdCA9PSBcImhhbmRsZWRcIilcbiAgICAgIHNpZ25hbExhdGVyKGNtLCBcImtleUhhbmRsZWRcIiwgY20sIG5hbWUsIGUpO1xuXG4gICAgaWYgKHJlc3VsdCA9PSBcImhhbmRsZWRcIiB8fCByZXN1bHQgPT0gXCJtdWx0aVwiKSB7XG4gICAgICBlX3ByZXZlbnREZWZhdWx0KGUpO1xuICAgICAgcmVzdGFydEJsaW5rKGNtKTtcbiAgICB9XG5cbiAgICBpZiAoc2VxICYmICFyZXN1bHQgJiYgL1xcJyQvLnRlc3QobmFtZSkpIHtcbiAgICAgIGVfcHJldmVudERlZmF1bHQoZSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuICEhcmVzdWx0O1xuICB9XG5cbiAgLy8gSGFuZGxlIGEga2V5IGZyb20gdGhlIGtleWRvd24gZXZlbnQuXG4gIGZ1bmN0aW9uIGhhbmRsZUtleUJpbmRpbmcoY20sIGUpIHtcbiAgICB2YXIgbmFtZSA9IGtleU5hbWUoZSwgdHJ1ZSk7XG4gICAgaWYgKCFuYW1lKSByZXR1cm4gZmFsc2U7XG5cbiAgICBpZiAoZS5zaGlmdEtleSAmJiAhY20uc3RhdGUua2V5U2VxKSB7XG4gICAgICAvLyBGaXJzdCB0cnkgdG8gcmVzb2x2ZSBmdWxsIG5hbWUgKGluY2x1ZGluZyAnU2hpZnQtJykuIEZhaWxpbmdcbiAgICAgIC8vIHRoYXQsIHNlZSBpZiB0aGVyZSBpcyBhIGN1cnNvci1tb3Rpb24gY29tbWFuZCAoc3RhcnRpbmcgd2l0aFxuICAgICAgLy8gJ2dvJykgYm91bmQgdG8gdGhlIGtleW5hbWUgd2l0aG91dCAnU2hpZnQtJy5cbiAgICAgIHJldHVybiBkaXNwYXRjaEtleShjbSwgXCJTaGlmdC1cIiArIG5hbWUsIGUsIGZ1bmN0aW9uKGIpIHtyZXR1cm4gZG9IYW5kbGVCaW5kaW5nKGNtLCBiLCB0cnVlKTt9KVxuICAgICAgICAgIHx8IGRpc3BhdGNoS2V5KGNtLCBuYW1lLCBlLCBmdW5jdGlvbihiKSB7XG4gICAgICAgICAgICAgICBpZiAodHlwZW9mIGIgPT0gXCJzdHJpbmdcIiA/IC9eZ29bQS1aXS8udGVzdChiKSA6IGIubW90aW9uKVxuICAgICAgICAgICAgICAgICByZXR1cm4gZG9IYW5kbGVCaW5kaW5nKGNtLCBiKTtcbiAgICAgICAgICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGRpc3BhdGNoS2V5KGNtLCBuYW1lLCBlLCBmdW5jdGlvbihiKSB7IHJldHVybiBkb0hhbmRsZUJpbmRpbmcoY20sIGIpOyB9KTtcbiAgICB9XG4gIH1cblxuICAvLyBIYW5kbGUgYSBrZXkgZnJvbSB0aGUga2V5cHJlc3MgZXZlbnRcbiAgZnVuY3Rpb24gaGFuZGxlQ2hhckJpbmRpbmcoY20sIGUsIGNoKSB7XG4gICAgcmV0dXJuIGRpc3BhdGNoS2V5KGNtLCBcIidcIiArIGNoICsgXCInXCIsIGUsXG4gICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uKGIpIHsgcmV0dXJuIGRvSGFuZGxlQmluZGluZyhjbSwgYiwgdHJ1ZSk7IH0pO1xuICB9XG5cbiAgdmFyIGxhc3RTdG9wcGVkS2V5ID0gbnVsbDtcbiAgZnVuY3Rpb24gb25LZXlEb3duKGUpIHtcbiAgICB2YXIgY20gPSB0aGlzO1xuICAgIGNtLmN1ck9wLmZvY3VzID0gYWN0aXZlRWx0KCk7XG4gICAgaWYgKHNpZ25hbERPTUV2ZW50KGNtLCBlKSkgcmV0dXJuO1xuICAgIC8vIElFIGRvZXMgc3RyYW5nZSB0aGluZ3Mgd2l0aCBlc2NhcGUuXG4gICAgaWYgKGllICYmIGllX3ZlcnNpb24gPCAxMSAmJiBlLmtleUNvZGUgPT0gMjcpIGUucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgICB2YXIgY29kZSA9IGUua2V5Q29kZTtcbiAgICBjbS5kaXNwbGF5LnNoaWZ0ID0gY29kZSA9PSAxNiB8fCBlLnNoaWZ0S2V5O1xuICAgIHZhciBoYW5kbGVkID0gaGFuZGxlS2V5QmluZGluZyhjbSwgZSk7XG4gICAgaWYgKHByZXN0bykge1xuICAgICAgbGFzdFN0b3BwZWRLZXkgPSBoYW5kbGVkID8gY29kZSA6IG51bGw7XG4gICAgICAvLyBPcGVyYSBoYXMgbm8gY3V0IGV2ZW50Li4uIHdlIHRyeSB0byBhdCBsZWFzdCBjYXRjaCB0aGUga2V5IGNvbWJvXG4gICAgICBpZiAoIWhhbmRsZWQgJiYgY29kZSA9PSA4OCAmJiAhaGFzQ29weUV2ZW50ICYmIChtYWMgPyBlLm1ldGFLZXkgOiBlLmN0cmxLZXkpKVxuICAgICAgICBjbS5yZXBsYWNlU2VsZWN0aW9uKFwiXCIsIG51bGwsIFwiY3V0XCIpO1xuICAgIH1cblxuICAgIC8vIFR1cm4gbW91c2UgaW50byBjcm9zc2hhaXIgd2hlbiBBbHQgaXMgaGVsZCBvbiBNYWMuXG4gICAgaWYgKGNvZGUgPT0gMTggJiYgIS9cXGJDb2RlTWlycm9yLWNyb3NzaGFpclxcYi8udGVzdChjbS5kaXNwbGF5LmxpbmVEaXYuY2xhc3NOYW1lKSlcbiAgICAgIHNob3dDcm9zc0hhaXIoY20pO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0Nyb3NzSGFpcihjbSkge1xuICAgIHZhciBsaW5lRGl2ID0gY20uZGlzcGxheS5saW5lRGl2O1xuICAgIGFkZENsYXNzKGxpbmVEaXYsIFwiQ29kZU1pcnJvci1jcm9zc2hhaXJcIik7XG5cbiAgICBmdW5jdGlvbiB1cChlKSB7XG4gICAgICBpZiAoZS5rZXlDb2RlID09IDE4IHx8ICFlLmFsdEtleSkge1xuICAgICAgICBybUNsYXNzKGxpbmVEaXYsIFwiQ29kZU1pcnJvci1jcm9zc2hhaXJcIik7XG4gICAgICAgIG9mZihkb2N1bWVudCwgXCJrZXl1cFwiLCB1cCk7XG4gICAgICAgIG9mZihkb2N1bWVudCwgXCJtb3VzZW92ZXJcIiwgdXApO1xuICAgICAgfVxuICAgIH1cbiAgICBvbihkb2N1bWVudCwgXCJrZXl1cFwiLCB1cCk7XG4gICAgb24oZG9jdW1lbnQsIFwibW91c2VvdmVyXCIsIHVwKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG9uS2V5VXAoZSkge1xuICAgIGlmIChlLmtleUNvZGUgPT0gMTYpIHRoaXMuZG9jLnNlbC5zaGlmdCA9IGZhbHNlO1xuICAgIHNpZ25hbERPTUV2ZW50KHRoaXMsIGUpO1xuICB9XG5cbiAgZnVuY3Rpb24gb25LZXlQcmVzcyhlKSB7XG4gICAgdmFyIGNtID0gdGhpcztcbiAgICBpZiAoZXZlbnRJbldpZGdldChjbS5kaXNwbGF5LCBlKSB8fCBzaWduYWxET01FdmVudChjbSwgZSkgfHwgZS5jdHJsS2V5ICYmICFlLmFsdEtleSB8fCBtYWMgJiYgZS5tZXRhS2V5KSByZXR1cm47XG4gICAgdmFyIGtleUNvZGUgPSBlLmtleUNvZGUsIGNoYXJDb2RlID0gZS5jaGFyQ29kZTtcbiAgICBpZiAocHJlc3RvICYmIGtleUNvZGUgPT0gbGFzdFN0b3BwZWRLZXkpIHtsYXN0U3RvcHBlZEtleSA9IG51bGw7IGVfcHJldmVudERlZmF1bHQoZSk7IHJldHVybjt9XG4gICAgaWYgKChwcmVzdG8gJiYgKCFlLndoaWNoIHx8IGUud2hpY2ggPCAxMCkpICYmIGhhbmRsZUtleUJpbmRpbmcoY20sIGUpKSByZXR1cm47XG4gICAgdmFyIGNoID0gU3RyaW5nLmZyb21DaGFyQ29kZShjaGFyQ29kZSA9PSBudWxsID8ga2V5Q29kZSA6IGNoYXJDb2RlKTtcbiAgICBpZiAoaGFuZGxlQ2hhckJpbmRpbmcoY20sIGUsIGNoKSkgcmV0dXJuO1xuICAgIGNtLmRpc3BsYXkuaW5wdXQub25LZXlQcmVzcyhlKTtcbiAgfVxuXG4gIC8vIEZPQ1VTL0JMVVIgRVZFTlRTXG5cbiAgZnVuY3Rpb24gZGVsYXlCbHVyRXZlbnQoY20pIHtcbiAgICBjbS5zdGF0ZS5kZWxheWluZ0JsdXJFdmVudCA9IHRydWU7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgIGlmIChjbS5zdGF0ZS5kZWxheWluZ0JsdXJFdmVudCkge1xuICAgICAgICBjbS5zdGF0ZS5kZWxheWluZ0JsdXJFdmVudCA9IGZhbHNlO1xuICAgICAgICBvbkJsdXIoY20pO1xuICAgICAgfVxuICAgIH0sIDEwMCk7XG4gIH1cblxuICBmdW5jdGlvbiBvbkZvY3VzKGNtKSB7XG4gICAgaWYgKGNtLnN0YXRlLmRlbGF5aW5nQmx1ckV2ZW50KSBjbS5zdGF0ZS5kZWxheWluZ0JsdXJFdmVudCA9IGZhbHNlO1xuXG4gICAgaWYgKGNtLm9wdGlvbnMucmVhZE9ubHkgPT0gXCJub2N1cnNvclwiKSByZXR1cm47XG4gICAgaWYgKCFjbS5zdGF0ZS5mb2N1c2VkKSB7XG4gICAgICBzaWduYWwoY20sIFwiZm9jdXNcIiwgY20pO1xuICAgICAgY20uc3RhdGUuZm9jdXNlZCA9IHRydWU7XG4gICAgICBhZGRDbGFzcyhjbS5kaXNwbGF5LndyYXBwZXIsIFwiQ29kZU1pcnJvci1mb2N1c2VkXCIpO1xuICAgICAgLy8gVGhpcyB0ZXN0IHByZXZlbnRzIHRoaXMgZnJvbSBmaXJpbmcgd2hlbiBhIGNvbnRleHRcbiAgICAgIC8vIG1lbnUgaXMgY2xvc2VkIChzaW5jZSB0aGUgaW5wdXQgcmVzZXQgd291bGQga2lsbCB0aGVcbiAgICAgIC8vIHNlbGVjdC1hbGwgZGV0ZWN0aW9uIGhhY2spXG4gICAgICBpZiAoIWNtLmN1ck9wICYmIGNtLmRpc3BsYXkuc2VsRm9yQ29udGV4dE1lbnUgIT0gY20uZG9jLnNlbCkge1xuICAgICAgICBjbS5kaXNwbGF5LmlucHV0LnJlc2V0KCk7XG4gICAgICAgIGlmICh3ZWJraXQpIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IGNtLmRpc3BsYXkuaW5wdXQucmVzZXQodHJ1ZSk7IH0sIDIwKTsgLy8gSXNzdWUgIzE3MzBcbiAgICAgIH1cbiAgICAgIGNtLmRpc3BsYXkuaW5wdXQucmVjZWl2ZWRGb2N1cygpO1xuICAgIH1cbiAgICByZXN0YXJ0QmxpbmsoY20pO1xuICB9XG4gIGZ1bmN0aW9uIG9uQmx1cihjbSkge1xuICAgIGlmIChjbS5zdGF0ZS5kZWxheWluZ0JsdXJFdmVudCkgcmV0dXJuO1xuXG4gICAgaWYgKGNtLnN0YXRlLmZvY3VzZWQpIHtcbiAgICAgIHNpZ25hbChjbSwgXCJibHVyXCIsIGNtKTtcbiAgICAgIGNtLnN0YXRlLmZvY3VzZWQgPSBmYWxzZTtcbiAgICAgIHJtQ2xhc3MoY20uZGlzcGxheS53cmFwcGVyLCBcIkNvZGVNaXJyb3ItZm9jdXNlZFwiKTtcbiAgICB9XG4gICAgY2xlYXJJbnRlcnZhbChjbS5kaXNwbGF5LmJsaW5rZXIpO1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7aWYgKCFjbS5zdGF0ZS5mb2N1c2VkKSBjbS5kaXNwbGF5LnNoaWZ0ID0gZmFsc2U7fSwgMTUwKTtcbiAgfVxuXG4gIC8vIENPTlRFWFQgTUVOVSBIQU5ETElOR1xuXG4gIC8vIFRvIG1ha2UgdGhlIGNvbnRleHQgbWVudSB3b3JrLCB3ZSBuZWVkIHRvIGJyaWVmbHkgdW5oaWRlIHRoZVxuICAvLyB0ZXh0YXJlYSAobWFraW5nIGl0IGFzIHVub2J0cnVzaXZlIGFzIHBvc3NpYmxlKSB0byBsZXQgdGhlXG4gIC8vIHJpZ2h0LWNsaWNrIHRha2UgZWZmZWN0IG9uIGl0LlxuICBmdW5jdGlvbiBvbkNvbnRleHRNZW51KGNtLCBlKSB7XG4gICAgaWYgKGV2ZW50SW5XaWRnZXQoY20uZGlzcGxheSwgZSkgfHwgY29udGV4dE1lbnVJbkd1dHRlcihjbSwgZSkpIHJldHVybjtcbiAgICBpZiAoc2lnbmFsRE9NRXZlbnQoY20sIGUsIFwiY29udGV4dG1lbnVcIikpIHJldHVybjtcbiAgICBjbS5kaXNwbGF5LmlucHV0Lm9uQ29udGV4dE1lbnUoZSk7XG4gIH1cblxuICBmdW5jdGlvbiBjb250ZXh0TWVudUluR3V0dGVyKGNtLCBlKSB7XG4gICAgaWYgKCFoYXNIYW5kbGVyKGNtLCBcImd1dHRlckNvbnRleHRNZW51XCIpKSByZXR1cm4gZmFsc2U7XG4gICAgcmV0dXJuIGd1dHRlckV2ZW50KGNtLCBlLCBcImd1dHRlckNvbnRleHRNZW51XCIsIGZhbHNlKTtcbiAgfVxuXG4gIC8vIFVQREFUSU5HXG5cbiAgLy8gQ29tcHV0ZSB0aGUgcG9zaXRpb24gb2YgdGhlIGVuZCBvZiBhIGNoYW5nZSAoaXRzICd0bycgcHJvcGVydHlcbiAgLy8gcmVmZXJzIHRvIHRoZSBwcmUtY2hhbmdlIGVuZCkuXG4gIHZhciBjaGFuZ2VFbmQgPSBDb2RlTWlycm9yLmNoYW5nZUVuZCA9IGZ1bmN0aW9uKGNoYW5nZSkge1xuICAgIGlmICghY2hhbmdlLnRleHQpIHJldHVybiBjaGFuZ2UudG87XG4gICAgcmV0dXJuIFBvcyhjaGFuZ2UuZnJvbS5saW5lICsgY2hhbmdlLnRleHQubGVuZ3RoIC0gMSxcbiAgICAgICAgICAgICAgIGxzdChjaGFuZ2UudGV4dCkubGVuZ3RoICsgKGNoYW5nZS50ZXh0Lmxlbmd0aCA9PSAxID8gY2hhbmdlLmZyb20uY2ggOiAwKSk7XG4gIH07XG5cbiAgLy8gQWRqdXN0IGEgcG9zaXRpb24gdG8gcmVmZXIgdG8gdGhlIHBvc3QtY2hhbmdlIHBvc2l0aW9uIG9mIHRoZVxuICAvLyBzYW1lIHRleHQsIG9yIHRoZSBlbmQgb2YgdGhlIGNoYW5nZSBpZiB0aGUgY2hhbmdlIGNvdmVycyBpdC5cbiAgZnVuY3Rpb24gYWRqdXN0Rm9yQ2hhbmdlKHBvcywgY2hhbmdlKSB7XG4gICAgaWYgKGNtcChwb3MsIGNoYW5nZS5mcm9tKSA8IDApIHJldHVybiBwb3M7XG4gICAgaWYgKGNtcChwb3MsIGNoYW5nZS50bykgPD0gMCkgcmV0dXJuIGNoYW5nZUVuZChjaGFuZ2UpO1xuXG4gICAgdmFyIGxpbmUgPSBwb3MubGluZSArIGNoYW5nZS50ZXh0Lmxlbmd0aCAtIChjaGFuZ2UudG8ubGluZSAtIGNoYW5nZS5mcm9tLmxpbmUpIC0gMSwgY2ggPSBwb3MuY2g7XG4gICAgaWYgKHBvcy5saW5lID09IGNoYW5nZS50by5saW5lKSBjaCArPSBjaGFuZ2VFbmQoY2hhbmdlKS5jaCAtIGNoYW5nZS50by5jaDtcbiAgICByZXR1cm4gUG9zKGxpbmUsIGNoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvbXB1dGVTZWxBZnRlckNoYW5nZShkb2MsIGNoYW5nZSkge1xuICAgIHZhciBvdXQgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRvYy5zZWwucmFuZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgcmFuZ2UgPSBkb2Muc2VsLnJhbmdlc1tpXTtcbiAgICAgIG91dC5wdXNoKG5ldyBSYW5nZShhZGp1c3RGb3JDaGFuZ2UocmFuZ2UuYW5jaG9yLCBjaGFuZ2UpLFxuICAgICAgICAgICAgICAgICAgICAgICAgIGFkanVzdEZvckNoYW5nZShyYW5nZS5oZWFkLCBjaGFuZ2UpKSk7XG4gICAgfVxuICAgIHJldHVybiBub3JtYWxpemVTZWxlY3Rpb24ob3V0LCBkb2Muc2VsLnByaW1JbmRleCk7XG4gIH1cblxuICBmdW5jdGlvbiBvZmZzZXRQb3MocG9zLCBvbGQsIG53KSB7XG4gICAgaWYgKHBvcy5saW5lID09IG9sZC5saW5lKVxuICAgICAgcmV0dXJuIFBvcyhudy5saW5lLCBwb3MuY2ggLSBvbGQuY2ggKyBudy5jaCk7XG4gICAgZWxzZVxuICAgICAgcmV0dXJuIFBvcyhudy5saW5lICsgKHBvcy5saW5lIC0gb2xkLmxpbmUpLCBwb3MuY2gpO1xuICB9XG5cbiAgLy8gVXNlZCBieSByZXBsYWNlU2VsZWN0aW9ucyB0byBhbGxvdyBtb3ZpbmcgdGhlIHNlbGVjdGlvbiB0byB0aGVcbiAgLy8gc3RhcnQgb3IgYXJvdW5kIHRoZSByZXBsYWNlZCB0ZXN0LiBIaW50IG1heSBiZSBcInN0YXJ0XCIgb3IgXCJhcm91bmRcIi5cbiAgZnVuY3Rpb24gY29tcHV0ZVJlcGxhY2VkU2VsKGRvYywgY2hhbmdlcywgaGludCkge1xuICAgIHZhciBvdXQgPSBbXTtcbiAgICB2YXIgb2xkUHJldiA9IFBvcyhkb2MuZmlyc3QsIDApLCBuZXdQcmV2ID0gb2xkUHJldjtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoYW5nZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBjaGFuZ2UgPSBjaGFuZ2VzW2ldO1xuICAgICAgdmFyIGZyb20gPSBvZmZzZXRQb3MoY2hhbmdlLmZyb20sIG9sZFByZXYsIG5ld1ByZXYpO1xuICAgICAgdmFyIHRvID0gb2Zmc2V0UG9zKGNoYW5nZUVuZChjaGFuZ2UpLCBvbGRQcmV2LCBuZXdQcmV2KTtcbiAgICAgIG9sZFByZXYgPSBjaGFuZ2UudG87XG4gICAgICBuZXdQcmV2ID0gdG87XG4gICAgICBpZiAoaGludCA9PSBcImFyb3VuZFwiKSB7XG4gICAgICAgIHZhciByYW5nZSA9IGRvYy5zZWwucmFuZ2VzW2ldLCBpbnYgPSBjbXAocmFuZ2UuaGVhZCwgcmFuZ2UuYW5jaG9yKSA8IDA7XG4gICAgICAgIG91dFtpXSA9IG5ldyBSYW5nZShpbnYgPyB0byA6IGZyb20sIGludiA/IGZyb20gOiB0byk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvdXRbaV0gPSBuZXcgUmFuZ2UoZnJvbSwgZnJvbSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBuZXcgU2VsZWN0aW9uKG91dCwgZG9jLnNlbC5wcmltSW5kZXgpO1xuICB9XG5cbiAgLy8gQWxsb3cgXCJiZWZvcmVDaGFuZ2VcIiBldmVudCBoYW5kbGVycyB0byBpbmZsdWVuY2UgYSBjaGFuZ2VcbiAgZnVuY3Rpb24gZmlsdGVyQ2hhbmdlKGRvYywgY2hhbmdlLCB1cGRhdGUpIHtcbiAgICB2YXIgb2JqID0ge1xuICAgICAgY2FuY2VsZWQ6IGZhbHNlLFxuICAgICAgZnJvbTogY2hhbmdlLmZyb20sXG4gICAgICB0bzogY2hhbmdlLnRvLFxuICAgICAgdGV4dDogY2hhbmdlLnRleHQsXG4gICAgICBvcmlnaW46IGNoYW5nZS5vcmlnaW4sXG4gICAgICBjYW5jZWw6IGZ1bmN0aW9uKCkgeyB0aGlzLmNhbmNlbGVkID0gdHJ1ZTsgfVxuICAgIH07XG4gICAgaWYgKHVwZGF0ZSkgb2JqLnVwZGF0ZSA9IGZ1bmN0aW9uKGZyb20sIHRvLCB0ZXh0LCBvcmlnaW4pIHtcbiAgICAgIGlmIChmcm9tKSB0aGlzLmZyb20gPSBjbGlwUG9zKGRvYywgZnJvbSk7XG4gICAgICBpZiAodG8pIHRoaXMudG8gPSBjbGlwUG9zKGRvYywgdG8pO1xuICAgICAgaWYgKHRleHQpIHRoaXMudGV4dCA9IHRleHQ7XG4gICAgICBpZiAob3JpZ2luICE9PSB1bmRlZmluZWQpIHRoaXMub3JpZ2luID0gb3JpZ2luO1xuICAgIH07XG4gICAgc2lnbmFsKGRvYywgXCJiZWZvcmVDaGFuZ2VcIiwgZG9jLCBvYmopO1xuICAgIGlmIChkb2MuY20pIHNpZ25hbChkb2MuY20sIFwiYmVmb3JlQ2hhbmdlXCIsIGRvYy5jbSwgb2JqKTtcblxuICAgIGlmIChvYmouY2FuY2VsZWQpIHJldHVybiBudWxsO1xuICAgIHJldHVybiB7ZnJvbTogb2JqLmZyb20sIHRvOiBvYmoudG8sIHRleHQ6IG9iai50ZXh0LCBvcmlnaW46IG9iai5vcmlnaW59O1xuICB9XG5cbiAgLy8gQXBwbHkgYSBjaGFuZ2UgdG8gYSBkb2N1bWVudCwgYW5kIGFkZCBpdCB0byB0aGUgZG9jdW1lbnQnc1xuICAvLyBoaXN0b3J5LCBhbmQgcHJvcGFnYXRpbmcgaXQgdG8gYWxsIGxpbmtlZCBkb2N1bWVudHMuXG4gIGZ1bmN0aW9uIG1ha2VDaGFuZ2UoZG9jLCBjaGFuZ2UsIGlnbm9yZVJlYWRPbmx5KSB7XG4gICAgaWYgKGRvYy5jbSkge1xuICAgICAgaWYgKCFkb2MuY20uY3VyT3ApIHJldHVybiBvcGVyYXRpb24oZG9jLmNtLCBtYWtlQ2hhbmdlKShkb2MsIGNoYW5nZSwgaWdub3JlUmVhZE9ubHkpO1xuICAgICAgaWYgKGRvYy5jbS5zdGF0ZS5zdXBwcmVzc0VkaXRzKSByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGhhc0hhbmRsZXIoZG9jLCBcImJlZm9yZUNoYW5nZVwiKSB8fCBkb2MuY20gJiYgaGFzSGFuZGxlcihkb2MuY20sIFwiYmVmb3JlQ2hhbmdlXCIpKSB7XG4gICAgICBjaGFuZ2UgPSBmaWx0ZXJDaGFuZ2UoZG9jLCBjaGFuZ2UsIHRydWUpO1xuICAgICAgaWYgKCFjaGFuZ2UpIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBQb3NzaWJseSBzcGxpdCBvciBzdXBwcmVzcyB0aGUgdXBkYXRlIGJhc2VkIG9uIHRoZSBwcmVzZW5jZVxuICAgIC8vIG9mIHJlYWQtb25seSBzcGFucyBpbiBpdHMgcmFuZ2UuXG4gICAgdmFyIHNwbGl0ID0gc2F3UmVhZE9ubHlTcGFucyAmJiAhaWdub3JlUmVhZE9ubHkgJiYgcmVtb3ZlUmVhZE9ubHlSYW5nZXMoZG9jLCBjaGFuZ2UuZnJvbSwgY2hhbmdlLnRvKTtcbiAgICBpZiAoc3BsaXQpIHtcbiAgICAgIGZvciAodmFyIGkgPSBzcGxpdC5sZW5ndGggLSAxOyBpID49IDA7IC0taSlcbiAgICAgICAgbWFrZUNoYW5nZUlubmVyKGRvYywge2Zyb206IHNwbGl0W2ldLmZyb20sIHRvOiBzcGxpdFtpXS50bywgdGV4dDogaSA/IFtcIlwiXSA6IGNoYW5nZS50ZXh0fSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG1ha2VDaGFuZ2VJbm5lcihkb2MsIGNoYW5nZSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gbWFrZUNoYW5nZUlubmVyKGRvYywgY2hhbmdlKSB7XG4gICAgaWYgKGNoYW5nZS50ZXh0Lmxlbmd0aCA9PSAxICYmIGNoYW5nZS50ZXh0WzBdID09IFwiXCIgJiYgY21wKGNoYW5nZS5mcm9tLCBjaGFuZ2UudG8pID09IDApIHJldHVybjtcbiAgICB2YXIgc2VsQWZ0ZXIgPSBjb21wdXRlU2VsQWZ0ZXJDaGFuZ2UoZG9jLCBjaGFuZ2UpO1xuICAgIGFkZENoYW5nZVRvSGlzdG9yeShkb2MsIGNoYW5nZSwgc2VsQWZ0ZXIsIGRvYy5jbSA/IGRvYy5jbS5jdXJPcC5pZCA6IE5hTik7XG5cbiAgICBtYWtlQ2hhbmdlU2luZ2xlRG9jKGRvYywgY2hhbmdlLCBzZWxBZnRlciwgc3RyZXRjaFNwYW5zT3ZlckNoYW5nZShkb2MsIGNoYW5nZSkpO1xuICAgIHZhciByZWJhc2VkID0gW107XG5cbiAgICBsaW5rZWREb2NzKGRvYywgZnVuY3Rpb24oZG9jLCBzaGFyZWRIaXN0KSB7XG4gICAgICBpZiAoIXNoYXJlZEhpc3QgJiYgaW5kZXhPZihyZWJhc2VkLCBkb2MuaGlzdG9yeSkgPT0gLTEpIHtcbiAgICAgICAgcmViYXNlSGlzdChkb2MuaGlzdG9yeSwgY2hhbmdlKTtcbiAgICAgICAgcmViYXNlZC5wdXNoKGRvYy5oaXN0b3J5KTtcbiAgICAgIH1cbiAgICAgIG1ha2VDaGFuZ2VTaW5nbGVEb2MoZG9jLCBjaGFuZ2UsIG51bGwsIHN0cmV0Y2hTcGFuc092ZXJDaGFuZ2UoZG9jLCBjaGFuZ2UpKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIFJldmVydCBhIGNoYW5nZSBzdG9yZWQgaW4gYSBkb2N1bWVudCdzIGhpc3RvcnkuXG4gIGZ1bmN0aW9uIG1ha2VDaGFuZ2VGcm9tSGlzdG9yeShkb2MsIHR5cGUsIGFsbG93U2VsZWN0aW9uT25seSkge1xuICAgIGlmIChkb2MuY20gJiYgZG9jLmNtLnN0YXRlLnN1cHByZXNzRWRpdHMpIHJldHVybjtcblxuICAgIHZhciBoaXN0ID0gZG9jLmhpc3RvcnksIGV2ZW50LCBzZWxBZnRlciA9IGRvYy5zZWw7XG4gICAgdmFyIHNvdXJjZSA9IHR5cGUgPT0gXCJ1bmRvXCIgPyBoaXN0LmRvbmUgOiBoaXN0LnVuZG9uZSwgZGVzdCA9IHR5cGUgPT0gXCJ1bmRvXCIgPyBoaXN0LnVuZG9uZSA6IGhpc3QuZG9uZTtcblxuICAgIC8vIFZlcmlmeSB0aGF0IHRoZXJlIGlzIGEgdXNlYWJsZSBldmVudCAoc28gdGhhdCBjdHJsLXogd29uJ3RcbiAgICAvLyBuZWVkbGVzc2x5IGNsZWFyIHNlbGVjdGlvbiBldmVudHMpXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzb3VyY2UubGVuZ3RoOyBpKyspIHtcbiAgICAgIGV2ZW50ID0gc291cmNlW2ldO1xuICAgICAgaWYgKGFsbG93U2VsZWN0aW9uT25seSA/IGV2ZW50LnJhbmdlcyAmJiAhZXZlbnQuZXF1YWxzKGRvYy5zZWwpIDogIWV2ZW50LnJhbmdlcylcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGlmIChpID09IHNvdXJjZS5sZW5ndGgpIHJldHVybjtcbiAgICBoaXN0Lmxhc3RPcmlnaW4gPSBoaXN0Lmxhc3RTZWxPcmlnaW4gPSBudWxsO1xuXG4gICAgZm9yICg7Oykge1xuICAgICAgZXZlbnQgPSBzb3VyY2UucG9wKCk7XG4gICAgICBpZiAoZXZlbnQucmFuZ2VzKSB7XG4gICAgICAgIHB1c2hTZWxlY3Rpb25Ub0hpc3RvcnkoZXZlbnQsIGRlc3QpO1xuICAgICAgICBpZiAoYWxsb3dTZWxlY3Rpb25Pbmx5ICYmICFldmVudC5lcXVhbHMoZG9jLnNlbCkpIHtcbiAgICAgICAgICBzZXRTZWxlY3Rpb24oZG9jLCBldmVudCwge2NsZWFyUmVkbzogZmFsc2V9KTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgc2VsQWZ0ZXIgPSBldmVudDtcbiAgICAgIH1cbiAgICAgIGVsc2UgYnJlYWs7XG4gICAgfVxuXG4gICAgLy8gQnVpbGQgdXAgYSByZXZlcnNlIGNoYW5nZSBvYmplY3QgdG8gYWRkIHRvIHRoZSBvcHBvc2l0ZSBoaXN0b3J5XG4gICAgLy8gc3RhY2sgKHJlZG8gd2hlbiB1bmRvaW5nLCBhbmQgdmljZSB2ZXJzYSkuXG4gICAgdmFyIGFudGlDaGFuZ2VzID0gW107XG4gICAgcHVzaFNlbGVjdGlvblRvSGlzdG9yeShzZWxBZnRlciwgZGVzdCk7XG4gICAgZGVzdC5wdXNoKHtjaGFuZ2VzOiBhbnRpQ2hhbmdlcywgZ2VuZXJhdGlvbjogaGlzdC5nZW5lcmF0aW9ufSk7XG4gICAgaGlzdC5nZW5lcmF0aW9uID0gZXZlbnQuZ2VuZXJhdGlvbiB8fCArK2hpc3QubWF4R2VuZXJhdGlvbjtcblxuICAgIHZhciBmaWx0ZXIgPSBoYXNIYW5kbGVyKGRvYywgXCJiZWZvcmVDaGFuZ2VcIikgfHwgZG9jLmNtICYmIGhhc0hhbmRsZXIoZG9jLmNtLCBcImJlZm9yZUNoYW5nZVwiKTtcblxuICAgIGZvciAodmFyIGkgPSBldmVudC5jaGFuZ2VzLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgICB2YXIgY2hhbmdlID0gZXZlbnQuY2hhbmdlc1tpXTtcbiAgICAgIGNoYW5nZS5vcmlnaW4gPSB0eXBlO1xuICAgICAgaWYgKGZpbHRlciAmJiAhZmlsdGVyQ2hhbmdlKGRvYywgY2hhbmdlLCBmYWxzZSkpIHtcbiAgICAgICAgc291cmNlLmxlbmd0aCA9IDA7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgYW50aUNoYW5nZXMucHVzaChoaXN0b3J5Q2hhbmdlRnJvbUNoYW5nZShkb2MsIGNoYW5nZSkpO1xuXG4gICAgICB2YXIgYWZ0ZXIgPSBpID8gY29tcHV0ZVNlbEFmdGVyQ2hhbmdlKGRvYywgY2hhbmdlKSA6IGxzdChzb3VyY2UpO1xuICAgICAgbWFrZUNoYW5nZVNpbmdsZURvYyhkb2MsIGNoYW5nZSwgYWZ0ZXIsIG1lcmdlT2xkU3BhbnMoZG9jLCBjaGFuZ2UpKTtcbiAgICAgIGlmICghaSAmJiBkb2MuY20pIGRvYy5jbS5zY3JvbGxJbnRvVmlldyh7ZnJvbTogY2hhbmdlLmZyb20sIHRvOiBjaGFuZ2VFbmQoY2hhbmdlKX0pO1xuICAgICAgdmFyIHJlYmFzZWQgPSBbXTtcblxuICAgICAgLy8gUHJvcGFnYXRlIHRvIHRoZSBsaW5rZWQgZG9jdW1lbnRzXG4gICAgICBsaW5rZWREb2NzKGRvYywgZnVuY3Rpb24oZG9jLCBzaGFyZWRIaXN0KSB7XG4gICAgICAgIGlmICghc2hhcmVkSGlzdCAmJiBpbmRleE9mKHJlYmFzZWQsIGRvYy5oaXN0b3J5KSA9PSAtMSkge1xuICAgICAgICAgIHJlYmFzZUhpc3QoZG9jLmhpc3RvcnksIGNoYW5nZSk7XG4gICAgICAgICAgcmViYXNlZC5wdXNoKGRvYy5oaXN0b3J5KTtcbiAgICAgICAgfVxuICAgICAgICBtYWtlQ2hhbmdlU2luZ2xlRG9jKGRvYywgY2hhbmdlLCBudWxsLCBtZXJnZU9sZFNwYW5zKGRvYywgY2hhbmdlKSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvLyBTdWItdmlld3MgbmVlZCB0aGVpciBsaW5lIG51bWJlcnMgc2hpZnRlZCB3aGVuIHRleHQgaXMgYWRkZWRcbiAgLy8gYWJvdmUgb3IgYmVsb3cgdGhlbSBpbiB0aGUgcGFyZW50IGRvY3VtZW50LlxuICBmdW5jdGlvbiBzaGlmdERvYyhkb2MsIGRpc3RhbmNlKSB7XG4gICAgaWYgKGRpc3RhbmNlID09IDApIHJldHVybjtcbiAgICBkb2MuZmlyc3QgKz0gZGlzdGFuY2U7XG4gICAgZG9jLnNlbCA9IG5ldyBTZWxlY3Rpb24obWFwKGRvYy5zZWwucmFuZ2VzLCBmdW5jdGlvbihyYW5nZSkge1xuICAgICAgcmV0dXJuIG5ldyBSYW5nZShQb3MocmFuZ2UuYW5jaG9yLmxpbmUgKyBkaXN0YW5jZSwgcmFuZ2UuYW5jaG9yLmNoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgUG9zKHJhbmdlLmhlYWQubGluZSArIGRpc3RhbmNlLCByYW5nZS5oZWFkLmNoKSk7XG4gICAgfSksIGRvYy5zZWwucHJpbUluZGV4KTtcbiAgICBpZiAoZG9jLmNtKSB7XG4gICAgICByZWdDaGFuZ2UoZG9jLmNtLCBkb2MuZmlyc3QsIGRvYy5maXJzdCAtIGRpc3RhbmNlLCBkaXN0YW5jZSk7XG4gICAgICBmb3IgKHZhciBkID0gZG9jLmNtLmRpc3BsYXksIGwgPSBkLnZpZXdGcm9tOyBsIDwgZC52aWV3VG87IGwrKylcbiAgICAgICAgcmVnTGluZUNoYW5nZShkb2MuY20sIGwsIFwiZ3V0dGVyXCIpO1xuICAgIH1cbiAgfVxuXG4gIC8vIE1vcmUgbG93ZXItbGV2ZWwgY2hhbmdlIGZ1bmN0aW9uLCBoYW5kbGluZyBvbmx5IGEgc2luZ2xlIGRvY3VtZW50XG4gIC8vIChub3QgbGlua2VkIG9uZXMpLlxuICBmdW5jdGlvbiBtYWtlQ2hhbmdlU2luZ2xlRG9jKGRvYywgY2hhbmdlLCBzZWxBZnRlciwgc3BhbnMpIHtcbiAgICBpZiAoZG9jLmNtICYmICFkb2MuY20uY3VyT3ApXG4gICAgICByZXR1cm4gb3BlcmF0aW9uKGRvYy5jbSwgbWFrZUNoYW5nZVNpbmdsZURvYykoZG9jLCBjaGFuZ2UsIHNlbEFmdGVyLCBzcGFucyk7XG5cbiAgICBpZiAoY2hhbmdlLnRvLmxpbmUgPCBkb2MuZmlyc3QpIHtcbiAgICAgIHNoaWZ0RG9jKGRvYywgY2hhbmdlLnRleHQubGVuZ3RoIC0gMSAtIChjaGFuZ2UudG8ubGluZSAtIGNoYW5nZS5mcm9tLmxpbmUpKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGNoYW5nZS5mcm9tLmxpbmUgPiBkb2MubGFzdExpbmUoKSkgcmV0dXJuO1xuXG4gICAgLy8gQ2xpcCB0aGUgY2hhbmdlIHRvIHRoZSBzaXplIG9mIHRoaXMgZG9jXG4gICAgaWYgKGNoYW5nZS5mcm9tLmxpbmUgPCBkb2MuZmlyc3QpIHtcbiAgICAgIHZhciBzaGlmdCA9IGNoYW5nZS50ZXh0Lmxlbmd0aCAtIDEgLSAoZG9jLmZpcnN0IC0gY2hhbmdlLmZyb20ubGluZSk7XG4gICAgICBzaGlmdERvYyhkb2MsIHNoaWZ0KTtcbiAgICAgIGNoYW5nZSA9IHtmcm9tOiBQb3MoZG9jLmZpcnN0LCAwKSwgdG86IFBvcyhjaGFuZ2UudG8ubGluZSArIHNoaWZ0LCBjaGFuZ2UudG8uY2gpLFxuICAgICAgICAgICAgICAgIHRleHQ6IFtsc3QoY2hhbmdlLnRleHQpXSwgb3JpZ2luOiBjaGFuZ2Uub3JpZ2lufTtcbiAgICB9XG4gICAgdmFyIGxhc3QgPSBkb2MubGFzdExpbmUoKTtcbiAgICBpZiAoY2hhbmdlLnRvLmxpbmUgPiBsYXN0KSB7XG4gICAgICBjaGFuZ2UgPSB7ZnJvbTogY2hhbmdlLmZyb20sIHRvOiBQb3MobGFzdCwgZ2V0TGluZShkb2MsIGxhc3QpLnRleHQubGVuZ3RoKSxcbiAgICAgICAgICAgICAgICB0ZXh0OiBbY2hhbmdlLnRleHRbMF1dLCBvcmlnaW46IGNoYW5nZS5vcmlnaW59O1xuICAgIH1cblxuICAgIGNoYW5nZS5yZW1vdmVkID0gZ2V0QmV0d2Vlbihkb2MsIGNoYW5nZS5mcm9tLCBjaGFuZ2UudG8pO1xuXG4gICAgaWYgKCFzZWxBZnRlcikgc2VsQWZ0ZXIgPSBjb21wdXRlU2VsQWZ0ZXJDaGFuZ2UoZG9jLCBjaGFuZ2UpO1xuICAgIGlmIChkb2MuY20pIG1ha2VDaGFuZ2VTaW5nbGVEb2NJbkVkaXRvcihkb2MuY20sIGNoYW5nZSwgc3BhbnMpO1xuICAgIGVsc2UgdXBkYXRlRG9jKGRvYywgY2hhbmdlLCBzcGFucyk7XG4gICAgc2V0U2VsZWN0aW9uTm9VbmRvKGRvYywgc2VsQWZ0ZXIsIHNlbF9kb250U2Nyb2xsKTtcbiAgfVxuXG4gIC8vIEhhbmRsZSB0aGUgaW50ZXJhY3Rpb24gb2YgYSBjaGFuZ2UgdG8gYSBkb2N1bWVudCB3aXRoIHRoZSBlZGl0b3JcbiAgLy8gdGhhdCB0aGlzIGRvY3VtZW50IGlzIHBhcnQgb2YuXG4gIGZ1bmN0aW9uIG1ha2VDaGFuZ2VTaW5nbGVEb2NJbkVkaXRvcihjbSwgY2hhbmdlLCBzcGFucykge1xuICAgIHZhciBkb2MgPSBjbS5kb2MsIGRpc3BsYXkgPSBjbS5kaXNwbGF5LCBmcm9tID0gY2hhbmdlLmZyb20sIHRvID0gY2hhbmdlLnRvO1xuXG4gICAgdmFyIHJlY29tcHV0ZU1heExlbmd0aCA9IGZhbHNlLCBjaGVja1dpZHRoU3RhcnQgPSBmcm9tLmxpbmU7XG4gICAgaWYgKCFjbS5vcHRpb25zLmxpbmVXcmFwcGluZykge1xuICAgICAgY2hlY2tXaWR0aFN0YXJ0ID0gbGluZU5vKHZpc3VhbExpbmUoZ2V0TGluZShkb2MsIGZyb20ubGluZSkpKTtcbiAgICAgIGRvYy5pdGVyKGNoZWNrV2lkdGhTdGFydCwgdG8ubGluZSArIDEsIGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgaWYgKGxpbmUgPT0gZGlzcGxheS5tYXhMaW5lKSB7XG4gICAgICAgICAgcmVjb21wdXRlTWF4TGVuZ3RoID0gdHJ1ZTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKGRvYy5zZWwuY29udGFpbnMoY2hhbmdlLmZyb20sIGNoYW5nZS50bykgPiAtMSlcbiAgICAgIHNpZ25hbEN1cnNvckFjdGl2aXR5KGNtKTtcblxuICAgIHVwZGF0ZURvYyhkb2MsIGNoYW5nZSwgc3BhbnMsIGVzdGltYXRlSGVpZ2h0KGNtKSk7XG5cbiAgICBpZiAoIWNtLm9wdGlvbnMubGluZVdyYXBwaW5nKSB7XG4gICAgICBkb2MuaXRlcihjaGVja1dpZHRoU3RhcnQsIGZyb20ubGluZSArIGNoYW5nZS50ZXh0Lmxlbmd0aCwgZnVuY3Rpb24obGluZSkge1xuICAgICAgICB2YXIgbGVuID0gbGluZUxlbmd0aChsaW5lKTtcbiAgICAgICAgaWYgKGxlbiA+IGRpc3BsYXkubWF4TGluZUxlbmd0aCkge1xuICAgICAgICAgIGRpc3BsYXkubWF4TGluZSA9IGxpbmU7XG4gICAgICAgICAgZGlzcGxheS5tYXhMaW5lTGVuZ3RoID0gbGVuO1xuICAgICAgICAgIGRpc3BsYXkubWF4TGluZUNoYW5nZWQgPSB0cnVlO1xuICAgICAgICAgIHJlY29tcHV0ZU1heExlbmd0aCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGlmIChyZWNvbXB1dGVNYXhMZW5ndGgpIGNtLmN1ck9wLnVwZGF0ZU1heExpbmUgPSB0cnVlO1xuICAgIH1cblxuICAgIC8vIEFkanVzdCBmcm9udGllciwgc2NoZWR1bGUgd29ya2VyXG4gICAgZG9jLmZyb250aWVyID0gTWF0aC5taW4oZG9jLmZyb250aWVyLCBmcm9tLmxpbmUpO1xuICAgIHN0YXJ0V29ya2VyKGNtLCA0MDApO1xuXG4gICAgdmFyIGxlbmRpZmYgPSBjaGFuZ2UudGV4dC5sZW5ndGggLSAodG8ubGluZSAtIGZyb20ubGluZSkgLSAxO1xuICAgIC8vIFJlbWVtYmVyIHRoYXQgdGhlc2UgbGluZXMgY2hhbmdlZCwgZm9yIHVwZGF0aW5nIHRoZSBkaXNwbGF5XG4gICAgaWYgKGNoYW5nZS5mdWxsKVxuICAgICAgcmVnQ2hhbmdlKGNtKTtcbiAgICBlbHNlIGlmIChmcm9tLmxpbmUgPT0gdG8ubGluZSAmJiBjaGFuZ2UudGV4dC5sZW5ndGggPT0gMSAmJiAhaXNXaG9sZUxpbmVVcGRhdGUoY20uZG9jLCBjaGFuZ2UpKVxuICAgICAgcmVnTGluZUNoYW5nZShjbSwgZnJvbS5saW5lLCBcInRleHRcIik7XG4gICAgZWxzZVxuICAgICAgcmVnQ2hhbmdlKGNtLCBmcm9tLmxpbmUsIHRvLmxpbmUgKyAxLCBsZW5kaWZmKTtcblxuICAgIHZhciBjaGFuZ2VzSGFuZGxlciA9IGhhc0hhbmRsZXIoY20sIFwiY2hhbmdlc1wiKSwgY2hhbmdlSGFuZGxlciA9IGhhc0hhbmRsZXIoY20sIFwiY2hhbmdlXCIpO1xuICAgIGlmIChjaGFuZ2VIYW5kbGVyIHx8IGNoYW5nZXNIYW5kbGVyKSB7XG4gICAgICB2YXIgb2JqID0ge1xuICAgICAgICBmcm9tOiBmcm9tLCB0bzogdG8sXG4gICAgICAgIHRleHQ6IGNoYW5nZS50ZXh0LFxuICAgICAgICByZW1vdmVkOiBjaGFuZ2UucmVtb3ZlZCxcbiAgICAgICAgb3JpZ2luOiBjaGFuZ2Uub3JpZ2luXG4gICAgICB9O1xuICAgICAgaWYgKGNoYW5nZUhhbmRsZXIpIHNpZ25hbExhdGVyKGNtLCBcImNoYW5nZVwiLCBjbSwgb2JqKTtcbiAgICAgIGlmIChjaGFuZ2VzSGFuZGxlcikgKGNtLmN1ck9wLmNoYW5nZU9ianMgfHwgKGNtLmN1ck9wLmNoYW5nZU9ianMgPSBbXSkpLnB1c2gob2JqKTtcbiAgICB9XG4gICAgY20uZGlzcGxheS5zZWxGb3JDb250ZXh0TWVudSA9IG51bGw7XG4gIH1cblxuICBmdW5jdGlvbiByZXBsYWNlUmFuZ2UoZG9jLCBjb2RlLCBmcm9tLCB0bywgb3JpZ2luKSB7XG4gICAgaWYgKCF0bykgdG8gPSBmcm9tO1xuICAgIGlmIChjbXAodG8sIGZyb20pIDwgMCkgeyB2YXIgdG1wID0gdG87IHRvID0gZnJvbTsgZnJvbSA9IHRtcDsgfVxuICAgIGlmICh0eXBlb2YgY29kZSA9PSBcInN0cmluZ1wiKSBjb2RlID0gZG9jLnNwbGl0TGluZXMoY29kZSk7XG4gICAgbWFrZUNoYW5nZShkb2MsIHtmcm9tOiBmcm9tLCB0bzogdG8sIHRleHQ6IGNvZGUsIG9yaWdpbjogb3JpZ2lufSk7XG4gIH1cblxuICAvLyBTQ1JPTExJTkcgVEhJTkdTIElOVE8gVklFV1xuXG4gIC8vIElmIGFuIGVkaXRvciBzaXRzIG9uIHRoZSB0b3Agb3IgYm90dG9tIG9mIHRoZSB3aW5kb3csIHBhcnRpYWxseVxuICAvLyBzY3JvbGxlZCBvdXQgb2YgdmlldywgdGhpcyBlbnN1cmVzIHRoYXQgdGhlIGN1cnNvciBpcyB2aXNpYmxlLlxuICBmdW5jdGlvbiBtYXliZVNjcm9sbFdpbmRvdyhjbSwgY29vcmRzKSB7XG4gICAgaWYgKHNpZ25hbERPTUV2ZW50KGNtLCBcInNjcm9sbEN1cnNvckludG9WaWV3XCIpKSByZXR1cm47XG5cbiAgICB2YXIgZGlzcGxheSA9IGNtLmRpc3BsYXksIGJveCA9IGRpc3BsYXkuc2l6ZXIuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksIGRvU2Nyb2xsID0gbnVsbDtcbiAgICBpZiAoY29vcmRzLnRvcCArIGJveC50b3AgPCAwKSBkb1Njcm9sbCA9IHRydWU7XG4gICAgZWxzZSBpZiAoY29vcmRzLmJvdHRvbSArIGJveC50b3AgPiAod2luZG93LmlubmVySGVpZ2h0IHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQpKSBkb1Njcm9sbCA9IGZhbHNlO1xuICAgIGlmIChkb1Njcm9sbCAhPSBudWxsICYmICFwaGFudG9tKSB7XG4gICAgICB2YXIgc2Nyb2xsTm9kZSA9IGVsdChcImRpdlwiLCBcIlxcdTIwMGJcIiwgbnVsbCwgXCJwb3NpdGlvbjogYWJzb2x1dGU7IHRvcDogXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgKGNvb3Jkcy50b3AgLSBkaXNwbGF5LnZpZXdPZmZzZXQgLSBwYWRkaW5nVG9wKGNtLmRpc3BsYXkpKSArIFwicHg7IGhlaWdodDogXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgKGNvb3Jkcy5ib3R0b20gLSBjb29yZHMudG9wICsgc2Nyb2xsR2FwKGNtKSArIGRpc3BsYXkuYmFySGVpZ2h0KSArIFwicHg7IGxlZnQ6IFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvb3Jkcy5sZWZ0ICsgXCJweDsgd2lkdGg6IDJweDtcIik7XG4gICAgICBjbS5kaXNwbGF5LmxpbmVTcGFjZS5hcHBlbmRDaGlsZChzY3JvbGxOb2RlKTtcbiAgICAgIHNjcm9sbE5vZGUuc2Nyb2xsSW50b1ZpZXcoZG9TY3JvbGwpO1xuICAgICAgY20uZGlzcGxheS5saW5lU3BhY2UucmVtb3ZlQ2hpbGQoc2Nyb2xsTm9kZSk7XG4gICAgfVxuICB9XG5cbiAgLy8gU2Nyb2xsIGEgZ2l2ZW4gcG9zaXRpb24gaW50byB2aWV3IChpbW1lZGlhdGVseSksIHZlcmlmeWluZyB0aGF0XG4gIC8vIGl0IGFjdHVhbGx5IGJlY2FtZSB2aXNpYmxlIChhcyBsaW5lIGhlaWdodHMgYXJlIGFjY3VyYXRlbHlcbiAgLy8gbWVhc3VyZWQsIHRoZSBwb3NpdGlvbiBvZiBzb21ldGhpbmcgbWF5ICdkcmlmdCcgZHVyaW5nIGRyYXdpbmcpLlxuICBmdW5jdGlvbiBzY3JvbGxQb3NJbnRvVmlldyhjbSwgcG9zLCBlbmQsIG1hcmdpbikge1xuICAgIGlmIChtYXJnaW4gPT0gbnVsbCkgbWFyZ2luID0gMDtcbiAgICBmb3IgKHZhciBsaW1pdCA9IDA7IGxpbWl0IDwgNTsgbGltaXQrKykge1xuICAgICAgdmFyIGNoYW5nZWQgPSBmYWxzZSwgY29vcmRzID0gY3Vyc29yQ29vcmRzKGNtLCBwb3MpO1xuICAgICAgdmFyIGVuZENvb3JkcyA9ICFlbmQgfHwgZW5kID09IHBvcyA/IGNvb3JkcyA6IGN1cnNvckNvb3JkcyhjbSwgZW5kKTtcbiAgICAgIHZhciBzY3JvbGxQb3MgPSBjYWxjdWxhdGVTY3JvbGxQb3MoY20sIE1hdGgubWluKGNvb3Jkcy5sZWZ0LCBlbmRDb29yZHMubGVmdCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGgubWluKGNvb3Jkcy50b3AsIGVuZENvb3Jkcy50b3ApIC0gbWFyZ2luLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLm1heChjb29yZHMubGVmdCwgZW5kQ29vcmRzLmxlZnQpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLm1heChjb29yZHMuYm90dG9tLCBlbmRDb29yZHMuYm90dG9tKSArIG1hcmdpbik7XG4gICAgICB2YXIgc3RhcnRUb3AgPSBjbS5kb2Muc2Nyb2xsVG9wLCBzdGFydExlZnQgPSBjbS5kb2Muc2Nyb2xsTGVmdDtcbiAgICAgIGlmIChzY3JvbGxQb3Muc2Nyb2xsVG9wICE9IG51bGwpIHtcbiAgICAgICAgc2V0U2Nyb2xsVG9wKGNtLCBzY3JvbGxQb3Muc2Nyb2xsVG9wKTtcbiAgICAgICAgaWYgKE1hdGguYWJzKGNtLmRvYy5zY3JvbGxUb3AgLSBzdGFydFRvcCkgPiAxKSBjaGFuZ2VkID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlmIChzY3JvbGxQb3Muc2Nyb2xsTGVmdCAhPSBudWxsKSB7XG4gICAgICAgIHNldFNjcm9sbExlZnQoY20sIHNjcm9sbFBvcy5zY3JvbGxMZWZ0KTtcbiAgICAgICAgaWYgKE1hdGguYWJzKGNtLmRvYy5zY3JvbGxMZWZ0IC0gc3RhcnRMZWZ0KSA+IDEpIGNoYW5nZWQgPSB0cnVlO1xuICAgICAgfVxuICAgICAgaWYgKCFjaGFuZ2VkKSBicmVhaztcbiAgICB9XG4gICAgcmV0dXJuIGNvb3JkcztcbiAgfVxuXG4gIC8vIFNjcm9sbCBhIGdpdmVuIHNldCBvZiBjb29yZGluYXRlcyBpbnRvIHZpZXcgKGltbWVkaWF0ZWx5KS5cbiAgZnVuY3Rpb24gc2Nyb2xsSW50b1ZpZXcoY20sIHgxLCB5MSwgeDIsIHkyKSB7XG4gICAgdmFyIHNjcm9sbFBvcyA9IGNhbGN1bGF0ZVNjcm9sbFBvcyhjbSwgeDEsIHkxLCB4MiwgeTIpO1xuICAgIGlmIChzY3JvbGxQb3Muc2Nyb2xsVG9wICE9IG51bGwpIHNldFNjcm9sbFRvcChjbSwgc2Nyb2xsUG9zLnNjcm9sbFRvcCk7XG4gICAgaWYgKHNjcm9sbFBvcy5zY3JvbGxMZWZ0ICE9IG51bGwpIHNldFNjcm9sbExlZnQoY20sIHNjcm9sbFBvcy5zY3JvbGxMZWZ0KTtcbiAgfVxuXG4gIC8vIENhbGN1bGF0ZSBhIG5ldyBzY3JvbGwgcG9zaXRpb24gbmVlZGVkIHRvIHNjcm9sbCB0aGUgZ2l2ZW5cbiAgLy8gcmVjdGFuZ2xlIGludG8gdmlldy4gUmV0dXJucyBhbiBvYmplY3Qgd2l0aCBzY3JvbGxUb3AgYW5kXG4gIC8vIHNjcm9sbExlZnQgcHJvcGVydGllcy4gV2hlbiB0aGVzZSBhcmUgdW5kZWZpbmVkLCB0aGVcbiAgLy8gdmVydGljYWwvaG9yaXpvbnRhbCBwb3NpdGlvbiBkb2VzIG5vdCBuZWVkIHRvIGJlIGFkanVzdGVkLlxuICBmdW5jdGlvbiBjYWxjdWxhdGVTY3JvbGxQb3MoY20sIHgxLCB5MSwgeDIsIHkyKSB7XG4gICAgdmFyIGRpc3BsYXkgPSBjbS5kaXNwbGF5LCBzbmFwTWFyZ2luID0gdGV4dEhlaWdodChjbS5kaXNwbGF5KTtcbiAgICBpZiAoeTEgPCAwKSB5MSA9IDA7XG4gICAgdmFyIHNjcmVlbnRvcCA9IGNtLmN1ck9wICYmIGNtLmN1ck9wLnNjcm9sbFRvcCAhPSBudWxsID8gY20uY3VyT3Auc2Nyb2xsVG9wIDogZGlzcGxheS5zY3JvbGxlci5zY3JvbGxUb3A7XG4gICAgdmFyIHNjcmVlbiA9IGRpc3BsYXlIZWlnaHQoY20pLCByZXN1bHQgPSB7fTtcbiAgICBpZiAoeTIgLSB5MSA+IHNjcmVlbikgeTIgPSB5MSArIHNjcmVlbjtcbiAgICB2YXIgZG9jQm90dG9tID0gY20uZG9jLmhlaWdodCArIHBhZGRpbmdWZXJ0KGRpc3BsYXkpO1xuICAgIHZhciBhdFRvcCA9IHkxIDwgc25hcE1hcmdpbiwgYXRCb3R0b20gPSB5MiA+IGRvY0JvdHRvbSAtIHNuYXBNYXJnaW47XG4gICAgaWYgKHkxIDwgc2NyZWVudG9wKSB7XG4gICAgICByZXN1bHQuc2Nyb2xsVG9wID0gYXRUb3AgPyAwIDogeTE7XG4gICAgfSBlbHNlIGlmICh5MiA+IHNjcmVlbnRvcCArIHNjcmVlbikge1xuICAgICAgdmFyIG5ld1RvcCA9IE1hdGgubWluKHkxLCAoYXRCb3R0b20gPyBkb2NCb3R0b20gOiB5MikgLSBzY3JlZW4pO1xuICAgICAgaWYgKG5ld1RvcCAhPSBzY3JlZW50b3ApIHJlc3VsdC5zY3JvbGxUb3AgPSBuZXdUb3A7XG4gICAgfVxuXG4gICAgdmFyIHNjcmVlbmxlZnQgPSBjbS5jdXJPcCAmJiBjbS5jdXJPcC5zY3JvbGxMZWZ0ICE9IG51bGwgPyBjbS5jdXJPcC5zY3JvbGxMZWZ0IDogZGlzcGxheS5zY3JvbGxlci5zY3JvbGxMZWZ0O1xuICAgIHZhciBzY3JlZW53ID0gZGlzcGxheVdpZHRoKGNtKSAtIChjbS5vcHRpb25zLmZpeGVkR3V0dGVyID8gZGlzcGxheS5ndXR0ZXJzLm9mZnNldFdpZHRoIDogMCk7XG4gICAgdmFyIHRvb1dpZGUgPSB4MiAtIHgxID4gc2NyZWVudztcbiAgICBpZiAodG9vV2lkZSkgeDIgPSB4MSArIHNjcmVlbnc7XG4gICAgaWYgKHgxIDwgMTApXG4gICAgICByZXN1bHQuc2Nyb2xsTGVmdCA9IDA7XG4gICAgZWxzZSBpZiAoeDEgPCBzY3JlZW5sZWZ0KVxuICAgICAgcmVzdWx0LnNjcm9sbExlZnQgPSBNYXRoLm1heCgwLCB4MSAtICh0b29XaWRlID8gMCA6IDEwKSk7XG4gICAgZWxzZSBpZiAoeDIgPiBzY3JlZW53ICsgc2NyZWVubGVmdCAtIDMpXG4gICAgICByZXN1bHQuc2Nyb2xsTGVmdCA9IHgyICsgKHRvb1dpZGUgPyAwIDogMTApIC0gc2NyZWVudztcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLy8gU3RvcmUgYSByZWxhdGl2ZSBhZGp1c3RtZW50IHRvIHRoZSBzY3JvbGwgcG9zaXRpb24gaW4gdGhlIGN1cnJlbnRcbiAgLy8gb3BlcmF0aW9uICh0byBiZSBhcHBsaWVkIHdoZW4gdGhlIG9wZXJhdGlvbiBmaW5pc2hlcykuXG4gIGZ1bmN0aW9uIGFkZFRvU2Nyb2xsUG9zKGNtLCBsZWZ0LCB0b3ApIHtcbiAgICBpZiAobGVmdCAhPSBudWxsIHx8IHRvcCAhPSBudWxsKSByZXNvbHZlU2Nyb2xsVG9Qb3MoY20pO1xuICAgIGlmIChsZWZ0ICE9IG51bGwpXG4gICAgICBjbS5jdXJPcC5zY3JvbGxMZWZ0ID0gKGNtLmN1ck9wLnNjcm9sbExlZnQgPT0gbnVsbCA/IGNtLmRvYy5zY3JvbGxMZWZ0IDogY20uY3VyT3Auc2Nyb2xsTGVmdCkgKyBsZWZ0O1xuICAgIGlmICh0b3AgIT0gbnVsbClcbiAgICAgIGNtLmN1ck9wLnNjcm9sbFRvcCA9IChjbS5jdXJPcC5zY3JvbGxUb3AgPT0gbnVsbCA/IGNtLmRvYy5zY3JvbGxUb3AgOiBjbS5jdXJPcC5zY3JvbGxUb3ApICsgdG9wO1xuICB9XG5cbiAgLy8gTWFrZSBzdXJlIHRoYXQgYXQgdGhlIGVuZCBvZiB0aGUgb3BlcmF0aW9uIHRoZSBjdXJyZW50IGN1cnNvciBpc1xuICAvLyBzaG93bi5cbiAgZnVuY3Rpb24gZW5zdXJlQ3Vyc29yVmlzaWJsZShjbSkge1xuICAgIHJlc29sdmVTY3JvbGxUb1BvcyhjbSk7XG4gICAgdmFyIGN1ciA9IGNtLmdldEN1cnNvcigpLCBmcm9tID0gY3VyLCB0byA9IGN1cjtcbiAgICBpZiAoIWNtLm9wdGlvbnMubGluZVdyYXBwaW5nKSB7XG4gICAgICBmcm9tID0gY3VyLmNoID8gUG9zKGN1ci5saW5lLCBjdXIuY2ggLSAxKSA6IGN1cjtcbiAgICAgIHRvID0gUG9zKGN1ci5saW5lLCBjdXIuY2ggKyAxKTtcbiAgICB9XG4gICAgY20uY3VyT3Auc2Nyb2xsVG9Qb3MgPSB7ZnJvbTogZnJvbSwgdG86IHRvLCBtYXJnaW46IGNtLm9wdGlvbnMuY3Vyc29yU2Nyb2xsTWFyZ2luLCBpc0N1cnNvcjogdHJ1ZX07XG4gIH1cblxuICAvLyBXaGVuIGFuIG9wZXJhdGlvbiBoYXMgaXRzIHNjcm9sbFRvUG9zIHByb3BlcnR5IHNldCwgYW5kIGFub3RoZXJcbiAgLy8gc2Nyb2xsIGFjdGlvbiBpcyBhcHBsaWVkIGJlZm9yZSB0aGUgZW5kIG9mIHRoZSBvcGVyYXRpb24sIHRoaXNcbiAgLy8gJ3NpbXVsYXRlcycgc2Nyb2xsaW5nIHRoYXQgcG9zaXRpb24gaW50byB2aWV3IGluIGEgY2hlYXAgd2F5LCBzb1xuICAvLyB0aGF0IHRoZSBlZmZlY3Qgb2YgaW50ZXJtZWRpYXRlIHNjcm9sbCBjb21tYW5kcyBpcyBub3QgaWdub3JlZC5cbiAgZnVuY3Rpb24gcmVzb2x2ZVNjcm9sbFRvUG9zKGNtKSB7XG4gICAgdmFyIHJhbmdlID0gY20uY3VyT3Auc2Nyb2xsVG9Qb3M7XG4gICAgaWYgKHJhbmdlKSB7XG4gICAgICBjbS5jdXJPcC5zY3JvbGxUb1BvcyA9IG51bGw7XG4gICAgICB2YXIgZnJvbSA9IGVzdGltYXRlQ29vcmRzKGNtLCByYW5nZS5mcm9tKSwgdG8gPSBlc3RpbWF0ZUNvb3JkcyhjbSwgcmFuZ2UudG8pO1xuICAgICAgdmFyIHNQb3MgPSBjYWxjdWxhdGVTY3JvbGxQb3MoY20sIE1hdGgubWluKGZyb20ubGVmdCwgdG8ubGVmdCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLm1pbihmcm9tLnRvcCwgdG8udG9wKSAtIHJhbmdlLm1hcmdpbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGgubWF4KGZyb20ucmlnaHQsIHRvLnJpZ2h0KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGgubWF4KGZyb20uYm90dG9tLCB0by5ib3R0b20pICsgcmFuZ2UubWFyZ2luKTtcbiAgICAgIGNtLnNjcm9sbFRvKHNQb3Muc2Nyb2xsTGVmdCwgc1Bvcy5zY3JvbGxUb3ApO1xuICAgIH1cbiAgfVxuXG4gIC8vIEFQSSBVVElMSVRJRVNcblxuICAvLyBJbmRlbnQgdGhlIGdpdmVuIGxpbmUuIFRoZSBob3cgcGFyYW1ldGVyIGNhbiBiZSBcInNtYXJ0XCIsXG4gIC8vIFwiYWRkXCIvbnVsbCwgXCJzdWJ0cmFjdFwiLCBvciBcInByZXZcIi4gV2hlbiBhZ2dyZXNzaXZlIGlzIGZhbHNlXG4gIC8vICh0eXBpY2FsbHkgc2V0IHRvIHRydWUgZm9yIGZvcmNlZCBzaW5nbGUtbGluZSBpbmRlbnRzKSwgZW1wdHlcbiAgLy8gbGluZXMgYXJlIG5vdCBpbmRlbnRlZCwgYW5kIHBsYWNlcyB3aGVyZSB0aGUgbW9kZSByZXR1cm5zIFBhc3NcbiAgLy8gYXJlIGxlZnQgYWxvbmUuXG4gIGZ1bmN0aW9uIGluZGVudExpbmUoY20sIG4sIGhvdywgYWdncmVzc2l2ZSkge1xuICAgIHZhciBkb2MgPSBjbS5kb2MsIHN0YXRlO1xuICAgIGlmIChob3cgPT0gbnVsbCkgaG93ID0gXCJhZGRcIjtcbiAgICBpZiAoaG93ID09IFwic21hcnRcIikge1xuICAgICAgLy8gRmFsbCBiYWNrIHRvIFwicHJldlwiIHdoZW4gdGhlIG1vZGUgZG9lc24ndCBoYXZlIGFuIGluZGVudGF0aW9uXG4gICAgICAvLyBtZXRob2QuXG4gICAgICBpZiAoIWRvYy5tb2RlLmluZGVudCkgaG93ID0gXCJwcmV2XCI7XG4gICAgICBlbHNlIHN0YXRlID0gZ2V0U3RhdGVCZWZvcmUoY20sIG4pO1xuICAgIH1cblxuICAgIHZhciB0YWJTaXplID0gY20ub3B0aW9ucy50YWJTaXplO1xuICAgIHZhciBsaW5lID0gZ2V0TGluZShkb2MsIG4pLCBjdXJTcGFjZSA9IGNvdW50Q29sdW1uKGxpbmUudGV4dCwgbnVsbCwgdGFiU2l6ZSk7XG4gICAgaWYgKGxpbmUuc3RhdGVBZnRlcikgbGluZS5zdGF0ZUFmdGVyID0gbnVsbDtcbiAgICB2YXIgY3VyU3BhY2VTdHJpbmcgPSBsaW5lLnRleHQubWF0Y2goL15cXHMqLylbMF0sIGluZGVudGF0aW9uO1xuICAgIGlmICghYWdncmVzc2l2ZSAmJiAhL1xcUy8udGVzdChsaW5lLnRleHQpKSB7XG4gICAgICBpbmRlbnRhdGlvbiA9IDA7XG4gICAgICBob3cgPSBcIm5vdFwiO1xuICAgIH0gZWxzZSBpZiAoaG93ID09IFwic21hcnRcIikge1xuICAgICAgaW5kZW50YXRpb24gPSBkb2MubW9kZS5pbmRlbnQoc3RhdGUsIGxpbmUudGV4dC5zbGljZShjdXJTcGFjZVN0cmluZy5sZW5ndGgpLCBsaW5lLnRleHQpO1xuICAgICAgaWYgKGluZGVudGF0aW9uID09IFBhc3MgfHwgaW5kZW50YXRpb24gPiAxNTApIHtcbiAgICAgICAgaWYgKCFhZ2dyZXNzaXZlKSByZXR1cm47XG4gICAgICAgIGhvdyA9IFwicHJldlwiO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoaG93ID09IFwicHJldlwiKSB7XG4gICAgICBpZiAobiA+IGRvYy5maXJzdCkgaW5kZW50YXRpb24gPSBjb3VudENvbHVtbihnZXRMaW5lKGRvYywgbi0xKS50ZXh0LCBudWxsLCB0YWJTaXplKTtcbiAgICAgIGVsc2UgaW5kZW50YXRpb24gPSAwO1xuICAgIH0gZWxzZSBpZiAoaG93ID09IFwiYWRkXCIpIHtcbiAgICAgIGluZGVudGF0aW9uID0gY3VyU3BhY2UgKyBjbS5vcHRpb25zLmluZGVudFVuaXQ7XG4gICAgfSBlbHNlIGlmIChob3cgPT0gXCJzdWJ0cmFjdFwiKSB7XG4gICAgICBpbmRlbnRhdGlvbiA9IGN1clNwYWNlIC0gY20ub3B0aW9ucy5pbmRlbnRVbml0O1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGhvdyA9PSBcIm51bWJlclwiKSB7XG4gICAgICBpbmRlbnRhdGlvbiA9IGN1clNwYWNlICsgaG93O1xuICAgIH1cbiAgICBpbmRlbnRhdGlvbiA9IE1hdGgubWF4KDAsIGluZGVudGF0aW9uKTtcblxuICAgIHZhciBpbmRlbnRTdHJpbmcgPSBcIlwiLCBwb3MgPSAwO1xuICAgIGlmIChjbS5vcHRpb25zLmluZGVudFdpdGhUYWJzKVxuICAgICAgZm9yICh2YXIgaSA9IE1hdGguZmxvb3IoaW5kZW50YXRpb24gLyB0YWJTaXplKTsgaTsgLS1pKSB7cG9zICs9IHRhYlNpemU7IGluZGVudFN0cmluZyArPSBcIlxcdFwiO31cbiAgICBpZiAocG9zIDwgaW5kZW50YXRpb24pIGluZGVudFN0cmluZyArPSBzcGFjZVN0cihpbmRlbnRhdGlvbiAtIHBvcyk7XG5cbiAgICBpZiAoaW5kZW50U3RyaW5nICE9IGN1clNwYWNlU3RyaW5nKSB7XG4gICAgICByZXBsYWNlUmFuZ2UoZG9jLCBpbmRlbnRTdHJpbmcsIFBvcyhuLCAwKSwgUG9zKG4sIGN1clNwYWNlU3RyaW5nLmxlbmd0aCksIFwiK2lucHV0XCIpO1xuICAgICAgbGluZS5zdGF0ZUFmdGVyID0gbnVsbDtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBFbnN1cmUgdGhhdCwgaWYgdGhlIGN1cnNvciB3YXMgaW4gdGhlIHdoaXRlc3BhY2UgYXQgdGhlIHN0YXJ0XG4gICAgICAvLyBvZiB0aGUgbGluZSwgaXQgaXMgbW92ZWQgdG8gdGhlIGVuZCBvZiB0aGF0IHNwYWNlLlxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkb2Muc2VsLnJhbmdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgcmFuZ2UgPSBkb2Muc2VsLnJhbmdlc1tpXTtcbiAgICAgICAgaWYgKHJhbmdlLmhlYWQubGluZSA9PSBuICYmIHJhbmdlLmhlYWQuY2ggPCBjdXJTcGFjZVN0cmluZy5sZW5ndGgpIHtcbiAgICAgICAgICB2YXIgcG9zID0gUG9zKG4sIGN1clNwYWNlU3RyaW5nLmxlbmd0aCk7XG4gICAgICAgICAgcmVwbGFjZU9uZVNlbGVjdGlvbihkb2MsIGksIG5ldyBSYW5nZShwb3MsIHBvcykpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gVXRpbGl0eSBmb3IgYXBwbHlpbmcgYSBjaGFuZ2UgdG8gYSBsaW5lIGJ5IGhhbmRsZSBvciBudW1iZXIsXG4gIC8vIHJldHVybmluZyB0aGUgbnVtYmVyIGFuZCBvcHRpb25hbGx5IHJlZ2lzdGVyaW5nIHRoZSBsaW5lIGFzXG4gIC8vIGNoYW5nZWQuXG4gIGZ1bmN0aW9uIGNoYW5nZUxpbmUoZG9jLCBoYW5kbGUsIGNoYW5nZVR5cGUsIG9wKSB7XG4gICAgdmFyIG5vID0gaGFuZGxlLCBsaW5lID0gaGFuZGxlO1xuICAgIGlmICh0eXBlb2YgaGFuZGxlID09IFwibnVtYmVyXCIpIGxpbmUgPSBnZXRMaW5lKGRvYywgY2xpcExpbmUoZG9jLCBoYW5kbGUpKTtcbiAgICBlbHNlIG5vID0gbGluZU5vKGhhbmRsZSk7XG4gICAgaWYgKG5vID09IG51bGwpIHJldHVybiBudWxsO1xuICAgIGlmIChvcChsaW5lLCBubykgJiYgZG9jLmNtKSByZWdMaW5lQ2hhbmdlKGRvYy5jbSwgbm8sIGNoYW5nZVR5cGUpO1xuICAgIHJldHVybiBsaW5lO1xuICB9XG5cbiAgLy8gSGVscGVyIGZvciBkZWxldGluZyB0ZXh0IG5lYXIgdGhlIHNlbGVjdGlvbihzKSwgdXNlZCB0byBpbXBsZW1lbnRcbiAgLy8gYmFja3NwYWNlLCBkZWxldGUsIGFuZCBzaW1pbGFyIGZ1bmN0aW9uYWxpdHkuXG4gIGZ1bmN0aW9uIGRlbGV0ZU5lYXJTZWxlY3Rpb24oY20sIGNvbXB1dGUpIHtcbiAgICB2YXIgcmFuZ2VzID0gY20uZG9jLnNlbC5yYW5nZXMsIGtpbGwgPSBbXTtcbiAgICAvLyBCdWlsZCB1cCBhIHNldCBvZiByYW5nZXMgdG8ga2lsbCBmaXJzdCwgbWVyZ2luZyBvdmVybGFwcGluZ1xuICAgIC8vIHJhbmdlcy5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJhbmdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHRvS2lsbCA9IGNvbXB1dGUocmFuZ2VzW2ldKTtcbiAgICAgIHdoaWxlIChraWxsLmxlbmd0aCAmJiBjbXAodG9LaWxsLmZyb20sIGxzdChraWxsKS50bykgPD0gMCkge1xuICAgICAgICB2YXIgcmVwbGFjZWQgPSBraWxsLnBvcCgpO1xuICAgICAgICBpZiAoY21wKHJlcGxhY2VkLmZyb20sIHRvS2lsbC5mcm9tKSA8IDApIHtcbiAgICAgICAgICB0b0tpbGwuZnJvbSA9IHJlcGxhY2VkLmZyb207XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGtpbGwucHVzaCh0b0tpbGwpO1xuICAgIH1cbiAgICAvLyBOZXh0LCByZW1vdmUgdGhvc2UgYWN0dWFsIHJhbmdlcy5cbiAgICBydW5Jbk9wKGNtLCBmdW5jdGlvbigpIHtcbiAgICAgIGZvciAodmFyIGkgPSBraWxsLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKVxuICAgICAgICByZXBsYWNlUmFuZ2UoY20uZG9jLCBcIlwiLCBraWxsW2ldLmZyb20sIGtpbGxbaV0udG8sIFwiK2RlbGV0ZVwiKTtcbiAgICAgIGVuc3VyZUN1cnNvclZpc2libGUoY20pO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gVXNlZCBmb3IgaG9yaXpvbnRhbCByZWxhdGl2ZSBtb3Rpb24uIERpciBpcyAtMSBvciAxIChsZWZ0IG9yXG4gIC8vIHJpZ2h0KSwgdW5pdCBjYW4gYmUgXCJjaGFyXCIsIFwiY29sdW1uXCIgKGxpa2UgY2hhciwgYnV0IGRvZXNuJ3RcbiAgLy8gY3Jvc3MgbGluZSBib3VuZGFyaWVzKSwgXCJ3b3JkXCIgKGFjcm9zcyBuZXh0IHdvcmQpLCBvciBcImdyb3VwXCIgKHRvXG4gIC8vIHRoZSBzdGFydCBvZiBuZXh0IGdyb3VwIG9mIHdvcmQgb3Igbm9uLXdvcmQtbm9uLXdoaXRlc3BhY2VcbiAgLy8gY2hhcnMpLiBUaGUgdmlzdWFsbHkgcGFyYW0gY29udHJvbHMgd2hldGhlciwgaW4gcmlnaHQtdG8tbGVmdFxuICAvLyB0ZXh0LCBkaXJlY3Rpb24gMSBtZWFucyB0byBtb3ZlIHRvd2FyZHMgdGhlIG5leHQgaW5kZXggaW4gdGhlXG4gIC8vIHN0cmluZywgb3IgdG93YXJkcyB0aGUgY2hhcmFjdGVyIHRvIHRoZSByaWdodCBvZiB0aGUgY3VycmVudFxuICAvLyBwb3NpdGlvbi4gVGhlIHJlc3VsdGluZyBwb3NpdGlvbiB3aWxsIGhhdmUgYSBoaXRTaWRlPXRydWVcbiAgLy8gcHJvcGVydHkgaWYgaXQgcmVhY2hlZCB0aGUgZW5kIG9mIHRoZSBkb2N1bWVudC5cbiAgZnVuY3Rpb24gZmluZFBvc0goZG9jLCBwb3MsIGRpciwgdW5pdCwgdmlzdWFsbHkpIHtcbiAgICB2YXIgbGluZSA9IHBvcy5saW5lLCBjaCA9IHBvcy5jaCwgb3JpZ0RpciA9IGRpcjtcbiAgICB2YXIgbGluZU9iaiA9IGdldExpbmUoZG9jLCBsaW5lKTtcbiAgICB2YXIgcG9zc2libGUgPSB0cnVlO1xuICAgIGZ1bmN0aW9uIGZpbmROZXh0TGluZSgpIHtcbiAgICAgIHZhciBsID0gbGluZSArIGRpcjtcbiAgICAgIGlmIChsIDwgZG9jLmZpcnN0IHx8IGwgPj0gZG9jLmZpcnN0ICsgZG9jLnNpemUpIHJldHVybiAocG9zc2libGUgPSBmYWxzZSk7XG4gICAgICBsaW5lID0gbDtcbiAgICAgIHJldHVybiBsaW5lT2JqID0gZ2V0TGluZShkb2MsIGwpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBtb3ZlT25jZShib3VuZFRvTGluZSkge1xuICAgICAgdmFyIG5leHQgPSAodmlzdWFsbHkgPyBtb3ZlVmlzdWFsbHkgOiBtb3ZlTG9naWNhbGx5KShsaW5lT2JqLCBjaCwgZGlyLCB0cnVlKTtcbiAgICAgIGlmIChuZXh0ID09IG51bGwpIHtcbiAgICAgICAgaWYgKCFib3VuZFRvTGluZSAmJiBmaW5kTmV4dExpbmUoKSkge1xuICAgICAgICAgIGlmICh2aXN1YWxseSkgY2ggPSAoZGlyIDwgMCA/IGxpbmVSaWdodCA6IGxpbmVMZWZ0KShsaW5lT2JqKTtcbiAgICAgICAgICBlbHNlIGNoID0gZGlyIDwgMCA/IGxpbmVPYmoudGV4dC5sZW5ndGggOiAwO1xuICAgICAgICB9IGVsc2UgcmV0dXJuIChwb3NzaWJsZSA9IGZhbHNlKTtcbiAgICAgIH0gZWxzZSBjaCA9IG5leHQ7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAodW5pdCA9PSBcImNoYXJcIikgbW92ZU9uY2UoKTtcbiAgICBlbHNlIGlmICh1bml0ID09IFwiY29sdW1uXCIpIG1vdmVPbmNlKHRydWUpO1xuICAgIGVsc2UgaWYgKHVuaXQgPT0gXCJ3b3JkXCIgfHwgdW5pdCA9PSBcImdyb3VwXCIpIHtcbiAgICAgIHZhciBzYXdUeXBlID0gbnVsbCwgZ3JvdXAgPSB1bml0ID09IFwiZ3JvdXBcIjtcbiAgICAgIHZhciBoZWxwZXIgPSBkb2MuY20gJiYgZG9jLmNtLmdldEhlbHBlcihwb3MsIFwid29yZENoYXJzXCIpO1xuICAgICAgZm9yICh2YXIgZmlyc3QgPSB0cnVlOzsgZmlyc3QgPSBmYWxzZSkge1xuICAgICAgICBpZiAoZGlyIDwgMCAmJiAhbW92ZU9uY2UoIWZpcnN0KSkgYnJlYWs7XG4gICAgICAgIHZhciBjdXIgPSBsaW5lT2JqLnRleHQuY2hhckF0KGNoKSB8fCBcIlxcblwiO1xuICAgICAgICB2YXIgdHlwZSA9IGlzV29yZENoYXIoY3VyLCBoZWxwZXIpID8gXCJ3XCJcbiAgICAgICAgICA6IGdyb3VwICYmIGN1ciA9PSBcIlxcblwiID8gXCJuXCJcbiAgICAgICAgICA6ICFncm91cCB8fCAvXFxzLy50ZXN0KGN1cikgPyBudWxsXG4gICAgICAgICAgOiBcInBcIjtcbiAgICAgICAgaWYgKGdyb3VwICYmICFmaXJzdCAmJiAhdHlwZSkgdHlwZSA9IFwic1wiO1xuICAgICAgICBpZiAoc2F3VHlwZSAmJiBzYXdUeXBlICE9IHR5cGUpIHtcbiAgICAgICAgICBpZiAoZGlyIDwgMCkge2RpciA9IDE7IG1vdmVPbmNlKCk7fVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGUpIHNhd1R5cGUgPSB0eXBlO1xuICAgICAgICBpZiAoZGlyID4gMCAmJiAhbW92ZU9uY2UoIWZpcnN0KSkgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHZhciByZXN1bHQgPSBza2lwQXRvbWljKGRvYywgUG9zKGxpbmUsIGNoKSwgb3JpZ0RpciwgdHJ1ZSk7XG4gICAgaWYgKCFwb3NzaWJsZSkgcmVzdWx0LmhpdFNpZGUgPSB0cnVlO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvLyBGb3IgcmVsYXRpdmUgdmVydGljYWwgbW92ZW1lbnQuIERpciBtYXkgYmUgLTEgb3IgMS4gVW5pdCBjYW4gYmVcbiAgLy8gXCJwYWdlXCIgb3IgXCJsaW5lXCIuIFRoZSByZXN1bHRpbmcgcG9zaXRpb24gd2lsbCBoYXZlIGEgaGl0U2lkZT10cnVlXG4gIC8vIHByb3BlcnR5IGlmIGl0IHJlYWNoZWQgdGhlIGVuZCBvZiB0aGUgZG9jdW1lbnQuXG4gIGZ1bmN0aW9uIGZpbmRQb3NWKGNtLCBwb3MsIGRpciwgdW5pdCkge1xuICAgIHZhciBkb2MgPSBjbS5kb2MsIHggPSBwb3MubGVmdCwgeTtcbiAgICBpZiAodW5pdCA9PSBcInBhZ2VcIikge1xuICAgICAgdmFyIHBhZ2VTaXplID0gTWF0aC5taW4oY20uZGlzcGxheS53cmFwcGVyLmNsaWVudEhlaWdodCwgd2luZG93LmlubmVySGVpZ2h0IHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQpO1xuICAgICAgeSA9IHBvcy50b3AgKyBkaXIgKiAocGFnZVNpemUgLSAoZGlyIDwgMCA/IDEuNSA6IC41KSAqIHRleHRIZWlnaHQoY20uZGlzcGxheSkpO1xuICAgIH0gZWxzZSBpZiAodW5pdCA9PSBcImxpbmVcIikge1xuICAgICAgeSA9IGRpciA+IDAgPyBwb3MuYm90dG9tICsgMyA6IHBvcy50b3AgLSAzO1xuICAgIH1cbiAgICBmb3IgKDs7KSB7XG4gICAgICB2YXIgdGFyZ2V0ID0gY29vcmRzQ2hhcihjbSwgeCwgeSk7XG4gICAgICBpZiAoIXRhcmdldC5vdXRzaWRlKSBicmVhaztcbiAgICAgIGlmIChkaXIgPCAwID8geSA8PSAwIDogeSA+PSBkb2MuaGVpZ2h0KSB7IHRhcmdldC5oaXRTaWRlID0gdHJ1ZTsgYnJlYWs7IH1cbiAgICAgIHkgKz0gZGlyICogNTtcbiAgICB9XG4gICAgcmV0dXJuIHRhcmdldDtcbiAgfVxuXG4gIC8vIEVESVRPUiBNRVRIT0RTXG5cbiAgLy8gVGhlIHB1YmxpY2x5IHZpc2libGUgQVBJLiBOb3RlIHRoYXQgbWV0aG9kT3AoZikgbWVhbnNcbiAgLy8gJ3dyYXAgZiBpbiBhbiBvcGVyYXRpb24sIHBlcmZvcm1lZCBvbiBpdHMgYHRoaXNgIHBhcmFtZXRlcicuXG5cbiAgLy8gVGhpcyBpcyBub3QgdGhlIGNvbXBsZXRlIHNldCBvZiBlZGl0b3IgbWV0aG9kcy4gTW9zdCBvZiB0aGVcbiAgLy8gbWV0aG9kcyBkZWZpbmVkIG9uIHRoZSBEb2MgdHlwZSBhcmUgYWxzbyBpbmplY3RlZCBpbnRvXG4gIC8vIENvZGVNaXJyb3IucHJvdG90eXBlLCBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkgYW5kXG4gIC8vIGNvbnZlbmllbmNlLlxuXG4gIENvZGVNaXJyb3IucHJvdG90eXBlID0ge1xuICAgIGNvbnN0cnVjdG9yOiBDb2RlTWlycm9yLFxuICAgIGZvY3VzOiBmdW5jdGlvbigpe3dpbmRvdy5mb2N1cygpOyB0aGlzLmRpc3BsYXkuaW5wdXQuZm9jdXMoKTt9LFxuXG4gICAgc2V0T3B0aW9uOiBmdW5jdGlvbihvcHRpb24sIHZhbHVlKSB7XG4gICAgICB2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucywgb2xkID0gb3B0aW9uc1tvcHRpb25dO1xuICAgICAgaWYgKG9wdGlvbnNbb3B0aW9uXSA9PSB2YWx1ZSAmJiBvcHRpb24gIT0gXCJtb2RlXCIpIHJldHVybjtcbiAgICAgIG9wdGlvbnNbb3B0aW9uXSA9IHZhbHVlO1xuICAgICAgaWYgKG9wdGlvbkhhbmRsZXJzLmhhc093blByb3BlcnR5KG9wdGlvbikpXG4gICAgICAgIG9wZXJhdGlvbih0aGlzLCBvcHRpb25IYW5kbGVyc1tvcHRpb25dKSh0aGlzLCB2YWx1ZSwgb2xkKTtcbiAgICB9LFxuXG4gICAgZ2V0T3B0aW9uOiBmdW5jdGlvbihvcHRpb24pIHtyZXR1cm4gdGhpcy5vcHRpb25zW29wdGlvbl07fSxcbiAgICBnZXREb2M6IGZ1bmN0aW9uKCkge3JldHVybiB0aGlzLmRvYzt9LFxuXG4gICAgYWRkS2V5TWFwOiBmdW5jdGlvbihtYXAsIGJvdHRvbSkge1xuICAgICAgdGhpcy5zdGF0ZS5rZXlNYXBzW2JvdHRvbSA/IFwicHVzaFwiIDogXCJ1bnNoaWZ0XCJdKGdldEtleU1hcChtYXApKTtcbiAgICB9LFxuICAgIHJlbW92ZUtleU1hcDogZnVuY3Rpb24obWFwKSB7XG4gICAgICB2YXIgbWFwcyA9IHRoaXMuc3RhdGUua2V5TWFwcztcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbWFwcy5sZW5ndGg7ICsraSlcbiAgICAgICAgaWYgKG1hcHNbaV0gPT0gbWFwIHx8IG1hcHNbaV0ubmFtZSA9PSBtYXApIHtcbiAgICAgICAgICBtYXBzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBhZGRPdmVybGF5OiBtZXRob2RPcChmdW5jdGlvbihzcGVjLCBvcHRpb25zKSB7XG4gICAgICB2YXIgbW9kZSA9IHNwZWMudG9rZW4gPyBzcGVjIDogQ29kZU1pcnJvci5nZXRNb2RlKHRoaXMub3B0aW9ucywgc3BlYyk7XG4gICAgICBpZiAobW9kZS5zdGFydFN0YXRlKSB0aHJvdyBuZXcgRXJyb3IoXCJPdmVybGF5cyBtYXkgbm90IGJlIHN0YXRlZnVsLlwiKTtcbiAgICAgIHRoaXMuc3RhdGUub3ZlcmxheXMucHVzaCh7bW9kZTogbW9kZSwgbW9kZVNwZWM6IHNwZWMsIG9wYXF1ZTogb3B0aW9ucyAmJiBvcHRpb25zLm9wYXF1ZX0pO1xuICAgICAgdGhpcy5zdGF0ZS5tb2RlR2VuKys7XG4gICAgICByZWdDaGFuZ2UodGhpcyk7XG4gICAgfSksXG4gICAgcmVtb3ZlT3ZlcmxheTogbWV0aG9kT3AoZnVuY3Rpb24oc3BlYykge1xuICAgICAgdmFyIG92ZXJsYXlzID0gdGhpcy5zdGF0ZS5vdmVybGF5cztcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3ZlcmxheXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIGN1ciA9IG92ZXJsYXlzW2ldLm1vZGVTcGVjO1xuICAgICAgICBpZiAoY3VyID09IHNwZWMgfHwgdHlwZW9mIHNwZWMgPT0gXCJzdHJpbmdcIiAmJiBjdXIubmFtZSA9PSBzcGVjKSB7XG4gICAgICAgICAgb3ZlcmxheXMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgIHRoaXMuc3RhdGUubW9kZUdlbisrO1xuICAgICAgICAgIHJlZ0NoYW5nZSh0aGlzKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KSxcblxuICAgIGluZGVudExpbmU6IG1ldGhvZE9wKGZ1bmN0aW9uKG4sIGRpciwgYWdncmVzc2l2ZSkge1xuICAgICAgaWYgKHR5cGVvZiBkaXIgIT0gXCJzdHJpbmdcIiAmJiB0eXBlb2YgZGlyICE9IFwibnVtYmVyXCIpIHtcbiAgICAgICAgaWYgKGRpciA9PSBudWxsKSBkaXIgPSB0aGlzLm9wdGlvbnMuc21hcnRJbmRlbnQgPyBcInNtYXJ0XCIgOiBcInByZXZcIjtcbiAgICAgICAgZWxzZSBkaXIgPSBkaXIgPyBcImFkZFwiIDogXCJzdWJ0cmFjdFwiO1xuICAgICAgfVxuICAgICAgaWYgKGlzTGluZSh0aGlzLmRvYywgbikpIGluZGVudExpbmUodGhpcywgbiwgZGlyLCBhZ2dyZXNzaXZlKTtcbiAgICB9KSxcbiAgICBpbmRlbnRTZWxlY3Rpb246IG1ldGhvZE9wKGZ1bmN0aW9uKGhvdykge1xuICAgICAgdmFyIHJhbmdlcyA9IHRoaXMuZG9jLnNlbC5yYW5nZXMsIGVuZCA9IC0xO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByYW5nZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHJhbmdlID0gcmFuZ2VzW2ldO1xuICAgICAgICBpZiAoIXJhbmdlLmVtcHR5KCkpIHtcbiAgICAgICAgICB2YXIgZnJvbSA9IHJhbmdlLmZyb20oKSwgdG8gPSByYW5nZS50bygpO1xuICAgICAgICAgIHZhciBzdGFydCA9IE1hdGgubWF4KGVuZCwgZnJvbS5saW5lKTtcbiAgICAgICAgICBlbmQgPSBNYXRoLm1pbih0aGlzLmxhc3RMaW5lKCksIHRvLmxpbmUgLSAodG8uY2ggPyAwIDogMSkpICsgMTtcbiAgICAgICAgICBmb3IgKHZhciBqID0gc3RhcnQ7IGogPCBlbmQ7ICsrailcbiAgICAgICAgICAgIGluZGVudExpbmUodGhpcywgaiwgaG93KTtcbiAgICAgICAgICB2YXIgbmV3UmFuZ2VzID0gdGhpcy5kb2Muc2VsLnJhbmdlcztcbiAgICAgICAgICBpZiAoZnJvbS5jaCA9PSAwICYmIHJhbmdlcy5sZW5ndGggPT0gbmV3UmFuZ2VzLmxlbmd0aCAmJiBuZXdSYW5nZXNbaV0uZnJvbSgpLmNoID4gMClcbiAgICAgICAgICAgIHJlcGxhY2VPbmVTZWxlY3Rpb24odGhpcy5kb2MsIGksIG5ldyBSYW5nZShmcm9tLCBuZXdSYW5nZXNbaV0udG8oKSksIHNlbF9kb250U2Nyb2xsKTtcbiAgICAgICAgfSBlbHNlIGlmIChyYW5nZS5oZWFkLmxpbmUgPiBlbmQpIHtcbiAgICAgICAgICBpbmRlbnRMaW5lKHRoaXMsIHJhbmdlLmhlYWQubGluZSwgaG93LCB0cnVlKTtcbiAgICAgICAgICBlbmQgPSByYW5nZS5oZWFkLmxpbmU7XG4gICAgICAgICAgaWYgKGkgPT0gdGhpcy5kb2Muc2VsLnByaW1JbmRleCkgZW5zdXJlQ3Vyc29yVmlzaWJsZSh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pLFxuXG4gICAgLy8gRmV0Y2ggdGhlIHBhcnNlciB0b2tlbiBmb3IgYSBnaXZlbiBjaGFyYWN0ZXIuIFVzZWZ1bCBmb3IgaGFja3NcbiAgICAvLyB0aGF0IHdhbnQgdG8gaW5zcGVjdCB0aGUgbW9kZSBzdGF0ZSAoc2F5LCBmb3IgY29tcGxldGlvbikuXG4gICAgZ2V0VG9rZW5BdDogZnVuY3Rpb24ocG9zLCBwcmVjaXNlKSB7XG4gICAgICByZXR1cm4gdGFrZVRva2VuKHRoaXMsIHBvcywgcHJlY2lzZSk7XG4gICAgfSxcblxuICAgIGdldExpbmVUb2tlbnM6IGZ1bmN0aW9uKGxpbmUsIHByZWNpc2UpIHtcbiAgICAgIHJldHVybiB0YWtlVG9rZW4odGhpcywgUG9zKGxpbmUpLCBwcmVjaXNlLCB0cnVlKTtcbiAgICB9LFxuXG4gICAgZ2V0VG9rZW5UeXBlQXQ6IGZ1bmN0aW9uKHBvcykge1xuICAgICAgcG9zID0gY2xpcFBvcyh0aGlzLmRvYywgcG9zKTtcbiAgICAgIHZhciBzdHlsZXMgPSBnZXRMaW5lU3R5bGVzKHRoaXMsIGdldExpbmUodGhpcy5kb2MsIHBvcy5saW5lKSk7XG4gICAgICB2YXIgYmVmb3JlID0gMCwgYWZ0ZXIgPSAoc3R5bGVzLmxlbmd0aCAtIDEpIC8gMiwgY2ggPSBwb3MuY2g7XG4gICAgICB2YXIgdHlwZTtcbiAgICAgIGlmIChjaCA9PSAwKSB0eXBlID0gc3R5bGVzWzJdO1xuICAgICAgZWxzZSBmb3IgKDs7KSB7XG4gICAgICAgIHZhciBtaWQgPSAoYmVmb3JlICsgYWZ0ZXIpID4+IDE7XG4gICAgICAgIGlmICgobWlkID8gc3R5bGVzW21pZCAqIDIgLSAxXSA6IDApID49IGNoKSBhZnRlciA9IG1pZDtcbiAgICAgICAgZWxzZSBpZiAoc3R5bGVzW21pZCAqIDIgKyAxXSA8IGNoKSBiZWZvcmUgPSBtaWQgKyAxO1xuICAgICAgICBlbHNlIHsgdHlwZSA9IHN0eWxlc1ttaWQgKiAyICsgMl07IGJyZWFrOyB9XG4gICAgICB9XG4gICAgICB2YXIgY3V0ID0gdHlwZSA/IHR5cGUuaW5kZXhPZihcImNtLW92ZXJsYXkgXCIpIDogLTE7XG4gICAgICByZXR1cm4gY3V0IDwgMCA/IHR5cGUgOiBjdXQgPT0gMCA/IG51bGwgOiB0eXBlLnNsaWNlKDAsIGN1dCAtIDEpO1xuICAgIH0sXG5cbiAgICBnZXRNb2RlQXQ6IGZ1bmN0aW9uKHBvcykge1xuICAgICAgdmFyIG1vZGUgPSB0aGlzLmRvYy5tb2RlO1xuICAgICAgaWYgKCFtb2RlLmlubmVyTW9kZSkgcmV0dXJuIG1vZGU7XG4gICAgICByZXR1cm4gQ29kZU1pcnJvci5pbm5lck1vZGUobW9kZSwgdGhpcy5nZXRUb2tlbkF0KHBvcykuc3RhdGUpLm1vZGU7XG4gICAgfSxcblxuICAgIGdldEhlbHBlcjogZnVuY3Rpb24ocG9zLCB0eXBlKSB7XG4gICAgICByZXR1cm4gdGhpcy5nZXRIZWxwZXJzKHBvcywgdHlwZSlbMF07XG4gICAgfSxcblxuICAgIGdldEhlbHBlcnM6IGZ1bmN0aW9uKHBvcywgdHlwZSkge1xuICAgICAgdmFyIGZvdW5kID0gW107XG4gICAgICBpZiAoIWhlbHBlcnMuaGFzT3duUHJvcGVydHkodHlwZSkpIHJldHVybiBmb3VuZDtcbiAgICAgIHZhciBoZWxwID0gaGVscGVyc1t0eXBlXSwgbW9kZSA9IHRoaXMuZ2V0TW9kZUF0KHBvcyk7XG4gICAgICBpZiAodHlwZW9mIG1vZGVbdHlwZV0gPT0gXCJzdHJpbmdcIikge1xuICAgICAgICBpZiAoaGVscFttb2RlW3R5cGVdXSkgZm91bmQucHVzaChoZWxwW21vZGVbdHlwZV1dKTtcbiAgICAgIH0gZWxzZSBpZiAobW9kZVt0eXBlXSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1vZGVbdHlwZV0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICB2YXIgdmFsID0gaGVscFttb2RlW3R5cGVdW2ldXTtcbiAgICAgICAgICBpZiAodmFsKSBmb3VuZC5wdXNoKHZhbCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAobW9kZS5oZWxwZXJUeXBlICYmIGhlbHBbbW9kZS5oZWxwZXJUeXBlXSkge1xuICAgICAgICBmb3VuZC5wdXNoKGhlbHBbbW9kZS5oZWxwZXJUeXBlXSk7XG4gICAgICB9IGVsc2UgaWYgKGhlbHBbbW9kZS5uYW1lXSkge1xuICAgICAgICBmb3VuZC5wdXNoKGhlbHBbbW9kZS5uYW1lXSk7XG4gICAgICB9XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGhlbHAuX2dsb2JhbC5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgY3VyID0gaGVscC5fZ2xvYmFsW2ldO1xuICAgICAgICBpZiAoY3VyLnByZWQobW9kZSwgdGhpcykgJiYgaW5kZXhPZihmb3VuZCwgY3VyLnZhbCkgPT0gLTEpXG4gICAgICAgICAgZm91bmQucHVzaChjdXIudmFsKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmb3VuZDtcbiAgICB9LFxuXG4gICAgZ2V0U3RhdGVBZnRlcjogZnVuY3Rpb24obGluZSwgcHJlY2lzZSkge1xuICAgICAgdmFyIGRvYyA9IHRoaXMuZG9jO1xuICAgICAgbGluZSA9IGNsaXBMaW5lKGRvYywgbGluZSA9PSBudWxsID8gZG9jLmZpcnN0ICsgZG9jLnNpemUgLSAxOiBsaW5lKTtcbiAgICAgIHJldHVybiBnZXRTdGF0ZUJlZm9yZSh0aGlzLCBsaW5lICsgMSwgcHJlY2lzZSk7XG4gICAgfSxcblxuICAgIGN1cnNvckNvb3JkczogZnVuY3Rpb24oc3RhcnQsIG1vZGUpIHtcbiAgICAgIHZhciBwb3MsIHJhbmdlID0gdGhpcy5kb2Muc2VsLnByaW1hcnkoKTtcbiAgICAgIGlmIChzdGFydCA9PSBudWxsKSBwb3MgPSByYW5nZS5oZWFkO1xuICAgICAgZWxzZSBpZiAodHlwZW9mIHN0YXJ0ID09IFwib2JqZWN0XCIpIHBvcyA9IGNsaXBQb3ModGhpcy5kb2MsIHN0YXJ0KTtcbiAgICAgIGVsc2UgcG9zID0gc3RhcnQgPyByYW5nZS5mcm9tKCkgOiByYW5nZS50bygpO1xuICAgICAgcmV0dXJuIGN1cnNvckNvb3Jkcyh0aGlzLCBwb3MsIG1vZGUgfHwgXCJwYWdlXCIpO1xuICAgIH0sXG5cbiAgICBjaGFyQ29vcmRzOiBmdW5jdGlvbihwb3MsIG1vZGUpIHtcbiAgICAgIHJldHVybiBjaGFyQ29vcmRzKHRoaXMsIGNsaXBQb3ModGhpcy5kb2MsIHBvcyksIG1vZGUgfHwgXCJwYWdlXCIpO1xuICAgIH0sXG5cbiAgICBjb29yZHNDaGFyOiBmdW5jdGlvbihjb29yZHMsIG1vZGUpIHtcbiAgICAgIGNvb3JkcyA9IGZyb21Db29yZFN5c3RlbSh0aGlzLCBjb29yZHMsIG1vZGUgfHwgXCJwYWdlXCIpO1xuICAgICAgcmV0dXJuIGNvb3Jkc0NoYXIodGhpcywgY29vcmRzLmxlZnQsIGNvb3Jkcy50b3ApO1xuICAgIH0sXG5cbiAgICBsaW5lQXRIZWlnaHQ6IGZ1bmN0aW9uKGhlaWdodCwgbW9kZSkge1xuICAgICAgaGVpZ2h0ID0gZnJvbUNvb3JkU3lzdGVtKHRoaXMsIHt0b3A6IGhlaWdodCwgbGVmdDogMH0sIG1vZGUgfHwgXCJwYWdlXCIpLnRvcDtcbiAgICAgIHJldHVybiBsaW5lQXRIZWlnaHQodGhpcy5kb2MsIGhlaWdodCArIHRoaXMuZGlzcGxheS52aWV3T2Zmc2V0KTtcbiAgICB9LFxuICAgIGhlaWdodEF0TGluZTogZnVuY3Rpb24obGluZSwgbW9kZSkge1xuICAgICAgdmFyIGVuZCA9IGZhbHNlLCBsaW5lT2JqO1xuICAgICAgaWYgKHR5cGVvZiBsaW5lID09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgdmFyIGxhc3QgPSB0aGlzLmRvYy5maXJzdCArIHRoaXMuZG9jLnNpemUgLSAxO1xuICAgICAgICBpZiAobGluZSA8IHRoaXMuZG9jLmZpcnN0KSBsaW5lID0gdGhpcy5kb2MuZmlyc3Q7XG4gICAgICAgIGVsc2UgaWYgKGxpbmUgPiBsYXN0KSB7IGxpbmUgPSBsYXN0OyBlbmQgPSB0cnVlOyB9XG4gICAgICAgIGxpbmVPYmogPSBnZXRMaW5lKHRoaXMuZG9jLCBsaW5lKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxpbmVPYmogPSBsaW5lO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGludG9Db29yZFN5c3RlbSh0aGlzLCBsaW5lT2JqLCB7dG9wOiAwLCBsZWZ0OiAwfSwgbW9kZSB8fCBcInBhZ2VcIikudG9wICtcbiAgICAgICAgKGVuZCA/IHRoaXMuZG9jLmhlaWdodCAtIGhlaWdodEF0TGluZShsaW5lT2JqKSA6IDApO1xuICAgIH0sXG5cbiAgICBkZWZhdWx0VGV4dEhlaWdodDogZnVuY3Rpb24oKSB7IHJldHVybiB0ZXh0SGVpZ2h0KHRoaXMuZGlzcGxheSk7IH0sXG4gICAgZGVmYXVsdENoYXJXaWR0aDogZnVuY3Rpb24oKSB7IHJldHVybiBjaGFyV2lkdGgodGhpcy5kaXNwbGF5KTsgfSxcblxuICAgIHNldEd1dHRlck1hcmtlcjogbWV0aG9kT3AoZnVuY3Rpb24obGluZSwgZ3V0dGVySUQsIHZhbHVlKSB7XG4gICAgICByZXR1cm4gY2hhbmdlTGluZSh0aGlzLmRvYywgbGluZSwgXCJndXR0ZXJcIiwgZnVuY3Rpb24obGluZSkge1xuICAgICAgICB2YXIgbWFya2VycyA9IGxpbmUuZ3V0dGVyTWFya2VycyB8fCAobGluZS5ndXR0ZXJNYXJrZXJzID0ge30pO1xuICAgICAgICBtYXJrZXJzW2d1dHRlcklEXSA9IHZhbHVlO1xuICAgICAgICBpZiAoIXZhbHVlICYmIGlzRW1wdHkobWFya2VycykpIGxpbmUuZ3V0dGVyTWFya2VycyA9IG51bGw7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSk7XG4gICAgfSksXG5cbiAgICBjbGVhckd1dHRlcjogbWV0aG9kT3AoZnVuY3Rpb24oZ3V0dGVySUQpIHtcbiAgICAgIHZhciBjbSA9IHRoaXMsIGRvYyA9IGNtLmRvYywgaSA9IGRvYy5maXJzdDtcbiAgICAgIGRvYy5pdGVyKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgaWYgKGxpbmUuZ3V0dGVyTWFya2VycyAmJiBsaW5lLmd1dHRlck1hcmtlcnNbZ3V0dGVySURdKSB7XG4gICAgICAgICAgbGluZS5ndXR0ZXJNYXJrZXJzW2d1dHRlcklEXSA9IG51bGw7XG4gICAgICAgICAgcmVnTGluZUNoYW5nZShjbSwgaSwgXCJndXR0ZXJcIik7XG4gICAgICAgICAgaWYgKGlzRW1wdHkobGluZS5ndXR0ZXJNYXJrZXJzKSkgbGluZS5ndXR0ZXJNYXJrZXJzID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICArK2k7XG4gICAgICB9KTtcbiAgICB9KSxcblxuICAgIGxpbmVJbmZvOiBmdW5jdGlvbihsaW5lKSB7XG4gICAgICBpZiAodHlwZW9mIGxpbmUgPT0gXCJudW1iZXJcIikge1xuICAgICAgICBpZiAoIWlzTGluZSh0aGlzLmRvYywgbGluZSkpIHJldHVybiBudWxsO1xuICAgICAgICB2YXIgbiA9IGxpbmU7XG4gICAgICAgIGxpbmUgPSBnZXRMaW5lKHRoaXMuZG9jLCBsaW5lKTtcbiAgICAgICAgaWYgKCFsaW5lKSByZXR1cm4gbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBuID0gbGluZU5vKGxpbmUpO1xuICAgICAgICBpZiAobiA9PSBudWxsKSByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIHJldHVybiB7bGluZTogbiwgaGFuZGxlOiBsaW5lLCB0ZXh0OiBsaW5lLnRleHQsIGd1dHRlck1hcmtlcnM6IGxpbmUuZ3V0dGVyTWFya2VycyxcbiAgICAgICAgICAgICAgdGV4dENsYXNzOiBsaW5lLnRleHRDbGFzcywgYmdDbGFzczogbGluZS5iZ0NsYXNzLCB3cmFwQ2xhc3M6IGxpbmUud3JhcENsYXNzLFxuICAgICAgICAgICAgICB3aWRnZXRzOiBsaW5lLndpZGdldHN9O1xuICAgIH0sXG5cbiAgICBnZXRWaWV3cG9ydDogZnVuY3Rpb24oKSB7IHJldHVybiB7ZnJvbTogdGhpcy5kaXNwbGF5LnZpZXdGcm9tLCB0bzogdGhpcy5kaXNwbGF5LnZpZXdUb307fSxcblxuICAgIGFkZFdpZGdldDogZnVuY3Rpb24ocG9zLCBub2RlLCBzY3JvbGwsIHZlcnQsIGhvcml6KSB7XG4gICAgICB2YXIgZGlzcGxheSA9IHRoaXMuZGlzcGxheTtcbiAgICAgIHBvcyA9IGN1cnNvckNvb3Jkcyh0aGlzLCBjbGlwUG9zKHRoaXMuZG9jLCBwb3MpKTtcbiAgICAgIHZhciB0b3AgPSBwb3MuYm90dG9tLCBsZWZ0ID0gcG9zLmxlZnQ7XG4gICAgICBub2RlLnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xuICAgICAgbm9kZS5zZXRBdHRyaWJ1dGUoXCJjbS1pZ25vcmUtZXZlbnRzXCIsIFwidHJ1ZVwiKTtcbiAgICAgIHRoaXMuZGlzcGxheS5pbnB1dC5zZXRVbmVkaXRhYmxlKG5vZGUpO1xuICAgICAgZGlzcGxheS5zaXplci5hcHBlbmRDaGlsZChub2RlKTtcbiAgICAgIGlmICh2ZXJ0ID09IFwib3ZlclwiKSB7XG4gICAgICAgIHRvcCA9IHBvcy50b3A7XG4gICAgICB9IGVsc2UgaWYgKHZlcnQgPT0gXCJhYm92ZVwiIHx8IHZlcnQgPT0gXCJuZWFyXCIpIHtcbiAgICAgICAgdmFyIHZzcGFjZSA9IE1hdGgubWF4KGRpc3BsYXkud3JhcHBlci5jbGllbnRIZWlnaHQsIHRoaXMuZG9jLmhlaWdodCksXG4gICAgICAgIGhzcGFjZSA9IE1hdGgubWF4KGRpc3BsYXkuc2l6ZXIuY2xpZW50V2lkdGgsIGRpc3BsYXkubGluZVNwYWNlLmNsaWVudFdpZHRoKTtcbiAgICAgICAgLy8gRGVmYXVsdCB0byBwb3NpdGlvbmluZyBhYm92ZSAoaWYgc3BlY2lmaWVkIGFuZCBwb3NzaWJsZSk7IG90aGVyd2lzZSBkZWZhdWx0IHRvIHBvc2l0aW9uaW5nIGJlbG93XG4gICAgICAgIGlmICgodmVydCA9PSAnYWJvdmUnIHx8IHBvcy5ib3R0b20gKyBub2RlLm9mZnNldEhlaWdodCA+IHZzcGFjZSkgJiYgcG9zLnRvcCA+IG5vZGUub2Zmc2V0SGVpZ2h0KVxuICAgICAgICAgIHRvcCA9IHBvcy50b3AgLSBub2RlLm9mZnNldEhlaWdodDtcbiAgICAgICAgZWxzZSBpZiAocG9zLmJvdHRvbSArIG5vZGUub2Zmc2V0SGVpZ2h0IDw9IHZzcGFjZSlcbiAgICAgICAgICB0b3AgPSBwb3MuYm90dG9tO1xuICAgICAgICBpZiAobGVmdCArIG5vZGUub2Zmc2V0V2lkdGggPiBoc3BhY2UpXG4gICAgICAgICAgbGVmdCA9IGhzcGFjZSAtIG5vZGUub2Zmc2V0V2lkdGg7XG4gICAgICB9XG4gICAgICBub2RlLnN0eWxlLnRvcCA9IHRvcCArIFwicHhcIjtcbiAgICAgIG5vZGUuc3R5bGUubGVmdCA9IG5vZGUuc3R5bGUucmlnaHQgPSBcIlwiO1xuICAgICAgaWYgKGhvcml6ID09IFwicmlnaHRcIikge1xuICAgICAgICBsZWZ0ID0gZGlzcGxheS5zaXplci5jbGllbnRXaWR0aCAtIG5vZGUub2Zmc2V0V2lkdGg7XG4gICAgICAgIG5vZGUuc3R5bGUucmlnaHQgPSBcIjBweFwiO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGhvcml6ID09IFwibGVmdFwiKSBsZWZ0ID0gMDtcbiAgICAgICAgZWxzZSBpZiAoaG9yaXogPT0gXCJtaWRkbGVcIikgbGVmdCA9IChkaXNwbGF5LnNpemVyLmNsaWVudFdpZHRoIC0gbm9kZS5vZmZzZXRXaWR0aCkgLyAyO1xuICAgICAgICBub2RlLnN0eWxlLmxlZnQgPSBsZWZ0ICsgXCJweFwiO1xuICAgICAgfVxuICAgICAgaWYgKHNjcm9sbClcbiAgICAgICAgc2Nyb2xsSW50b1ZpZXcodGhpcywgbGVmdCwgdG9wLCBsZWZ0ICsgbm9kZS5vZmZzZXRXaWR0aCwgdG9wICsgbm9kZS5vZmZzZXRIZWlnaHQpO1xuICAgIH0sXG5cbiAgICB0cmlnZ2VyT25LZXlEb3duOiBtZXRob2RPcChvbktleURvd24pLFxuICAgIHRyaWdnZXJPbktleVByZXNzOiBtZXRob2RPcChvbktleVByZXNzKSxcbiAgICB0cmlnZ2VyT25LZXlVcDogb25LZXlVcCxcblxuICAgIGV4ZWNDb21tYW5kOiBmdW5jdGlvbihjbWQpIHtcbiAgICAgIGlmIChjb21tYW5kcy5oYXNPd25Qcm9wZXJ0eShjbWQpKVxuICAgICAgICByZXR1cm4gY29tbWFuZHNbY21kXS5jYWxsKG51bGwsIHRoaXMpO1xuICAgIH0sXG5cbiAgICB0cmlnZ2VyRWxlY3RyaWM6IG1ldGhvZE9wKGZ1bmN0aW9uKHRleHQpIHsgdHJpZ2dlckVsZWN0cmljKHRoaXMsIHRleHQpOyB9KSxcblxuICAgIGZpbmRQb3NIOiBmdW5jdGlvbihmcm9tLCBhbW91bnQsIHVuaXQsIHZpc3VhbGx5KSB7XG4gICAgICB2YXIgZGlyID0gMTtcbiAgICAgIGlmIChhbW91bnQgPCAwKSB7IGRpciA9IC0xOyBhbW91bnQgPSAtYW1vdW50OyB9XG4gICAgICBmb3IgKHZhciBpID0gMCwgY3VyID0gY2xpcFBvcyh0aGlzLmRvYywgZnJvbSk7IGkgPCBhbW91bnQ7ICsraSkge1xuICAgICAgICBjdXIgPSBmaW5kUG9zSCh0aGlzLmRvYywgY3VyLCBkaXIsIHVuaXQsIHZpc3VhbGx5KTtcbiAgICAgICAgaWYgKGN1ci5oaXRTaWRlKSBicmVhaztcbiAgICAgIH1cbiAgICAgIHJldHVybiBjdXI7XG4gICAgfSxcblxuICAgIG1vdmVIOiBtZXRob2RPcChmdW5jdGlvbihkaXIsIHVuaXQpIHtcbiAgICAgIHZhciBjbSA9IHRoaXM7XG4gICAgICBjbS5leHRlbmRTZWxlY3Rpb25zQnkoZnVuY3Rpb24ocmFuZ2UpIHtcbiAgICAgICAgaWYgKGNtLmRpc3BsYXkuc2hpZnQgfHwgY20uZG9jLmV4dGVuZCB8fCByYW5nZS5lbXB0eSgpKVxuICAgICAgICAgIHJldHVybiBmaW5kUG9zSChjbS5kb2MsIHJhbmdlLmhlYWQsIGRpciwgdW5pdCwgY20ub3B0aW9ucy5ydGxNb3ZlVmlzdWFsbHkpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuIGRpciA8IDAgPyByYW5nZS5mcm9tKCkgOiByYW5nZS50bygpO1xuICAgICAgfSwgc2VsX21vdmUpO1xuICAgIH0pLFxuXG4gICAgZGVsZXRlSDogbWV0aG9kT3AoZnVuY3Rpb24oZGlyLCB1bml0KSB7XG4gICAgICB2YXIgc2VsID0gdGhpcy5kb2Muc2VsLCBkb2MgPSB0aGlzLmRvYztcbiAgICAgIGlmIChzZWwuc29tZXRoaW5nU2VsZWN0ZWQoKSlcbiAgICAgICAgZG9jLnJlcGxhY2VTZWxlY3Rpb24oXCJcIiwgbnVsbCwgXCIrZGVsZXRlXCIpO1xuICAgICAgZWxzZVxuICAgICAgICBkZWxldGVOZWFyU2VsZWN0aW9uKHRoaXMsIGZ1bmN0aW9uKHJhbmdlKSB7XG4gICAgICAgICAgdmFyIG90aGVyID0gZmluZFBvc0goZG9jLCByYW5nZS5oZWFkLCBkaXIsIHVuaXQsIGZhbHNlKTtcbiAgICAgICAgICByZXR1cm4gZGlyIDwgMCA/IHtmcm9tOiBvdGhlciwgdG86IHJhbmdlLmhlYWR9IDoge2Zyb206IHJhbmdlLmhlYWQsIHRvOiBvdGhlcn07XG4gICAgICAgIH0pO1xuICAgIH0pLFxuXG4gICAgZmluZFBvc1Y6IGZ1bmN0aW9uKGZyb20sIGFtb3VudCwgdW5pdCwgZ29hbENvbHVtbikge1xuICAgICAgdmFyIGRpciA9IDEsIHggPSBnb2FsQ29sdW1uO1xuICAgICAgaWYgKGFtb3VudCA8IDApIHsgZGlyID0gLTE7IGFtb3VudCA9IC1hbW91bnQ7IH1cbiAgICAgIGZvciAodmFyIGkgPSAwLCBjdXIgPSBjbGlwUG9zKHRoaXMuZG9jLCBmcm9tKTsgaSA8IGFtb3VudDsgKytpKSB7XG4gICAgICAgIHZhciBjb29yZHMgPSBjdXJzb3JDb29yZHModGhpcywgY3VyLCBcImRpdlwiKTtcbiAgICAgICAgaWYgKHggPT0gbnVsbCkgeCA9IGNvb3Jkcy5sZWZ0O1xuICAgICAgICBlbHNlIGNvb3Jkcy5sZWZ0ID0geDtcbiAgICAgICAgY3VyID0gZmluZFBvc1YodGhpcywgY29vcmRzLCBkaXIsIHVuaXQpO1xuICAgICAgICBpZiAoY3VyLmhpdFNpZGUpIGJyZWFrO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGN1cjtcbiAgICB9LFxuXG4gICAgbW92ZVY6IG1ldGhvZE9wKGZ1bmN0aW9uKGRpciwgdW5pdCkge1xuICAgICAgdmFyIGNtID0gdGhpcywgZG9jID0gdGhpcy5kb2MsIGdvYWxzID0gW107XG4gICAgICB2YXIgY29sbGFwc2UgPSAhY20uZGlzcGxheS5zaGlmdCAmJiAhZG9jLmV4dGVuZCAmJiBkb2Muc2VsLnNvbWV0aGluZ1NlbGVjdGVkKCk7XG4gICAgICBkb2MuZXh0ZW5kU2VsZWN0aW9uc0J5KGZ1bmN0aW9uKHJhbmdlKSB7XG4gICAgICAgIGlmIChjb2xsYXBzZSlcbiAgICAgICAgICByZXR1cm4gZGlyIDwgMCA/IHJhbmdlLmZyb20oKSA6IHJhbmdlLnRvKCk7XG4gICAgICAgIHZhciBoZWFkUG9zID0gY3Vyc29yQ29vcmRzKGNtLCByYW5nZS5oZWFkLCBcImRpdlwiKTtcbiAgICAgICAgaWYgKHJhbmdlLmdvYWxDb2x1bW4gIT0gbnVsbCkgaGVhZFBvcy5sZWZ0ID0gcmFuZ2UuZ29hbENvbHVtbjtcbiAgICAgICAgZ29hbHMucHVzaChoZWFkUG9zLmxlZnQpO1xuICAgICAgICB2YXIgcG9zID0gZmluZFBvc1YoY20sIGhlYWRQb3MsIGRpciwgdW5pdCk7XG4gICAgICAgIGlmICh1bml0ID09IFwicGFnZVwiICYmIHJhbmdlID09IGRvYy5zZWwucHJpbWFyeSgpKVxuICAgICAgICAgIGFkZFRvU2Nyb2xsUG9zKGNtLCBudWxsLCBjaGFyQ29vcmRzKGNtLCBwb3MsIFwiZGl2XCIpLnRvcCAtIGhlYWRQb3MudG9wKTtcbiAgICAgICAgcmV0dXJuIHBvcztcbiAgICAgIH0sIHNlbF9tb3ZlKTtcbiAgICAgIGlmIChnb2Fscy5sZW5ndGgpIGZvciAodmFyIGkgPSAwOyBpIDwgZG9jLnNlbC5yYW5nZXMubGVuZ3RoOyBpKyspXG4gICAgICAgIGRvYy5zZWwucmFuZ2VzW2ldLmdvYWxDb2x1bW4gPSBnb2Fsc1tpXTtcbiAgICB9KSxcblxuICAgIC8vIEZpbmQgdGhlIHdvcmQgYXQgdGhlIGdpdmVuIHBvc2l0aW9uIChhcyByZXR1cm5lZCBieSBjb29yZHNDaGFyKS5cbiAgICBmaW5kV29yZEF0OiBmdW5jdGlvbihwb3MpIHtcbiAgICAgIHZhciBkb2MgPSB0aGlzLmRvYywgbGluZSA9IGdldExpbmUoZG9jLCBwb3MubGluZSkudGV4dDtcbiAgICAgIHZhciBzdGFydCA9IHBvcy5jaCwgZW5kID0gcG9zLmNoO1xuICAgICAgaWYgKGxpbmUpIHtcbiAgICAgICAgdmFyIGhlbHBlciA9IHRoaXMuZ2V0SGVscGVyKHBvcywgXCJ3b3JkQ2hhcnNcIik7XG4gICAgICAgIGlmICgocG9zLnhSZWwgPCAwIHx8IGVuZCA9PSBsaW5lLmxlbmd0aCkgJiYgc3RhcnQpIC0tc3RhcnQ7IGVsc2UgKytlbmQ7XG4gICAgICAgIHZhciBzdGFydENoYXIgPSBsaW5lLmNoYXJBdChzdGFydCk7XG4gICAgICAgIHZhciBjaGVjayA9IGlzV29yZENoYXIoc3RhcnRDaGFyLCBoZWxwZXIpXG4gICAgICAgICAgPyBmdW5jdGlvbihjaCkgeyByZXR1cm4gaXNXb3JkQ2hhcihjaCwgaGVscGVyKTsgfVxuICAgICAgICAgIDogL1xccy8udGVzdChzdGFydENoYXIpID8gZnVuY3Rpb24oY2gpIHtyZXR1cm4gL1xccy8udGVzdChjaCk7fVxuICAgICAgICAgIDogZnVuY3Rpb24oY2gpIHtyZXR1cm4gIS9cXHMvLnRlc3QoY2gpICYmICFpc1dvcmRDaGFyKGNoKTt9O1xuICAgICAgICB3aGlsZSAoc3RhcnQgPiAwICYmIGNoZWNrKGxpbmUuY2hhckF0KHN0YXJ0IC0gMSkpKSAtLXN0YXJ0O1xuICAgICAgICB3aGlsZSAoZW5kIDwgbGluZS5sZW5ndGggJiYgY2hlY2sobGluZS5jaGFyQXQoZW5kKSkpICsrZW5kO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5ldyBSYW5nZShQb3MocG9zLmxpbmUsIHN0YXJ0KSwgUG9zKHBvcy5saW5lLCBlbmQpKTtcbiAgICB9LFxuXG4gICAgdG9nZ2xlT3ZlcndyaXRlOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgaWYgKHZhbHVlICE9IG51bGwgJiYgdmFsdWUgPT0gdGhpcy5zdGF0ZS5vdmVyd3JpdGUpIHJldHVybjtcbiAgICAgIGlmICh0aGlzLnN0YXRlLm92ZXJ3cml0ZSA9ICF0aGlzLnN0YXRlLm92ZXJ3cml0ZSlcbiAgICAgICAgYWRkQ2xhc3ModGhpcy5kaXNwbGF5LmN1cnNvckRpdiwgXCJDb2RlTWlycm9yLW92ZXJ3cml0ZVwiKTtcbiAgICAgIGVsc2VcbiAgICAgICAgcm1DbGFzcyh0aGlzLmRpc3BsYXkuY3Vyc29yRGl2LCBcIkNvZGVNaXJyb3Itb3ZlcndyaXRlXCIpO1xuXG4gICAgICBzaWduYWwodGhpcywgXCJvdmVyd3JpdGVUb2dnbGVcIiwgdGhpcywgdGhpcy5zdGF0ZS5vdmVyd3JpdGUpO1xuICAgIH0sXG4gICAgaGFzRm9jdXM6IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy5kaXNwbGF5LmlucHV0LmdldEZpZWxkKCkgPT0gYWN0aXZlRWx0KCk7IH0sXG5cbiAgICBzY3JvbGxUbzogbWV0aG9kT3AoZnVuY3Rpb24oeCwgeSkge1xuICAgICAgaWYgKHggIT0gbnVsbCB8fCB5ICE9IG51bGwpIHJlc29sdmVTY3JvbGxUb1Bvcyh0aGlzKTtcbiAgICAgIGlmICh4ICE9IG51bGwpIHRoaXMuY3VyT3Auc2Nyb2xsTGVmdCA9IHg7XG4gICAgICBpZiAoeSAhPSBudWxsKSB0aGlzLmN1ck9wLnNjcm9sbFRvcCA9IHk7XG4gICAgfSksXG4gICAgZ2V0U2Nyb2xsSW5mbzogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgc2Nyb2xsZXIgPSB0aGlzLmRpc3BsYXkuc2Nyb2xsZXI7XG4gICAgICByZXR1cm4ge2xlZnQ6IHNjcm9sbGVyLnNjcm9sbExlZnQsIHRvcDogc2Nyb2xsZXIuc2Nyb2xsVG9wLFxuICAgICAgICAgICAgICBoZWlnaHQ6IHNjcm9sbGVyLnNjcm9sbEhlaWdodCAtIHNjcm9sbEdhcCh0aGlzKSAtIHRoaXMuZGlzcGxheS5iYXJIZWlnaHQsXG4gICAgICAgICAgICAgIHdpZHRoOiBzY3JvbGxlci5zY3JvbGxXaWR0aCAtIHNjcm9sbEdhcCh0aGlzKSAtIHRoaXMuZGlzcGxheS5iYXJXaWR0aCxcbiAgICAgICAgICAgICAgY2xpZW50SGVpZ2h0OiBkaXNwbGF5SGVpZ2h0KHRoaXMpLCBjbGllbnRXaWR0aDogZGlzcGxheVdpZHRoKHRoaXMpfTtcbiAgICB9LFxuXG4gICAgc2Nyb2xsSW50b1ZpZXc6IG1ldGhvZE9wKGZ1bmN0aW9uKHJhbmdlLCBtYXJnaW4pIHtcbiAgICAgIGlmIChyYW5nZSA9PSBudWxsKSB7XG4gICAgICAgIHJhbmdlID0ge2Zyb206IHRoaXMuZG9jLnNlbC5wcmltYXJ5KCkuaGVhZCwgdG86IG51bGx9O1xuICAgICAgICBpZiAobWFyZ2luID09IG51bGwpIG1hcmdpbiA9IHRoaXMub3B0aW9ucy5jdXJzb3JTY3JvbGxNYXJnaW47XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiByYW5nZSA9PSBcIm51bWJlclwiKSB7XG4gICAgICAgIHJhbmdlID0ge2Zyb206IFBvcyhyYW5nZSwgMCksIHRvOiBudWxsfTtcbiAgICAgIH0gZWxzZSBpZiAocmFuZ2UuZnJvbSA9PSBudWxsKSB7XG4gICAgICAgIHJhbmdlID0ge2Zyb206IHJhbmdlLCB0bzogbnVsbH07XG4gICAgICB9XG4gICAgICBpZiAoIXJhbmdlLnRvKSByYW5nZS50byA9IHJhbmdlLmZyb207XG4gICAgICByYW5nZS5tYXJnaW4gPSBtYXJnaW4gfHwgMDtcblxuICAgICAgaWYgKHJhbmdlLmZyb20ubGluZSAhPSBudWxsKSB7XG4gICAgICAgIHJlc29sdmVTY3JvbGxUb1Bvcyh0aGlzKTtcbiAgICAgICAgdGhpcy5jdXJPcC5zY3JvbGxUb1BvcyA9IHJhbmdlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIHNQb3MgPSBjYWxjdWxhdGVTY3JvbGxQb3ModGhpcywgTWF0aC5taW4ocmFuZ2UuZnJvbS5sZWZ0LCByYW5nZS50by5sZWZ0KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5taW4ocmFuZ2UuZnJvbS50b3AsIHJhbmdlLnRvLnRvcCkgLSByYW5nZS5tYXJnaW4sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGgubWF4KHJhbmdlLmZyb20ucmlnaHQsIHJhbmdlLnRvLnJpZ2h0KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5tYXgocmFuZ2UuZnJvbS5ib3R0b20sIHJhbmdlLnRvLmJvdHRvbSkgKyByYW5nZS5tYXJnaW4pO1xuICAgICAgICB0aGlzLnNjcm9sbFRvKHNQb3Muc2Nyb2xsTGVmdCwgc1Bvcy5zY3JvbGxUb3ApO1xuICAgICAgfVxuICAgIH0pLFxuXG4gICAgc2V0U2l6ZTogbWV0aG9kT3AoZnVuY3Rpb24od2lkdGgsIGhlaWdodCkge1xuICAgICAgdmFyIGNtID0gdGhpcztcbiAgICAgIGZ1bmN0aW9uIGludGVycHJldCh2YWwpIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiB2YWwgPT0gXCJudW1iZXJcIiB8fCAvXlxcZCskLy50ZXN0KFN0cmluZyh2YWwpKSA/IHZhbCArIFwicHhcIiA6IHZhbDtcbiAgICAgIH1cbiAgICAgIGlmICh3aWR0aCAhPSBudWxsKSBjbS5kaXNwbGF5LndyYXBwZXIuc3R5bGUud2lkdGggPSBpbnRlcnByZXQod2lkdGgpO1xuICAgICAgaWYgKGhlaWdodCAhPSBudWxsKSBjbS5kaXNwbGF5LndyYXBwZXIuc3R5bGUuaGVpZ2h0ID0gaW50ZXJwcmV0KGhlaWdodCk7XG4gICAgICBpZiAoY20ub3B0aW9ucy5saW5lV3JhcHBpbmcpIGNsZWFyTGluZU1lYXN1cmVtZW50Q2FjaGUodGhpcyk7XG4gICAgICB2YXIgbGluZU5vID0gY20uZGlzcGxheS52aWV3RnJvbTtcbiAgICAgIGNtLmRvYy5pdGVyKGxpbmVObywgY20uZGlzcGxheS52aWV3VG8sIGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgaWYgKGxpbmUud2lkZ2V0cykgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5lLndpZGdldHMubGVuZ3RoOyBpKyspXG4gICAgICAgICAgaWYgKGxpbmUud2lkZ2V0c1tpXS5ub0hTY3JvbGwpIHsgcmVnTGluZUNoYW5nZShjbSwgbGluZU5vLCBcIndpZGdldFwiKTsgYnJlYWs7IH1cbiAgICAgICAgKytsaW5lTm87XG4gICAgICB9KTtcbiAgICAgIGNtLmN1ck9wLmZvcmNlVXBkYXRlID0gdHJ1ZTtcbiAgICAgIHNpZ25hbChjbSwgXCJyZWZyZXNoXCIsIHRoaXMpO1xuICAgIH0pLFxuXG4gICAgb3BlcmF0aW9uOiBmdW5jdGlvbihmKXtyZXR1cm4gcnVuSW5PcCh0aGlzLCBmKTt9LFxuXG4gICAgcmVmcmVzaDogbWV0aG9kT3AoZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgb2xkSGVpZ2h0ID0gdGhpcy5kaXNwbGF5LmNhY2hlZFRleHRIZWlnaHQ7XG4gICAgICByZWdDaGFuZ2UodGhpcyk7XG4gICAgICB0aGlzLmN1ck9wLmZvcmNlVXBkYXRlID0gdHJ1ZTtcbiAgICAgIGNsZWFyQ2FjaGVzKHRoaXMpO1xuICAgICAgdGhpcy5zY3JvbGxUbyh0aGlzLmRvYy5zY3JvbGxMZWZ0LCB0aGlzLmRvYy5zY3JvbGxUb3ApO1xuICAgICAgdXBkYXRlR3V0dGVyU3BhY2UodGhpcyk7XG4gICAgICBpZiAob2xkSGVpZ2h0ID09IG51bGwgfHwgTWF0aC5hYnMob2xkSGVpZ2h0IC0gdGV4dEhlaWdodCh0aGlzLmRpc3BsYXkpKSA+IC41KVxuICAgICAgICBlc3RpbWF0ZUxpbmVIZWlnaHRzKHRoaXMpO1xuICAgICAgc2lnbmFsKHRoaXMsIFwicmVmcmVzaFwiLCB0aGlzKTtcbiAgICB9KSxcblxuICAgIHN3YXBEb2M6IG1ldGhvZE9wKGZ1bmN0aW9uKGRvYykge1xuICAgICAgdmFyIG9sZCA9IHRoaXMuZG9jO1xuICAgICAgb2xkLmNtID0gbnVsbDtcbiAgICAgIGF0dGFjaERvYyh0aGlzLCBkb2MpO1xuICAgICAgY2xlYXJDYWNoZXModGhpcyk7XG4gICAgICB0aGlzLmRpc3BsYXkuaW5wdXQucmVzZXQoKTtcbiAgICAgIHRoaXMuc2Nyb2xsVG8oZG9jLnNjcm9sbExlZnQsIGRvYy5zY3JvbGxUb3ApO1xuICAgICAgdGhpcy5jdXJPcC5mb3JjZVNjcm9sbCA9IHRydWU7XG4gICAgICBzaWduYWxMYXRlcih0aGlzLCBcInN3YXBEb2NcIiwgdGhpcywgb2xkKTtcbiAgICAgIHJldHVybiBvbGQ7XG4gICAgfSksXG5cbiAgICBnZXRJbnB1dEZpZWxkOiBmdW5jdGlvbigpe3JldHVybiB0aGlzLmRpc3BsYXkuaW5wdXQuZ2V0RmllbGQoKTt9LFxuICAgIGdldFdyYXBwZXJFbGVtZW50OiBmdW5jdGlvbigpe3JldHVybiB0aGlzLmRpc3BsYXkud3JhcHBlcjt9LFxuICAgIGdldFNjcm9sbGVyRWxlbWVudDogZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5kaXNwbGF5LnNjcm9sbGVyO30sXG4gICAgZ2V0R3V0dGVyRWxlbWVudDogZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5kaXNwbGF5Lmd1dHRlcnM7fVxuICB9O1xuICBldmVudE1peGluKENvZGVNaXJyb3IpO1xuXG4gIC8vIE9QVElPTiBERUZBVUxUU1xuXG4gIC8vIFRoZSBkZWZhdWx0IGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgdmFyIGRlZmF1bHRzID0gQ29kZU1pcnJvci5kZWZhdWx0cyA9IHt9O1xuICAvLyBGdW5jdGlvbnMgdG8gcnVuIHdoZW4gb3B0aW9ucyBhcmUgY2hhbmdlZC5cbiAgdmFyIG9wdGlvbkhhbmRsZXJzID0gQ29kZU1pcnJvci5vcHRpb25IYW5kbGVycyA9IHt9O1xuXG4gIGZ1bmN0aW9uIG9wdGlvbihuYW1lLCBkZWZsdCwgaGFuZGxlLCBub3RPbkluaXQpIHtcbiAgICBDb2RlTWlycm9yLmRlZmF1bHRzW25hbWVdID0gZGVmbHQ7XG4gICAgaWYgKGhhbmRsZSkgb3B0aW9uSGFuZGxlcnNbbmFtZV0gPVxuICAgICAgbm90T25Jbml0ID8gZnVuY3Rpb24oY20sIHZhbCwgb2xkKSB7aWYgKG9sZCAhPSBJbml0KSBoYW5kbGUoY20sIHZhbCwgb2xkKTt9IDogaGFuZGxlO1xuICB9XG5cbiAgLy8gUGFzc2VkIHRvIG9wdGlvbiBoYW5kbGVycyB3aGVuIHRoZXJlIGlzIG5vIG9sZCB2YWx1ZS5cbiAgdmFyIEluaXQgPSBDb2RlTWlycm9yLkluaXQgPSB7dG9TdHJpbmc6IGZ1bmN0aW9uKCl7cmV0dXJuIFwiQ29kZU1pcnJvci5Jbml0XCI7fX07XG5cbiAgLy8gVGhlc2UgdHdvIGFyZSwgb24gaW5pdCwgY2FsbGVkIGZyb20gdGhlIGNvbnN0cnVjdG9yIGJlY2F1c2UgdGhleVxuICAvLyBoYXZlIHRvIGJlIGluaXRpYWxpemVkIGJlZm9yZSB0aGUgZWRpdG9yIGNhbiBzdGFydCBhdCBhbGwuXG4gIG9wdGlvbihcInZhbHVlXCIsIFwiXCIsIGZ1bmN0aW9uKGNtLCB2YWwpIHtcbiAgICBjbS5zZXRWYWx1ZSh2YWwpO1xuICB9LCB0cnVlKTtcbiAgb3B0aW9uKFwibW9kZVwiLCBudWxsLCBmdW5jdGlvbihjbSwgdmFsKSB7XG4gICAgY20uZG9jLm1vZGVPcHRpb24gPSB2YWw7XG4gICAgbG9hZE1vZGUoY20pO1xuICB9LCB0cnVlKTtcblxuICBvcHRpb24oXCJpbmRlbnRVbml0XCIsIDIsIGxvYWRNb2RlLCB0cnVlKTtcbiAgb3B0aW9uKFwiaW5kZW50V2l0aFRhYnNcIiwgZmFsc2UpO1xuICBvcHRpb24oXCJzbWFydEluZGVudFwiLCB0cnVlKTtcbiAgb3B0aW9uKFwidGFiU2l6ZVwiLCA0LCBmdW5jdGlvbihjbSkge1xuICAgIHJlc2V0TW9kZVN0YXRlKGNtKTtcbiAgICBjbGVhckNhY2hlcyhjbSk7XG4gICAgcmVnQ2hhbmdlKGNtKTtcbiAgfSwgdHJ1ZSk7XG4gIG9wdGlvbihcImxpbmVTZXBhcmF0b3JcIiwgbnVsbCwgZnVuY3Rpb24oY20sIHZhbCkge1xuICAgIGNtLmRvYy5saW5lU2VwID0gdmFsO1xuICAgIGlmICghdmFsKSByZXR1cm47XG4gICAgdmFyIG5ld0JyZWFrcyA9IFtdLCBsaW5lTm8gPSBjbS5kb2MuZmlyc3Q7XG4gICAgY20uZG9jLml0ZXIoZnVuY3Rpb24obGluZSkge1xuICAgICAgZm9yICh2YXIgcG9zID0gMDs7KSB7XG4gICAgICAgIHZhciBmb3VuZCA9IGxpbmUudGV4dC5pbmRleE9mKHZhbCwgcG9zKTtcbiAgICAgICAgaWYgKGZvdW5kID09IC0xKSBicmVhaztcbiAgICAgICAgcG9zID0gZm91bmQgKyB2YWwubGVuZ3RoO1xuICAgICAgICBuZXdCcmVha3MucHVzaChQb3MobGluZU5vLCBmb3VuZCkpO1xuICAgICAgfVxuICAgICAgbGluZU5vKys7XG4gICAgfSk7XG4gICAgZm9yICh2YXIgaSA9IG5ld0JyZWFrcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSlcbiAgICAgIHJlcGxhY2VSYW5nZShjbS5kb2MsIHZhbCwgbmV3QnJlYWtzW2ldLCBQb3MobmV3QnJlYWtzW2ldLmxpbmUsIG5ld0JyZWFrc1tpXS5jaCArIHZhbC5sZW5ndGgpKVxuICB9KTtcbiAgb3B0aW9uKFwic3BlY2lhbENoYXJzXCIsIC9bXFx0XFx1MDAwMC1cXHUwMDE5XFx1MDBhZFxcdTIwMGItXFx1MjAwZlxcdTIwMjhcXHUyMDI5XFx1ZmVmZl0vZywgZnVuY3Rpb24oY20sIHZhbCwgb2xkKSB7XG4gICAgY20uc3RhdGUuc3BlY2lhbENoYXJzID0gbmV3IFJlZ0V4cCh2YWwuc291cmNlICsgKHZhbC50ZXN0KFwiXFx0XCIpID8gXCJcIiA6IFwifFxcdFwiKSwgXCJnXCIpO1xuICAgIGlmIChvbGQgIT0gQ29kZU1pcnJvci5Jbml0KSBjbS5yZWZyZXNoKCk7XG4gIH0pO1xuICBvcHRpb24oXCJzcGVjaWFsQ2hhclBsYWNlaG9sZGVyXCIsIGRlZmF1bHRTcGVjaWFsQ2hhclBsYWNlaG9sZGVyLCBmdW5jdGlvbihjbSkge2NtLnJlZnJlc2goKTt9LCB0cnVlKTtcbiAgb3B0aW9uKFwiZWxlY3RyaWNDaGFyc1wiLCB0cnVlKTtcbiAgb3B0aW9uKFwiaW5wdXRTdHlsZVwiLCBtb2JpbGUgPyBcImNvbnRlbnRlZGl0YWJsZVwiIDogXCJ0ZXh0YXJlYVwiLCBmdW5jdGlvbigpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJpbnB1dFN0eWxlIGNhbiBub3QgKHlldCkgYmUgY2hhbmdlZCBpbiBhIHJ1bm5pbmcgZWRpdG9yXCIpOyAvLyBGSVhNRVxuICB9LCB0cnVlKTtcbiAgb3B0aW9uKFwicnRsTW92ZVZpc3VhbGx5XCIsICF3aW5kb3dzKTtcbiAgb3B0aW9uKFwid2hvbGVMaW5lVXBkYXRlQmVmb3JlXCIsIHRydWUpO1xuXG4gIG9wdGlvbihcInRoZW1lXCIsIFwiZGVmYXVsdFwiLCBmdW5jdGlvbihjbSkge1xuICAgIHRoZW1lQ2hhbmdlZChjbSk7XG4gICAgZ3V0dGVyc0NoYW5nZWQoY20pO1xuICB9LCB0cnVlKTtcbiAgb3B0aW9uKFwia2V5TWFwXCIsIFwiZGVmYXVsdFwiLCBmdW5jdGlvbihjbSwgdmFsLCBvbGQpIHtcbiAgICB2YXIgbmV4dCA9IGdldEtleU1hcCh2YWwpO1xuICAgIHZhciBwcmV2ID0gb2xkICE9IENvZGVNaXJyb3IuSW5pdCAmJiBnZXRLZXlNYXAob2xkKTtcbiAgICBpZiAocHJldiAmJiBwcmV2LmRldGFjaCkgcHJldi5kZXRhY2goY20sIG5leHQpO1xuICAgIGlmIChuZXh0LmF0dGFjaCkgbmV4dC5hdHRhY2goY20sIHByZXYgfHwgbnVsbCk7XG4gIH0pO1xuICBvcHRpb24oXCJleHRyYUtleXNcIiwgbnVsbCk7XG5cbiAgb3B0aW9uKFwibGluZVdyYXBwaW5nXCIsIGZhbHNlLCB3cmFwcGluZ0NoYW5nZWQsIHRydWUpO1xuICBvcHRpb24oXCJndXR0ZXJzXCIsIFtdLCBmdW5jdGlvbihjbSkge1xuICAgIHNldEd1dHRlcnNGb3JMaW5lTnVtYmVycyhjbS5vcHRpb25zKTtcbiAgICBndXR0ZXJzQ2hhbmdlZChjbSk7XG4gIH0sIHRydWUpO1xuICBvcHRpb24oXCJmaXhlZEd1dHRlclwiLCB0cnVlLCBmdW5jdGlvbihjbSwgdmFsKSB7XG4gICAgY20uZGlzcGxheS5ndXR0ZXJzLnN0eWxlLmxlZnQgPSB2YWwgPyBjb21wZW5zYXRlRm9ySFNjcm9sbChjbS5kaXNwbGF5KSArIFwicHhcIiA6IFwiMFwiO1xuICAgIGNtLnJlZnJlc2goKTtcbiAgfSwgdHJ1ZSk7XG4gIG9wdGlvbihcImNvdmVyR3V0dGVyTmV4dFRvU2Nyb2xsYmFyXCIsIGZhbHNlLCBmdW5jdGlvbihjbSkge3VwZGF0ZVNjcm9sbGJhcnMoY20pO30sIHRydWUpO1xuICBvcHRpb24oXCJzY3JvbGxiYXJTdHlsZVwiLCBcIm5hdGl2ZVwiLCBmdW5jdGlvbihjbSkge1xuICAgIGluaXRTY3JvbGxiYXJzKGNtKTtcbiAgICB1cGRhdGVTY3JvbGxiYXJzKGNtKTtcbiAgICBjbS5kaXNwbGF5LnNjcm9sbGJhcnMuc2V0U2Nyb2xsVG9wKGNtLmRvYy5zY3JvbGxUb3ApO1xuICAgIGNtLmRpc3BsYXkuc2Nyb2xsYmFycy5zZXRTY3JvbGxMZWZ0KGNtLmRvYy5zY3JvbGxMZWZ0KTtcbiAgfSwgdHJ1ZSk7XG4gIG9wdGlvbihcImxpbmVOdW1iZXJzXCIsIGZhbHNlLCBmdW5jdGlvbihjbSkge1xuICAgIHNldEd1dHRlcnNGb3JMaW5lTnVtYmVycyhjbS5vcHRpb25zKTtcbiAgICBndXR0ZXJzQ2hhbmdlZChjbSk7XG4gIH0sIHRydWUpO1xuICBvcHRpb24oXCJmaXJzdExpbmVOdW1iZXJcIiwgMSwgZ3V0dGVyc0NoYW5nZWQsIHRydWUpO1xuICBvcHRpb24oXCJsaW5lTnVtYmVyRm9ybWF0dGVyXCIsIGZ1bmN0aW9uKGludGVnZXIpIHtyZXR1cm4gaW50ZWdlcjt9LCBndXR0ZXJzQ2hhbmdlZCwgdHJ1ZSk7XG4gIG9wdGlvbihcInNob3dDdXJzb3JXaGVuU2VsZWN0aW5nXCIsIGZhbHNlLCB1cGRhdGVTZWxlY3Rpb24sIHRydWUpO1xuXG4gIG9wdGlvbihcInJlc2V0U2VsZWN0aW9uT25Db250ZXh0TWVudVwiLCB0cnVlKTtcbiAgb3B0aW9uKFwibGluZVdpc2VDb3B5Q3V0XCIsIHRydWUpO1xuXG4gIG9wdGlvbihcInJlYWRPbmx5XCIsIGZhbHNlLCBmdW5jdGlvbihjbSwgdmFsKSB7XG4gICAgaWYgKHZhbCA9PSBcIm5vY3Vyc29yXCIpIHtcbiAgICAgIG9uQmx1cihjbSk7XG4gICAgICBjbS5kaXNwbGF5LmlucHV0LmJsdXIoKTtcbiAgICAgIGNtLmRpc3BsYXkuZGlzYWJsZWQgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBjbS5kaXNwbGF5LmRpc2FibGVkID0gZmFsc2U7XG4gICAgfVxuICAgIGNtLmRpc3BsYXkuaW5wdXQucmVhZE9ubHlDaGFuZ2VkKHZhbClcbiAgfSk7XG4gIG9wdGlvbihcImRpc2FibGVJbnB1dFwiLCBmYWxzZSwgZnVuY3Rpb24oY20sIHZhbCkge2lmICghdmFsKSBjbS5kaXNwbGF5LmlucHV0LnJlc2V0KCk7fSwgdHJ1ZSk7XG4gIG9wdGlvbihcImRyYWdEcm9wXCIsIHRydWUsIGRyYWdEcm9wQ2hhbmdlZCk7XG4gIG9wdGlvbihcImFsbG93RHJvcEZpbGVUeXBlc1wiLCBudWxsKTtcblxuICBvcHRpb24oXCJjdXJzb3JCbGlua1JhdGVcIiwgNTMwKTtcbiAgb3B0aW9uKFwiY3Vyc29yU2Nyb2xsTWFyZ2luXCIsIDApO1xuICBvcHRpb24oXCJjdXJzb3JIZWlnaHRcIiwgMSwgdXBkYXRlU2VsZWN0aW9uLCB0cnVlKTtcbiAgb3B0aW9uKFwic2luZ2xlQ3Vyc29ySGVpZ2h0UGVyTGluZVwiLCB0cnVlLCB1cGRhdGVTZWxlY3Rpb24sIHRydWUpO1xuICBvcHRpb24oXCJ3b3JrVGltZVwiLCAxMDApO1xuICBvcHRpb24oXCJ3b3JrRGVsYXlcIiwgMTAwKTtcbiAgb3B0aW9uKFwiZmxhdHRlblNwYW5zXCIsIHRydWUsIHJlc2V0TW9kZVN0YXRlLCB0cnVlKTtcbiAgb3B0aW9uKFwiYWRkTW9kZUNsYXNzXCIsIGZhbHNlLCByZXNldE1vZGVTdGF0ZSwgdHJ1ZSk7XG4gIG9wdGlvbihcInBvbGxJbnRlcnZhbFwiLCAxMDApO1xuICBvcHRpb24oXCJ1bmRvRGVwdGhcIiwgMjAwLCBmdW5jdGlvbihjbSwgdmFsKXtjbS5kb2MuaGlzdG9yeS51bmRvRGVwdGggPSB2YWw7fSk7XG4gIG9wdGlvbihcImhpc3RvcnlFdmVudERlbGF5XCIsIDEyNTApO1xuICBvcHRpb24oXCJ2aWV3cG9ydE1hcmdpblwiLCAxMCwgZnVuY3Rpb24oY20pe2NtLnJlZnJlc2goKTt9LCB0cnVlKTtcbiAgb3B0aW9uKFwibWF4SGlnaGxpZ2h0TGVuZ3RoXCIsIDEwMDAwLCByZXNldE1vZGVTdGF0ZSwgdHJ1ZSk7XG4gIG9wdGlvbihcIm1vdmVJbnB1dFdpdGhDdXJzb3JcIiwgdHJ1ZSwgZnVuY3Rpb24oY20sIHZhbCkge1xuICAgIGlmICghdmFsKSBjbS5kaXNwbGF5LmlucHV0LnJlc2V0UG9zaXRpb24oKTtcbiAgfSk7XG5cbiAgb3B0aW9uKFwidGFiaW5kZXhcIiwgbnVsbCwgZnVuY3Rpb24oY20sIHZhbCkge1xuICAgIGNtLmRpc3BsYXkuaW5wdXQuZ2V0RmllbGQoKS50YWJJbmRleCA9IHZhbCB8fCBcIlwiO1xuICB9KTtcbiAgb3B0aW9uKFwiYXV0b2ZvY3VzXCIsIG51bGwpO1xuXG4gIC8vIE1PREUgREVGSU5JVElPTiBBTkQgUVVFUllJTkdcblxuICAvLyBLbm93biBtb2RlcywgYnkgbmFtZSBhbmQgYnkgTUlNRVxuICB2YXIgbW9kZXMgPSBDb2RlTWlycm9yLm1vZGVzID0ge30sIG1pbWVNb2RlcyA9IENvZGVNaXJyb3IubWltZU1vZGVzID0ge307XG5cbiAgLy8gRXh0cmEgYXJndW1lbnRzIGFyZSBzdG9yZWQgYXMgdGhlIG1vZGUncyBkZXBlbmRlbmNpZXMsIHdoaWNoIGlzXG4gIC8vIHVzZWQgYnkgKGxlZ2FjeSkgbWVjaGFuaXNtcyBsaWtlIGxvYWRtb2RlLmpzIHRvIGF1dG9tYXRpY2FsbHlcbiAgLy8gbG9hZCBhIG1vZGUuIChQcmVmZXJyZWQgbWVjaGFuaXNtIGlzIHRoZSByZXF1aXJlL2RlZmluZSBjYWxscy4pXG4gIENvZGVNaXJyb3IuZGVmaW5lTW9kZSA9IGZ1bmN0aW9uKG5hbWUsIG1vZGUpIHtcbiAgICBpZiAoIUNvZGVNaXJyb3IuZGVmYXVsdHMubW9kZSAmJiBuYW1lICE9IFwibnVsbFwiKSBDb2RlTWlycm9yLmRlZmF1bHRzLm1vZGUgPSBuYW1lO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMilcbiAgICAgIG1vZGUuZGVwZW5kZW5jaWVzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKTtcbiAgICBtb2Rlc1tuYW1lXSA9IG1vZGU7XG4gIH07XG5cbiAgQ29kZU1pcnJvci5kZWZpbmVNSU1FID0gZnVuY3Rpb24obWltZSwgc3BlYykge1xuICAgIG1pbWVNb2Rlc1ttaW1lXSA9IHNwZWM7XG4gIH07XG5cbiAgLy8gR2l2ZW4gYSBNSU1FIHR5cGUsIGEge25hbWUsIC4uLm9wdGlvbnN9IGNvbmZpZyBvYmplY3QsIG9yIGEgbmFtZVxuICAvLyBzdHJpbmcsIHJldHVybiBhIG1vZGUgY29uZmlnIG9iamVjdC5cbiAgQ29kZU1pcnJvci5yZXNvbHZlTW9kZSA9IGZ1bmN0aW9uKHNwZWMpIHtcbiAgICBpZiAodHlwZW9mIHNwZWMgPT0gXCJzdHJpbmdcIiAmJiBtaW1lTW9kZXMuaGFzT3duUHJvcGVydHkoc3BlYykpIHtcbiAgICAgIHNwZWMgPSBtaW1lTW9kZXNbc3BlY107XG4gICAgfSBlbHNlIGlmIChzcGVjICYmIHR5cGVvZiBzcGVjLm5hbWUgPT0gXCJzdHJpbmdcIiAmJiBtaW1lTW9kZXMuaGFzT3duUHJvcGVydHkoc3BlYy5uYW1lKSkge1xuICAgICAgdmFyIGZvdW5kID0gbWltZU1vZGVzW3NwZWMubmFtZV07XG4gICAgICBpZiAodHlwZW9mIGZvdW5kID09IFwic3RyaW5nXCIpIGZvdW5kID0ge25hbWU6IGZvdW5kfTtcbiAgICAgIHNwZWMgPSBjcmVhdGVPYmooZm91bmQsIHNwZWMpO1xuICAgICAgc3BlYy5uYW1lID0gZm91bmQubmFtZTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBzcGVjID09IFwic3RyaW5nXCIgJiYgL15bXFx3XFwtXStcXC9bXFx3XFwtXStcXCt4bWwkLy50ZXN0KHNwZWMpKSB7XG4gICAgICByZXR1cm4gQ29kZU1pcnJvci5yZXNvbHZlTW9kZShcImFwcGxpY2F0aW9uL3htbFwiKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBzcGVjID09IFwic3RyaW5nXCIpIHJldHVybiB7bmFtZTogc3BlY307XG4gICAgZWxzZSByZXR1cm4gc3BlYyB8fCB7bmFtZTogXCJudWxsXCJ9O1xuICB9O1xuXG4gIC8vIEdpdmVuIGEgbW9kZSBzcGVjIChhbnl0aGluZyB0aGF0IHJlc29sdmVNb2RlIGFjY2VwdHMpLCBmaW5kIGFuZFxuICAvLyBpbml0aWFsaXplIGFuIGFjdHVhbCBtb2RlIG9iamVjdC5cbiAgQ29kZU1pcnJvci5nZXRNb2RlID0gZnVuY3Rpb24ob3B0aW9ucywgc3BlYykge1xuICAgIHZhciBzcGVjID0gQ29kZU1pcnJvci5yZXNvbHZlTW9kZShzcGVjKTtcbiAgICB2YXIgbWZhY3RvcnkgPSBtb2Rlc1tzcGVjLm5hbWVdO1xuICAgIGlmICghbWZhY3RvcnkpIHJldHVybiBDb2RlTWlycm9yLmdldE1vZGUob3B0aW9ucywgXCJ0ZXh0L3BsYWluXCIpO1xuICAgIHZhciBtb2RlT2JqID0gbWZhY3Rvcnkob3B0aW9ucywgc3BlYyk7XG4gICAgaWYgKG1vZGVFeHRlbnNpb25zLmhhc093blByb3BlcnR5KHNwZWMubmFtZSkpIHtcbiAgICAgIHZhciBleHRzID0gbW9kZUV4dGVuc2lvbnNbc3BlYy5uYW1lXTtcbiAgICAgIGZvciAodmFyIHByb3AgaW4gZXh0cykge1xuICAgICAgICBpZiAoIWV4dHMuaGFzT3duUHJvcGVydHkocHJvcCkpIGNvbnRpbnVlO1xuICAgICAgICBpZiAobW9kZU9iai5oYXNPd25Qcm9wZXJ0eShwcm9wKSkgbW9kZU9ialtcIl9cIiArIHByb3BdID0gbW9kZU9ialtwcm9wXTtcbiAgICAgICAgbW9kZU9ialtwcm9wXSA9IGV4dHNbcHJvcF07XG4gICAgICB9XG4gICAgfVxuICAgIG1vZGVPYmoubmFtZSA9IHNwZWMubmFtZTtcbiAgICBpZiAoc3BlYy5oZWxwZXJUeXBlKSBtb2RlT2JqLmhlbHBlclR5cGUgPSBzcGVjLmhlbHBlclR5cGU7XG4gICAgaWYgKHNwZWMubW9kZVByb3BzKSBmb3IgKHZhciBwcm9wIGluIHNwZWMubW9kZVByb3BzKVxuICAgICAgbW9kZU9ialtwcm9wXSA9IHNwZWMubW9kZVByb3BzW3Byb3BdO1xuXG4gICAgcmV0dXJuIG1vZGVPYmo7XG4gIH07XG5cbiAgLy8gTWluaW1hbCBkZWZhdWx0IG1vZGUuXG4gIENvZGVNaXJyb3IuZGVmaW5lTW9kZShcIm51bGxcIiwgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHt0b2tlbjogZnVuY3Rpb24oc3RyZWFtKSB7c3RyZWFtLnNraXBUb0VuZCgpO319O1xuICB9KTtcbiAgQ29kZU1pcnJvci5kZWZpbmVNSU1FKFwidGV4dC9wbGFpblwiLCBcIm51bGxcIik7XG5cbiAgLy8gVGhpcyBjYW4gYmUgdXNlZCB0byBhdHRhY2ggcHJvcGVydGllcyB0byBtb2RlIG9iamVjdHMgZnJvbVxuICAvLyBvdXRzaWRlIHRoZSBhY3R1YWwgbW9kZSBkZWZpbml0aW9uLlxuICB2YXIgbW9kZUV4dGVuc2lvbnMgPSBDb2RlTWlycm9yLm1vZGVFeHRlbnNpb25zID0ge307XG4gIENvZGVNaXJyb3IuZXh0ZW5kTW9kZSA9IGZ1bmN0aW9uKG1vZGUsIHByb3BlcnRpZXMpIHtcbiAgICB2YXIgZXh0cyA9IG1vZGVFeHRlbnNpb25zLmhhc093blByb3BlcnR5KG1vZGUpID8gbW9kZUV4dGVuc2lvbnNbbW9kZV0gOiAobW9kZUV4dGVuc2lvbnNbbW9kZV0gPSB7fSk7XG4gICAgY29weU9iaihwcm9wZXJ0aWVzLCBleHRzKTtcbiAgfTtcblxuICAvLyBFWFRFTlNJT05TXG5cbiAgQ29kZU1pcnJvci5kZWZpbmVFeHRlbnNpb24gPSBmdW5jdGlvbihuYW1lLCBmdW5jKSB7XG4gICAgQ29kZU1pcnJvci5wcm90b3R5cGVbbmFtZV0gPSBmdW5jO1xuICB9O1xuICBDb2RlTWlycm9yLmRlZmluZURvY0V4dGVuc2lvbiA9IGZ1bmN0aW9uKG5hbWUsIGZ1bmMpIHtcbiAgICBEb2MucHJvdG90eXBlW25hbWVdID0gZnVuYztcbiAgfTtcbiAgQ29kZU1pcnJvci5kZWZpbmVPcHRpb24gPSBvcHRpb247XG5cbiAgdmFyIGluaXRIb29rcyA9IFtdO1xuICBDb2RlTWlycm9yLmRlZmluZUluaXRIb29rID0gZnVuY3Rpb24oZikge2luaXRIb29rcy5wdXNoKGYpO307XG5cbiAgdmFyIGhlbHBlcnMgPSBDb2RlTWlycm9yLmhlbHBlcnMgPSB7fTtcbiAgQ29kZU1pcnJvci5yZWdpc3RlckhlbHBlciA9IGZ1bmN0aW9uKHR5cGUsIG5hbWUsIHZhbHVlKSB7XG4gICAgaWYgKCFoZWxwZXJzLmhhc093blByb3BlcnR5KHR5cGUpKSBoZWxwZXJzW3R5cGVdID0gQ29kZU1pcnJvclt0eXBlXSA9IHtfZ2xvYmFsOiBbXX07XG4gICAgaGVscGVyc1t0eXBlXVtuYW1lXSA9IHZhbHVlO1xuICB9O1xuICBDb2RlTWlycm9yLnJlZ2lzdGVyR2xvYmFsSGVscGVyID0gZnVuY3Rpb24odHlwZSwgbmFtZSwgcHJlZGljYXRlLCB2YWx1ZSkge1xuICAgIENvZGVNaXJyb3IucmVnaXN0ZXJIZWxwZXIodHlwZSwgbmFtZSwgdmFsdWUpO1xuICAgIGhlbHBlcnNbdHlwZV0uX2dsb2JhbC5wdXNoKHtwcmVkOiBwcmVkaWNhdGUsIHZhbDogdmFsdWV9KTtcbiAgfTtcblxuICAvLyBNT0RFIFNUQVRFIEhBTkRMSU5HXG5cbiAgLy8gVXRpbGl0eSBmdW5jdGlvbnMgZm9yIHdvcmtpbmcgd2l0aCBzdGF0ZS4gRXhwb3J0ZWQgYmVjYXVzZSBuZXN0ZWRcbiAgLy8gbW9kZXMgbmVlZCB0byBkbyB0aGlzIGZvciB0aGVpciBpbm5lciBtb2Rlcy5cblxuICB2YXIgY29weVN0YXRlID0gQ29kZU1pcnJvci5jb3B5U3RhdGUgPSBmdW5jdGlvbihtb2RlLCBzdGF0ZSkge1xuICAgIGlmIChzdGF0ZSA9PT0gdHJ1ZSkgcmV0dXJuIHN0YXRlO1xuICAgIGlmIChtb2RlLmNvcHlTdGF0ZSkgcmV0dXJuIG1vZGUuY29weVN0YXRlKHN0YXRlKTtcbiAgICB2YXIgbnN0YXRlID0ge307XG4gICAgZm9yICh2YXIgbiBpbiBzdGF0ZSkge1xuICAgICAgdmFyIHZhbCA9IHN0YXRlW25dO1xuICAgICAgaWYgKHZhbCBpbnN0YW5jZW9mIEFycmF5KSB2YWwgPSB2YWwuY29uY2F0KFtdKTtcbiAgICAgIG5zdGF0ZVtuXSA9IHZhbDtcbiAgICB9XG4gICAgcmV0dXJuIG5zdGF0ZTtcbiAgfTtcblxuICB2YXIgc3RhcnRTdGF0ZSA9IENvZGVNaXJyb3Iuc3RhcnRTdGF0ZSA9IGZ1bmN0aW9uKG1vZGUsIGExLCBhMikge1xuICAgIHJldHVybiBtb2RlLnN0YXJ0U3RhdGUgPyBtb2RlLnN0YXJ0U3RhdGUoYTEsIGEyKSA6IHRydWU7XG4gIH07XG5cbiAgLy8gR2l2ZW4gYSBtb2RlIGFuZCBhIHN0YXRlIChmb3IgdGhhdCBtb2RlKSwgZmluZCB0aGUgaW5uZXIgbW9kZSBhbmRcbiAgLy8gc3RhdGUgYXQgdGhlIHBvc2l0aW9uIHRoYXQgdGhlIHN0YXRlIHJlZmVycyB0by5cbiAgQ29kZU1pcnJvci5pbm5lck1vZGUgPSBmdW5jdGlvbihtb2RlLCBzdGF0ZSkge1xuICAgIHdoaWxlIChtb2RlLmlubmVyTW9kZSkge1xuICAgICAgdmFyIGluZm8gPSBtb2RlLmlubmVyTW9kZShzdGF0ZSk7XG4gICAgICBpZiAoIWluZm8gfHwgaW5mby5tb2RlID09IG1vZGUpIGJyZWFrO1xuICAgICAgc3RhdGUgPSBpbmZvLnN0YXRlO1xuICAgICAgbW9kZSA9IGluZm8ubW9kZTtcbiAgICB9XG4gICAgcmV0dXJuIGluZm8gfHwge21vZGU6IG1vZGUsIHN0YXRlOiBzdGF0ZX07XG4gIH07XG5cbiAgLy8gU1RBTkRBUkQgQ09NTUFORFNcblxuICAvLyBDb21tYW5kcyBhcmUgcGFyYW1ldGVyLWxlc3MgYWN0aW9ucyB0aGF0IGNhbiBiZSBwZXJmb3JtZWQgb24gYW5cbiAgLy8gZWRpdG9yLCBtb3N0bHkgdXNlZCBmb3Iga2V5YmluZGluZ3MuXG4gIHZhciBjb21tYW5kcyA9IENvZGVNaXJyb3IuY29tbWFuZHMgPSB7XG4gICAgc2VsZWN0QWxsOiBmdW5jdGlvbihjbSkge2NtLnNldFNlbGVjdGlvbihQb3MoY20uZmlyc3RMaW5lKCksIDApLCBQb3MoY20ubGFzdExpbmUoKSksIHNlbF9kb250U2Nyb2xsKTt9LFxuICAgIHNpbmdsZVNlbGVjdGlvbjogZnVuY3Rpb24oY20pIHtcbiAgICAgIGNtLnNldFNlbGVjdGlvbihjbS5nZXRDdXJzb3IoXCJhbmNob3JcIiksIGNtLmdldEN1cnNvcihcImhlYWRcIiksIHNlbF9kb250U2Nyb2xsKTtcbiAgICB9LFxuICAgIGtpbGxMaW5lOiBmdW5jdGlvbihjbSkge1xuICAgICAgZGVsZXRlTmVhclNlbGVjdGlvbihjbSwgZnVuY3Rpb24ocmFuZ2UpIHtcbiAgICAgICAgaWYgKHJhbmdlLmVtcHR5KCkpIHtcbiAgICAgICAgICB2YXIgbGVuID0gZ2V0TGluZShjbS5kb2MsIHJhbmdlLmhlYWQubGluZSkudGV4dC5sZW5ndGg7XG4gICAgICAgICAgaWYgKHJhbmdlLmhlYWQuY2ggPT0gbGVuICYmIHJhbmdlLmhlYWQubGluZSA8IGNtLmxhc3RMaW5lKCkpXG4gICAgICAgICAgICByZXR1cm4ge2Zyb206IHJhbmdlLmhlYWQsIHRvOiBQb3MocmFuZ2UuaGVhZC5saW5lICsgMSwgMCl9O1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJldHVybiB7ZnJvbTogcmFuZ2UuaGVhZCwgdG86IFBvcyhyYW5nZS5oZWFkLmxpbmUsIGxlbil9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB7ZnJvbTogcmFuZ2UuZnJvbSgpLCB0bzogcmFuZ2UudG8oKX07XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0sXG4gICAgZGVsZXRlTGluZTogZnVuY3Rpb24oY20pIHtcbiAgICAgIGRlbGV0ZU5lYXJTZWxlY3Rpb24oY20sIGZ1bmN0aW9uKHJhbmdlKSB7XG4gICAgICAgIHJldHVybiB7ZnJvbTogUG9zKHJhbmdlLmZyb20oKS5saW5lLCAwKSxcbiAgICAgICAgICAgICAgICB0bzogY2xpcFBvcyhjbS5kb2MsIFBvcyhyYW5nZS50bygpLmxpbmUgKyAxLCAwKSl9O1xuICAgICAgfSk7XG4gICAgfSxcbiAgICBkZWxMaW5lTGVmdDogZnVuY3Rpb24oY20pIHtcbiAgICAgIGRlbGV0ZU5lYXJTZWxlY3Rpb24oY20sIGZ1bmN0aW9uKHJhbmdlKSB7XG4gICAgICAgIHJldHVybiB7ZnJvbTogUG9zKHJhbmdlLmZyb20oKS5saW5lLCAwKSwgdG86IHJhbmdlLmZyb20oKX07XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGRlbFdyYXBwZWRMaW5lTGVmdDogZnVuY3Rpb24oY20pIHtcbiAgICAgIGRlbGV0ZU5lYXJTZWxlY3Rpb24oY20sIGZ1bmN0aW9uKHJhbmdlKSB7XG4gICAgICAgIHZhciB0b3AgPSBjbS5jaGFyQ29vcmRzKHJhbmdlLmhlYWQsIFwiZGl2XCIpLnRvcCArIDU7XG4gICAgICAgIHZhciBsZWZ0UG9zID0gY20uY29vcmRzQ2hhcih7bGVmdDogMCwgdG9wOiB0b3B9LCBcImRpdlwiKTtcbiAgICAgICAgcmV0dXJuIHtmcm9tOiBsZWZ0UG9zLCB0bzogcmFuZ2UuZnJvbSgpfTtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgZGVsV3JhcHBlZExpbmVSaWdodDogZnVuY3Rpb24oY20pIHtcbiAgICAgIGRlbGV0ZU5lYXJTZWxlY3Rpb24oY20sIGZ1bmN0aW9uKHJhbmdlKSB7XG4gICAgICAgIHZhciB0b3AgPSBjbS5jaGFyQ29vcmRzKHJhbmdlLmhlYWQsIFwiZGl2XCIpLnRvcCArIDU7XG4gICAgICAgIHZhciByaWdodFBvcyA9IGNtLmNvb3Jkc0NoYXIoe2xlZnQ6IGNtLmRpc3BsYXkubGluZURpdi5vZmZzZXRXaWR0aCArIDEwMCwgdG9wOiB0b3B9LCBcImRpdlwiKTtcbiAgICAgICAgcmV0dXJuIHtmcm9tOiByYW5nZS5mcm9tKCksIHRvOiByaWdodFBvcyB9O1xuICAgICAgfSk7XG4gICAgfSxcbiAgICB1bmRvOiBmdW5jdGlvbihjbSkge2NtLnVuZG8oKTt9LFxuICAgIHJlZG86IGZ1bmN0aW9uKGNtKSB7Y20ucmVkbygpO30sXG4gICAgdW5kb1NlbGVjdGlvbjogZnVuY3Rpb24oY20pIHtjbS51bmRvU2VsZWN0aW9uKCk7fSxcbiAgICByZWRvU2VsZWN0aW9uOiBmdW5jdGlvbihjbSkge2NtLnJlZG9TZWxlY3Rpb24oKTt9LFxuICAgIGdvRG9jU3RhcnQ6IGZ1bmN0aW9uKGNtKSB7Y20uZXh0ZW5kU2VsZWN0aW9uKFBvcyhjbS5maXJzdExpbmUoKSwgMCkpO30sXG4gICAgZ29Eb2NFbmQ6IGZ1bmN0aW9uKGNtKSB7Y20uZXh0ZW5kU2VsZWN0aW9uKFBvcyhjbS5sYXN0TGluZSgpKSk7fSxcbiAgICBnb0xpbmVTdGFydDogZnVuY3Rpb24oY20pIHtcbiAgICAgIGNtLmV4dGVuZFNlbGVjdGlvbnNCeShmdW5jdGlvbihyYW5nZSkgeyByZXR1cm4gbGluZVN0YXJ0KGNtLCByYW5nZS5oZWFkLmxpbmUpOyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtvcmlnaW46IFwiK21vdmVcIiwgYmlhczogMX0pO1xuICAgIH0sXG4gICAgZ29MaW5lU3RhcnRTbWFydDogZnVuY3Rpb24oY20pIHtcbiAgICAgIGNtLmV4dGVuZFNlbGVjdGlvbnNCeShmdW5jdGlvbihyYW5nZSkge1xuICAgICAgICByZXR1cm4gbGluZVN0YXJ0U21hcnQoY20sIHJhbmdlLmhlYWQpO1xuICAgICAgfSwge29yaWdpbjogXCIrbW92ZVwiLCBiaWFzOiAxfSk7XG4gICAgfSxcbiAgICBnb0xpbmVFbmQ6IGZ1bmN0aW9uKGNtKSB7XG4gICAgICBjbS5leHRlbmRTZWxlY3Rpb25zQnkoZnVuY3Rpb24ocmFuZ2UpIHsgcmV0dXJuIGxpbmVFbmQoY20sIHJhbmdlLmhlYWQubGluZSk7IH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge29yaWdpbjogXCIrbW92ZVwiLCBiaWFzOiAtMX0pO1xuICAgIH0sXG4gICAgZ29MaW5lUmlnaHQ6IGZ1bmN0aW9uKGNtKSB7XG4gICAgICBjbS5leHRlbmRTZWxlY3Rpb25zQnkoZnVuY3Rpb24ocmFuZ2UpIHtcbiAgICAgICAgdmFyIHRvcCA9IGNtLmNoYXJDb29yZHMocmFuZ2UuaGVhZCwgXCJkaXZcIikudG9wICsgNTtcbiAgICAgICAgcmV0dXJuIGNtLmNvb3Jkc0NoYXIoe2xlZnQ6IGNtLmRpc3BsYXkubGluZURpdi5vZmZzZXRXaWR0aCArIDEwMCwgdG9wOiB0b3B9LCBcImRpdlwiKTtcbiAgICAgIH0sIHNlbF9tb3ZlKTtcbiAgICB9LFxuICAgIGdvTGluZUxlZnQ6IGZ1bmN0aW9uKGNtKSB7XG4gICAgICBjbS5leHRlbmRTZWxlY3Rpb25zQnkoZnVuY3Rpb24ocmFuZ2UpIHtcbiAgICAgICAgdmFyIHRvcCA9IGNtLmNoYXJDb29yZHMocmFuZ2UuaGVhZCwgXCJkaXZcIikudG9wICsgNTtcbiAgICAgICAgcmV0dXJuIGNtLmNvb3Jkc0NoYXIoe2xlZnQ6IDAsIHRvcDogdG9wfSwgXCJkaXZcIik7XG4gICAgICB9LCBzZWxfbW92ZSk7XG4gICAgfSxcbiAgICBnb0xpbmVMZWZ0U21hcnQ6IGZ1bmN0aW9uKGNtKSB7XG4gICAgICBjbS5leHRlbmRTZWxlY3Rpb25zQnkoZnVuY3Rpb24ocmFuZ2UpIHtcbiAgICAgICAgdmFyIHRvcCA9IGNtLmNoYXJDb29yZHMocmFuZ2UuaGVhZCwgXCJkaXZcIikudG9wICsgNTtcbiAgICAgICAgdmFyIHBvcyA9IGNtLmNvb3Jkc0NoYXIoe2xlZnQ6IDAsIHRvcDogdG9wfSwgXCJkaXZcIik7XG4gICAgICAgIGlmIChwb3MuY2ggPCBjbS5nZXRMaW5lKHBvcy5saW5lKS5zZWFyY2goL1xcUy8pKSByZXR1cm4gbGluZVN0YXJ0U21hcnQoY20sIHJhbmdlLmhlYWQpO1xuICAgICAgICByZXR1cm4gcG9zO1xuICAgICAgfSwgc2VsX21vdmUpO1xuICAgIH0sXG4gICAgZ29MaW5lVXA6IGZ1bmN0aW9uKGNtKSB7Y20ubW92ZVYoLTEsIFwibGluZVwiKTt9LFxuICAgIGdvTGluZURvd246IGZ1bmN0aW9uKGNtKSB7Y20ubW92ZVYoMSwgXCJsaW5lXCIpO30sXG4gICAgZ29QYWdlVXA6IGZ1bmN0aW9uKGNtKSB7Y20ubW92ZVYoLTEsIFwicGFnZVwiKTt9LFxuICAgIGdvUGFnZURvd246IGZ1bmN0aW9uKGNtKSB7Y20ubW92ZVYoMSwgXCJwYWdlXCIpO30sXG4gICAgZ29DaGFyTGVmdDogZnVuY3Rpb24oY20pIHtjbS5tb3ZlSCgtMSwgXCJjaGFyXCIpO30sXG4gICAgZ29DaGFyUmlnaHQ6IGZ1bmN0aW9uKGNtKSB7Y20ubW92ZUgoMSwgXCJjaGFyXCIpO30sXG4gICAgZ29Db2x1bW5MZWZ0OiBmdW5jdGlvbihjbSkge2NtLm1vdmVIKC0xLCBcImNvbHVtblwiKTt9LFxuICAgIGdvQ29sdW1uUmlnaHQ6IGZ1bmN0aW9uKGNtKSB7Y20ubW92ZUgoMSwgXCJjb2x1bW5cIik7fSxcbiAgICBnb1dvcmRMZWZ0OiBmdW5jdGlvbihjbSkge2NtLm1vdmVIKC0xLCBcIndvcmRcIik7fSxcbiAgICBnb0dyb3VwUmlnaHQ6IGZ1bmN0aW9uKGNtKSB7Y20ubW92ZUgoMSwgXCJncm91cFwiKTt9LFxuICAgIGdvR3JvdXBMZWZ0OiBmdW5jdGlvbihjbSkge2NtLm1vdmVIKC0xLCBcImdyb3VwXCIpO30sXG4gICAgZ29Xb3JkUmlnaHQ6IGZ1bmN0aW9uKGNtKSB7Y20ubW92ZUgoMSwgXCJ3b3JkXCIpO30sXG4gICAgZGVsQ2hhckJlZm9yZTogZnVuY3Rpb24oY20pIHtjbS5kZWxldGVIKC0xLCBcImNoYXJcIik7fSxcbiAgICBkZWxDaGFyQWZ0ZXI6IGZ1bmN0aW9uKGNtKSB7Y20uZGVsZXRlSCgxLCBcImNoYXJcIik7fSxcbiAgICBkZWxXb3JkQmVmb3JlOiBmdW5jdGlvbihjbSkge2NtLmRlbGV0ZUgoLTEsIFwid29yZFwiKTt9LFxuICAgIGRlbFdvcmRBZnRlcjogZnVuY3Rpb24oY20pIHtjbS5kZWxldGVIKDEsIFwid29yZFwiKTt9LFxuICAgIGRlbEdyb3VwQmVmb3JlOiBmdW5jdGlvbihjbSkge2NtLmRlbGV0ZUgoLTEsIFwiZ3JvdXBcIik7fSxcbiAgICBkZWxHcm91cEFmdGVyOiBmdW5jdGlvbihjbSkge2NtLmRlbGV0ZUgoMSwgXCJncm91cFwiKTt9LFxuICAgIGluZGVudEF1dG86IGZ1bmN0aW9uKGNtKSB7Y20uaW5kZW50U2VsZWN0aW9uKFwic21hcnRcIik7fSxcbiAgICBpbmRlbnRNb3JlOiBmdW5jdGlvbihjbSkge2NtLmluZGVudFNlbGVjdGlvbihcImFkZFwiKTt9LFxuICAgIGluZGVudExlc3M6IGZ1bmN0aW9uKGNtKSB7Y20uaW5kZW50U2VsZWN0aW9uKFwic3VidHJhY3RcIik7fSxcbiAgICBpbnNlcnRUYWI6IGZ1bmN0aW9uKGNtKSB7Y20ucmVwbGFjZVNlbGVjdGlvbihcIlxcdFwiKTt9LFxuICAgIGluc2VydFNvZnRUYWI6IGZ1bmN0aW9uKGNtKSB7XG4gICAgICB2YXIgc3BhY2VzID0gW10sIHJhbmdlcyA9IGNtLmxpc3RTZWxlY3Rpb25zKCksIHRhYlNpemUgPSBjbS5vcHRpb25zLnRhYlNpemU7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJhbmdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgcG9zID0gcmFuZ2VzW2ldLmZyb20oKTtcbiAgICAgICAgdmFyIGNvbCA9IGNvdW50Q29sdW1uKGNtLmdldExpbmUocG9zLmxpbmUpLCBwb3MuY2gsIHRhYlNpemUpO1xuICAgICAgICBzcGFjZXMucHVzaChuZXcgQXJyYXkodGFiU2l6ZSAtIGNvbCAlIHRhYlNpemUgKyAxKS5qb2luKFwiIFwiKSk7XG4gICAgICB9XG4gICAgICBjbS5yZXBsYWNlU2VsZWN0aW9ucyhzcGFjZXMpO1xuICAgIH0sXG4gICAgZGVmYXVsdFRhYjogZnVuY3Rpb24oY20pIHtcbiAgICAgIGlmIChjbS5zb21ldGhpbmdTZWxlY3RlZCgpKSBjbS5pbmRlbnRTZWxlY3Rpb24oXCJhZGRcIik7XG4gICAgICBlbHNlIGNtLmV4ZWNDb21tYW5kKFwiaW5zZXJ0VGFiXCIpO1xuICAgIH0sXG4gICAgdHJhbnNwb3NlQ2hhcnM6IGZ1bmN0aW9uKGNtKSB7XG4gICAgICBydW5Jbk9wKGNtLCBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHJhbmdlcyA9IGNtLmxpc3RTZWxlY3Rpb25zKCksIG5ld1NlbCA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJhbmdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHZhciBjdXIgPSByYW5nZXNbaV0uaGVhZCwgbGluZSA9IGdldExpbmUoY20uZG9jLCBjdXIubGluZSkudGV4dDtcbiAgICAgICAgICBpZiAobGluZSkge1xuICAgICAgICAgICAgaWYgKGN1ci5jaCA9PSBsaW5lLmxlbmd0aCkgY3VyID0gbmV3IFBvcyhjdXIubGluZSwgY3VyLmNoIC0gMSk7XG4gICAgICAgICAgICBpZiAoY3VyLmNoID4gMCkge1xuICAgICAgICAgICAgICBjdXIgPSBuZXcgUG9zKGN1ci5saW5lLCBjdXIuY2ggKyAxKTtcbiAgICAgICAgICAgICAgY20ucmVwbGFjZVJhbmdlKGxpbmUuY2hhckF0KGN1ci5jaCAtIDEpICsgbGluZS5jaGFyQXQoY3VyLmNoIC0gMiksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBQb3MoY3VyLmxpbmUsIGN1ci5jaCAtIDIpLCBjdXIsIFwiK3RyYW5zcG9zZVwiKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY3VyLmxpbmUgPiBjbS5kb2MuZmlyc3QpIHtcbiAgICAgICAgICAgICAgdmFyIHByZXYgPSBnZXRMaW5lKGNtLmRvYywgY3VyLmxpbmUgLSAxKS50ZXh0O1xuICAgICAgICAgICAgICBpZiAocHJldilcbiAgICAgICAgICAgICAgICBjbS5yZXBsYWNlUmFuZ2UobGluZS5jaGFyQXQoMCkgKyBjbS5kb2MubGluZVNlcGFyYXRvcigpICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJldi5jaGFyQXQocHJldi5sZW5ndGggLSAxKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUG9zKGN1ci5saW5lIC0gMSwgcHJldi5sZW5ndGggLSAxKSwgUG9zKGN1ci5saW5lLCAxKSwgXCIrdHJhbnNwb3NlXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBuZXdTZWwucHVzaChuZXcgUmFuZ2UoY3VyLCBjdXIpKTtcbiAgICAgICAgfVxuICAgICAgICBjbS5zZXRTZWxlY3Rpb25zKG5ld1NlbCk7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIG5ld2xpbmVBbmRJbmRlbnQ6IGZ1bmN0aW9uKGNtKSB7XG4gICAgICBydW5Jbk9wKGNtLCBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGxlbiA9IGNtLmxpc3RTZWxlY3Rpb25zKCkubGVuZ3RoO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgdmFyIHJhbmdlID0gY20ubGlzdFNlbGVjdGlvbnMoKVtpXTtcbiAgICAgICAgICBjbS5yZXBsYWNlUmFuZ2UoY20uZG9jLmxpbmVTZXBhcmF0b3IoKSwgcmFuZ2UuYW5jaG9yLCByYW5nZS5oZWFkLCBcIitpbnB1dFwiKTtcbiAgICAgICAgICBjbS5pbmRlbnRMaW5lKHJhbmdlLmZyb20oKS5saW5lICsgMSwgbnVsbCwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZW5zdXJlQ3Vyc29yVmlzaWJsZShjbSk7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIHRvZ2dsZU92ZXJ3cml0ZTogZnVuY3Rpb24oY20pIHtjbS50b2dnbGVPdmVyd3JpdGUoKTt9XG4gIH07XG5cblxuICAvLyBTVEFOREFSRCBLRVlNQVBTXG5cbiAgdmFyIGtleU1hcCA9IENvZGVNaXJyb3Iua2V5TWFwID0ge307XG5cbiAga2V5TWFwLmJhc2ljID0ge1xuICAgIFwiTGVmdFwiOiBcImdvQ2hhckxlZnRcIiwgXCJSaWdodFwiOiBcImdvQ2hhclJpZ2h0XCIsIFwiVXBcIjogXCJnb0xpbmVVcFwiLCBcIkRvd25cIjogXCJnb0xpbmVEb3duXCIsXG4gICAgXCJFbmRcIjogXCJnb0xpbmVFbmRcIiwgXCJIb21lXCI6IFwiZ29MaW5lU3RhcnRTbWFydFwiLCBcIlBhZ2VVcFwiOiBcImdvUGFnZVVwXCIsIFwiUGFnZURvd25cIjogXCJnb1BhZ2VEb3duXCIsXG4gICAgXCJEZWxldGVcIjogXCJkZWxDaGFyQWZ0ZXJcIiwgXCJCYWNrc3BhY2VcIjogXCJkZWxDaGFyQmVmb3JlXCIsIFwiU2hpZnQtQmFja3NwYWNlXCI6IFwiZGVsQ2hhckJlZm9yZVwiLFxuICAgIFwiVGFiXCI6IFwiZGVmYXVsdFRhYlwiLCBcIlNoaWZ0LVRhYlwiOiBcImluZGVudEF1dG9cIixcbiAgICBcIkVudGVyXCI6IFwibmV3bGluZUFuZEluZGVudFwiLCBcIkluc2VydFwiOiBcInRvZ2dsZU92ZXJ3cml0ZVwiLFxuICAgIFwiRXNjXCI6IFwic2luZ2xlU2VsZWN0aW9uXCJcbiAgfTtcbiAgLy8gTm90ZSB0aGF0IHRoZSBzYXZlIGFuZCBmaW5kLXJlbGF0ZWQgY29tbWFuZHMgYXJlbid0IGRlZmluZWQgYnlcbiAgLy8gZGVmYXVsdC4gVXNlciBjb2RlIG9yIGFkZG9ucyBjYW4gZGVmaW5lIHRoZW0uIFVua25vd24gY29tbWFuZHNcbiAgLy8gYXJlIHNpbXBseSBpZ25vcmVkLlxuICBrZXlNYXAucGNEZWZhdWx0ID0ge1xuICAgIFwiQ3RybC1BXCI6IFwic2VsZWN0QWxsXCIsIFwiQ3RybC1EXCI6IFwiZGVsZXRlTGluZVwiLCBcIkN0cmwtWlwiOiBcInVuZG9cIiwgXCJTaGlmdC1DdHJsLVpcIjogXCJyZWRvXCIsIFwiQ3RybC1ZXCI6IFwicmVkb1wiLFxuICAgIFwiQ3RybC1Ib21lXCI6IFwiZ29Eb2NTdGFydFwiLCBcIkN0cmwtRW5kXCI6IFwiZ29Eb2NFbmRcIiwgXCJDdHJsLVVwXCI6IFwiZ29MaW5lVXBcIiwgXCJDdHJsLURvd25cIjogXCJnb0xpbmVEb3duXCIsXG4gICAgXCJDdHJsLUxlZnRcIjogXCJnb0dyb3VwTGVmdFwiLCBcIkN0cmwtUmlnaHRcIjogXCJnb0dyb3VwUmlnaHRcIiwgXCJBbHQtTGVmdFwiOiBcImdvTGluZVN0YXJ0XCIsIFwiQWx0LVJpZ2h0XCI6IFwiZ29MaW5lRW5kXCIsXG4gICAgXCJDdHJsLUJhY2tzcGFjZVwiOiBcImRlbEdyb3VwQmVmb3JlXCIsIFwiQ3RybC1EZWxldGVcIjogXCJkZWxHcm91cEFmdGVyXCIsIFwiQ3RybC1TXCI6IFwic2F2ZVwiLCBcIkN0cmwtRlwiOiBcImZpbmRcIixcbiAgICBcIkN0cmwtR1wiOiBcImZpbmROZXh0XCIsIFwiU2hpZnQtQ3RybC1HXCI6IFwiZmluZFByZXZcIiwgXCJTaGlmdC1DdHJsLUZcIjogXCJyZXBsYWNlXCIsIFwiU2hpZnQtQ3RybC1SXCI6IFwicmVwbGFjZUFsbFwiLFxuICAgIFwiQ3RybC1bXCI6IFwiaW5kZW50TGVzc1wiLCBcIkN0cmwtXVwiOiBcImluZGVudE1vcmVcIixcbiAgICBcIkN0cmwtVVwiOiBcInVuZG9TZWxlY3Rpb25cIiwgXCJTaGlmdC1DdHJsLVVcIjogXCJyZWRvU2VsZWN0aW9uXCIsIFwiQWx0LVVcIjogXCJyZWRvU2VsZWN0aW9uXCIsXG4gICAgZmFsbHRocm91Z2g6IFwiYmFzaWNcIlxuICB9O1xuICAvLyBWZXJ5IGJhc2ljIHJlYWRsaW5lL2VtYWNzLXN0eWxlIGJpbmRpbmdzLCB3aGljaCBhcmUgc3RhbmRhcmQgb24gTWFjLlxuICBrZXlNYXAuZW1hY3N5ID0ge1xuICAgIFwiQ3RybC1GXCI6IFwiZ29DaGFyUmlnaHRcIiwgXCJDdHJsLUJcIjogXCJnb0NoYXJMZWZ0XCIsIFwiQ3RybC1QXCI6IFwiZ29MaW5lVXBcIiwgXCJDdHJsLU5cIjogXCJnb0xpbmVEb3duXCIsXG4gICAgXCJBbHQtRlwiOiBcImdvV29yZFJpZ2h0XCIsIFwiQWx0LUJcIjogXCJnb1dvcmRMZWZ0XCIsIFwiQ3RybC1BXCI6IFwiZ29MaW5lU3RhcnRcIiwgXCJDdHJsLUVcIjogXCJnb0xpbmVFbmRcIixcbiAgICBcIkN0cmwtVlwiOiBcImdvUGFnZURvd25cIiwgXCJTaGlmdC1DdHJsLVZcIjogXCJnb1BhZ2VVcFwiLCBcIkN0cmwtRFwiOiBcImRlbENoYXJBZnRlclwiLCBcIkN0cmwtSFwiOiBcImRlbENoYXJCZWZvcmVcIixcbiAgICBcIkFsdC1EXCI6IFwiZGVsV29yZEFmdGVyXCIsIFwiQWx0LUJhY2tzcGFjZVwiOiBcImRlbFdvcmRCZWZvcmVcIiwgXCJDdHJsLUtcIjogXCJraWxsTGluZVwiLCBcIkN0cmwtVFwiOiBcInRyYW5zcG9zZUNoYXJzXCJcbiAgfTtcbiAga2V5TWFwLm1hY0RlZmF1bHQgPSB7XG4gICAgXCJDbWQtQVwiOiBcInNlbGVjdEFsbFwiLCBcIkNtZC1EXCI6IFwiZGVsZXRlTGluZVwiLCBcIkNtZC1aXCI6IFwidW5kb1wiLCBcIlNoaWZ0LUNtZC1aXCI6IFwicmVkb1wiLCBcIkNtZC1ZXCI6IFwicmVkb1wiLFxuICAgIFwiQ21kLUhvbWVcIjogXCJnb0RvY1N0YXJ0XCIsIFwiQ21kLVVwXCI6IFwiZ29Eb2NTdGFydFwiLCBcIkNtZC1FbmRcIjogXCJnb0RvY0VuZFwiLCBcIkNtZC1Eb3duXCI6IFwiZ29Eb2NFbmRcIiwgXCJBbHQtTGVmdFwiOiBcImdvR3JvdXBMZWZ0XCIsXG4gICAgXCJBbHQtUmlnaHRcIjogXCJnb0dyb3VwUmlnaHRcIiwgXCJDbWQtTGVmdFwiOiBcImdvTGluZUxlZnRcIiwgXCJDbWQtUmlnaHRcIjogXCJnb0xpbmVSaWdodFwiLCBcIkFsdC1CYWNrc3BhY2VcIjogXCJkZWxHcm91cEJlZm9yZVwiLFxuICAgIFwiQ3RybC1BbHQtQmFja3NwYWNlXCI6IFwiZGVsR3JvdXBBZnRlclwiLCBcIkFsdC1EZWxldGVcIjogXCJkZWxHcm91cEFmdGVyXCIsIFwiQ21kLVNcIjogXCJzYXZlXCIsIFwiQ21kLUZcIjogXCJmaW5kXCIsXG4gICAgXCJDbWQtR1wiOiBcImZpbmROZXh0XCIsIFwiU2hpZnQtQ21kLUdcIjogXCJmaW5kUHJldlwiLCBcIkNtZC1BbHQtRlwiOiBcInJlcGxhY2VcIiwgXCJTaGlmdC1DbWQtQWx0LUZcIjogXCJyZXBsYWNlQWxsXCIsXG4gICAgXCJDbWQtW1wiOiBcImluZGVudExlc3NcIiwgXCJDbWQtXVwiOiBcImluZGVudE1vcmVcIiwgXCJDbWQtQmFja3NwYWNlXCI6IFwiZGVsV3JhcHBlZExpbmVMZWZ0XCIsIFwiQ21kLURlbGV0ZVwiOiBcImRlbFdyYXBwZWRMaW5lUmlnaHRcIixcbiAgICBcIkNtZC1VXCI6IFwidW5kb1NlbGVjdGlvblwiLCBcIlNoaWZ0LUNtZC1VXCI6IFwicmVkb1NlbGVjdGlvblwiLCBcIkN0cmwtVXBcIjogXCJnb0RvY1N0YXJ0XCIsIFwiQ3RybC1Eb3duXCI6IFwiZ29Eb2NFbmRcIixcbiAgICBmYWxsdGhyb3VnaDogW1wiYmFzaWNcIiwgXCJlbWFjc3lcIl1cbiAgfTtcbiAga2V5TWFwW1wiZGVmYXVsdFwiXSA9IG1hYyA/IGtleU1hcC5tYWNEZWZhdWx0IDoga2V5TWFwLnBjRGVmYXVsdDtcblxuICAvLyBLRVlNQVAgRElTUEFUQ0hcblxuICBmdW5jdGlvbiBub3JtYWxpemVLZXlOYW1lKG5hbWUpIHtcbiAgICB2YXIgcGFydHMgPSBuYW1lLnNwbGl0KC8tKD8hJCkvKSwgbmFtZSA9IHBhcnRzW3BhcnRzLmxlbmd0aCAtIDFdO1xuICAgIHZhciBhbHQsIGN0cmwsIHNoaWZ0LCBjbWQ7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXJ0cy5sZW5ndGggLSAxOyBpKyspIHtcbiAgICAgIHZhciBtb2QgPSBwYXJ0c1tpXTtcbiAgICAgIGlmICgvXihjbWR8bWV0YXxtKSQvaS50ZXN0KG1vZCkpIGNtZCA9IHRydWU7XG4gICAgICBlbHNlIGlmICgvXmEobHQpPyQvaS50ZXN0KG1vZCkpIGFsdCA9IHRydWU7XG4gICAgICBlbHNlIGlmICgvXihjfGN0cmx8Y29udHJvbCkkL2kudGVzdChtb2QpKSBjdHJsID0gdHJ1ZTtcbiAgICAgIGVsc2UgaWYgKC9ecyhoaWZ0KSQvaS50ZXN0KG1vZCkpIHNoaWZ0ID0gdHJ1ZTtcbiAgICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yKFwiVW5yZWNvZ25pemVkIG1vZGlmaWVyIG5hbWU6IFwiICsgbW9kKTtcbiAgICB9XG4gICAgaWYgKGFsdCkgbmFtZSA9IFwiQWx0LVwiICsgbmFtZTtcbiAgICBpZiAoY3RybCkgbmFtZSA9IFwiQ3RybC1cIiArIG5hbWU7XG4gICAgaWYgKGNtZCkgbmFtZSA9IFwiQ21kLVwiICsgbmFtZTtcbiAgICBpZiAoc2hpZnQpIG5hbWUgPSBcIlNoaWZ0LVwiICsgbmFtZTtcbiAgICByZXR1cm4gbmFtZTtcbiAgfVxuXG4gIC8vIFRoaXMgaXMgYSBrbHVkZ2UgdG8ga2VlcCBrZXltYXBzIG1vc3RseSB3b3JraW5nIGFzIHJhdyBvYmplY3RzXG4gIC8vIChiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSkgd2hpbGUgYXQgdGhlIHNhbWUgdGltZSBzdXBwb3J0IGZlYXR1cmVzXG4gIC8vIGxpa2Ugbm9ybWFsaXphdGlvbiBhbmQgbXVsdGktc3Ryb2tlIGtleSBiaW5kaW5ncy4gSXQgY29tcGlsZXMgYVxuICAvLyBuZXcgbm9ybWFsaXplZCBrZXltYXAsIGFuZCB0aGVuIHVwZGF0ZXMgdGhlIG9sZCBvYmplY3QgdG8gcmVmbGVjdFxuICAvLyB0aGlzLlxuICBDb2RlTWlycm9yLm5vcm1hbGl6ZUtleU1hcCA9IGZ1bmN0aW9uKGtleW1hcCkge1xuICAgIHZhciBjb3B5ID0ge307XG4gICAgZm9yICh2YXIga2V5bmFtZSBpbiBrZXltYXApIGlmIChrZXltYXAuaGFzT3duUHJvcGVydHkoa2V5bmFtZSkpIHtcbiAgICAgIHZhciB2YWx1ZSA9IGtleW1hcFtrZXluYW1lXTtcbiAgICAgIGlmICgvXihuYW1lfGZhbGx0aHJvdWdofChkZXxhdCl0YWNoKSQvLnRlc3Qoa2V5bmFtZSkpIGNvbnRpbnVlO1xuICAgICAgaWYgKHZhbHVlID09IFwiLi4uXCIpIHsgZGVsZXRlIGtleW1hcFtrZXluYW1lXTsgY29udGludWU7IH1cblxuICAgICAgdmFyIGtleXMgPSBtYXAoa2V5bmFtZS5zcGxpdChcIiBcIiksIG5vcm1hbGl6ZUtleU5hbWUpO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciB2YWwsIG5hbWU7XG4gICAgICAgIGlmIChpID09IGtleXMubGVuZ3RoIC0gMSkge1xuICAgICAgICAgIG5hbWUgPSBrZXlzLmpvaW4oXCIgXCIpO1xuICAgICAgICAgIHZhbCA9IHZhbHVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5hbWUgPSBrZXlzLnNsaWNlKDAsIGkgKyAxKS5qb2luKFwiIFwiKTtcbiAgICAgICAgICB2YWwgPSBcIi4uLlwiO1xuICAgICAgICB9XG4gICAgICAgIHZhciBwcmV2ID0gY29weVtuYW1lXTtcbiAgICAgICAgaWYgKCFwcmV2KSBjb3B5W25hbWVdID0gdmFsO1xuICAgICAgICBlbHNlIGlmIChwcmV2ICE9IHZhbCkgdGhyb3cgbmV3IEVycm9yKFwiSW5jb25zaXN0ZW50IGJpbmRpbmdzIGZvciBcIiArIG5hbWUpO1xuICAgICAgfVxuICAgICAgZGVsZXRlIGtleW1hcFtrZXluYW1lXTtcbiAgICB9XG4gICAgZm9yICh2YXIgcHJvcCBpbiBjb3B5KSBrZXltYXBbcHJvcF0gPSBjb3B5W3Byb3BdO1xuICAgIHJldHVybiBrZXltYXA7XG4gIH07XG5cbiAgdmFyIGxvb2t1cEtleSA9IENvZGVNaXJyb3IubG9va3VwS2V5ID0gZnVuY3Rpb24oa2V5LCBtYXAsIGhhbmRsZSwgY29udGV4dCkge1xuICAgIG1hcCA9IGdldEtleU1hcChtYXApO1xuICAgIHZhciBmb3VuZCA9IG1hcC5jYWxsID8gbWFwLmNhbGwoa2V5LCBjb250ZXh0KSA6IG1hcFtrZXldO1xuICAgIGlmIChmb3VuZCA9PT0gZmFsc2UpIHJldHVybiBcIm5vdGhpbmdcIjtcbiAgICBpZiAoZm91bmQgPT09IFwiLi4uXCIpIHJldHVybiBcIm11bHRpXCI7XG4gICAgaWYgKGZvdW5kICE9IG51bGwgJiYgaGFuZGxlKGZvdW5kKSkgcmV0dXJuIFwiaGFuZGxlZFwiO1xuXG4gICAgaWYgKG1hcC5mYWxsdGhyb3VnaCkge1xuICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChtYXAuZmFsbHRocm91Z2gpICE9IFwiW29iamVjdCBBcnJheV1cIilcbiAgICAgICAgcmV0dXJuIGxvb2t1cEtleShrZXksIG1hcC5mYWxsdGhyb3VnaCwgaGFuZGxlLCBjb250ZXh0KTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbWFwLmZhbGx0aHJvdWdoLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSBsb29rdXBLZXkoa2V5LCBtYXAuZmFsbHRocm91Z2hbaV0sIGhhbmRsZSwgY29udGV4dCk7XG4gICAgICAgIGlmIChyZXN1bHQpIHJldHVybiByZXN1bHQ7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIC8vIE1vZGlmaWVyIGtleSBwcmVzc2VzIGRvbid0IGNvdW50IGFzICdyZWFsJyBrZXkgcHJlc3NlcyBmb3IgdGhlXG4gIC8vIHB1cnBvc2Ugb2Yga2V5bWFwIGZhbGx0aHJvdWdoLlxuICB2YXIgaXNNb2RpZmllcktleSA9IENvZGVNaXJyb3IuaXNNb2RpZmllcktleSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgdmFyIG5hbWUgPSB0eXBlb2YgdmFsdWUgPT0gXCJzdHJpbmdcIiA/IHZhbHVlIDoga2V5TmFtZXNbdmFsdWUua2V5Q29kZV07XG4gICAgcmV0dXJuIG5hbWUgPT0gXCJDdHJsXCIgfHwgbmFtZSA9PSBcIkFsdFwiIHx8IG5hbWUgPT0gXCJTaGlmdFwiIHx8IG5hbWUgPT0gXCJNb2RcIjtcbiAgfTtcblxuICAvLyBMb29rIHVwIHRoZSBuYW1lIG9mIGEga2V5IGFzIGluZGljYXRlZCBieSBhbiBldmVudCBvYmplY3QuXG4gIHZhciBrZXlOYW1lID0gQ29kZU1pcnJvci5rZXlOYW1lID0gZnVuY3Rpb24oZXZlbnQsIG5vU2hpZnQpIHtcbiAgICBpZiAocHJlc3RvICYmIGV2ZW50LmtleUNvZGUgPT0gMzQgJiYgZXZlbnRbXCJjaGFyXCJdKSByZXR1cm4gZmFsc2U7XG4gICAgdmFyIGJhc2UgPSBrZXlOYW1lc1tldmVudC5rZXlDb2RlXSwgbmFtZSA9IGJhc2U7XG4gICAgaWYgKG5hbWUgPT0gbnVsbCB8fCBldmVudC5hbHRHcmFwaEtleSkgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChldmVudC5hbHRLZXkgJiYgYmFzZSAhPSBcIkFsdFwiKSBuYW1lID0gXCJBbHQtXCIgKyBuYW1lO1xuICAgIGlmICgoZmxpcEN0cmxDbWQgPyBldmVudC5tZXRhS2V5IDogZXZlbnQuY3RybEtleSkgJiYgYmFzZSAhPSBcIkN0cmxcIikgbmFtZSA9IFwiQ3RybC1cIiArIG5hbWU7XG4gICAgaWYgKChmbGlwQ3RybENtZCA/IGV2ZW50LmN0cmxLZXkgOiBldmVudC5tZXRhS2V5KSAmJiBiYXNlICE9IFwiQ21kXCIpIG5hbWUgPSBcIkNtZC1cIiArIG5hbWU7XG4gICAgaWYgKCFub1NoaWZ0ICYmIGV2ZW50LnNoaWZ0S2V5ICYmIGJhc2UgIT0gXCJTaGlmdFwiKSBuYW1lID0gXCJTaGlmdC1cIiArIG5hbWU7XG4gICAgcmV0dXJuIG5hbWU7XG4gIH07XG5cbiAgZnVuY3Rpb24gZ2V0S2V5TWFwKHZhbCkge1xuICAgIHJldHVybiB0eXBlb2YgdmFsID09IFwic3RyaW5nXCIgPyBrZXlNYXBbdmFsXSA6IHZhbDtcbiAgfVxuXG4gIC8vIEZST01URVhUQVJFQVxuXG4gIENvZGVNaXJyb3IuZnJvbVRleHRBcmVhID0gZnVuY3Rpb24odGV4dGFyZWEsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyA/IGNvcHlPYmoob3B0aW9ucykgOiB7fTtcbiAgICBvcHRpb25zLnZhbHVlID0gdGV4dGFyZWEudmFsdWU7XG4gICAgaWYgKCFvcHRpb25zLnRhYmluZGV4ICYmIHRleHRhcmVhLnRhYkluZGV4KVxuICAgICAgb3B0aW9ucy50YWJpbmRleCA9IHRleHRhcmVhLnRhYkluZGV4O1xuICAgIGlmICghb3B0aW9ucy5wbGFjZWhvbGRlciAmJiB0ZXh0YXJlYS5wbGFjZWhvbGRlcilcbiAgICAgIG9wdGlvbnMucGxhY2Vob2xkZXIgPSB0ZXh0YXJlYS5wbGFjZWhvbGRlcjtcbiAgICAvLyBTZXQgYXV0b2ZvY3VzIHRvIHRydWUgaWYgdGhpcyB0ZXh0YXJlYSBpcyBmb2N1c2VkLCBvciBpZiBpdCBoYXNcbiAgICAvLyBhdXRvZm9jdXMgYW5kIG5vIG90aGVyIGVsZW1lbnQgaXMgZm9jdXNlZC5cbiAgICBpZiAob3B0aW9ucy5hdXRvZm9jdXMgPT0gbnVsbCkge1xuICAgICAgdmFyIGhhc0ZvY3VzID0gYWN0aXZlRWx0KCk7XG4gICAgICBvcHRpb25zLmF1dG9mb2N1cyA9IGhhc0ZvY3VzID09IHRleHRhcmVhIHx8XG4gICAgICAgIHRleHRhcmVhLmdldEF0dHJpYnV0ZShcImF1dG9mb2N1c1wiKSAhPSBudWxsICYmIGhhc0ZvY3VzID09IGRvY3VtZW50LmJvZHk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2F2ZSgpIHt0ZXh0YXJlYS52YWx1ZSA9IGNtLmdldFZhbHVlKCk7fVxuICAgIGlmICh0ZXh0YXJlYS5mb3JtKSB7XG4gICAgICBvbih0ZXh0YXJlYS5mb3JtLCBcInN1Ym1pdFwiLCBzYXZlKTtcbiAgICAgIC8vIERlcGxvcmFibGUgaGFjayB0byBtYWtlIHRoZSBzdWJtaXQgbWV0aG9kIGRvIHRoZSByaWdodCB0aGluZy5cbiAgICAgIGlmICghb3B0aW9ucy5sZWF2ZVN1Ym1pdE1ldGhvZEFsb25lKSB7XG4gICAgICAgIHZhciBmb3JtID0gdGV4dGFyZWEuZm9ybSwgcmVhbFN1Ym1pdCA9IGZvcm0uc3VibWl0O1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHZhciB3cmFwcGVkU3VibWl0ID0gZm9ybS5zdWJtaXQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHNhdmUoKTtcbiAgICAgICAgICAgIGZvcm0uc3VibWl0ID0gcmVhbFN1Ym1pdDtcbiAgICAgICAgICAgIGZvcm0uc3VibWl0KCk7XG4gICAgICAgICAgICBmb3JtLnN1Ym1pdCA9IHdyYXBwZWRTdWJtaXQ7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSBjYXRjaChlKSB7fVxuICAgICAgfVxuICAgIH1cblxuICAgIG9wdGlvbnMuZmluaXNoSW5pdCA9IGZ1bmN0aW9uKGNtKSB7XG4gICAgICBjbS5zYXZlID0gc2F2ZTtcbiAgICAgIGNtLmdldFRleHRBcmVhID0gZnVuY3Rpb24oKSB7IHJldHVybiB0ZXh0YXJlYTsgfTtcbiAgICAgIGNtLnRvVGV4dEFyZWEgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgY20udG9UZXh0QXJlYSA9IGlzTmFOOyAvLyBQcmV2ZW50IHRoaXMgZnJvbSBiZWluZyByYW4gdHdpY2VcbiAgICAgICAgc2F2ZSgpO1xuICAgICAgICB0ZXh0YXJlYS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGNtLmdldFdyYXBwZXJFbGVtZW50KCkpO1xuICAgICAgICB0ZXh0YXJlYS5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcbiAgICAgICAgaWYgKHRleHRhcmVhLmZvcm0pIHtcbiAgICAgICAgICBvZmYodGV4dGFyZWEuZm9ybSwgXCJzdWJtaXRcIiwgc2F2ZSk7XG4gICAgICAgICAgaWYgKHR5cGVvZiB0ZXh0YXJlYS5mb3JtLnN1Ym1pdCA9PSBcImZ1bmN0aW9uXCIpXG4gICAgICAgICAgICB0ZXh0YXJlYS5mb3JtLnN1Ym1pdCA9IHJlYWxTdWJtaXQ7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfTtcblxuICAgIHRleHRhcmVhLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICB2YXIgY20gPSBDb2RlTWlycm9yKGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgIHRleHRhcmVhLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKG5vZGUsIHRleHRhcmVhLm5leHRTaWJsaW5nKTtcbiAgICB9LCBvcHRpb25zKTtcbiAgICByZXR1cm4gY207XG4gIH07XG5cbiAgLy8gU1RSSU5HIFNUUkVBTVxuXG4gIC8vIEZlZCB0byB0aGUgbW9kZSBwYXJzZXJzLCBwcm92aWRlcyBoZWxwZXIgZnVuY3Rpb25zIHRvIG1ha2VcbiAgLy8gcGFyc2VycyBtb3JlIHN1Y2NpbmN0LlxuXG4gIHZhciBTdHJpbmdTdHJlYW0gPSBDb2RlTWlycm9yLlN0cmluZ1N0cmVhbSA9IGZ1bmN0aW9uKHN0cmluZywgdGFiU2l6ZSkge1xuICAgIHRoaXMucG9zID0gdGhpcy5zdGFydCA9IDA7XG4gICAgdGhpcy5zdHJpbmcgPSBzdHJpbmc7XG4gICAgdGhpcy50YWJTaXplID0gdGFiU2l6ZSB8fCA4O1xuICAgIHRoaXMubGFzdENvbHVtblBvcyA9IHRoaXMubGFzdENvbHVtblZhbHVlID0gMDtcbiAgICB0aGlzLmxpbmVTdGFydCA9IDA7XG4gIH07XG5cbiAgU3RyaW5nU3RyZWFtLnByb3RvdHlwZSA9IHtcbiAgICBlb2w6IGZ1bmN0aW9uKCkge3JldHVybiB0aGlzLnBvcyA+PSB0aGlzLnN0cmluZy5sZW5ndGg7fSxcbiAgICBzb2w6IGZ1bmN0aW9uKCkge3JldHVybiB0aGlzLnBvcyA9PSB0aGlzLmxpbmVTdGFydDt9LFxuICAgIHBlZWs6IGZ1bmN0aW9uKCkge3JldHVybiB0aGlzLnN0cmluZy5jaGFyQXQodGhpcy5wb3MpIHx8IHVuZGVmaW5lZDt9LFxuICAgIG5leHQ6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHRoaXMucG9zIDwgdGhpcy5zdHJpbmcubGVuZ3RoKVxuICAgICAgICByZXR1cm4gdGhpcy5zdHJpbmcuY2hhckF0KHRoaXMucG9zKyspO1xuICAgIH0sXG4gICAgZWF0OiBmdW5jdGlvbihtYXRjaCkge1xuICAgICAgdmFyIGNoID0gdGhpcy5zdHJpbmcuY2hhckF0KHRoaXMucG9zKTtcbiAgICAgIGlmICh0eXBlb2YgbWF0Y2ggPT0gXCJzdHJpbmdcIikgdmFyIG9rID0gY2ggPT0gbWF0Y2g7XG4gICAgICBlbHNlIHZhciBvayA9IGNoICYmIChtYXRjaC50ZXN0ID8gbWF0Y2gudGVzdChjaCkgOiBtYXRjaChjaCkpO1xuICAgICAgaWYgKG9rKSB7Kyt0aGlzLnBvczsgcmV0dXJuIGNoO31cbiAgICB9LFxuICAgIGVhdFdoaWxlOiBmdW5jdGlvbihtYXRjaCkge1xuICAgICAgdmFyIHN0YXJ0ID0gdGhpcy5wb3M7XG4gICAgICB3aGlsZSAodGhpcy5lYXQobWF0Y2gpKXt9XG4gICAgICByZXR1cm4gdGhpcy5wb3MgPiBzdGFydDtcbiAgICB9LFxuICAgIGVhdFNwYWNlOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBzdGFydCA9IHRoaXMucG9zO1xuICAgICAgd2hpbGUgKC9bXFxzXFx1MDBhMF0vLnRlc3QodGhpcy5zdHJpbmcuY2hhckF0KHRoaXMucG9zKSkpICsrdGhpcy5wb3M7XG4gICAgICByZXR1cm4gdGhpcy5wb3MgPiBzdGFydDtcbiAgICB9LFxuICAgIHNraXBUb0VuZDogZnVuY3Rpb24oKSB7dGhpcy5wb3MgPSB0aGlzLnN0cmluZy5sZW5ndGg7fSxcbiAgICBza2lwVG86IGZ1bmN0aW9uKGNoKSB7XG4gICAgICB2YXIgZm91bmQgPSB0aGlzLnN0cmluZy5pbmRleE9mKGNoLCB0aGlzLnBvcyk7XG4gICAgICBpZiAoZm91bmQgPiAtMSkge3RoaXMucG9zID0gZm91bmQ7IHJldHVybiB0cnVlO31cbiAgICB9LFxuICAgIGJhY2tVcDogZnVuY3Rpb24obikge3RoaXMucG9zIC09IG47fSxcbiAgICBjb2x1bW46IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHRoaXMubGFzdENvbHVtblBvcyA8IHRoaXMuc3RhcnQpIHtcbiAgICAgICAgdGhpcy5sYXN0Q29sdW1uVmFsdWUgPSBjb3VudENvbHVtbih0aGlzLnN0cmluZywgdGhpcy5zdGFydCwgdGhpcy50YWJTaXplLCB0aGlzLmxhc3RDb2x1bW5Qb3MsIHRoaXMubGFzdENvbHVtblZhbHVlKTtcbiAgICAgICAgdGhpcy5sYXN0Q29sdW1uUG9zID0gdGhpcy5zdGFydDtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLmxhc3RDb2x1bW5WYWx1ZSAtICh0aGlzLmxpbmVTdGFydCA/IGNvdW50Q29sdW1uKHRoaXMuc3RyaW5nLCB0aGlzLmxpbmVTdGFydCwgdGhpcy50YWJTaXplKSA6IDApO1xuICAgIH0sXG4gICAgaW5kZW50YXRpb246IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGNvdW50Q29sdW1uKHRoaXMuc3RyaW5nLCBudWxsLCB0aGlzLnRhYlNpemUpIC1cbiAgICAgICAgKHRoaXMubGluZVN0YXJ0ID8gY291bnRDb2x1bW4odGhpcy5zdHJpbmcsIHRoaXMubGluZVN0YXJ0LCB0aGlzLnRhYlNpemUpIDogMCk7XG4gICAgfSxcbiAgICBtYXRjaDogZnVuY3Rpb24ocGF0dGVybiwgY29uc3VtZSwgY2FzZUluc2Vuc2l0aXZlKSB7XG4gICAgICBpZiAodHlwZW9mIHBhdHRlcm4gPT0gXCJzdHJpbmdcIikge1xuICAgICAgICB2YXIgY2FzZWQgPSBmdW5jdGlvbihzdHIpIHtyZXR1cm4gY2FzZUluc2Vuc2l0aXZlID8gc3RyLnRvTG93ZXJDYXNlKCkgOiBzdHI7fTtcbiAgICAgICAgdmFyIHN1YnN0ciA9IHRoaXMuc3RyaW5nLnN1YnN0cih0aGlzLnBvcywgcGF0dGVybi5sZW5ndGgpO1xuICAgICAgICBpZiAoY2FzZWQoc3Vic3RyKSA9PSBjYXNlZChwYXR0ZXJuKSkge1xuICAgICAgICAgIGlmIChjb25zdW1lICE9PSBmYWxzZSkgdGhpcy5wb3MgKz0gcGF0dGVybi5sZW5ndGg7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBtYXRjaCA9IHRoaXMuc3RyaW5nLnNsaWNlKHRoaXMucG9zKS5tYXRjaChwYXR0ZXJuKTtcbiAgICAgICAgaWYgKG1hdGNoICYmIG1hdGNoLmluZGV4ID4gMCkgcmV0dXJuIG51bGw7XG4gICAgICAgIGlmIChtYXRjaCAmJiBjb25zdW1lICE9PSBmYWxzZSkgdGhpcy5wb3MgKz0gbWF0Y2hbMF0ubGVuZ3RoO1xuICAgICAgICByZXR1cm4gbWF0Y2g7XG4gICAgICB9XG4gICAgfSxcbiAgICBjdXJyZW50OiBmdW5jdGlvbigpe3JldHVybiB0aGlzLnN0cmluZy5zbGljZSh0aGlzLnN0YXJ0LCB0aGlzLnBvcyk7fSxcbiAgICBoaWRlRmlyc3RDaGFyczogZnVuY3Rpb24obiwgaW5uZXIpIHtcbiAgICAgIHRoaXMubGluZVN0YXJ0ICs9IG47XG4gICAgICB0cnkgeyByZXR1cm4gaW5uZXIoKTsgfVxuICAgICAgZmluYWxseSB7IHRoaXMubGluZVN0YXJ0IC09IG47IH1cbiAgICB9XG4gIH07XG5cbiAgLy8gVEVYVE1BUktFUlNcblxuICAvLyBDcmVhdGVkIHdpdGggbWFya1RleHQgYW5kIHNldEJvb2ttYXJrIG1ldGhvZHMuIEEgVGV4dE1hcmtlciBpcyBhXG4gIC8vIGhhbmRsZSB0aGF0IGNhbiBiZSB1c2VkIHRvIGNsZWFyIG9yIGZpbmQgYSBtYXJrZWQgcG9zaXRpb24gaW4gdGhlXG4gIC8vIGRvY3VtZW50LiBMaW5lIG9iamVjdHMgaG9sZCBhcnJheXMgKG1hcmtlZFNwYW5zKSBjb250YWluaW5nXG4gIC8vIHtmcm9tLCB0bywgbWFya2VyfSBvYmplY3QgcG9pbnRpbmcgdG8gc3VjaCBtYXJrZXIgb2JqZWN0cywgYW5kXG4gIC8vIGluZGljYXRpbmcgdGhhdCBzdWNoIGEgbWFya2VyIGlzIHByZXNlbnQgb24gdGhhdCBsaW5lLiBNdWx0aXBsZVxuICAvLyBsaW5lcyBtYXkgcG9pbnQgdG8gdGhlIHNhbWUgbWFya2VyIHdoZW4gaXQgc3BhbnMgYWNyb3NzIGxpbmVzLlxuICAvLyBUaGUgc3BhbnMgd2lsbCBoYXZlIG51bGwgZm9yIHRoZWlyIGZyb20vdG8gcHJvcGVydGllcyB3aGVuIHRoZVxuICAvLyBtYXJrZXIgY29udGludWVzIGJleW9uZCB0aGUgc3RhcnQvZW5kIG9mIHRoZSBsaW5lLiBNYXJrZXJzIGhhdmVcbiAgLy8gbGlua3MgYmFjayB0byB0aGUgbGluZXMgdGhleSBjdXJyZW50bHkgdG91Y2guXG5cbiAgdmFyIG5leHRNYXJrZXJJZCA9IDA7XG5cbiAgdmFyIFRleHRNYXJrZXIgPSBDb2RlTWlycm9yLlRleHRNYXJrZXIgPSBmdW5jdGlvbihkb2MsIHR5cGUpIHtcbiAgICB0aGlzLmxpbmVzID0gW107XG4gICAgdGhpcy50eXBlID0gdHlwZTtcbiAgICB0aGlzLmRvYyA9IGRvYztcbiAgICB0aGlzLmlkID0gKytuZXh0TWFya2VySWQ7XG4gIH07XG4gIGV2ZW50TWl4aW4oVGV4dE1hcmtlcik7XG5cbiAgLy8gQ2xlYXIgdGhlIG1hcmtlci5cbiAgVGV4dE1hcmtlci5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5leHBsaWNpdGx5Q2xlYXJlZCkgcmV0dXJuO1xuICAgIHZhciBjbSA9IHRoaXMuZG9jLmNtLCB3aXRoT3AgPSBjbSAmJiAhY20uY3VyT3A7XG4gICAgaWYgKHdpdGhPcCkgc3RhcnRPcGVyYXRpb24oY20pO1xuICAgIGlmIChoYXNIYW5kbGVyKHRoaXMsIFwiY2xlYXJcIikpIHtcbiAgICAgIHZhciBmb3VuZCA9IHRoaXMuZmluZCgpO1xuICAgICAgaWYgKGZvdW5kKSBzaWduYWxMYXRlcih0aGlzLCBcImNsZWFyXCIsIGZvdW5kLmZyb20sIGZvdW5kLnRvKTtcbiAgICB9XG4gICAgdmFyIG1pbiA9IG51bGwsIG1heCA9IG51bGw7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxpbmVzLmxlbmd0aDsgKytpKSB7XG4gICAgICB2YXIgbGluZSA9IHRoaXMubGluZXNbaV07XG4gICAgICB2YXIgc3BhbiA9IGdldE1hcmtlZFNwYW5Gb3IobGluZS5tYXJrZWRTcGFucywgdGhpcyk7XG4gICAgICBpZiAoY20gJiYgIXRoaXMuY29sbGFwc2VkKSByZWdMaW5lQ2hhbmdlKGNtLCBsaW5lTm8obGluZSksIFwidGV4dFwiKTtcbiAgICAgIGVsc2UgaWYgKGNtKSB7XG4gICAgICAgIGlmIChzcGFuLnRvICE9IG51bGwpIG1heCA9IGxpbmVObyhsaW5lKTtcbiAgICAgICAgaWYgKHNwYW4uZnJvbSAhPSBudWxsKSBtaW4gPSBsaW5lTm8obGluZSk7XG4gICAgICB9XG4gICAgICBsaW5lLm1hcmtlZFNwYW5zID0gcmVtb3ZlTWFya2VkU3BhbihsaW5lLm1hcmtlZFNwYW5zLCBzcGFuKTtcbiAgICAgIGlmIChzcGFuLmZyb20gPT0gbnVsbCAmJiB0aGlzLmNvbGxhcHNlZCAmJiAhbGluZUlzSGlkZGVuKHRoaXMuZG9jLCBsaW5lKSAmJiBjbSlcbiAgICAgICAgdXBkYXRlTGluZUhlaWdodChsaW5lLCB0ZXh0SGVpZ2h0KGNtLmRpc3BsYXkpKTtcbiAgICB9XG4gICAgaWYgKGNtICYmIHRoaXMuY29sbGFwc2VkICYmICFjbS5vcHRpb25zLmxpbmVXcmFwcGluZykgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxpbmVzLmxlbmd0aDsgKytpKSB7XG4gICAgICB2YXIgdmlzdWFsID0gdmlzdWFsTGluZSh0aGlzLmxpbmVzW2ldKSwgbGVuID0gbGluZUxlbmd0aCh2aXN1YWwpO1xuICAgICAgaWYgKGxlbiA+IGNtLmRpc3BsYXkubWF4TGluZUxlbmd0aCkge1xuICAgICAgICBjbS5kaXNwbGF5Lm1heExpbmUgPSB2aXN1YWw7XG4gICAgICAgIGNtLmRpc3BsYXkubWF4TGluZUxlbmd0aCA9IGxlbjtcbiAgICAgICAgY20uZGlzcGxheS5tYXhMaW5lQ2hhbmdlZCA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG1pbiAhPSBudWxsICYmIGNtICYmIHRoaXMuY29sbGFwc2VkKSByZWdDaGFuZ2UoY20sIG1pbiwgbWF4ICsgMSk7XG4gICAgdGhpcy5saW5lcy5sZW5ndGggPSAwO1xuICAgIHRoaXMuZXhwbGljaXRseUNsZWFyZWQgPSB0cnVlO1xuICAgIGlmICh0aGlzLmF0b21pYyAmJiB0aGlzLmRvYy5jYW50RWRpdCkge1xuICAgICAgdGhpcy5kb2MuY2FudEVkaXQgPSBmYWxzZTtcbiAgICAgIGlmIChjbSkgcmVDaGVja1NlbGVjdGlvbihjbS5kb2MpO1xuICAgIH1cbiAgICBpZiAoY20pIHNpZ25hbExhdGVyKGNtLCBcIm1hcmtlckNsZWFyZWRcIiwgY20sIHRoaXMpO1xuICAgIGlmICh3aXRoT3ApIGVuZE9wZXJhdGlvbihjbSk7XG4gICAgaWYgKHRoaXMucGFyZW50KSB0aGlzLnBhcmVudC5jbGVhcigpO1xuICB9O1xuXG4gIC8vIEZpbmQgdGhlIHBvc2l0aW9uIG9mIHRoZSBtYXJrZXIgaW4gdGhlIGRvY3VtZW50LiBSZXR1cm5zIGEge2Zyb20sXG4gIC8vIHRvfSBvYmplY3QgYnkgZGVmYXVsdC4gU2lkZSBjYW4gYmUgcGFzc2VkIHRvIGdldCBhIHNwZWNpZmljIHNpZGVcbiAgLy8gLS0gMCAoYm90aCksIC0xIChsZWZ0KSwgb3IgMSAocmlnaHQpLiBXaGVuIGxpbmVPYmogaXMgdHJ1ZSwgdGhlXG4gIC8vIFBvcyBvYmplY3RzIHJldHVybmVkIGNvbnRhaW4gYSBsaW5lIG9iamVjdCwgcmF0aGVyIHRoYW4gYSBsaW5lXG4gIC8vIG51bWJlciAodXNlZCB0byBwcmV2ZW50IGxvb2tpbmcgdXAgdGhlIHNhbWUgbGluZSB0d2ljZSkuXG4gIFRleHRNYXJrZXIucHJvdG90eXBlLmZpbmQgPSBmdW5jdGlvbihzaWRlLCBsaW5lT2JqKSB7XG4gICAgaWYgKHNpZGUgPT0gbnVsbCAmJiB0aGlzLnR5cGUgPT0gXCJib29rbWFya1wiKSBzaWRlID0gMTtcbiAgICB2YXIgZnJvbSwgdG87XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxpbmVzLmxlbmd0aDsgKytpKSB7XG4gICAgICB2YXIgbGluZSA9IHRoaXMubGluZXNbaV07XG4gICAgICB2YXIgc3BhbiA9IGdldE1hcmtlZFNwYW5Gb3IobGluZS5tYXJrZWRTcGFucywgdGhpcyk7XG4gICAgICBpZiAoc3Bhbi5mcm9tICE9IG51bGwpIHtcbiAgICAgICAgZnJvbSA9IFBvcyhsaW5lT2JqID8gbGluZSA6IGxpbmVObyhsaW5lKSwgc3Bhbi5mcm9tKTtcbiAgICAgICAgaWYgKHNpZGUgPT0gLTEpIHJldHVybiBmcm9tO1xuICAgICAgfVxuICAgICAgaWYgKHNwYW4udG8gIT0gbnVsbCkge1xuICAgICAgICB0byA9IFBvcyhsaW5lT2JqID8gbGluZSA6IGxpbmVObyhsaW5lKSwgc3Bhbi50byk7XG4gICAgICAgIGlmIChzaWRlID09IDEpIHJldHVybiB0bztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZyb20gJiYge2Zyb206IGZyb20sIHRvOiB0b307XG4gIH07XG5cbiAgLy8gU2lnbmFscyB0aGF0IHRoZSBtYXJrZXIncyB3aWRnZXQgY2hhbmdlZCwgYW5kIHN1cnJvdW5kaW5nIGxheW91dFxuICAvLyBzaG91bGQgYmUgcmVjb21wdXRlZC5cbiAgVGV4dE1hcmtlci5wcm90b3R5cGUuY2hhbmdlZCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBwb3MgPSB0aGlzLmZpbmQoLTEsIHRydWUpLCB3aWRnZXQgPSB0aGlzLCBjbSA9IHRoaXMuZG9jLmNtO1xuICAgIGlmICghcG9zIHx8ICFjbSkgcmV0dXJuO1xuICAgIHJ1bkluT3AoY20sIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGxpbmUgPSBwb3MubGluZSwgbGluZU4gPSBsaW5lTm8ocG9zLmxpbmUpO1xuICAgICAgdmFyIHZpZXcgPSBmaW5kVmlld0ZvckxpbmUoY20sIGxpbmVOKTtcbiAgICAgIGlmICh2aWV3KSB7XG4gICAgICAgIGNsZWFyTGluZU1lYXN1cmVtZW50Q2FjaGVGb3Iodmlldyk7XG4gICAgICAgIGNtLmN1ck9wLnNlbGVjdGlvbkNoYW5nZWQgPSBjbS5jdXJPcC5mb3JjZVVwZGF0ZSA9IHRydWU7XG4gICAgICB9XG4gICAgICBjbS5jdXJPcC51cGRhdGVNYXhMaW5lID0gdHJ1ZTtcbiAgICAgIGlmICghbGluZUlzSGlkZGVuKHdpZGdldC5kb2MsIGxpbmUpICYmIHdpZGdldC5oZWlnaHQgIT0gbnVsbCkge1xuICAgICAgICB2YXIgb2xkSGVpZ2h0ID0gd2lkZ2V0LmhlaWdodDtcbiAgICAgICAgd2lkZ2V0LmhlaWdodCA9IG51bGw7XG4gICAgICAgIHZhciBkSGVpZ2h0ID0gd2lkZ2V0SGVpZ2h0KHdpZGdldCkgLSBvbGRIZWlnaHQ7XG4gICAgICAgIGlmIChkSGVpZ2h0KVxuICAgICAgICAgIHVwZGF0ZUxpbmVIZWlnaHQobGluZSwgbGluZS5oZWlnaHQgKyBkSGVpZ2h0KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcblxuICBUZXh0TWFya2VyLnByb3RvdHlwZS5hdHRhY2hMaW5lID0gZnVuY3Rpb24obGluZSkge1xuICAgIGlmICghdGhpcy5saW5lcy5sZW5ndGggJiYgdGhpcy5kb2MuY20pIHtcbiAgICAgIHZhciBvcCA9IHRoaXMuZG9jLmNtLmN1ck9wO1xuICAgICAgaWYgKCFvcC5tYXliZUhpZGRlbk1hcmtlcnMgfHwgaW5kZXhPZihvcC5tYXliZUhpZGRlbk1hcmtlcnMsIHRoaXMpID09IC0xKVxuICAgICAgICAob3AubWF5YmVVbmhpZGRlbk1hcmtlcnMgfHwgKG9wLm1heWJlVW5oaWRkZW5NYXJrZXJzID0gW10pKS5wdXNoKHRoaXMpO1xuICAgIH1cbiAgICB0aGlzLmxpbmVzLnB1c2gobGluZSk7XG4gIH07XG4gIFRleHRNYXJrZXIucHJvdG90eXBlLmRldGFjaExpbmUgPSBmdW5jdGlvbihsaW5lKSB7XG4gICAgdGhpcy5saW5lcy5zcGxpY2UoaW5kZXhPZih0aGlzLmxpbmVzLCBsaW5lKSwgMSk7XG4gICAgaWYgKCF0aGlzLmxpbmVzLmxlbmd0aCAmJiB0aGlzLmRvYy5jbSkge1xuICAgICAgdmFyIG9wID0gdGhpcy5kb2MuY20uY3VyT3A7XG4gICAgICAob3AubWF5YmVIaWRkZW5NYXJrZXJzIHx8IChvcC5tYXliZUhpZGRlbk1hcmtlcnMgPSBbXSkpLnB1c2godGhpcyk7XG4gICAgfVxuICB9O1xuXG4gIC8vIENvbGxhcHNlZCBtYXJrZXJzIGhhdmUgdW5pcXVlIGlkcywgaW4gb3JkZXIgdG8gYmUgYWJsZSB0byBvcmRlclxuICAvLyB0aGVtLCB3aGljaCBpcyBuZWVkZWQgZm9yIHVuaXF1ZWx5IGRldGVybWluaW5nIGFuIG91dGVyIG1hcmtlclxuICAvLyB3aGVuIHRoZXkgb3ZlcmxhcCAodGhleSBtYXkgbmVzdCwgYnV0IG5vdCBwYXJ0aWFsbHkgb3ZlcmxhcCkuXG4gIHZhciBuZXh0TWFya2VySWQgPSAwO1xuXG4gIC8vIENyZWF0ZSBhIG1hcmtlciwgd2lyZSBpdCB1cCB0byB0aGUgcmlnaHQgbGluZXMsIGFuZFxuICBmdW5jdGlvbiBtYXJrVGV4dChkb2MsIGZyb20sIHRvLCBvcHRpb25zLCB0eXBlKSB7XG4gICAgLy8gU2hhcmVkIG1hcmtlcnMgKGFjcm9zcyBsaW5rZWQgZG9jdW1lbnRzKSBhcmUgaGFuZGxlZCBzZXBhcmF0ZWx5XG4gICAgLy8gKG1hcmtUZXh0U2hhcmVkIHdpbGwgY2FsbCBvdXQgdG8gdGhpcyBhZ2Fpbiwgb25jZSBwZXJcbiAgICAvLyBkb2N1bWVudCkuXG4gICAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5zaGFyZWQpIHJldHVybiBtYXJrVGV4dFNoYXJlZChkb2MsIGZyb20sIHRvLCBvcHRpb25zLCB0eXBlKTtcbiAgICAvLyBFbnN1cmUgd2UgYXJlIGluIGFuIG9wZXJhdGlvbi5cbiAgICBpZiAoZG9jLmNtICYmICFkb2MuY20uY3VyT3ApIHJldHVybiBvcGVyYXRpb24oZG9jLmNtLCBtYXJrVGV4dCkoZG9jLCBmcm9tLCB0bywgb3B0aW9ucywgdHlwZSk7XG5cbiAgICB2YXIgbWFya2VyID0gbmV3IFRleHRNYXJrZXIoZG9jLCB0eXBlKSwgZGlmZiA9IGNtcChmcm9tLCB0byk7XG4gICAgaWYgKG9wdGlvbnMpIGNvcHlPYmoob3B0aW9ucywgbWFya2VyLCBmYWxzZSk7XG4gICAgLy8gRG9uJ3QgY29ubmVjdCBlbXB0eSBtYXJrZXJzIHVubGVzcyBjbGVhcldoZW5FbXB0eSBpcyBmYWxzZVxuICAgIGlmIChkaWZmID4gMCB8fCBkaWZmID09IDAgJiYgbWFya2VyLmNsZWFyV2hlbkVtcHR5ICE9PSBmYWxzZSlcbiAgICAgIHJldHVybiBtYXJrZXI7XG4gICAgaWYgKG1hcmtlci5yZXBsYWNlZFdpdGgpIHtcbiAgICAgIC8vIFNob3dpbmcgdXAgYXMgYSB3aWRnZXQgaW1wbGllcyBjb2xsYXBzZWQgKHdpZGdldCByZXBsYWNlcyB0ZXh0KVxuICAgICAgbWFya2VyLmNvbGxhcHNlZCA9IHRydWU7XG4gICAgICBtYXJrZXIud2lkZ2V0Tm9kZSA9IGVsdChcInNwYW5cIiwgW21hcmtlci5yZXBsYWNlZFdpdGhdLCBcIkNvZGVNaXJyb3Itd2lkZ2V0XCIpO1xuICAgICAgaWYgKCFvcHRpb25zLmhhbmRsZU1vdXNlRXZlbnRzKSBtYXJrZXIud2lkZ2V0Tm9kZS5zZXRBdHRyaWJ1dGUoXCJjbS1pZ25vcmUtZXZlbnRzXCIsIFwidHJ1ZVwiKTtcbiAgICAgIGlmIChvcHRpb25zLmluc2VydExlZnQpIG1hcmtlci53aWRnZXROb2RlLmluc2VydExlZnQgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAobWFya2VyLmNvbGxhcHNlZCkge1xuICAgICAgaWYgKGNvbmZsaWN0aW5nQ29sbGFwc2VkUmFuZ2UoZG9jLCBmcm9tLmxpbmUsIGZyb20sIHRvLCBtYXJrZXIpIHx8XG4gICAgICAgICAgZnJvbS5saW5lICE9IHRvLmxpbmUgJiYgY29uZmxpY3RpbmdDb2xsYXBzZWRSYW5nZShkb2MsIHRvLmxpbmUsIGZyb20sIHRvLCBtYXJrZXIpKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnNlcnRpbmcgY29sbGFwc2VkIG1hcmtlciBwYXJ0aWFsbHkgb3ZlcmxhcHBpbmcgYW4gZXhpc3Rpbmcgb25lXCIpO1xuICAgICAgc2F3Q29sbGFwc2VkU3BhbnMgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmIChtYXJrZXIuYWRkVG9IaXN0b3J5KVxuICAgICAgYWRkQ2hhbmdlVG9IaXN0b3J5KGRvYywge2Zyb206IGZyb20sIHRvOiB0bywgb3JpZ2luOiBcIm1hcmtUZXh0XCJ9LCBkb2Muc2VsLCBOYU4pO1xuXG4gICAgdmFyIGN1ckxpbmUgPSBmcm9tLmxpbmUsIGNtID0gZG9jLmNtLCB1cGRhdGVNYXhMaW5lO1xuICAgIGRvYy5pdGVyKGN1ckxpbmUsIHRvLmxpbmUgKyAxLCBmdW5jdGlvbihsaW5lKSB7XG4gICAgICBpZiAoY20gJiYgbWFya2VyLmNvbGxhcHNlZCAmJiAhY20ub3B0aW9ucy5saW5lV3JhcHBpbmcgJiYgdmlzdWFsTGluZShsaW5lKSA9PSBjbS5kaXNwbGF5Lm1heExpbmUpXG4gICAgICAgIHVwZGF0ZU1heExpbmUgPSB0cnVlO1xuICAgICAgaWYgKG1hcmtlci5jb2xsYXBzZWQgJiYgY3VyTGluZSAhPSBmcm9tLmxpbmUpIHVwZGF0ZUxpbmVIZWlnaHQobGluZSwgMCk7XG4gICAgICBhZGRNYXJrZWRTcGFuKGxpbmUsIG5ldyBNYXJrZWRTcGFuKG1hcmtlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VyTGluZSA9PSBmcm9tLmxpbmUgPyBmcm9tLmNoIDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VyTGluZSA9PSB0by5saW5lID8gdG8uY2ggOiBudWxsKSk7XG4gICAgICArK2N1ckxpbmU7XG4gICAgfSk7XG4gICAgLy8gbGluZUlzSGlkZGVuIGRlcGVuZHMgb24gdGhlIHByZXNlbmNlIG9mIHRoZSBzcGFucywgc28gbmVlZHMgYSBzZWNvbmQgcGFzc1xuICAgIGlmIChtYXJrZXIuY29sbGFwc2VkKSBkb2MuaXRlcihmcm9tLmxpbmUsIHRvLmxpbmUgKyAxLCBmdW5jdGlvbihsaW5lKSB7XG4gICAgICBpZiAobGluZUlzSGlkZGVuKGRvYywgbGluZSkpIHVwZGF0ZUxpbmVIZWlnaHQobGluZSwgMCk7XG4gICAgfSk7XG5cbiAgICBpZiAobWFya2VyLmNsZWFyT25FbnRlcikgb24obWFya2VyLCBcImJlZm9yZUN1cnNvckVudGVyXCIsIGZ1bmN0aW9uKCkgeyBtYXJrZXIuY2xlYXIoKTsgfSk7XG5cbiAgICBpZiAobWFya2VyLnJlYWRPbmx5KSB7XG4gICAgICBzYXdSZWFkT25seVNwYW5zID0gdHJ1ZTtcbiAgICAgIGlmIChkb2MuaGlzdG9yeS5kb25lLmxlbmd0aCB8fCBkb2MuaGlzdG9yeS51bmRvbmUubGVuZ3RoKVxuICAgICAgICBkb2MuY2xlYXJIaXN0b3J5KCk7XG4gICAgfVxuICAgIGlmIChtYXJrZXIuY29sbGFwc2VkKSB7XG4gICAgICBtYXJrZXIuaWQgPSArK25leHRNYXJrZXJJZDtcbiAgICAgIG1hcmtlci5hdG9taWMgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAoY20pIHtcbiAgICAgIC8vIFN5bmMgZWRpdG9yIHN0YXRlXG4gICAgICBpZiAodXBkYXRlTWF4TGluZSkgY20uY3VyT3AudXBkYXRlTWF4TGluZSA9IHRydWU7XG4gICAgICBpZiAobWFya2VyLmNvbGxhcHNlZClcbiAgICAgICAgcmVnQ2hhbmdlKGNtLCBmcm9tLmxpbmUsIHRvLmxpbmUgKyAxKTtcbiAgICAgIGVsc2UgaWYgKG1hcmtlci5jbGFzc05hbWUgfHwgbWFya2VyLnRpdGxlIHx8IG1hcmtlci5zdGFydFN0eWxlIHx8IG1hcmtlci5lbmRTdHlsZSB8fCBtYXJrZXIuY3NzKVxuICAgICAgICBmb3IgKHZhciBpID0gZnJvbS5saW5lOyBpIDw9IHRvLmxpbmU7IGkrKykgcmVnTGluZUNoYW5nZShjbSwgaSwgXCJ0ZXh0XCIpO1xuICAgICAgaWYgKG1hcmtlci5hdG9taWMpIHJlQ2hlY2tTZWxlY3Rpb24oY20uZG9jKTtcbiAgICAgIHNpZ25hbExhdGVyKGNtLCBcIm1hcmtlckFkZGVkXCIsIGNtLCBtYXJrZXIpO1xuICAgIH1cbiAgICByZXR1cm4gbWFya2VyO1xuICB9XG5cbiAgLy8gU0hBUkVEIFRFWFRNQVJLRVJTXG5cbiAgLy8gQSBzaGFyZWQgbWFya2VyIHNwYW5zIG11bHRpcGxlIGxpbmtlZCBkb2N1bWVudHMuIEl0IGlzXG4gIC8vIGltcGxlbWVudGVkIGFzIGEgbWV0YS1tYXJrZXItb2JqZWN0IGNvbnRyb2xsaW5nIG11bHRpcGxlIG5vcm1hbFxuICAvLyBtYXJrZXJzLlxuICB2YXIgU2hhcmVkVGV4dE1hcmtlciA9IENvZGVNaXJyb3IuU2hhcmVkVGV4dE1hcmtlciA9IGZ1bmN0aW9uKG1hcmtlcnMsIHByaW1hcnkpIHtcbiAgICB0aGlzLm1hcmtlcnMgPSBtYXJrZXJzO1xuICAgIHRoaXMucHJpbWFyeSA9IHByaW1hcnk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtYXJrZXJzLmxlbmd0aDsgKytpKVxuICAgICAgbWFya2Vyc1tpXS5wYXJlbnQgPSB0aGlzO1xuICB9O1xuICBldmVudE1peGluKFNoYXJlZFRleHRNYXJrZXIpO1xuXG4gIFNoYXJlZFRleHRNYXJrZXIucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuZXhwbGljaXRseUNsZWFyZWQpIHJldHVybjtcbiAgICB0aGlzLmV4cGxpY2l0bHlDbGVhcmVkID0gdHJ1ZTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubWFya2Vycy5sZW5ndGg7ICsraSlcbiAgICAgIHRoaXMubWFya2Vyc1tpXS5jbGVhcigpO1xuICAgIHNpZ25hbExhdGVyKHRoaXMsIFwiY2xlYXJcIik7XG4gIH07XG4gIFNoYXJlZFRleHRNYXJrZXIucHJvdG90eXBlLmZpbmQgPSBmdW5jdGlvbihzaWRlLCBsaW5lT2JqKSB7XG4gICAgcmV0dXJuIHRoaXMucHJpbWFyeS5maW5kKHNpZGUsIGxpbmVPYmopO1xuICB9O1xuXG4gIGZ1bmN0aW9uIG1hcmtUZXh0U2hhcmVkKGRvYywgZnJvbSwgdG8sIG9wdGlvbnMsIHR5cGUpIHtcbiAgICBvcHRpb25zID0gY29weU9iaihvcHRpb25zKTtcbiAgICBvcHRpb25zLnNoYXJlZCA9IGZhbHNlO1xuICAgIHZhciBtYXJrZXJzID0gW21hcmtUZXh0KGRvYywgZnJvbSwgdG8sIG9wdGlvbnMsIHR5cGUpXSwgcHJpbWFyeSA9IG1hcmtlcnNbMF07XG4gICAgdmFyIHdpZGdldCA9IG9wdGlvbnMud2lkZ2V0Tm9kZTtcbiAgICBsaW5rZWREb2NzKGRvYywgZnVuY3Rpb24oZG9jKSB7XG4gICAgICBpZiAod2lkZ2V0KSBvcHRpb25zLndpZGdldE5vZGUgPSB3aWRnZXQuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgbWFya2Vycy5wdXNoKG1hcmtUZXh0KGRvYywgY2xpcFBvcyhkb2MsIGZyb20pLCBjbGlwUG9zKGRvYywgdG8pLCBvcHRpb25zLCB0eXBlKSk7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRvYy5saW5rZWQubGVuZ3RoOyArK2kpXG4gICAgICAgIGlmIChkb2MubGlua2VkW2ldLmlzUGFyZW50KSByZXR1cm47XG4gICAgICBwcmltYXJ5ID0gbHN0KG1hcmtlcnMpO1xuICAgIH0pO1xuICAgIHJldHVybiBuZXcgU2hhcmVkVGV4dE1hcmtlcihtYXJrZXJzLCBwcmltYXJ5KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbmRTaGFyZWRNYXJrZXJzKGRvYykge1xuICAgIHJldHVybiBkb2MuZmluZE1hcmtzKFBvcyhkb2MuZmlyc3QsIDApLCBkb2MuY2xpcFBvcyhQb3MoZG9jLmxhc3RMaW5lKCkpKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbihtKSB7IHJldHVybiBtLnBhcmVudDsgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBjb3B5U2hhcmVkTWFya2Vycyhkb2MsIG1hcmtlcnMpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1hcmtlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBtYXJrZXIgPSBtYXJrZXJzW2ldLCBwb3MgPSBtYXJrZXIuZmluZCgpO1xuICAgICAgdmFyIG1Gcm9tID0gZG9jLmNsaXBQb3MocG9zLmZyb20pLCBtVG8gPSBkb2MuY2xpcFBvcyhwb3MudG8pO1xuICAgICAgaWYgKGNtcChtRnJvbSwgbVRvKSkge1xuICAgICAgICB2YXIgc3ViTWFyayA9IG1hcmtUZXh0KGRvYywgbUZyb20sIG1UbywgbWFya2VyLnByaW1hcnksIG1hcmtlci5wcmltYXJ5LnR5cGUpO1xuICAgICAgICBtYXJrZXIubWFya2Vycy5wdXNoKHN1Yk1hcmspO1xuICAgICAgICBzdWJNYXJrLnBhcmVudCA9IG1hcmtlcjtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBkZXRhY2hTaGFyZWRNYXJrZXJzKG1hcmtlcnMpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1hcmtlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBtYXJrZXIgPSBtYXJrZXJzW2ldLCBsaW5rZWQgPSBbbWFya2VyLnByaW1hcnkuZG9jXTs7XG4gICAgICBsaW5rZWREb2NzKG1hcmtlci5wcmltYXJ5LmRvYywgZnVuY3Rpb24oZCkgeyBsaW5rZWQucHVzaChkKTsgfSk7XG4gICAgICBmb3IgKHZhciBqID0gMDsgaiA8IG1hcmtlci5tYXJrZXJzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIHZhciBzdWJNYXJrZXIgPSBtYXJrZXIubWFya2Vyc1tqXTtcbiAgICAgICAgaWYgKGluZGV4T2YobGlua2VkLCBzdWJNYXJrZXIuZG9jKSA9PSAtMSkge1xuICAgICAgICAgIHN1Yk1hcmtlci5wYXJlbnQgPSBudWxsO1xuICAgICAgICAgIG1hcmtlci5tYXJrZXJzLnNwbGljZShqLS0sIDEpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gVEVYVE1BUktFUiBTUEFOU1xuXG4gIGZ1bmN0aW9uIE1hcmtlZFNwYW4obWFya2VyLCBmcm9tLCB0bykge1xuICAgIHRoaXMubWFya2VyID0gbWFya2VyO1xuICAgIHRoaXMuZnJvbSA9IGZyb207IHRoaXMudG8gPSB0bztcbiAgfVxuXG4gIC8vIFNlYXJjaCBhbiBhcnJheSBvZiBzcGFucyBmb3IgYSBzcGFuIG1hdGNoaW5nIHRoZSBnaXZlbiBtYXJrZXIuXG4gIGZ1bmN0aW9uIGdldE1hcmtlZFNwYW5Gb3Ioc3BhbnMsIG1hcmtlcikge1xuICAgIGlmIChzcGFucykgZm9yICh2YXIgaSA9IDA7IGkgPCBzcGFucy5sZW5ndGg7ICsraSkge1xuICAgICAgdmFyIHNwYW4gPSBzcGFuc1tpXTtcbiAgICAgIGlmIChzcGFuLm1hcmtlciA9PSBtYXJrZXIpIHJldHVybiBzcGFuO1xuICAgIH1cbiAgfVxuICAvLyBSZW1vdmUgYSBzcGFuIGZyb20gYW4gYXJyYXksIHJldHVybmluZyB1bmRlZmluZWQgaWYgbm8gc3BhbnMgYXJlXG4gIC8vIGxlZnQgKHdlIGRvbid0IHN0b3JlIGFycmF5cyBmb3IgbGluZXMgd2l0aG91dCBzcGFucykuXG4gIGZ1bmN0aW9uIHJlbW92ZU1hcmtlZFNwYW4oc3BhbnMsIHNwYW4pIHtcbiAgICBmb3IgKHZhciByLCBpID0gMDsgaSA8IHNwYW5zLmxlbmd0aDsgKytpKVxuICAgICAgaWYgKHNwYW5zW2ldICE9IHNwYW4pIChyIHx8IChyID0gW10pKS5wdXNoKHNwYW5zW2ldKTtcbiAgICByZXR1cm4gcjtcbiAgfVxuICAvLyBBZGQgYSBzcGFuIHRvIGEgbGluZS5cbiAgZnVuY3Rpb24gYWRkTWFya2VkU3BhbihsaW5lLCBzcGFuKSB7XG4gICAgbGluZS5tYXJrZWRTcGFucyA9IGxpbmUubWFya2VkU3BhbnMgPyBsaW5lLm1hcmtlZFNwYW5zLmNvbmNhdChbc3Bhbl0pIDogW3NwYW5dO1xuICAgIHNwYW4ubWFya2VyLmF0dGFjaExpbmUobGluZSk7XG4gIH1cblxuICAvLyBVc2VkIGZvciB0aGUgYWxnb3JpdGhtIHRoYXQgYWRqdXN0cyBtYXJrZXJzIGZvciBhIGNoYW5nZSBpbiB0aGVcbiAgLy8gZG9jdW1lbnQuIFRoZXNlIGZ1bmN0aW9ucyBjdXQgYW4gYXJyYXkgb2Ygc3BhbnMgYXQgYSBnaXZlblxuICAvLyBjaGFyYWN0ZXIgcG9zaXRpb24sIHJldHVybmluZyBhbiBhcnJheSBvZiByZW1haW5pbmcgY2h1bmtzIChvclxuICAvLyB1bmRlZmluZWQgaWYgbm90aGluZyByZW1haW5zKS5cbiAgZnVuY3Rpb24gbWFya2VkU3BhbnNCZWZvcmUob2xkLCBzdGFydENoLCBpc0luc2VydCkge1xuICAgIGlmIChvbGQpIGZvciAodmFyIGkgPSAwLCBudzsgaSA8IG9sZC5sZW5ndGg7ICsraSkge1xuICAgICAgdmFyIHNwYW4gPSBvbGRbaV0sIG1hcmtlciA9IHNwYW4ubWFya2VyO1xuICAgICAgdmFyIHN0YXJ0c0JlZm9yZSA9IHNwYW4uZnJvbSA9PSBudWxsIHx8IChtYXJrZXIuaW5jbHVzaXZlTGVmdCA/IHNwYW4uZnJvbSA8PSBzdGFydENoIDogc3Bhbi5mcm9tIDwgc3RhcnRDaCk7XG4gICAgICBpZiAoc3RhcnRzQmVmb3JlIHx8IHNwYW4uZnJvbSA9PSBzdGFydENoICYmIG1hcmtlci50eXBlID09IFwiYm9va21hcmtcIiAmJiAoIWlzSW5zZXJ0IHx8ICFzcGFuLm1hcmtlci5pbnNlcnRMZWZ0KSkge1xuICAgICAgICB2YXIgZW5kc0FmdGVyID0gc3Bhbi50byA9PSBudWxsIHx8IChtYXJrZXIuaW5jbHVzaXZlUmlnaHQgPyBzcGFuLnRvID49IHN0YXJ0Q2ggOiBzcGFuLnRvID4gc3RhcnRDaCk7XG4gICAgICAgIChudyB8fCAobncgPSBbXSkpLnB1c2gobmV3IE1hcmtlZFNwYW4obWFya2VyLCBzcGFuLmZyb20sIGVuZHNBZnRlciA/IG51bGwgOiBzcGFuLnRvKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudztcbiAgfVxuICBmdW5jdGlvbiBtYXJrZWRTcGFuc0FmdGVyKG9sZCwgZW5kQ2gsIGlzSW5zZXJ0KSB7XG4gICAgaWYgKG9sZCkgZm9yICh2YXIgaSA9IDAsIG53OyBpIDwgb2xkLmxlbmd0aDsgKytpKSB7XG4gICAgICB2YXIgc3BhbiA9IG9sZFtpXSwgbWFya2VyID0gc3Bhbi5tYXJrZXI7XG4gICAgICB2YXIgZW5kc0FmdGVyID0gc3Bhbi50byA9PSBudWxsIHx8IChtYXJrZXIuaW5jbHVzaXZlUmlnaHQgPyBzcGFuLnRvID49IGVuZENoIDogc3Bhbi50byA+IGVuZENoKTtcbiAgICAgIGlmIChlbmRzQWZ0ZXIgfHwgc3Bhbi5mcm9tID09IGVuZENoICYmIG1hcmtlci50eXBlID09IFwiYm9va21hcmtcIiAmJiAoIWlzSW5zZXJ0IHx8IHNwYW4ubWFya2VyLmluc2VydExlZnQpKSB7XG4gICAgICAgIHZhciBzdGFydHNCZWZvcmUgPSBzcGFuLmZyb20gPT0gbnVsbCB8fCAobWFya2VyLmluY2x1c2l2ZUxlZnQgPyBzcGFuLmZyb20gPD0gZW5kQ2ggOiBzcGFuLmZyb20gPCBlbmRDaCk7XG4gICAgICAgIChudyB8fCAobncgPSBbXSkpLnB1c2gobmV3IE1hcmtlZFNwYW4obWFya2VyLCBzdGFydHNCZWZvcmUgPyBudWxsIDogc3Bhbi5mcm9tIC0gZW5kQ2gsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3Bhbi50byA9PSBudWxsID8gbnVsbCA6IHNwYW4udG8gLSBlbmRDaCkpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnc7XG4gIH1cblxuICAvLyBHaXZlbiBhIGNoYW5nZSBvYmplY3QsIGNvbXB1dGUgdGhlIG5ldyBzZXQgb2YgbWFya2VyIHNwYW5zIHRoYXRcbiAgLy8gY292ZXIgdGhlIGxpbmUgaW4gd2hpY2ggdGhlIGNoYW5nZSB0b29rIHBsYWNlLiBSZW1vdmVzIHNwYW5zXG4gIC8vIGVudGlyZWx5IHdpdGhpbiB0aGUgY2hhbmdlLCByZWNvbm5lY3RzIHNwYW5zIGJlbG9uZ2luZyB0byB0aGVcbiAgLy8gc2FtZSBtYXJrZXIgdGhhdCBhcHBlYXIgb24gYm90aCBzaWRlcyBvZiB0aGUgY2hhbmdlLCBhbmQgY3V0cyBvZmZcbiAgLy8gc3BhbnMgcGFydGlhbGx5IHdpdGhpbiB0aGUgY2hhbmdlLiBSZXR1cm5zIGFuIGFycmF5IG9mIHNwYW5cbiAgLy8gYXJyYXlzIHdpdGggb25lIGVsZW1lbnQgZm9yIGVhY2ggbGluZSBpbiAoYWZ0ZXIpIHRoZSBjaGFuZ2UuXG4gIGZ1bmN0aW9uIHN0cmV0Y2hTcGFuc092ZXJDaGFuZ2UoZG9jLCBjaGFuZ2UpIHtcbiAgICBpZiAoY2hhbmdlLmZ1bGwpIHJldHVybiBudWxsO1xuICAgIHZhciBvbGRGaXJzdCA9IGlzTGluZShkb2MsIGNoYW5nZS5mcm9tLmxpbmUpICYmIGdldExpbmUoZG9jLCBjaGFuZ2UuZnJvbS5saW5lKS5tYXJrZWRTcGFucztcbiAgICB2YXIgb2xkTGFzdCA9IGlzTGluZShkb2MsIGNoYW5nZS50by5saW5lKSAmJiBnZXRMaW5lKGRvYywgY2hhbmdlLnRvLmxpbmUpLm1hcmtlZFNwYW5zO1xuICAgIGlmICghb2xkRmlyc3QgJiYgIW9sZExhc3QpIHJldHVybiBudWxsO1xuXG4gICAgdmFyIHN0YXJ0Q2ggPSBjaGFuZ2UuZnJvbS5jaCwgZW5kQ2ggPSBjaGFuZ2UudG8uY2gsIGlzSW5zZXJ0ID0gY21wKGNoYW5nZS5mcm9tLCBjaGFuZ2UudG8pID09IDA7XG4gICAgLy8gR2V0IHRoZSBzcGFucyB0aGF0ICdzdGljayBvdXQnIG9uIGJvdGggc2lkZXNcbiAgICB2YXIgZmlyc3QgPSBtYXJrZWRTcGFuc0JlZm9yZShvbGRGaXJzdCwgc3RhcnRDaCwgaXNJbnNlcnQpO1xuICAgIHZhciBsYXN0ID0gbWFya2VkU3BhbnNBZnRlcihvbGRMYXN0LCBlbmRDaCwgaXNJbnNlcnQpO1xuXG4gICAgLy8gTmV4dCwgbWVyZ2UgdGhvc2UgdHdvIGVuZHNcbiAgICB2YXIgc2FtZUxpbmUgPSBjaGFuZ2UudGV4dC5sZW5ndGggPT0gMSwgb2Zmc2V0ID0gbHN0KGNoYW5nZS50ZXh0KS5sZW5ndGggKyAoc2FtZUxpbmUgPyBzdGFydENoIDogMCk7XG4gICAgaWYgKGZpcnN0KSB7XG4gICAgICAvLyBGaXggdXAgLnRvIHByb3BlcnRpZXMgb2YgZmlyc3RcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZmlyc3QubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIHNwYW4gPSBmaXJzdFtpXTtcbiAgICAgICAgaWYgKHNwYW4udG8gPT0gbnVsbCkge1xuICAgICAgICAgIHZhciBmb3VuZCA9IGdldE1hcmtlZFNwYW5Gb3IobGFzdCwgc3Bhbi5tYXJrZXIpO1xuICAgICAgICAgIGlmICghZm91bmQpIHNwYW4udG8gPSBzdGFydENoO1xuICAgICAgICAgIGVsc2UgaWYgKHNhbWVMaW5lKSBzcGFuLnRvID0gZm91bmQudG8gPT0gbnVsbCA/IG51bGwgOiBmb3VuZC50byArIG9mZnNldDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAobGFzdCkge1xuICAgICAgLy8gRml4IHVwIC5mcm9tIGluIGxhc3QgKG9yIG1vdmUgdGhlbSBpbnRvIGZpcnN0IGluIGNhc2Ugb2Ygc2FtZUxpbmUpXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxhc3QubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIHNwYW4gPSBsYXN0W2ldO1xuICAgICAgICBpZiAoc3Bhbi50byAhPSBudWxsKSBzcGFuLnRvICs9IG9mZnNldDtcbiAgICAgICAgaWYgKHNwYW4uZnJvbSA9PSBudWxsKSB7XG4gICAgICAgICAgdmFyIGZvdW5kID0gZ2V0TWFya2VkU3BhbkZvcihmaXJzdCwgc3Bhbi5tYXJrZXIpO1xuICAgICAgICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgICAgIHNwYW4uZnJvbSA9IG9mZnNldDtcbiAgICAgICAgICAgIGlmIChzYW1lTGluZSkgKGZpcnN0IHx8IChmaXJzdCA9IFtdKSkucHVzaChzcGFuKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3Bhbi5mcm9tICs9IG9mZnNldDtcbiAgICAgICAgICBpZiAoc2FtZUxpbmUpIChmaXJzdCB8fCAoZmlyc3QgPSBbXSkpLnB1c2goc3Bhbik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgLy8gTWFrZSBzdXJlIHdlIGRpZG4ndCBjcmVhdGUgYW55IHplcm8tbGVuZ3RoIHNwYW5zXG4gICAgaWYgKGZpcnN0KSBmaXJzdCA9IGNsZWFyRW1wdHlTcGFucyhmaXJzdCk7XG4gICAgaWYgKGxhc3QgJiYgbGFzdCAhPSBmaXJzdCkgbGFzdCA9IGNsZWFyRW1wdHlTcGFucyhsYXN0KTtcblxuICAgIHZhciBuZXdNYXJrZXJzID0gW2ZpcnN0XTtcbiAgICBpZiAoIXNhbWVMaW5lKSB7XG4gICAgICAvLyBGaWxsIGdhcCB3aXRoIHdob2xlLWxpbmUtc3BhbnNcbiAgICAgIHZhciBnYXAgPSBjaGFuZ2UudGV4dC5sZW5ndGggLSAyLCBnYXBNYXJrZXJzO1xuICAgICAgaWYgKGdhcCA+IDAgJiYgZmlyc3QpXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZmlyc3QubGVuZ3RoOyArK2kpXG4gICAgICAgICAgaWYgKGZpcnN0W2ldLnRvID09IG51bGwpXG4gICAgICAgICAgICAoZ2FwTWFya2VycyB8fCAoZ2FwTWFya2VycyA9IFtdKSkucHVzaChuZXcgTWFya2VkU3BhbihmaXJzdFtpXS5tYXJrZXIsIG51bGwsIG51bGwpKTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZ2FwOyArK2kpXG4gICAgICAgIG5ld01hcmtlcnMucHVzaChnYXBNYXJrZXJzKTtcbiAgICAgIG5ld01hcmtlcnMucHVzaChsYXN0KTtcbiAgICB9XG4gICAgcmV0dXJuIG5ld01hcmtlcnM7XG4gIH1cblxuICAvLyBSZW1vdmUgc3BhbnMgdGhhdCBhcmUgZW1wdHkgYW5kIGRvbid0IGhhdmUgYSBjbGVhcldoZW5FbXB0eVxuICAvLyBvcHRpb24gb2YgZmFsc2UuXG4gIGZ1bmN0aW9uIGNsZWFyRW1wdHlTcGFucyhzcGFucykge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3BhbnMubGVuZ3RoOyArK2kpIHtcbiAgICAgIHZhciBzcGFuID0gc3BhbnNbaV07XG4gICAgICBpZiAoc3Bhbi5mcm9tICE9IG51bGwgJiYgc3Bhbi5mcm9tID09IHNwYW4udG8gJiYgc3Bhbi5tYXJrZXIuY2xlYXJXaGVuRW1wdHkgIT09IGZhbHNlKVxuICAgICAgICBzcGFucy5zcGxpY2UoaS0tLCAxKTtcbiAgICB9XG4gICAgaWYgKCFzcGFucy5sZW5ndGgpIHJldHVybiBudWxsO1xuICAgIHJldHVybiBzcGFucztcbiAgfVxuXG4gIC8vIFVzZWQgZm9yIHVuL3JlLWRvaW5nIGNoYW5nZXMgZnJvbSB0aGUgaGlzdG9yeS4gQ29tYmluZXMgdGhlXG4gIC8vIHJlc3VsdCBvZiBjb21wdXRpbmcgdGhlIGV4aXN0aW5nIHNwYW5zIHdpdGggdGhlIHNldCBvZiBzcGFucyB0aGF0XG4gIC8vIGV4aXN0ZWQgaW4gdGhlIGhpc3RvcnkgKHNvIHRoYXQgZGVsZXRpbmcgYXJvdW5kIGEgc3BhbiBhbmQgdGhlblxuICAvLyB1bmRvaW5nIGJyaW5ncyBiYWNrIHRoZSBzcGFuKS5cbiAgZnVuY3Rpb24gbWVyZ2VPbGRTcGFucyhkb2MsIGNoYW5nZSkge1xuICAgIHZhciBvbGQgPSBnZXRPbGRTcGFucyhkb2MsIGNoYW5nZSk7XG4gICAgdmFyIHN0cmV0Y2hlZCA9IHN0cmV0Y2hTcGFuc092ZXJDaGFuZ2UoZG9jLCBjaGFuZ2UpO1xuICAgIGlmICghb2xkKSByZXR1cm4gc3RyZXRjaGVkO1xuICAgIGlmICghc3RyZXRjaGVkKSByZXR1cm4gb2xkO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvbGQubGVuZ3RoOyArK2kpIHtcbiAgICAgIHZhciBvbGRDdXIgPSBvbGRbaV0sIHN0cmV0Y2hDdXIgPSBzdHJldGNoZWRbaV07XG4gICAgICBpZiAob2xkQ3VyICYmIHN0cmV0Y2hDdXIpIHtcbiAgICAgICAgc3BhbnM6IGZvciAodmFyIGogPSAwOyBqIDwgc3RyZXRjaEN1ci5sZW5ndGg7ICsraikge1xuICAgICAgICAgIHZhciBzcGFuID0gc3RyZXRjaEN1cltqXTtcbiAgICAgICAgICBmb3IgKHZhciBrID0gMDsgayA8IG9sZEN1ci5sZW5ndGg7ICsraylcbiAgICAgICAgICAgIGlmIChvbGRDdXJba10ubWFya2VyID09IHNwYW4ubWFya2VyKSBjb250aW51ZSBzcGFucztcbiAgICAgICAgICBvbGRDdXIucHVzaChzcGFuKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChzdHJldGNoQ3VyKSB7XG4gICAgICAgIG9sZFtpXSA9IHN0cmV0Y2hDdXI7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvbGQ7XG4gIH1cblxuICAvLyBVc2VkIHRvICdjbGlwJyBvdXQgcmVhZE9ubHkgcmFuZ2VzIHdoZW4gbWFraW5nIGEgY2hhbmdlLlxuICBmdW5jdGlvbiByZW1vdmVSZWFkT25seVJhbmdlcyhkb2MsIGZyb20sIHRvKSB7XG4gICAgdmFyIG1hcmtlcnMgPSBudWxsO1xuICAgIGRvYy5pdGVyKGZyb20ubGluZSwgdG8ubGluZSArIDEsIGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgIGlmIChsaW5lLm1hcmtlZFNwYW5zKSBmb3IgKHZhciBpID0gMDsgaSA8IGxpbmUubWFya2VkU3BhbnMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIG1hcmsgPSBsaW5lLm1hcmtlZFNwYW5zW2ldLm1hcmtlcjtcbiAgICAgICAgaWYgKG1hcmsucmVhZE9ubHkgJiYgKCFtYXJrZXJzIHx8IGluZGV4T2YobWFya2VycywgbWFyaykgPT0gLTEpKVxuICAgICAgICAgIChtYXJrZXJzIHx8IChtYXJrZXJzID0gW10pKS5wdXNoKG1hcmspO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGlmICghbWFya2VycykgcmV0dXJuIG51bGw7XG4gICAgdmFyIHBhcnRzID0gW3tmcm9tOiBmcm9tLCB0bzogdG99XTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1hcmtlcnMubGVuZ3RoOyArK2kpIHtcbiAgICAgIHZhciBtayA9IG1hcmtlcnNbaV0sIG0gPSBtay5maW5kKDApO1xuICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBwYXJ0cy5sZW5ndGg7ICsraikge1xuICAgICAgICB2YXIgcCA9IHBhcnRzW2pdO1xuICAgICAgICBpZiAoY21wKHAudG8sIG0uZnJvbSkgPCAwIHx8IGNtcChwLmZyb20sIG0udG8pID4gMCkgY29udGludWU7XG4gICAgICAgIHZhciBuZXdQYXJ0cyA9IFtqLCAxXSwgZGZyb20gPSBjbXAocC5mcm9tLCBtLmZyb20pLCBkdG8gPSBjbXAocC50bywgbS50byk7XG4gICAgICAgIGlmIChkZnJvbSA8IDAgfHwgIW1rLmluY2x1c2l2ZUxlZnQgJiYgIWRmcm9tKVxuICAgICAgICAgIG5ld1BhcnRzLnB1c2goe2Zyb206IHAuZnJvbSwgdG86IG0uZnJvbX0pO1xuICAgICAgICBpZiAoZHRvID4gMCB8fCAhbWsuaW5jbHVzaXZlUmlnaHQgJiYgIWR0bylcbiAgICAgICAgICBuZXdQYXJ0cy5wdXNoKHtmcm9tOiBtLnRvLCB0bzogcC50b30pO1xuICAgICAgICBwYXJ0cy5zcGxpY2UuYXBwbHkocGFydHMsIG5ld1BhcnRzKTtcbiAgICAgICAgaiArPSBuZXdQYXJ0cy5sZW5ndGggLSAxO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcGFydHM7XG4gIH1cblxuICAvLyBDb25uZWN0IG9yIGRpc2Nvbm5lY3Qgc3BhbnMgZnJvbSBhIGxpbmUuXG4gIGZ1bmN0aW9uIGRldGFjaE1hcmtlZFNwYW5zKGxpbmUpIHtcbiAgICB2YXIgc3BhbnMgPSBsaW5lLm1hcmtlZFNwYW5zO1xuICAgIGlmICghc3BhbnMpIHJldHVybjtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNwYW5zLmxlbmd0aDsgKytpKVxuICAgICAgc3BhbnNbaV0ubWFya2VyLmRldGFjaExpbmUobGluZSk7XG4gICAgbGluZS5tYXJrZWRTcGFucyA9IG51bGw7XG4gIH1cbiAgZnVuY3Rpb24gYXR0YWNoTWFya2VkU3BhbnMobGluZSwgc3BhbnMpIHtcbiAgICBpZiAoIXNwYW5zKSByZXR1cm47XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzcGFucy5sZW5ndGg7ICsraSlcbiAgICAgIHNwYW5zW2ldLm1hcmtlci5hdHRhY2hMaW5lKGxpbmUpO1xuICAgIGxpbmUubWFya2VkU3BhbnMgPSBzcGFucztcbiAgfVxuXG4gIC8vIEhlbHBlcnMgdXNlZCB3aGVuIGNvbXB1dGluZyB3aGljaCBvdmVybGFwcGluZyBjb2xsYXBzZWQgc3BhblxuICAvLyBjb3VudHMgYXMgdGhlIGxhcmdlciBvbmUuXG4gIGZ1bmN0aW9uIGV4dHJhTGVmdChtYXJrZXIpIHsgcmV0dXJuIG1hcmtlci5pbmNsdXNpdmVMZWZ0ID8gLTEgOiAwOyB9XG4gIGZ1bmN0aW9uIGV4dHJhUmlnaHQobWFya2VyKSB7IHJldHVybiBtYXJrZXIuaW5jbHVzaXZlUmlnaHQgPyAxIDogMDsgfVxuXG4gIC8vIFJldHVybnMgYSBudW1iZXIgaW5kaWNhdGluZyB3aGljaCBvZiB0d28gb3ZlcmxhcHBpbmcgY29sbGFwc2VkXG4gIC8vIHNwYW5zIGlzIGxhcmdlciAoYW5kIHRodXMgaW5jbHVkZXMgdGhlIG90aGVyKS4gRmFsbHMgYmFjayB0b1xuICAvLyBjb21wYXJpbmcgaWRzIHdoZW4gdGhlIHNwYW5zIGNvdmVyIGV4YWN0bHkgdGhlIHNhbWUgcmFuZ2UuXG4gIGZ1bmN0aW9uIGNvbXBhcmVDb2xsYXBzZWRNYXJrZXJzKGEsIGIpIHtcbiAgICB2YXIgbGVuRGlmZiA9IGEubGluZXMubGVuZ3RoIC0gYi5saW5lcy5sZW5ndGg7XG4gICAgaWYgKGxlbkRpZmYgIT0gMCkgcmV0dXJuIGxlbkRpZmY7XG4gICAgdmFyIGFQb3MgPSBhLmZpbmQoKSwgYlBvcyA9IGIuZmluZCgpO1xuICAgIHZhciBmcm9tQ21wID0gY21wKGFQb3MuZnJvbSwgYlBvcy5mcm9tKSB8fCBleHRyYUxlZnQoYSkgLSBleHRyYUxlZnQoYik7XG4gICAgaWYgKGZyb21DbXApIHJldHVybiAtZnJvbUNtcDtcbiAgICB2YXIgdG9DbXAgPSBjbXAoYVBvcy50bywgYlBvcy50bykgfHwgZXh0cmFSaWdodChhKSAtIGV4dHJhUmlnaHQoYik7XG4gICAgaWYgKHRvQ21wKSByZXR1cm4gdG9DbXA7XG4gICAgcmV0dXJuIGIuaWQgLSBhLmlkO1xuICB9XG5cbiAgLy8gRmluZCBvdXQgd2hldGhlciBhIGxpbmUgZW5kcyBvciBzdGFydHMgaW4gYSBjb2xsYXBzZWQgc3Bhbi4gSWZcbiAgLy8gc28sIHJldHVybiB0aGUgbWFya2VyIGZvciB0aGF0IHNwYW4uXG4gIGZ1bmN0aW9uIGNvbGxhcHNlZFNwYW5BdFNpZGUobGluZSwgc3RhcnQpIHtcbiAgICB2YXIgc3BzID0gc2F3Q29sbGFwc2VkU3BhbnMgJiYgbGluZS5tYXJrZWRTcGFucywgZm91bmQ7XG4gICAgaWYgKHNwcykgZm9yICh2YXIgc3AsIGkgPSAwOyBpIDwgc3BzLmxlbmd0aDsgKytpKSB7XG4gICAgICBzcCA9IHNwc1tpXTtcbiAgICAgIGlmIChzcC5tYXJrZXIuY29sbGFwc2VkICYmIChzdGFydCA/IHNwLmZyb20gOiBzcC50bykgPT0gbnVsbCAmJlxuICAgICAgICAgICghZm91bmQgfHwgY29tcGFyZUNvbGxhcHNlZE1hcmtlcnMoZm91bmQsIHNwLm1hcmtlcikgPCAwKSlcbiAgICAgICAgZm91bmQgPSBzcC5tYXJrZXI7XG4gICAgfVxuICAgIHJldHVybiBmb3VuZDtcbiAgfVxuICBmdW5jdGlvbiBjb2xsYXBzZWRTcGFuQXRTdGFydChsaW5lKSB7IHJldHVybiBjb2xsYXBzZWRTcGFuQXRTaWRlKGxpbmUsIHRydWUpOyB9XG4gIGZ1bmN0aW9uIGNvbGxhcHNlZFNwYW5BdEVuZChsaW5lKSB7IHJldHVybiBjb2xsYXBzZWRTcGFuQXRTaWRlKGxpbmUsIGZhbHNlKTsgfVxuXG4gIC8vIFRlc3Qgd2hldGhlciB0aGVyZSBleGlzdHMgYSBjb2xsYXBzZWQgc3BhbiB0aGF0IHBhcnRpYWxseVxuICAvLyBvdmVybGFwcyAoY292ZXJzIHRoZSBzdGFydCBvciBlbmQsIGJ1dCBub3QgYm90aCkgb2YgYSBuZXcgc3Bhbi5cbiAgLy8gU3VjaCBvdmVybGFwIGlzIG5vdCBhbGxvd2VkLlxuICBmdW5jdGlvbiBjb25mbGljdGluZ0NvbGxhcHNlZFJhbmdlKGRvYywgbGluZU5vLCBmcm9tLCB0bywgbWFya2VyKSB7XG4gICAgdmFyIGxpbmUgPSBnZXRMaW5lKGRvYywgbGluZU5vKTtcbiAgICB2YXIgc3BzID0gc2F3Q29sbGFwc2VkU3BhbnMgJiYgbGluZS5tYXJrZWRTcGFucztcbiAgICBpZiAoc3BzKSBmb3IgKHZhciBpID0gMDsgaSA8IHNwcy5sZW5ndGg7ICsraSkge1xuICAgICAgdmFyIHNwID0gc3BzW2ldO1xuICAgICAgaWYgKCFzcC5tYXJrZXIuY29sbGFwc2VkKSBjb250aW51ZTtcbiAgICAgIHZhciBmb3VuZCA9IHNwLm1hcmtlci5maW5kKDApO1xuICAgICAgdmFyIGZyb21DbXAgPSBjbXAoZm91bmQuZnJvbSwgZnJvbSkgfHwgZXh0cmFMZWZ0KHNwLm1hcmtlcikgLSBleHRyYUxlZnQobWFya2VyKTtcbiAgICAgIHZhciB0b0NtcCA9IGNtcChmb3VuZC50bywgdG8pIHx8IGV4dHJhUmlnaHQoc3AubWFya2VyKSAtIGV4dHJhUmlnaHQobWFya2VyKTtcbiAgICAgIGlmIChmcm9tQ21wID49IDAgJiYgdG9DbXAgPD0gMCB8fCBmcm9tQ21wIDw9IDAgJiYgdG9DbXAgPj0gMCkgY29udGludWU7XG4gICAgICBpZiAoZnJvbUNtcCA8PSAwICYmIChjbXAoZm91bmQudG8sIGZyb20pID4gMCB8fCAoc3AubWFya2VyLmluY2x1c2l2ZVJpZ2h0ICYmIG1hcmtlci5pbmNsdXNpdmVMZWZ0KSkgfHxcbiAgICAgICAgICBmcm9tQ21wID49IDAgJiYgKGNtcChmb3VuZC5mcm9tLCB0bykgPCAwIHx8IChzcC5tYXJrZXIuaW5jbHVzaXZlTGVmdCAmJiBtYXJrZXIuaW5jbHVzaXZlUmlnaHQpKSlcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbiAgLy8gQSB2aXN1YWwgbGluZSBpcyBhIGxpbmUgYXMgZHJhd24gb24gdGhlIHNjcmVlbi4gRm9sZGluZywgZm9yXG4gIC8vIGV4YW1wbGUsIGNhbiBjYXVzZSBtdWx0aXBsZSBsb2dpY2FsIGxpbmVzIHRvIGFwcGVhciBvbiB0aGUgc2FtZVxuICAvLyB2aXN1YWwgbGluZS4gVGhpcyBmaW5kcyB0aGUgc3RhcnQgb2YgdGhlIHZpc3VhbCBsaW5lIHRoYXQgdGhlXG4gIC8vIGdpdmVuIGxpbmUgaXMgcGFydCBvZiAodXN1YWxseSB0aGF0IGlzIHRoZSBsaW5lIGl0c2VsZikuXG4gIGZ1bmN0aW9uIHZpc3VhbExpbmUobGluZSkge1xuICAgIHZhciBtZXJnZWQ7XG4gICAgd2hpbGUgKG1lcmdlZCA9IGNvbGxhcHNlZFNwYW5BdFN0YXJ0KGxpbmUpKVxuICAgICAgbGluZSA9IG1lcmdlZC5maW5kKC0xLCB0cnVlKS5saW5lO1xuICAgIHJldHVybiBsaW5lO1xuICB9XG5cbiAgLy8gUmV0dXJucyBhbiBhcnJheSBvZiBsb2dpY2FsIGxpbmVzIHRoYXQgY29udGludWUgdGhlIHZpc3VhbCBsaW5lXG4gIC8vIHN0YXJ0ZWQgYnkgdGhlIGFyZ3VtZW50LCBvciB1bmRlZmluZWQgaWYgdGhlcmUgYXJlIG5vIHN1Y2ggbGluZXMuXG4gIGZ1bmN0aW9uIHZpc3VhbExpbmVDb250aW51ZWQobGluZSkge1xuICAgIHZhciBtZXJnZWQsIGxpbmVzO1xuICAgIHdoaWxlIChtZXJnZWQgPSBjb2xsYXBzZWRTcGFuQXRFbmQobGluZSkpIHtcbiAgICAgIGxpbmUgPSBtZXJnZWQuZmluZCgxLCB0cnVlKS5saW5lO1xuICAgICAgKGxpbmVzIHx8IChsaW5lcyA9IFtdKSkucHVzaChsaW5lKTtcbiAgICB9XG4gICAgcmV0dXJuIGxpbmVzO1xuICB9XG5cbiAgLy8gR2V0IHRoZSBsaW5lIG51bWJlciBvZiB0aGUgc3RhcnQgb2YgdGhlIHZpc3VhbCBsaW5lIHRoYXQgdGhlXG4gIC8vIGdpdmVuIGxpbmUgbnVtYmVyIGlzIHBhcnQgb2YuXG4gIGZ1bmN0aW9uIHZpc3VhbExpbmVObyhkb2MsIGxpbmVOKSB7XG4gICAgdmFyIGxpbmUgPSBnZXRMaW5lKGRvYywgbGluZU4pLCB2aXMgPSB2aXN1YWxMaW5lKGxpbmUpO1xuICAgIGlmIChsaW5lID09IHZpcykgcmV0dXJuIGxpbmVOO1xuICAgIHJldHVybiBsaW5lTm8odmlzKTtcbiAgfVxuICAvLyBHZXQgdGhlIGxpbmUgbnVtYmVyIG9mIHRoZSBzdGFydCBvZiB0aGUgbmV4dCB2aXN1YWwgbGluZSBhZnRlclxuICAvLyB0aGUgZ2l2ZW4gbGluZS5cbiAgZnVuY3Rpb24gdmlzdWFsTGluZUVuZE5vKGRvYywgbGluZU4pIHtcbiAgICBpZiAobGluZU4gPiBkb2MubGFzdExpbmUoKSkgcmV0dXJuIGxpbmVOO1xuICAgIHZhciBsaW5lID0gZ2V0TGluZShkb2MsIGxpbmVOKSwgbWVyZ2VkO1xuICAgIGlmICghbGluZUlzSGlkZGVuKGRvYywgbGluZSkpIHJldHVybiBsaW5lTjtcbiAgICB3aGlsZSAobWVyZ2VkID0gY29sbGFwc2VkU3BhbkF0RW5kKGxpbmUpKVxuICAgICAgbGluZSA9IG1lcmdlZC5maW5kKDEsIHRydWUpLmxpbmU7XG4gICAgcmV0dXJuIGxpbmVObyhsaW5lKSArIDE7XG4gIH1cblxuICAvLyBDb21wdXRlIHdoZXRoZXIgYSBsaW5lIGlzIGhpZGRlbi4gTGluZXMgY291bnQgYXMgaGlkZGVuIHdoZW4gdGhleVxuICAvLyBhcmUgcGFydCBvZiBhIHZpc3VhbCBsaW5lIHRoYXQgc3RhcnRzIHdpdGggYW5vdGhlciBsaW5lLCBvciB3aGVuXG4gIC8vIHRoZXkgYXJlIGVudGlyZWx5IGNvdmVyZWQgYnkgY29sbGFwc2VkLCBub24td2lkZ2V0IHNwYW4uXG4gIGZ1bmN0aW9uIGxpbmVJc0hpZGRlbihkb2MsIGxpbmUpIHtcbiAgICB2YXIgc3BzID0gc2F3Q29sbGFwc2VkU3BhbnMgJiYgbGluZS5tYXJrZWRTcGFucztcbiAgICBpZiAoc3BzKSBmb3IgKHZhciBzcCwgaSA9IDA7IGkgPCBzcHMubGVuZ3RoOyArK2kpIHtcbiAgICAgIHNwID0gc3BzW2ldO1xuICAgICAgaWYgKCFzcC5tYXJrZXIuY29sbGFwc2VkKSBjb250aW51ZTtcbiAgICAgIGlmIChzcC5mcm9tID09IG51bGwpIHJldHVybiB0cnVlO1xuICAgICAgaWYgKHNwLm1hcmtlci53aWRnZXROb2RlKSBjb250aW51ZTtcbiAgICAgIGlmIChzcC5mcm9tID09IDAgJiYgc3AubWFya2VyLmluY2x1c2l2ZUxlZnQgJiYgbGluZUlzSGlkZGVuSW5uZXIoZG9jLCBsaW5lLCBzcCkpXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBsaW5lSXNIaWRkZW5Jbm5lcihkb2MsIGxpbmUsIHNwYW4pIHtcbiAgICBpZiAoc3Bhbi50byA9PSBudWxsKSB7XG4gICAgICB2YXIgZW5kID0gc3Bhbi5tYXJrZXIuZmluZCgxLCB0cnVlKTtcbiAgICAgIHJldHVybiBsaW5lSXNIaWRkZW5Jbm5lcihkb2MsIGVuZC5saW5lLCBnZXRNYXJrZWRTcGFuRm9yKGVuZC5saW5lLm1hcmtlZFNwYW5zLCBzcGFuLm1hcmtlcikpO1xuICAgIH1cbiAgICBpZiAoc3Bhbi5tYXJrZXIuaW5jbHVzaXZlUmlnaHQgJiYgc3Bhbi50byA9PSBsaW5lLnRleHQubGVuZ3RoKVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgZm9yICh2YXIgc3AsIGkgPSAwOyBpIDwgbGluZS5tYXJrZWRTcGFucy5sZW5ndGg7ICsraSkge1xuICAgICAgc3AgPSBsaW5lLm1hcmtlZFNwYW5zW2ldO1xuICAgICAgaWYgKHNwLm1hcmtlci5jb2xsYXBzZWQgJiYgIXNwLm1hcmtlci53aWRnZXROb2RlICYmIHNwLmZyb20gPT0gc3Bhbi50byAmJlxuICAgICAgICAgIChzcC50byA9PSBudWxsIHx8IHNwLnRvICE9IHNwYW4uZnJvbSkgJiZcbiAgICAgICAgICAoc3AubWFya2VyLmluY2x1c2l2ZUxlZnQgfHwgc3Bhbi5tYXJrZXIuaW5jbHVzaXZlUmlnaHQpICYmXG4gICAgICAgICAgbGluZUlzSGlkZGVuSW5uZXIoZG9jLCBsaW5lLCBzcCkpIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIC8vIExJTkUgV0lER0VUU1xuXG4gIC8vIExpbmUgd2lkZ2V0cyBhcmUgYmxvY2sgZWxlbWVudHMgZGlzcGxheWVkIGFib3ZlIG9yIGJlbG93IGEgbGluZS5cblxuICB2YXIgTGluZVdpZGdldCA9IENvZGVNaXJyb3IuTGluZVdpZGdldCA9IGZ1bmN0aW9uKGRvYywgbm9kZSwgb3B0aW9ucykge1xuICAgIGlmIChvcHRpb25zKSBmb3IgKHZhciBvcHQgaW4gb3B0aW9ucykgaWYgKG9wdGlvbnMuaGFzT3duUHJvcGVydHkob3B0KSlcbiAgICAgIHRoaXNbb3B0XSA9IG9wdGlvbnNbb3B0XTtcbiAgICB0aGlzLmRvYyA9IGRvYztcbiAgICB0aGlzLm5vZGUgPSBub2RlO1xuICB9O1xuICBldmVudE1peGluKExpbmVXaWRnZXQpO1xuXG4gIGZ1bmN0aW9uIGFkanVzdFNjcm9sbFdoZW5BYm92ZVZpc2libGUoY20sIGxpbmUsIGRpZmYpIHtcbiAgICBpZiAoaGVpZ2h0QXRMaW5lKGxpbmUpIDwgKChjbS5jdXJPcCAmJiBjbS5jdXJPcC5zY3JvbGxUb3ApIHx8IGNtLmRvYy5zY3JvbGxUb3ApKVxuICAgICAgYWRkVG9TY3JvbGxQb3MoY20sIG51bGwsIGRpZmYpO1xuICB9XG5cbiAgTGluZVdpZGdldC5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgY20gPSB0aGlzLmRvYy5jbSwgd3MgPSB0aGlzLmxpbmUud2lkZ2V0cywgbGluZSA9IHRoaXMubGluZSwgbm8gPSBsaW5lTm8obGluZSk7XG4gICAgaWYgKG5vID09IG51bGwgfHwgIXdzKSByZXR1cm47XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB3cy5sZW5ndGg7ICsraSkgaWYgKHdzW2ldID09IHRoaXMpIHdzLnNwbGljZShpLS0sIDEpO1xuICAgIGlmICghd3MubGVuZ3RoKSBsaW5lLndpZGdldHMgPSBudWxsO1xuICAgIHZhciBoZWlnaHQgPSB3aWRnZXRIZWlnaHQodGhpcyk7XG4gICAgdXBkYXRlTGluZUhlaWdodChsaW5lLCBNYXRoLm1heCgwLCBsaW5lLmhlaWdodCAtIGhlaWdodCkpO1xuICAgIGlmIChjbSkgcnVuSW5PcChjbSwgZnVuY3Rpb24oKSB7XG4gICAgICBhZGp1c3RTY3JvbGxXaGVuQWJvdmVWaXNpYmxlKGNtLCBsaW5lLCAtaGVpZ2h0KTtcbiAgICAgIHJlZ0xpbmVDaGFuZ2UoY20sIG5vLCBcIndpZGdldFwiKTtcbiAgICB9KTtcbiAgfTtcbiAgTGluZVdpZGdldC5wcm90b3R5cGUuY2hhbmdlZCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBvbGRIID0gdGhpcy5oZWlnaHQsIGNtID0gdGhpcy5kb2MuY20sIGxpbmUgPSB0aGlzLmxpbmU7XG4gICAgdGhpcy5oZWlnaHQgPSBudWxsO1xuICAgIHZhciBkaWZmID0gd2lkZ2V0SGVpZ2h0KHRoaXMpIC0gb2xkSDtcbiAgICBpZiAoIWRpZmYpIHJldHVybjtcbiAgICB1cGRhdGVMaW5lSGVpZ2h0KGxpbmUsIGxpbmUuaGVpZ2h0ICsgZGlmZik7XG4gICAgaWYgKGNtKSBydW5Jbk9wKGNtLCBmdW5jdGlvbigpIHtcbiAgICAgIGNtLmN1ck9wLmZvcmNlVXBkYXRlID0gdHJ1ZTtcbiAgICAgIGFkanVzdFNjcm9sbFdoZW5BYm92ZVZpc2libGUoY20sIGxpbmUsIGRpZmYpO1xuICAgIH0pO1xuICB9O1xuXG4gIGZ1bmN0aW9uIHdpZGdldEhlaWdodCh3aWRnZXQpIHtcbiAgICBpZiAod2lkZ2V0LmhlaWdodCAhPSBudWxsKSByZXR1cm4gd2lkZ2V0LmhlaWdodDtcbiAgICB2YXIgY20gPSB3aWRnZXQuZG9jLmNtO1xuICAgIGlmICghY20pIHJldHVybiAwO1xuICAgIGlmICghY29udGFpbnMoZG9jdW1lbnQuYm9keSwgd2lkZ2V0Lm5vZGUpKSB7XG4gICAgICB2YXIgcGFyZW50U3R5bGUgPSBcInBvc2l0aW9uOiByZWxhdGl2ZTtcIjtcbiAgICAgIGlmICh3aWRnZXQuY292ZXJHdXR0ZXIpXG4gICAgICAgIHBhcmVudFN0eWxlICs9IFwibWFyZ2luLWxlZnQ6IC1cIiArIGNtLmRpc3BsYXkuZ3V0dGVycy5vZmZzZXRXaWR0aCArIFwicHg7XCI7XG4gICAgICBpZiAod2lkZ2V0Lm5vSFNjcm9sbClcbiAgICAgICAgcGFyZW50U3R5bGUgKz0gXCJ3aWR0aDogXCIgKyBjbS5kaXNwbGF5LndyYXBwZXIuY2xpZW50V2lkdGggKyBcInB4O1wiO1xuICAgICAgcmVtb3ZlQ2hpbGRyZW5BbmRBZGQoY20uZGlzcGxheS5tZWFzdXJlLCBlbHQoXCJkaXZcIiwgW3dpZGdldC5ub2RlXSwgbnVsbCwgcGFyZW50U3R5bGUpKTtcbiAgICB9XG4gICAgcmV0dXJuIHdpZGdldC5oZWlnaHQgPSB3aWRnZXQubm9kZS5vZmZzZXRIZWlnaHQ7XG4gIH1cblxuICBmdW5jdGlvbiBhZGRMaW5lV2lkZ2V0KGRvYywgaGFuZGxlLCBub2RlLCBvcHRpb25zKSB7XG4gICAgdmFyIHdpZGdldCA9IG5ldyBMaW5lV2lkZ2V0KGRvYywgbm9kZSwgb3B0aW9ucyk7XG4gICAgdmFyIGNtID0gZG9jLmNtO1xuICAgIGlmIChjbSAmJiB3aWRnZXQubm9IU2Nyb2xsKSBjbS5kaXNwbGF5LmFsaWduV2lkZ2V0cyA9IHRydWU7XG4gICAgY2hhbmdlTGluZShkb2MsIGhhbmRsZSwgXCJ3aWRnZXRcIiwgZnVuY3Rpb24obGluZSkge1xuICAgICAgdmFyIHdpZGdldHMgPSBsaW5lLndpZGdldHMgfHwgKGxpbmUud2lkZ2V0cyA9IFtdKTtcbiAgICAgIGlmICh3aWRnZXQuaW5zZXJ0QXQgPT0gbnVsbCkgd2lkZ2V0cy5wdXNoKHdpZGdldCk7XG4gICAgICBlbHNlIHdpZGdldHMuc3BsaWNlKE1hdGgubWluKHdpZGdldHMubGVuZ3RoIC0gMSwgTWF0aC5tYXgoMCwgd2lkZ2V0Lmluc2VydEF0KSksIDAsIHdpZGdldCk7XG4gICAgICB3aWRnZXQubGluZSA9IGxpbmU7XG4gICAgICBpZiAoY20gJiYgIWxpbmVJc0hpZGRlbihkb2MsIGxpbmUpKSB7XG4gICAgICAgIHZhciBhYm92ZVZpc2libGUgPSBoZWlnaHRBdExpbmUobGluZSkgPCBkb2Muc2Nyb2xsVG9wO1xuICAgICAgICB1cGRhdGVMaW5lSGVpZ2h0KGxpbmUsIGxpbmUuaGVpZ2h0ICsgd2lkZ2V0SGVpZ2h0KHdpZGdldCkpO1xuICAgICAgICBpZiAoYWJvdmVWaXNpYmxlKSBhZGRUb1Njcm9sbFBvcyhjbSwgbnVsbCwgd2lkZ2V0LmhlaWdodCk7XG4gICAgICAgIGNtLmN1ck9wLmZvcmNlVXBkYXRlID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuICAgIHJldHVybiB3aWRnZXQ7XG4gIH1cblxuICAvLyBMSU5FIERBVEEgU1RSVUNUVVJFXG5cbiAgLy8gTGluZSBvYmplY3RzLiBUaGVzZSBob2xkIHN0YXRlIHJlbGF0ZWQgdG8gYSBsaW5lLCBpbmNsdWRpbmdcbiAgLy8gaGlnaGxpZ2h0aW5nIGluZm8gKHRoZSBzdHlsZXMgYXJyYXkpLlxuICB2YXIgTGluZSA9IENvZGVNaXJyb3IuTGluZSA9IGZ1bmN0aW9uKHRleHQsIG1hcmtlZFNwYW5zLCBlc3RpbWF0ZUhlaWdodCkge1xuICAgIHRoaXMudGV4dCA9IHRleHQ7XG4gICAgYXR0YWNoTWFya2VkU3BhbnModGhpcywgbWFya2VkU3BhbnMpO1xuICAgIHRoaXMuaGVpZ2h0ID0gZXN0aW1hdGVIZWlnaHQgPyBlc3RpbWF0ZUhlaWdodCh0aGlzKSA6IDE7XG4gIH07XG4gIGV2ZW50TWl4aW4oTGluZSk7XG4gIExpbmUucHJvdG90eXBlLmxpbmVObyA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gbGluZU5vKHRoaXMpOyB9O1xuXG4gIC8vIENoYW5nZSB0aGUgY29udGVudCAodGV4dCwgbWFya2Vycykgb2YgYSBsaW5lLiBBdXRvbWF0aWNhbGx5XG4gIC8vIGludmFsaWRhdGVzIGNhY2hlZCBpbmZvcm1hdGlvbiBhbmQgdHJpZXMgdG8gcmUtZXN0aW1hdGUgdGhlXG4gIC8vIGxpbmUncyBoZWlnaHQuXG4gIGZ1bmN0aW9uIHVwZGF0ZUxpbmUobGluZSwgdGV4dCwgbWFya2VkU3BhbnMsIGVzdGltYXRlSGVpZ2h0KSB7XG4gICAgbGluZS50ZXh0ID0gdGV4dDtcbiAgICBpZiAobGluZS5zdGF0ZUFmdGVyKSBsaW5lLnN0YXRlQWZ0ZXIgPSBudWxsO1xuICAgIGlmIChsaW5lLnN0eWxlcykgbGluZS5zdHlsZXMgPSBudWxsO1xuICAgIGlmIChsaW5lLm9yZGVyICE9IG51bGwpIGxpbmUub3JkZXIgPSBudWxsO1xuICAgIGRldGFjaE1hcmtlZFNwYW5zKGxpbmUpO1xuICAgIGF0dGFjaE1hcmtlZFNwYW5zKGxpbmUsIG1hcmtlZFNwYW5zKTtcbiAgICB2YXIgZXN0SGVpZ2h0ID0gZXN0aW1hdGVIZWlnaHQgPyBlc3RpbWF0ZUhlaWdodChsaW5lKSA6IDE7XG4gICAgaWYgKGVzdEhlaWdodCAhPSBsaW5lLmhlaWdodCkgdXBkYXRlTGluZUhlaWdodChsaW5lLCBlc3RIZWlnaHQpO1xuICB9XG5cbiAgLy8gRGV0YWNoIGEgbGluZSBmcm9tIHRoZSBkb2N1bWVudCB0cmVlIGFuZCBpdHMgbWFya2Vycy5cbiAgZnVuY3Rpb24gY2xlYW5VcExpbmUobGluZSkge1xuICAgIGxpbmUucGFyZW50ID0gbnVsbDtcbiAgICBkZXRhY2hNYXJrZWRTcGFucyhsaW5lKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGV4dHJhY3RMaW5lQ2xhc3Nlcyh0eXBlLCBvdXRwdXQpIHtcbiAgICBpZiAodHlwZSkgZm9yICg7Oykge1xuICAgICAgdmFyIGxpbmVDbGFzcyA9IHR5cGUubWF0Y2goLyg/Ol58XFxzKylsaW5lLShiYWNrZ3JvdW5kLSk/KFxcUyspLyk7XG4gICAgICBpZiAoIWxpbmVDbGFzcykgYnJlYWs7XG4gICAgICB0eXBlID0gdHlwZS5zbGljZSgwLCBsaW5lQ2xhc3MuaW5kZXgpICsgdHlwZS5zbGljZShsaW5lQ2xhc3MuaW5kZXggKyBsaW5lQ2xhc3NbMF0ubGVuZ3RoKTtcbiAgICAgIHZhciBwcm9wID0gbGluZUNsYXNzWzFdID8gXCJiZ0NsYXNzXCIgOiBcInRleHRDbGFzc1wiO1xuICAgICAgaWYgKG91dHB1dFtwcm9wXSA9PSBudWxsKVxuICAgICAgICBvdXRwdXRbcHJvcF0gPSBsaW5lQ2xhc3NbMl07XG4gICAgICBlbHNlIGlmICghKG5ldyBSZWdFeHAoXCIoPzpefFxccylcIiArIGxpbmVDbGFzc1syXSArIFwiKD86JHxcXHMpXCIpKS50ZXN0KG91dHB1dFtwcm9wXSkpXG4gICAgICAgIG91dHB1dFtwcm9wXSArPSBcIiBcIiArIGxpbmVDbGFzc1syXTtcbiAgICB9XG4gICAgcmV0dXJuIHR5cGU7XG4gIH1cblxuICBmdW5jdGlvbiBjYWxsQmxhbmtMaW5lKG1vZGUsIHN0YXRlKSB7XG4gICAgaWYgKG1vZGUuYmxhbmtMaW5lKSByZXR1cm4gbW9kZS5ibGFua0xpbmUoc3RhdGUpO1xuICAgIGlmICghbW9kZS5pbm5lck1vZGUpIHJldHVybjtcbiAgICB2YXIgaW5uZXIgPSBDb2RlTWlycm9yLmlubmVyTW9kZShtb2RlLCBzdGF0ZSk7XG4gICAgaWYgKGlubmVyLm1vZGUuYmxhbmtMaW5lKSByZXR1cm4gaW5uZXIubW9kZS5ibGFua0xpbmUoaW5uZXIuc3RhdGUpO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVhZFRva2VuKG1vZGUsIHN0cmVhbSwgc3RhdGUsIGlubmVyKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCAxMDsgaSsrKSB7XG4gICAgICBpZiAoaW5uZXIpIGlubmVyWzBdID0gQ29kZU1pcnJvci5pbm5lck1vZGUobW9kZSwgc3RhdGUpLm1vZGU7XG4gICAgICB2YXIgc3R5bGUgPSBtb2RlLnRva2VuKHN0cmVhbSwgc3RhdGUpO1xuICAgICAgaWYgKHN0cmVhbS5wb3MgPiBzdHJlYW0uc3RhcnQpIHJldHVybiBzdHlsZTtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiTW9kZSBcIiArIG1vZGUubmFtZSArIFwiIGZhaWxlZCB0byBhZHZhbmNlIHN0cmVhbS5cIik7XG4gIH1cblxuICAvLyBVdGlsaXR5IGZvciBnZXRUb2tlbkF0IGFuZCBnZXRMaW5lVG9rZW5zXG4gIGZ1bmN0aW9uIHRha2VUb2tlbihjbSwgcG9zLCBwcmVjaXNlLCBhc0FycmF5KSB7XG4gICAgZnVuY3Rpb24gZ2V0T2JqKGNvcHkpIHtcbiAgICAgIHJldHVybiB7c3RhcnQ6IHN0cmVhbS5zdGFydCwgZW5kOiBzdHJlYW0ucG9zLFxuICAgICAgICAgICAgICBzdHJpbmc6IHN0cmVhbS5jdXJyZW50KCksXG4gICAgICAgICAgICAgIHR5cGU6IHN0eWxlIHx8IG51bGwsXG4gICAgICAgICAgICAgIHN0YXRlOiBjb3B5ID8gY29weVN0YXRlKGRvYy5tb2RlLCBzdGF0ZSkgOiBzdGF0ZX07XG4gICAgfVxuXG4gICAgdmFyIGRvYyA9IGNtLmRvYywgbW9kZSA9IGRvYy5tb2RlLCBzdHlsZTtcbiAgICBwb3MgPSBjbGlwUG9zKGRvYywgcG9zKTtcbiAgICB2YXIgbGluZSA9IGdldExpbmUoZG9jLCBwb3MubGluZSksIHN0YXRlID0gZ2V0U3RhdGVCZWZvcmUoY20sIHBvcy5saW5lLCBwcmVjaXNlKTtcbiAgICB2YXIgc3RyZWFtID0gbmV3IFN0cmluZ1N0cmVhbShsaW5lLnRleHQsIGNtLm9wdGlvbnMudGFiU2l6ZSksIHRva2VucztcbiAgICBpZiAoYXNBcnJheSkgdG9rZW5zID0gW107XG4gICAgd2hpbGUgKChhc0FycmF5IHx8IHN0cmVhbS5wb3MgPCBwb3MuY2gpICYmICFzdHJlYW0uZW9sKCkpIHtcbiAgICAgIHN0cmVhbS5zdGFydCA9IHN0cmVhbS5wb3M7XG4gICAgICBzdHlsZSA9IHJlYWRUb2tlbihtb2RlLCBzdHJlYW0sIHN0YXRlKTtcbiAgICAgIGlmIChhc0FycmF5KSB0b2tlbnMucHVzaChnZXRPYmoodHJ1ZSkpO1xuICAgIH1cbiAgICByZXR1cm4gYXNBcnJheSA/IHRva2VucyA6IGdldE9iaigpO1xuICB9XG5cbiAgLy8gUnVuIHRoZSBnaXZlbiBtb2RlJ3MgcGFyc2VyIG92ZXIgYSBsaW5lLCBjYWxsaW5nIGYgZm9yIGVhY2ggdG9rZW4uXG4gIGZ1bmN0aW9uIHJ1bk1vZGUoY20sIHRleHQsIG1vZGUsIHN0YXRlLCBmLCBsaW5lQ2xhc3NlcywgZm9yY2VUb0VuZCkge1xuICAgIHZhciBmbGF0dGVuU3BhbnMgPSBtb2RlLmZsYXR0ZW5TcGFucztcbiAgICBpZiAoZmxhdHRlblNwYW5zID09IG51bGwpIGZsYXR0ZW5TcGFucyA9IGNtLm9wdGlvbnMuZmxhdHRlblNwYW5zO1xuICAgIHZhciBjdXJTdGFydCA9IDAsIGN1clN0eWxlID0gbnVsbDtcbiAgICB2YXIgc3RyZWFtID0gbmV3IFN0cmluZ1N0cmVhbSh0ZXh0LCBjbS5vcHRpb25zLnRhYlNpemUpLCBzdHlsZTtcbiAgICB2YXIgaW5uZXIgPSBjbS5vcHRpb25zLmFkZE1vZGVDbGFzcyAmJiBbbnVsbF07XG4gICAgaWYgKHRleHQgPT0gXCJcIikgZXh0cmFjdExpbmVDbGFzc2VzKGNhbGxCbGFua0xpbmUobW9kZSwgc3RhdGUpLCBsaW5lQ2xhc3Nlcyk7XG4gICAgd2hpbGUgKCFzdHJlYW0uZW9sKCkpIHtcbiAgICAgIGlmIChzdHJlYW0ucG9zID4gY20ub3B0aW9ucy5tYXhIaWdobGlnaHRMZW5ndGgpIHtcbiAgICAgICAgZmxhdHRlblNwYW5zID0gZmFsc2U7XG4gICAgICAgIGlmIChmb3JjZVRvRW5kKSBwcm9jZXNzTGluZShjbSwgdGV4dCwgc3RhdGUsIHN0cmVhbS5wb3MpO1xuICAgICAgICBzdHJlYW0ucG9zID0gdGV4dC5sZW5ndGg7XG4gICAgICAgIHN0eWxlID0gbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0eWxlID0gZXh0cmFjdExpbmVDbGFzc2VzKHJlYWRUb2tlbihtb2RlLCBzdHJlYW0sIHN0YXRlLCBpbm5lciksIGxpbmVDbGFzc2VzKTtcbiAgICAgIH1cbiAgICAgIGlmIChpbm5lcikge1xuICAgICAgICB2YXIgbU5hbWUgPSBpbm5lclswXS5uYW1lO1xuICAgICAgICBpZiAobU5hbWUpIHN0eWxlID0gXCJtLVwiICsgKHN0eWxlID8gbU5hbWUgKyBcIiBcIiArIHN0eWxlIDogbU5hbWUpO1xuICAgICAgfVxuICAgICAgaWYgKCFmbGF0dGVuU3BhbnMgfHwgY3VyU3R5bGUgIT0gc3R5bGUpIHtcbiAgICAgICAgd2hpbGUgKGN1clN0YXJ0IDwgc3RyZWFtLnN0YXJ0KSB7XG4gICAgICAgICAgY3VyU3RhcnQgPSBNYXRoLm1pbihzdHJlYW0uc3RhcnQsIGN1clN0YXJ0ICsgNTAwMDApO1xuICAgICAgICAgIGYoY3VyU3RhcnQsIGN1clN0eWxlKTtcbiAgICAgICAgfVxuICAgICAgICBjdXJTdHlsZSA9IHN0eWxlO1xuICAgICAgfVxuICAgICAgc3RyZWFtLnN0YXJ0ID0gc3RyZWFtLnBvcztcbiAgICB9XG4gICAgd2hpbGUgKGN1clN0YXJ0IDwgc3RyZWFtLnBvcykge1xuICAgICAgLy8gV2Via2l0IHNlZW1zIHRvIHJlZnVzZSB0byByZW5kZXIgdGV4dCBub2RlcyBsb25nZXIgdGhhbiA1NzQ0NCBjaGFyYWN0ZXJzXG4gICAgICB2YXIgcG9zID0gTWF0aC5taW4oc3RyZWFtLnBvcywgY3VyU3RhcnQgKyA1MDAwMCk7XG4gICAgICBmKHBvcywgY3VyU3R5bGUpO1xuICAgICAgY3VyU3RhcnQgPSBwb3M7XG4gICAgfVxuICB9XG5cbiAgLy8gQ29tcHV0ZSBhIHN0eWxlIGFycmF5IChhbiBhcnJheSBzdGFydGluZyB3aXRoIGEgbW9kZSBnZW5lcmF0aW9uXG4gIC8vIC0tIGZvciBpbnZhbGlkYXRpb24gLS0gZm9sbG93ZWQgYnkgcGFpcnMgb2YgZW5kIHBvc2l0aW9ucyBhbmRcbiAgLy8gc3R5bGUgc3RyaW5ncyksIHdoaWNoIGlzIHVzZWQgdG8gaGlnaGxpZ2h0IHRoZSB0b2tlbnMgb24gdGhlXG4gIC8vIGxpbmUuXG4gIGZ1bmN0aW9uIGhpZ2hsaWdodExpbmUoY20sIGxpbmUsIHN0YXRlLCBmb3JjZVRvRW5kKSB7XG4gICAgLy8gQSBzdHlsZXMgYXJyYXkgYWx3YXlzIHN0YXJ0cyB3aXRoIGEgbnVtYmVyIGlkZW50aWZ5aW5nIHRoZVxuICAgIC8vIG1vZGUvb3ZlcmxheXMgdGhhdCBpdCBpcyBiYXNlZCBvbiAoZm9yIGVhc3kgaW52YWxpZGF0aW9uKS5cbiAgICB2YXIgc3QgPSBbY20uc3RhdGUubW9kZUdlbl0sIGxpbmVDbGFzc2VzID0ge307XG4gICAgLy8gQ29tcHV0ZSB0aGUgYmFzZSBhcnJheSBvZiBzdHlsZXNcbiAgICBydW5Nb2RlKGNtLCBsaW5lLnRleHQsIGNtLmRvYy5tb2RlLCBzdGF0ZSwgZnVuY3Rpb24oZW5kLCBzdHlsZSkge1xuICAgICAgc3QucHVzaChlbmQsIHN0eWxlKTtcbiAgICB9LCBsaW5lQ2xhc3NlcywgZm9yY2VUb0VuZCk7XG5cbiAgICAvLyBSdW4gb3ZlcmxheXMsIGFkanVzdCBzdHlsZSBhcnJheS5cbiAgICBmb3IgKHZhciBvID0gMDsgbyA8IGNtLnN0YXRlLm92ZXJsYXlzLmxlbmd0aDsgKytvKSB7XG4gICAgICB2YXIgb3ZlcmxheSA9IGNtLnN0YXRlLm92ZXJsYXlzW29dLCBpID0gMSwgYXQgPSAwO1xuICAgICAgcnVuTW9kZShjbSwgbGluZS50ZXh0LCBvdmVybGF5Lm1vZGUsIHRydWUsIGZ1bmN0aW9uKGVuZCwgc3R5bGUpIHtcbiAgICAgICAgdmFyIHN0YXJ0ID0gaTtcbiAgICAgICAgLy8gRW5zdXJlIHRoZXJlJ3MgYSB0b2tlbiBlbmQgYXQgdGhlIGN1cnJlbnQgcG9zaXRpb24sIGFuZCB0aGF0IGkgcG9pbnRzIGF0IGl0XG4gICAgICAgIHdoaWxlIChhdCA8IGVuZCkge1xuICAgICAgICAgIHZhciBpX2VuZCA9IHN0W2ldO1xuICAgICAgICAgIGlmIChpX2VuZCA+IGVuZClcbiAgICAgICAgICAgIHN0LnNwbGljZShpLCAxLCBlbmQsIHN0W2krMV0sIGlfZW5kKTtcbiAgICAgICAgICBpICs9IDI7XG4gICAgICAgICAgYXQgPSBNYXRoLm1pbihlbmQsIGlfZW5kKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXN0eWxlKSByZXR1cm47XG4gICAgICAgIGlmIChvdmVybGF5Lm9wYXF1ZSkge1xuICAgICAgICAgIHN0LnNwbGljZShzdGFydCwgaSAtIHN0YXJ0LCBlbmQsIFwiY20tb3ZlcmxheSBcIiArIHN0eWxlKTtcbiAgICAgICAgICBpID0gc3RhcnQgKyAyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGZvciAoOyBzdGFydCA8IGk7IHN0YXJ0ICs9IDIpIHtcbiAgICAgICAgICAgIHZhciBjdXIgPSBzdFtzdGFydCsxXTtcbiAgICAgICAgICAgIHN0W3N0YXJ0KzFdID0gKGN1ciA/IGN1ciArIFwiIFwiIDogXCJcIikgKyBcImNtLW92ZXJsYXkgXCIgKyBzdHlsZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sIGxpbmVDbGFzc2VzKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge3N0eWxlczogc3QsIGNsYXNzZXM6IGxpbmVDbGFzc2VzLmJnQ2xhc3MgfHwgbGluZUNsYXNzZXMudGV4dENsYXNzID8gbGluZUNsYXNzZXMgOiBudWxsfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldExpbmVTdHlsZXMoY20sIGxpbmUsIHVwZGF0ZUZyb250aWVyKSB7XG4gICAgaWYgKCFsaW5lLnN0eWxlcyB8fCBsaW5lLnN0eWxlc1swXSAhPSBjbS5zdGF0ZS5tb2RlR2VuKSB7XG4gICAgICB2YXIgc3RhdGUgPSBnZXRTdGF0ZUJlZm9yZShjbSwgbGluZU5vKGxpbmUpKTtcbiAgICAgIHZhciByZXN1bHQgPSBoaWdobGlnaHRMaW5lKGNtLCBsaW5lLCBsaW5lLnRleHQubGVuZ3RoID4gY20ub3B0aW9ucy5tYXhIaWdobGlnaHRMZW5ndGggPyBjb3B5U3RhdGUoY20uZG9jLm1vZGUsIHN0YXRlKSA6IHN0YXRlKTtcbiAgICAgIGxpbmUuc3RhdGVBZnRlciA9IHN0YXRlO1xuICAgICAgbGluZS5zdHlsZXMgPSByZXN1bHQuc3R5bGVzO1xuICAgICAgaWYgKHJlc3VsdC5jbGFzc2VzKSBsaW5lLnN0eWxlQ2xhc3NlcyA9IHJlc3VsdC5jbGFzc2VzO1xuICAgICAgZWxzZSBpZiAobGluZS5zdHlsZUNsYXNzZXMpIGxpbmUuc3R5bGVDbGFzc2VzID0gbnVsbDtcbiAgICAgIGlmICh1cGRhdGVGcm9udGllciA9PT0gY20uZG9jLmZyb250aWVyKSBjbS5kb2MuZnJvbnRpZXIrKztcbiAgICB9XG4gICAgcmV0dXJuIGxpbmUuc3R5bGVzO1xuICB9XG5cbiAgLy8gTGlnaHR3ZWlnaHQgZm9ybSBvZiBoaWdobGlnaHQgLS0gcHJvY2VlZCBvdmVyIHRoaXMgbGluZSBhbmRcbiAgLy8gdXBkYXRlIHN0YXRlLCBidXQgZG9uJ3Qgc2F2ZSBhIHN0eWxlIGFycmF5LiBVc2VkIGZvciBsaW5lcyB0aGF0XG4gIC8vIGFyZW4ndCBjdXJyZW50bHkgdmlzaWJsZS5cbiAgZnVuY3Rpb24gcHJvY2Vzc0xpbmUoY20sIHRleHQsIHN0YXRlLCBzdGFydEF0KSB7XG4gICAgdmFyIG1vZGUgPSBjbS5kb2MubW9kZTtcbiAgICB2YXIgc3RyZWFtID0gbmV3IFN0cmluZ1N0cmVhbSh0ZXh0LCBjbS5vcHRpb25zLnRhYlNpemUpO1xuICAgIHN0cmVhbS5zdGFydCA9IHN0cmVhbS5wb3MgPSBzdGFydEF0IHx8IDA7XG4gICAgaWYgKHRleHQgPT0gXCJcIikgY2FsbEJsYW5rTGluZShtb2RlLCBzdGF0ZSk7XG4gICAgd2hpbGUgKCFzdHJlYW0uZW9sKCkpIHtcbiAgICAgIHJlYWRUb2tlbihtb2RlLCBzdHJlYW0sIHN0YXRlKTtcbiAgICAgIHN0cmVhbS5zdGFydCA9IHN0cmVhbS5wb3M7XG4gICAgfVxuICB9XG5cbiAgLy8gQ29udmVydCBhIHN0eWxlIGFzIHJldHVybmVkIGJ5IGEgbW9kZSAoZWl0aGVyIG51bGwsIG9yIGEgc3RyaW5nXG4gIC8vIGNvbnRhaW5pbmcgb25lIG9yIG1vcmUgc3R5bGVzKSB0byBhIENTUyBzdHlsZS4gVGhpcyBpcyBjYWNoZWQsXG4gIC8vIGFuZCBhbHNvIGxvb2tzIGZvciBsaW5lLXdpZGUgc3R5bGVzLlxuICB2YXIgc3R5bGVUb0NsYXNzQ2FjaGUgPSB7fSwgc3R5bGVUb0NsYXNzQ2FjaGVXaXRoTW9kZSA9IHt9O1xuICBmdW5jdGlvbiBpbnRlcnByZXRUb2tlblN0eWxlKHN0eWxlLCBvcHRpb25zKSB7XG4gICAgaWYgKCFzdHlsZSB8fCAvXlxccyokLy50ZXN0KHN0eWxlKSkgcmV0dXJuIG51bGw7XG4gICAgdmFyIGNhY2hlID0gb3B0aW9ucy5hZGRNb2RlQ2xhc3MgPyBzdHlsZVRvQ2xhc3NDYWNoZVdpdGhNb2RlIDogc3R5bGVUb0NsYXNzQ2FjaGU7XG4gICAgcmV0dXJuIGNhY2hlW3N0eWxlXSB8fFxuICAgICAgKGNhY2hlW3N0eWxlXSA9IHN0eWxlLnJlcGxhY2UoL1xcUysvZywgXCJjbS0kJlwiKSk7XG4gIH1cblxuICAvLyBSZW5kZXIgdGhlIERPTSByZXByZXNlbnRhdGlvbiBvZiB0aGUgdGV4dCBvZiBhIGxpbmUuIEFsc28gYnVpbGRzXG4gIC8vIHVwIGEgJ2xpbmUgbWFwJywgd2hpY2ggcG9pbnRzIGF0IHRoZSBET00gbm9kZXMgdGhhdCByZXByZXNlbnRcbiAgLy8gc3BlY2lmaWMgc3RyZXRjaGVzIG9mIHRleHQsIGFuZCBpcyB1c2VkIGJ5IHRoZSBtZWFzdXJpbmcgY29kZS5cbiAgLy8gVGhlIHJldHVybmVkIG9iamVjdCBjb250YWlucyB0aGUgRE9NIG5vZGUsIHRoaXMgbWFwLCBhbmRcbiAgLy8gaW5mb3JtYXRpb24gYWJvdXQgbGluZS13aWRlIHN0eWxlcyB0aGF0IHdlcmUgc2V0IGJ5IHRoZSBtb2RlLlxuICBmdW5jdGlvbiBidWlsZExpbmVDb250ZW50KGNtLCBsaW5lVmlldykge1xuICAgIC8vIFRoZSBwYWRkaW5nLXJpZ2h0IGZvcmNlcyB0aGUgZWxlbWVudCB0byBoYXZlIGEgJ2JvcmRlcicsIHdoaWNoXG4gICAgLy8gaXMgbmVlZGVkIG9uIFdlYmtpdCB0byBiZSBhYmxlIHRvIGdldCBsaW5lLWxldmVsIGJvdW5kaW5nXG4gICAgLy8gcmVjdGFuZ2xlcyBmb3IgaXQgKGluIG1lYXN1cmVDaGFyKS5cbiAgICB2YXIgY29udGVudCA9IGVsdChcInNwYW5cIiwgbnVsbCwgbnVsbCwgd2Via2l0ID8gXCJwYWRkaW5nLXJpZ2h0OiAuMXB4XCIgOiBudWxsKTtcbiAgICB2YXIgYnVpbGRlciA9IHtwcmU6IGVsdChcInByZVwiLCBbY29udGVudF0sIFwiQ29kZU1pcnJvci1saW5lXCIpLCBjb250ZW50OiBjb250ZW50LFxuICAgICAgICAgICAgICAgICAgIGNvbDogMCwgcG9zOiAwLCBjbTogY20sXG4gICAgICAgICAgICAgICAgICAgc3BsaXRTcGFjZXM6IChpZSB8fCB3ZWJraXQpICYmIGNtLmdldE9wdGlvbihcImxpbmVXcmFwcGluZ1wiKX07XG4gICAgbGluZVZpZXcubWVhc3VyZSA9IHt9O1xuXG4gICAgLy8gSXRlcmF0ZSBvdmVyIHRoZSBsb2dpY2FsIGxpbmVzIHRoYXQgbWFrZSB1cCB0aGlzIHZpc3VhbCBsaW5lLlxuICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IChsaW5lVmlldy5yZXN0ID8gbGluZVZpZXcucmVzdC5sZW5ndGggOiAwKTsgaSsrKSB7XG4gICAgICB2YXIgbGluZSA9IGkgPyBsaW5lVmlldy5yZXN0W2kgLSAxXSA6IGxpbmVWaWV3LmxpbmUsIG9yZGVyO1xuICAgICAgYnVpbGRlci5wb3MgPSAwO1xuICAgICAgYnVpbGRlci5hZGRUb2tlbiA9IGJ1aWxkVG9rZW47XG4gICAgICAvLyBPcHRpb25hbGx5IHdpcmUgaW4gc29tZSBoYWNrcyBpbnRvIHRoZSB0b2tlbi1yZW5kZXJpbmdcbiAgICAgIC8vIGFsZ29yaXRobSwgdG8gZGVhbCB3aXRoIGJyb3dzZXIgcXVpcmtzLlxuICAgICAgaWYgKGhhc0JhZEJpZGlSZWN0cyhjbS5kaXNwbGF5Lm1lYXN1cmUpICYmIChvcmRlciA9IGdldE9yZGVyKGxpbmUpKSlcbiAgICAgICAgYnVpbGRlci5hZGRUb2tlbiA9IGJ1aWxkVG9rZW5CYWRCaWRpKGJ1aWxkZXIuYWRkVG9rZW4sIG9yZGVyKTtcbiAgICAgIGJ1aWxkZXIubWFwID0gW107XG4gICAgICB2YXIgYWxsb3dGcm9udGllclVwZGF0ZSA9IGxpbmVWaWV3ICE9IGNtLmRpc3BsYXkuZXh0ZXJuYWxNZWFzdXJlZCAmJiBsaW5lTm8obGluZSk7XG4gICAgICBpbnNlcnRMaW5lQ29udGVudChsaW5lLCBidWlsZGVyLCBnZXRMaW5lU3R5bGVzKGNtLCBsaW5lLCBhbGxvd0Zyb250aWVyVXBkYXRlKSk7XG4gICAgICBpZiAobGluZS5zdHlsZUNsYXNzZXMpIHtcbiAgICAgICAgaWYgKGxpbmUuc3R5bGVDbGFzc2VzLmJnQ2xhc3MpXG4gICAgICAgICAgYnVpbGRlci5iZ0NsYXNzID0gam9pbkNsYXNzZXMobGluZS5zdHlsZUNsYXNzZXMuYmdDbGFzcywgYnVpbGRlci5iZ0NsYXNzIHx8IFwiXCIpO1xuICAgICAgICBpZiAobGluZS5zdHlsZUNsYXNzZXMudGV4dENsYXNzKVxuICAgICAgICAgIGJ1aWxkZXIudGV4dENsYXNzID0gam9pbkNsYXNzZXMobGluZS5zdHlsZUNsYXNzZXMudGV4dENsYXNzLCBidWlsZGVyLnRleHRDbGFzcyB8fCBcIlwiKTtcbiAgICAgIH1cblxuICAgICAgLy8gRW5zdXJlIGF0IGxlYXN0IGEgc2luZ2xlIG5vZGUgaXMgcHJlc2VudCwgZm9yIG1lYXN1cmluZy5cbiAgICAgIGlmIChidWlsZGVyLm1hcC5sZW5ndGggPT0gMClcbiAgICAgICAgYnVpbGRlci5tYXAucHVzaCgwLCAwLCBidWlsZGVyLmNvbnRlbnQuYXBwZW5kQ2hpbGQoemVyb1dpZHRoRWxlbWVudChjbS5kaXNwbGF5Lm1lYXN1cmUpKSk7XG5cbiAgICAgIC8vIFN0b3JlIHRoZSBtYXAgYW5kIGEgY2FjaGUgb2JqZWN0IGZvciB0aGUgY3VycmVudCBsb2dpY2FsIGxpbmVcbiAgICAgIGlmIChpID09IDApIHtcbiAgICAgICAgbGluZVZpZXcubWVhc3VyZS5tYXAgPSBidWlsZGVyLm1hcDtcbiAgICAgICAgbGluZVZpZXcubWVhc3VyZS5jYWNoZSA9IHt9O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgKGxpbmVWaWV3Lm1lYXN1cmUubWFwcyB8fCAobGluZVZpZXcubWVhc3VyZS5tYXBzID0gW10pKS5wdXNoKGJ1aWxkZXIubWFwKTtcbiAgICAgICAgKGxpbmVWaWV3Lm1lYXN1cmUuY2FjaGVzIHx8IChsaW5lVmlldy5tZWFzdXJlLmNhY2hlcyA9IFtdKSkucHVzaCh7fSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gU2VlIGlzc3VlICMyOTAxXG4gICAgaWYgKHdlYmtpdCAmJiAvXFxiY20tdGFiXFxiLy50ZXN0KGJ1aWxkZXIuY29udGVudC5sYXN0Q2hpbGQuY2xhc3NOYW1lKSlcbiAgICAgIGJ1aWxkZXIuY29udGVudC5jbGFzc05hbWUgPSBcImNtLXRhYi13cmFwLWhhY2tcIjtcblxuICAgIHNpZ25hbChjbSwgXCJyZW5kZXJMaW5lXCIsIGNtLCBsaW5lVmlldy5saW5lLCBidWlsZGVyLnByZSk7XG4gICAgaWYgKGJ1aWxkZXIucHJlLmNsYXNzTmFtZSlcbiAgICAgIGJ1aWxkZXIudGV4dENsYXNzID0gam9pbkNsYXNzZXMoYnVpbGRlci5wcmUuY2xhc3NOYW1lLCBidWlsZGVyLnRleHRDbGFzcyB8fCBcIlwiKTtcblxuICAgIHJldHVybiBidWlsZGVyO1xuICB9XG5cbiAgZnVuY3Rpb24gZGVmYXVsdFNwZWNpYWxDaGFyUGxhY2Vob2xkZXIoY2gpIHtcbiAgICB2YXIgdG9rZW4gPSBlbHQoXCJzcGFuXCIsIFwiXFx1MjAyMlwiLCBcImNtLWludmFsaWRjaGFyXCIpO1xuICAgIHRva2VuLnRpdGxlID0gXCJcXFxcdVwiICsgY2guY2hhckNvZGVBdCgwKS50b1N0cmluZygxNik7XG4gICAgdG9rZW4uc2V0QXR0cmlidXRlKFwiYXJpYS1sYWJlbFwiLCB0b2tlbi50aXRsZSk7XG4gICAgcmV0dXJuIHRva2VuO1xuICB9XG5cbiAgLy8gQnVpbGQgdXAgdGhlIERPTSByZXByZXNlbnRhdGlvbiBmb3IgYSBzaW5nbGUgdG9rZW4sIGFuZCBhZGQgaXQgdG9cbiAgLy8gdGhlIGxpbmUgbWFwLiBUYWtlcyBjYXJlIHRvIHJlbmRlciBzcGVjaWFsIGNoYXJhY3RlcnMgc2VwYXJhdGVseS5cbiAgZnVuY3Rpb24gYnVpbGRUb2tlbihidWlsZGVyLCB0ZXh0LCBzdHlsZSwgc3RhcnRTdHlsZSwgZW5kU3R5bGUsIHRpdGxlLCBjc3MpIHtcbiAgICBpZiAoIXRleHQpIHJldHVybjtcbiAgICB2YXIgZGlzcGxheVRleHQgPSBidWlsZGVyLnNwbGl0U3BhY2VzID8gdGV4dC5yZXBsYWNlKC8gezMsfS9nLCBzcGxpdFNwYWNlcykgOiB0ZXh0O1xuICAgIHZhciBzcGVjaWFsID0gYnVpbGRlci5jbS5zdGF0ZS5zcGVjaWFsQ2hhcnMsIG11c3RXcmFwID0gZmFsc2U7XG4gICAgaWYgKCFzcGVjaWFsLnRlc3QodGV4dCkpIHtcbiAgICAgIGJ1aWxkZXIuY29sICs9IHRleHQubGVuZ3RoO1xuICAgICAgdmFyIGNvbnRlbnQgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShkaXNwbGF5VGV4dCk7XG4gICAgICBidWlsZGVyLm1hcC5wdXNoKGJ1aWxkZXIucG9zLCBidWlsZGVyLnBvcyArIHRleHQubGVuZ3RoLCBjb250ZW50KTtcbiAgICAgIGlmIChpZSAmJiBpZV92ZXJzaW9uIDwgOSkgbXVzdFdyYXAgPSB0cnVlO1xuICAgICAgYnVpbGRlci5wb3MgKz0gdGV4dC5sZW5ndGg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBjb250ZW50ID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpLCBwb3MgPSAwO1xuICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgc3BlY2lhbC5sYXN0SW5kZXggPSBwb3M7XG4gICAgICAgIHZhciBtID0gc3BlY2lhbC5leGVjKHRleHQpO1xuICAgICAgICB2YXIgc2tpcHBlZCA9IG0gPyBtLmluZGV4IC0gcG9zIDogdGV4dC5sZW5ndGggLSBwb3M7XG4gICAgICAgIGlmIChza2lwcGVkKSB7XG4gICAgICAgICAgdmFyIHR4dCA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGRpc3BsYXlUZXh0LnNsaWNlKHBvcywgcG9zICsgc2tpcHBlZCkpO1xuICAgICAgICAgIGlmIChpZSAmJiBpZV92ZXJzaW9uIDwgOSkgY29udGVudC5hcHBlbmRDaGlsZChlbHQoXCJzcGFuXCIsIFt0eHRdKSk7XG4gICAgICAgICAgZWxzZSBjb250ZW50LmFwcGVuZENoaWxkKHR4dCk7XG4gICAgICAgICAgYnVpbGRlci5tYXAucHVzaChidWlsZGVyLnBvcywgYnVpbGRlci5wb3MgKyBza2lwcGVkLCB0eHQpO1xuICAgICAgICAgIGJ1aWxkZXIuY29sICs9IHNraXBwZWQ7XG4gICAgICAgICAgYnVpbGRlci5wb3MgKz0gc2tpcHBlZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIW0pIGJyZWFrO1xuICAgICAgICBwb3MgKz0gc2tpcHBlZCArIDE7XG4gICAgICAgIGlmIChtWzBdID09IFwiXFx0XCIpIHtcbiAgICAgICAgICB2YXIgdGFiU2l6ZSA9IGJ1aWxkZXIuY20ub3B0aW9ucy50YWJTaXplLCB0YWJXaWR0aCA9IHRhYlNpemUgLSBidWlsZGVyLmNvbCAlIHRhYlNpemU7XG4gICAgICAgICAgdmFyIHR4dCA9IGNvbnRlbnQuYXBwZW5kQ2hpbGQoZWx0KFwic3BhblwiLCBzcGFjZVN0cih0YWJXaWR0aCksIFwiY20tdGFiXCIpKTtcbiAgICAgICAgICB0eHQuc2V0QXR0cmlidXRlKFwicm9sZVwiLCBcInByZXNlbnRhdGlvblwiKTtcbiAgICAgICAgICB0eHQuc2V0QXR0cmlidXRlKFwiY20tdGV4dFwiLCBcIlxcdFwiKTtcbiAgICAgICAgICBidWlsZGVyLmNvbCArPSB0YWJXaWR0aDtcbiAgICAgICAgfSBlbHNlIGlmIChtWzBdID09IFwiXFxyXCIgfHwgbVswXSA9PSBcIlxcblwiKSB7XG4gICAgICAgICAgdmFyIHR4dCA9IGNvbnRlbnQuYXBwZW5kQ2hpbGQoZWx0KFwic3BhblwiLCBtWzBdID09IFwiXFxyXCIgPyBcIlxcdTI0MGRcIiA6IFwiXFx1MjQyNFwiLCBcImNtLWludmFsaWRjaGFyXCIpKTtcbiAgICAgICAgICB0eHQuc2V0QXR0cmlidXRlKFwiY20tdGV4dFwiLCBtWzBdKTtcbiAgICAgICAgICBidWlsZGVyLmNvbCArPSAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciB0eHQgPSBidWlsZGVyLmNtLm9wdGlvbnMuc3BlY2lhbENoYXJQbGFjZWhvbGRlcihtWzBdKTtcbiAgICAgICAgICB0eHQuc2V0QXR0cmlidXRlKFwiY20tdGV4dFwiLCBtWzBdKTtcbiAgICAgICAgICBpZiAoaWUgJiYgaWVfdmVyc2lvbiA8IDkpIGNvbnRlbnQuYXBwZW5kQ2hpbGQoZWx0KFwic3BhblwiLCBbdHh0XSkpO1xuICAgICAgICAgIGVsc2UgY29udGVudC5hcHBlbmRDaGlsZCh0eHQpO1xuICAgICAgICAgIGJ1aWxkZXIuY29sICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgYnVpbGRlci5tYXAucHVzaChidWlsZGVyLnBvcywgYnVpbGRlci5wb3MgKyAxLCB0eHQpO1xuICAgICAgICBidWlsZGVyLnBvcysrO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoc3R5bGUgfHwgc3RhcnRTdHlsZSB8fCBlbmRTdHlsZSB8fCBtdXN0V3JhcCB8fCBjc3MpIHtcbiAgICAgIHZhciBmdWxsU3R5bGUgPSBzdHlsZSB8fCBcIlwiO1xuICAgICAgaWYgKHN0YXJ0U3R5bGUpIGZ1bGxTdHlsZSArPSBzdGFydFN0eWxlO1xuICAgICAgaWYgKGVuZFN0eWxlKSBmdWxsU3R5bGUgKz0gZW5kU3R5bGU7XG4gICAgICB2YXIgdG9rZW4gPSBlbHQoXCJzcGFuXCIsIFtjb250ZW50XSwgZnVsbFN0eWxlLCBjc3MpO1xuICAgICAgaWYgKHRpdGxlKSB0b2tlbi50aXRsZSA9IHRpdGxlO1xuICAgICAgcmV0dXJuIGJ1aWxkZXIuY29udGVudC5hcHBlbmRDaGlsZCh0b2tlbik7XG4gICAgfVxuICAgIGJ1aWxkZXIuY29udGVudC5hcHBlbmRDaGlsZChjb250ZW50KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNwbGl0U3BhY2VzKG9sZCkge1xuICAgIHZhciBvdXQgPSBcIiBcIjtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9sZC5sZW5ndGggLSAyOyArK2kpIG91dCArPSBpICUgMiA/IFwiIFwiIDogXCJcXHUwMGEwXCI7XG4gICAgb3V0ICs9IFwiIFwiO1xuICAgIHJldHVybiBvdXQ7XG4gIH1cblxuICAvLyBXb3JrIGFyb3VuZCBub25zZW5zZSBkaW1lbnNpb25zIGJlaW5nIHJlcG9ydGVkIGZvciBzdHJldGNoZXMgb2ZcbiAgLy8gcmlnaHQtdG8tbGVmdCB0ZXh0LlxuICBmdW5jdGlvbiBidWlsZFRva2VuQmFkQmlkaShpbm5lciwgb3JkZXIpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oYnVpbGRlciwgdGV4dCwgc3R5bGUsIHN0YXJ0U3R5bGUsIGVuZFN0eWxlLCB0aXRsZSwgY3NzKSB7XG4gICAgICBzdHlsZSA9IHN0eWxlID8gc3R5bGUgKyBcIiBjbS1mb3JjZS1ib3JkZXJcIiA6IFwiY20tZm9yY2UtYm9yZGVyXCI7XG4gICAgICB2YXIgc3RhcnQgPSBidWlsZGVyLnBvcywgZW5kID0gc3RhcnQgKyB0ZXh0Lmxlbmd0aDtcbiAgICAgIGZvciAoOzspIHtcbiAgICAgICAgLy8gRmluZCB0aGUgcGFydCB0aGF0IG92ZXJsYXBzIHdpdGggdGhlIHN0YXJ0IG9mIHRoaXMgdGV4dFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9yZGVyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgdmFyIHBhcnQgPSBvcmRlcltpXTtcbiAgICAgICAgICBpZiAocGFydC50byA+IHN0YXJ0ICYmIHBhcnQuZnJvbSA8PSBzdGFydCkgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHBhcnQudG8gPj0gZW5kKSByZXR1cm4gaW5uZXIoYnVpbGRlciwgdGV4dCwgc3R5bGUsIHN0YXJ0U3R5bGUsIGVuZFN0eWxlLCB0aXRsZSwgY3NzKTtcbiAgICAgICAgaW5uZXIoYnVpbGRlciwgdGV4dC5zbGljZSgwLCBwYXJ0LnRvIC0gc3RhcnQpLCBzdHlsZSwgc3RhcnRTdHlsZSwgbnVsbCwgdGl0bGUsIGNzcyk7XG4gICAgICAgIHN0YXJ0U3R5bGUgPSBudWxsO1xuICAgICAgICB0ZXh0ID0gdGV4dC5zbGljZShwYXJ0LnRvIC0gc3RhcnQpO1xuICAgICAgICBzdGFydCA9IHBhcnQudG87XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGJ1aWxkQ29sbGFwc2VkU3BhbihidWlsZGVyLCBzaXplLCBtYXJrZXIsIGlnbm9yZVdpZGdldCkge1xuICAgIHZhciB3aWRnZXQgPSAhaWdub3JlV2lkZ2V0ICYmIG1hcmtlci53aWRnZXROb2RlO1xuICAgIGlmICh3aWRnZXQpIGJ1aWxkZXIubWFwLnB1c2goYnVpbGRlci5wb3MsIGJ1aWxkZXIucG9zICsgc2l6ZSwgd2lkZ2V0KTtcbiAgICBpZiAoIWlnbm9yZVdpZGdldCAmJiBidWlsZGVyLmNtLmRpc3BsYXkuaW5wdXQubmVlZHNDb250ZW50QXR0cmlidXRlKSB7XG4gICAgICBpZiAoIXdpZGdldClcbiAgICAgICAgd2lkZ2V0ID0gYnVpbGRlci5jb250ZW50LmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpKTtcbiAgICAgIHdpZGdldC5zZXRBdHRyaWJ1dGUoXCJjbS1tYXJrZXJcIiwgbWFya2VyLmlkKTtcbiAgICB9XG4gICAgaWYgKHdpZGdldCkge1xuICAgICAgYnVpbGRlci5jbS5kaXNwbGF5LmlucHV0LnNldFVuZWRpdGFibGUod2lkZ2V0KTtcbiAgICAgIGJ1aWxkZXIuY29udGVudC5hcHBlbmRDaGlsZCh3aWRnZXQpO1xuICAgIH1cbiAgICBidWlsZGVyLnBvcyArPSBzaXplO1xuICB9XG5cbiAgLy8gT3V0cHV0cyBhIG51bWJlciBvZiBzcGFucyB0byBtYWtlIHVwIGEgbGluZSwgdGFraW5nIGhpZ2hsaWdodGluZ1xuICAvLyBhbmQgbWFya2VkIHRleHQgaW50byBhY2NvdW50LlxuICBmdW5jdGlvbiBpbnNlcnRMaW5lQ29udGVudChsaW5lLCBidWlsZGVyLCBzdHlsZXMpIHtcbiAgICB2YXIgc3BhbnMgPSBsaW5lLm1hcmtlZFNwYW5zLCBhbGxUZXh0ID0gbGluZS50ZXh0LCBhdCA9IDA7XG4gICAgaWYgKCFzcGFucykge1xuICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBzdHlsZXMubGVuZ3RoOyBpKz0yKVxuICAgICAgICBidWlsZGVyLmFkZFRva2VuKGJ1aWxkZXIsIGFsbFRleHQuc2xpY2UoYXQsIGF0ID0gc3R5bGVzW2ldKSwgaW50ZXJwcmV0VG9rZW5TdHlsZShzdHlsZXNbaSsxXSwgYnVpbGRlci5jbS5vcHRpb25zKSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGxlbiA9IGFsbFRleHQubGVuZ3RoLCBwb3MgPSAwLCBpID0gMSwgdGV4dCA9IFwiXCIsIHN0eWxlLCBjc3M7XG4gICAgdmFyIG5leHRDaGFuZ2UgPSAwLCBzcGFuU3R5bGUsIHNwYW5FbmRTdHlsZSwgc3BhblN0YXJ0U3R5bGUsIHRpdGxlLCBjb2xsYXBzZWQ7XG4gICAgZm9yICg7Oykge1xuICAgICAgaWYgKG5leHRDaGFuZ2UgPT0gcG9zKSB7IC8vIFVwZGF0ZSBjdXJyZW50IG1hcmtlciBzZXRcbiAgICAgICAgc3BhblN0eWxlID0gc3BhbkVuZFN0eWxlID0gc3BhblN0YXJ0U3R5bGUgPSB0aXRsZSA9IGNzcyA9IFwiXCI7XG4gICAgICAgIGNvbGxhcHNlZCA9IG51bGw7IG5leHRDaGFuZ2UgPSBJbmZpbml0eTtcbiAgICAgICAgdmFyIGZvdW5kQm9va21hcmtzID0gW107XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgc3BhbnMubGVuZ3RoOyArK2opIHtcbiAgICAgICAgICB2YXIgc3AgPSBzcGFuc1tqXSwgbSA9IHNwLm1hcmtlcjtcbiAgICAgICAgICBpZiAobS50eXBlID09IFwiYm9va21hcmtcIiAmJiBzcC5mcm9tID09IHBvcyAmJiBtLndpZGdldE5vZGUpIHtcbiAgICAgICAgICAgIGZvdW5kQm9va21hcmtzLnB1c2gobSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChzcC5mcm9tIDw9IHBvcyAmJiAoc3AudG8gPT0gbnVsbCB8fCBzcC50byA+IHBvcyB8fCBtLmNvbGxhcHNlZCAmJiBzcC50byA9PSBwb3MgJiYgc3AuZnJvbSA9PSBwb3MpKSB7XG4gICAgICAgICAgICBpZiAoc3AudG8gIT0gbnVsbCAmJiBzcC50byAhPSBwb3MgJiYgbmV4dENoYW5nZSA+IHNwLnRvKSB7XG4gICAgICAgICAgICAgIG5leHRDaGFuZ2UgPSBzcC50bztcbiAgICAgICAgICAgICAgc3BhbkVuZFN0eWxlID0gXCJcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChtLmNsYXNzTmFtZSkgc3BhblN0eWxlICs9IFwiIFwiICsgbS5jbGFzc05hbWU7XG4gICAgICAgICAgICBpZiAobS5jc3MpIGNzcyA9IChjc3MgPyBjc3MgKyBcIjtcIiA6IFwiXCIpICsgbS5jc3M7XG4gICAgICAgICAgICBpZiAobS5zdGFydFN0eWxlICYmIHNwLmZyb20gPT0gcG9zKSBzcGFuU3RhcnRTdHlsZSArPSBcIiBcIiArIG0uc3RhcnRTdHlsZTtcbiAgICAgICAgICAgIGlmIChtLmVuZFN0eWxlICYmIHNwLnRvID09IG5leHRDaGFuZ2UpIHNwYW5FbmRTdHlsZSArPSBcIiBcIiArIG0uZW5kU3R5bGU7XG4gICAgICAgICAgICBpZiAobS50aXRsZSAmJiAhdGl0bGUpIHRpdGxlID0gbS50aXRsZTtcbiAgICAgICAgICAgIGlmIChtLmNvbGxhcHNlZCAmJiAoIWNvbGxhcHNlZCB8fCBjb21wYXJlQ29sbGFwc2VkTWFya2Vycyhjb2xsYXBzZWQubWFya2VyLCBtKSA8IDApKVxuICAgICAgICAgICAgICBjb2xsYXBzZWQgPSBzcDtcbiAgICAgICAgICB9IGVsc2UgaWYgKHNwLmZyb20gPiBwb3MgJiYgbmV4dENoYW5nZSA+IHNwLmZyb20pIHtcbiAgICAgICAgICAgIG5leHRDaGFuZ2UgPSBzcC5mcm9tO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoY29sbGFwc2VkICYmIChjb2xsYXBzZWQuZnJvbSB8fCAwKSA9PSBwb3MpIHtcbiAgICAgICAgICBidWlsZENvbGxhcHNlZFNwYW4oYnVpbGRlciwgKGNvbGxhcHNlZC50byA9PSBudWxsID8gbGVuICsgMSA6IGNvbGxhcHNlZC50bykgLSBwb3MsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxhcHNlZC5tYXJrZXIsIGNvbGxhcHNlZC5mcm9tID09IG51bGwpO1xuICAgICAgICAgIGlmIChjb2xsYXBzZWQudG8gPT0gbnVsbCkgcmV0dXJuO1xuICAgICAgICAgIGlmIChjb2xsYXBzZWQudG8gPT0gcG9zKSBjb2xsYXBzZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWNvbGxhcHNlZCAmJiBmb3VuZEJvb2ttYXJrcy5sZW5ndGgpIGZvciAodmFyIGogPSAwOyBqIDwgZm91bmRCb29rbWFya3MubGVuZ3RoOyArK2opXG4gICAgICAgICAgYnVpbGRDb2xsYXBzZWRTcGFuKGJ1aWxkZXIsIDAsIGZvdW5kQm9va21hcmtzW2pdKTtcbiAgICAgIH1cbiAgICAgIGlmIChwb3MgPj0gbGVuKSBicmVhaztcblxuICAgICAgdmFyIHVwdG8gPSBNYXRoLm1pbihsZW4sIG5leHRDaGFuZ2UpO1xuICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgaWYgKHRleHQpIHtcbiAgICAgICAgICB2YXIgZW5kID0gcG9zICsgdGV4dC5sZW5ndGg7XG4gICAgICAgICAgaWYgKCFjb2xsYXBzZWQpIHtcbiAgICAgICAgICAgIHZhciB0b2tlblRleHQgPSBlbmQgPiB1cHRvID8gdGV4dC5zbGljZSgwLCB1cHRvIC0gcG9zKSA6IHRleHQ7XG4gICAgICAgICAgICBidWlsZGVyLmFkZFRva2VuKGJ1aWxkZXIsIHRva2VuVGV4dCwgc3R5bGUgPyBzdHlsZSArIHNwYW5TdHlsZSA6IHNwYW5TdHlsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3BhblN0YXJ0U3R5bGUsIHBvcyArIHRva2VuVGV4dC5sZW5ndGggPT0gbmV4dENoYW5nZSA/IHNwYW5FbmRTdHlsZSA6IFwiXCIsIHRpdGxlLCBjc3MpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoZW5kID49IHVwdG8pIHt0ZXh0ID0gdGV4dC5zbGljZSh1cHRvIC0gcG9zKTsgcG9zID0gdXB0bzsgYnJlYWs7fVxuICAgICAgICAgIHBvcyA9IGVuZDtcbiAgICAgICAgICBzcGFuU3RhcnRTdHlsZSA9IFwiXCI7XG4gICAgICAgIH1cbiAgICAgICAgdGV4dCA9IGFsbFRleHQuc2xpY2UoYXQsIGF0ID0gc3R5bGVzW2krK10pO1xuICAgICAgICBzdHlsZSA9IGludGVycHJldFRva2VuU3R5bGUoc3R5bGVzW2krK10sIGJ1aWxkZXIuY20ub3B0aW9ucyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gRE9DVU1FTlQgREFUQSBTVFJVQ1RVUkVcblxuICAvLyBCeSBkZWZhdWx0LCB1cGRhdGVzIHRoYXQgc3RhcnQgYW5kIGVuZCBhdCB0aGUgYmVnaW5uaW5nIG9mIGEgbGluZVxuICAvLyBhcmUgdHJlYXRlZCBzcGVjaWFsbHksIGluIG9yZGVyIHRvIG1ha2UgdGhlIGFzc29jaWF0aW9uIG9mIGxpbmVcbiAgLy8gd2lkZ2V0cyBhbmQgbWFya2VyIGVsZW1lbnRzIHdpdGggdGhlIHRleHQgYmVoYXZlIG1vcmUgaW50dWl0aXZlLlxuICBmdW5jdGlvbiBpc1dob2xlTGluZVVwZGF0ZShkb2MsIGNoYW5nZSkge1xuICAgIHJldHVybiBjaGFuZ2UuZnJvbS5jaCA9PSAwICYmIGNoYW5nZS50by5jaCA9PSAwICYmIGxzdChjaGFuZ2UudGV4dCkgPT0gXCJcIiAmJlxuICAgICAgKCFkb2MuY20gfHwgZG9jLmNtLm9wdGlvbnMud2hvbGVMaW5lVXBkYXRlQmVmb3JlKTtcbiAgfVxuXG4gIC8vIFBlcmZvcm0gYSBjaGFuZ2Ugb24gdGhlIGRvY3VtZW50IGRhdGEgc3RydWN0dXJlLlxuICBmdW5jdGlvbiB1cGRhdGVEb2MoZG9jLCBjaGFuZ2UsIG1hcmtlZFNwYW5zLCBlc3RpbWF0ZUhlaWdodCkge1xuICAgIGZ1bmN0aW9uIHNwYW5zRm9yKG4pIHtyZXR1cm4gbWFya2VkU3BhbnMgPyBtYXJrZWRTcGFuc1tuXSA6IG51bGw7fVxuICAgIGZ1bmN0aW9uIHVwZGF0ZShsaW5lLCB0ZXh0LCBzcGFucykge1xuICAgICAgdXBkYXRlTGluZShsaW5lLCB0ZXh0LCBzcGFucywgZXN0aW1hdGVIZWlnaHQpO1xuICAgICAgc2lnbmFsTGF0ZXIobGluZSwgXCJjaGFuZ2VcIiwgbGluZSwgY2hhbmdlKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gbGluZXNGb3Ioc3RhcnQsIGVuZCkge1xuICAgICAgZm9yICh2YXIgaSA9IHN0YXJ0LCByZXN1bHQgPSBbXTsgaSA8IGVuZDsgKytpKVxuICAgICAgICByZXN1bHQucHVzaChuZXcgTGluZSh0ZXh0W2ldLCBzcGFuc0ZvcihpKSwgZXN0aW1hdGVIZWlnaHQpKTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgdmFyIGZyb20gPSBjaGFuZ2UuZnJvbSwgdG8gPSBjaGFuZ2UudG8sIHRleHQgPSBjaGFuZ2UudGV4dDtcbiAgICB2YXIgZmlyc3RMaW5lID0gZ2V0TGluZShkb2MsIGZyb20ubGluZSksIGxhc3RMaW5lID0gZ2V0TGluZShkb2MsIHRvLmxpbmUpO1xuICAgIHZhciBsYXN0VGV4dCA9IGxzdCh0ZXh0KSwgbGFzdFNwYW5zID0gc3BhbnNGb3IodGV4dC5sZW5ndGggLSAxKSwgbmxpbmVzID0gdG8ubGluZSAtIGZyb20ubGluZTtcblxuICAgIC8vIEFkanVzdCB0aGUgbGluZSBzdHJ1Y3R1cmVcbiAgICBpZiAoY2hhbmdlLmZ1bGwpIHtcbiAgICAgIGRvYy5pbnNlcnQoMCwgbGluZXNGb3IoMCwgdGV4dC5sZW5ndGgpKTtcbiAgICAgIGRvYy5yZW1vdmUodGV4dC5sZW5ndGgsIGRvYy5zaXplIC0gdGV4dC5sZW5ndGgpO1xuICAgIH0gZWxzZSBpZiAoaXNXaG9sZUxpbmVVcGRhdGUoZG9jLCBjaGFuZ2UpKSB7XG4gICAgICAvLyBUaGlzIGlzIGEgd2hvbGUtbGluZSByZXBsYWNlLiBUcmVhdGVkIHNwZWNpYWxseSB0byBtYWtlXG4gICAgICAvLyBzdXJlIGxpbmUgb2JqZWN0cyBtb3ZlIHRoZSB3YXkgdGhleSBhcmUgc3VwcG9zZWQgdG8uXG4gICAgICB2YXIgYWRkZWQgPSBsaW5lc0ZvcigwLCB0ZXh0Lmxlbmd0aCAtIDEpO1xuICAgICAgdXBkYXRlKGxhc3RMaW5lLCBsYXN0TGluZS50ZXh0LCBsYXN0U3BhbnMpO1xuICAgICAgaWYgKG5saW5lcykgZG9jLnJlbW92ZShmcm9tLmxpbmUsIG5saW5lcyk7XG4gICAgICBpZiAoYWRkZWQubGVuZ3RoKSBkb2MuaW5zZXJ0KGZyb20ubGluZSwgYWRkZWQpO1xuICAgIH0gZWxzZSBpZiAoZmlyc3RMaW5lID09IGxhc3RMaW5lKSB7XG4gICAgICBpZiAodGV4dC5sZW5ndGggPT0gMSkge1xuICAgICAgICB1cGRhdGUoZmlyc3RMaW5lLCBmaXJzdExpbmUudGV4dC5zbGljZSgwLCBmcm9tLmNoKSArIGxhc3RUZXh0ICsgZmlyc3RMaW5lLnRleHQuc2xpY2UodG8uY2gpLCBsYXN0U3BhbnMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGFkZGVkID0gbGluZXNGb3IoMSwgdGV4dC5sZW5ndGggLSAxKTtcbiAgICAgICAgYWRkZWQucHVzaChuZXcgTGluZShsYXN0VGV4dCArIGZpcnN0TGluZS50ZXh0LnNsaWNlKHRvLmNoKSwgbGFzdFNwYW5zLCBlc3RpbWF0ZUhlaWdodCkpO1xuICAgICAgICB1cGRhdGUoZmlyc3RMaW5lLCBmaXJzdExpbmUudGV4dC5zbGljZSgwLCBmcm9tLmNoKSArIHRleHRbMF0sIHNwYW5zRm9yKDApKTtcbiAgICAgICAgZG9jLmluc2VydChmcm9tLmxpbmUgKyAxLCBhZGRlZCk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0ZXh0Lmxlbmd0aCA9PSAxKSB7XG4gICAgICB1cGRhdGUoZmlyc3RMaW5lLCBmaXJzdExpbmUudGV4dC5zbGljZSgwLCBmcm9tLmNoKSArIHRleHRbMF0gKyBsYXN0TGluZS50ZXh0LnNsaWNlKHRvLmNoKSwgc3BhbnNGb3IoMCkpO1xuICAgICAgZG9jLnJlbW92ZShmcm9tLmxpbmUgKyAxLCBubGluZXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICB1cGRhdGUoZmlyc3RMaW5lLCBmaXJzdExpbmUudGV4dC5zbGljZSgwLCBmcm9tLmNoKSArIHRleHRbMF0sIHNwYW5zRm9yKDApKTtcbiAgICAgIHVwZGF0ZShsYXN0TGluZSwgbGFzdFRleHQgKyBsYXN0TGluZS50ZXh0LnNsaWNlKHRvLmNoKSwgbGFzdFNwYW5zKTtcbiAgICAgIHZhciBhZGRlZCA9IGxpbmVzRm9yKDEsIHRleHQubGVuZ3RoIC0gMSk7XG4gICAgICBpZiAobmxpbmVzID4gMSkgZG9jLnJlbW92ZShmcm9tLmxpbmUgKyAxLCBubGluZXMgLSAxKTtcbiAgICAgIGRvYy5pbnNlcnQoZnJvbS5saW5lICsgMSwgYWRkZWQpO1xuICAgIH1cblxuICAgIHNpZ25hbExhdGVyKGRvYywgXCJjaGFuZ2VcIiwgZG9jLCBjaGFuZ2UpO1xuICB9XG5cbiAgLy8gVGhlIGRvY3VtZW50IGlzIHJlcHJlc2VudGVkIGFzIGEgQlRyZWUgY29uc2lzdGluZyBvZiBsZWF2ZXMsIHdpdGhcbiAgLy8gY2h1bmsgb2YgbGluZXMgaW4gdGhlbSwgYW5kIGJyYW5jaGVzLCB3aXRoIHVwIHRvIHRlbiBsZWF2ZXMgb3JcbiAgLy8gb3RoZXIgYnJhbmNoIG5vZGVzIGJlbG93IHRoZW0uIFRoZSB0b3Agbm9kZSBpcyBhbHdheXMgYSBicmFuY2hcbiAgLy8gbm9kZSwgYW5kIGlzIHRoZSBkb2N1bWVudCBvYmplY3QgaXRzZWxmIChtZWFuaW5nIGl0IGhhc1xuICAvLyBhZGRpdGlvbmFsIG1ldGhvZHMgYW5kIHByb3BlcnRpZXMpLlxuICAvL1xuICAvLyBBbGwgbm9kZXMgaGF2ZSBwYXJlbnQgbGlua3MuIFRoZSB0cmVlIGlzIHVzZWQgYm90aCB0byBnbyBmcm9tXG4gIC8vIGxpbmUgbnVtYmVycyB0byBsaW5lIG9iamVjdHMsIGFuZCB0byBnbyBmcm9tIG9iamVjdHMgdG8gbnVtYmVycy5cbiAgLy8gSXQgYWxzbyBpbmRleGVzIGJ5IGhlaWdodCwgYW5kIGlzIHVzZWQgdG8gY29udmVydCBiZXR3ZWVuIGhlaWdodFxuICAvLyBhbmQgbGluZSBvYmplY3QsIGFuZCB0byBmaW5kIHRoZSB0b3RhbCBoZWlnaHQgb2YgdGhlIGRvY3VtZW50LlxuICAvL1xuICAvLyBTZWUgYWxzbyBodHRwOi8vbWFyaWpuaGF2ZXJiZWtlLm5sL2Jsb2cvY29kZW1pcnJvci1saW5lLXRyZWUuaHRtbFxuXG4gIGZ1bmN0aW9uIExlYWZDaHVuayhsaW5lcykge1xuICAgIHRoaXMubGluZXMgPSBsaW5lcztcbiAgICB0aGlzLnBhcmVudCA9IG51bGw7XG4gICAgZm9yICh2YXIgaSA9IDAsIGhlaWdodCA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7ICsraSkge1xuICAgICAgbGluZXNbaV0ucGFyZW50ID0gdGhpcztcbiAgICAgIGhlaWdodCArPSBsaW5lc1tpXS5oZWlnaHQ7XG4gICAgfVxuICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICB9XG5cbiAgTGVhZkNodW5rLnByb3RvdHlwZSA9IHtcbiAgICBjaHVua1NpemU6IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy5saW5lcy5sZW5ndGg7IH0sXG4gICAgLy8gUmVtb3ZlIHRoZSBuIGxpbmVzIGF0IG9mZnNldCAnYXQnLlxuICAgIHJlbW92ZUlubmVyOiBmdW5jdGlvbihhdCwgbikge1xuICAgICAgZm9yICh2YXIgaSA9IGF0LCBlID0gYXQgKyBuOyBpIDwgZTsgKytpKSB7XG4gICAgICAgIHZhciBsaW5lID0gdGhpcy5saW5lc1tpXTtcbiAgICAgICAgdGhpcy5oZWlnaHQgLT0gbGluZS5oZWlnaHQ7XG4gICAgICAgIGNsZWFuVXBMaW5lKGxpbmUpO1xuICAgICAgICBzaWduYWxMYXRlcihsaW5lLCBcImRlbGV0ZVwiKTtcbiAgICAgIH1cbiAgICAgIHRoaXMubGluZXMuc3BsaWNlKGF0LCBuKTtcbiAgICB9LFxuICAgIC8vIEhlbHBlciB1c2VkIHRvIGNvbGxhcHNlIGEgc21hbGwgYnJhbmNoIGludG8gYSBzaW5nbGUgbGVhZi5cbiAgICBjb2xsYXBzZTogZnVuY3Rpb24obGluZXMpIHtcbiAgICAgIGxpbmVzLnB1c2guYXBwbHkobGluZXMsIHRoaXMubGluZXMpO1xuICAgIH0sXG4gICAgLy8gSW5zZXJ0IHRoZSBnaXZlbiBhcnJheSBvZiBsaW5lcyBhdCBvZmZzZXQgJ2F0JywgY291bnQgdGhlbSBhc1xuICAgIC8vIGhhdmluZyB0aGUgZ2l2ZW4gaGVpZ2h0LlxuICAgIGluc2VydElubmVyOiBmdW5jdGlvbihhdCwgbGluZXMsIGhlaWdodCkge1xuICAgICAgdGhpcy5oZWlnaHQgKz0gaGVpZ2h0O1xuICAgICAgdGhpcy5saW5lcyA9IHRoaXMubGluZXMuc2xpY2UoMCwgYXQpLmNvbmNhdChsaW5lcykuY29uY2F0KHRoaXMubGluZXMuc2xpY2UoYXQpKTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyArK2kpIGxpbmVzW2ldLnBhcmVudCA9IHRoaXM7XG4gICAgfSxcbiAgICAvLyBVc2VkIHRvIGl0ZXJhdGUgb3ZlciBhIHBhcnQgb2YgdGhlIHRyZWUuXG4gICAgaXRlck46IGZ1bmN0aW9uKGF0LCBuLCBvcCkge1xuICAgICAgZm9yICh2YXIgZSA9IGF0ICsgbjsgYXQgPCBlOyArK2F0KVxuICAgICAgICBpZiAob3AodGhpcy5saW5lc1thdF0pKSByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH07XG5cbiAgZnVuY3Rpb24gQnJhbmNoQ2h1bmsoY2hpbGRyZW4pIHtcbiAgICB0aGlzLmNoaWxkcmVuID0gY2hpbGRyZW47XG4gICAgdmFyIHNpemUgPSAwLCBoZWlnaHQgPSAwO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyArK2kpIHtcbiAgICAgIHZhciBjaCA9IGNoaWxkcmVuW2ldO1xuICAgICAgc2l6ZSArPSBjaC5jaHVua1NpemUoKTsgaGVpZ2h0ICs9IGNoLmhlaWdodDtcbiAgICAgIGNoLnBhcmVudCA9IHRoaXM7XG4gICAgfVxuICAgIHRoaXMuc2l6ZSA9IHNpemU7XG4gICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgdGhpcy5wYXJlbnQgPSBudWxsO1xuICB9XG5cbiAgQnJhbmNoQ2h1bmsucHJvdG90eXBlID0ge1xuICAgIGNodW5rU2l6ZTogZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLnNpemU7IH0sXG4gICAgcmVtb3ZlSW5uZXI6IGZ1bmN0aW9uKGF0LCBuKSB7XG4gICAgICB0aGlzLnNpemUgLT0gbjtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jaGlsZHJlbi5sZW5ndGg7ICsraSkge1xuICAgICAgICB2YXIgY2hpbGQgPSB0aGlzLmNoaWxkcmVuW2ldLCBzeiA9IGNoaWxkLmNodW5rU2l6ZSgpO1xuICAgICAgICBpZiAoYXQgPCBzeikge1xuICAgICAgICAgIHZhciBybSA9IE1hdGgubWluKG4sIHN6IC0gYXQpLCBvbGRIZWlnaHQgPSBjaGlsZC5oZWlnaHQ7XG4gICAgICAgICAgY2hpbGQucmVtb3ZlSW5uZXIoYXQsIHJtKTtcbiAgICAgICAgICB0aGlzLmhlaWdodCAtPSBvbGRIZWlnaHQgLSBjaGlsZC5oZWlnaHQ7XG4gICAgICAgICAgaWYgKHN6ID09IHJtKSB7IHRoaXMuY2hpbGRyZW4uc3BsaWNlKGktLSwgMSk7IGNoaWxkLnBhcmVudCA9IG51bGw7IH1cbiAgICAgICAgICBpZiAoKG4gLT0gcm0pID09IDApIGJyZWFrO1xuICAgICAgICAgIGF0ID0gMDtcbiAgICAgICAgfSBlbHNlIGF0IC09IHN6O1xuICAgICAgfVxuICAgICAgLy8gSWYgdGhlIHJlc3VsdCBpcyBzbWFsbGVyIHRoYW4gMjUgbGluZXMsIGVuc3VyZSB0aGF0IGl0IGlzIGFcbiAgICAgIC8vIHNpbmdsZSBsZWFmIG5vZGUuXG4gICAgICBpZiAodGhpcy5zaXplIC0gbiA8IDI1ICYmXG4gICAgICAgICAgKHRoaXMuY2hpbGRyZW4ubGVuZ3RoID4gMSB8fCAhKHRoaXMuY2hpbGRyZW5bMF0gaW5zdGFuY2VvZiBMZWFmQ2h1bmspKSkge1xuICAgICAgICB2YXIgbGluZXMgPSBbXTtcbiAgICAgICAgdGhpcy5jb2xsYXBzZShsaW5lcyk7XG4gICAgICAgIHRoaXMuY2hpbGRyZW4gPSBbbmV3IExlYWZDaHVuayhsaW5lcyldO1xuICAgICAgICB0aGlzLmNoaWxkcmVuWzBdLnBhcmVudCA9IHRoaXM7XG4gICAgICB9XG4gICAgfSxcbiAgICBjb2xsYXBzZTogZnVuY3Rpb24obGluZXMpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jaGlsZHJlbi5sZW5ndGg7ICsraSkgdGhpcy5jaGlsZHJlbltpXS5jb2xsYXBzZShsaW5lcyk7XG4gICAgfSxcbiAgICBpbnNlcnRJbm5lcjogZnVuY3Rpb24oYXQsIGxpbmVzLCBoZWlnaHQpIHtcbiAgICAgIHRoaXMuc2l6ZSArPSBsaW5lcy5sZW5ndGg7XG4gICAgICB0aGlzLmhlaWdodCArPSBoZWlnaHQ7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuY2hpbGRyZW4ubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIGNoaWxkID0gdGhpcy5jaGlsZHJlbltpXSwgc3ogPSBjaGlsZC5jaHVua1NpemUoKTtcbiAgICAgICAgaWYgKGF0IDw9IHN6KSB7XG4gICAgICAgICAgY2hpbGQuaW5zZXJ0SW5uZXIoYXQsIGxpbmVzLCBoZWlnaHQpO1xuICAgICAgICAgIGlmIChjaGlsZC5saW5lcyAmJiBjaGlsZC5saW5lcy5sZW5ndGggPiA1MCkge1xuICAgICAgICAgICAgd2hpbGUgKGNoaWxkLmxpbmVzLmxlbmd0aCA+IDUwKSB7XG4gICAgICAgICAgICAgIHZhciBzcGlsbGVkID0gY2hpbGQubGluZXMuc3BsaWNlKGNoaWxkLmxpbmVzLmxlbmd0aCAtIDI1LCAyNSk7XG4gICAgICAgICAgICAgIHZhciBuZXdsZWFmID0gbmV3IExlYWZDaHVuayhzcGlsbGVkKTtcbiAgICAgICAgICAgICAgY2hpbGQuaGVpZ2h0IC09IG5ld2xlYWYuaGVpZ2h0O1xuICAgICAgICAgICAgICB0aGlzLmNoaWxkcmVuLnNwbGljZShpICsgMSwgMCwgbmV3bGVhZik7XG4gICAgICAgICAgICAgIG5ld2xlYWYucGFyZW50ID0gdGhpcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMubWF5YmVTcGlsbCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBhdCAtPSBzejtcbiAgICAgIH1cbiAgICB9LFxuICAgIC8vIFdoZW4gYSBub2RlIGhhcyBncm93biwgY2hlY2sgd2hldGhlciBpdCBzaG91bGQgYmUgc3BsaXQuXG4gICAgbWF5YmVTcGlsbDogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAodGhpcy5jaGlsZHJlbi5sZW5ndGggPD0gMTApIHJldHVybjtcbiAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgICBkbyB7XG4gICAgICAgIHZhciBzcGlsbGVkID0gbWUuY2hpbGRyZW4uc3BsaWNlKG1lLmNoaWxkcmVuLmxlbmd0aCAtIDUsIDUpO1xuICAgICAgICB2YXIgc2libGluZyA9IG5ldyBCcmFuY2hDaHVuayhzcGlsbGVkKTtcbiAgICAgICAgaWYgKCFtZS5wYXJlbnQpIHsgLy8gQmVjb21lIHRoZSBwYXJlbnQgbm9kZVxuICAgICAgICAgIHZhciBjb3B5ID0gbmV3IEJyYW5jaENodW5rKG1lLmNoaWxkcmVuKTtcbiAgICAgICAgICBjb3B5LnBhcmVudCA9IG1lO1xuICAgICAgICAgIG1lLmNoaWxkcmVuID0gW2NvcHksIHNpYmxpbmddO1xuICAgICAgICAgIG1lID0gY29weTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBtZS5zaXplIC09IHNpYmxpbmcuc2l6ZTtcbiAgICAgICAgICBtZS5oZWlnaHQgLT0gc2libGluZy5oZWlnaHQ7XG4gICAgICAgICAgdmFyIG15SW5kZXggPSBpbmRleE9mKG1lLnBhcmVudC5jaGlsZHJlbiwgbWUpO1xuICAgICAgICAgIG1lLnBhcmVudC5jaGlsZHJlbi5zcGxpY2UobXlJbmRleCArIDEsIDAsIHNpYmxpbmcpO1xuICAgICAgICB9XG4gICAgICAgIHNpYmxpbmcucGFyZW50ID0gbWUucGFyZW50O1xuICAgICAgfSB3aGlsZSAobWUuY2hpbGRyZW4ubGVuZ3RoID4gMTApO1xuICAgICAgbWUucGFyZW50Lm1heWJlU3BpbGwoKTtcbiAgICB9LFxuICAgIGl0ZXJOOiBmdW5jdGlvbihhdCwgbiwgb3ApIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jaGlsZHJlbi5sZW5ndGg7ICsraSkge1xuICAgICAgICB2YXIgY2hpbGQgPSB0aGlzLmNoaWxkcmVuW2ldLCBzeiA9IGNoaWxkLmNodW5rU2l6ZSgpO1xuICAgICAgICBpZiAoYXQgPCBzeikge1xuICAgICAgICAgIHZhciB1c2VkID0gTWF0aC5taW4obiwgc3ogLSBhdCk7XG4gICAgICAgICAgaWYgKGNoaWxkLml0ZXJOKGF0LCB1c2VkLCBvcCkpIHJldHVybiB0cnVlO1xuICAgICAgICAgIGlmICgobiAtPSB1c2VkKSA9PSAwKSBicmVhaztcbiAgICAgICAgICBhdCA9IDA7XG4gICAgICAgIH0gZWxzZSBhdCAtPSBzejtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgdmFyIG5leHREb2NJZCA9IDA7XG4gIHZhciBEb2MgPSBDb2RlTWlycm9yLkRvYyA9IGZ1bmN0aW9uKHRleHQsIG1vZGUsIGZpcnN0TGluZSwgbGluZVNlcCkge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBEb2MpKSByZXR1cm4gbmV3IERvYyh0ZXh0LCBtb2RlLCBmaXJzdExpbmUsIGxpbmVTZXApO1xuICAgIGlmIChmaXJzdExpbmUgPT0gbnVsbCkgZmlyc3RMaW5lID0gMDtcblxuICAgIEJyYW5jaENodW5rLmNhbGwodGhpcywgW25ldyBMZWFmQ2h1bmsoW25ldyBMaW5lKFwiXCIsIG51bGwpXSldKTtcbiAgICB0aGlzLmZpcnN0ID0gZmlyc3RMaW5lO1xuICAgIHRoaXMuc2Nyb2xsVG9wID0gdGhpcy5zY3JvbGxMZWZ0ID0gMDtcbiAgICB0aGlzLmNhbnRFZGl0ID0gZmFsc2U7XG4gICAgdGhpcy5jbGVhbkdlbmVyYXRpb24gPSAxO1xuICAgIHRoaXMuZnJvbnRpZXIgPSBmaXJzdExpbmU7XG4gICAgdmFyIHN0YXJ0ID0gUG9zKGZpcnN0TGluZSwgMCk7XG4gICAgdGhpcy5zZWwgPSBzaW1wbGVTZWxlY3Rpb24oc3RhcnQpO1xuICAgIHRoaXMuaGlzdG9yeSA9IG5ldyBIaXN0b3J5KG51bGwpO1xuICAgIHRoaXMuaWQgPSArK25leHREb2NJZDtcbiAgICB0aGlzLm1vZGVPcHRpb24gPSBtb2RlO1xuICAgIHRoaXMubGluZVNlcCA9IGxpbmVTZXA7XG4gICAgdGhpcy5leHRlbmQgPSBmYWxzZTtcblxuICAgIGlmICh0eXBlb2YgdGV4dCA9PSBcInN0cmluZ1wiKSB0ZXh0ID0gdGhpcy5zcGxpdExpbmVzKHRleHQpO1xuICAgIHVwZGF0ZURvYyh0aGlzLCB7ZnJvbTogc3RhcnQsIHRvOiBzdGFydCwgdGV4dDogdGV4dH0pO1xuICAgIHNldFNlbGVjdGlvbih0aGlzLCBzaW1wbGVTZWxlY3Rpb24oc3RhcnQpLCBzZWxfZG9udFNjcm9sbCk7XG4gIH07XG5cbiAgRG9jLnByb3RvdHlwZSA9IGNyZWF0ZU9iaihCcmFuY2hDaHVuay5wcm90b3R5cGUsIHtcbiAgICBjb25zdHJ1Y3RvcjogRG9jLFxuICAgIC8vIEl0ZXJhdGUgb3ZlciB0aGUgZG9jdW1lbnQuIFN1cHBvcnRzIHR3byBmb3JtcyAtLSB3aXRoIG9ubHkgb25lXG4gICAgLy8gYXJndW1lbnQsIGl0IGNhbGxzIHRoYXQgZm9yIGVhY2ggbGluZSBpbiB0aGUgZG9jdW1lbnQuIFdpdGhcbiAgICAvLyB0aHJlZSwgaXQgaXRlcmF0ZXMgb3ZlciB0aGUgcmFuZ2UgZ2l2ZW4gYnkgdGhlIGZpcnN0IHR3byAod2l0aFxuICAgIC8vIHRoZSBzZWNvbmQgYmVpbmcgbm9uLWluY2x1c2l2ZSkuXG4gICAgaXRlcjogZnVuY3Rpb24oZnJvbSwgdG8sIG9wKSB7XG4gICAgICBpZiAob3ApIHRoaXMuaXRlck4oZnJvbSAtIHRoaXMuZmlyc3QsIHRvIC0gZnJvbSwgb3ApO1xuICAgICAgZWxzZSB0aGlzLml0ZXJOKHRoaXMuZmlyc3QsIHRoaXMuZmlyc3QgKyB0aGlzLnNpemUsIGZyb20pO1xuICAgIH0sXG5cbiAgICAvLyBOb24tcHVibGljIGludGVyZmFjZSBmb3IgYWRkaW5nIGFuZCByZW1vdmluZyBsaW5lcy5cbiAgICBpbnNlcnQ6IGZ1bmN0aW9uKGF0LCBsaW5lcykge1xuICAgICAgdmFyIGhlaWdodCA9IDA7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgKytpKSBoZWlnaHQgKz0gbGluZXNbaV0uaGVpZ2h0O1xuICAgICAgdGhpcy5pbnNlcnRJbm5lcihhdCAtIHRoaXMuZmlyc3QsIGxpbmVzLCBoZWlnaHQpO1xuICAgIH0sXG4gICAgcmVtb3ZlOiBmdW5jdGlvbihhdCwgbikgeyB0aGlzLnJlbW92ZUlubmVyKGF0IC0gdGhpcy5maXJzdCwgbik7IH0sXG5cbiAgICAvLyBGcm9tIGhlcmUsIHRoZSBtZXRob2RzIGFyZSBwYXJ0IG9mIHRoZSBwdWJsaWMgaW50ZXJmYWNlLiBNb3N0XG4gICAgLy8gYXJlIGFsc28gYXZhaWxhYmxlIGZyb20gQ29kZU1pcnJvciAoZWRpdG9yKSBpbnN0YW5jZXMuXG5cbiAgICBnZXRWYWx1ZTogZnVuY3Rpb24obGluZVNlcCkge1xuICAgICAgdmFyIGxpbmVzID0gZ2V0TGluZXModGhpcywgdGhpcy5maXJzdCwgdGhpcy5maXJzdCArIHRoaXMuc2l6ZSk7XG4gICAgICBpZiAobGluZVNlcCA9PT0gZmFsc2UpIHJldHVybiBsaW5lcztcbiAgICAgIHJldHVybiBsaW5lcy5qb2luKGxpbmVTZXAgfHwgdGhpcy5saW5lU2VwYXJhdG9yKCkpO1xuICAgIH0sXG4gICAgc2V0VmFsdWU6IGRvY01ldGhvZE9wKGZ1bmN0aW9uKGNvZGUpIHtcbiAgICAgIHZhciB0b3AgPSBQb3ModGhpcy5maXJzdCwgMCksIGxhc3QgPSB0aGlzLmZpcnN0ICsgdGhpcy5zaXplIC0gMTtcbiAgICAgIG1ha2VDaGFuZ2UodGhpcywge2Zyb206IHRvcCwgdG86IFBvcyhsYXN0LCBnZXRMaW5lKHRoaXMsIGxhc3QpLnRleHQubGVuZ3RoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IHRoaXMuc3BsaXRMaW5lcyhjb2RlKSwgb3JpZ2luOiBcInNldFZhbHVlXCIsIGZ1bGw6IHRydWV9LCB0cnVlKTtcbiAgICAgIHNldFNlbGVjdGlvbih0aGlzLCBzaW1wbGVTZWxlY3Rpb24odG9wKSk7XG4gICAgfSksXG4gICAgcmVwbGFjZVJhbmdlOiBmdW5jdGlvbihjb2RlLCBmcm9tLCB0bywgb3JpZ2luKSB7XG4gICAgICBmcm9tID0gY2xpcFBvcyh0aGlzLCBmcm9tKTtcbiAgICAgIHRvID0gdG8gPyBjbGlwUG9zKHRoaXMsIHRvKSA6IGZyb207XG4gICAgICByZXBsYWNlUmFuZ2UodGhpcywgY29kZSwgZnJvbSwgdG8sIG9yaWdpbik7XG4gICAgfSxcbiAgICBnZXRSYW5nZTogZnVuY3Rpb24oZnJvbSwgdG8sIGxpbmVTZXApIHtcbiAgICAgIHZhciBsaW5lcyA9IGdldEJldHdlZW4odGhpcywgY2xpcFBvcyh0aGlzLCBmcm9tKSwgY2xpcFBvcyh0aGlzLCB0bykpO1xuICAgICAgaWYgKGxpbmVTZXAgPT09IGZhbHNlKSByZXR1cm4gbGluZXM7XG4gICAgICByZXR1cm4gbGluZXMuam9pbihsaW5lU2VwIHx8IHRoaXMubGluZVNlcGFyYXRvcigpKTtcbiAgICB9LFxuXG4gICAgZ2V0TGluZTogZnVuY3Rpb24obGluZSkge3ZhciBsID0gdGhpcy5nZXRMaW5lSGFuZGxlKGxpbmUpOyByZXR1cm4gbCAmJiBsLnRleHQ7fSxcblxuICAgIGdldExpbmVIYW5kbGU6IGZ1bmN0aW9uKGxpbmUpIHtpZiAoaXNMaW5lKHRoaXMsIGxpbmUpKSByZXR1cm4gZ2V0TGluZSh0aGlzLCBsaW5lKTt9LFxuICAgIGdldExpbmVOdW1iZXI6IGZ1bmN0aW9uKGxpbmUpIHtyZXR1cm4gbGluZU5vKGxpbmUpO30sXG5cbiAgICBnZXRMaW5lSGFuZGxlVmlzdWFsU3RhcnQ6IGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgIGlmICh0eXBlb2YgbGluZSA9PSBcIm51bWJlclwiKSBsaW5lID0gZ2V0TGluZSh0aGlzLCBsaW5lKTtcbiAgICAgIHJldHVybiB2aXN1YWxMaW5lKGxpbmUpO1xuICAgIH0sXG5cbiAgICBsaW5lQ291bnQ6IGZ1bmN0aW9uKCkge3JldHVybiB0aGlzLnNpemU7fSxcbiAgICBmaXJzdExpbmU6IGZ1bmN0aW9uKCkge3JldHVybiB0aGlzLmZpcnN0O30sXG4gICAgbGFzdExpbmU6IGZ1bmN0aW9uKCkge3JldHVybiB0aGlzLmZpcnN0ICsgdGhpcy5zaXplIC0gMTt9LFxuXG4gICAgY2xpcFBvczogZnVuY3Rpb24ocG9zKSB7cmV0dXJuIGNsaXBQb3ModGhpcywgcG9zKTt9LFxuXG4gICAgZ2V0Q3Vyc29yOiBmdW5jdGlvbihzdGFydCkge1xuICAgICAgdmFyIHJhbmdlID0gdGhpcy5zZWwucHJpbWFyeSgpLCBwb3M7XG4gICAgICBpZiAoc3RhcnQgPT0gbnVsbCB8fCBzdGFydCA9PSBcImhlYWRcIikgcG9zID0gcmFuZ2UuaGVhZDtcbiAgICAgIGVsc2UgaWYgKHN0YXJ0ID09IFwiYW5jaG9yXCIpIHBvcyA9IHJhbmdlLmFuY2hvcjtcbiAgICAgIGVsc2UgaWYgKHN0YXJ0ID09IFwiZW5kXCIgfHwgc3RhcnQgPT0gXCJ0b1wiIHx8IHN0YXJ0ID09PSBmYWxzZSkgcG9zID0gcmFuZ2UudG8oKTtcbiAgICAgIGVsc2UgcG9zID0gcmFuZ2UuZnJvbSgpO1xuICAgICAgcmV0dXJuIHBvcztcbiAgICB9LFxuICAgIGxpc3RTZWxlY3Rpb25zOiBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXMuc2VsLnJhbmdlczsgfSxcbiAgICBzb21ldGhpbmdTZWxlY3RlZDogZnVuY3Rpb24oKSB7cmV0dXJuIHRoaXMuc2VsLnNvbWV0aGluZ1NlbGVjdGVkKCk7fSxcblxuICAgIHNldEN1cnNvcjogZG9jTWV0aG9kT3AoZnVuY3Rpb24obGluZSwgY2gsIG9wdGlvbnMpIHtcbiAgICAgIHNldFNpbXBsZVNlbGVjdGlvbih0aGlzLCBjbGlwUG9zKHRoaXMsIHR5cGVvZiBsaW5lID09IFwibnVtYmVyXCIgPyBQb3MobGluZSwgY2ggfHwgMCkgOiBsaW5lKSwgbnVsbCwgb3B0aW9ucyk7XG4gICAgfSksXG4gICAgc2V0U2VsZWN0aW9uOiBkb2NNZXRob2RPcChmdW5jdGlvbihhbmNob3IsIGhlYWQsIG9wdGlvbnMpIHtcbiAgICAgIHNldFNpbXBsZVNlbGVjdGlvbih0aGlzLCBjbGlwUG9zKHRoaXMsIGFuY2hvciksIGNsaXBQb3ModGhpcywgaGVhZCB8fCBhbmNob3IpLCBvcHRpb25zKTtcbiAgICB9KSxcbiAgICBleHRlbmRTZWxlY3Rpb246IGRvY01ldGhvZE9wKGZ1bmN0aW9uKGhlYWQsIG90aGVyLCBvcHRpb25zKSB7XG4gICAgICBleHRlbmRTZWxlY3Rpb24odGhpcywgY2xpcFBvcyh0aGlzLCBoZWFkKSwgb3RoZXIgJiYgY2xpcFBvcyh0aGlzLCBvdGhlciksIG9wdGlvbnMpO1xuICAgIH0pLFxuICAgIGV4dGVuZFNlbGVjdGlvbnM6IGRvY01ldGhvZE9wKGZ1bmN0aW9uKGhlYWRzLCBvcHRpb25zKSB7XG4gICAgICBleHRlbmRTZWxlY3Rpb25zKHRoaXMsIGNsaXBQb3NBcnJheSh0aGlzLCBoZWFkcywgb3B0aW9ucykpO1xuICAgIH0pLFxuICAgIGV4dGVuZFNlbGVjdGlvbnNCeTogZG9jTWV0aG9kT3AoZnVuY3Rpb24oZiwgb3B0aW9ucykge1xuICAgICAgZXh0ZW5kU2VsZWN0aW9ucyh0aGlzLCBtYXAodGhpcy5zZWwucmFuZ2VzLCBmKSwgb3B0aW9ucyk7XG4gICAgfSksXG4gICAgc2V0U2VsZWN0aW9uczogZG9jTWV0aG9kT3AoZnVuY3Rpb24ocmFuZ2VzLCBwcmltYXJ5LCBvcHRpb25zKSB7XG4gICAgICBpZiAoIXJhbmdlcy5sZW5ndGgpIHJldHVybjtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBvdXQgPSBbXTsgaSA8IHJhbmdlcy5sZW5ndGg7IGkrKylcbiAgICAgICAgb3V0W2ldID0gbmV3IFJhbmdlKGNsaXBQb3ModGhpcywgcmFuZ2VzW2ldLmFuY2hvciksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBjbGlwUG9zKHRoaXMsIHJhbmdlc1tpXS5oZWFkKSk7XG4gICAgICBpZiAocHJpbWFyeSA9PSBudWxsKSBwcmltYXJ5ID0gTWF0aC5taW4ocmFuZ2VzLmxlbmd0aCAtIDEsIHRoaXMuc2VsLnByaW1JbmRleCk7XG4gICAgICBzZXRTZWxlY3Rpb24odGhpcywgbm9ybWFsaXplU2VsZWN0aW9uKG91dCwgcHJpbWFyeSksIG9wdGlvbnMpO1xuICAgIH0pLFxuICAgIGFkZFNlbGVjdGlvbjogZG9jTWV0aG9kT3AoZnVuY3Rpb24oYW5jaG9yLCBoZWFkLCBvcHRpb25zKSB7XG4gICAgICB2YXIgcmFuZ2VzID0gdGhpcy5zZWwucmFuZ2VzLnNsaWNlKDApO1xuICAgICAgcmFuZ2VzLnB1c2gobmV3IFJhbmdlKGNsaXBQb3ModGhpcywgYW5jaG9yKSwgY2xpcFBvcyh0aGlzLCBoZWFkIHx8IGFuY2hvcikpKTtcbiAgICAgIHNldFNlbGVjdGlvbih0aGlzLCBub3JtYWxpemVTZWxlY3Rpb24ocmFuZ2VzLCByYW5nZXMubGVuZ3RoIC0gMSksIG9wdGlvbnMpO1xuICAgIH0pLFxuXG4gICAgZ2V0U2VsZWN0aW9uOiBmdW5jdGlvbihsaW5lU2VwKSB7XG4gICAgICB2YXIgcmFuZ2VzID0gdGhpcy5zZWwucmFuZ2VzLCBsaW5lcztcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmFuZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBzZWwgPSBnZXRCZXR3ZWVuKHRoaXMsIHJhbmdlc1tpXS5mcm9tKCksIHJhbmdlc1tpXS50bygpKTtcbiAgICAgICAgbGluZXMgPSBsaW5lcyA/IGxpbmVzLmNvbmNhdChzZWwpIDogc2VsO1xuICAgICAgfVxuICAgICAgaWYgKGxpbmVTZXAgPT09IGZhbHNlKSByZXR1cm4gbGluZXM7XG4gICAgICBlbHNlIHJldHVybiBsaW5lcy5qb2luKGxpbmVTZXAgfHwgdGhpcy5saW5lU2VwYXJhdG9yKCkpO1xuICAgIH0sXG4gICAgZ2V0U2VsZWN0aW9uczogZnVuY3Rpb24obGluZVNlcCkge1xuICAgICAgdmFyIHBhcnRzID0gW10sIHJhbmdlcyA9IHRoaXMuc2VsLnJhbmdlcztcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmFuZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBzZWwgPSBnZXRCZXR3ZWVuKHRoaXMsIHJhbmdlc1tpXS5mcm9tKCksIHJhbmdlc1tpXS50bygpKTtcbiAgICAgICAgaWYgKGxpbmVTZXAgIT09IGZhbHNlKSBzZWwgPSBzZWwuam9pbihsaW5lU2VwIHx8IHRoaXMubGluZVNlcGFyYXRvcigpKTtcbiAgICAgICAgcGFydHNbaV0gPSBzZWw7XG4gICAgICB9XG4gICAgICByZXR1cm4gcGFydHM7XG4gICAgfSxcbiAgICByZXBsYWNlU2VsZWN0aW9uOiBmdW5jdGlvbihjb2RlLCBjb2xsYXBzZSwgb3JpZ2luKSB7XG4gICAgICB2YXIgZHVwID0gW107XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc2VsLnJhbmdlcy5sZW5ndGg7IGkrKylcbiAgICAgICAgZHVwW2ldID0gY29kZTtcbiAgICAgIHRoaXMucmVwbGFjZVNlbGVjdGlvbnMoZHVwLCBjb2xsYXBzZSwgb3JpZ2luIHx8IFwiK2lucHV0XCIpO1xuICAgIH0sXG4gICAgcmVwbGFjZVNlbGVjdGlvbnM6IGRvY01ldGhvZE9wKGZ1bmN0aW9uKGNvZGUsIGNvbGxhcHNlLCBvcmlnaW4pIHtcbiAgICAgIHZhciBjaGFuZ2VzID0gW10sIHNlbCA9IHRoaXMuc2VsO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzZWwucmFuZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciByYW5nZSA9IHNlbC5yYW5nZXNbaV07XG4gICAgICAgIGNoYW5nZXNbaV0gPSB7ZnJvbTogcmFuZ2UuZnJvbSgpLCB0bzogcmFuZ2UudG8oKSwgdGV4dDogdGhpcy5zcGxpdExpbmVzKGNvZGVbaV0pLCBvcmlnaW46IG9yaWdpbn07XG4gICAgICB9XG4gICAgICB2YXIgbmV3U2VsID0gY29sbGFwc2UgJiYgY29sbGFwc2UgIT0gXCJlbmRcIiAmJiBjb21wdXRlUmVwbGFjZWRTZWwodGhpcywgY2hhbmdlcywgY29sbGFwc2UpO1xuICAgICAgZm9yICh2YXIgaSA9IGNoYW5nZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pXG4gICAgICAgIG1ha2VDaGFuZ2UodGhpcywgY2hhbmdlc1tpXSk7XG4gICAgICBpZiAobmV3U2VsKSBzZXRTZWxlY3Rpb25SZXBsYWNlSGlzdG9yeSh0aGlzLCBuZXdTZWwpO1xuICAgICAgZWxzZSBpZiAodGhpcy5jbSkgZW5zdXJlQ3Vyc29yVmlzaWJsZSh0aGlzLmNtKTtcbiAgICB9KSxcbiAgICB1bmRvOiBkb2NNZXRob2RPcChmdW5jdGlvbigpIHttYWtlQ2hhbmdlRnJvbUhpc3RvcnkodGhpcywgXCJ1bmRvXCIpO30pLFxuICAgIHJlZG86IGRvY01ldGhvZE9wKGZ1bmN0aW9uKCkge21ha2VDaGFuZ2VGcm9tSGlzdG9yeSh0aGlzLCBcInJlZG9cIik7fSksXG4gICAgdW5kb1NlbGVjdGlvbjogZG9jTWV0aG9kT3AoZnVuY3Rpb24oKSB7bWFrZUNoYW5nZUZyb21IaXN0b3J5KHRoaXMsIFwidW5kb1wiLCB0cnVlKTt9KSxcbiAgICByZWRvU2VsZWN0aW9uOiBkb2NNZXRob2RPcChmdW5jdGlvbigpIHttYWtlQ2hhbmdlRnJvbUhpc3RvcnkodGhpcywgXCJyZWRvXCIsIHRydWUpO30pLFxuXG4gICAgc2V0RXh0ZW5kaW5nOiBmdW5jdGlvbih2YWwpIHt0aGlzLmV4dGVuZCA9IHZhbDt9LFxuICAgIGdldEV4dGVuZGluZzogZnVuY3Rpb24oKSB7cmV0dXJuIHRoaXMuZXh0ZW5kO30sXG5cbiAgICBoaXN0b3J5U2l6ZTogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgaGlzdCA9IHRoaXMuaGlzdG9yeSwgZG9uZSA9IDAsIHVuZG9uZSA9IDA7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGhpc3QuZG9uZS5sZW5ndGg7IGkrKykgaWYgKCFoaXN0LmRvbmVbaV0ucmFuZ2VzKSArK2RvbmU7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGhpc3QudW5kb25lLmxlbmd0aDsgaSsrKSBpZiAoIWhpc3QudW5kb25lW2ldLnJhbmdlcykgKyt1bmRvbmU7XG4gICAgICByZXR1cm4ge3VuZG86IGRvbmUsIHJlZG86IHVuZG9uZX07XG4gICAgfSxcbiAgICBjbGVhckhpc3Rvcnk6IGZ1bmN0aW9uKCkge3RoaXMuaGlzdG9yeSA9IG5ldyBIaXN0b3J5KHRoaXMuaGlzdG9yeS5tYXhHZW5lcmF0aW9uKTt9LFxuXG4gICAgbWFya0NsZWFuOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuY2xlYW5HZW5lcmF0aW9uID0gdGhpcy5jaGFuZ2VHZW5lcmF0aW9uKHRydWUpO1xuICAgIH0sXG4gICAgY2hhbmdlR2VuZXJhdGlvbjogZnVuY3Rpb24oZm9yY2VTcGxpdCkge1xuICAgICAgaWYgKGZvcmNlU3BsaXQpXG4gICAgICAgIHRoaXMuaGlzdG9yeS5sYXN0T3AgPSB0aGlzLmhpc3RvcnkubGFzdFNlbE9wID0gdGhpcy5oaXN0b3J5Lmxhc3RPcmlnaW4gPSBudWxsO1xuICAgICAgcmV0dXJuIHRoaXMuaGlzdG9yeS5nZW5lcmF0aW9uO1xuICAgIH0sXG4gICAgaXNDbGVhbjogZnVuY3Rpb24gKGdlbikge1xuICAgICAgcmV0dXJuIHRoaXMuaGlzdG9yeS5nZW5lcmF0aW9uID09IChnZW4gfHwgdGhpcy5jbGVhbkdlbmVyYXRpb24pO1xuICAgIH0sXG5cbiAgICBnZXRIaXN0b3J5OiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB7ZG9uZTogY29weUhpc3RvcnlBcnJheSh0aGlzLmhpc3RvcnkuZG9uZSksXG4gICAgICAgICAgICAgIHVuZG9uZTogY29weUhpc3RvcnlBcnJheSh0aGlzLmhpc3RvcnkudW5kb25lKX07XG4gICAgfSxcbiAgICBzZXRIaXN0b3J5OiBmdW5jdGlvbihoaXN0RGF0YSkge1xuICAgICAgdmFyIGhpc3QgPSB0aGlzLmhpc3RvcnkgPSBuZXcgSGlzdG9yeSh0aGlzLmhpc3RvcnkubWF4R2VuZXJhdGlvbik7XG4gICAgICBoaXN0LmRvbmUgPSBjb3B5SGlzdG9yeUFycmF5KGhpc3REYXRhLmRvbmUuc2xpY2UoMCksIG51bGwsIHRydWUpO1xuICAgICAgaGlzdC51bmRvbmUgPSBjb3B5SGlzdG9yeUFycmF5KGhpc3REYXRhLnVuZG9uZS5zbGljZSgwKSwgbnVsbCwgdHJ1ZSk7XG4gICAgfSxcblxuICAgIGFkZExpbmVDbGFzczogZG9jTWV0aG9kT3AoZnVuY3Rpb24oaGFuZGxlLCB3aGVyZSwgY2xzKSB7XG4gICAgICByZXR1cm4gY2hhbmdlTGluZSh0aGlzLCBoYW5kbGUsIHdoZXJlID09IFwiZ3V0dGVyXCIgPyBcImd1dHRlclwiIDogXCJjbGFzc1wiLCBmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgIHZhciBwcm9wID0gd2hlcmUgPT0gXCJ0ZXh0XCIgPyBcInRleHRDbGFzc1wiXG4gICAgICAgICAgICAgICAgIDogd2hlcmUgPT0gXCJiYWNrZ3JvdW5kXCIgPyBcImJnQ2xhc3NcIlxuICAgICAgICAgICAgICAgICA6IHdoZXJlID09IFwiZ3V0dGVyXCIgPyBcImd1dHRlckNsYXNzXCIgOiBcIndyYXBDbGFzc1wiO1xuICAgICAgICBpZiAoIWxpbmVbcHJvcF0pIGxpbmVbcHJvcF0gPSBjbHM7XG4gICAgICAgIGVsc2UgaWYgKGNsYXNzVGVzdChjbHMpLnRlc3QobGluZVtwcm9wXSkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgZWxzZSBsaW5lW3Byb3BdICs9IFwiIFwiICsgY2xzO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0pO1xuICAgIH0pLFxuICAgIHJlbW92ZUxpbmVDbGFzczogZG9jTWV0aG9kT3AoZnVuY3Rpb24oaGFuZGxlLCB3aGVyZSwgY2xzKSB7XG4gICAgICByZXR1cm4gY2hhbmdlTGluZSh0aGlzLCBoYW5kbGUsIHdoZXJlID09IFwiZ3V0dGVyXCIgPyBcImd1dHRlclwiIDogXCJjbGFzc1wiLCBmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgIHZhciBwcm9wID0gd2hlcmUgPT0gXCJ0ZXh0XCIgPyBcInRleHRDbGFzc1wiXG4gICAgICAgICAgICAgICAgIDogd2hlcmUgPT0gXCJiYWNrZ3JvdW5kXCIgPyBcImJnQ2xhc3NcIlxuICAgICAgICAgICAgICAgICA6IHdoZXJlID09IFwiZ3V0dGVyXCIgPyBcImd1dHRlckNsYXNzXCIgOiBcIndyYXBDbGFzc1wiO1xuICAgICAgICB2YXIgY3VyID0gbGluZVtwcm9wXTtcbiAgICAgICAgaWYgKCFjdXIpIHJldHVybiBmYWxzZTtcbiAgICAgICAgZWxzZSBpZiAoY2xzID09IG51bGwpIGxpbmVbcHJvcF0gPSBudWxsO1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICB2YXIgZm91bmQgPSBjdXIubWF0Y2goY2xhc3NUZXN0KGNscykpO1xuICAgICAgICAgIGlmICghZm91bmQpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB2YXIgZW5kID0gZm91bmQuaW5kZXggKyBmb3VuZFswXS5sZW5ndGg7XG4gICAgICAgICAgbGluZVtwcm9wXSA9IGN1ci5zbGljZSgwLCBmb3VuZC5pbmRleCkgKyAoIWZvdW5kLmluZGV4IHx8IGVuZCA9PSBjdXIubGVuZ3RoID8gXCJcIiA6IFwiIFwiKSArIGN1ci5zbGljZShlbmQpIHx8IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9KTtcbiAgICB9KSxcblxuICAgIGFkZExpbmVXaWRnZXQ6IGRvY01ldGhvZE9wKGZ1bmN0aW9uKGhhbmRsZSwgbm9kZSwgb3B0aW9ucykge1xuICAgICAgcmV0dXJuIGFkZExpbmVXaWRnZXQodGhpcywgaGFuZGxlLCBub2RlLCBvcHRpb25zKTtcbiAgICB9KSxcbiAgICByZW1vdmVMaW5lV2lkZ2V0OiBmdW5jdGlvbih3aWRnZXQpIHsgd2lkZ2V0LmNsZWFyKCk7IH0sXG5cbiAgICBtYXJrVGV4dDogZnVuY3Rpb24oZnJvbSwgdG8sIG9wdGlvbnMpIHtcbiAgICAgIHJldHVybiBtYXJrVGV4dCh0aGlzLCBjbGlwUG9zKHRoaXMsIGZyb20pLCBjbGlwUG9zKHRoaXMsIHRvKSwgb3B0aW9ucywgb3B0aW9ucyAmJiBvcHRpb25zLnR5cGUgfHwgXCJyYW5nZVwiKTtcbiAgICB9LFxuICAgIHNldEJvb2ttYXJrOiBmdW5jdGlvbihwb3MsIG9wdGlvbnMpIHtcbiAgICAgIHZhciByZWFsT3B0cyA9IHtyZXBsYWNlZFdpdGg6IG9wdGlvbnMgJiYgKG9wdGlvbnMubm9kZVR5cGUgPT0gbnVsbCA/IG9wdGlvbnMud2lkZ2V0IDogb3B0aW9ucyksXG4gICAgICAgICAgICAgICAgICAgICAgaW5zZXJ0TGVmdDogb3B0aW9ucyAmJiBvcHRpb25zLmluc2VydExlZnQsXG4gICAgICAgICAgICAgICAgICAgICAgY2xlYXJXaGVuRW1wdHk6IGZhbHNlLCBzaGFyZWQ6IG9wdGlvbnMgJiYgb3B0aW9ucy5zaGFyZWQsXG4gICAgICAgICAgICAgICAgICAgICAgaGFuZGxlTW91c2VFdmVudHM6IG9wdGlvbnMgJiYgb3B0aW9ucy5oYW5kbGVNb3VzZUV2ZW50c307XG4gICAgICBwb3MgPSBjbGlwUG9zKHRoaXMsIHBvcyk7XG4gICAgICByZXR1cm4gbWFya1RleHQodGhpcywgcG9zLCBwb3MsIHJlYWxPcHRzLCBcImJvb2ttYXJrXCIpO1xuICAgIH0sXG4gICAgZmluZE1hcmtzQXQ6IGZ1bmN0aW9uKHBvcykge1xuICAgICAgcG9zID0gY2xpcFBvcyh0aGlzLCBwb3MpO1xuICAgICAgdmFyIG1hcmtlcnMgPSBbXSwgc3BhbnMgPSBnZXRMaW5lKHRoaXMsIHBvcy5saW5lKS5tYXJrZWRTcGFucztcbiAgICAgIGlmIChzcGFucykgZm9yICh2YXIgaSA9IDA7IGkgPCBzcGFucy5sZW5ndGg7ICsraSkge1xuICAgICAgICB2YXIgc3BhbiA9IHNwYW5zW2ldO1xuICAgICAgICBpZiAoKHNwYW4uZnJvbSA9PSBudWxsIHx8IHNwYW4uZnJvbSA8PSBwb3MuY2gpICYmXG4gICAgICAgICAgICAoc3Bhbi50byA9PSBudWxsIHx8IHNwYW4udG8gPj0gcG9zLmNoKSlcbiAgICAgICAgICBtYXJrZXJzLnB1c2goc3Bhbi5tYXJrZXIucGFyZW50IHx8IHNwYW4ubWFya2VyKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBtYXJrZXJzO1xuICAgIH0sXG4gICAgZmluZE1hcmtzOiBmdW5jdGlvbihmcm9tLCB0bywgZmlsdGVyKSB7XG4gICAgICBmcm9tID0gY2xpcFBvcyh0aGlzLCBmcm9tKTsgdG8gPSBjbGlwUG9zKHRoaXMsIHRvKTtcbiAgICAgIHZhciBmb3VuZCA9IFtdLCBsaW5lTm8gPSBmcm9tLmxpbmU7XG4gICAgICB0aGlzLml0ZXIoZnJvbS5saW5lLCB0by5saW5lICsgMSwgZnVuY3Rpb24obGluZSkge1xuICAgICAgICB2YXIgc3BhbnMgPSBsaW5lLm1hcmtlZFNwYW5zO1xuICAgICAgICBpZiAoc3BhbnMpIGZvciAodmFyIGkgPSAwOyBpIDwgc3BhbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICB2YXIgc3BhbiA9IHNwYW5zW2ldO1xuICAgICAgICAgIGlmICghKGxpbmVObyA9PSBmcm9tLmxpbmUgJiYgZnJvbS5jaCA+IHNwYW4udG8gfHxcbiAgICAgICAgICAgICAgICBzcGFuLmZyb20gPT0gbnVsbCAmJiBsaW5lTm8gIT0gZnJvbS5saW5lfHxcbiAgICAgICAgICAgICAgICBsaW5lTm8gPT0gdG8ubGluZSAmJiBzcGFuLmZyb20gPiB0by5jaCkgJiZcbiAgICAgICAgICAgICAgKCFmaWx0ZXIgfHwgZmlsdGVyKHNwYW4ubWFya2VyKSkpXG4gICAgICAgICAgICBmb3VuZC5wdXNoKHNwYW4ubWFya2VyLnBhcmVudCB8fCBzcGFuLm1hcmtlcik7XG4gICAgICAgIH1cbiAgICAgICAgKytsaW5lTm87XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBmb3VuZDtcbiAgICB9LFxuICAgIGdldEFsbE1hcmtzOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBtYXJrZXJzID0gW107XG4gICAgICB0aGlzLml0ZXIoZnVuY3Rpb24obGluZSkge1xuICAgICAgICB2YXIgc3BzID0gbGluZS5tYXJrZWRTcGFucztcbiAgICAgICAgaWYgKHNwcykgZm9yICh2YXIgaSA9IDA7IGkgPCBzcHMubGVuZ3RoOyArK2kpXG4gICAgICAgICAgaWYgKHNwc1tpXS5mcm9tICE9IG51bGwpIG1hcmtlcnMucHVzaChzcHNbaV0ubWFya2VyKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIG1hcmtlcnM7XG4gICAgfSxcblxuICAgIHBvc0Zyb21JbmRleDogZnVuY3Rpb24ob2ZmKSB7XG4gICAgICB2YXIgY2gsIGxpbmVObyA9IHRoaXMuZmlyc3Q7XG4gICAgICB0aGlzLml0ZXIoZnVuY3Rpb24obGluZSkge1xuICAgICAgICB2YXIgc3ogPSBsaW5lLnRleHQubGVuZ3RoICsgMTtcbiAgICAgICAgaWYgKHN6ID4gb2ZmKSB7IGNoID0gb2ZmOyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICBvZmYgLT0gc3o7XG4gICAgICAgICsrbGluZU5vO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gY2xpcFBvcyh0aGlzLCBQb3MobGluZU5vLCBjaCkpO1xuICAgIH0sXG4gICAgaW5kZXhGcm9tUG9zOiBmdW5jdGlvbiAoY29vcmRzKSB7XG4gICAgICBjb29yZHMgPSBjbGlwUG9zKHRoaXMsIGNvb3Jkcyk7XG4gICAgICB2YXIgaW5kZXggPSBjb29yZHMuY2g7XG4gICAgICBpZiAoY29vcmRzLmxpbmUgPCB0aGlzLmZpcnN0IHx8IGNvb3Jkcy5jaCA8IDApIHJldHVybiAwO1xuICAgICAgdGhpcy5pdGVyKHRoaXMuZmlyc3QsIGNvb3Jkcy5saW5lLCBmdW5jdGlvbiAobGluZSkge1xuICAgICAgICBpbmRleCArPSBsaW5lLnRleHQubGVuZ3RoICsgMTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGluZGV4O1xuICAgIH0sXG5cbiAgICBjb3B5OiBmdW5jdGlvbihjb3B5SGlzdG9yeSkge1xuICAgICAgdmFyIGRvYyA9IG5ldyBEb2MoZ2V0TGluZXModGhpcywgdGhpcy5maXJzdCwgdGhpcy5maXJzdCArIHRoaXMuc2l6ZSksXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1vZGVPcHRpb24sIHRoaXMuZmlyc3QsIHRoaXMubGluZVNlcCk7XG4gICAgICBkb2Muc2Nyb2xsVG9wID0gdGhpcy5zY3JvbGxUb3A7IGRvYy5zY3JvbGxMZWZ0ID0gdGhpcy5zY3JvbGxMZWZ0O1xuICAgICAgZG9jLnNlbCA9IHRoaXMuc2VsO1xuICAgICAgZG9jLmV4dGVuZCA9IGZhbHNlO1xuICAgICAgaWYgKGNvcHlIaXN0b3J5KSB7XG4gICAgICAgIGRvYy5oaXN0b3J5LnVuZG9EZXB0aCA9IHRoaXMuaGlzdG9yeS51bmRvRGVwdGg7XG4gICAgICAgIGRvYy5zZXRIaXN0b3J5KHRoaXMuZ2V0SGlzdG9yeSgpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBkb2M7XG4gICAgfSxcblxuICAgIGxpbmtlZERvYzogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgaWYgKCFvcHRpb25zKSBvcHRpb25zID0ge307XG4gICAgICB2YXIgZnJvbSA9IHRoaXMuZmlyc3QsIHRvID0gdGhpcy5maXJzdCArIHRoaXMuc2l6ZTtcbiAgICAgIGlmIChvcHRpb25zLmZyb20gIT0gbnVsbCAmJiBvcHRpb25zLmZyb20gPiBmcm9tKSBmcm9tID0gb3B0aW9ucy5mcm9tO1xuICAgICAgaWYgKG9wdGlvbnMudG8gIT0gbnVsbCAmJiBvcHRpb25zLnRvIDwgdG8pIHRvID0gb3B0aW9ucy50bztcbiAgICAgIHZhciBjb3B5ID0gbmV3IERvYyhnZXRMaW5lcyh0aGlzLCBmcm9tLCB0byksIG9wdGlvbnMubW9kZSB8fCB0aGlzLm1vZGVPcHRpb24sIGZyb20sIHRoaXMubGluZVNlcCk7XG4gICAgICBpZiAob3B0aW9ucy5zaGFyZWRIaXN0KSBjb3B5Lmhpc3RvcnkgPSB0aGlzLmhpc3Rvcnk7XG4gICAgICAodGhpcy5saW5rZWQgfHwgKHRoaXMubGlua2VkID0gW10pKS5wdXNoKHtkb2M6IGNvcHksIHNoYXJlZEhpc3Q6IG9wdGlvbnMuc2hhcmVkSGlzdH0pO1xuICAgICAgY29weS5saW5rZWQgPSBbe2RvYzogdGhpcywgaXNQYXJlbnQ6IHRydWUsIHNoYXJlZEhpc3Q6IG9wdGlvbnMuc2hhcmVkSGlzdH1dO1xuICAgICAgY29weVNoYXJlZE1hcmtlcnMoY29weSwgZmluZFNoYXJlZE1hcmtlcnModGhpcykpO1xuICAgICAgcmV0dXJuIGNvcHk7XG4gICAgfSxcbiAgICB1bmxpbmtEb2M6IGZ1bmN0aW9uKG90aGVyKSB7XG4gICAgICBpZiAob3RoZXIgaW5zdGFuY2VvZiBDb2RlTWlycm9yKSBvdGhlciA9IG90aGVyLmRvYztcbiAgICAgIGlmICh0aGlzLmxpbmtlZCkgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxpbmtlZC5sZW5ndGg7ICsraSkge1xuICAgICAgICB2YXIgbGluayA9IHRoaXMubGlua2VkW2ldO1xuICAgICAgICBpZiAobGluay5kb2MgIT0gb3RoZXIpIGNvbnRpbnVlO1xuICAgICAgICB0aGlzLmxpbmtlZC5zcGxpY2UoaSwgMSk7XG4gICAgICAgIG90aGVyLnVubGlua0RvYyh0aGlzKTtcbiAgICAgICAgZGV0YWNoU2hhcmVkTWFya2VycyhmaW5kU2hhcmVkTWFya2Vycyh0aGlzKSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgLy8gSWYgdGhlIGhpc3RvcmllcyB3ZXJlIHNoYXJlZCwgc3BsaXQgdGhlbSBhZ2FpblxuICAgICAgaWYgKG90aGVyLmhpc3RvcnkgPT0gdGhpcy5oaXN0b3J5KSB7XG4gICAgICAgIHZhciBzcGxpdElkcyA9IFtvdGhlci5pZF07XG4gICAgICAgIGxpbmtlZERvY3Mob3RoZXIsIGZ1bmN0aW9uKGRvYykge3NwbGl0SWRzLnB1c2goZG9jLmlkKTt9LCB0cnVlKTtcbiAgICAgICAgb3RoZXIuaGlzdG9yeSA9IG5ldyBIaXN0b3J5KG51bGwpO1xuICAgICAgICBvdGhlci5oaXN0b3J5LmRvbmUgPSBjb3B5SGlzdG9yeUFycmF5KHRoaXMuaGlzdG9yeS5kb25lLCBzcGxpdElkcyk7XG4gICAgICAgIG90aGVyLmhpc3RvcnkudW5kb25lID0gY29weUhpc3RvcnlBcnJheSh0aGlzLmhpc3RvcnkudW5kb25lLCBzcGxpdElkcyk7XG4gICAgICB9XG4gICAgfSxcbiAgICBpdGVyTGlua2VkRG9jczogZnVuY3Rpb24oZikge2xpbmtlZERvY3ModGhpcywgZik7fSxcblxuICAgIGdldE1vZGU6IGZ1bmN0aW9uKCkge3JldHVybiB0aGlzLm1vZGU7fSxcbiAgICBnZXRFZGl0b3I6IGZ1bmN0aW9uKCkge3JldHVybiB0aGlzLmNtO30sXG5cbiAgICBzcGxpdExpbmVzOiBmdW5jdGlvbihzdHIpIHtcbiAgICAgIGlmICh0aGlzLmxpbmVTZXApIHJldHVybiBzdHIuc3BsaXQodGhpcy5saW5lU2VwKTtcbiAgICAgIHJldHVybiBzcGxpdExpbmVzQXV0byhzdHIpO1xuICAgIH0sXG4gICAgbGluZVNlcGFyYXRvcjogZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLmxpbmVTZXAgfHwgXCJcXG5cIjsgfVxuICB9KTtcblxuICAvLyBQdWJsaWMgYWxpYXMuXG4gIERvYy5wcm90b3R5cGUuZWFjaExpbmUgPSBEb2MucHJvdG90eXBlLml0ZXI7XG5cbiAgLy8gU2V0IHVwIG1ldGhvZHMgb24gQ29kZU1pcnJvcidzIHByb3RvdHlwZSB0byByZWRpcmVjdCB0byB0aGUgZWRpdG9yJ3MgZG9jdW1lbnQuXG4gIHZhciBkb250RGVsZWdhdGUgPSBcIml0ZXIgaW5zZXJ0IHJlbW92ZSBjb3B5IGdldEVkaXRvciBjb25zdHJ1Y3RvclwiLnNwbGl0KFwiIFwiKTtcbiAgZm9yICh2YXIgcHJvcCBpbiBEb2MucHJvdG90eXBlKSBpZiAoRG9jLnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eShwcm9wKSAmJiBpbmRleE9mKGRvbnREZWxlZ2F0ZSwgcHJvcCkgPCAwKVxuICAgIENvZGVNaXJyb3IucHJvdG90eXBlW3Byb3BdID0gKGZ1bmN0aW9uKG1ldGhvZCkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge3JldHVybiBtZXRob2QuYXBwbHkodGhpcy5kb2MsIGFyZ3VtZW50cyk7fTtcbiAgICB9KShEb2MucHJvdG90eXBlW3Byb3BdKTtcblxuICBldmVudE1peGluKERvYyk7XG5cbiAgLy8gQ2FsbCBmIGZvciBhbGwgbGlua2VkIGRvY3VtZW50cy5cbiAgZnVuY3Rpb24gbGlua2VkRG9jcyhkb2MsIGYsIHNoYXJlZEhpc3RPbmx5KSB7XG4gICAgZnVuY3Rpb24gcHJvcGFnYXRlKGRvYywgc2tpcCwgc2hhcmVkSGlzdCkge1xuICAgICAgaWYgKGRvYy5saW5rZWQpIGZvciAodmFyIGkgPSAwOyBpIDwgZG9jLmxpbmtlZC5sZW5ndGg7ICsraSkge1xuICAgICAgICB2YXIgcmVsID0gZG9jLmxpbmtlZFtpXTtcbiAgICAgICAgaWYgKHJlbC5kb2MgPT0gc2tpcCkgY29udGludWU7XG4gICAgICAgIHZhciBzaGFyZWQgPSBzaGFyZWRIaXN0ICYmIHJlbC5zaGFyZWRIaXN0O1xuICAgICAgICBpZiAoc2hhcmVkSGlzdE9ubHkgJiYgIXNoYXJlZCkgY29udGludWU7XG4gICAgICAgIGYocmVsLmRvYywgc2hhcmVkKTtcbiAgICAgICAgcHJvcGFnYXRlKHJlbC5kb2MsIGRvYywgc2hhcmVkKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcHJvcGFnYXRlKGRvYywgbnVsbCwgdHJ1ZSk7XG4gIH1cblxuICAvLyBBdHRhY2ggYSBkb2N1bWVudCB0byBhbiBlZGl0b3IuXG4gIGZ1bmN0aW9uIGF0dGFjaERvYyhjbSwgZG9jKSB7XG4gICAgaWYgKGRvYy5jbSkgdGhyb3cgbmV3IEVycm9yKFwiVGhpcyBkb2N1bWVudCBpcyBhbHJlYWR5IGluIHVzZS5cIik7XG4gICAgY20uZG9jID0gZG9jO1xuICAgIGRvYy5jbSA9IGNtO1xuICAgIGVzdGltYXRlTGluZUhlaWdodHMoY20pO1xuICAgIGxvYWRNb2RlKGNtKTtcbiAgICBpZiAoIWNtLm9wdGlvbnMubGluZVdyYXBwaW5nKSBmaW5kTWF4TGluZShjbSk7XG4gICAgY20ub3B0aW9ucy5tb2RlID0gZG9jLm1vZGVPcHRpb247XG4gICAgcmVnQ2hhbmdlKGNtKTtcbiAgfVxuXG4gIC8vIExJTkUgVVRJTElUSUVTXG5cbiAgLy8gRmluZCB0aGUgbGluZSBvYmplY3QgY29ycmVzcG9uZGluZyB0byB0aGUgZ2l2ZW4gbGluZSBudW1iZXIuXG4gIGZ1bmN0aW9uIGdldExpbmUoZG9jLCBuKSB7XG4gICAgbiAtPSBkb2MuZmlyc3Q7XG4gICAgaWYgKG4gPCAwIHx8IG4gPj0gZG9jLnNpemUpIHRocm93IG5ldyBFcnJvcihcIlRoZXJlIGlzIG5vIGxpbmUgXCIgKyAobiArIGRvYy5maXJzdCkgKyBcIiBpbiB0aGUgZG9jdW1lbnQuXCIpO1xuICAgIGZvciAodmFyIGNodW5rID0gZG9jOyAhY2h1bmsubGluZXM7KSB7XG4gICAgICBmb3IgKHZhciBpID0gMDs7ICsraSkge1xuICAgICAgICB2YXIgY2hpbGQgPSBjaHVuay5jaGlsZHJlbltpXSwgc3ogPSBjaGlsZC5jaHVua1NpemUoKTtcbiAgICAgICAgaWYgKG4gPCBzeikgeyBjaHVuayA9IGNoaWxkOyBicmVhazsgfVxuICAgICAgICBuIC09IHN6O1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY2h1bmsubGluZXNbbl07XG4gIH1cblxuICAvLyBHZXQgdGhlIHBhcnQgb2YgYSBkb2N1bWVudCBiZXR3ZWVuIHR3byBwb3NpdGlvbnMsIGFzIGFuIGFycmF5IG9mXG4gIC8vIHN0cmluZ3MuXG4gIGZ1bmN0aW9uIGdldEJldHdlZW4oZG9jLCBzdGFydCwgZW5kKSB7XG4gICAgdmFyIG91dCA9IFtdLCBuID0gc3RhcnQubGluZTtcbiAgICBkb2MuaXRlcihzdGFydC5saW5lLCBlbmQubGluZSArIDEsIGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgIHZhciB0ZXh0ID0gbGluZS50ZXh0O1xuICAgICAgaWYgKG4gPT0gZW5kLmxpbmUpIHRleHQgPSB0ZXh0LnNsaWNlKDAsIGVuZC5jaCk7XG4gICAgICBpZiAobiA9PSBzdGFydC5saW5lKSB0ZXh0ID0gdGV4dC5zbGljZShzdGFydC5jaCk7XG4gICAgICBvdXQucHVzaCh0ZXh0KTtcbiAgICAgICsrbjtcbiAgICB9KTtcbiAgICByZXR1cm4gb3V0O1xuICB9XG4gIC8vIEdldCB0aGUgbGluZXMgYmV0d2VlbiBmcm9tIGFuZCB0bywgYXMgYXJyYXkgb2Ygc3RyaW5ncy5cbiAgZnVuY3Rpb24gZ2V0TGluZXMoZG9jLCBmcm9tLCB0bykge1xuICAgIHZhciBvdXQgPSBbXTtcbiAgICBkb2MuaXRlcihmcm9tLCB0bywgZnVuY3Rpb24obGluZSkgeyBvdXQucHVzaChsaW5lLnRleHQpOyB9KTtcbiAgICByZXR1cm4gb3V0O1xuICB9XG5cbiAgLy8gVXBkYXRlIHRoZSBoZWlnaHQgb2YgYSBsaW5lLCBwcm9wYWdhdGluZyB0aGUgaGVpZ2h0IGNoYW5nZVxuICAvLyB1cHdhcmRzIHRvIHBhcmVudCBub2Rlcy5cbiAgZnVuY3Rpb24gdXBkYXRlTGluZUhlaWdodChsaW5lLCBoZWlnaHQpIHtcbiAgICB2YXIgZGlmZiA9IGhlaWdodCAtIGxpbmUuaGVpZ2h0O1xuICAgIGlmIChkaWZmKSBmb3IgKHZhciBuID0gbGluZTsgbjsgbiA9IG4ucGFyZW50KSBuLmhlaWdodCArPSBkaWZmO1xuICB9XG5cbiAgLy8gR2l2ZW4gYSBsaW5lIG9iamVjdCwgZmluZCBpdHMgbGluZSBudW1iZXIgYnkgd2Fsa2luZyB1cCB0aHJvdWdoXG4gIC8vIGl0cyBwYXJlbnQgbGlua3MuXG4gIGZ1bmN0aW9uIGxpbmVObyhsaW5lKSB7XG4gICAgaWYgKGxpbmUucGFyZW50ID09IG51bGwpIHJldHVybiBudWxsO1xuICAgIHZhciBjdXIgPSBsaW5lLnBhcmVudCwgbm8gPSBpbmRleE9mKGN1ci5saW5lcywgbGluZSk7XG4gICAgZm9yICh2YXIgY2h1bmsgPSBjdXIucGFyZW50OyBjaHVuazsgY3VyID0gY2h1bmssIGNodW5rID0gY2h1bmsucGFyZW50KSB7XG4gICAgICBmb3IgKHZhciBpID0gMDs7ICsraSkge1xuICAgICAgICBpZiAoY2h1bmsuY2hpbGRyZW5baV0gPT0gY3VyKSBicmVhaztcbiAgICAgICAgbm8gKz0gY2h1bmsuY2hpbGRyZW5baV0uY2h1bmtTaXplKCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBubyArIGN1ci5maXJzdDtcbiAgfVxuXG4gIC8vIEZpbmQgdGhlIGxpbmUgYXQgdGhlIGdpdmVuIHZlcnRpY2FsIHBvc2l0aW9uLCB1c2luZyB0aGUgaGVpZ2h0XG4gIC8vIGluZm9ybWF0aW9uIGluIHRoZSBkb2N1bWVudCB0cmVlLlxuICBmdW5jdGlvbiBsaW5lQXRIZWlnaHQoY2h1bmssIGgpIHtcbiAgICB2YXIgbiA9IGNodW5rLmZpcnN0O1xuICAgIG91dGVyOiBkbyB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNodW5rLmNoaWxkcmVuLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHZhciBjaGlsZCA9IGNodW5rLmNoaWxkcmVuW2ldLCBjaCA9IGNoaWxkLmhlaWdodDtcbiAgICAgICAgaWYgKGggPCBjaCkgeyBjaHVuayA9IGNoaWxkOyBjb250aW51ZSBvdXRlcjsgfVxuICAgICAgICBoIC09IGNoO1xuICAgICAgICBuICs9IGNoaWxkLmNodW5rU2l6ZSgpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG47XG4gICAgfSB3aGlsZSAoIWNodW5rLmxpbmVzKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNodW5rLmxpbmVzLmxlbmd0aDsgKytpKSB7XG4gICAgICB2YXIgbGluZSA9IGNodW5rLmxpbmVzW2ldLCBsaCA9IGxpbmUuaGVpZ2h0O1xuICAgICAgaWYgKGggPCBsaCkgYnJlYWs7XG4gICAgICBoIC09IGxoO1xuICAgIH1cbiAgICByZXR1cm4gbiArIGk7XG4gIH1cblxuXG4gIC8vIEZpbmQgdGhlIGhlaWdodCBhYm92ZSB0aGUgZ2l2ZW4gbGluZS5cbiAgZnVuY3Rpb24gaGVpZ2h0QXRMaW5lKGxpbmVPYmopIHtcbiAgICBsaW5lT2JqID0gdmlzdWFsTGluZShsaW5lT2JqKTtcblxuICAgIHZhciBoID0gMCwgY2h1bmsgPSBsaW5lT2JqLnBhcmVudDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNodW5rLmxpbmVzLmxlbmd0aDsgKytpKSB7XG4gICAgICB2YXIgbGluZSA9IGNodW5rLmxpbmVzW2ldO1xuICAgICAgaWYgKGxpbmUgPT0gbGluZU9iaikgYnJlYWs7XG4gICAgICBlbHNlIGggKz0gbGluZS5oZWlnaHQ7XG4gICAgfVxuICAgIGZvciAodmFyIHAgPSBjaHVuay5wYXJlbnQ7IHA7IGNodW5rID0gcCwgcCA9IGNodW5rLnBhcmVudCkge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwLmNoaWxkcmVuLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHZhciBjdXIgPSBwLmNoaWxkcmVuW2ldO1xuICAgICAgICBpZiAoY3VyID09IGNodW5rKSBicmVhaztcbiAgICAgICAgZWxzZSBoICs9IGN1ci5oZWlnaHQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBoO1xuICB9XG5cbiAgLy8gR2V0IHRoZSBiaWRpIG9yZGVyaW5nIGZvciB0aGUgZ2l2ZW4gbGluZSAoYW5kIGNhY2hlIGl0KS4gUmV0dXJuc1xuICAvLyBmYWxzZSBmb3IgbGluZXMgdGhhdCBhcmUgZnVsbHkgbGVmdC10by1yaWdodCwgYW5kIGFuIGFycmF5IG9mXG4gIC8vIEJpZGlTcGFuIG9iamVjdHMgb3RoZXJ3aXNlLlxuICBmdW5jdGlvbiBnZXRPcmRlcihsaW5lKSB7XG4gICAgdmFyIG9yZGVyID0gbGluZS5vcmRlcjtcbiAgICBpZiAob3JkZXIgPT0gbnVsbCkgb3JkZXIgPSBsaW5lLm9yZGVyID0gYmlkaU9yZGVyaW5nKGxpbmUudGV4dCk7XG4gICAgcmV0dXJuIG9yZGVyO1xuICB9XG5cbiAgLy8gSElTVE9SWVxuXG4gIGZ1bmN0aW9uIEhpc3Rvcnkoc3RhcnRHZW4pIHtcbiAgICAvLyBBcnJheXMgb2YgY2hhbmdlIGV2ZW50cyBhbmQgc2VsZWN0aW9ucy4gRG9pbmcgc29tZXRoaW5nIGFkZHMgYW5cbiAgICAvLyBldmVudCB0byBkb25lIGFuZCBjbGVhcnMgdW5kby4gVW5kb2luZyBtb3ZlcyBldmVudHMgZnJvbSBkb25lXG4gICAgLy8gdG8gdW5kb25lLCByZWRvaW5nIG1vdmVzIHRoZW0gaW4gdGhlIG90aGVyIGRpcmVjdGlvbi5cbiAgICB0aGlzLmRvbmUgPSBbXTsgdGhpcy51bmRvbmUgPSBbXTtcbiAgICB0aGlzLnVuZG9EZXB0aCA9IEluZmluaXR5O1xuICAgIC8vIFVzZWQgdG8gdHJhY2sgd2hlbiBjaGFuZ2VzIGNhbiBiZSBtZXJnZWQgaW50byBhIHNpbmdsZSB1bmRvXG4gICAgLy8gZXZlbnRcbiAgICB0aGlzLmxhc3RNb2RUaW1lID0gdGhpcy5sYXN0U2VsVGltZSA9IDA7XG4gICAgdGhpcy5sYXN0T3AgPSB0aGlzLmxhc3RTZWxPcCA9IG51bGw7XG4gICAgdGhpcy5sYXN0T3JpZ2luID0gdGhpcy5sYXN0U2VsT3JpZ2luID0gbnVsbDtcbiAgICAvLyBVc2VkIGJ5IHRoZSBpc0NsZWFuKCkgbWV0aG9kXG4gICAgdGhpcy5nZW5lcmF0aW9uID0gdGhpcy5tYXhHZW5lcmF0aW9uID0gc3RhcnRHZW4gfHwgMTtcbiAgfVxuXG4gIC8vIENyZWF0ZSBhIGhpc3RvcnkgY2hhbmdlIGV2ZW50IGZyb20gYW4gdXBkYXRlRG9jLXN0eWxlIGNoYW5nZVxuICAvLyBvYmplY3QuXG4gIGZ1bmN0aW9uIGhpc3RvcnlDaGFuZ2VGcm9tQ2hhbmdlKGRvYywgY2hhbmdlKSB7XG4gICAgdmFyIGhpc3RDaGFuZ2UgPSB7ZnJvbTogY29weVBvcyhjaGFuZ2UuZnJvbSksIHRvOiBjaGFuZ2VFbmQoY2hhbmdlKSwgdGV4dDogZ2V0QmV0d2Vlbihkb2MsIGNoYW5nZS5mcm9tLCBjaGFuZ2UudG8pfTtcbiAgICBhdHRhY2hMb2NhbFNwYW5zKGRvYywgaGlzdENoYW5nZSwgY2hhbmdlLmZyb20ubGluZSwgY2hhbmdlLnRvLmxpbmUgKyAxKTtcbiAgICBsaW5rZWREb2NzKGRvYywgZnVuY3Rpb24oZG9jKSB7YXR0YWNoTG9jYWxTcGFucyhkb2MsIGhpc3RDaGFuZ2UsIGNoYW5nZS5mcm9tLmxpbmUsIGNoYW5nZS50by5saW5lICsgMSk7fSwgdHJ1ZSk7XG4gICAgcmV0dXJuIGhpc3RDaGFuZ2U7XG4gIH1cblxuICAvLyBQb3AgYWxsIHNlbGVjdGlvbiBldmVudHMgb2ZmIHRoZSBlbmQgb2YgYSBoaXN0b3J5IGFycmF5LiBTdG9wIGF0XG4gIC8vIGEgY2hhbmdlIGV2ZW50LlxuICBmdW5jdGlvbiBjbGVhclNlbGVjdGlvbkV2ZW50cyhhcnJheSkge1xuICAgIHdoaWxlIChhcnJheS5sZW5ndGgpIHtcbiAgICAgIHZhciBsYXN0ID0gbHN0KGFycmF5KTtcbiAgICAgIGlmIChsYXN0LnJhbmdlcykgYXJyYXkucG9wKCk7XG4gICAgICBlbHNlIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIC8vIEZpbmQgdGhlIHRvcCBjaGFuZ2UgZXZlbnQgaW4gdGhlIGhpc3RvcnkuIFBvcCBvZmYgc2VsZWN0aW9uXG4gIC8vIGV2ZW50cyB0aGF0IGFyZSBpbiB0aGUgd2F5LlxuICBmdW5jdGlvbiBsYXN0Q2hhbmdlRXZlbnQoaGlzdCwgZm9yY2UpIHtcbiAgICBpZiAoZm9yY2UpIHtcbiAgICAgIGNsZWFyU2VsZWN0aW9uRXZlbnRzKGhpc3QuZG9uZSk7XG4gICAgICByZXR1cm4gbHN0KGhpc3QuZG9uZSk7XG4gICAgfSBlbHNlIGlmIChoaXN0LmRvbmUubGVuZ3RoICYmICFsc3QoaGlzdC5kb25lKS5yYW5nZXMpIHtcbiAgICAgIHJldHVybiBsc3QoaGlzdC5kb25lKTtcbiAgICB9IGVsc2UgaWYgKGhpc3QuZG9uZS5sZW5ndGggPiAxICYmICFoaXN0LmRvbmVbaGlzdC5kb25lLmxlbmd0aCAtIDJdLnJhbmdlcykge1xuICAgICAgaGlzdC5kb25lLnBvcCgpO1xuICAgICAgcmV0dXJuIGxzdChoaXN0LmRvbmUpO1xuICAgIH1cbiAgfVxuXG4gIC8vIFJlZ2lzdGVyIGEgY2hhbmdlIGluIHRoZSBoaXN0b3J5LiBNZXJnZXMgY2hhbmdlcyB0aGF0IGFyZSB3aXRoaW5cbiAgLy8gYSBzaW5nbGUgb3BlcmF0aW9uLCBvcmUgYXJlIGNsb3NlIHRvZ2V0aGVyIHdpdGggYW4gb3JpZ2luIHRoYXRcbiAgLy8gYWxsb3dzIG1lcmdpbmcgKHN0YXJ0aW5nIHdpdGggXCIrXCIpIGludG8gYSBzaW5nbGUgZXZlbnQuXG4gIGZ1bmN0aW9uIGFkZENoYW5nZVRvSGlzdG9yeShkb2MsIGNoYW5nZSwgc2VsQWZ0ZXIsIG9wSWQpIHtcbiAgICB2YXIgaGlzdCA9IGRvYy5oaXN0b3J5O1xuICAgIGhpc3QudW5kb25lLmxlbmd0aCA9IDA7XG4gICAgdmFyIHRpbWUgPSArbmV3IERhdGUsIGN1cjtcblxuICAgIGlmICgoaGlzdC5sYXN0T3AgPT0gb3BJZCB8fFxuICAgICAgICAgaGlzdC5sYXN0T3JpZ2luID09IGNoYW5nZS5vcmlnaW4gJiYgY2hhbmdlLm9yaWdpbiAmJlxuICAgICAgICAgKChjaGFuZ2Uub3JpZ2luLmNoYXJBdCgwKSA9PSBcIitcIiAmJiBkb2MuY20gJiYgaGlzdC5sYXN0TW9kVGltZSA+IHRpbWUgLSBkb2MuY20ub3B0aW9ucy5oaXN0b3J5RXZlbnREZWxheSkgfHxcbiAgICAgICAgICBjaGFuZ2Uub3JpZ2luLmNoYXJBdCgwKSA9PSBcIipcIikpICYmXG4gICAgICAgIChjdXIgPSBsYXN0Q2hhbmdlRXZlbnQoaGlzdCwgaGlzdC5sYXN0T3AgPT0gb3BJZCkpKSB7XG4gICAgICAvLyBNZXJnZSB0aGlzIGNoYW5nZSBpbnRvIHRoZSBsYXN0IGV2ZW50XG4gICAgICB2YXIgbGFzdCA9IGxzdChjdXIuY2hhbmdlcyk7XG4gICAgICBpZiAoY21wKGNoYW5nZS5mcm9tLCBjaGFuZ2UudG8pID09IDAgJiYgY21wKGNoYW5nZS5mcm9tLCBsYXN0LnRvKSA9PSAwKSB7XG4gICAgICAgIC8vIE9wdGltaXplZCBjYXNlIGZvciBzaW1wbGUgaW5zZXJ0aW9uIC0tIGRvbid0IHdhbnQgdG8gYWRkXG4gICAgICAgIC8vIG5ldyBjaGFuZ2VzZXRzIGZvciBldmVyeSBjaGFyYWN0ZXIgdHlwZWRcbiAgICAgICAgbGFzdC50byA9IGNoYW5nZUVuZChjaGFuZ2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gQWRkIG5ldyBzdWItZXZlbnRcbiAgICAgICAgY3VyLmNoYW5nZXMucHVzaChoaXN0b3J5Q2hhbmdlRnJvbUNoYW5nZShkb2MsIGNoYW5nZSkpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBDYW4gbm90IGJlIG1lcmdlZCwgc3RhcnQgYSBuZXcgZXZlbnQuXG4gICAgICB2YXIgYmVmb3JlID0gbHN0KGhpc3QuZG9uZSk7XG4gICAgICBpZiAoIWJlZm9yZSB8fCAhYmVmb3JlLnJhbmdlcylcbiAgICAgICAgcHVzaFNlbGVjdGlvblRvSGlzdG9yeShkb2Muc2VsLCBoaXN0LmRvbmUpO1xuICAgICAgY3VyID0ge2NoYW5nZXM6IFtoaXN0b3J5Q2hhbmdlRnJvbUNoYW5nZShkb2MsIGNoYW5nZSldLFxuICAgICAgICAgICAgIGdlbmVyYXRpb246IGhpc3QuZ2VuZXJhdGlvbn07XG4gICAgICBoaXN0LmRvbmUucHVzaChjdXIpO1xuICAgICAgd2hpbGUgKGhpc3QuZG9uZS5sZW5ndGggPiBoaXN0LnVuZG9EZXB0aCkge1xuICAgICAgICBoaXN0LmRvbmUuc2hpZnQoKTtcbiAgICAgICAgaWYgKCFoaXN0LmRvbmVbMF0ucmFuZ2VzKSBoaXN0LmRvbmUuc2hpZnQoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaGlzdC5kb25lLnB1c2goc2VsQWZ0ZXIpO1xuICAgIGhpc3QuZ2VuZXJhdGlvbiA9ICsraGlzdC5tYXhHZW5lcmF0aW9uO1xuICAgIGhpc3QubGFzdE1vZFRpbWUgPSBoaXN0Lmxhc3RTZWxUaW1lID0gdGltZTtcbiAgICBoaXN0Lmxhc3RPcCA9IGhpc3QubGFzdFNlbE9wID0gb3BJZDtcbiAgICBoaXN0Lmxhc3RPcmlnaW4gPSBoaXN0Lmxhc3RTZWxPcmlnaW4gPSBjaGFuZ2Uub3JpZ2luO1xuXG4gICAgaWYgKCFsYXN0KSBzaWduYWwoZG9jLCBcImhpc3RvcnlBZGRlZFwiKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNlbGVjdGlvbkV2ZW50Q2FuQmVNZXJnZWQoZG9jLCBvcmlnaW4sIHByZXYsIHNlbCkge1xuICAgIHZhciBjaCA9IG9yaWdpbi5jaGFyQXQoMCk7XG4gICAgcmV0dXJuIGNoID09IFwiKlwiIHx8XG4gICAgICBjaCA9PSBcIitcIiAmJlxuICAgICAgcHJldi5yYW5nZXMubGVuZ3RoID09IHNlbC5yYW5nZXMubGVuZ3RoICYmXG4gICAgICBwcmV2LnNvbWV0aGluZ1NlbGVjdGVkKCkgPT0gc2VsLnNvbWV0aGluZ1NlbGVjdGVkKCkgJiZcbiAgICAgIG5ldyBEYXRlIC0gZG9jLmhpc3RvcnkubGFzdFNlbFRpbWUgPD0gKGRvYy5jbSA/IGRvYy5jbS5vcHRpb25zLmhpc3RvcnlFdmVudERlbGF5IDogNTAwKTtcbiAgfVxuXG4gIC8vIENhbGxlZCB3aGVuZXZlciB0aGUgc2VsZWN0aW9uIGNoYW5nZXMsIHNldHMgdGhlIG5ldyBzZWxlY3Rpb24gYXNcbiAgLy8gdGhlIHBlbmRpbmcgc2VsZWN0aW9uIGluIHRoZSBoaXN0b3J5LCBhbmQgcHVzaGVzIHRoZSBvbGQgcGVuZGluZ1xuICAvLyBzZWxlY3Rpb24gaW50byB0aGUgJ2RvbmUnIGFycmF5IHdoZW4gaXQgd2FzIHNpZ25pZmljYW50bHlcbiAgLy8gZGlmZmVyZW50IChpbiBudW1iZXIgb2Ygc2VsZWN0ZWQgcmFuZ2VzLCBlbXB0aW5lc3MsIG9yIHRpbWUpLlxuICBmdW5jdGlvbiBhZGRTZWxlY3Rpb25Ub0hpc3RvcnkoZG9jLCBzZWwsIG9wSWQsIG9wdGlvbnMpIHtcbiAgICB2YXIgaGlzdCA9IGRvYy5oaXN0b3J5LCBvcmlnaW4gPSBvcHRpb25zICYmIG9wdGlvbnMub3JpZ2luO1xuXG4gICAgLy8gQSBuZXcgZXZlbnQgaXMgc3RhcnRlZCB3aGVuIHRoZSBwcmV2aW91cyBvcmlnaW4gZG9lcyBub3QgbWF0Y2hcbiAgICAvLyB0aGUgY3VycmVudCwgb3IgdGhlIG9yaWdpbnMgZG9uJ3QgYWxsb3cgbWF0Y2hpbmcuIE9yaWdpbnNcbiAgICAvLyBzdGFydGluZyB3aXRoICogYXJlIGFsd2F5cyBtZXJnZWQsIHRob3NlIHN0YXJ0aW5nIHdpdGggKyBhcmVcbiAgICAvLyBtZXJnZWQgd2hlbiBzaW1pbGFyIGFuZCBjbG9zZSB0b2dldGhlciBpbiB0aW1lLlxuICAgIGlmIChvcElkID09IGhpc3QubGFzdFNlbE9wIHx8XG4gICAgICAgIChvcmlnaW4gJiYgaGlzdC5sYXN0U2VsT3JpZ2luID09IG9yaWdpbiAmJlxuICAgICAgICAgKGhpc3QubGFzdE1vZFRpbWUgPT0gaGlzdC5sYXN0U2VsVGltZSAmJiBoaXN0Lmxhc3RPcmlnaW4gPT0gb3JpZ2luIHx8XG4gICAgICAgICAgc2VsZWN0aW9uRXZlbnRDYW5CZU1lcmdlZChkb2MsIG9yaWdpbiwgbHN0KGhpc3QuZG9uZSksIHNlbCkpKSlcbiAgICAgIGhpc3QuZG9uZVtoaXN0LmRvbmUubGVuZ3RoIC0gMV0gPSBzZWw7XG4gICAgZWxzZVxuICAgICAgcHVzaFNlbGVjdGlvblRvSGlzdG9yeShzZWwsIGhpc3QuZG9uZSk7XG5cbiAgICBoaXN0Lmxhc3RTZWxUaW1lID0gK25ldyBEYXRlO1xuICAgIGhpc3QubGFzdFNlbE9yaWdpbiA9IG9yaWdpbjtcbiAgICBoaXN0Lmxhc3RTZWxPcCA9IG9wSWQ7XG4gICAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5jbGVhclJlZG8gIT09IGZhbHNlKVxuICAgICAgY2xlYXJTZWxlY3Rpb25FdmVudHMoaGlzdC51bmRvbmUpO1xuICB9XG5cbiAgZnVuY3Rpb24gcHVzaFNlbGVjdGlvblRvSGlzdG9yeShzZWwsIGRlc3QpIHtcbiAgICB2YXIgdG9wID0gbHN0KGRlc3QpO1xuICAgIGlmICghKHRvcCAmJiB0b3AucmFuZ2VzICYmIHRvcC5lcXVhbHMoc2VsKSkpXG4gICAgICBkZXN0LnB1c2goc2VsKTtcbiAgfVxuXG4gIC8vIFVzZWQgdG8gc3RvcmUgbWFya2VkIHNwYW4gaW5mb3JtYXRpb24gaW4gdGhlIGhpc3RvcnkuXG4gIGZ1bmN0aW9uIGF0dGFjaExvY2FsU3BhbnMoZG9jLCBjaGFuZ2UsIGZyb20sIHRvKSB7XG4gICAgdmFyIGV4aXN0aW5nID0gY2hhbmdlW1wic3BhbnNfXCIgKyBkb2MuaWRdLCBuID0gMDtcbiAgICBkb2MuaXRlcihNYXRoLm1heChkb2MuZmlyc3QsIGZyb20pLCBNYXRoLm1pbihkb2MuZmlyc3QgKyBkb2Muc2l6ZSwgdG8pLCBmdW5jdGlvbihsaW5lKSB7XG4gICAgICBpZiAobGluZS5tYXJrZWRTcGFucylcbiAgICAgICAgKGV4aXN0aW5nIHx8IChleGlzdGluZyA9IGNoYW5nZVtcInNwYW5zX1wiICsgZG9jLmlkXSA9IHt9KSlbbl0gPSBsaW5lLm1hcmtlZFNwYW5zO1xuICAgICAgKytuO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gV2hlbiB1bi9yZS1kb2luZyByZXN0b3JlcyB0ZXh0IGNvbnRhaW5pbmcgbWFya2VkIHNwYW5zLCB0aG9zZVxuICAvLyB0aGF0IGhhdmUgYmVlbiBleHBsaWNpdGx5IGNsZWFyZWQgc2hvdWxkIG5vdCBiZSByZXN0b3JlZC5cbiAgZnVuY3Rpb24gcmVtb3ZlQ2xlYXJlZFNwYW5zKHNwYW5zKSB7XG4gICAgaWYgKCFzcGFucykgcmV0dXJuIG51bGw7XG4gICAgZm9yICh2YXIgaSA9IDAsIG91dDsgaSA8IHNwYW5zLmxlbmd0aDsgKytpKSB7XG4gICAgICBpZiAoc3BhbnNbaV0ubWFya2VyLmV4cGxpY2l0bHlDbGVhcmVkKSB7IGlmICghb3V0KSBvdXQgPSBzcGFucy5zbGljZSgwLCBpKTsgfVxuICAgICAgZWxzZSBpZiAob3V0KSBvdXQucHVzaChzcGFuc1tpXSk7XG4gICAgfVxuICAgIHJldHVybiAhb3V0ID8gc3BhbnMgOiBvdXQubGVuZ3RoID8gb3V0IDogbnVsbDtcbiAgfVxuXG4gIC8vIFJldHJpZXZlIGFuZCBmaWx0ZXIgdGhlIG9sZCBtYXJrZWQgc3BhbnMgc3RvcmVkIGluIGEgY2hhbmdlIGV2ZW50LlxuICBmdW5jdGlvbiBnZXRPbGRTcGFucyhkb2MsIGNoYW5nZSkge1xuICAgIHZhciBmb3VuZCA9IGNoYW5nZVtcInNwYW5zX1wiICsgZG9jLmlkXTtcbiAgICBpZiAoIWZvdW5kKSByZXR1cm4gbnVsbDtcbiAgICBmb3IgKHZhciBpID0gMCwgbncgPSBbXTsgaSA8IGNoYW5nZS50ZXh0Lmxlbmd0aDsgKytpKVxuICAgICAgbncucHVzaChyZW1vdmVDbGVhcmVkU3BhbnMoZm91bmRbaV0pKTtcbiAgICByZXR1cm4gbnc7XG4gIH1cblxuICAvLyBVc2VkIGJvdGggdG8gcHJvdmlkZSBhIEpTT04tc2FmZSBvYmplY3QgaW4gLmdldEhpc3RvcnksIGFuZCwgd2hlblxuICAvLyBkZXRhY2hpbmcgYSBkb2N1bWVudCwgdG8gc3BsaXQgdGhlIGhpc3RvcnkgaW4gdHdvXG4gIGZ1bmN0aW9uIGNvcHlIaXN0b3J5QXJyYXkoZXZlbnRzLCBuZXdHcm91cCwgaW5zdGFudGlhdGVTZWwpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgY29weSA9IFtdOyBpIDwgZXZlbnRzLmxlbmd0aDsgKytpKSB7XG4gICAgICB2YXIgZXZlbnQgPSBldmVudHNbaV07XG4gICAgICBpZiAoZXZlbnQucmFuZ2VzKSB7XG4gICAgICAgIGNvcHkucHVzaChpbnN0YW50aWF0ZVNlbCA/IFNlbGVjdGlvbi5wcm90b3R5cGUuZGVlcENvcHkuY2FsbChldmVudCkgOiBldmVudCk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgdmFyIGNoYW5nZXMgPSBldmVudC5jaGFuZ2VzLCBuZXdDaGFuZ2VzID0gW107XG4gICAgICBjb3B5LnB1c2goe2NoYW5nZXM6IG5ld0NoYW5nZXN9KTtcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgY2hhbmdlcy5sZW5ndGg7ICsraikge1xuICAgICAgICB2YXIgY2hhbmdlID0gY2hhbmdlc1tqXSwgbTtcbiAgICAgICAgbmV3Q2hhbmdlcy5wdXNoKHtmcm9tOiBjaGFuZ2UuZnJvbSwgdG86IGNoYW5nZS50bywgdGV4dDogY2hhbmdlLnRleHR9KTtcbiAgICAgICAgaWYgKG5ld0dyb3VwKSBmb3IgKHZhciBwcm9wIGluIGNoYW5nZSkgaWYgKG0gPSBwcm9wLm1hdGNoKC9ec3BhbnNfKFxcZCspJC8pKSB7XG4gICAgICAgICAgaWYgKGluZGV4T2YobmV3R3JvdXAsIE51bWJlcihtWzFdKSkgPiAtMSkge1xuICAgICAgICAgICAgbHN0KG5ld0NoYW5nZXMpW3Byb3BdID0gY2hhbmdlW3Byb3BdO1xuICAgICAgICAgICAgZGVsZXRlIGNoYW5nZVtwcm9wXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNvcHk7XG4gIH1cblxuICAvLyBSZWJhc2luZy9yZXNldHRpbmcgaGlzdG9yeSB0byBkZWFsIHdpdGggZXh0ZXJuYWxseS1zb3VyY2VkIGNoYW5nZXNcblxuICBmdW5jdGlvbiByZWJhc2VIaXN0U2VsU2luZ2xlKHBvcywgZnJvbSwgdG8sIGRpZmYpIHtcbiAgICBpZiAodG8gPCBwb3MubGluZSkge1xuICAgICAgcG9zLmxpbmUgKz0gZGlmZjtcbiAgICB9IGVsc2UgaWYgKGZyb20gPCBwb3MubGluZSkge1xuICAgICAgcG9zLmxpbmUgPSBmcm9tO1xuICAgICAgcG9zLmNoID0gMDtcbiAgICB9XG4gIH1cblxuICAvLyBUcmllcyB0byByZWJhc2UgYW4gYXJyYXkgb2YgaGlzdG9yeSBldmVudHMgZ2l2ZW4gYSBjaGFuZ2UgaW4gdGhlXG4gIC8vIGRvY3VtZW50LiBJZiB0aGUgY2hhbmdlIHRvdWNoZXMgdGhlIHNhbWUgbGluZXMgYXMgdGhlIGV2ZW50LCB0aGVcbiAgLy8gZXZlbnQsIGFuZCBldmVyeXRoaW5nICdiZWhpbmQnIGl0LCBpcyBkaXNjYXJkZWQuIElmIHRoZSBjaGFuZ2UgaXNcbiAgLy8gYmVmb3JlIHRoZSBldmVudCwgdGhlIGV2ZW50J3MgcG9zaXRpb25zIGFyZSB1cGRhdGVkLiBVc2VzIGFcbiAgLy8gY29weS1vbi13cml0ZSBzY2hlbWUgZm9yIHRoZSBwb3NpdGlvbnMsIHRvIGF2b2lkIGhhdmluZyB0b1xuICAvLyByZWFsbG9jYXRlIHRoZW0gYWxsIG9uIGV2ZXJ5IHJlYmFzZSwgYnV0IGFsc28gYXZvaWQgcHJvYmxlbXMgd2l0aFxuICAvLyBzaGFyZWQgcG9zaXRpb24gb2JqZWN0cyBiZWluZyB1bnNhZmVseSB1cGRhdGVkLlxuICBmdW5jdGlvbiByZWJhc2VIaXN0QXJyYXkoYXJyYXksIGZyb20sIHRvLCBkaWZmKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnJheS5sZW5ndGg7ICsraSkge1xuICAgICAgdmFyIHN1YiA9IGFycmF5W2ldLCBvayA9IHRydWU7XG4gICAgICBpZiAoc3ViLnJhbmdlcykge1xuICAgICAgICBpZiAoIXN1Yi5jb3BpZWQpIHsgc3ViID0gYXJyYXlbaV0gPSBzdWIuZGVlcENvcHkoKTsgc3ViLmNvcGllZCA9IHRydWU7IH1cbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBzdWIucmFuZ2VzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgcmViYXNlSGlzdFNlbFNpbmdsZShzdWIucmFuZ2VzW2pdLmFuY2hvciwgZnJvbSwgdG8sIGRpZmYpO1xuICAgICAgICAgIHJlYmFzZUhpc3RTZWxTaW5nbGUoc3ViLnJhbmdlc1tqXS5oZWFkLCBmcm9tLCB0bywgZGlmZik7XG4gICAgICAgIH1cbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHN1Yi5jaGFuZ2VzLmxlbmd0aDsgKytqKSB7XG4gICAgICAgIHZhciBjdXIgPSBzdWIuY2hhbmdlc1tqXTtcbiAgICAgICAgaWYgKHRvIDwgY3VyLmZyb20ubGluZSkge1xuICAgICAgICAgIGN1ci5mcm9tID0gUG9zKGN1ci5mcm9tLmxpbmUgKyBkaWZmLCBjdXIuZnJvbS5jaCk7XG4gICAgICAgICAgY3VyLnRvID0gUG9zKGN1ci50by5saW5lICsgZGlmZiwgY3VyLnRvLmNoKTtcbiAgICAgICAgfSBlbHNlIGlmIChmcm9tIDw9IGN1ci50by5saW5lKSB7XG4gICAgICAgICAgb2sgPSBmYWxzZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKCFvaykge1xuICAgICAgICBhcnJheS5zcGxpY2UoMCwgaSArIDEpO1xuICAgICAgICBpID0gMDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiByZWJhc2VIaXN0KGhpc3QsIGNoYW5nZSkge1xuICAgIHZhciBmcm9tID0gY2hhbmdlLmZyb20ubGluZSwgdG8gPSBjaGFuZ2UudG8ubGluZSwgZGlmZiA9IGNoYW5nZS50ZXh0Lmxlbmd0aCAtICh0byAtIGZyb20pIC0gMTtcbiAgICByZWJhc2VIaXN0QXJyYXkoaGlzdC5kb25lLCBmcm9tLCB0bywgZGlmZik7XG4gICAgcmViYXNlSGlzdEFycmF5KGhpc3QudW5kb25lLCBmcm9tLCB0bywgZGlmZik7XG4gIH1cblxuICAvLyBFVkVOVCBVVElMSVRJRVNcblxuICAvLyBEdWUgdG8gdGhlIGZhY3QgdGhhdCB3ZSBzdGlsbCBzdXBwb3J0IGp1cmFzc2ljIElFIHZlcnNpb25zLCBzb21lXG4gIC8vIGNvbXBhdGliaWxpdHkgd3JhcHBlcnMgYXJlIG5lZWRlZC5cblxuICB2YXIgZV9wcmV2ZW50RGVmYXVsdCA9IENvZGVNaXJyb3IuZV9wcmV2ZW50RGVmYXVsdCA9IGZ1bmN0aW9uKGUpIHtcbiAgICBpZiAoZS5wcmV2ZW50RGVmYXVsdCkgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGVsc2UgZS5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuICB9O1xuICB2YXIgZV9zdG9wUHJvcGFnYXRpb24gPSBDb2RlTWlycm9yLmVfc3RvcFByb3BhZ2F0aW9uID0gZnVuY3Rpb24oZSkge1xuICAgIGlmIChlLnN0b3BQcm9wYWdhdGlvbikgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICBlbHNlIGUuY2FuY2VsQnViYmxlID0gdHJ1ZTtcbiAgfTtcbiAgZnVuY3Rpb24gZV9kZWZhdWx0UHJldmVudGVkKGUpIHtcbiAgICByZXR1cm4gZS5kZWZhdWx0UHJldmVudGVkICE9IG51bGwgPyBlLmRlZmF1bHRQcmV2ZW50ZWQgOiBlLnJldHVyblZhbHVlID09IGZhbHNlO1xuICB9XG4gIHZhciBlX3N0b3AgPSBDb2RlTWlycm9yLmVfc3RvcCA9IGZ1bmN0aW9uKGUpIHtlX3ByZXZlbnREZWZhdWx0KGUpOyBlX3N0b3BQcm9wYWdhdGlvbihlKTt9O1xuXG4gIGZ1bmN0aW9uIGVfdGFyZ2V0KGUpIHtyZXR1cm4gZS50YXJnZXQgfHwgZS5zcmNFbGVtZW50O31cbiAgZnVuY3Rpb24gZV9idXR0b24oZSkge1xuICAgIHZhciBiID0gZS53aGljaDtcbiAgICBpZiAoYiA9PSBudWxsKSB7XG4gICAgICBpZiAoZS5idXR0b24gJiAxKSBiID0gMTtcbiAgICAgIGVsc2UgaWYgKGUuYnV0dG9uICYgMikgYiA9IDM7XG4gICAgICBlbHNlIGlmIChlLmJ1dHRvbiAmIDQpIGIgPSAyO1xuICAgIH1cbiAgICBpZiAobWFjICYmIGUuY3RybEtleSAmJiBiID09IDEpIGIgPSAzO1xuICAgIHJldHVybiBiO1xuICB9XG5cbiAgLy8gRVZFTlQgSEFORExJTkdcblxuICAvLyBMaWdodHdlaWdodCBldmVudCBmcmFtZXdvcmsuIG9uL29mZiBhbHNvIHdvcmsgb24gRE9NIG5vZGVzLFxuICAvLyByZWdpc3RlcmluZyBuYXRpdmUgRE9NIGhhbmRsZXJzLlxuXG4gIHZhciBvbiA9IENvZGVNaXJyb3Iub24gPSBmdW5jdGlvbihlbWl0dGVyLCB0eXBlLCBmKSB7XG4gICAgaWYgKGVtaXR0ZXIuYWRkRXZlbnRMaXN0ZW5lcilcbiAgICAgIGVtaXR0ZXIuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBmLCBmYWxzZSk7XG4gICAgZWxzZSBpZiAoZW1pdHRlci5hdHRhY2hFdmVudClcbiAgICAgIGVtaXR0ZXIuYXR0YWNoRXZlbnQoXCJvblwiICsgdHlwZSwgZik7XG4gICAgZWxzZSB7XG4gICAgICB2YXIgbWFwID0gZW1pdHRlci5faGFuZGxlcnMgfHwgKGVtaXR0ZXIuX2hhbmRsZXJzID0ge30pO1xuICAgICAgdmFyIGFyciA9IG1hcFt0eXBlXSB8fCAobWFwW3R5cGVdID0gW10pO1xuICAgICAgYXJyLnB1c2goZik7XG4gICAgfVxuICB9O1xuXG4gIHZhciBub0hhbmRsZXJzID0gW11cbiAgZnVuY3Rpb24gZ2V0SGFuZGxlcnMoZW1pdHRlciwgdHlwZSwgY29weSkge1xuICAgIHZhciBhcnIgPSBlbWl0dGVyLl9oYW5kbGVycyAmJiBlbWl0dGVyLl9oYW5kbGVyc1t0eXBlXVxuICAgIGlmIChjb3B5KSByZXR1cm4gYXJyICYmIGFyci5sZW5ndGggPiAwID8gYXJyLnNsaWNlKCkgOiBub0hhbmRsZXJzXG4gICAgZWxzZSByZXR1cm4gYXJyIHx8IG5vSGFuZGxlcnNcbiAgfVxuXG4gIHZhciBvZmYgPSBDb2RlTWlycm9yLm9mZiA9IGZ1bmN0aW9uKGVtaXR0ZXIsIHR5cGUsIGYpIHtcbiAgICBpZiAoZW1pdHRlci5yZW1vdmVFdmVudExpc3RlbmVyKVxuICAgICAgZW1pdHRlci5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIGYsIGZhbHNlKTtcbiAgICBlbHNlIGlmIChlbWl0dGVyLmRldGFjaEV2ZW50KVxuICAgICAgZW1pdHRlci5kZXRhY2hFdmVudChcIm9uXCIgKyB0eXBlLCBmKTtcbiAgICBlbHNlIHtcbiAgICAgIHZhciBoYW5kbGVycyA9IGdldEhhbmRsZXJzKGVtaXR0ZXIsIHR5cGUsIGZhbHNlKVxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBoYW5kbGVycy5sZW5ndGg7ICsraSlcbiAgICAgICAgaWYgKGhhbmRsZXJzW2ldID09IGYpIHsgaGFuZGxlcnMuc3BsaWNlKGksIDEpOyBicmVhazsgfVxuICAgIH1cbiAgfTtcblxuICB2YXIgc2lnbmFsID0gQ29kZU1pcnJvci5zaWduYWwgPSBmdW5jdGlvbihlbWl0dGVyLCB0eXBlIC8qLCB2YWx1ZXMuLi4qLykge1xuICAgIHZhciBoYW5kbGVycyA9IGdldEhhbmRsZXJzKGVtaXR0ZXIsIHR5cGUsIHRydWUpXG4gICAgaWYgKCFoYW5kbGVycy5sZW5ndGgpIHJldHVybjtcbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMik7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBoYW5kbGVycy5sZW5ndGg7ICsraSkgaGFuZGxlcnNbaV0uYXBwbHkobnVsbCwgYXJncyk7XG4gIH07XG5cbiAgdmFyIG9ycGhhbkRlbGF5ZWRDYWxsYmFja3MgPSBudWxsO1xuXG4gIC8vIE9mdGVuLCB3ZSB3YW50IHRvIHNpZ25hbCBldmVudHMgYXQgYSBwb2ludCB3aGVyZSB3ZSBhcmUgaW4gdGhlXG4gIC8vIG1pZGRsZSBvZiBzb21lIHdvcmssIGJ1dCBkb24ndCB3YW50IHRoZSBoYW5kbGVyIHRvIHN0YXJ0IGNhbGxpbmdcbiAgLy8gb3RoZXIgbWV0aG9kcyBvbiB0aGUgZWRpdG9yLCB3aGljaCBtaWdodCBiZSBpbiBhbiBpbmNvbnNpc3RlbnRcbiAgLy8gc3RhdGUgb3Igc2ltcGx5IG5vdCBleHBlY3QgYW55IG90aGVyIGV2ZW50cyB0byBoYXBwZW4uXG4gIC8vIHNpZ25hbExhdGVyIGxvb2tzIHdoZXRoZXIgdGhlcmUgYXJlIGFueSBoYW5kbGVycywgYW5kIHNjaGVkdWxlc1xuICAvLyB0aGVtIHRvIGJlIGV4ZWN1dGVkIHdoZW4gdGhlIGxhc3Qgb3BlcmF0aW9uIGVuZHMsIG9yLCBpZiBub1xuICAvLyBvcGVyYXRpb24gaXMgYWN0aXZlLCB3aGVuIGEgdGltZW91dCBmaXJlcy5cbiAgZnVuY3Rpb24gc2lnbmFsTGF0ZXIoZW1pdHRlciwgdHlwZSAvKiwgdmFsdWVzLi4uKi8pIHtcbiAgICB2YXIgYXJyID0gZ2V0SGFuZGxlcnMoZW1pdHRlciwgdHlwZSwgZmFsc2UpXG4gICAgaWYgKCFhcnIubGVuZ3RoKSByZXR1cm47XG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpLCBsaXN0O1xuICAgIGlmIChvcGVyYXRpb25Hcm91cCkge1xuICAgICAgbGlzdCA9IG9wZXJhdGlvbkdyb3VwLmRlbGF5ZWRDYWxsYmFja3M7XG4gICAgfSBlbHNlIGlmIChvcnBoYW5EZWxheWVkQ2FsbGJhY2tzKSB7XG4gICAgICBsaXN0ID0gb3JwaGFuRGVsYXllZENhbGxiYWNrcztcbiAgICB9IGVsc2Uge1xuICAgICAgbGlzdCA9IG9ycGhhbkRlbGF5ZWRDYWxsYmFja3MgPSBbXTtcbiAgICAgIHNldFRpbWVvdXQoZmlyZU9ycGhhbkRlbGF5ZWQsIDApO1xuICAgIH1cbiAgICBmdW5jdGlvbiBibmQoZikge3JldHVybiBmdW5jdGlvbigpe2YuYXBwbHkobnVsbCwgYXJncyk7fTt9O1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgKytpKVxuICAgICAgbGlzdC5wdXNoKGJuZChhcnJbaV0pKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZpcmVPcnBoYW5EZWxheWVkKCkge1xuICAgIHZhciBkZWxheWVkID0gb3JwaGFuRGVsYXllZENhbGxiYWNrcztcbiAgICBvcnBoYW5EZWxheWVkQ2FsbGJhY2tzID0gbnVsbDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRlbGF5ZWQubGVuZ3RoOyArK2kpIGRlbGF5ZWRbaV0oKTtcbiAgfVxuXG4gIC8vIFRoZSBET00gZXZlbnRzIHRoYXQgQ29kZU1pcnJvciBoYW5kbGVzIGNhbiBiZSBvdmVycmlkZGVuIGJ5XG4gIC8vIHJlZ2lzdGVyaW5nIGEgKG5vbi1ET00pIGhhbmRsZXIgb24gdGhlIGVkaXRvciBmb3IgdGhlIGV2ZW50IG5hbWUsXG4gIC8vIGFuZCBwcmV2ZW50RGVmYXVsdC1pbmcgdGhlIGV2ZW50IGluIHRoYXQgaGFuZGxlci5cbiAgZnVuY3Rpb24gc2lnbmFsRE9NRXZlbnQoY20sIGUsIG92ZXJyaWRlKSB7XG4gICAgaWYgKHR5cGVvZiBlID09IFwic3RyaW5nXCIpXG4gICAgICBlID0ge3R5cGU6IGUsIHByZXZlbnREZWZhdWx0OiBmdW5jdGlvbigpIHsgdGhpcy5kZWZhdWx0UHJldmVudGVkID0gdHJ1ZTsgfX07XG4gICAgc2lnbmFsKGNtLCBvdmVycmlkZSB8fCBlLnR5cGUsIGNtLCBlKTtcbiAgICByZXR1cm4gZV9kZWZhdWx0UHJldmVudGVkKGUpIHx8IGUuY29kZW1pcnJvcklnbm9yZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNpZ25hbEN1cnNvckFjdGl2aXR5KGNtKSB7XG4gICAgdmFyIGFyciA9IGNtLl9oYW5kbGVycyAmJiBjbS5faGFuZGxlcnMuY3Vyc29yQWN0aXZpdHk7XG4gICAgaWYgKCFhcnIpIHJldHVybjtcbiAgICB2YXIgc2V0ID0gY20uY3VyT3AuY3Vyc29yQWN0aXZpdHlIYW5kbGVycyB8fCAoY20uY3VyT3AuY3Vyc29yQWN0aXZpdHlIYW5kbGVycyA9IFtdKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7ICsraSkgaWYgKGluZGV4T2Yoc2V0LCBhcnJbaV0pID09IC0xKVxuICAgICAgc2V0LnB1c2goYXJyW2ldKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGhhc0hhbmRsZXIoZW1pdHRlciwgdHlwZSkge1xuICAgIHJldHVybiBnZXRIYW5kbGVycyhlbWl0dGVyLCB0eXBlKS5sZW5ndGggPiAwXG4gIH1cblxuICAvLyBBZGQgb24gYW5kIG9mZiBtZXRob2RzIHRvIGEgY29uc3RydWN0b3IncyBwcm90b3R5cGUsIHRvIG1ha2VcbiAgLy8gcmVnaXN0ZXJpbmcgZXZlbnRzIG9uIHN1Y2ggb2JqZWN0cyBtb3JlIGNvbnZlbmllbnQuXG4gIGZ1bmN0aW9uIGV2ZW50TWl4aW4oY3Rvcikge1xuICAgIGN0b3IucHJvdG90eXBlLm9uID0gZnVuY3Rpb24odHlwZSwgZikge29uKHRoaXMsIHR5cGUsIGYpO307XG4gICAgY3Rvci5wcm90b3R5cGUub2ZmID0gZnVuY3Rpb24odHlwZSwgZikge29mZih0aGlzLCB0eXBlLCBmKTt9O1xuICB9XG5cbiAgLy8gTUlTQyBVVElMSVRJRVNcblxuICAvLyBOdW1iZXIgb2YgcGl4ZWxzIGFkZGVkIHRvIHNjcm9sbGVyIGFuZCBzaXplciB0byBoaWRlIHNjcm9sbGJhclxuICB2YXIgc2Nyb2xsZXJHYXAgPSAzMDtcblxuICAvLyBSZXR1cm5lZCBvciB0aHJvd24gYnkgdmFyaW91cyBwcm90b2NvbHMgdG8gc2lnbmFsICdJJ20gbm90XG4gIC8vIGhhbmRsaW5nIHRoaXMnLlxuICB2YXIgUGFzcyA9IENvZGVNaXJyb3IuUGFzcyA9IHt0b1N0cmluZzogZnVuY3Rpb24oKXtyZXR1cm4gXCJDb2RlTWlycm9yLlBhc3NcIjt9fTtcblxuICAvLyBSZXVzZWQgb3B0aW9uIG9iamVjdHMgZm9yIHNldFNlbGVjdGlvbiAmIGZyaWVuZHNcbiAgdmFyIHNlbF9kb250U2Nyb2xsID0ge3Njcm9sbDogZmFsc2V9LCBzZWxfbW91c2UgPSB7b3JpZ2luOiBcIiptb3VzZVwifSwgc2VsX21vdmUgPSB7b3JpZ2luOiBcIittb3ZlXCJ9O1xuXG4gIGZ1bmN0aW9uIERlbGF5ZWQoKSB7dGhpcy5pZCA9IG51bGw7fVxuICBEZWxheWVkLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbihtcywgZikge1xuICAgIGNsZWFyVGltZW91dCh0aGlzLmlkKTtcbiAgICB0aGlzLmlkID0gc2V0VGltZW91dChmLCBtcyk7XG4gIH07XG5cbiAgLy8gQ291bnRzIHRoZSBjb2x1bW4gb2Zmc2V0IGluIGEgc3RyaW5nLCB0YWtpbmcgdGFicyBpbnRvIGFjY291bnQuXG4gIC8vIFVzZWQgbW9zdGx5IHRvIGZpbmQgaW5kZW50YXRpb24uXG4gIHZhciBjb3VudENvbHVtbiA9IENvZGVNaXJyb3IuY291bnRDb2x1bW4gPSBmdW5jdGlvbihzdHJpbmcsIGVuZCwgdGFiU2l6ZSwgc3RhcnRJbmRleCwgc3RhcnRWYWx1ZSkge1xuICAgIGlmIChlbmQgPT0gbnVsbCkge1xuICAgICAgZW5kID0gc3RyaW5nLnNlYXJjaCgvW15cXHNcXHUwMGEwXS8pO1xuICAgICAgaWYgKGVuZCA9PSAtMSkgZW5kID0gc3RyaW5nLmxlbmd0aDtcbiAgICB9XG4gICAgZm9yICh2YXIgaSA9IHN0YXJ0SW5kZXggfHwgMCwgbiA9IHN0YXJ0VmFsdWUgfHwgMDs7KSB7XG4gICAgICB2YXIgbmV4dFRhYiA9IHN0cmluZy5pbmRleE9mKFwiXFx0XCIsIGkpO1xuICAgICAgaWYgKG5leHRUYWIgPCAwIHx8IG5leHRUYWIgPj0gZW5kKVxuICAgICAgICByZXR1cm4gbiArIChlbmQgLSBpKTtcbiAgICAgIG4gKz0gbmV4dFRhYiAtIGk7XG4gICAgICBuICs9IHRhYlNpemUgLSAobiAlIHRhYlNpemUpO1xuICAgICAgaSA9IG5leHRUYWIgKyAxO1xuICAgIH1cbiAgfTtcblxuICAvLyBUaGUgaW52ZXJzZSBvZiBjb3VudENvbHVtbiAtLSBmaW5kIHRoZSBvZmZzZXQgdGhhdCBjb3JyZXNwb25kcyB0b1xuICAvLyBhIHBhcnRpY3VsYXIgY29sdW1uLlxuICB2YXIgZmluZENvbHVtbiA9IENvZGVNaXJyb3IuZmluZENvbHVtbiA9IGZ1bmN0aW9uKHN0cmluZywgZ29hbCwgdGFiU2l6ZSkge1xuICAgIGZvciAodmFyIHBvcyA9IDAsIGNvbCA9IDA7Oykge1xuICAgICAgdmFyIG5leHRUYWIgPSBzdHJpbmcuaW5kZXhPZihcIlxcdFwiLCBwb3MpO1xuICAgICAgaWYgKG5leHRUYWIgPT0gLTEpIG5leHRUYWIgPSBzdHJpbmcubGVuZ3RoO1xuICAgICAgdmFyIHNraXBwZWQgPSBuZXh0VGFiIC0gcG9zO1xuICAgICAgaWYgKG5leHRUYWIgPT0gc3RyaW5nLmxlbmd0aCB8fCBjb2wgKyBza2lwcGVkID49IGdvYWwpXG4gICAgICAgIHJldHVybiBwb3MgKyBNYXRoLm1pbihza2lwcGVkLCBnb2FsIC0gY29sKTtcbiAgICAgIGNvbCArPSBuZXh0VGFiIC0gcG9zO1xuICAgICAgY29sICs9IHRhYlNpemUgLSAoY29sICUgdGFiU2l6ZSk7XG4gICAgICBwb3MgPSBuZXh0VGFiICsgMTtcbiAgICAgIGlmIChjb2wgPj0gZ29hbCkgcmV0dXJuIHBvcztcbiAgICB9XG4gIH1cblxuICB2YXIgc3BhY2VTdHJzID0gW1wiXCJdO1xuICBmdW5jdGlvbiBzcGFjZVN0cihuKSB7XG4gICAgd2hpbGUgKHNwYWNlU3Rycy5sZW5ndGggPD0gbilcbiAgICAgIHNwYWNlU3Rycy5wdXNoKGxzdChzcGFjZVN0cnMpICsgXCIgXCIpO1xuICAgIHJldHVybiBzcGFjZVN0cnNbbl07XG4gIH1cblxuICBmdW5jdGlvbiBsc3QoYXJyKSB7IHJldHVybiBhcnJbYXJyLmxlbmd0aC0xXTsgfVxuXG4gIHZhciBzZWxlY3RJbnB1dCA9IGZ1bmN0aW9uKG5vZGUpIHsgbm9kZS5zZWxlY3QoKTsgfTtcbiAgaWYgKGlvcykgLy8gTW9iaWxlIFNhZmFyaSBhcHBhcmVudGx5IGhhcyBhIGJ1ZyB3aGVyZSBzZWxlY3QoKSBpcyBicm9rZW4uXG4gICAgc2VsZWN0SW5wdXQgPSBmdW5jdGlvbihub2RlKSB7IG5vZGUuc2VsZWN0aW9uU3RhcnQgPSAwOyBub2RlLnNlbGVjdGlvbkVuZCA9IG5vZGUudmFsdWUubGVuZ3RoOyB9O1xuICBlbHNlIGlmIChpZSkgLy8gU3VwcHJlc3MgbXlzdGVyaW91cyBJRTEwIGVycm9yc1xuICAgIHNlbGVjdElucHV0ID0gZnVuY3Rpb24obm9kZSkgeyB0cnkgeyBub2RlLnNlbGVjdCgpOyB9IGNhdGNoKF9lKSB7fSB9O1xuXG4gIGZ1bmN0aW9uIGluZGV4T2YoYXJyYXksIGVsdCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyYXkubGVuZ3RoOyArK2kpXG4gICAgICBpZiAoYXJyYXlbaV0gPT0gZWx0KSByZXR1cm4gaTtcbiAgICByZXR1cm4gLTE7XG4gIH1cbiAgZnVuY3Rpb24gbWFwKGFycmF5LCBmKSB7XG4gICAgdmFyIG91dCA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyYXkubGVuZ3RoOyBpKyspIG91dFtpXSA9IGYoYXJyYXlbaV0sIGkpO1xuICAgIHJldHVybiBvdXQ7XG4gIH1cblxuICBmdW5jdGlvbiBub3RoaW5nKCkge31cblxuICBmdW5jdGlvbiBjcmVhdGVPYmooYmFzZSwgcHJvcHMpIHtcbiAgICB2YXIgaW5zdDtcbiAgICBpZiAoT2JqZWN0LmNyZWF0ZSkge1xuICAgICAgaW5zdCA9IE9iamVjdC5jcmVhdGUoYmFzZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5vdGhpbmcucHJvdG90eXBlID0gYmFzZTtcbiAgICAgIGluc3QgPSBuZXcgbm90aGluZygpO1xuICAgIH1cbiAgICBpZiAocHJvcHMpIGNvcHlPYmoocHJvcHMsIGluc3QpO1xuICAgIHJldHVybiBpbnN0O1xuICB9O1xuXG4gIGZ1bmN0aW9uIGNvcHlPYmoob2JqLCB0YXJnZXQsIG92ZXJ3cml0ZSkge1xuICAgIGlmICghdGFyZ2V0KSB0YXJnZXQgPSB7fTtcbiAgICBmb3IgKHZhciBwcm9wIGluIG9iailcbiAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkocHJvcCkgJiYgKG92ZXJ3cml0ZSAhPT0gZmFsc2UgfHwgIXRhcmdldC5oYXNPd25Qcm9wZXJ0eShwcm9wKSkpXG4gICAgICAgIHRhcmdldFtwcm9wXSA9IG9ialtwcm9wXTtcbiAgICByZXR1cm4gdGFyZ2V0O1xuICB9XG5cbiAgZnVuY3Rpb24gYmluZChmKSB7XG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgIHJldHVybiBmdW5jdGlvbigpe3JldHVybiBmLmFwcGx5KG51bGwsIGFyZ3MpO307XG4gIH1cblxuICB2YXIgbm9uQVNDSUlTaW5nbGVDYXNlV29yZENoYXIgPSAvW1xcdTAwZGZcXHUwNTg3XFx1MDU5MC1cXHUwNWY0XFx1MDYwMC1cXHUwNmZmXFx1MzA0MC1cXHUzMDlmXFx1MzBhMC1cXHUzMGZmXFx1MzQwMC1cXHU0ZGI1XFx1NGUwMC1cXHU5ZmNjXFx1YWMwMC1cXHVkN2FmXS87XG4gIHZhciBpc1dvcmRDaGFyQmFzaWMgPSBDb2RlTWlycm9yLmlzV29yZENoYXIgPSBmdW5jdGlvbihjaCkge1xuICAgIHJldHVybiAvXFx3Ly50ZXN0KGNoKSB8fCBjaCA+IFwiXFx4ODBcIiAmJlxuICAgICAgKGNoLnRvVXBwZXJDYXNlKCkgIT0gY2gudG9Mb3dlckNhc2UoKSB8fCBub25BU0NJSVNpbmdsZUNhc2VXb3JkQ2hhci50ZXN0KGNoKSk7XG4gIH07XG4gIGZ1bmN0aW9uIGlzV29yZENoYXIoY2gsIGhlbHBlcikge1xuICAgIGlmICghaGVscGVyKSByZXR1cm4gaXNXb3JkQ2hhckJhc2ljKGNoKTtcbiAgICBpZiAoaGVscGVyLnNvdXJjZS5pbmRleE9mKFwiXFxcXHdcIikgPiAtMSAmJiBpc1dvcmRDaGFyQmFzaWMoY2gpKSByZXR1cm4gdHJ1ZTtcbiAgICByZXR1cm4gaGVscGVyLnRlc3QoY2gpO1xuICB9XG5cbiAgZnVuY3Rpb24gaXNFbXB0eShvYmopIHtcbiAgICBmb3IgKHZhciBuIGluIG9iaikgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShuKSAmJiBvYmpbbl0pIHJldHVybiBmYWxzZTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8vIEV4dGVuZGluZyB1bmljb2RlIGNoYXJhY3RlcnMuIEEgc2VyaWVzIG9mIGEgbm9uLWV4dGVuZGluZyBjaGFyICtcbiAgLy8gYW55IG51bWJlciBvZiBleHRlbmRpbmcgY2hhcnMgaXMgdHJlYXRlZCBhcyBhIHNpbmdsZSB1bml0IGFzIGZhclxuICAvLyBhcyBlZGl0aW5nIGFuZCBtZWFzdXJpbmcgaXMgY29uY2VybmVkLiBUaGlzIGlzIG5vdCBmdWxseSBjb3JyZWN0LFxuICAvLyBzaW5jZSBzb21lIHNjcmlwdHMvZm9udHMvYnJvd3NlcnMgYWxzbyB0cmVhdCBvdGhlciBjb25maWd1cmF0aW9uc1xuICAvLyBvZiBjb2RlIHBvaW50cyBhcyBhIGdyb3VwLlxuICB2YXIgZXh0ZW5kaW5nQ2hhcnMgPSAvW1xcdTAzMDAtXFx1MDM2ZlxcdTA0ODMtXFx1MDQ4OVxcdTA1OTEtXFx1MDViZFxcdTA1YmZcXHUwNWMxXFx1MDVjMlxcdTA1YzRcXHUwNWM1XFx1MDVjN1xcdTA2MTAtXFx1MDYxYVxcdTA2NGItXFx1MDY1ZVxcdTA2NzBcXHUwNmQ2LVxcdTA2ZGNcXHUwNmRlLVxcdTA2ZTRcXHUwNmU3XFx1MDZlOFxcdTA2ZWEtXFx1MDZlZFxcdTA3MTFcXHUwNzMwLVxcdTA3NGFcXHUwN2E2LVxcdTA3YjBcXHUwN2ViLVxcdTA3ZjNcXHUwODE2LVxcdTA4MTlcXHUwODFiLVxcdTA4MjNcXHUwODI1LVxcdTA4MjdcXHUwODI5LVxcdTA4MmRcXHUwOTAwLVxcdTA5MDJcXHUwOTNjXFx1MDk0MS1cXHUwOTQ4XFx1MDk0ZFxcdTA5NTEtXFx1MDk1NVxcdTA5NjJcXHUwOTYzXFx1MDk4MVxcdTA5YmNcXHUwOWJlXFx1MDljMS1cXHUwOWM0XFx1MDljZFxcdTA5ZDdcXHUwOWUyXFx1MDllM1xcdTBhMDFcXHUwYTAyXFx1MGEzY1xcdTBhNDFcXHUwYTQyXFx1MGE0N1xcdTBhNDhcXHUwYTRiLVxcdTBhNGRcXHUwYTUxXFx1MGE3MFxcdTBhNzFcXHUwYTc1XFx1MGE4MVxcdTBhODJcXHUwYWJjXFx1MGFjMS1cXHUwYWM1XFx1MGFjN1xcdTBhYzhcXHUwYWNkXFx1MGFlMlxcdTBhZTNcXHUwYjAxXFx1MGIzY1xcdTBiM2VcXHUwYjNmXFx1MGI0MS1cXHUwYjQ0XFx1MGI0ZFxcdTBiNTZcXHUwYjU3XFx1MGI2MlxcdTBiNjNcXHUwYjgyXFx1MGJiZVxcdTBiYzBcXHUwYmNkXFx1MGJkN1xcdTBjM2UtXFx1MGM0MFxcdTBjNDYtXFx1MGM0OFxcdTBjNGEtXFx1MGM0ZFxcdTBjNTVcXHUwYzU2XFx1MGM2MlxcdTBjNjNcXHUwY2JjXFx1MGNiZlxcdTBjYzJcXHUwY2M2XFx1MGNjY1xcdTBjY2RcXHUwY2Q1XFx1MGNkNlxcdTBjZTJcXHUwY2UzXFx1MGQzZVxcdTBkNDEtXFx1MGQ0NFxcdTBkNGRcXHUwZDU3XFx1MGQ2MlxcdTBkNjNcXHUwZGNhXFx1MGRjZlxcdTBkZDItXFx1MGRkNFxcdTBkZDZcXHUwZGRmXFx1MGUzMVxcdTBlMzQtXFx1MGUzYVxcdTBlNDctXFx1MGU0ZVxcdTBlYjFcXHUwZWI0LVxcdTBlYjlcXHUwZWJiXFx1MGViY1xcdTBlYzgtXFx1MGVjZFxcdTBmMThcXHUwZjE5XFx1MGYzNVxcdTBmMzdcXHUwZjM5XFx1MGY3MS1cXHUwZjdlXFx1MGY4MC1cXHUwZjg0XFx1MGY4NlxcdTBmODdcXHUwZjkwLVxcdTBmOTdcXHUwZjk5LVxcdTBmYmNcXHUwZmM2XFx1MTAyZC1cXHUxMDMwXFx1MTAzMi1cXHUxMDM3XFx1MTAzOVxcdTEwM2FcXHUxMDNkXFx1MTAzZVxcdTEwNThcXHUxMDU5XFx1MTA1ZS1cXHUxMDYwXFx1MTA3MS1cXHUxMDc0XFx1MTA4MlxcdTEwODVcXHUxMDg2XFx1MTA4ZFxcdTEwOWRcXHUxMzVmXFx1MTcxMi1cXHUxNzE0XFx1MTczMi1cXHUxNzM0XFx1MTc1MlxcdTE3NTNcXHUxNzcyXFx1MTc3M1xcdTE3YjctXFx1MTdiZFxcdTE3YzZcXHUxN2M5LVxcdTE3ZDNcXHUxN2RkXFx1MTgwYi1cXHUxODBkXFx1MThhOVxcdTE5MjAtXFx1MTkyMlxcdTE5MjdcXHUxOTI4XFx1MTkzMlxcdTE5MzktXFx1MTkzYlxcdTFhMTdcXHUxYTE4XFx1MWE1NlxcdTFhNTgtXFx1MWE1ZVxcdTFhNjBcXHUxYTYyXFx1MWE2NS1cXHUxYTZjXFx1MWE3My1cXHUxYTdjXFx1MWE3ZlxcdTFiMDAtXFx1MWIwM1xcdTFiMzRcXHUxYjM2LVxcdTFiM2FcXHUxYjNjXFx1MWI0MlxcdTFiNmItXFx1MWI3M1xcdTFiODBcXHUxYjgxXFx1MWJhMi1cXHUxYmE1XFx1MWJhOFxcdTFiYTlcXHUxYzJjLVxcdTFjMzNcXHUxYzM2XFx1MWMzN1xcdTFjZDAtXFx1MWNkMlxcdTFjZDQtXFx1MWNlMFxcdTFjZTItXFx1MWNlOFxcdTFjZWRcXHUxZGMwLVxcdTFkZTZcXHUxZGZkLVxcdTFkZmZcXHUyMDBjXFx1MjAwZFxcdTIwZDAtXFx1MjBmMFxcdTJjZWYtXFx1MmNmMVxcdTJkZTAtXFx1MmRmZlxcdTMwMmEtXFx1MzAyZlxcdTMwOTlcXHUzMDlhXFx1YTY2Zi1cXHVhNjcyXFx1YTY3Y1xcdWE2N2RcXHVhNmYwXFx1YTZmMVxcdWE4MDJcXHVhODA2XFx1YTgwYlxcdWE4MjVcXHVhODI2XFx1YThjNFxcdWE4ZTAtXFx1YThmMVxcdWE5MjYtXFx1YTkyZFxcdWE5NDctXFx1YTk1MVxcdWE5ODAtXFx1YTk4MlxcdWE5YjNcXHVhOWI2LVxcdWE5YjlcXHVhOWJjXFx1YWEyOS1cXHVhYTJlXFx1YWEzMVxcdWFhMzJcXHVhYTM1XFx1YWEzNlxcdWFhNDNcXHVhYTRjXFx1YWFiMFxcdWFhYjItXFx1YWFiNFxcdWFhYjdcXHVhYWI4XFx1YWFiZVxcdWFhYmZcXHVhYWMxXFx1YWJlNVxcdWFiZThcXHVhYmVkXFx1ZGMwMC1cXHVkZmZmXFx1ZmIxZVxcdWZlMDAtXFx1ZmUwZlxcdWZlMjAtXFx1ZmUyNlxcdWZmOWVcXHVmZjlmXS87XG4gIGZ1bmN0aW9uIGlzRXh0ZW5kaW5nQ2hhcihjaCkgeyByZXR1cm4gY2guY2hhckNvZGVBdCgwKSA+PSA3NjggJiYgZXh0ZW5kaW5nQ2hhcnMudGVzdChjaCk7IH1cblxuICAvLyBET00gVVRJTElUSUVTXG5cbiAgZnVuY3Rpb24gZWx0KHRhZywgY29udGVudCwgY2xhc3NOYW1lLCBzdHlsZSkge1xuICAgIHZhciBlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWcpO1xuICAgIGlmIChjbGFzc05hbWUpIGUuY2xhc3NOYW1lID0gY2xhc3NOYW1lO1xuICAgIGlmIChzdHlsZSkgZS5zdHlsZS5jc3NUZXh0ID0gc3R5bGU7XG4gICAgaWYgKHR5cGVvZiBjb250ZW50ID09IFwic3RyaW5nXCIpIGUuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoY29udGVudCkpO1xuICAgIGVsc2UgaWYgKGNvbnRlbnQpIGZvciAodmFyIGkgPSAwOyBpIDwgY29udGVudC5sZW5ndGg7ICsraSkgZS5hcHBlbmRDaGlsZChjb250ZW50W2ldKTtcbiAgICByZXR1cm4gZTtcbiAgfVxuXG4gIHZhciByYW5nZTtcbiAgaWYgKGRvY3VtZW50LmNyZWF0ZVJhbmdlKSByYW5nZSA9IGZ1bmN0aW9uKG5vZGUsIHN0YXJ0LCBlbmQsIGVuZE5vZGUpIHtcbiAgICB2YXIgciA9IGRvY3VtZW50LmNyZWF0ZVJhbmdlKCk7XG4gICAgci5zZXRFbmQoZW5kTm9kZSB8fCBub2RlLCBlbmQpO1xuICAgIHIuc2V0U3RhcnQobm9kZSwgc3RhcnQpO1xuICAgIHJldHVybiByO1xuICB9O1xuICBlbHNlIHJhbmdlID0gZnVuY3Rpb24obm9kZSwgc3RhcnQsIGVuZCkge1xuICAgIHZhciByID0gZG9jdW1lbnQuYm9keS5jcmVhdGVUZXh0UmFuZ2UoKTtcbiAgICB0cnkgeyByLm1vdmVUb0VsZW1lbnRUZXh0KG5vZGUucGFyZW50Tm9kZSk7IH1cbiAgICBjYXRjaChlKSB7IHJldHVybiByOyB9XG4gICAgci5jb2xsYXBzZSh0cnVlKTtcbiAgICByLm1vdmVFbmQoXCJjaGFyYWN0ZXJcIiwgZW5kKTtcbiAgICByLm1vdmVTdGFydChcImNoYXJhY3RlclwiLCBzdGFydCk7XG4gICAgcmV0dXJuIHI7XG4gIH07XG5cbiAgZnVuY3Rpb24gcmVtb3ZlQ2hpbGRyZW4oZSkge1xuICAgIGZvciAodmFyIGNvdW50ID0gZS5jaGlsZE5vZGVzLmxlbmd0aDsgY291bnQgPiAwOyAtLWNvdW50KVxuICAgICAgZS5yZW1vdmVDaGlsZChlLmZpcnN0Q2hpbGQpO1xuICAgIHJldHVybiBlO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVtb3ZlQ2hpbGRyZW5BbmRBZGQocGFyZW50LCBlKSB7XG4gICAgcmV0dXJuIHJlbW92ZUNoaWxkcmVuKHBhcmVudCkuYXBwZW5kQ2hpbGQoZSk7XG4gIH1cblxuICB2YXIgY29udGFpbnMgPSBDb2RlTWlycm9yLmNvbnRhaW5zID0gZnVuY3Rpb24ocGFyZW50LCBjaGlsZCkge1xuICAgIGlmIChjaGlsZC5ub2RlVHlwZSA9PSAzKSAvLyBBbmRyb2lkIGJyb3dzZXIgYWx3YXlzIHJldHVybnMgZmFsc2Ugd2hlbiBjaGlsZCBpcyBhIHRleHRub2RlXG4gICAgICBjaGlsZCA9IGNoaWxkLnBhcmVudE5vZGU7XG4gICAgaWYgKHBhcmVudC5jb250YWlucylcbiAgICAgIHJldHVybiBwYXJlbnQuY29udGFpbnMoY2hpbGQpO1xuICAgIGRvIHtcbiAgICAgIGlmIChjaGlsZC5ub2RlVHlwZSA9PSAxMSkgY2hpbGQgPSBjaGlsZC5ob3N0O1xuICAgICAgaWYgKGNoaWxkID09IHBhcmVudCkgcmV0dXJuIHRydWU7XG4gICAgfSB3aGlsZSAoY2hpbGQgPSBjaGlsZC5wYXJlbnROb2RlKTtcbiAgfTtcblxuICBmdW5jdGlvbiBhY3RpdmVFbHQoKSB7XG4gICAgdmFyIGFjdGl2ZUVsZW1lbnQgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50O1xuICAgIHdoaWxlIChhY3RpdmVFbGVtZW50ICYmIGFjdGl2ZUVsZW1lbnQucm9vdCAmJiBhY3RpdmVFbGVtZW50LnJvb3QuYWN0aXZlRWxlbWVudClcbiAgICAgIGFjdGl2ZUVsZW1lbnQgPSBhY3RpdmVFbGVtZW50LnJvb3QuYWN0aXZlRWxlbWVudDtcbiAgICByZXR1cm4gYWN0aXZlRWxlbWVudDtcbiAgfVxuICAvLyBPbGRlciB2ZXJzaW9ucyBvZiBJRSB0aHJvd3MgdW5zcGVjaWZpZWQgZXJyb3Igd2hlbiB0b3VjaGluZ1xuICAvLyBkb2N1bWVudC5hY3RpdmVFbGVtZW50IGluIHNvbWUgY2FzZXMgKGR1cmluZyBsb2FkaW5nLCBpbiBpZnJhbWUpXG4gIGlmIChpZSAmJiBpZV92ZXJzaW9uIDwgMTEpIGFjdGl2ZUVsdCA9IGZ1bmN0aW9uKCkge1xuICAgIHRyeSB7IHJldHVybiBkb2N1bWVudC5hY3RpdmVFbGVtZW50OyB9XG4gICAgY2F0Y2goZSkgeyByZXR1cm4gZG9jdW1lbnQuYm9keTsgfVxuICB9O1xuXG4gIGZ1bmN0aW9uIGNsYXNzVGVzdChjbHMpIHsgcmV0dXJuIG5ldyBSZWdFeHAoXCIoXnxcXFxccylcIiArIGNscyArIFwiKD86JHxcXFxccylcXFxccypcIik7IH1cbiAgdmFyIHJtQ2xhc3MgPSBDb2RlTWlycm9yLnJtQ2xhc3MgPSBmdW5jdGlvbihub2RlLCBjbHMpIHtcbiAgICB2YXIgY3VycmVudCA9IG5vZGUuY2xhc3NOYW1lO1xuICAgIHZhciBtYXRjaCA9IGNsYXNzVGVzdChjbHMpLmV4ZWMoY3VycmVudCk7XG4gICAgaWYgKG1hdGNoKSB7XG4gICAgICB2YXIgYWZ0ZXIgPSBjdXJyZW50LnNsaWNlKG1hdGNoLmluZGV4ICsgbWF0Y2hbMF0ubGVuZ3RoKTtcbiAgICAgIG5vZGUuY2xhc3NOYW1lID0gY3VycmVudC5zbGljZSgwLCBtYXRjaC5pbmRleCkgKyAoYWZ0ZXIgPyBtYXRjaFsxXSArIGFmdGVyIDogXCJcIik7XG4gICAgfVxuICB9O1xuICB2YXIgYWRkQ2xhc3MgPSBDb2RlTWlycm9yLmFkZENsYXNzID0gZnVuY3Rpb24obm9kZSwgY2xzKSB7XG4gICAgdmFyIGN1cnJlbnQgPSBub2RlLmNsYXNzTmFtZTtcbiAgICBpZiAoIWNsYXNzVGVzdChjbHMpLnRlc3QoY3VycmVudCkpIG5vZGUuY2xhc3NOYW1lICs9IChjdXJyZW50ID8gXCIgXCIgOiBcIlwiKSArIGNscztcbiAgfTtcbiAgZnVuY3Rpb24gam9pbkNsYXNzZXMoYSwgYikge1xuICAgIHZhciBhcyA9IGEuc3BsaXQoXCIgXCIpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXMubGVuZ3RoOyBpKyspXG4gICAgICBpZiAoYXNbaV0gJiYgIWNsYXNzVGVzdChhc1tpXSkudGVzdChiKSkgYiArPSBcIiBcIiArIGFzW2ldO1xuICAgIHJldHVybiBiO1xuICB9XG5cbiAgLy8gV0lORE9XLVdJREUgRVZFTlRTXG5cbiAgLy8gVGhlc2UgbXVzdCBiZSBoYW5kbGVkIGNhcmVmdWxseSwgYmVjYXVzZSBuYWl2ZWx5IHJlZ2lzdGVyaW5nIGFcbiAgLy8gaGFuZGxlciBmb3IgZWFjaCBlZGl0b3Igd2lsbCBjYXVzZSB0aGUgZWRpdG9ycyB0byBuZXZlciBiZVxuICAvLyBnYXJiYWdlIGNvbGxlY3RlZC5cblxuICBmdW5jdGlvbiBmb3JFYWNoQ29kZU1pcnJvcihmKSB7XG4gICAgaWYgKCFkb2N1bWVudC5ib2R5LmdldEVsZW1lbnRzQnlDbGFzc05hbWUpIHJldHVybjtcbiAgICB2YXIgYnlDbGFzcyA9IGRvY3VtZW50LmJvZHkuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcIkNvZGVNaXJyb3JcIik7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBieUNsYXNzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgY20gPSBieUNsYXNzW2ldLkNvZGVNaXJyb3I7XG4gICAgICBpZiAoY20pIGYoY20pO1xuICAgIH1cbiAgfVxuXG4gIHZhciBnbG9iYWxzUmVnaXN0ZXJlZCA9IGZhbHNlO1xuICBmdW5jdGlvbiBlbnN1cmVHbG9iYWxIYW5kbGVycygpIHtcbiAgICBpZiAoZ2xvYmFsc1JlZ2lzdGVyZWQpIHJldHVybjtcbiAgICByZWdpc3Rlckdsb2JhbEhhbmRsZXJzKCk7XG4gICAgZ2xvYmFsc1JlZ2lzdGVyZWQgPSB0cnVlO1xuICB9XG4gIGZ1bmN0aW9uIHJlZ2lzdGVyR2xvYmFsSGFuZGxlcnMoKSB7XG4gICAgLy8gV2hlbiB0aGUgd2luZG93IHJlc2l6ZXMsIHdlIG5lZWQgdG8gcmVmcmVzaCBhY3RpdmUgZWRpdG9ycy5cbiAgICB2YXIgcmVzaXplVGltZXI7XG4gICAgb24od2luZG93LCBcInJlc2l6ZVwiLCBmdW5jdGlvbigpIHtcbiAgICAgIGlmIChyZXNpemVUaW1lciA9PSBudWxsKSByZXNpemVUaW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlc2l6ZVRpbWVyID0gbnVsbDtcbiAgICAgICAgZm9yRWFjaENvZGVNaXJyb3Iob25SZXNpemUpO1xuICAgICAgfSwgMTAwKTtcbiAgICB9KTtcbiAgICAvLyBXaGVuIHRoZSB3aW5kb3cgbG9zZXMgZm9jdXMsIHdlIHdhbnQgdG8gc2hvdyB0aGUgZWRpdG9yIGFzIGJsdXJyZWRcbiAgICBvbih3aW5kb3csIFwiYmx1clwiLCBmdW5jdGlvbigpIHtcbiAgICAgIGZvckVhY2hDb2RlTWlycm9yKG9uQmx1cik7XG4gICAgfSk7XG4gIH1cblxuICAvLyBGRUFUVVJFIERFVEVDVElPTlxuXG4gIC8vIERldGVjdCBkcmFnLWFuZC1kcm9wXG4gIHZhciBkcmFnQW5kRHJvcCA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIFRoZXJlIGlzICpzb21lKiBraW5kIG9mIGRyYWctYW5kLWRyb3Agc3VwcG9ydCBpbiBJRTYtOCwgYnV0IElcbiAgICAvLyBjb3VsZG4ndCBnZXQgaXQgdG8gd29yayB5ZXQuXG4gICAgaWYgKGllICYmIGllX3ZlcnNpb24gPCA5KSByZXR1cm4gZmFsc2U7XG4gICAgdmFyIGRpdiA9IGVsdCgnZGl2Jyk7XG4gICAgcmV0dXJuIFwiZHJhZ2dhYmxlXCIgaW4gZGl2IHx8IFwiZHJhZ0Ryb3BcIiBpbiBkaXY7XG4gIH0oKTtcblxuICB2YXIgendzcFN1cHBvcnRlZDtcbiAgZnVuY3Rpb24gemVyb1dpZHRoRWxlbWVudChtZWFzdXJlKSB7XG4gICAgaWYgKHp3c3BTdXBwb3J0ZWQgPT0gbnVsbCkge1xuICAgICAgdmFyIHRlc3QgPSBlbHQoXCJzcGFuXCIsIFwiXFx1MjAwYlwiKTtcbiAgICAgIHJlbW92ZUNoaWxkcmVuQW5kQWRkKG1lYXN1cmUsIGVsdChcInNwYW5cIiwgW3Rlc3QsIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFwieFwiKV0pKTtcbiAgICAgIGlmIChtZWFzdXJlLmZpcnN0Q2hpbGQub2Zmc2V0SGVpZ2h0ICE9IDApXG4gICAgICAgIHp3c3BTdXBwb3J0ZWQgPSB0ZXN0Lm9mZnNldFdpZHRoIDw9IDEgJiYgdGVzdC5vZmZzZXRIZWlnaHQgPiAyICYmICEoaWUgJiYgaWVfdmVyc2lvbiA8IDgpO1xuICAgIH1cbiAgICB2YXIgbm9kZSA9IHp3c3BTdXBwb3J0ZWQgPyBlbHQoXCJzcGFuXCIsIFwiXFx1MjAwYlwiKSA6XG4gICAgICBlbHQoXCJzcGFuXCIsIFwiXFx1MDBhMFwiLCBudWxsLCBcImRpc3BsYXk6IGlubGluZS1ibG9jazsgd2lkdGg6IDFweDsgbWFyZ2luLXJpZ2h0OiAtMXB4XCIpO1xuICAgIG5vZGUuc2V0QXR0cmlidXRlKFwiY20tdGV4dFwiLCBcIlwiKTtcbiAgICByZXR1cm4gbm9kZTtcbiAgfVxuXG4gIC8vIEZlYXR1cmUtZGV0ZWN0IElFJ3MgY3J1bW15IGNsaWVudCByZWN0IHJlcG9ydGluZyBmb3IgYmlkaSB0ZXh0XG4gIHZhciBiYWRCaWRpUmVjdHM7XG4gIGZ1bmN0aW9uIGhhc0JhZEJpZGlSZWN0cyhtZWFzdXJlKSB7XG4gICAgaWYgKGJhZEJpZGlSZWN0cyAhPSBudWxsKSByZXR1cm4gYmFkQmlkaVJlY3RzO1xuICAgIHZhciB0eHQgPSByZW1vdmVDaGlsZHJlbkFuZEFkZChtZWFzdXJlLCBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIkFcXHUwNjJlQVwiKSk7XG4gICAgdmFyIHIwID0gcmFuZ2UodHh0LCAwLCAxKS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBpZiAoIXIwIHx8IHIwLmxlZnQgPT0gcjAucmlnaHQpIHJldHVybiBmYWxzZTsgLy8gU2FmYXJpIHJldHVybnMgbnVsbCBpbiBzb21lIGNhc2VzICgjMjc4MClcbiAgICB2YXIgcjEgPSByYW5nZSh0eHQsIDEsIDIpLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIHJldHVybiBiYWRCaWRpUmVjdHMgPSAocjEucmlnaHQgLSByMC5yaWdodCA8IDMpO1xuICB9XG5cbiAgLy8gU2VlIGlmIFwiXCIuc3BsaXQgaXMgdGhlIGJyb2tlbiBJRSB2ZXJzaW9uLCBpZiBzbywgcHJvdmlkZSBhblxuICAvLyBhbHRlcm5hdGl2ZSB3YXkgdG8gc3BsaXQgbGluZXMuXG4gIHZhciBzcGxpdExpbmVzQXV0byA9IENvZGVNaXJyb3Iuc3BsaXRMaW5lcyA9IFwiXFxuXFxuYlwiLnNwbGl0KC9cXG4vKS5sZW5ndGggIT0gMyA/IGZ1bmN0aW9uKHN0cmluZykge1xuICAgIHZhciBwb3MgPSAwLCByZXN1bHQgPSBbXSwgbCA9IHN0cmluZy5sZW5ndGg7XG4gICAgd2hpbGUgKHBvcyA8PSBsKSB7XG4gICAgICB2YXIgbmwgPSBzdHJpbmcuaW5kZXhPZihcIlxcblwiLCBwb3MpO1xuICAgICAgaWYgKG5sID09IC0xKSBubCA9IHN0cmluZy5sZW5ndGg7XG4gICAgICB2YXIgbGluZSA9IHN0cmluZy5zbGljZShwb3MsIHN0cmluZy5jaGFyQXQobmwgLSAxKSA9PSBcIlxcclwiID8gbmwgLSAxIDogbmwpO1xuICAgICAgdmFyIHJ0ID0gbGluZS5pbmRleE9mKFwiXFxyXCIpO1xuICAgICAgaWYgKHJ0ICE9IC0xKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKGxpbmUuc2xpY2UoMCwgcnQpKTtcbiAgICAgICAgcG9zICs9IHJ0ICsgMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKGxpbmUpO1xuICAgICAgICBwb3MgPSBubCArIDE7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH0gOiBmdW5jdGlvbihzdHJpbmcpe3JldHVybiBzdHJpbmcuc3BsaXQoL1xcclxcbj98XFxuLyk7fTtcblxuICB2YXIgaGFzU2VsZWN0aW9uID0gd2luZG93LmdldFNlbGVjdGlvbiA/IGZ1bmN0aW9uKHRlKSB7XG4gICAgdHJ5IHsgcmV0dXJuIHRlLnNlbGVjdGlvblN0YXJ0ICE9IHRlLnNlbGVjdGlvbkVuZDsgfVxuICAgIGNhdGNoKGUpIHsgcmV0dXJuIGZhbHNlOyB9XG4gIH0gOiBmdW5jdGlvbih0ZSkge1xuICAgIHRyeSB7dmFyIHJhbmdlID0gdGUub3duZXJEb2N1bWVudC5zZWxlY3Rpb24uY3JlYXRlUmFuZ2UoKTt9XG4gICAgY2F0Y2goZSkge31cbiAgICBpZiAoIXJhbmdlIHx8IHJhbmdlLnBhcmVudEVsZW1lbnQoKSAhPSB0ZSkgcmV0dXJuIGZhbHNlO1xuICAgIHJldHVybiByYW5nZS5jb21wYXJlRW5kUG9pbnRzKFwiU3RhcnRUb0VuZFwiLCByYW5nZSkgIT0gMDtcbiAgfTtcblxuICB2YXIgaGFzQ29weUV2ZW50ID0gKGZ1bmN0aW9uKCkge1xuICAgIHZhciBlID0gZWx0KFwiZGl2XCIpO1xuICAgIGlmIChcIm9uY29weVwiIGluIGUpIHJldHVybiB0cnVlO1xuICAgIGUuc2V0QXR0cmlidXRlKFwib25jb3B5XCIsIFwicmV0dXJuO1wiKTtcbiAgICByZXR1cm4gdHlwZW9mIGUub25jb3B5ID09IFwiZnVuY3Rpb25cIjtcbiAgfSkoKTtcblxuICB2YXIgYmFkWm9vbWVkUmVjdHMgPSBudWxsO1xuICBmdW5jdGlvbiBoYXNCYWRab29tZWRSZWN0cyhtZWFzdXJlKSB7XG4gICAgaWYgKGJhZFpvb21lZFJlY3RzICE9IG51bGwpIHJldHVybiBiYWRab29tZWRSZWN0cztcbiAgICB2YXIgbm9kZSA9IHJlbW92ZUNoaWxkcmVuQW5kQWRkKG1lYXN1cmUsIGVsdChcInNwYW5cIiwgXCJ4XCIpKTtcbiAgICB2YXIgbm9ybWFsID0gbm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICB2YXIgZnJvbVJhbmdlID0gcmFuZ2Uobm9kZSwgMCwgMSkuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgcmV0dXJuIGJhZFpvb21lZFJlY3RzID0gTWF0aC5hYnMobm9ybWFsLmxlZnQgLSBmcm9tUmFuZ2UubGVmdCkgPiAxO1xuICB9XG5cbiAgLy8gS0VZIE5BTUVTXG5cbiAgdmFyIGtleU5hbWVzID0gQ29kZU1pcnJvci5rZXlOYW1lcyA9IHtcbiAgICAzOiBcIkVudGVyXCIsIDg6IFwiQmFja3NwYWNlXCIsIDk6IFwiVGFiXCIsIDEzOiBcIkVudGVyXCIsIDE2OiBcIlNoaWZ0XCIsIDE3OiBcIkN0cmxcIiwgMTg6IFwiQWx0XCIsXG4gICAgMTk6IFwiUGF1c2VcIiwgMjA6IFwiQ2Fwc0xvY2tcIiwgMjc6IFwiRXNjXCIsIDMyOiBcIlNwYWNlXCIsIDMzOiBcIlBhZ2VVcFwiLCAzNDogXCJQYWdlRG93blwiLCAzNTogXCJFbmRcIixcbiAgICAzNjogXCJIb21lXCIsIDM3OiBcIkxlZnRcIiwgMzg6IFwiVXBcIiwgMzk6IFwiUmlnaHRcIiwgNDA6IFwiRG93blwiLCA0NDogXCJQcmludFNjcm5cIiwgNDU6IFwiSW5zZXJ0XCIsXG4gICAgNDY6IFwiRGVsZXRlXCIsIDU5OiBcIjtcIiwgNjE6IFwiPVwiLCA5MTogXCJNb2RcIiwgOTI6IFwiTW9kXCIsIDkzOiBcIk1vZFwiLFxuICAgIDEwNjogXCIqXCIsIDEwNzogXCI9XCIsIDEwOTogXCItXCIsIDExMDogXCIuXCIsIDExMTogXCIvXCIsIDEyNzogXCJEZWxldGVcIixcbiAgICAxNzM6IFwiLVwiLCAxODY6IFwiO1wiLCAxODc6IFwiPVwiLCAxODg6IFwiLFwiLCAxODk6IFwiLVwiLCAxOTA6IFwiLlwiLCAxOTE6IFwiL1wiLCAxOTI6IFwiYFwiLCAyMTk6IFwiW1wiLCAyMjA6IFwiXFxcXFwiLFxuICAgIDIyMTogXCJdXCIsIDIyMjogXCInXCIsIDYzMjMyOiBcIlVwXCIsIDYzMjMzOiBcIkRvd25cIiwgNjMyMzQ6IFwiTGVmdFwiLCA2MzIzNTogXCJSaWdodFwiLCA2MzI3MjogXCJEZWxldGVcIixcbiAgICA2MzI3MzogXCJIb21lXCIsIDYzMjc1OiBcIkVuZFwiLCA2MzI3NjogXCJQYWdlVXBcIiwgNjMyNzc6IFwiUGFnZURvd25cIiwgNjMzMDI6IFwiSW5zZXJ0XCJcbiAgfTtcbiAgKGZ1bmN0aW9uKCkge1xuICAgIC8vIE51bWJlciBrZXlzXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCAxMDsgaSsrKSBrZXlOYW1lc1tpICsgNDhdID0ga2V5TmFtZXNbaSArIDk2XSA9IFN0cmluZyhpKTtcbiAgICAvLyBBbHBoYWJldGljIGtleXNcbiAgICBmb3IgKHZhciBpID0gNjU7IGkgPD0gOTA7IGkrKykga2V5TmFtZXNbaV0gPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGkpO1xuICAgIC8vIEZ1bmN0aW9uIGtleXNcbiAgICBmb3IgKHZhciBpID0gMTsgaSA8PSAxMjsgaSsrKSBrZXlOYW1lc1tpICsgMTExXSA9IGtleU5hbWVzW2kgKyA2MzIzNV0gPSBcIkZcIiArIGk7XG4gIH0pKCk7XG5cbiAgLy8gQklESSBIRUxQRVJTXG5cbiAgZnVuY3Rpb24gaXRlcmF0ZUJpZGlTZWN0aW9ucyhvcmRlciwgZnJvbSwgdG8sIGYpIHtcbiAgICBpZiAoIW9yZGVyKSByZXR1cm4gZihmcm9tLCB0bywgXCJsdHJcIik7XG4gICAgdmFyIGZvdW5kID0gZmFsc2U7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvcmRlci5sZW5ndGg7ICsraSkge1xuICAgICAgdmFyIHBhcnQgPSBvcmRlcltpXTtcbiAgICAgIGlmIChwYXJ0LmZyb20gPCB0byAmJiBwYXJ0LnRvID4gZnJvbSB8fCBmcm9tID09IHRvICYmIHBhcnQudG8gPT0gZnJvbSkge1xuICAgICAgICBmKE1hdGgubWF4KHBhcnQuZnJvbSwgZnJvbSksIE1hdGgubWluKHBhcnQudG8sIHRvKSwgcGFydC5sZXZlbCA9PSAxID8gXCJydGxcIiA6IFwibHRyXCIpO1xuICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghZm91bmQpIGYoZnJvbSwgdG8sIFwibHRyXCIpO1xuICB9XG5cbiAgZnVuY3Rpb24gYmlkaUxlZnQocGFydCkgeyByZXR1cm4gcGFydC5sZXZlbCAlIDIgPyBwYXJ0LnRvIDogcGFydC5mcm9tOyB9XG4gIGZ1bmN0aW9uIGJpZGlSaWdodChwYXJ0KSB7IHJldHVybiBwYXJ0LmxldmVsICUgMiA/IHBhcnQuZnJvbSA6IHBhcnQudG87IH1cblxuICBmdW5jdGlvbiBsaW5lTGVmdChsaW5lKSB7IHZhciBvcmRlciA9IGdldE9yZGVyKGxpbmUpOyByZXR1cm4gb3JkZXIgPyBiaWRpTGVmdChvcmRlclswXSkgOiAwOyB9XG4gIGZ1bmN0aW9uIGxpbmVSaWdodChsaW5lKSB7XG4gICAgdmFyIG9yZGVyID0gZ2V0T3JkZXIobGluZSk7XG4gICAgaWYgKCFvcmRlcikgcmV0dXJuIGxpbmUudGV4dC5sZW5ndGg7XG4gICAgcmV0dXJuIGJpZGlSaWdodChsc3Qob3JkZXIpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGxpbmVTdGFydChjbSwgbGluZU4pIHtcbiAgICB2YXIgbGluZSA9IGdldExpbmUoY20uZG9jLCBsaW5lTik7XG4gICAgdmFyIHZpc3VhbCA9IHZpc3VhbExpbmUobGluZSk7XG4gICAgaWYgKHZpc3VhbCAhPSBsaW5lKSBsaW5lTiA9IGxpbmVObyh2aXN1YWwpO1xuICAgIHZhciBvcmRlciA9IGdldE9yZGVyKHZpc3VhbCk7XG4gICAgdmFyIGNoID0gIW9yZGVyID8gMCA6IG9yZGVyWzBdLmxldmVsICUgMiA/IGxpbmVSaWdodCh2aXN1YWwpIDogbGluZUxlZnQodmlzdWFsKTtcbiAgICByZXR1cm4gUG9zKGxpbmVOLCBjaCk7XG4gIH1cbiAgZnVuY3Rpb24gbGluZUVuZChjbSwgbGluZU4pIHtcbiAgICB2YXIgbWVyZ2VkLCBsaW5lID0gZ2V0TGluZShjbS5kb2MsIGxpbmVOKTtcbiAgICB3aGlsZSAobWVyZ2VkID0gY29sbGFwc2VkU3BhbkF0RW5kKGxpbmUpKSB7XG4gICAgICBsaW5lID0gbWVyZ2VkLmZpbmQoMSwgdHJ1ZSkubGluZTtcbiAgICAgIGxpbmVOID0gbnVsbDtcbiAgICB9XG4gICAgdmFyIG9yZGVyID0gZ2V0T3JkZXIobGluZSk7XG4gICAgdmFyIGNoID0gIW9yZGVyID8gbGluZS50ZXh0Lmxlbmd0aCA6IG9yZGVyWzBdLmxldmVsICUgMiA/IGxpbmVMZWZ0KGxpbmUpIDogbGluZVJpZ2h0KGxpbmUpO1xuICAgIHJldHVybiBQb3MobGluZU4gPT0gbnVsbCA/IGxpbmVObyhsaW5lKSA6IGxpbmVOLCBjaCk7XG4gIH1cbiAgZnVuY3Rpb24gbGluZVN0YXJ0U21hcnQoY20sIHBvcykge1xuICAgIHZhciBzdGFydCA9IGxpbmVTdGFydChjbSwgcG9zLmxpbmUpO1xuICAgIHZhciBsaW5lID0gZ2V0TGluZShjbS5kb2MsIHN0YXJ0LmxpbmUpO1xuICAgIHZhciBvcmRlciA9IGdldE9yZGVyKGxpbmUpO1xuICAgIGlmICghb3JkZXIgfHwgb3JkZXJbMF0ubGV2ZWwgPT0gMCkge1xuICAgICAgdmFyIGZpcnN0Tm9uV1MgPSBNYXRoLm1heCgwLCBsaW5lLnRleHQuc2VhcmNoKC9cXFMvKSk7XG4gICAgICB2YXIgaW5XUyA9IHBvcy5saW5lID09IHN0YXJ0LmxpbmUgJiYgcG9zLmNoIDw9IGZpcnN0Tm9uV1MgJiYgcG9zLmNoO1xuICAgICAgcmV0dXJuIFBvcyhzdGFydC5saW5lLCBpbldTID8gMCA6IGZpcnN0Tm9uV1MpO1xuICAgIH1cbiAgICByZXR1cm4gc3RhcnQ7XG4gIH1cblxuICBmdW5jdGlvbiBjb21wYXJlQmlkaUxldmVsKG9yZGVyLCBhLCBiKSB7XG4gICAgdmFyIGxpbmVkaXIgPSBvcmRlclswXS5sZXZlbDtcbiAgICBpZiAoYSA9PSBsaW5lZGlyKSByZXR1cm4gdHJ1ZTtcbiAgICBpZiAoYiA9PSBsaW5lZGlyKSByZXR1cm4gZmFsc2U7XG4gICAgcmV0dXJuIGEgPCBiO1xuICB9XG4gIHZhciBiaWRpT3RoZXI7XG4gIGZ1bmN0aW9uIGdldEJpZGlQYXJ0QXQob3JkZXIsIHBvcykge1xuICAgIGJpZGlPdGhlciA9IG51bGw7XG4gICAgZm9yICh2YXIgaSA9IDAsIGZvdW5kOyBpIDwgb3JkZXIubGVuZ3RoOyArK2kpIHtcbiAgICAgIHZhciBjdXIgPSBvcmRlcltpXTtcbiAgICAgIGlmIChjdXIuZnJvbSA8IHBvcyAmJiBjdXIudG8gPiBwb3MpIHJldHVybiBpO1xuICAgICAgaWYgKChjdXIuZnJvbSA9PSBwb3MgfHwgY3VyLnRvID09IHBvcykpIHtcbiAgICAgICAgaWYgKGZvdW5kID09IG51bGwpIHtcbiAgICAgICAgICBmb3VuZCA9IGk7XG4gICAgICAgIH0gZWxzZSBpZiAoY29tcGFyZUJpZGlMZXZlbChvcmRlciwgY3VyLmxldmVsLCBvcmRlcltmb3VuZF0ubGV2ZWwpKSB7XG4gICAgICAgICAgaWYgKGN1ci5mcm9tICE9IGN1ci50bykgYmlkaU90aGVyID0gZm91bmQ7XG4gICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKGN1ci5mcm9tICE9IGN1ci50bykgYmlkaU90aGVyID0gaTtcbiAgICAgICAgICByZXR1cm4gZm91bmQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZvdW5kO1xuICB9XG5cbiAgZnVuY3Rpb24gbW92ZUluTGluZShsaW5lLCBwb3MsIGRpciwgYnlVbml0KSB7XG4gICAgaWYgKCFieVVuaXQpIHJldHVybiBwb3MgKyBkaXI7XG4gICAgZG8gcG9zICs9IGRpcjtcbiAgICB3aGlsZSAocG9zID4gMCAmJiBpc0V4dGVuZGluZ0NoYXIobGluZS50ZXh0LmNoYXJBdChwb3MpKSk7XG4gICAgcmV0dXJuIHBvcztcbiAgfVxuXG4gIC8vIFRoaXMgaXMgbmVlZGVkIGluIG9yZGVyIHRvIG1vdmUgJ3Zpc3VhbGx5JyB0aHJvdWdoIGJpLWRpcmVjdGlvbmFsXG4gIC8vIHRleHQgLS0gaS5lLiwgcHJlc3NpbmcgbGVmdCBzaG91bGQgbWFrZSB0aGUgY3Vyc29yIGdvIGxlZnQsIGV2ZW5cbiAgLy8gd2hlbiBpbiBSVEwgdGV4dC4gVGhlIHRyaWNreSBwYXJ0IGlzIHRoZSAnanVtcHMnLCB3aGVyZSBSVEwgYW5kXG4gIC8vIExUUiB0ZXh0IHRvdWNoIGVhY2ggb3RoZXIuIFRoaXMgb2Z0ZW4gcmVxdWlyZXMgdGhlIGN1cnNvciBvZmZzZXRcbiAgLy8gdG8gbW92ZSBtb3JlIHRoYW4gb25lIHVuaXQsIGluIG9yZGVyIHRvIHZpc3VhbGx5IG1vdmUgb25lIHVuaXQuXG4gIGZ1bmN0aW9uIG1vdmVWaXN1YWxseShsaW5lLCBzdGFydCwgZGlyLCBieVVuaXQpIHtcbiAgICB2YXIgYmlkaSA9IGdldE9yZGVyKGxpbmUpO1xuICAgIGlmICghYmlkaSkgcmV0dXJuIG1vdmVMb2dpY2FsbHkobGluZSwgc3RhcnQsIGRpciwgYnlVbml0KTtcbiAgICB2YXIgcG9zID0gZ2V0QmlkaVBhcnRBdChiaWRpLCBzdGFydCksIHBhcnQgPSBiaWRpW3Bvc107XG4gICAgdmFyIHRhcmdldCA9IG1vdmVJbkxpbmUobGluZSwgc3RhcnQsIHBhcnQubGV2ZWwgJSAyID8gLWRpciA6IGRpciwgYnlVbml0KTtcblxuICAgIGZvciAoOzspIHtcbiAgICAgIGlmICh0YXJnZXQgPiBwYXJ0LmZyb20gJiYgdGFyZ2V0IDwgcGFydC50bykgcmV0dXJuIHRhcmdldDtcbiAgICAgIGlmICh0YXJnZXQgPT0gcGFydC5mcm9tIHx8IHRhcmdldCA9PSBwYXJ0LnRvKSB7XG4gICAgICAgIGlmIChnZXRCaWRpUGFydEF0KGJpZGksIHRhcmdldCkgPT0gcG9zKSByZXR1cm4gdGFyZ2V0O1xuICAgICAgICBwYXJ0ID0gYmlkaVtwb3MgKz0gZGlyXTtcbiAgICAgICAgcmV0dXJuIChkaXIgPiAwKSA9PSBwYXJ0LmxldmVsICUgMiA/IHBhcnQudG8gOiBwYXJ0LmZyb207XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwYXJ0ID0gYmlkaVtwb3MgKz0gZGlyXTtcbiAgICAgICAgaWYgKCFwYXJ0KSByZXR1cm4gbnVsbDtcbiAgICAgICAgaWYgKChkaXIgPiAwKSA9PSBwYXJ0LmxldmVsICUgMilcbiAgICAgICAgICB0YXJnZXQgPSBtb3ZlSW5MaW5lKGxpbmUsIHBhcnQudG8sIC0xLCBieVVuaXQpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgdGFyZ2V0ID0gbW92ZUluTGluZShsaW5lLCBwYXJ0LmZyb20sIDEsIGJ5VW5pdCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gbW92ZUxvZ2ljYWxseShsaW5lLCBzdGFydCwgZGlyLCBieVVuaXQpIHtcbiAgICB2YXIgdGFyZ2V0ID0gc3RhcnQgKyBkaXI7XG4gICAgaWYgKGJ5VW5pdCkgd2hpbGUgKHRhcmdldCA+IDAgJiYgaXNFeHRlbmRpbmdDaGFyKGxpbmUudGV4dC5jaGFyQXQodGFyZ2V0KSkpIHRhcmdldCArPSBkaXI7XG4gICAgcmV0dXJuIHRhcmdldCA8IDAgfHwgdGFyZ2V0ID4gbGluZS50ZXh0Lmxlbmd0aCA/IG51bGwgOiB0YXJnZXQ7XG4gIH1cblxuICAvLyBCaWRpcmVjdGlvbmFsIG9yZGVyaW5nIGFsZ29yaXRobVxuICAvLyBTZWUgaHR0cDovL3VuaWNvZGUub3JnL3JlcG9ydHMvdHI5L3RyOS0xMy5odG1sIGZvciB0aGUgYWxnb3JpdGhtXG4gIC8vIHRoYXQgdGhpcyAocGFydGlhbGx5KSBpbXBsZW1lbnRzLlxuXG4gIC8vIE9uZS1jaGFyIGNvZGVzIHVzZWQgZm9yIGNoYXJhY3RlciB0eXBlczpcbiAgLy8gTCAoTCk6ICAgTGVmdC10by1SaWdodFxuICAvLyBSIChSKTogICBSaWdodC10by1MZWZ0XG4gIC8vIHIgKEFMKTogIFJpZ2h0LXRvLUxlZnQgQXJhYmljXG4gIC8vIDEgKEVOKTogIEV1cm9wZWFuIE51bWJlclxuICAvLyArIChFUyk6ICBFdXJvcGVhbiBOdW1iZXIgU2VwYXJhdG9yXG4gIC8vICUgKEVUKTogIEV1cm9wZWFuIE51bWJlciBUZXJtaW5hdG9yXG4gIC8vIG4gKEFOKTogIEFyYWJpYyBOdW1iZXJcbiAgLy8gLCAoQ1MpOiAgQ29tbW9uIE51bWJlciBTZXBhcmF0b3JcbiAgLy8gbSAoTlNNKTogTm9uLVNwYWNpbmcgTWFya1xuICAvLyBiIChCTik6ICBCb3VuZGFyeSBOZXV0cmFsXG4gIC8vIHMgKEIpOiAgIFBhcmFncmFwaCBTZXBhcmF0b3JcbiAgLy8gdCAoUyk6ICAgU2VnbWVudCBTZXBhcmF0b3JcbiAgLy8gdyAoV1MpOiAgV2hpdGVzcGFjZVxuICAvLyBOIChPTik6ICBPdGhlciBOZXV0cmFsc1xuXG4gIC8vIFJldHVybnMgbnVsbCBpZiBjaGFyYWN0ZXJzIGFyZSBvcmRlcmVkIGFzIHRoZXkgYXBwZWFyXG4gIC8vIChsZWZ0LXRvLXJpZ2h0KSwgb3IgYW4gYXJyYXkgb2Ygc2VjdGlvbnMgKHtmcm9tLCB0bywgbGV2ZWx9XG4gIC8vIG9iamVjdHMpIGluIHRoZSBvcmRlciBpbiB3aGljaCB0aGV5IG9jY3VyIHZpc3VhbGx5LlxuICB2YXIgYmlkaU9yZGVyaW5nID0gKGZ1bmN0aW9uKCkge1xuICAgIC8vIENoYXJhY3RlciB0eXBlcyBmb3IgY29kZXBvaW50cyAwIHRvIDB4ZmZcbiAgICB2YXIgbG93VHlwZXMgPSBcImJiYmJiYmJiYnRzdHdzYmJiYmJiYmJiYmJiYmJzc3N0d05OJSUlTk5OTk5OLE4sTjExMTExMTExMTFOTk5OTk5OTExMTExMTExMTExMTExMTExMTExMTExMTExOTk5OTk5MTExMTExMTExMTExMTExMTExMTExMTExMTE5OTk5iYmJiYmJzYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmIsTiUlJSVOTk5OTE5OTk5OJSUxMU5MTk5OMUxOTk5OTkxMTExMTExMTExMTExMTExMTExMTExMTkxMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExOXCI7XG4gICAgLy8gQ2hhcmFjdGVyIHR5cGVzIGZvciBjb2RlcG9pbnRzIDB4NjAwIHRvIDB4NmZmXG4gICAgdmFyIGFyYWJpY1R5cGVzID0gXCJycnJycnJycnJycnIsck5ObW1tbW1tcnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJtbW1tbW1tbW1tbW1tbXJycnJycnJubm5ubm5ubm5uJW5ucnJybXJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJybW1tbW1tbW1tbW1tbW1tbW1tbU5tbW1tXCI7XG4gICAgZnVuY3Rpb24gY2hhclR5cGUoY29kZSkge1xuICAgICAgaWYgKGNvZGUgPD0gMHhmNykgcmV0dXJuIGxvd1R5cGVzLmNoYXJBdChjb2RlKTtcbiAgICAgIGVsc2UgaWYgKDB4NTkwIDw9IGNvZGUgJiYgY29kZSA8PSAweDVmNCkgcmV0dXJuIFwiUlwiO1xuICAgICAgZWxzZSBpZiAoMHg2MDAgPD0gY29kZSAmJiBjb2RlIDw9IDB4NmVkKSByZXR1cm4gYXJhYmljVHlwZXMuY2hhckF0KGNvZGUgLSAweDYwMCk7XG4gICAgICBlbHNlIGlmICgweDZlZSA8PSBjb2RlICYmIGNvZGUgPD0gMHg4YWMpIHJldHVybiBcInJcIjtcbiAgICAgIGVsc2UgaWYgKDB4MjAwMCA8PSBjb2RlICYmIGNvZGUgPD0gMHgyMDBiKSByZXR1cm4gXCJ3XCI7XG4gICAgICBlbHNlIGlmIChjb2RlID09IDB4MjAwYykgcmV0dXJuIFwiYlwiO1xuICAgICAgZWxzZSByZXR1cm4gXCJMXCI7XG4gICAgfVxuXG4gICAgdmFyIGJpZGlSRSA9IC9bXFx1MDU5MC1cXHUwNWY0XFx1MDYwMC1cXHUwNmZmXFx1MDcwMC1cXHUwOGFjXS87XG4gICAgdmFyIGlzTmV1dHJhbCA9IC9bc3R3Tl0vLCBpc1N0cm9uZyA9IC9bTFJyXS8sIGNvdW50c0FzTGVmdCA9IC9bTGIxbl0vLCBjb3VudHNBc051bSA9IC9bMW5dLztcbiAgICAvLyBCcm93c2VycyBzZWVtIHRvIGFsd2F5cyB0cmVhdCB0aGUgYm91bmRhcmllcyBvZiBibG9jayBlbGVtZW50cyBhcyBiZWluZyBMLlxuICAgIHZhciBvdXRlclR5cGUgPSBcIkxcIjtcblxuICAgIGZ1bmN0aW9uIEJpZGlTcGFuKGxldmVsLCBmcm9tLCB0bykge1xuICAgICAgdGhpcy5sZXZlbCA9IGxldmVsO1xuICAgICAgdGhpcy5mcm9tID0gZnJvbTsgdGhpcy50byA9IHRvO1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbihzdHIpIHtcbiAgICAgIGlmICghYmlkaVJFLnRlc3Qoc3RyKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgdmFyIGxlbiA9IHN0ci5sZW5ndGgsIHR5cGVzID0gW107XG4gICAgICBmb3IgKHZhciBpID0gMCwgdHlwZTsgaSA8IGxlbjsgKytpKVxuICAgICAgICB0eXBlcy5wdXNoKHR5cGUgPSBjaGFyVHlwZShzdHIuY2hhckNvZGVBdChpKSkpO1xuXG4gICAgICAvLyBXMS4gRXhhbWluZSBlYWNoIG5vbi1zcGFjaW5nIG1hcmsgKE5TTSkgaW4gdGhlIGxldmVsIHJ1biwgYW5kXG4gICAgICAvLyBjaGFuZ2UgdGhlIHR5cGUgb2YgdGhlIE5TTSB0byB0aGUgdHlwZSBvZiB0aGUgcHJldmlvdXNcbiAgICAgIC8vIGNoYXJhY3Rlci4gSWYgdGhlIE5TTSBpcyBhdCB0aGUgc3RhcnQgb2YgdGhlIGxldmVsIHJ1biwgaXQgd2lsbFxuICAgICAgLy8gZ2V0IHRoZSB0eXBlIG9mIHNvci5cbiAgICAgIGZvciAodmFyIGkgPSAwLCBwcmV2ID0gb3V0ZXJUeXBlOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgICAgdmFyIHR5cGUgPSB0eXBlc1tpXTtcbiAgICAgICAgaWYgKHR5cGUgPT0gXCJtXCIpIHR5cGVzW2ldID0gcHJldjtcbiAgICAgICAgZWxzZSBwcmV2ID0gdHlwZTtcbiAgICAgIH1cblxuICAgICAgLy8gVzIuIFNlYXJjaCBiYWNrd2FyZHMgZnJvbSBlYWNoIGluc3RhbmNlIG9mIGEgRXVyb3BlYW4gbnVtYmVyXG4gICAgICAvLyB1bnRpbCB0aGUgZmlyc3Qgc3Ryb25nIHR5cGUgKFIsIEwsIEFMLCBvciBzb3IpIGlzIGZvdW5kLiBJZiBhblxuICAgICAgLy8gQUwgaXMgZm91bmQsIGNoYW5nZSB0aGUgdHlwZSBvZiB0aGUgRXVyb3BlYW4gbnVtYmVyIHRvIEFyYWJpY1xuICAgICAgLy8gbnVtYmVyLlxuICAgICAgLy8gVzMuIENoYW5nZSBhbGwgQUxzIHRvIFIuXG4gICAgICBmb3IgKHZhciBpID0gMCwgY3VyID0gb3V0ZXJUeXBlOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgICAgdmFyIHR5cGUgPSB0eXBlc1tpXTtcbiAgICAgICAgaWYgKHR5cGUgPT0gXCIxXCIgJiYgY3VyID09IFwiclwiKSB0eXBlc1tpXSA9IFwiblwiO1xuICAgICAgICBlbHNlIGlmIChpc1N0cm9uZy50ZXN0KHR5cGUpKSB7IGN1ciA9IHR5cGU7IGlmICh0eXBlID09IFwiclwiKSB0eXBlc1tpXSA9IFwiUlwiOyB9XG4gICAgICB9XG5cbiAgICAgIC8vIFc0LiBBIHNpbmdsZSBFdXJvcGVhbiBzZXBhcmF0b3IgYmV0d2VlbiB0d28gRXVyb3BlYW4gbnVtYmVyc1xuICAgICAgLy8gY2hhbmdlcyB0byBhIEV1cm9wZWFuIG51bWJlci4gQSBzaW5nbGUgY29tbW9uIHNlcGFyYXRvciBiZXR3ZWVuXG4gICAgICAvLyB0d28gbnVtYmVycyBvZiB0aGUgc2FtZSB0eXBlIGNoYW5nZXMgdG8gdGhhdCB0eXBlLlxuICAgICAgZm9yICh2YXIgaSA9IDEsIHByZXYgPSB0eXBlc1swXTsgaSA8IGxlbiAtIDE7ICsraSkge1xuICAgICAgICB2YXIgdHlwZSA9IHR5cGVzW2ldO1xuICAgICAgICBpZiAodHlwZSA9PSBcIitcIiAmJiBwcmV2ID09IFwiMVwiICYmIHR5cGVzW2krMV0gPT0gXCIxXCIpIHR5cGVzW2ldID0gXCIxXCI7XG4gICAgICAgIGVsc2UgaWYgKHR5cGUgPT0gXCIsXCIgJiYgcHJldiA9PSB0eXBlc1tpKzFdICYmXG4gICAgICAgICAgICAgICAgIChwcmV2ID09IFwiMVwiIHx8IHByZXYgPT0gXCJuXCIpKSB0eXBlc1tpXSA9IHByZXY7XG4gICAgICAgIHByZXYgPSB0eXBlO1xuICAgICAgfVxuXG4gICAgICAvLyBXNS4gQSBzZXF1ZW5jZSBvZiBFdXJvcGVhbiB0ZXJtaW5hdG9ycyBhZGphY2VudCB0byBFdXJvcGVhblxuICAgICAgLy8gbnVtYmVycyBjaGFuZ2VzIHRvIGFsbCBFdXJvcGVhbiBudW1iZXJzLlxuICAgICAgLy8gVzYuIE90aGVyd2lzZSwgc2VwYXJhdG9ycyBhbmQgdGVybWluYXRvcnMgY2hhbmdlIHRvIE90aGVyXG4gICAgICAvLyBOZXV0cmFsLlxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSkge1xuICAgICAgICB2YXIgdHlwZSA9IHR5cGVzW2ldO1xuICAgICAgICBpZiAodHlwZSA9PSBcIixcIikgdHlwZXNbaV0gPSBcIk5cIjtcbiAgICAgICAgZWxzZSBpZiAodHlwZSA9PSBcIiVcIikge1xuICAgICAgICAgIGZvciAodmFyIGVuZCA9IGkgKyAxOyBlbmQgPCBsZW4gJiYgdHlwZXNbZW5kXSA9PSBcIiVcIjsgKytlbmQpIHt9XG4gICAgICAgICAgdmFyIHJlcGxhY2UgPSAoaSAmJiB0eXBlc1tpLTFdID09IFwiIVwiKSB8fCAoZW5kIDwgbGVuICYmIHR5cGVzW2VuZF0gPT0gXCIxXCIpID8gXCIxXCIgOiBcIk5cIjtcbiAgICAgICAgICBmb3IgKHZhciBqID0gaTsgaiA8IGVuZDsgKytqKSB0eXBlc1tqXSA9IHJlcGxhY2U7XG4gICAgICAgICAgaSA9IGVuZCAtIDE7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gVzcuIFNlYXJjaCBiYWNrd2FyZHMgZnJvbSBlYWNoIGluc3RhbmNlIG9mIGEgRXVyb3BlYW4gbnVtYmVyXG4gICAgICAvLyB1bnRpbCB0aGUgZmlyc3Qgc3Ryb25nIHR5cGUgKFIsIEwsIG9yIHNvcikgaXMgZm91bmQuIElmIGFuIEwgaXNcbiAgICAgIC8vIGZvdW5kLCB0aGVuIGNoYW5nZSB0aGUgdHlwZSBvZiB0aGUgRXVyb3BlYW4gbnVtYmVyIHRvIEwuXG4gICAgICBmb3IgKHZhciBpID0gMCwgY3VyID0gb3V0ZXJUeXBlOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgICAgdmFyIHR5cGUgPSB0eXBlc1tpXTtcbiAgICAgICAgaWYgKGN1ciA9PSBcIkxcIiAmJiB0eXBlID09IFwiMVwiKSB0eXBlc1tpXSA9IFwiTFwiO1xuICAgICAgICBlbHNlIGlmIChpc1N0cm9uZy50ZXN0KHR5cGUpKSBjdXIgPSB0eXBlO1xuICAgICAgfVxuXG4gICAgICAvLyBOMS4gQSBzZXF1ZW5jZSBvZiBuZXV0cmFscyB0YWtlcyB0aGUgZGlyZWN0aW9uIG9mIHRoZVxuICAgICAgLy8gc3Vycm91bmRpbmcgc3Ryb25nIHRleHQgaWYgdGhlIHRleHQgb24gYm90aCBzaWRlcyBoYXMgdGhlIHNhbWVcbiAgICAgIC8vIGRpcmVjdGlvbi4gRXVyb3BlYW4gYW5kIEFyYWJpYyBudW1iZXJzIGFjdCBhcyBpZiB0aGV5IHdlcmUgUiBpblxuICAgICAgLy8gdGVybXMgb2YgdGhlaXIgaW5mbHVlbmNlIG9uIG5ldXRyYWxzLiBTdGFydC1vZi1sZXZlbC1ydW4gKHNvcilcbiAgICAgIC8vIGFuZCBlbmQtb2YtbGV2ZWwtcnVuIChlb3IpIGFyZSB1c2VkIGF0IGxldmVsIHJ1biBib3VuZGFyaWVzLlxuICAgICAgLy8gTjIuIEFueSByZW1haW5pbmcgbmV1dHJhbHMgdGFrZSB0aGUgZW1iZWRkaW5nIGRpcmVjdGlvbi5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgICAgaWYgKGlzTmV1dHJhbC50ZXN0KHR5cGVzW2ldKSkge1xuICAgICAgICAgIGZvciAodmFyIGVuZCA9IGkgKyAxOyBlbmQgPCBsZW4gJiYgaXNOZXV0cmFsLnRlc3QodHlwZXNbZW5kXSk7ICsrZW5kKSB7fVxuICAgICAgICAgIHZhciBiZWZvcmUgPSAoaSA/IHR5cGVzW2ktMV0gOiBvdXRlclR5cGUpID09IFwiTFwiO1xuICAgICAgICAgIHZhciBhZnRlciA9IChlbmQgPCBsZW4gPyB0eXBlc1tlbmRdIDogb3V0ZXJUeXBlKSA9PSBcIkxcIjtcbiAgICAgICAgICB2YXIgcmVwbGFjZSA9IGJlZm9yZSB8fCBhZnRlciA/IFwiTFwiIDogXCJSXCI7XG4gICAgICAgICAgZm9yICh2YXIgaiA9IGk7IGogPCBlbmQ7ICsraikgdHlwZXNbal0gPSByZXBsYWNlO1xuICAgICAgICAgIGkgPSBlbmQgLSAxO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIEhlcmUgd2UgZGVwYXJ0IGZyb20gdGhlIGRvY3VtZW50ZWQgYWxnb3JpdGhtLCBpbiBvcmRlciB0byBhdm9pZFxuICAgICAgLy8gYnVpbGRpbmcgdXAgYW4gYWN0dWFsIGxldmVscyBhcnJheS4gU2luY2UgdGhlcmUgYXJlIG9ubHkgdGhyZWVcbiAgICAgIC8vIGxldmVscyAoMCwgMSwgMikgaW4gYW4gaW1wbGVtZW50YXRpb24gdGhhdCBkb2Vzbid0IHRha2VcbiAgICAgIC8vIGV4cGxpY2l0IGVtYmVkZGluZyBpbnRvIGFjY291bnQsIHdlIGNhbiBidWlsZCB1cCB0aGUgb3JkZXIgb25cbiAgICAgIC8vIHRoZSBmbHksIHdpdGhvdXQgZm9sbG93aW5nIHRoZSBsZXZlbC1iYXNlZCBhbGdvcml0aG0uXG4gICAgICB2YXIgb3JkZXIgPSBbXSwgbTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOykge1xuICAgICAgICBpZiAoY291bnRzQXNMZWZ0LnRlc3QodHlwZXNbaV0pKSB7XG4gICAgICAgICAgdmFyIHN0YXJ0ID0gaTtcbiAgICAgICAgICBmb3IgKCsraTsgaSA8IGxlbiAmJiBjb3VudHNBc0xlZnQudGVzdCh0eXBlc1tpXSk7ICsraSkge31cbiAgICAgICAgICBvcmRlci5wdXNoKG5ldyBCaWRpU3BhbigwLCBzdGFydCwgaSkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBwb3MgPSBpLCBhdCA9IG9yZGVyLmxlbmd0aDtcbiAgICAgICAgICBmb3IgKCsraTsgaSA8IGxlbiAmJiB0eXBlc1tpXSAhPSBcIkxcIjsgKytpKSB7fVxuICAgICAgICAgIGZvciAodmFyIGogPSBwb3M7IGogPCBpOykge1xuICAgICAgICAgICAgaWYgKGNvdW50c0FzTnVtLnRlc3QodHlwZXNbal0pKSB7XG4gICAgICAgICAgICAgIGlmIChwb3MgPCBqKSBvcmRlci5zcGxpY2UoYXQsIDAsIG5ldyBCaWRpU3BhbigxLCBwb3MsIGopKTtcbiAgICAgICAgICAgICAgdmFyIG5zdGFydCA9IGo7XG4gICAgICAgICAgICAgIGZvciAoKytqOyBqIDwgaSAmJiBjb3VudHNBc051bS50ZXN0KHR5cGVzW2pdKTsgKytqKSB7fVxuICAgICAgICAgICAgICBvcmRlci5zcGxpY2UoYXQsIDAsIG5ldyBCaWRpU3BhbigyLCBuc3RhcnQsIGopKTtcbiAgICAgICAgICAgICAgcG9zID0gajtcbiAgICAgICAgICAgIH0gZWxzZSArK2o7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChwb3MgPCBpKSBvcmRlci5zcGxpY2UoYXQsIDAsIG5ldyBCaWRpU3BhbigxLCBwb3MsIGkpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKG9yZGVyWzBdLmxldmVsID09IDEgJiYgKG0gPSBzdHIubWF0Y2goL15cXHMrLykpKSB7XG4gICAgICAgIG9yZGVyWzBdLmZyb20gPSBtWzBdLmxlbmd0aDtcbiAgICAgICAgb3JkZXIudW5zaGlmdChuZXcgQmlkaVNwYW4oMCwgMCwgbVswXS5sZW5ndGgpKTtcbiAgICAgIH1cbiAgICAgIGlmIChsc3Qob3JkZXIpLmxldmVsID09IDEgJiYgKG0gPSBzdHIubWF0Y2goL1xccyskLykpKSB7XG4gICAgICAgIGxzdChvcmRlcikudG8gLT0gbVswXS5sZW5ndGg7XG4gICAgICAgIG9yZGVyLnB1c2gobmV3IEJpZGlTcGFuKDAsIGxlbiAtIG1bMF0ubGVuZ3RoLCBsZW4pKTtcbiAgICAgIH1cbiAgICAgIGlmIChvcmRlclswXS5sZXZlbCA9PSAyKVxuICAgICAgICBvcmRlci51bnNoaWZ0KG5ldyBCaWRpU3BhbigxLCBvcmRlclswXS50bywgb3JkZXJbMF0udG8pKTtcbiAgICAgIGlmIChvcmRlclswXS5sZXZlbCAhPSBsc3Qob3JkZXIpLmxldmVsKVxuICAgICAgICBvcmRlci5wdXNoKG5ldyBCaWRpU3BhbihvcmRlclswXS5sZXZlbCwgbGVuLCBsZW4pKTtcblxuICAgICAgcmV0dXJuIG9yZGVyO1xuICAgIH07XG4gIH0pKCk7XG5cbiAgLy8gVEhFIEVORFxuXG4gIENvZGVNaXJyb3IudmVyc2lvbiA9IFwiNS45LjBcIjtcblxuICByZXR1cm4gQ29kZU1pcnJvcjtcbn0pO1xuIiwiLy8gQ29kZU1pcnJvciwgY29weXJpZ2h0IChjKSBieSBNYXJpam4gSGF2ZXJiZWtlIGFuZCBvdGhlcnNcbi8vIERpc3RyaWJ1dGVkIHVuZGVyIGFuIE1JVCBsaWNlbnNlOiBodHRwOi8vY29kZW1pcnJvci5uZXQvTElDRU5TRVxuXG4vLyBUT0RPIGFjdHVhbGx5IHJlY29nbml6ZSBzeW50YXggb2YgVHlwZVNjcmlwdCBjb25zdHJ1Y3RzXG5cbihmdW5jdGlvbihtb2QpIHtcbiAgaWYgKHR5cGVvZiBleHBvcnRzID09IFwib2JqZWN0XCIgJiYgdHlwZW9mIG1vZHVsZSA9PSBcIm9iamVjdFwiKSAvLyBDb21tb25KU1xuICAgIG1vZChyZXF1aXJlKFwiLi4vLi4vbGliL2NvZGVtaXJyb3JcIikpO1xuICBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kKSAvLyBBTURcbiAgICBkZWZpbmUoW1wiLi4vLi4vbGliL2NvZGVtaXJyb3JcIl0sIG1vZCk7XG4gIGVsc2UgLy8gUGxhaW4gYnJvd3NlciBlbnZcbiAgICBtb2QoQ29kZU1pcnJvcik7XG59KShmdW5jdGlvbihDb2RlTWlycm9yKSB7XG5cInVzZSBzdHJpY3RcIjtcblxuQ29kZU1pcnJvci5kZWZpbmVNb2RlKFwiamF2YXNjcmlwdFwiLCBmdW5jdGlvbihjb25maWcsIHBhcnNlckNvbmZpZykge1xuICB2YXIgaW5kZW50VW5pdCA9IGNvbmZpZy5pbmRlbnRVbml0O1xuICB2YXIgc3RhdGVtZW50SW5kZW50ID0gcGFyc2VyQ29uZmlnLnN0YXRlbWVudEluZGVudDtcbiAgdmFyIGpzb25sZE1vZGUgPSBwYXJzZXJDb25maWcuanNvbmxkO1xuICB2YXIganNvbk1vZGUgPSBwYXJzZXJDb25maWcuanNvbiB8fCBqc29ubGRNb2RlO1xuICB2YXIgaXNUUyA9IHBhcnNlckNvbmZpZy50eXBlc2NyaXB0O1xuICB2YXIgd29yZFJFID0gcGFyc2VyQ29uZmlnLndvcmRDaGFyYWN0ZXJzIHx8IC9bXFx3JFxceGExLVxcdWZmZmZdLztcblxuICAvLyBUb2tlbml6ZXJcblxuICB2YXIga2V5d29yZHMgPSBmdW5jdGlvbigpe1xuICAgIGZ1bmN0aW9uIGt3KHR5cGUpIHtyZXR1cm4ge3R5cGU6IHR5cGUsIHN0eWxlOiBcImtleXdvcmRcIn07fVxuICAgIHZhciBBID0ga3coXCJrZXl3b3JkIGFcIiksIEIgPSBrdyhcImtleXdvcmQgYlwiKSwgQyA9IGt3KFwia2V5d29yZCBjXCIpO1xuICAgIHZhciBvcGVyYXRvciA9IGt3KFwib3BlcmF0b3JcIiksIGF0b20gPSB7dHlwZTogXCJhdG9tXCIsIHN0eWxlOiBcImF0b21cIn07XG5cbiAgICB2YXIganNLZXl3b3JkcyA9IHtcbiAgICAgIFwiaWZcIjoga3coXCJpZlwiKSwgXCJ3aGlsZVwiOiBBLCBcIndpdGhcIjogQSwgXCJlbHNlXCI6IEIsIFwiZG9cIjogQiwgXCJ0cnlcIjogQiwgXCJmaW5hbGx5XCI6IEIsXG4gICAgICBcInJldHVyblwiOiBDLCBcImJyZWFrXCI6IEMsIFwiY29udGludWVcIjogQywgXCJuZXdcIjoga3coXCJuZXdcIiksIFwiZGVsZXRlXCI6IEMsIFwidGhyb3dcIjogQywgXCJkZWJ1Z2dlclwiOiBDLFxuICAgICAgXCJ2YXJcIjoga3coXCJ2YXJcIiksIFwiY29uc3RcIjoga3coXCJ2YXJcIiksIFwibGV0XCI6IGt3KFwidmFyXCIpLFxuICAgICAgXCJmdW5jdGlvblwiOiBrdyhcImZ1bmN0aW9uXCIpLCBcImNhdGNoXCI6IGt3KFwiY2F0Y2hcIiksXG4gICAgICBcImZvclwiOiBrdyhcImZvclwiKSwgXCJzd2l0Y2hcIjoga3coXCJzd2l0Y2hcIiksIFwiY2FzZVwiOiBrdyhcImNhc2VcIiksIFwiZGVmYXVsdFwiOiBrdyhcImRlZmF1bHRcIiksXG4gICAgICBcImluXCI6IG9wZXJhdG9yLCBcInR5cGVvZlwiOiBvcGVyYXRvciwgXCJpbnN0YW5jZW9mXCI6IG9wZXJhdG9yLFxuICAgICAgXCJ0cnVlXCI6IGF0b20sIFwiZmFsc2VcIjogYXRvbSwgXCJudWxsXCI6IGF0b20sIFwidW5kZWZpbmVkXCI6IGF0b20sIFwiTmFOXCI6IGF0b20sIFwiSW5maW5pdHlcIjogYXRvbSxcbiAgICAgIFwidGhpc1wiOiBrdyhcInRoaXNcIiksIFwiY2xhc3NcIjoga3coXCJjbGFzc1wiKSwgXCJzdXBlclwiOiBrdyhcImF0b21cIiksXG4gICAgICBcInlpZWxkXCI6IEMsIFwiZXhwb3J0XCI6IGt3KFwiZXhwb3J0XCIpLCBcImltcG9ydFwiOiBrdyhcImltcG9ydFwiKSwgXCJleHRlbmRzXCI6IENcbiAgICB9O1xuXG4gICAgLy8gRXh0ZW5kIHRoZSAnbm9ybWFsJyBrZXl3b3JkcyB3aXRoIHRoZSBUeXBlU2NyaXB0IGxhbmd1YWdlIGV4dGVuc2lvbnNcbiAgICBpZiAoaXNUUykge1xuICAgICAgdmFyIHR5cGUgPSB7dHlwZTogXCJ2YXJpYWJsZVwiLCBzdHlsZTogXCJ2YXJpYWJsZS0zXCJ9O1xuICAgICAgdmFyIHRzS2V5d29yZHMgPSB7XG4gICAgICAgIC8vIG9iamVjdC1saWtlIHRoaW5nc1xuICAgICAgICBcImludGVyZmFjZVwiOiBrdyhcImludGVyZmFjZVwiKSxcbiAgICAgICAgXCJleHRlbmRzXCI6IGt3KFwiZXh0ZW5kc1wiKSxcbiAgICAgICAgXCJjb25zdHJ1Y3RvclwiOiBrdyhcImNvbnN0cnVjdG9yXCIpLFxuXG4gICAgICAgIC8vIHNjb3BlIG1vZGlmaWVyc1xuICAgICAgICBcInB1YmxpY1wiOiBrdyhcInB1YmxpY1wiKSxcbiAgICAgICAgXCJwcml2YXRlXCI6IGt3KFwicHJpdmF0ZVwiKSxcbiAgICAgICAgXCJwcm90ZWN0ZWRcIjoga3coXCJwcm90ZWN0ZWRcIiksXG4gICAgICAgIFwic3RhdGljXCI6IGt3KFwic3RhdGljXCIpLFxuXG4gICAgICAgIC8vIHR5cGVzXG4gICAgICAgIFwic3RyaW5nXCI6IHR5cGUsIFwibnVtYmVyXCI6IHR5cGUsIFwiYm9vbGVhblwiOiB0eXBlLCBcImFueVwiOiB0eXBlXG4gICAgICB9O1xuXG4gICAgICBmb3IgKHZhciBhdHRyIGluIHRzS2V5d29yZHMpIHtcbiAgICAgICAganNLZXl3b3Jkc1thdHRyXSA9IHRzS2V5d29yZHNbYXR0cl07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGpzS2V5d29yZHM7XG4gIH0oKTtcblxuICB2YXIgaXNPcGVyYXRvckNoYXIgPSAvWytcXC0qJiU9PD4hP3x+Xl0vO1xuICB2YXIgaXNKc29ubGRLZXl3b3JkID0gL15AKGNvbnRleHR8aWR8dmFsdWV8bGFuZ3VhZ2V8dHlwZXxjb250YWluZXJ8bGlzdHxzZXR8cmV2ZXJzZXxpbmRleHxiYXNlfHZvY2FifGdyYXBoKVwiLztcblxuICBmdW5jdGlvbiByZWFkUmVnZXhwKHN0cmVhbSkge1xuICAgIHZhciBlc2NhcGVkID0gZmFsc2UsIG5leHQsIGluU2V0ID0gZmFsc2U7XG4gICAgd2hpbGUgKChuZXh0ID0gc3RyZWFtLm5leHQoKSkgIT0gbnVsbCkge1xuICAgICAgaWYgKCFlc2NhcGVkKSB7XG4gICAgICAgIGlmIChuZXh0ID09IFwiL1wiICYmICFpblNldCkgcmV0dXJuO1xuICAgICAgICBpZiAobmV4dCA9PSBcIltcIikgaW5TZXQgPSB0cnVlO1xuICAgICAgICBlbHNlIGlmIChpblNldCAmJiBuZXh0ID09IFwiXVwiKSBpblNldCA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgZXNjYXBlZCA9ICFlc2NhcGVkICYmIG5leHQgPT0gXCJcXFxcXCI7XG4gICAgfVxuICB9XG5cbiAgLy8gVXNlZCBhcyBzY3JhdGNoIHZhcmlhYmxlcyB0byBjb21tdW5pY2F0ZSBtdWx0aXBsZSB2YWx1ZXMgd2l0aG91dFxuICAvLyBjb25zaW5nIHVwIHRvbnMgb2Ygb2JqZWN0cy5cbiAgdmFyIHR5cGUsIGNvbnRlbnQ7XG4gIGZ1bmN0aW9uIHJldCh0cCwgc3R5bGUsIGNvbnQpIHtcbiAgICB0eXBlID0gdHA7IGNvbnRlbnQgPSBjb250O1xuICAgIHJldHVybiBzdHlsZTtcbiAgfVxuICBmdW5jdGlvbiB0b2tlbkJhc2Uoc3RyZWFtLCBzdGF0ZSkge1xuICAgIHZhciBjaCA9IHN0cmVhbS5uZXh0KCk7XG4gICAgaWYgKGNoID09ICdcIicgfHwgY2ggPT0gXCInXCIpIHtcbiAgICAgIHN0YXRlLnRva2VuaXplID0gdG9rZW5TdHJpbmcoY2gpO1xuICAgICAgcmV0dXJuIHN0YXRlLnRva2VuaXplKHN0cmVhbSwgc3RhdGUpO1xuICAgIH0gZWxzZSBpZiAoY2ggPT0gXCIuXCIgJiYgc3RyZWFtLm1hdGNoKC9eXFxkKyg/OltlRV1bK1xcLV0/XFxkKyk/LykpIHtcbiAgICAgIHJldHVybiByZXQoXCJudW1iZXJcIiwgXCJudW1iZXJcIik7XG4gICAgfSBlbHNlIGlmIChjaCA9PSBcIi5cIiAmJiBzdHJlYW0ubWF0Y2goXCIuLlwiKSkge1xuICAgICAgcmV0dXJuIHJldChcInNwcmVhZFwiLCBcIm1ldGFcIik7XG4gICAgfSBlbHNlIGlmICgvW1xcW1xcXXt9XFwoXFwpLDtcXDpcXC5dLy50ZXN0KGNoKSkge1xuICAgICAgcmV0dXJuIHJldChjaCk7XG4gICAgfSBlbHNlIGlmIChjaCA9PSBcIj1cIiAmJiBzdHJlYW0uZWF0KFwiPlwiKSkge1xuICAgICAgcmV0dXJuIHJldChcIj0+XCIsIFwib3BlcmF0b3JcIik7XG4gICAgfSBlbHNlIGlmIChjaCA9PSBcIjBcIiAmJiBzdHJlYW0uZWF0KC94L2kpKSB7XG4gICAgICBzdHJlYW0uZWF0V2hpbGUoL1tcXGRhLWZdL2kpO1xuICAgICAgcmV0dXJuIHJldChcIm51bWJlclwiLCBcIm51bWJlclwiKTtcbiAgICB9IGVsc2UgaWYgKGNoID09IFwiMFwiICYmIHN0cmVhbS5lYXQoL28vaSkpIHtcbiAgICAgIHN0cmVhbS5lYXRXaGlsZSgvWzAtN10vaSk7XG4gICAgICByZXR1cm4gcmV0KFwibnVtYmVyXCIsIFwibnVtYmVyXCIpO1xuICAgIH0gZWxzZSBpZiAoY2ggPT0gXCIwXCIgJiYgc3RyZWFtLmVhdCgvYi9pKSkge1xuICAgICAgc3RyZWFtLmVhdFdoaWxlKC9bMDFdL2kpO1xuICAgICAgcmV0dXJuIHJldChcIm51bWJlclwiLCBcIm51bWJlclwiKTtcbiAgICB9IGVsc2UgaWYgKC9cXGQvLnRlc3QoY2gpKSB7XG4gICAgICBzdHJlYW0ubWF0Y2goL15cXGQqKD86XFwuXFxkKik/KD86W2VFXVsrXFwtXT9cXGQrKT8vKTtcbiAgICAgIHJldHVybiByZXQoXCJudW1iZXJcIiwgXCJudW1iZXJcIik7XG4gICAgfSBlbHNlIGlmIChjaCA9PSBcIi9cIikge1xuICAgICAgaWYgKHN0cmVhbS5lYXQoXCIqXCIpKSB7XG4gICAgICAgIHN0YXRlLnRva2VuaXplID0gdG9rZW5Db21tZW50O1xuICAgICAgICByZXR1cm4gdG9rZW5Db21tZW50KHN0cmVhbSwgc3RhdGUpO1xuICAgICAgfSBlbHNlIGlmIChzdHJlYW0uZWF0KFwiL1wiKSkge1xuICAgICAgICBzdHJlYW0uc2tpcFRvRW5kKCk7XG4gICAgICAgIHJldHVybiByZXQoXCJjb21tZW50XCIsIFwiY29tbWVudFwiKTtcbiAgICAgIH0gZWxzZSBpZiAoL14oPzpvcGVyYXRvcnxzb2Z8a2V5d29yZCBjfGNhc2V8bmV3fFtcXFt7fVxcKCw7Ol0pJC8udGVzdChzdGF0ZS5sYXN0VHlwZSkpIHtcbiAgICAgICAgcmVhZFJlZ2V4cChzdHJlYW0pO1xuICAgICAgICBzdHJlYW0ubWF0Y2goL15cXGIoKFtnaW15dV0pKD8hW2dpbXl1XSpcXDIpKStcXGIvKTtcbiAgICAgICAgcmV0dXJuIHJldChcInJlZ2V4cFwiLCBcInN0cmluZy0yXCIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RyZWFtLmVhdFdoaWxlKGlzT3BlcmF0b3JDaGFyKTtcbiAgICAgICAgcmV0dXJuIHJldChcIm9wZXJhdG9yXCIsIFwib3BlcmF0b3JcIiwgc3RyZWFtLmN1cnJlbnQoKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChjaCA9PSBcImBcIikge1xuICAgICAgc3RhdGUudG9rZW5pemUgPSB0b2tlblF1YXNpO1xuICAgICAgcmV0dXJuIHRva2VuUXVhc2koc3RyZWFtLCBzdGF0ZSk7XG4gICAgfSBlbHNlIGlmIChjaCA9PSBcIiNcIikge1xuICAgICAgc3RyZWFtLnNraXBUb0VuZCgpO1xuICAgICAgcmV0dXJuIHJldChcImVycm9yXCIsIFwiZXJyb3JcIik7XG4gICAgfSBlbHNlIGlmIChpc09wZXJhdG9yQ2hhci50ZXN0KGNoKSkge1xuICAgICAgc3RyZWFtLmVhdFdoaWxlKGlzT3BlcmF0b3JDaGFyKTtcbiAgICAgIHJldHVybiByZXQoXCJvcGVyYXRvclwiLCBcIm9wZXJhdG9yXCIsIHN0cmVhbS5jdXJyZW50KCkpO1xuICAgIH0gZWxzZSBpZiAod29yZFJFLnRlc3QoY2gpKSB7XG4gICAgICBzdHJlYW0uZWF0V2hpbGUod29yZFJFKTtcbiAgICAgIHZhciB3b3JkID0gc3RyZWFtLmN1cnJlbnQoKSwga25vd24gPSBrZXl3b3Jkcy5wcm9wZXJ0eUlzRW51bWVyYWJsZSh3b3JkKSAmJiBrZXl3b3Jkc1t3b3JkXTtcbiAgICAgIHJldHVybiAoa25vd24gJiYgc3RhdGUubGFzdFR5cGUgIT0gXCIuXCIpID8gcmV0KGtub3duLnR5cGUsIGtub3duLnN0eWxlLCB3b3JkKSA6XG4gICAgICAgICAgICAgICAgICAgICByZXQoXCJ2YXJpYWJsZVwiLCBcInZhcmlhYmxlXCIsIHdvcmQpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHRva2VuU3RyaW5nKHF1b3RlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHN0cmVhbSwgc3RhdGUpIHtcbiAgICAgIHZhciBlc2NhcGVkID0gZmFsc2UsIG5leHQ7XG4gICAgICBpZiAoanNvbmxkTW9kZSAmJiBzdHJlYW0ucGVlaygpID09IFwiQFwiICYmIHN0cmVhbS5tYXRjaChpc0pzb25sZEtleXdvcmQpKXtcbiAgICAgICAgc3RhdGUudG9rZW5pemUgPSB0b2tlbkJhc2U7XG4gICAgICAgIHJldHVybiByZXQoXCJqc29ubGQta2V5d29yZFwiLCBcIm1ldGFcIik7XG4gICAgICB9XG4gICAgICB3aGlsZSAoKG5leHQgPSBzdHJlYW0ubmV4dCgpKSAhPSBudWxsKSB7XG4gICAgICAgIGlmIChuZXh0ID09IHF1b3RlICYmICFlc2NhcGVkKSBicmVhaztcbiAgICAgICAgZXNjYXBlZCA9ICFlc2NhcGVkICYmIG5leHQgPT0gXCJcXFxcXCI7XG4gICAgICB9XG4gICAgICBpZiAoIWVzY2FwZWQpIHN0YXRlLnRva2VuaXplID0gdG9rZW5CYXNlO1xuICAgICAgcmV0dXJuIHJldChcInN0cmluZ1wiLCBcInN0cmluZ1wiKTtcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gdG9rZW5Db21tZW50KHN0cmVhbSwgc3RhdGUpIHtcbiAgICB2YXIgbWF5YmVFbmQgPSBmYWxzZSwgY2g7XG4gICAgd2hpbGUgKGNoID0gc3RyZWFtLm5leHQoKSkge1xuICAgICAgaWYgKGNoID09IFwiL1wiICYmIG1heWJlRW5kKSB7XG4gICAgICAgIHN0YXRlLnRva2VuaXplID0gdG9rZW5CYXNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIG1heWJlRW5kID0gKGNoID09IFwiKlwiKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldChcImNvbW1lbnRcIiwgXCJjb21tZW50XCIpO1xuICB9XG5cbiAgZnVuY3Rpb24gdG9rZW5RdWFzaShzdHJlYW0sIHN0YXRlKSB7XG4gICAgdmFyIGVzY2FwZWQgPSBmYWxzZSwgbmV4dDtcbiAgICB3aGlsZSAoKG5leHQgPSBzdHJlYW0ubmV4dCgpKSAhPSBudWxsKSB7XG4gICAgICBpZiAoIWVzY2FwZWQgJiYgKG5leHQgPT0gXCJgXCIgfHwgbmV4dCA9PSBcIiRcIiAmJiBzdHJlYW0uZWF0KFwie1wiKSkpIHtcbiAgICAgICAgc3RhdGUudG9rZW5pemUgPSB0b2tlbkJhc2U7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgZXNjYXBlZCA9ICFlc2NhcGVkICYmIG5leHQgPT0gXCJcXFxcXCI7XG4gICAgfVxuICAgIHJldHVybiByZXQoXCJxdWFzaVwiLCBcInN0cmluZy0yXCIsIHN0cmVhbS5jdXJyZW50KCkpO1xuICB9XG5cbiAgdmFyIGJyYWNrZXRzID0gXCIoW3t9XSlcIjtcbiAgLy8gVGhpcyBpcyBhIGNydWRlIGxvb2thaGVhZCB0cmljayB0byB0cnkgYW5kIG5vdGljZSB0aGF0IHdlJ3JlXG4gIC8vIHBhcnNpbmcgdGhlIGFyZ3VtZW50IHBhdHRlcm5zIGZvciBhIGZhdC1hcnJvdyBmdW5jdGlvbiBiZWZvcmUgd2VcbiAgLy8gYWN0dWFsbHkgaGl0IHRoZSBhcnJvdyB0b2tlbi4gSXQgb25seSB3b3JrcyBpZiB0aGUgYXJyb3cgaXMgb25cbiAgLy8gdGhlIHNhbWUgbGluZSBhcyB0aGUgYXJndW1lbnRzIGFuZCB0aGVyZSdzIG5vIHN0cmFuZ2Ugbm9pc2VcbiAgLy8gKGNvbW1lbnRzKSBpbiBiZXR3ZWVuLiBGYWxsYmFjayBpcyB0byBvbmx5IG5vdGljZSB3aGVuIHdlIGhpdCB0aGVcbiAgLy8gYXJyb3csIGFuZCBub3QgZGVjbGFyZSB0aGUgYXJndW1lbnRzIGFzIGxvY2FscyBmb3IgdGhlIGFycm93XG4gIC8vIGJvZHkuXG4gIGZ1bmN0aW9uIGZpbmRGYXRBcnJvdyhzdHJlYW0sIHN0YXRlKSB7XG4gICAgaWYgKHN0YXRlLmZhdEFycm93QXQpIHN0YXRlLmZhdEFycm93QXQgPSBudWxsO1xuICAgIHZhciBhcnJvdyA9IHN0cmVhbS5zdHJpbmcuaW5kZXhPZihcIj0+XCIsIHN0cmVhbS5zdGFydCk7XG4gICAgaWYgKGFycm93IDwgMCkgcmV0dXJuO1xuXG4gICAgdmFyIGRlcHRoID0gMCwgc2F3U29tZXRoaW5nID0gZmFsc2U7XG4gICAgZm9yICh2YXIgcG9zID0gYXJyb3cgLSAxOyBwb3MgPj0gMDsgLS1wb3MpIHtcbiAgICAgIHZhciBjaCA9IHN0cmVhbS5zdHJpbmcuY2hhckF0KHBvcyk7XG4gICAgICB2YXIgYnJhY2tldCA9IGJyYWNrZXRzLmluZGV4T2YoY2gpO1xuICAgICAgaWYgKGJyYWNrZXQgPj0gMCAmJiBicmFja2V0IDwgMykge1xuICAgICAgICBpZiAoIWRlcHRoKSB7ICsrcG9zOyBicmVhazsgfVxuICAgICAgICBpZiAoLS1kZXB0aCA9PSAwKSBicmVhaztcbiAgICAgIH0gZWxzZSBpZiAoYnJhY2tldCA+PSAzICYmIGJyYWNrZXQgPCA2KSB7XG4gICAgICAgICsrZGVwdGg7XG4gICAgICB9IGVsc2UgaWYgKHdvcmRSRS50ZXN0KGNoKSkge1xuICAgICAgICBzYXdTb21ldGhpbmcgPSB0cnVlO1xuICAgICAgfSBlbHNlIGlmICgvW1wiJ1xcL10vLnRlc3QoY2gpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH0gZWxzZSBpZiAoc2F3U29tZXRoaW5nICYmICFkZXB0aCkge1xuICAgICAgICArK3BvcztcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChzYXdTb21ldGhpbmcgJiYgIWRlcHRoKSBzdGF0ZS5mYXRBcnJvd0F0ID0gcG9zO1xuICB9XG5cbiAgLy8gUGFyc2VyXG5cbiAgdmFyIGF0b21pY1R5cGVzID0ge1wiYXRvbVwiOiB0cnVlLCBcIm51bWJlclwiOiB0cnVlLCBcInZhcmlhYmxlXCI6IHRydWUsIFwic3RyaW5nXCI6IHRydWUsIFwicmVnZXhwXCI6IHRydWUsIFwidGhpc1wiOiB0cnVlLCBcImpzb25sZC1rZXl3b3JkXCI6IHRydWV9O1xuXG4gIGZ1bmN0aW9uIEpTTGV4aWNhbChpbmRlbnRlZCwgY29sdW1uLCB0eXBlLCBhbGlnbiwgcHJldiwgaW5mbykge1xuICAgIHRoaXMuaW5kZW50ZWQgPSBpbmRlbnRlZDtcbiAgICB0aGlzLmNvbHVtbiA9IGNvbHVtbjtcbiAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgIHRoaXMucHJldiA9IHByZXY7XG4gICAgdGhpcy5pbmZvID0gaW5mbztcbiAgICBpZiAoYWxpZ24gIT0gbnVsbCkgdGhpcy5hbGlnbiA9IGFsaWduO1xuICB9XG5cbiAgZnVuY3Rpb24gaW5TY29wZShzdGF0ZSwgdmFybmFtZSkge1xuICAgIGZvciAodmFyIHYgPSBzdGF0ZS5sb2NhbFZhcnM7IHY7IHYgPSB2Lm5leHQpXG4gICAgICBpZiAodi5uYW1lID09IHZhcm5hbWUpIHJldHVybiB0cnVlO1xuICAgIGZvciAodmFyIGN4ID0gc3RhdGUuY29udGV4dDsgY3g7IGN4ID0gY3gucHJldikge1xuICAgICAgZm9yICh2YXIgdiA9IGN4LnZhcnM7IHY7IHYgPSB2Lm5leHQpXG4gICAgICAgIGlmICh2Lm5hbWUgPT0gdmFybmFtZSkgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcGFyc2VKUyhzdGF0ZSwgc3R5bGUsIHR5cGUsIGNvbnRlbnQsIHN0cmVhbSkge1xuICAgIHZhciBjYyA9IHN0YXRlLmNjO1xuICAgIC8vIENvbW11bmljYXRlIG91ciBjb250ZXh0IHRvIHRoZSBjb21iaW5hdG9ycy5cbiAgICAvLyAoTGVzcyB3YXN0ZWZ1bCB0aGFuIGNvbnNpbmcgdXAgYSBodW5kcmVkIGNsb3N1cmVzIG9uIGV2ZXJ5IGNhbGwuKVxuICAgIGN4LnN0YXRlID0gc3RhdGU7IGN4LnN0cmVhbSA9IHN0cmVhbTsgY3gubWFya2VkID0gbnVsbCwgY3guY2MgPSBjYzsgY3guc3R5bGUgPSBzdHlsZTtcblxuICAgIGlmICghc3RhdGUubGV4aWNhbC5oYXNPd25Qcm9wZXJ0eShcImFsaWduXCIpKVxuICAgICAgc3RhdGUubGV4aWNhbC5hbGlnbiA9IHRydWU7XG5cbiAgICB3aGlsZSh0cnVlKSB7XG4gICAgICB2YXIgY29tYmluYXRvciA9IGNjLmxlbmd0aCA/IGNjLnBvcCgpIDoganNvbk1vZGUgPyBleHByZXNzaW9uIDogc3RhdGVtZW50O1xuICAgICAgaWYgKGNvbWJpbmF0b3IodHlwZSwgY29udGVudCkpIHtcbiAgICAgICAgd2hpbGUoY2MubGVuZ3RoICYmIGNjW2NjLmxlbmd0aCAtIDFdLmxleClcbiAgICAgICAgICBjYy5wb3AoKSgpO1xuICAgICAgICBpZiAoY3gubWFya2VkKSByZXR1cm4gY3gubWFya2VkO1xuICAgICAgICBpZiAodHlwZSA9PSBcInZhcmlhYmxlXCIgJiYgaW5TY29wZShzdGF0ZSwgY29udGVudCkpIHJldHVybiBcInZhcmlhYmxlLTJcIjtcbiAgICAgICAgcmV0dXJuIHN0eWxlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIENvbWJpbmF0b3IgdXRpbHNcblxuICB2YXIgY3ggPSB7c3RhdGU6IG51bGwsIGNvbHVtbjogbnVsbCwgbWFya2VkOiBudWxsLCBjYzogbnVsbH07XG4gIGZ1bmN0aW9uIHBhc3MoKSB7XG4gICAgZm9yICh2YXIgaSA9IGFyZ3VtZW50cy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkgY3guY2MucHVzaChhcmd1bWVudHNbaV0pO1xuICB9XG4gIGZ1bmN0aW9uIGNvbnQoKSB7XG4gICAgcGFzcy5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIGZ1bmN0aW9uIHJlZ2lzdGVyKHZhcm5hbWUpIHtcbiAgICBmdW5jdGlvbiBpbkxpc3QobGlzdCkge1xuICAgICAgZm9yICh2YXIgdiA9IGxpc3Q7IHY7IHYgPSB2Lm5leHQpXG4gICAgICAgIGlmICh2Lm5hbWUgPT0gdmFybmFtZSkgcmV0dXJuIHRydWU7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHZhciBzdGF0ZSA9IGN4LnN0YXRlO1xuICAgIGN4Lm1hcmtlZCA9IFwiZGVmXCI7XG4gICAgaWYgKHN0YXRlLmNvbnRleHQpIHtcbiAgICAgIGlmIChpbkxpc3Qoc3RhdGUubG9jYWxWYXJzKSkgcmV0dXJuO1xuICAgICAgc3RhdGUubG9jYWxWYXJzID0ge25hbWU6IHZhcm5hbWUsIG5leHQ6IHN0YXRlLmxvY2FsVmFyc307XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChpbkxpc3Qoc3RhdGUuZ2xvYmFsVmFycykpIHJldHVybjtcbiAgICAgIGlmIChwYXJzZXJDb25maWcuZ2xvYmFsVmFycylcbiAgICAgICAgc3RhdGUuZ2xvYmFsVmFycyA9IHtuYW1lOiB2YXJuYW1lLCBuZXh0OiBzdGF0ZS5nbG9iYWxWYXJzfTtcbiAgICB9XG4gIH1cblxuICAvLyBDb21iaW5hdG9yc1xuXG4gIHZhciBkZWZhdWx0VmFycyA9IHtuYW1lOiBcInRoaXNcIiwgbmV4dDoge25hbWU6IFwiYXJndW1lbnRzXCJ9fTtcbiAgZnVuY3Rpb24gcHVzaGNvbnRleHQoKSB7XG4gICAgY3guc3RhdGUuY29udGV4dCA9IHtwcmV2OiBjeC5zdGF0ZS5jb250ZXh0LCB2YXJzOiBjeC5zdGF0ZS5sb2NhbFZhcnN9O1xuICAgIGN4LnN0YXRlLmxvY2FsVmFycyA9IGRlZmF1bHRWYXJzO1xuICB9XG4gIGZ1bmN0aW9uIHBvcGNvbnRleHQoKSB7XG4gICAgY3guc3RhdGUubG9jYWxWYXJzID0gY3guc3RhdGUuY29udGV4dC52YXJzO1xuICAgIGN4LnN0YXRlLmNvbnRleHQgPSBjeC5zdGF0ZS5jb250ZXh0LnByZXY7XG4gIH1cbiAgZnVuY3Rpb24gcHVzaGxleCh0eXBlLCBpbmZvKSB7XG4gICAgdmFyIHJlc3VsdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHN0YXRlID0gY3guc3RhdGUsIGluZGVudCA9IHN0YXRlLmluZGVudGVkO1xuICAgICAgaWYgKHN0YXRlLmxleGljYWwudHlwZSA9PSBcInN0YXRcIikgaW5kZW50ID0gc3RhdGUubGV4aWNhbC5pbmRlbnRlZDtcbiAgICAgIGVsc2UgZm9yICh2YXIgb3V0ZXIgPSBzdGF0ZS5sZXhpY2FsOyBvdXRlciAmJiBvdXRlci50eXBlID09IFwiKVwiICYmIG91dGVyLmFsaWduOyBvdXRlciA9IG91dGVyLnByZXYpXG4gICAgICAgIGluZGVudCA9IG91dGVyLmluZGVudGVkO1xuICAgICAgc3RhdGUubGV4aWNhbCA9IG5ldyBKU0xleGljYWwoaW5kZW50LCBjeC5zdHJlYW0uY29sdW1uKCksIHR5cGUsIG51bGwsIHN0YXRlLmxleGljYWwsIGluZm8pO1xuICAgIH07XG4gICAgcmVzdWx0LmxleCA9IHRydWU7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICBmdW5jdGlvbiBwb3BsZXgoKSB7XG4gICAgdmFyIHN0YXRlID0gY3guc3RhdGU7XG4gICAgaWYgKHN0YXRlLmxleGljYWwucHJldikge1xuICAgICAgaWYgKHN0YXRlLmxleGljYWwudHlwZSA9PSBcIilcIilcbiAgICAgICAgc3RhdGUuaW5kZW50ZWQgPSBzdGF0ZS5sZXhpY2FsLmluZGVudGVkO1xuICAgICAgc3RhdGUubGV4aWNhbCA9IHN0YXRlLmxleGljYWwucHJldjtcbiAgICB9XG4gIH1cbiAgcG9wbGV4LmxleCA9IHRydWU7XG5cbiAgZnVuY3Rpb24gZXhwZWN0KHdhbnRlZCkge1xuICAgIGZ1bmN0aW9uIGV4cCh0eXBlKSB7XG4gICAgICBpZiAodHlwZSA9PSB3YW50ZWQpIHJldHVybiBjb250KCk7XG4gICAgICBlbHNlIGlmICh3YW50ZWQgPT0gXCI7XCIpIHJldHVybiBwYXNzKCk7XG4gICAgICBlbHNlIHJldHVybiBjb250KGV4cCk7XG4gICAgfTtcbiAgICByZXR1cm4gZXhwO1xuICB9XG5cbiAgZnVuY3Rpb24gc3RhdGVtZW50KHR5cGUsIHZhbHVlKSB7XG4gICAgaWYgKHR5cGUgPT0gXCJ2YXJcIikgcmV0dXJuIGNvbnQocHVzaGxleChcInZhcmRlZlwiLCB2YWx1ZS5sZW5ndGgpLCB2YXJkZWYsIGV4cGVjdChcIjtcIiksIHBvcGxleCk7XG4gICAgaWYgKHR5cGUgPT0gXCJrZXl3b3JkIGFcIikgcmV0dXJuIGNvbnQocHVzaGxleChcImZvcm1cIiksIGV4cHJlc3Npb24sIHN0YXRlbWVudCwgcG9wbGV4KTtcbiAgICBpZiAodHlwZSA9PSBcImtleXdvcmQgYlwiKSByZXR1cm4gY29udChwdXNobGV4KFwiZm9ybVwiKSwgc3RhdGVtZW50LCBwb3BsZXgpO1xuICAgIGlmICh0eXBlID09IFwie1wiKSByZXR1cm4gY29udChwdXNobGV4KFwifVwiKSwgYmxvY2ssIHBvcGxleCk7XG4gICAgaWYgKHR5cGUgPT0gXCI7XCIpIHJldHVybiBjb250KCk7XG4gICAgaWYgKHR5cGUgPT0gXCJpZlwiKSB7XG4gICAgICBpZiAoY3guc3RhdGUubGV4aWNhbC5pbmZvID09IFwiZWxzZVwiICYmIGN4LnN0YXRlLmNjW2N4LnN0YXRlLmNjLmxlbmd0aCAtIDFdID09IHBvcGxleClcbiAgICAgICAgY3guc3RhdGUuY2MucG9wKCkoKTtcbiAgICAgIHJldHVybiBjb250KHB1c2hsZXgoXCJmb3JtXCIpLCBleHByZXNzaW9uLCBzdGF0ZW1lbnQsIHBvcGxleCwgbWF5YmVlbHNlKTtcbiAgICB9XG4gICAgaWYgKHR5cGUgPT0gXCJmdW5jdGlvblwiKSByZXR1cm4gY29udChmdW5jdGlvbmRlZik7XG4gICAgaWYgKHR5cGUgPT0gXCJmb3JcIikgcmV0dXJuIGNvbnQocHVzaGxleChcImZvcm1cIiksIGZvcnNwZWMsIHN0YXRlbWVudCwgcG9wbGV4KTtcbiAgICBpZiAodHlwZSA9PSBcInZhcmlhYmxlXCIpIHJldHVybiBjb250KHB1c2hsZXgoXCJzdGF0XCIpLCBtYXliZWxhYmVsKTtcbiAgICBpZiAodHlwZSA9PSBcInN3aXRjaFwiKSByZXR1cm4gY29udChwdXNobGV4KFwiZm9ybVwiKSwgZXhwcmVzc2lvbiwgcHVzaGxleChcIn1cIiwgXCJzd2l0Y2hcIiksIGV4cGVjdChcIntcIiksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJsb2NrLCBwb3BsZXgsIHBvcGxleCk7XG4gICAgaWYgKHR5cGUgPT0gXCJjYXNlXCIpIHJldHVybiBjb250KGV4cHJlc3Npb24sIGV4cGVjdChcIjpcIikpO1xuICAgIGlmICh0eXBlID09IFwiZGVmYXVsdFwiKSByZXR1cm4gY29udChleHBlY3QoXCI6XCIpKTtcbiAgICBpZiAodHlwZSA9PSBcImNhdGNoXCIpIHJldHVybiBjb250KHB1c2hsZXgoXCJmb3JtXCIpLCBwdXNoY29udGV4dCwgZXhwZWN0KFwiKFwiKSwgZnVuYXJnLCBleHBlY3QoXCIpXCIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlbWVudCwgcG9wbGV4LCBwb3Bjb250ZXh0KTtcbiAgICBpZiAodHlwZSA9PSBcImNsYXNzXCIpIHJldHVybiBjb250KHB1c2hsZXgoXCJmb3JtXCIpLCBjbGFzc05hbWUsIHBvcGxleCk7XG4gICAgaWYgKHR5cGUgPT0gXCJleHBvcnRcIikgcmV0dXJuIGNvbnQocHVzaGxleChcInN0YXRcIiksIGFmdGVyRXhwb3J0LCBwb3BsZXgpO1xuICAgIGlmICh0eXBlID09IFwiaW1wb3J0XCIpIHJldHVybiBjb250KHB1c2hsZXgoXCJzdGF0XCIpLCBhZnRlckltcG9ydCwgcG9wbGV4KTtcbiAgICByZXR1cm4gcGFzcyhwdXNobGV4KFwic3RhdFwiKSwgZXhwcmVzc2lvbiwgZXhwZWN0KFwiO1wiKSwgcG9wbGV4KTtcbiAgfVxuICBmdW5jdGlvbiBleHByZXNzaW9uKHR5cGUpIHtcbiAgICByZXR1cm4gZXhwcmVzc2lvbklubmVyKHR5cGUsIGZhbHNlKTtcbiAgfVxuICBmdW5jdGlvbiBleHByZXNzaW9uTm9Db21tYSh0eXBlKSB7XG4gICAgcmV0dXJuIGV4cHJlc3Npb25Jbm5lcih0eXBlLCB0cnVlKTtcbiAgfVxuICBmdW5jdGlvbiBleHByZXNzaW9uSW5uZXIodHlwZSwgbm9Db21tYSkge1xuICAgIGlmIChjeC5zdGF0ZS5mYXRBcnJvd0F0ID09IGN4LnN0cmVhbS5zdGFydCkge1xuICAgICAgdmFyIGJvZHkgPSBub0NvbW1hID8gYXJyb3dCb2R5Tm9Db21tYSA6IGFycm93Qm9keTtcbiAgICAgIGlmICh0eXBlID09IFwiKFwiKSByZXR1cm4gY29udChwdXNoY29udGV4dCwgcHVzaGxleChcIilcIiksIGNvbW1hc2VwKHBhdHRlcm4sIFwiKVwiKSwgcG9wbGV4LCBleHBlY3QoXCI9PlwiKSwgYm9keSwgcG9wY29udGV4dCk7XG4gICAgICBlbHNlIGlmICh0eXBlID09IFwidmFyaWFibGVcIikgcmV0dXJuIHBhc3MocHVzaGNvbnRleHQsIHBhdHRlcm4sIGV4cGVjdChcIj0+XCIpLCBib2R5LCBwb3Bjb250ZXh0KTtcbiAgICB9XG5cbiAgICB2YXIgbWF5YmVvcCA9IG5vQ29tbWEgPyBtYXliZW9wZXJhdG9yTm9Db21tYSA6IG1heWJlb3BlcmF0b3JDb21tYTtcbiAgICBpZiAoYXRvbWljVHlwZXMuaGFzT3duUHJvcGVydHkodHlwZSkpIHJldHVybiBjb250KG1heWJlb3ApO1xuICAgIGlmICh0eXBlID09IFwiZnVuY3Rpb25cIikgcmV0dXJuIGNvbnQoZnVuY3Rpb25kZWYsIG1heWJlb3ApO1xuICAgIGlmICh0eXBlID09IFwia2V5d29yZCBjXCIpIHJldHVybiBjb250KG5vQ29tbWEgPyBtYXliZWV4cHJlc3Npb25Ob0NvbW1hIDogbWF5YmVleHByZXNzaW9uKTtcbiAgICBpZiAodHlwZSA9PSBcIihcIikgcmV0dXJuIGNvbnQocHVzaGxleChcIilcIiksIG1heWJlZXhwcmVzc2lvbiwgY29tcHJlaGVuc2lvbiwgZXhwZWN0KFwiKVwiKSwgcG9wbGV4LCBtYXliZW9wKTtcbiAgICBpZiAodHlwZSA9PSBcIm9wZXJhdG9yXCIgfHwgdHlwZSA9PSBcInNwcmVhZFwiKSByZXR1cm4gY29udChub0NvbW1hID8gZXhwcmVzc2lvbk5vQ29tbWEgOiBleHByZXNzaW9uKTtcbiAgICBpZiAodHlwZSA9PSBcIltcIikgcmV0dXJuIGNvbnQocHVzaGxleChcIl1cIiksIGFycmF5TGl0ZXJhbCwgcG9wbGV4LCBtYXliZW9wKTtcbiAgICBpZiAodHlwZSA9PSBcIntcIikgcmV0dXJuIGNvbnRDb21tYXNlcChvYmpwcm9wLCBcIn1cIiwgbnVsbCwgbWF5YmVvcCk7XG4gICAgaWYgKHR5cGUgPT0gXCJxdWFzaVwiKSByZXR1cm4gcGFzcyhxdWFzaSwgbWF5YmVvcCk7XG4gICAgaWYgKHR5cGUgPT0gXCJuZXdcIikgcmV0dXJuIGNvbnQobWF5YmVUYXJnZXQobm9Db21tYSkpO1xuICAgIHJldHVybiBjb250KCk7XG4gIH1cbiAgZnVuY3Rpb24gbWF5YmVleHByZXNzaW9uKHR5cGUpIHtcbiAgICBpZiAodHlwZS5tYXRjaCgvWztcXH1cXClcXF0sXS8pKSByZXR1cm4gcGFzcygpO1xuICAgIHJldHVybiBwYXNzKGV4cHJlc3Npb24pO1xuICB9XG4gIGZ1bmN0aW9uIG1heWJlZXhwcmVzc2lvbk5vQ29tbWEodHlwZSkge1xuICAgIGlmICh0eXBlLm1hdGNoKC9bO1xcfVxcKVxcXSxdLykpIHJldHVybiBwYXNzKCk7XG4gICAgcmV0dXJuIHBhc3MoZXhwcmVzc2lvbk5vQ29tbWEpO1xuICB9XG5cbiAgZnVuY3Rpb24gbWF5YmVvcGVyYXRvckNvbW1hKHR5cGUsIHZhbHVlKSB7XG4gICAgaWYgKHR5cGUgPT0gXCIsXCIpIHJldHVybiBjb250KGV4cHJlc3Npb24pO1xuICAgIHJldHVybiBtYXliZW9wZXJhdG9yTm9Db21tYSh0eXBlLCB2YWx1ZSwgZmFsc2UpO1xuICB9XG4gIGZ1bmN0aW9uIG1heWJlb3BlcmF0b3JOb0NvbW1hKHR5cGUsIHZhbHVlLCBub0NvbW1hKSB7XG4gICAgdmFyIG1lID0gbm9Db21tYSA9PSBmYWxzZSA/IG1heWJlb3BlcmF0b3JDb21tYSA6IG1heWJlb3BlcmF0b3JOb0NvbW1hO1xuICAgIHZhciBleHByID0gbm9Db21tYSA9PSBmYWxzZSA/IGV4cHJlc3Npb24gOiBleHByZXNzaW9uTm9Db21tYTtcbiAgICBpZiAodHlwZSA9PSBcIj0+XCIpIHJldHVybiBjb250KHB1c2hjb250ZXh0LCBub0NvbW1hID8gYXJyb3dCb2R5Tm9Db21tYSA6IGFycm93Qm9keSwgcG9wY29udGV4dCk7XG4gICAgaWYgKHR5cGUgPT0gXCJvcGVyYXRvclwiKSB7XG4gICAgICBpZiAoL1xcK1xcK3wtLS8udGVzdCh2YWx1ZSkpIHJldHVybiBjb250KG1lKTtcbiAgICAgIGlmICh2YWx1ZSA9PSBcIj9cIikgcmV0dXJuIGNvbnQoZXhwcmVzc2lvbiwgZXhwZWN0KFwiOlwiKSwgZXhwcik7XG4gICAgICByZXR1cm4gY29udChleHByKTtcbiAgICB9XG4gICAgaWYgKHR5cGUgPT0gXCJxdWFzaVwiKSB7IHJldHVybiBwYXNzKHF1YXNpLCBtZSk7IH1cbiAgICBpZiAodHlwZSA9PSBcIjtcIikgcmV0dXJuO1xuICAgIGlmICh0eXBlID09IFwiKFwiKSByZXR1cm4gY29udENvbW1hc2VwKGV4cHJlc3Npb25Ob0NvbW1hLCBcIilcIiwgXCJjYWxsXCIsIG1lKTtcbiAgICBpZiAodHlwZSA9PSBcIi5cIikgcmV0dXJuIGNvbnQocHJvcGVydHksIG1lKTtcbiAgICBpZiAodHlwZSA9PSBcIltcIikgcmV0dXJuIGNvbnQocHVzaGxleChcIl1cIiksIG1heWJlZXhwcmVzc2lvbiwgZXhwZWN0KFwiXVwiKSwgcG9wbGV4LCBtZSk7XG4gIH1cbiAgZnVuY3Rpb24gcXVhc2kodHlwZSwgdmFsdWUpIHtcbiAgICBpZiAodHlwZSAhPSBcInF1YXNpXCIpIHJldHVybiBwYXNzKCk7XG4gICAgaWYgKHZhbHVlLnNsaWNlKHZhbHVlLmxlbmd0aCAtIDIpICE9IFwiJHtcIikgcmV0dXJuIGNvbnQocXVhc2kpO1xuICAgIHJldHVybiBjb250KGV4cHJlc3Npb24sIGNvbnRpbnVlUXVhc2kpO1xuICB9XG4gIGZ1bmN0aW9uIGNvbnRpbnVlUXVhc2kodHlwZSkge1xuICAgIGlmICh0eXBlID09IFwifVwiKSB7XG4gICAgICBjeC5tYXJrZWQgPSBcInN0cmluZy0yXCI7XG4gICAgICBjeC5zdGF0ZS50b2tlbml6ZSA9IHRva2VuUXVhc2k7XG4gICAgICByZXR1cm4gY29udChxdWFzaSk7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGFycm93Qm9keSh0eXBlKSB7XG4gICAgZmluZEZhdEFycm93KGN4LnN0cmVhbSwgY3guc3RhdGUpO1xuICAgIHJldHVybiBwYXNzKHR5cGUgPT0gXCJ7XCIgPyBzdGF0ZW1lbnQgOiBleHByZXNzaW9uKTtcbiAgfVxuICBmdW5jdGlvbiBhcnJvd0JvZHlOb0NvbW1hKHR5cGUpIHtcbiAgICBmaW5kRmF0QXJyb3coY3guc3RyZWFtLCBjeC5zdGF0ZSk7XG4gICAgcmV0dXJuIHBhc3ModHlwZSA9PSBcIntcIiA/IHN0YXRlbWVudCA6IGV4cHJlc3Npb25Ob0NvbW1hKTtcbiAgfVxuICBmdW5jdGlvbiBtYXliZVRhcmdldChub0NvbW1hKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHR5cGUpIHtcbiAgICAgIGlmICh0eXBlID09IFwiLlwiKSByZXR1cm4gY29udChub0NvbW1hID8gdGFyZ2V0Tm9Db21tYSA6IHRhcmdldCk7XG4gICAgICBlbHNlIHJldHVybiBwYXNzKG5vQ29tbWEgPyBleHByZXNzaW9uTm9Db21tYSA6IGV4cHJlc3Npb24pO1xuICAgIH07XG4gIH1cbiAgZnVuY3Rpb24gdGFyZ2V0KF8sIHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlID09IFwidGFyZ2V0XCIpIHsgY3gubWFya2VkID0gXCJrZXl3b3JkXCI7IHJldHVybiBjb250KG1heWJlb3BlcmF0b3JDb21tYSk7IH1cbiAgfVxuICBmdW5jdGlvbiB0YXJnZXROb0NvbW1hKF8sIHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlID09IFwidGFyZ2V0XCIpIHsgY3gubWFya2VkID0gXCJrZXl3b3JkXCI7IHJldHVybiBjb250KG1heWJlb3BlcmF0b3JOb0NvbW1hKTsgfVxuICB9XG4gIGZ1bmN0aW9uIG1heWJlbGFiZWwodHlwZSkge1xuICAgIGlmICh0eXBlID09IFwiOlwiKSByZXR1cm4gY29udChwb3BsZXgsIHN0YXRlbWVudCk7XG4gICAgcmV0dXJuIHBhc3MobWF5YmVvcGVyYXRvckNvbW1hLCBleHBlY3QoXCI7XCIpLCBwb3BsZXgpO1xuICB9XG4gIGZ1bmN0aW9uIHByb3BlcnR5KHR5cGUpIHtcbiAgICBpZiAodHlwZSA9PSBcInZhcmlhYmxlXCIpIHtjeC5tYXJrZWQgPSBcInByb3BlcnR5XCI7IHJldHVybiBjb250KCk7fVxuICB9XG4gIGZ1bmN0aW9uIG9ianByb3AodHlwZSwgdmFsdWUpIHtcbiAgICBpZiAodHlwZSA9PSBcInZhcmlhYmxlXCIgfHwgY3guc3R5bGUgPT0gXCJrZXl3b3JkXCIpIHtcbiAgICAgIGN4Lm1hcmtlZCA9IFwicHJvcGVydHlcIjtcbiAgICAgIGlmICh2YWx1ZSA9PSBcImdldFwiIHx8IHZhbHVlID09IFwic2V0XCIpIHJldHVybiBjb250KGdldHRlclNldHRlcik7XG4gICAgICByZXR1cm4gY29udChhZnRlcnByb3ApO1xuICAgIH0gZWxzZSBpZiAodHlwZSA9PSBcIm51bWJlclwiIHx8IHR5cGUgPT0gXCJzdHJpbmdcIikge1xuICAgICAgY3gubWFya2VkID0ganNvbmxkTW9kZSA/IFwicHJvcGVydHlcIiA6IChjeC5zdHlsZSArIFwiIHByb3BlcnR5XCIpO1xuICAgICAgcmV0dXJuIGNvbnQoYWZ0ZXJwcm9wKTtcbiAgICB9IGVsc2UgaWYgKHR5cGUgPT0gXCJqc29ubGQta2V5d29yZFwiKSB7XG4gICAgICByZXR1cm4gY29udChhZnRlcnByb3ApO1xuICAgIH0gZWxzZSBpZiAodHlwZSA9PSBcIltcIikge1xuICAgICAgcmV0dXJuIGNvbnQoZXhwcmVzc2lvbiwgZXhwZWN0KFwiXVwiKSwgYWZ0ZXJwcm9wKTtcbiAgICB9IGVsc2UgaWYgKHR5cGUgPT0gXCJzcHJlYWRcIikge1xuICAgICAgcmV0dXJuIGNvbnQoZXhwcmVzc2lvbik7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGdldHRlclNldHRlcih0eXBlKSB7XG4gICAgaWYgKHR5cGUgIT0gXCJ2YXJpYWJsZVwiKSByZXR1cm4gcGFzcyhhZnRlcnByb3ApO1xuICAgIGN4Lm1hcmtlZCA9IFwicHJvcGVydHlcIjtcbiAgICByZXR1cm4gY29udChmdW5jdGlvbmRlZik7XG4gIH1cbiAgZnVuY3Rpb24gYWZ0ZXJwcm9wKHR5cGUpIHtcbiAgICBpZiAodHlwZSA9PSBcIjpcIikgcmV0dXJuIGNvbnQoZXhwcmVzc2lvbk5vQ29tbWEpO1xuICAgIGlmICh0eXBlID09IFwiKFwiKSByZXR1cm4gcGFzcyhmdW5jdGlvbmRlZik7XG4gIH1cbiAgZnVuY3Rpb24gY29tbWFzZXAod2hhdCwgZW5kKSB7XG4gICAgZnVuY3Rpb24gcHJvY2VlZCh0eXBlKSB7XG4gICAgICBpZiAodHlwZSA9PSBcIixcIikge1xuICAgICAgICB2YXIgbGV4ID0gY3guc3RhdGUubGV4aWNhbDtcbiAgICAgICAgaWYgKGxleC5pbmZvID09IFwiY2FsbFwiKSBsZXgucG9zID0gKGxleC5wb3MgfHwgMCkgKyAxO1xuICAgICAgICByZXR1cm4gY29udCh3aGF0LCBwcm9jZWVkKTtcbiAgICAgIH1cbiAgICAgIGlmICh0eXBlID09IGVuZCkgcmV0dXJuIGNvbnQoKTtcbiAgICAgIHJldHVybiBjb250KGV4cGVjdChlbmQpKTtcbiAgICB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHR5cGUpIHtcbiAgICAgIGlmICh0eXBlID09IGVuZCkgcmV0dXJuIGNvbnQoKTtcbiAgICAgIHJldHVybiBwYXNzKHdoYXQsIHByb2NlZWQpO1xuICAgIH07XG4gIH1cbiAgZnVuY3Rpb24gY29udENvbW1hc2VwKHdoYXQsIGVuZCwgaW5mbykge1xuICAgIGZvciAodmFyIGkgPSAzOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKVxuICAgICAgY3guY2MucHVzaChhcmd1bWVudHNbaV0pO1xuICAgIHJldHVybiBjb250KHB1c2hsZXgoZW5kLCBpbmZvKSwgY29tbWFzZXAod2hhdCwgZW5kKSwgcG9wbGV4KTtcbiAgfVxuICBmdW5jdGlvbiBibG9jayh0eXBlKSB7XG4gICAgaWYgKHR5cGUgPT0gXCJ9XCIpIHJldHVybiBjb250KCk7XG4gICAgcmV0dXJuIHBhc3Moc3RhdGVtZW50LCBibG9jayk7XG4gIH1cbiAgZnVuY3Rpb24gbWF5YmV0eXBlKHR5cGUpIHtcbiAgICBpZiAoaXNUUyAmJiB0eXBlID09IFwiOlwiKSByZXR1cm4gY29udCh0eXBlZGVmKTtcbiAgfVxuICBmdW5jdGlvbiBtYXliZWRlZmF1bHQoXywgdmFsdWUpIHtcbiAgICBpZiAodmFsdWUgPT0gXCI9XCIpIHJldHVybiBjb250KGV4cHJlc3Npb25Ob0NvbW1hKTtcbiAgfVxuICBmdW5jdGlvbiB0eXBlZGVmKHR5cGUpIHtcbiAgICBpZiAodHlwZSA9PSBcInZhcmlhYmxlXCIpIHtjeC5tYXJrZWQgPSBcInZhcmlhYmxlLTNcIjsgcmV0dXJuIGNvbnQoKTt9XG4gIH1cbiAgZnVuY3Rpb24gdmFyZGVmKCkge1xuICAgIHJldHVybiBwYXNzKHBhdHRlcm4sIG1heWJldHlwZSwgbWF5YmVBc3NpZ24sIHZhcmRlZkNvbnQpO1xuICB9XG4gIGZ1bmN0aW9uIHBhdHRlcm4odHlwZSwgdmFsdWUpIHtcbiAgICBpZiAodHlwZSA9PSBcInZhcmlhYmxlXCIpIHsgcmVnaXN0ZXIodmFsdWUpOyByZXR1cm4gY29udCgpOyB9XG4gICAgaWYgKHR5cGUgPT0gXCJzcHJlYWRcIikgcmV0dXJuIGNvbnQocGF0dGVybik7XG4gICAgaWYgKHR5cGUgPT0gXCJbXCIpIHJldHVybiBjb250Q29tbWFzZXAocGF0dGVybiwgXCJdXCIpO1xuICAgIGlmICh0eXBlID09IFwie1wiKSByZXR1cm4gY29udENvbW1hc2VwKHByb3BwYXR0ZXJuLCBcIn1cIik7XG4gIH1cbiAgZnVuY3Rpb24gcHJvcHBhdHRlcm4odHlwZSwgdmFsdWUpIHtcbiAgICBpZiAodHlwZSA9PSBcInZhcmlhYmxlXCIgJiYgIWN4LnN0cmVhbS5tYXRjaCgvXlxccyo6LywgZmFsc2UpKSB7XG4gICAgICByZWdpc3Rlcih2YWx1ZSk7XG4gICAgICByZXR1cm4gY29udChtYXliZUFzc2lnbik7XG4gICAgfVxuICAgIGlmICh0eXBlID09IFwidmFyaWFibGVcIikgY3gubWFya2VkID0gXCJwcm9wZXJ0eVwiO1xuICAgIGlmICh0eXBlID09IFwic3ByZWFkXCIpIHJldHVybiBjb250KHBhdHRlcm4pO1xuICAgIHJldHVybiBjb250KGV4cGVjdChcIjpcIiksIHBhdHRlcm4sIG1heWJlQXNzaWduKTtcbiAgfVxuICBmdW5jdGlvbiBtYXliZUFzc2lnbihfdHlwZSwgdmFsdWUpIHtcbiAgICBpZiAodmFsdWUgPT0gXCI9XCIpIHJldHVybiBjb250KGV4cHJlc3Npb25Ob0NvbW1hKTtcbiAgfVxuICBmdW5jdGlvbiB2YXJkZWZDb250KHR5cGUpIHtcbiAgICBpZiAodHlwZSA9PSBcIixcIikgcmV0dXJuIGNvbnQodmFyZGVmKTtcbiAgfVxuICBmdW5jdGlvbiBtYXliZWVsc2UodHlwZSwgdmFsdWUpIHtcbiAgICBpZiAodHlwZSA9PSBcImtleXdvcmQgYlwiICYmIHZhbHVlID09IFwiZWxzZVwiKSByZXR1cm4gY29udChwdXNobGV4KFwiZm9ybVwiLCBcImVsc2VcIiksIHN0YXRlbWVudCwgcG9wbGV4KTtcbiAgfVxuICBmdW5jdGlvbiBmb3JzcGVjKHR5cGUpIHtcbiAgICBpZiAodHlwZSA9PSBcIihcIikgcmV0dXJuIGNvbnQocHVzaGxleChcIilcIiksIGZvcnNwZWMxLCBleHBlY3QoXCIpXCIpLCBwb3BsZXgpO1xuICB9XG4gIGZ1bmN0aW9uIGZvcnNwZWMxKHR5cGUpIHtcbiAgICBpZiAodHlwZSA9PSBcInZhclwiKSByZXR1cm4gY29udCh2YXJkZWYsIGV4cGVjdChcIjtcIiksIGZvcnNwZWMyKTtcbiAgICBpZiAodHlwZSA9PSBcIjtcIikgcmV0dXJuIGNvbnQoZm9yc3BlYzIpO1xuICAgIGlmICh0eXBlID09IFwidmFyaWFibGVcIikgcmV0dXJuIGNvbnQoZm9ybWF5YmVpbm9mKTtcbiAgICByZXR1cm4gcGFzcyhleHByZXNzaW9uLCBleHBlY3QoXCI7XCIpLCBmb3JzcGVjMik7XG4gIH1cbiAgZnVuY3Rpb24gZm9ybWF5YmVpbm9mKF90eXBlLCB2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSA9PSBcImluXCIgfHwgdmFsdWUgPT0gXCJvZlwiKSB7IGN4Lm1hcmtlZCA9IFwia2V5d29yZFwiOyByZXR1cm4gY29udChleHByZXNzaW9uKTsgfVxuICAgIHJldHVybiBjb250KG1heWJlb3BlcmF0b3JDb21tYSwgZm9yc3BlYzIpO1xuICB9XG4gIGZ1bmN0aW9uIGZvcnNwZWMyKHR5cGUsIHZhbHVlKSB7XG4gICAgaWYgKHR5cGUgPT0gXCI7XCIpIHJldHVybiBjb250KGZvcnNwZWMzKTtcbiAgICBpZiAodmFsdWUgPT0gXCJpblwiIHx8IHZhbHVlID09IFwib2ZcIikgeyBjeC5tYXJrZWQgPSBcImtleXdvcmRcIjsgcmV0dXJuIGNvbnQoZXhwcmVzc2lvbik7IH1cbiAgICByZXR1cm4gcGFzcyhleHByZXNzaW9uLCBleHBlY3QoXCI7XCIpLCBmb3JzcGVjMyk7XG4gIH1cbiAgZnVuY3Rpb24gZm9yc3BlYzModHlwZSkge1xuICAgIGlmICh0eXBlICE9IFwiKVwiKSBjb250KGV4cHJlc3Npb24pO1xuICB9XG4gIGZ1bmN0aW9uIGZ1bmN0aW9uZGVmKHR5cGUsIHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlID09IFwiKlwiKSB7Y3gubWFya2VkID0gXCJrZXl3b3JkXCI7IHJldHVybiBjb250KGZ1bmN0aW9uZGVmKTt9XG4gICAgaWYgKHR5cGUgPT0gXCJ2YXJpYWJsZVwiKSB7cmVnaXN0ZXIodmFsdWUpOyByZXR1cm4gY29udChmdW5jdGlvbmRlZik7fVxuICAgIGlmICh0eXBlID09IFwiKFwiKSByZXR1cm4gY29udChwdXNoY29udGV4dCwgcHVzaGxleChcIilcIiksIGNvbW1hc2VwKGZ1bmFyZywgXCIpXCIpLCBwb3BsZXgsIHN0YXRlbWVudCwgcG9wY29udGV4dCk7XG4gIH1cbiAgZnVuY3Rpb24gZnVuYXJnKHR5cGUpIHtcbiAgICBpZiAodHlwZSA9PSBcInNwcmVhZFwiKSByZXR1cm4gY29udChmdW5hcmcpO1xuICAgIHJldHVybiBwYXNzKHBhdHRlcm4sIG1heWJldHlwZSwgbWF5YmVkZWZhdWx0KTtcbiAgfVxuICBmdW5jdGlvbiBjbGFzc05hbWUodHlwZSwgdmFsdWUpIHtcbiAgICBpZiAodHlwZSA9PSBcInZhcmlhYmxlXCIpIHtyZWdpc3Rlcih2YWx1ZSk7IHJldHVybiBjb250KGNsYXNzTmFtZUFmdGVyKTt9XG4gIH1cbiAgZnVuY3Rpb24gY2xhc3NOYW1lQWZ0ZXIodHlwZSwgdmFsdWUpIHtcbiAgICBpZiAodmFsdWUgPT0gXCJleHRlbmRzXCIpIHJldHVybiBjb250KGV4cHJlc3Npb24sIGNsYXNzTmFtZUFmdGVyKTtcbiAgICBpZiAodHlwZSA9PSBcIntcIikgcmV0dXJuIGNvbnQocHVzaGxleChcIn1cIiksIGNsYXNzQm9keSwgcG9wbGV4KTtcbiAgfVxuICBmdW5jdGlvbiBjbGFzc0JvZHkodHlwZSwgdmFsdWUpIHtcbiAgICBpZiAodHlwZSA9PSBcInZhcmlhYmxlXCIgfHwgY3guc3R5bGUgPT0gXCJrZXl3b3JkXCIpIHtcbiAgICAgIGlmICh2YWx1ZSA9PSBcInN0YXRpY1wiKSB7XG4gICAgICAgIGN4Lm1hcmtlZCA9IFwia2V5d29yZFwiO1xuICAgICAgICByZXR1cm4gY29udChjbGFzc0JvZHkpO1xuICAgICAgfVxuICAgICAgY3gubWFya2VkID0gXCJwcm9wZXJ0eVwiO1xuICAgICAgaWYgKHZhbHVlID09IFwiZ2V0XCIgfHwgdmFsdWUgPT0gXCJzZXRcIikgcmV0dXJuIGNvbnQoY2xhc3NHZXR0ZXJTZXR0ZXIsIGZ1bmN0aW9uZGVmLCBjbGFzc0JvZHkpO1xuICAgICAgcmV0dXJuIGNvbnQoZnVuY3Rpb25kZWYsIGNsYXNzQm9keSk7XG4gICAgfVxuICAgIGlmICh2YWx1ZSA9PSBcIipcIikge1xuICAgICAgY3gubWFya2VkID0gXCJrZXl3b3JkXCI7XG4gICAgICByZXR1cm4gY29udChjbGFzc0JvZHkpO1xuICAgIH1cbiAgICBpZiAodHlwZSA9PSBcIjtcIikgcmV0dXJuIGNvbnQoY2xhc3NCb2R5KTtcbiAgICBpZiAodHlwZSA9PSBcIn1cIikgcmV0dXJuIGNvbnQoKTtcbiAgfVxuICBmdW5jdGlvbiBjbGFzc0dldHRlclNldHRlcih0eXBlKSB7XG4gICAgaWYgKHR5cGUgIT0gXCJ2YXJpYWJsZVwiKSByZXR1cm4gcGFzcygpO1xuICAgIGN4Lm1hcmtlZCA9IFwicHJvcGVydHlcIjtcbiAgICByZXR1cm4gY29udCgpO1xuICB9XG4gIGZ1bmN0aW9uIGFmdGVyRXhwb3J0KF90eXBlLCB2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSA9PSBcIipcIikgeyBjeC5tYXJrZWQgPSBcImtleXdvcmRcIjsgcmV0dXJuIGNvbnQobWF5YmVGcm9tLCBleHBlY3QoXCI7XCIpKTsgfVxuICAgIGlmICh2YWx1ZSA9PSBcImRlZmF1bHRcIikgeyBjeC5tYXJrZWQgPSBcImtleXdvcmRcIjsgcmV0dXJuIGNvbnQoZXhwcmVzc2lvbiwgZXhwZWN0KFwiO1wiKSk7IH1cbiAgICByZXR1cm4gcGFzcyhzdGF0ZW1lbnQpO1xuICB9XG4gIGZ1bmN0aW9uIGFmdGVySW1wb3J0KHR5cGUpIHtcbiAgICBpZiAodHlwZSA9PSBcInN0cmluZ1wiKSByZXR1cm4gY29udCgpO1xuICAgIHJldHVybiBwYXNzKGltcG9ydFNwZWMsIG1heWJlRnJvbSk7XG4gIH1cbiAgZnVuY3Rpb24gaW1wb3J0U3BlYyh0eXBlLCB2YWx1ZSkge1xuICAgIGlmICh0eXBlID09IFwie1wiKSByZXR1cm4gY29udENvbW1hc2VwKGltcG9ydFNwZWMsIFwifVwiKTtcbiAgICBpZiAodHlwZSA9PSBcInZhcmlhYmxlXCIpIHJlZ2lzdGVyKHZhbHVlKTtcbiAgICBpZiAodmFsdWUgPT0gXCIqXCIpIGN4Lm1hcmtlZCA9IFwia2V5d29yZFwiO1xuICAgIHJldHVybiBjb250KG1heWJlQXMpO1xuICB9XG4gIGZ1bmN0aW9uIG1heWJlQXMoX3R5cGUsIHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlID09IFwiYXNcIikgeyBjeC5tYXJrZWQgPSBcImtleXdvcmRcIjsgcmV0dXJuIGNvbnQoaW1wb3J0U3BlYyk7IH1cbiAgfVxuICBmdW5jdGlvbiBtYXliZUZyb20oX3R5cGUsIHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlID09IFwiZnJvbVwiKSB7IGN4Lm1hcmtlZCA9IFwia2V5d29yZFwiOyByZXR1cm4gY29udChleHByZXNzaW9uKTsgfVxuICB9XG4gIGZ1bmN0aW9uIGFycmF5TGl0ZXJhbCh0eXBlKSB7XG4gICAgaWYgKHR5cGUgPT0gXCJdXCIpIHJldHVybiBjb250KCk7XG4gICAgcmV0dXJuIHBhc3MoZXhwcmVzc2lvbk5vQ29tbWEsIG1heWJlQXJyYXlDb21wcmVoZW5zaW9uKTtcbiAgfVxuICBmdW5jdGlvbiBtYXliZUFycmF5Q29tcHJlaGVuc2lvbih0eXBlKSB7XG4gICAgaWYgKHR5cGUgPT0gXCJmb3JcIikgcmV0dXJuIHBhc3MoY29tcHJlaGVuc2lvbiwgZXhwZWN0KFwiXVwiKSk7XG4gICAgaWYgKHR5cGUgPT0gXCIsXCIpIHJldHVybiBjb250KGNvbW1hc2VwKG1heWJlZXhwcmVzc2lvbk5vQ29tbWEsIFwiXVwiKSk7XG4gICAgcmV0dXJuIHBhc3MoY29tbWFzZXAoZXhwcmVzc2lvbk5vQ29tbWEsIFwiXVwiKSk7XG4gIH1cbiAgZnVuY3Rpb24gY29tcHJlaGVuc2lvbih0eXBlKSB7XG4gICAgaWYgKHR5cGUgPT0gXCJmb3JcIikgcmV0dXJuIGNvbnQoZm9yc3BlYywgY29tcHJlaGVuc2lvbik7XG4gICAgaWYgKHR5cGUgPT0gXCJpZlwiKSByZXR1cm4gY29udChleHByZXNzaW9uLCBjb21wcmVoZW5zaW9uKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGlzQ29udGludWVkU3RhdGVtZW50KHN0YXRlLCB0ZXh0QWZ0ZXIpIHtcbiAgICByZXR1cm4gc3RhdGUubGFzdFR5cGUgPT0gXCJvcGVyYXRvclwiIHx8IHN0YXRlLmxhc3RUeXBlID09IFwiLFwiIHx8XG4gICAgICBpc09wZXJhdG9yQ2hhci50ZXN0KHRleHRBZnRlci5jaGFyQXQoMCkpIHx8XG4gICAgICAvWywuXS8udGVzdCh0ZXh0QWZ0ZXIuY2hhckF0KDApKTtcbiAgfVxuXG4gIC8vIEludGVyZmFjZVxuXG4gIHJldHVybiB7XG4gICAgc3RhcnRTdGF0ZTogZnVuY3Rpb24oYmFzZWNvbHVtbikge1xuICAgICAgdmFyIHN0YXRlID0ge1xuICAgICAgICB0b2tlbml6ZTogdG9rZW5CYXNlLFxuICAgICAgICBsYXN0VHlwZTogXCJzb2ZcIixcbiAgICAgICAgY2M6IFtdLFxuICAgICAgICBsZXhpY2FsOiBuZXcgSlNMZXhpY2FsKChiYXNlY29sdW1uIHx8IDApIC0gaW5kZW50VW5pdCwgMCwgXCJibG9ja1wiLCBmYWxzZSksXG4gICAgICAgIGxvY2FsVmFyczogcGFyc2VyQ29uZmlnLmxvY2FsVmFycyxcbiAgICAgICAgY29udGV4dDogcGFyc2VyQ29uZmlnLmxvY2FsVmFycyAmJiB7dmFyczogcGFyc2VyQ29uZmlnLmxvY2FsVmFyc30sXG4gICAgICAgIGluZGVudGVkOiAwXG4gICAgICB9O1xuICAgICAgaWYgKHBhcnNlckNvbmZpZy5nbG9iYWxWYXJzICYmIHR5cGVvZiBwYXJzZXJDb25maWcuZ2xvYmFsVmFycyA9PSBcIm9iamVjdFwiKVxuICAgICAgICBzdGF0ZS5nbG9iYWxWYXJzID0gcGFyc2VyQ29uZmlnLmdsb2JhbFZhcnM7XG4gICAgICByZXR1cm4gc3RhdGU7XG4gICAgfSxcblxuICAgIHRva2VuOiBmdW5jdGlvbihzdHJlYW0sIHN0YXRlKSB7XG4gICAgICBpZiAoc3RyZWFtLnNvbCgpKSB7XG4gICAgICAgIGlmICghc3RhdGUubGV4aWNhbC5oYXNPd25Qcm9wZXJ0eShcImFsaWduXCIpKVxuICAgICAgICAgIHN0YXRlLmxleGljYWwuYWxpZ24gPSBmYWxzZTtcbiAgICAgICAgc3RhdGUuaW5kZW50ZWQgPSBzdHJlYW0uaW5kZW50YXRpb24oKTtcbiAgICAgICAgZmluZEZhdEFycm93KHN0cmVhbSwgc3RhdGUpO1xuICAgICAgfVxuICAgICAgaWYgKHN0YXRlLnRva2VuaXplICE9IHRva2VuQ29tbWVudCAmJiBzdHJlYW0uZWF0U3BhY2UoKSkgcmV0dXJuIG51bGw7XG4gICAgICB2YXIgc3R5bGUgPSBzdGF0ZS50b2tlbml6ZShzdHJlYW0sIHN0YXRlKTtcbiAgICAgIGlmICh0eXBlID09IFwiY29tbWVudFwiKSByZXR1cm4gc3R5bGU7XG4gICAgICBzdGF0ZS5sYXN0VHlwZSA9IHR5cGUgPT0gXCJvcGVyYXRvclwiICYmIChjb250ZW50ID09IFwiKytcIiB8fCBjb250ZW50ID09IFwiLS1cIikgPyBcImluY2RlY1wiIDogdHlwZTtcbiAgICAgIHJldHVybiBwYXJzZUpTKHN0YXRlLCBzdHlsZSwgdHlwZSwgY29udGVudCwgc3RyZWFtKTtcbiAgICB9LFxuXG4gICAgaW5kZW50OiBmdW5jdGlvbihzdGF0ZSwgdGV4dEFmdGVyKSB7XG4gICAgICBpZiAoc3RhdGUudG9rZW5pemUgPT0gdG9rZW5Db21tZW50KSByZXR1cm4gQ29kZU1pcnJvci5QYXNzO1xuICAgICAgaWYgKHN0YXRlLnRva2VuaXplICE9IHRva2VuQmFzZSkgcmV0dXJuIDA7XG4gICAgICB2YXIgZmlyc3RDaGFyID0gdGV4dEFmdGVyICYmIHRleHRBZnRlci5jaGFyQXQoMCksIGxleGljYWwgPSBzdGF0ZS5sZXhpY2FsO1xuICAgICAgLy8gS2x1ZGdlIHRvIHByZXZlbnQgJ21heWJlbHNlJyBmcm9tIGJsb2NraW5nIGxleGljYWwgc2NvcGUgcG9wc1xuICAgICAgaWYgKCEvXlxccyplbHNlXFxiLy50ZXN0KHRleHRBZnRlcikpIGZvciAodmFyIGkgPSBzdGF0ZS5jYy5sZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgICB2YXIgYyA9IHN0YXRlLmNjW2ldO1xuICAgICAgICBpZiAoYyA9PSBwb3BsZXgpIGxleGljYWwgPSBsZXhpY2FsLnByZXY7XG4gICAgICAgIGVsc2UgaWYgKGMgIT0gbWF5YmVlbHNlKSBicmVhaztcbiAgICAgIH1cbiAgICAgIGlmIChsZXhpY2FsLnR5cGUgPT0gXCJzdGF0XCIgJiYgZmlyc3RDaGFyID09IFwifVwiKSBsZXhpY2FsID0gbGV4aWNhbC5wcmV2O1xuICAgICAgaWYgKHN0YXRlbWVudEluZGVudCAmJiBsZXhpY2FsLnR5cGUgPT0gXCIpXCIgJiYgbGV4aWNhbC5wcmV2LnR5cGUgPT0gXCJzdGF0XCIpXG4gICAgICAgIGxleGljYWwgPSBsZXhpY2FsLnByZXY7XG4gICAgICB2YXIgdHlwZSA9IGxleGljYWwudHlwZSwgY2xvc2luZyA9IGZpcnN0Q2hhciA9PSB0eXBlO1xuXG4gICAgICBpZiAodHlwZSA9PSBcInZhcmRlZlwiKSByZXR1cm4gbGV4aWNhbC5pbmRlbnRlZCArIChzdGF0ZS5sYXN0VHlwZSA9PSBcIm9wZXJhdG9yXCIgfHwgc3RhdGUubGFzdFR5cGUgPT0gXCIsXCIgPyBsZXhpY2FsLmluZm8gKyAxIDogMCk7XG4gICAgICBlbHNlIGlmICh0eXBlID09IFwiZm9ybVwiICYmIGZpcnN0Q2hhciA9PSBcIntcIikgcmV0dXJuIGxleGljYWwuaW5kZW50ZWQ7XG4gICAgICBlbHNlIGlmICh0eXBlID09IFwiZm9ybVwiKSByZXR1cm4gbGV4aWNhbC5pbmRlbnRlZCArIGluZGVudFVuaXQ7XG4gICAgICBlbHNlIGlmICh0eXBlID09IFwic3RhdFwiKVxuICAgICAgICByZXR1cm4gbGV4aWNhbC5pbmRlbnRlZCArIChpc0NvbnRpbnVlZFN0YXRlbWVudChzdGF0ZSwgdGV4dEFmdGVyKSA/IHN0YXRlbWVudEluZGVudCB8fCBpbmRlbnRVbml0IDogMCk7XG4gICAgICBlbHNlIGlmIChsZXhpY2FsLmluZm8gPT0gXCJzd2l0Y2hcIiAmJiAhY2xvc2luZyAmJiBwYXJzZXJDb25maWcuZG91YmxlSW5kZW50U3dpdGNoICE9IGZhbHNlKVxuICAgICAgICByZXR1cm4gbGV4aWNhbC5pbmRlbnRlZCArICgvXig/OmNhc2V8ZGVmYXVsdClcXGIvLnRlc3QodGV4dEFmdGVyKSA/IGluZGVudFVuaXQgOiAyICogaW5kZW50VW5pdCk7XG4gICAgICBlbHNlIGlmIChsZXhpY2FsLmFsaWduKSByZXR1cm4gbGV4aWNhbC5jb2x1bW4gKyAoY2xvc2luZyA/IDAgOiAxKTtcbiAgICAgIGVsc2UgcmV0dXJuIGxleGljYWwuaW5kZW50ZWQgKyAoY2xvc2luZyA/IDAgOiBpbmRlbnRVbml0KTtcbiAgICB9LFxuXG4gICAgZWxlY3RyaWNJbnB1dDogL15cXHMqKD86Y2FzZSAuKj86fGRlZmF1bHQ6fFxce3xcXH0pJC8sXG4gICAgYmxvY2tDb21tZW50U3RhcnQ6IGpzb25Nb2RlID8gbnVsbCA6IFwiLypcIixcbiAgICBibG9ja0NvbW1lbnRFbmQ6IGpzb25Nb2RlID8gbnVsbCA6IFwiKi9cIixcbiAgICBsaW5lQ29tbWVudDoganNvbk1vZGUgPyBudWxsIDogXCIvL1wiLFxuICAgIGZvbGQ6IFwiYnJhY2VcIixcbiAgICBjbG9zZUJyYWNrZXRzOiBcIigpW117fScnXFxcIlxcXCJgYFwiLFxuXG4gICAgaGVscGVyVHlwZToganNvbk1vZGUgPyBcImpzb25cIiA6IFwiamF2YXNjcmlwdFwiLFxuICAgIGpzb25sZE1vZGU6IGpzb25sZE1vZGUsXG4gICAganNvbk1vZGU6IGpzb25Nb2RlXG4gIH07XG59KTtcblxuQ29kZU1pcnJvci5yZWdpc3RlckhlbHBlcihcIndvcmRDaGFyc1wiLCBcImphdmFzY3JpcHRcIiwgL1tcXHckXS8pO1xuXG5Db2RlTWlycm9yLmRlZmluZU1JTUUoXCJ0ZXh0L2phdmFzY3JpcHRcIiwgXCJqYXZhc2NyaXB0XCIpO1xuQ29kZU1pcnJvci5kZWZpbmVNSU1FKFwidGV4dC9lY21hc2NyaXB0XCIsIFwiamF2YXNjcmlwdFwiKTtcbkNvZGVNaXJyb3IuZGVmaW5lTUlNRShcImFwcGxpY2F0aW9uL2phdmFzY3JpcHRcIiwgXCJqYXZhc2NyaXB0XCIpO1xuQ29kZU1pcnJvci5kZWZpbmVNSU1FKFwiYXBwbGljYXRpb24veC1qYXZhc2NyaXB0XCIsIFwiamF2YXNjcmlwdFwiKTtcbkNvZGVNaXJyb3IuZGVmaW5lTUlNRShcImFwcGxpY2F0aW9uL2VjbWFzY3JpcHRcIiwgXCJqYXZhc2NyaXB0XCIpO1xuQ29kZU1pcnJvci5kZWZpbmVNSU1FKFwiYXBwbGljYXRpb24vanNvblwiLCB7bmFtZTogXCJqYXZhc2NyaXB0XCIsIGpzb246IHRydWV9KTtcbkNvZGVNaXJyb3IuZGVmaW5lTUlNRShcImFwcGxpY2F0aW9uL3gtanNvblwiLCB7bmFtZTogXCJqYXZhc2NyaXB0XCIsIGpzb246IHRydWV9KTtcbkNvZGVNaXJyb3IuZGVmaW5lTUlNRShcImFwcGxpY2F0aW9uL2xkK2pzb25cIiwge25hbWU6IFwiamF2YXNjcmlwdFwiLCBqc29ubGQ6IHRydWV9KTtcbkNvZGVNaXJyb3IuZGVmaW5lTUlNRShcInRleHQvdHlwZXNjcmlwdFwiLCB7IG5hbWU6IFwiamF2YXNjcmlwdFwiLCB0eXBlc2NyaXB0OiB0cnVlIH0pO1xuQ29kZU1pcnJvci5kZWZpbmVNSU1FKFwiYXBwbGljYXRpb24vdHlwZXNjcmlwdFwiLCB7IG5hbWU6IFwiamF2YXNjcmlwdFwiLCB0eXBlc2NyaXB0OiB0cnVlIH0pO1xuXG59KTtcbiJdfQ==
