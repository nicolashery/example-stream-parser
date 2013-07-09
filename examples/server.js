// Example: server
// 
// Send data file to a server, get parsed data back

var http = require('http')
  , JSONStream = require('JSONStream')
  , parser = require('../index');

var server = http.createServer(function(req, res){
  res.setHeader('Content-Type', 'application/json');
  req
  .pipe(parser())
  .pipe(JSONStream.stringify())
  .pipe(res);
});

server.listen(process.argv[2] || 8000);
