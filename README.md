# Gibberwocky

This repo is for a plugin to live code Ableton Live using a browser-based editor. It is implemented using Max4Live, Max/MSP/Jitter, and JavaScript, and draws significantly from the Gibber browser-based live coding platform.

[More recent (10/2016) demo performance](https://vimeo.com/187702511).  
[A screen capture / demo of an early version](https://vimeo.com/162157104).  

This project is jointly developed by [Graham Wakefield](http://grahamwakefield.net) and [Charlie Roberts](http://charlie-roberts.com).

If you're interested in creating your own front-end using a different language (gibberwocky uses JavaScript), please see the [communication spec](https://gist.github.com/charlieroberts/a0a4234646f4ab06b5a07dbe969b6b6a) which outlines how to send messages to the max4live plugin using websockets. Theoretically you should be able to use a language of your choice (as long as it has a websocket library...)

## Installing

1. Follow the instructions for installing the Max Worldmaking Package: https://github.com/worldmaking/Max_Worldmaking_Package. This will install a websocket external for Max that the code editor will use to communicate with Max4Live and Max/MSP.
2. Download [the most recent release of the plugin](https://github.com/charlieroberts/gibberwocky/releases)
3. In Ableton Live, place the `gibberwocky_master.amxd` M4L object on the Master track in your Live set. For each MIDI instrument track, place an instance of the `gibberwocky_midi.amxd` on the track and add an instrument/fx of your choice.

## Using
1. In the master instance, click the `Edit` button to open the browser-based code editor. You can send note/duration/velocity messages to all instrument tracks with an instance of the `gibberwocky_midi.amxd` plugin. If an instrument track does not have a plugin, you won't be able to send it these messages. You can also target all fx parameters, volume controls, track sends, mute and solo functions from this single editor.
2. If the `Edit` button fails to open a code editor, there are two options. The simplest is to use [the online editor](http://gibberwocky.cc/live). You can also try manually opening the `index.html` file found in the top-level directory.
3. Execute code by selecting it and hitting Ctrl+Enter. Alt+Enter will select and execute an entire block of code (blocks are delimited by empty lines). Ctrl+. (period) will stop all running sequences. Make sure your transport is running in Live, otherwise executing code will have no effect!
4. Read through the example code. Click on the "demos" button in the right sidebar to view other examples / explanations.

## Development

### Max for Live device

Remember to unfreeze the device to edit it, and freeze it again afterward.

Also, watch out to *not* edit the .amxd directly in Max, but only launch the editor from within Live. I don't know why this makes a difference, but it caused all kinds of headaches. 

### Browser-based client editor

First, install all packages with: 

```bash
npm install
```

Then use the `gulp` command from the top-level directory to launch a watcher that will recompile the application whenever any JavaScript files are changed. Due to some quirks regarding how Max reads in external files, the resulting `index.html` file that is created will contain all HTML, CSS, and Javascript in a single (very large) file. 
