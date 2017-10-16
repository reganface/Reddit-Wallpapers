/*************************************************
 *
 *	Reddit Image Downloader
 * 	Author: Chris Regan
 * 	Downloads images posted on the front page of selected subreddits.
 * 	Default settings gets the top images from the past week from
 * 	several different wallpaper subreddits.  Only single images
 * 	hosted on Imgur will be downloaded (no galleries). If the file exists
 * 	already, it will be skipped.
 *
 *************************************************/



/******************************
 *
 *	Config
 *
 ******************************/

// subreddits to check
var subreddits = [
	"/r/wallpaper",
	"/r/wallpapers",
	"/r/EarthPorn",
	"/r/EyeCandy",	// this one doesn't have much from imgur it seems
	"/r/topwalls",
	"/r/MinimalWallpaper",
	"/r/GameWalls",
	"/r/ExposurePorn",
	"/r/SkyPorn",
	"/r/ImaginaryTechnology",
	"/r/LightGraffiti",
	"/r/futureporn",
	"/r/lightpainting"
];

// how to filter the subreddit - default is top posts from the past week
var subredditFilter = "/top/?sort=top&t=week";

// path to store files

// Windows - backslashes need to be escaped (double backslashes)
//var path = "C:\\wallpapers\\";

// Linux/Mac
var path = "/home/chris/wallpapers/";



/******************************
 *
 *	Dependencies
 *
 ******************************/

var https = require('https');
var sizeOf = require('image-size');
var fs = require('fs');
var cheerio = require('cheerio');
var options = {
    host: 'www.reddit.com',
    port: 443
};



/******************************
 *
 *	Functions
 *
 ******************************/

// output with timestamp
function output(msg) {
    d = new Date();
	var dateStamp = d.toDateString();
	var timeStamp = d.toLocaleTimeString();
	console.log("["+dateStamp+" "+timeStamp+"] - "+msg);
}

// get HTML of path - the selected subreddit
var getLinks = function(opt) {
	var req = https.get(opt, function(response) {

		// handle the response
		var res_data = '';
		response.on('data', function(chunk) {
			res_data += chunk;
		});

		// once we're finished getting html
		response.on('end', function() {

			// load html into cheerio object
	    	$ = cheerio.load(res_data);

	    	// get all front page links
	    	$("a.title").each(function(index, element){
	    		var href = $(this).attr('href');	// this is the url of each link

	    		// make sure it's an imgur link
	    		if (~href.indexOf('imgur.com')) {
	    			// ignore gallery/album links
	    			if (~href.indexOf('/gallery/') || ~href.indexOf('/a/')) {
	    				return true;
	    			}

	    			// get rid of any url parameters
	    			var temp = href.split('?');
					href = temp[0];

					// use https
					href = href.replace('http:', 'https:');

					// get the direct file url
					href = href.replace('https://imgur.com', 'https://i.imgur.com');
					href = href.replace('https://www.imgur.com', 'https://i.imgur.com');
					href = href.replace('https://m.imgur.com', 'https://i.imgur.com');

	    			// get the filename
	    			var split = href.split("/");
	    			var fileName = split[split.length-1];

	    			// add jpg extention if an extension doesn't exist
					if (!~fileName.indexOf('.')) {
						fileName += ".jpg";
						href += ".jpg";
					}

	    			// check if file already exists locally
	    			fs.stat(path+fileName, function(err, stat) {
	    				if (err) {
		    				if(err.code == 'ENOENT') {
		    					// we don't have this one, download it
								download(href, path+fileName, function(err){
									if (err) {
										output(opt.subreddit + " --- " + href + " - ERROR: " + err);
									} else {
										output(opt.subreddit + " --- " + href + " - Download finished!");
									}
								});
							} else {
								// some other error here
								output(opt.subreddit + " --- " + "ERROR: " + err.code);
							}

	    				} else {
	    					// we have this file already, skip
	    					output(opt.subreddit + " --- " + fileName + " - already exists, skipping...");
	    				}
	    			});
	    		}
	    	});
		});
	});

	req.on('error', function(e) {
		output("Got error: " + e.message);
	});
};

// download and save file
var download = function(url, dest, cb) {
	var file = fs.createWriteStream(dest);

	var request = https.get(url, function(response) {
		response.pipe(file);
		file.on('finish', function() {
			file.close(function() {
				// check the aspect ratio of this file, delete if less than square (like a phone wallpaper)
				// obviously it would be better to check resolution and then delete, but it's fine for this script
				sizeOf(dest, function (err, d) {
					if (d.width / d.height < 0.9) {
						// delete
						fs.unlink(dest);
						cb("Terrible aspect ratio");
					} else {
						cb();
					}
				});
			});
		});

	}).on('error', function(err) {
		// Handle errors
		fs.unlink(dest); // Delete the file async. (But we don't check the result)
		if (cb) cb(err.message);
	});
};



/******************************
 *
 *	Loop through all subreddits
 *
 ******************************/

// first make sure the local directory exists
if (!fs.existsSync(path)){
	output("Path does not exist.  Creating directory...");
    fs.mkdirSync(path);
}

subreddits.forEach(function(value){
	//options.path = value + subredditFilter;
	//options.subreddit = value;
	getLinks({
		host: 'www.reddit.com',
	    port: 443,
		path: value + subredditFilter,
		subreddit: value
	});
});
