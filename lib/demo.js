// Generate demo data

var util = require('util')
  , Readable = require('stream').Readable
  , Chance = require('chance/chance') // Should be fixed in next version
  , moment = require('moment')
  , _ = require('lodash');

var dateFormat = 'YYYY-MM-DD HH:mm:ss';

// Exponential random number generator
// Time until next arrival
function randomExponential(rate, randomUniform) {
  // http://en.wikipedia.org/wiki/Exponential_distribution#Generating_exponential_variates
  rate = rate || 1;
 
  // Allow to pass a random uniform value or function
  // Default to Math.random()
  var U = randomUniform;
  if (typeof randomUniform === 'function') U = randomUniform();
  if (!U) U = Math.random();
 
  return -Math.log(U)/rate;
}
 
// Geometric random number generator
// Number of failures before the first success, 
// supported on the set {0, 1, 2, 3, ...}
function randomGeometric(successProbability, randomUniform) {
  // http://en.wikipedia.org/wiki/Geometric_distribution#Related_distributions
  successProbability = successProbability || 1 - Math.exp(-1); // Equivalent to rate = 1
 
  var rate = -Math.log(1 - successProbability);
 
  return Math.floor(randomExponential(rate, randomUniform));
}

// Generate demo data (header, records) as plain old objects
function DemoDataGenerator(options) {
  options = options || {};
  
  var seed = this.seed = options.seed || undefined,
      minTotalRecords = options.min || 1,
      maxTotalRecords = options.max || 100;

  var chance = this.chance = new Chance(seed);

  this.timeRange = {
    start: moment('2013-01-11').add('seconds', chance.natural({min: 1, max: 60*60*12})),
    end: moment('2013-01-12').add('seconds', chance.natural({min: 1, max: 60*60*12}))
  };

  this.totalRecords = chance.natural({min: minTotalRecords, max: maxTotalRecords});
  this.recordsCount = 0;

  // Used in generating next record timestamp
  this.lastEventTimestamp = this.timeRange.start;
  this.remainingSeconds = this.timeRange.end.diff(this.timeRange.start, 'seconds');
  this.averageEventRate = this.totalRecords/this.remainingSeconds;

  this.eventGenerators = this.createEventGenerators();
  this.eventTypes = _.keys(this.eventGenerators);
  // Make ResourcesGathered appear more often
  for (var i = 1; i <= 3; i = ++i) {
    this.eventTypes.push('ResourcesGathered');
  }
}

DemoDataGenerator.prototype.getHeader = function() {
  // If header was already generated, return it
  if (this.header) return this.header;

  var chance = this.chance;

  var header = {
    title: 'Game Export (v1.2)',
    gameId: this.seed || 'random',
    players: [
      {id: 1, name: 'Homer Simpson'},
      {id: 2, name: 'Bart Simpson'}
    ],
    map: {
      id: chance.natural({min: 100, max: 200}),
      name: 'Crossroads'
    },
    timeRange: {
      start: this.timeRange.start.format(dateFormat),
      end: this.timeRange.end.format(dateFormat)
    },
    totalRecords: this.totalRecords
  };

  // Add a third player, or not
  if (chance.bool()) header.players.push({id: 3, name: 'Marge Simpson'});

  // Save header so we always return the same one if method is called more
  // than once
  this.header = header;

  return header;
};

// Return next record timestamp
DemoDataGenerator.prototype._nextRecordTimestamp = function() {
  if (this.recordsCount >= this.totalRecords) {
    // Make sure last record has ending timestamp
    return this.timeRange.end;
  }
  else {
    // Not great for uniform random number, but need to seed
    var randomUniform = this.chance.natural({min: 0, max: 9999})/10000;
    var timeToNextEvent = Math.floor(randomExponential(
      this.averageEventRate, randomUniform));
    // If we go over the end time, just return the end time
    // Shouldn't happen that much, especially with many events
    if (timeToNextEvent >= this.remainingSeconds) {
      // Make sure all further events will be at end time as well
      this.remainingSeconds = 0;
      this.lastEventTimestamp = this.timeRange.end;
      return this.lastEventTimestamp;
    }
    else {
      this.remainingSeconds = this.remainingSeconds - timeToNextEvent;
      this.lastEventTimestamp.add('seconds', timeToNextEvent);
      return this.lastEventTimestamp;
    }
  }
};

// Return next record, null if reached limit
DemoDataGenerator.prototype.nextRecord = function() {
  if (this.recordsCount >= this.totalRecords) return null;
  var record = {};
  this.recordsCount = this.recordsCount + 1;

  record.id = this.recordsCount;
  record.timestamp = this._nextRecordTimestamp().format(dateFormat);
  record.playerId = this._recordPlayerId();
  record.event = this._recordEvent();

  return record;
};

DemoDataGenerator.prototype._recordPlayerId = function() {
  var header = this.header || this.getHeader();

  var playerIndex = this.chance.natural(
    {min: 0, max: header.players.length - 1});

  return header.players[playerIndex].id;
};

