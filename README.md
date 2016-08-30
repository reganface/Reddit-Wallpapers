# Reddit-Wallpapers
Quick node script to download top images from the past week in selected subreddits.  Images that already exist locally are skipped over.

### Electron
I started this branch to experiment giving this script a GUI and running without external requirements.  Not sure how much I'll be able to put into this, though.  So far I've made a basic frame which allows setting the save directory as well as adding and removing subreddits.

### Installation

[Node.js](https://nodejs.org/) is required to run this script.

```sh
$ git clone https://github.com/reganface/Reddit-Wallpapers.git
$ cd Reddit-Wallpapers
$ git checkout electron
$ npm install
```

If you have electron installed globally you can then run:

```
$ electron .
```
Otherwise you'll need to specify the path
```
$ ./node_modules/electron/dist/electron .
```

### TODO

> Add some sort of schedule options with background service
> Add some styles so it's not just basic html
> Package it up for end users