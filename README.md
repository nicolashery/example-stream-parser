# Example Stream Parser

An example Node.js streaming data file parser.

Turns this:

```
Game Export (v1.2)
GameId,1234567
Player,1,Homer Simpson
Player,2,Bart Simpson
Player,3,Marge Simpson
Map,101,Crossroads
Time Range,2013-01-11 02:50:40,2013-01-12 05:34:56
Number of Records,100
Index,Timestamp,Event Type,Player Id,Event Data
1,2013-01-11 02:54:42,ResourcesGathered,3,"resource_type=Wood, quantity=11"
2,2013-01-11 03:00:26,ResourcesGathered,2,"resource_type=Gold, quantity=7"
3,2013-01-11 03:05:42,ResourcesGathered,1,"resource_type=Gold, quantity=2"
4,2013-01-11 03:08:05,UnitTrained,3,"unit_type=Knight, health=270, damage=12-15"
5,2013-01-11 03:24:05,DestroyedEnemy,1,"unit_type=Pig Farm"
```

Into this:

```
{"header":{"Title":"Game Export (v1.2)","GameId":"1234567","Players":[{"id":"1","name":"Homer Simpson"},{"id":"2","name":"Bart Simpson"},{"id":"3","name":"Marge Simpson"}],"Map":{"id":"101","name":"Crossroads"},"Time Range":{"start":"2013-01-11 02:50:40","end":"2013-01-12 05:34:56"},"Number of Records":"100","Columns":["Index","Timestamp","Event Type","Player Id","Event Data"]}}
{"Index":"1","Timestamp":"2013-01-11 02:54:42","Event Type":"ResourcesGathered","Player Id":"3","Event Data":{"resource_type":"Wood","quantity":"11"}}
{"Index":"2","Timestamp":"2013-01-11 03:00:26","Event Type":"ResourcesGathered","Player Id":"2","Event Data":{"resource_type":"Gold","quantity":"7"}}
{"Index":"3","Timestamp":"2013-01-11 03:05:42","Event Type":"ResourcesGathered","Player Id":"1","Event Data":{"resource_type":"Gold","quantity":"2"}}
{"Index":"4","Timestamp":"2013-01-11 03:08:05","Event Type":"UnitTrained","Player Id":"3","Event Data":{"unit_type":"Knight","health":"270","damage":"12-15"}}
{"Index":"5","Timestamp":"2013-01-11 03:24:05","Event Type":"DestroyedEnemy","Player Id":"1","Event Data":{"unit_type":"Pig Farm"}}
```

## Usage: command line

See [examples/cmd.js](examples/cmd.js).

Example:

```bash
cat data/demo.csv | node examples/cmd
```

Will output result to stdout.

## Usage: JavaScript API

See [examples/transform.js](examples/transform.js).

It's just a Node.js [Transform Stream](http://nodejs.org/api/stream.html#stream_class_stream_transform) that takes a stream of the data file coming in, and emits parsed JavaScript objects.

Example:

```javascript
var parser = require('./index.js');

process.stdin
.pipe(parser())
.pipe(JSONStream.stringify(false))
.pipe(process.stdout);
```

## Usage: server

See [examples/server.js](examples/server.js).

(Inspired by [Max Ogden](https://github.com/maxogden)'s ["Gut: Hosted Open Data Filet Knives"](http://maxogden.com/gut-hosted-open-data-filets.html).)

Run the server in a separate terminal:

```bash
$ node examples/server
```

Send some data to the server:

```bash
$ curl -i -X POST http://localhost:8000/ -H "Content-Type: text/plain" --data-binary "@data/demo.csv"
```

You will get valid JSON back:

```
HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "header": {
      "Title": "Game Export (v1.2)",
      "GameId": "1234567",
      "Players": [
        {
          "id": "1",
          "name": "Homer Simpson"
        },
        {
          "id": "2",
          "name": "Bart Simpson"
        },
        {
          "id": "3",
          "name": "Marge Simpson"
        }
      ],
      "Map": {
        "id": "101",
        "name": "Crossroads"
      },
      "Time Range": {
        "start": "2013-01-11 02:50:40",
        "end": "2013-01-12 05:34:56"
      },
      "Number of Records": "100",
      "Columns": [
        "Index",
        "Timestamp",
        "Event Type",
        "Player Id",
        "Event Data"
      ]
    }
  },
  {
    "Index": "1",
    "Timestamp": "2013-01-11 02:54:42",
    "Event Type": "ResourcesGathered",
    "Player Id": "3",
    "Event Data": {
      "resource_type": "Wood",
      "quantity": "11"
    }
  },
  {
    "Index": "2",
    "Timestamp": "2013-01-11 03:00:26",
    "Event Type": "ResourcesGathered",
    "Player Id": "2",
    "Event Data": {
      "resource_type": "Gold",
      "quantity": "7"
    }
  },
  ...
]
```

## Generate demo data

Use helper script:

```bash
$ node lib/generatedemo > data/demo.csv
```