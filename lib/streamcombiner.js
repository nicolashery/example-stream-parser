/* StreamCombiner
Combine a pipe of multiple streams into one stream.

Example:

  var stream3 = new StreamCombiner(stream1, stream2);
  process.stdin.pipe(stream3).pipe(process.stdout);
  // The line above will do this:
  // process.stdin.pipe(stream1).pipe(stream2).pipe(process.stdout);

Thanks to Brandon Tilley (https://github.com/BinaryMuse)
for this code snippet.
*/

var util = require('util')
  , PassThrough = require('stream').PassThrough;

var StreamCombiner = function() {
  this.streams = Array.prototype.slice.apply(arguments);

  // When a source stream is piped to us, undo that pipe, and save
  // off the source stream piped into our internally managed streams.
  this.on('pipe', function(source) {
    source.unpipe(this);
    for(var i in this.streams) {
      source = source.pipe(this.streams[i]);
    }
    this.transformStream = source;
  });
};

util.inherits(StreamCombiner, PassThrough);

// When we're piped to another stream, instead pipe our internal
// transform stream to that destination.
StreamCombiner.prototype.pipe = function(dest, options) {
  return this.transformStream.pipe(dest, options);
};

module.exports = StreamCombiner;