DemoDataGenerator.prototype._recordEvent = function() {
  var eventTypeIndex = this.chance.natural(
    {min: 0, max: this.eventTypes.length - 1});
  var eventType = this.eventTypes[eventTypeIndex];
  return this.eventGenerators[eventType]();
};

DemoDataGenerator.prototype.createEventGenerators = function() {
  // If already created, return them 
  // (in case this function is called more than once)
  if (this.eventGenerators) return this.eventGenerators;

  var self = this,
      eventGenerators = {};

  // ---------- ResourcesGathered
  var resources = {
    'Gold': {min: 1, max: 10},
    'Wood': {min: 5, max: 20},
    'Pigs': {min: 3, max: 15}
  };
  var resourceTypes = _.keys(resources);
  eventGenerators['ResourcesGathered'] = function() {
    var resourceType = resourceTypes[self.randomNatural(
      0, resourceTypes.length - 1)];
    var resource = resources[resourceType];
    return {
      event_type: 'ResourcesGathered',
      resource_type: resourceType,
      quantity: self.randomNatural(resource.min, resource.max)
    };
  };

  // ---------- StructureBuilt
  var structures = {
    'Pig Farm': {health: this.randomNatural(15, 25)*10},
    'Barracks': {health: this.randomNatural(25, 35)*10},
    'Archery': {health: this.randomNatural(25, 35)*10},
    'Castle': {health: this.randomNatural(45, 55)*10}
  };
  var structureTypes = _.keys(structures);
  eventGenerators['StructureBuilt'] = function() {
    var structureType = structureTypes[self.randomNatural(
      0, structureTypes.length - 1)];
    var structure = structures[structureType];
    return {
      event_type: 'StructureBuilt',
      structure_type: structureType,
      health: structure.health
    };
  };

  // ---------- UnitTrained
  var units = {
    'Peasant': {
      health: this.randomNatural(2, 4)*10,
      damage: {min: this.randomNatural(1, 3), max: this.randomNatural(4, 7)}
    },
    'Footman': {
      health: this.randomNatural(5, 10)*10,
      damage: {min: this.randomNatural(4, 7), max: this.randomNatural(8, 10)}
    },
    'Archer': {
      health: this.randomNatural(5, 10)*10,
      damage: {min: this.randomNatural(3, 5), max: this.randomNatural(6, 9)}
    },
    'Knight': {
      health: this.randomNatural(20, 30)*10,
      damage: {min: this.randomNatural(11, 14), max: this.randomNatural(15, 20)}
    }
  };
  var unitTypes = _.keys(units);
  eventGenerators['UnitTrained'] = function() {
    var unitType = unitTypes[self.randomNatural(
      0, unitTypes.length - 1)];
    var unit = units[unitType];
    return {
      event_type: 'UnitTrained',
      unit_type: unitType,
      health: unit.health,
      damage: unit.damage.min + '-' + unit.damage.max
    };
  };

  // ---------- DestroyedEnemy
  var enemyTypes = structureTypes.concat(unitTypes);
  eventGenerators['DestroyedEnemy'] = function() {
    var enemyType = enemyTypes[self.randomNatural(
      0, enemyTypes.length - 1)];
    return {
      event_type: 'DestroyedEnemy',
      unit_type: enemyType
    };
  };

  return eventGenerators;
};

// Helper to generate random natural numbers
DemoDataGenerator.prototype.randomNatural = function(min, max) {
  return this.chance.natural({min: min, max: max});
};


// Stream demo data as CSV
function DemoDataStream(options) {
  Readable.call(this, options);

  this.generator = new DemoDataGenerator(options);
}


util.inherits(DemoDataStream, Readable);

DemoDataStream.prototype._read = function() {
  if (!this.headerSent) {
    this.push(this._serializeHeader(this.generator.getHeader()));
    this.headerSent = true;
  }
  else {
    var record = this.generator.nextRecord();
    // Stop streaming when we reach limit
    if (!record) return this.push(null);

    this.push(this._serializeRecord(record) + '\n');
  }
};

DemoDataStream.prototype._serializeHeader = function(header) {
  return [
    header.title,
    'GameId,' + header.gameId,
    _.map(header.players, function(player) {
      return ['Player', player.id, player.name].join(',');
    }).join('\n'),
    ['Map', header.map.id, header.map.name].join(','),
    ['Time Range', header.timeRange.start, header.timeRange.end].join(','),
    'Number of Records,' + header.totalRecords,
    'Index,Timestamp,Event Type,Player Id,Event Data\n'
  ].join('\n');
};

DemoDataStream.prototype._serializeRecord = function(record) {
  return [
    record.id,
    record.timestamp,
    record.event.event_type,
    record.playerId,
    this._serializeEventData(record.event)
  ].join(',');
};

DemoDataStream.prototype._serializeEventData = function(event) {
  var values = _.clone(event);
  delete values.event_type;
  values = _.pairs(values);
  values = _.map(values, function(pair) {
    return pair.join('=');
  });
  values = values.join(', ');
  return '"' + values + '"';
};

module.exports = {
  DemoDataStream: DemoDataStream
};
