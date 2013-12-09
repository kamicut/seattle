var Twitter = require("twit"),
	EventEmitter = require('events').EventEmitter,
	_ = require('underscore');

var reconnectAttempts = 0

function TwitterStream(config) {
	if (!(this instanceof TwitterStream)) return new TwitterStream(config)
	this.config = config
	this.keywords = [];
	this.filters = [];
	this.reconnect_attempts = this.config.reconnect_attempts || 4;
	this.twit = new Twitter({
        consumer_key: this.config.consumer_key,
        consumer_secret: this.config.consumer_secret,
        access_token: this.config.access_token_key,
        access_token_secret: this.config.access_token_secret,
    });
}

TwitterStream.prototype = Object.create(EventEmitter.prototype);

TwitterStream.prototype.stream = function() {
	var self = this;
	console.log(self.keywords)
	self.currentStream = self.twit.stream('statuses/filter', 
		{track: self.keywords.join()})
	
	self.currentStream.on('tweet', function(data) {
		self.processTweet(data, function(tweet) {
			self.emit('data', tweet)
		})
	})
	
	self.currentStream.on('disconnect', function reconnect(response) {
		reconnectAttempts++;
	    if( reconnectAttempts >= self.reconnect_attempts ) {
	        return self.emit('error', new Error('@end: Too many reconnection attempts'));
	    }
	    self.stream()
	})
}

TwitterStream.prototype.setKeywords = function(keywords) {
	var self = this;
	self.keywords = keywords;
	self.filters = [];
	_.each(keywords, function(element, index) {
		if (element.split(" ").length > 1) {
			_.each(element.split(" "), function(spl) {
				self.filters.push(spl);
			})
		} else {
			self.filters.push(element)
		}
	})
	if (typeof self.currentStream != 'undefined') {
		self.currentStream.stop();
		self.stream();
	} else {
		self.stream();
	}	
}

TwitterStream.prototype.processTweet = function(element, handler) {
	var self = this;
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
			categories: getTags(element),
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
		_.each(self.filters, function(key, index) {
			if (!_.contains(retval, key) && 
				elem.text.toLowerCase().indexOf(key) !== -1)
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


module.exports = TwitterStream