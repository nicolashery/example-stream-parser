var csv = require('csv-streamify')
  , JSONStream = require('JSONStream')
  , StreamCombiner = require('./lib/streamcombiner')
  , parser = require('./lib/parser');

module.exports = function(options) {
  // return new StreamCombiner(csv({objectMode: true}), JSONStream.stringify(false));
  return new StreamCombiner(csv({objectMode: true}), 
                            parser(options), 
                            JSONStream.stringify(false));
};
