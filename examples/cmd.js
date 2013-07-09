// Example: command line
// 
// Stringify parsed JavaScript objects and output to stdout

var JSONStream = require('JSONStream')
  , parser = require('../index');

process.stdin
.pipe(parser())
.pipe(JSONStream.stringify(false))
.pipe(process.stdout);

process.stdout.on('error', process.exit);
