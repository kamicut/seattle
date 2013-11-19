Seattle is a system built to monitor flows of social data. It is useful for observing one-time events that generate streams of live information ranging from concerts to elections. 

Keywords
========
Keywords are given into the system via a data provider. For simplicity, we use a google spreadsheet to get the keywords. Any updates to the spreadsheet will update the keyword gathering from the social streams. The spreadsheet columns are of the format `[Topic, list of keywords]`.

Each topic in the spreadsheet is given a set of associated keywords, which will then help in creating a schema for the output.

Social Streams
==============
Seattle works with nTwitter to get data from Twitter's Stream API. Completure support is upcoming.

Output
======
Seattle outputs to a websocket server using Socket.io rooms. Each scraped unit of content is tagged with the appropriate keywords, and thrown on a keyword channel. It is up to the receiver to create the Topic rooms, gathering the output of multiple keyword channels.