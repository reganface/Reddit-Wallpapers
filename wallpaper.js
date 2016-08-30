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
 *	Dependencies
 *
 ******************************/

const Configstore = require('configstore');
const pkg = require('./package.json');
const conf = new Configstore(pkg.name);
const {dialog} = require('electron').remote;
var https = require('https');
var fs = require('fs');
var cheerio = require('cheerio');
var options = {
    host: 'www.reddit.com',
    port: 443
};

var status = {
	newImages: 0,
	skipped: 0,
	total: 0,
	status: "Running"
};


/******************************
 *
 *	Config
 *
 ******************************/

var defaults = {
	subreddits: [
		"wallpaper",
		"wallpapers",
		"EarthPorn",
		"EyeCandy",
		"topwalls",
		"MinimalWallpaper",
		"GameWalls"
	],
	subredditFilter: "/top/?sort=top&t=week"
};

if (!conf.get('subreddits')) {
	// config does not exist, set defaults
	conf.all = defaults;
}
var subreddits = conf.get('subreddits');
var subredditFilter = conf.get('subredditFilter');
updateSubreddits();

// show selected path
var path = conf.get('path');
$("#directory").text(conf.get('path'));
updateTotalImages();



/******************************
 *
 *	Functions
 *
 ******************************/


function updateSubreddits() {
	var line;

	// update conf
	conf.set('subreddits', subreddits);

	// update html
	$("#subreddit-list").html("");
	subreddits.forEach(function(value, index) {
		line = "<li>"+value+" <a href='#' class='remove-subreddit' data-index='"+index+"'><i class='fa fa-remove'></i></a></li>";
		$("#subreddit-list").append(line);
	});
}


function updateTotalImages() {
	fs.readdir(path, function(err, items) {
		count = items.length;
		$("#total-images").text(count);
	});
}


function updateRunStatus() {
	var output;
	if (status.newImages + status.skipped >= status.total && status.total > 0) {
		// done update status text
		status.status = "Finished!";
	}
	output = "Images Found: " + status.total + " | Downloaded: " + status.newImages + " | Skipped: " + status.skipped;
	$("#run-status").text(status.status+" - "+output);
}


// get HTML of path - the selected subreddit
var getLinks = function(options, cb) {

	var req = https.get(options, function(response) {
		var links = [];

		// handle the response
		var res_data = '';
		response.on('data', function(chunk) {
			res_data += chunk;
		});

		// once we're finished getting html
		response.on('end', function() {

			html = $(res_data);

	    	// get all front page links
	    	html.find("a.title").each(function(index, element){

	    		var href = $(this).attr('href');	// this is the url of each link

	    		// make sure it's an imgur link
	    		if (~href.indexOf('imgur.com')) {
	    			// ignore gallery/album links
	    			if (~href.indexOf('/gallery/') || ~href.indexOf('/a/')) {
	    				return true;
	    			}

					// add this file to our total
					status.total++;
					updateRunStatus();

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

					//add to links array
					links.push({
						href: href,
						fileName: fileName
					});
/*
	    			// check if file already exists locally
	    			fs.stat(path+fileName, function(err, stat) {
	    				if (err) {
		    				if(err.code == 'ENOENT') {
		    					// we don't have this one, download it
								console.log(href, path+fileName);
								download(href, path+fileName, function(err){
									if (err) {
										console.log(href + " - ERROR: " + err);
										status.skipped++;
										updateRunStatus();
									} else {
										console.log(href + " - Download finished!");
										status.newImages++;
										updateRunStatus();
									}
								});
							} else {
								// some other error here
								console.log("ERROR: " + err.code);
							}

	    				} else {
	    					// we have this file already, skip
	    					console.log(fileName + " - already exists, skipping...");
							status.skipped++;
							updateRunStatus();
	    				}
	    			});*/
	    		}
	    	});

			cb(links);

		});
	});

	req.on('error', function(e) {
		console.log("Got error: " + e.message);
	});
};

// download and save file
var download = function(url, dest, cb) {
	var file = fs.createWriteStream(dest);

	var request = https.get(url, function(response) {
		response.pipe(file);
		file.on('finish', function() {
			file.close(cb);  // close() is async, call cb after close completes.
		});

	}).on('error', function(err) {
		// Handle errors
		fs.unlink(dest); // Delete the file async. (But we don't check the result)
		if (cb) cb(err.message);
	});
};



/******************************
 *
 *	Events
 *
 ******************************/


$("#set-directory").on("click", function() {
	dialog.showOpenDialog({title: "Select Save Folder", properties: ["openDirectory"]}, function(folder) {
		if (folder) {
			// being returned as an array so take the first index
			path = folder[0]+"/";
			conf.set('path', path);
			$("#directory").text(path);
		}
	});
});

// add new subreddit
$("#add-subreddit").on("submit", function(e) {
	e.preventDefault();
	var newSubreddit = $.trim($("#new-subreddit").val());

	if (newSubreddit !== "") {
		$("#new-subreddit").val('');
		subreddits.push(newSubreddit);
		updateSubreddits();
	}
});

// remove subreddit from list
$("#subreddit-list").on("click", ".remove-subreddit", function(e) {
	e.preventDefault();
	var index = $(this).data('index');

	// remove from array
	subreddits.splice(index, 1);

	// update config
	conf.set('subreddits', subreddits);

	// remove from html
	$(this).parent().remove();
});


// run
$("#get-images").on("click", function() {

	if (path && subreddits.length) {
		// update status
		status.newImages = 0;
		status.skipped = 0;
		status.total = 0;
		status.status = "Running";
		updateRunStatus();

		// make directory if it doesn't exist
		if (!fs.existsSync(path)){
			console.log("Path does not exist.  Creating directory...");
		    fs.mkdirSync(path);
		}

		// loop through subreddits and run getLinks function on each
		subreddits.forEach(function(value){
			var completePath = "/r/" + value + (subredditFilter ? subredditFilter : "");
			options.path = completePath;

			getLinks(options, function(links) {
				// loop through all links to check each one
				links.forEach(function(link) {
					fs.stat(path+link.fileName, function(err, stat) {
						if (err) {
							if (err.code == 'ENOENT') {
								// we don't have this file so download it
								download(link.href, path+link.fileName, function(err) {
									if (err) {
										// error downloading
										console.log(link.href + " - ERROR: " + err);
										status.skipped++;
										updateRunStatus();
									} else {
										// finished downloading
										console.log(link.href + " - Download finished!");
										status.newImages++;
										updateRunStatus();
									}
								});

							} else {
								// there was an error checking the file locally
								console.log("ERROR: " + err.code);
							}
						} else {
							// we have this file already, skip
							console.log(link.fileName + " - already exists, skipping...");
							status.skipped++;
							updateRunStatus();
						}
					});
				});
			});
		});

	} else {
		alert("Make sure to set a download directory and add at least one subreddit");
	}

});
