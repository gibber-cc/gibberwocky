# gibber.max

This repo is for a plugin to live code MIDI sequences using JavaScript inside Max4Live and in an abstraction for Max/MSP.

## Installing

1. Follow the instructions for installing the Max Worldmaking Package: https://github.com/worldmaking/Max_Worldmaking_Package. This will install a websocket external for Max that the code editor will use to communicate with Max4Live and Max/MSP.
2. In Ableton Live, place the `jibberwocky.amxd` M4L object on a MIDI track. Add an instrument of your choice to this track.
3. Follow the instructions inside the code editor of the M4L device. Click the `open in browser` button to launch the editor in a larger browser window (with normal debugging capabilities) as opposed to the small editor featured in the plugin.

## Development

First, install all packages with: 

```bash
cd client
npm install
```

After making changes to any javascript, use `gulp build` from within the `client` directory to rebuild the primary `index.js` file. You can also simply use `gulp` to launch a watcher that will recompile the main .js file whenever you make changes to any of the JavaScript files.

