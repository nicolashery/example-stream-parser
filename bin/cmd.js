#!/usr/bin/env node

var transform = require('../index');

var options = {};

process.stdin.pipe(transform(options)).pipe(process.stdout);

process.stdout.on('error', process.exit);
