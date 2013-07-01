// Run to generate demo data to std out
// Ex:
// $ node lib/generatedemo > data/demo.csv
// to see a sample:
// $ node lib/generatedemo | head -n 20

var DemoDataStream = require('./demo').DemoDataStream;

var stream = new DemoDataStream({seed: 1234567, min: 100, max: 100});
// var stream = new DemoDataStream({min: 10, max: 100});

stream.pipe(process.stdout);

// The `head` program will emit EPIPE error on stdout when it doesn't want
// data anymore
process.stdout.on('error', process.exit);
