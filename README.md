# Gibberwocky

This repo is for a plugin to live code Ableton Live using browser-based editor. It is implemented using Max4Live, Max/MSP/Jitter, and JavaScript, and draws significantly from the Gibber browser-based live coding platform.

[More recent (10/2016) demo performance](https://vimeo.com/187702511).  
[A screen capture / demo of an early version](https://vimeo.com/162157104).  

## Installing

1. Follow the instructions for installing the Max Worldmaking Package: https://github.com/worldmaking/Max_Worldmaking_Package. This will install a websocket external for Max that the code editor will use to communicate with Max4Live and Max/MSP.
2. In Ableton Live, place the `gibberwocky_master.amxd` M4L object on the Master track in your Live set. For each MIDI instrument track, place an instance of the `gibberwocky_midi.amxd` on the track and add an instrument/fx of your choice.

## Using
1. In the master instance, click the `Edit` button to open the browser-based code editor. You can send note/duration/velocity messages to all instrument tracks with an instance of the `gibberwocky_midi.amxd` plugin. If an instrument track does not have a plugin, you won't be able to send it these messages. You can also target all fx parameters, volume controls, track sends, mute and solo functions from this single editor.
2. Execute code by selecting it and hitting Ctrl+Enter. Alt+Enter will select and execute an entire block of code (blocks are delimited by empty lines)
3. Read through the example code. Click on the "demos" button in the right sidebar to view other examples / explanations.
4. This is beta software... there is no documentation outside of the (heavily commented) demos. We're working on it!

## Development

### Max for Live device

Remember to unfreeze the device to edit it, and freeze it again afterward.

Also, watch out to *not* edit the .amxd directly in Max, but only launch the editor from within Live. I don't know why this makes a difference, but it caused all kinds of headaches. 

### Browser-based client editor

First, install all packages with: 

```bash
cd client
npm install
```

After making changes to any javascript, use `gulp build` from within root directory to rebuild the primary `index.js` file. After the build is complete, run `node munge.js` (we'll streamline this in the future). You can also simply use `gulp` to launch a watcher that will recompile the main .js file whenever you make changes to any of the JavaScript files.

