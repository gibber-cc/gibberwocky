# Gibberwocky

This repo is for a plugin to live code Ableton Live using browser-based editor. It is implemented using Max4Live, Max/MSP/Jitter, and JavaScript, and draws significantly from the Gibber browser-based live coding platform.

[A screen capture of an early version](https://vimeo.com/162157104).

## Installing

1. Follow the instructions for installing the Max Worldmaking Package: https://github.com/worldmaking/Max_Worldmaking_Package. This will install a websocket external for Max that the code editor will use to communicate with Max4Live and Max/MSP.
2. In Ableton Live, place the `jibberwocky.amxd` M4L object on a MIDI track. Add an instrument of your choice to this track.

## Using
1. Follow the instructions inside the code editor of the M4L device. Click the `open in browser` button to launch the editor in a larger browser window (with normal debugging capabilities) as opposed to the small editor featured in the plugin.
2. There's some extra example code to look at located in js/example/js.
3. This is alpha-release software; there will probably be a lot of work on it during the summer of 2016 but we don't have a timeline for documentation etc. Thanks for your patience.


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

After making changes to any javascript, use `gulp build` from within root directory to rebuild the primary `index.js` file. You can also simply use `gulp` to launch a watcher that will recompile the main .js file whenever you make changes to any of the JavaScript files.

