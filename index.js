var csv = require('csv-streamify')
  , StreamCombiner = require('./lib/streamcombiner')
  , parser = require('./lib/parser');

module.exports = function(options) {
  // Buffer of CSV data file going in
  // JavaScript objects going out
  return new StreamCombiner(csv({objectMode: true}), 
                            parser(options));
};
