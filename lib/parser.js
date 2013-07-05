var util = require('util')
  , Transform = require('stream').Transform;

var COLUMNS_LINE = 'Index,Timestamp,Event Type,Player Id,Event Data';

function Parser(options) {
  options.objectMode = true;

  Transform.call(this, options);

  this._rawHeader = [];
  this.header = null;
}

// Parser is a `Transform` stream (readable and writable)
// Pipe data through it and get parsed data out of it
util.inherits(Parser, Transform);

Parser.prototype._transform = function(data, encoding, done) {
  if (!this.header) {
    this._rawHeader.push(data);
    if (this._isHeaderEnd(data)) {
      this.header = this._rawHeader;
      // Let the world know we are done parsing the header
      this.emit('header', this.header);
      this.push({header: this.header});
    }
  }
  // After parsing the header, push data rows
  else {
    this.push({row: data});
  }
  done();
};

// Test if a line is the last header item
Parser.prototype._isHeaderEnd = function(data) {
  return data.join(',') === COLUMNS_LINE;
};

module.exports = function(options) {
  return new Parser(options);
};
