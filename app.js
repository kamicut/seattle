//Requirements
var _ = require('underscore');
var twitter = require("ntwitter");
var credentials = require("./credentials.js");

//Dummy data provider
var keywords = ['beirut'];

//Filters is an array that will be used to categorize the tweets
var filters = []
_.each(keywords, function(element, index) {
	if (element.split(" ").length > 1) {
		_.each(element.split(" "), function(spl) {
			filters.push(spl);
		})
	} else {
		filters.push(element)
	}
})

//Start nTwitter
var twit = new twitter(credentials);
twit.stream('statuses/filter', {"track": keywords.join()}, function(stream) {
	stream.on('data', function(data) {
		processTweet(data, function(data) {
			if (!data.retweeted_status) {
			 console.log(data.id_str + ", [" +data.category + "]")
			} else {
				console.log(" > > " + data.retweeted_status)
			}
		})
	})
})

//Function that processes a tweet
function processTweet(element, handler) {
	var lat, lon;
	if (element.geo && element.geo.type === 'Point') {
		lat = element.geo.coordinates[0]; // Twitter seems to reverse the
		lon = element.geo.coordinates[1]; // order of geojson coordinates
					
	} else if (element.location && element.location.indexOf(': ') > 0) {
		var coords = element.location.split(': ')[1],
				_lat = coords.split(',')[0] || 0,
				_lon = coords.split(',')[1] || 0;

		if (!isNaN(parseFloat(_lat)) && !isNaN(parseFloat(_lon))) {
				lon = parseFloat(_lon);
				lat = parseFloat(_lat);
		}
	}

//	if (lat && lon) //Uncomment if you want to include only tweets with geodata
		handler({
			lon: lon,
			lat: lat,
			time: formatDate(new Date(element.created_at)),
			text: element.text,
			user: '@' + element.user.screen_name,
			user_id: element.user.id_str,
			user_image: element.user.profile_image_url,
			category: getTags(element),
			media: getMedia(element),
			id_str: element.id_str,
			retweets: element.retweet_count || 0,
			retweeted_status: processRetweet(element)
		});

	function processRetweet(element) {
		if (element.retweeted_status) {
			return element.retweeted_status.id_str
		} else return false
	}
	

	function getTags (elem) {
		var retval = []
		//Start with hashtags
		_.each(elem.entities.hashtags, function(tag, index) {
			retval.push(tag.text.toLowerCase())
		})
		//For each of the keywords, check if in string
		_.each(filters, function(key, index) {
			if (elem.text.toLowerCase().indexOf(key) !== -1 && 
				!_.contains(retval, key))
			retval.push(key);
		});

		return retval
	}

	function getMedia (element) {
		if (element.entities.media) {
			return element.entities.media[0].media_url;
		}
		else {
			return "";
		}
	}

	function formatDate(d) {
		var hours = d.getHours();
		var minutes = d.getMinutes();
		var suffix = "AM";
		
		if (hours >= 12) {
				suffix = "PM";
				hours = hours - 12;
		}
		if (hours === 0) hours = 12;
		if (minutes < 10) minutes = "0" + minutes;
		
		return hours + ":" + minutes + " " + suffix;
	}
	
}