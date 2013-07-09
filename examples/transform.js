// Example: transform
// 
// Add some more transform logic after parsing the data file

var fs = require('fs')
  , Transform = require('stream').Transform
  , JSONStream = require('JSONStream')
  , parser = require('../index');

var dataFile = fs.createReadStream('data/demo.csv');

var transform = new Transform({objectMode: true});

transform.header = null;

transform._transform = function(data, encoding, done) {
  // First data object should be header
  if (data.header) {
    this.header = data.header;
    return done();
  }
  // Add some game info to all records using the header
  data['Game'] = {
    'id': this.header['GameId'],
    'players': this.header['Players'],
    'map': this.header['Map']
  };
  this.push(data);
  done();
};

// We could do something with our transformed data records, 
// like save them to a database by piping them to a `Writable` stream
// that will handle that.
// Here we'll just stringify them to stdout
dataFile
.pipe(parser())
.pipe(transform)
.pipe(JSONStream.stringify(false))
.pipe(process.stdout);

process.stdout.on('error', process.exit);
