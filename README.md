# Reddit-Wallpapers
Quick node script to download top images from the past week in selected subreddits.  Images that already exist locally are skipped over.

### Installation

[Node.js](https://nodejs.org/) is required to run this script.

```sh
$ git clone https://github.com/reganface/Reddit-Wallpapers.git
$ cd Reddit-Wallpapers
$ npm install
$ node wallpaper.js
```

Run this manually every so often for new images, or schedule it to run once a week.

### Scheduling
On Windows, use Task Scheduler to create a weekly task.  You'll need to create a .bat file in your Reddit-Wallpapers directory with the following line in it.

```sh
node wallpaper.js
```

Have Task Scheduler run this .bat file once a week.

On Linux and Mac you can use your crontab to run this script

```
$ crontab -e
```
Add the folling line to run every Monday at 8pm

```
0 20 * * 1 /usr/local/bin/node /path/to/script/Reddit-Wallpapers/wallpaper.js
```