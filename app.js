//Requirements
var credentials = require("./credentials.js")
  , TwitterStream = require("./twitterStream.js")
  , express = require('express')
  , app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server);

//Dummy data provider
var keywords = ['apple', 'iphone', 'android', 'nexus'];
var topics = {
	'apple': ['apple', 'iphone'], 
	'android': ['android', 'nexus']
}

//Socket handler
io.sockets.on('connection', function(socket) {
	socket.on('subscribe', function(topic) { 
        console.log('joining topic', topic);
        console.log(topic)
        topics[topic].forEach(function (keyword) {
        	socket.join(keyword)
        });
    })

    socket.on('unsubscribe', function(topic) {  
        console.log('leaving topic', topic);
        topics[topic].forEach(function (keyword) {
        	socket.leave(keyword)
        });
    })
})

//Start TwitterStream
var ts = new TwitterStream(credentials);
ts.setKeywords(keywords);

ts.on('data', function(data) {
	data.categories.forEach(function (category) {
		io.sockets.in(category).emit('message', data);
	});
//	console.log(data);
})

//Server config
server.listen(3000)
app.set('view engine', 'html');
app.enable('view cache');
app.engine('html', require('hogan-express'))
app.set('views', __dirname + '/views')

app.use(express.bodyParser())
app.use(app.router)

app.get('/:topic', function(req, res) {
	console.log(req.params);
	res.locals = {topic: req.params.topic}
	res.render('topic')
})

