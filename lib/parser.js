var util = require('util')
  , Transform = require('stream').Transform
  , _ = require('lodash');

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
      this.header = this._parseRawHeader(this._rawHeader);
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

// Make header lines one pretty object
Parser.prototype._parseRawHeader = function(rawHeader) {
  var header = {}
    , self = this;
  _.forEach(rawHeader, function(row) {
    var parsedHeaderRow = self._parseHeaderRow(row);
    // Players are added to an array
    if (parsedHeaderRow['Player']) {
      if (!header['Players']) header['Players'] = [];
      header['Players'].push(parsedHeaderRow['Player']);
    }
    // The rest is just added to the header object
    else {
      _.extend(header, parsedHeaderRow);
    }
  });
  return header;
};

Parser.prototype._parseHeaderRow = function(row) {
  var result = {}
    , key = row[0];
  if (key.match(/^Game Export/)) {
    result['Title'] = key;
  }
  else if (key === 'Player' || key === 'Map') {
    result[key] = {
      'id': row[1],
      'name': row[2]
    };
  }
  else if (key === 'Time Range') {
    result[key] = {
      'start': row[1],
      'end': row[2]
    };
  }
  else if (key === 'Index') {
    // Indicates column names line
    result['Columns'] = row;
  }
  // Default behavior
  else {
    result[key] = row[1];
  }
  return result;
};

module.exports = function(options) {
  return new Parser(options);
};
