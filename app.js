//Requirements
var credentials = require("./credentials.js");
var TwitterStream = require("./twitterStream.js")

//Dummy data provider
var keywords = ['beirut'];

//Start TwitterStream
var ts = new TwitterStream(credentials);
ts.setKeywords(keywords);

ts.on('data', function(data) {
	console.log(data);
})
