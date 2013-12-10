//Requirements
var credentials = require("./credentials.js")
  , Topcap = require('topcap')
  , TwitterStream = require("./twitterStream.js")
  , express = require('express')
  , app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server);

var topics = {}
io.set('log level', 2)

//Socket handler
io.sockets.on('connection', function(socket) {
	socket.on('subscribe', function(topic) { 
        console.log('joining topic', topic);
        console.log(topic)
        console.log(topics)
        topics[topic].forEach(function (keyword) {
          keyword.split(" ").forEach(function (split_keyword) {
            socket.join(split_keyword)
          });
        });
    })

    socket.on('unsubscribe', function(topic) {  
        console.log('leaving topic', topic);
        topics[topic].forEach(function (keyword) {
        	socket.leave(keyword)
        });
    })
})

//Init TwitterStream
var ts = new TwitterStream(credentials);

//Init Topcap data provider
var tc = new Topcap(require('./tc_config.js'))

//records => [keywords, topics]
//keywords is list of all keywords
//topics is {topic1: ["k1", "k2", "k3"], topic2: ["kv1", "kv2"]}
function recordsToModel(records) {
  var ret_keywords = [], ret_topics = {}
  records.forEach(function (record) {
    var keywords = record["Keywords"].split(",")
    var topic_key = record["Topic"].toLowerCase()
    ret_topics[topic_key] = []
    keywords.forEach(function (keyword) {
      var key = keyword.trim()
      ret_topics[topic_key].push(key)
      ret_keywords.push(key)
    });
  });
  return [ret_keywords, ret_topics]
}

//On data update the model
tc.on('data', function(data) {
  if (data["updated"]) {
    var tuple = recordsToModel(data["records"])
    ts.setKeywords(tuple[0])
    topics = tuple[1]
    console.log("Topics are: " + topics)
  }
})

//Get data and emit
ts.on('data', function(data) {
	data.categories.forEach(function (category) {
		io.sockets.in(category).emit('message', data);
	});
})

//Server config
server.listen(3000)
app.set('view engine', 'html');
app.enable('view cache');
app.engine('html', require('hogan-express'))
app.set('views', __dirname + '/views')

app.use(express.bodyParser())
app.use(app.router)

app.get("/", function(req, res) {
  res.locals ={topics: Object.keys(topics)}
  res.render("index")
})

app.get('/:topic', function(req, res) {
  if (typeof topics[req.params.topic] != "undefined") {
    res.locals = {topic: req.params.topic}
    res.render('topic') 
  }
})

