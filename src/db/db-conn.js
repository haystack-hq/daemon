#! /usr/bin/env node
var db = require('diskdb');
var basePath = "/Users/macmcclain/.haystack/client-agent-db"; //todo: replace this hard coded path
db.connect(basePath, ['stacks']);

module.exports = db;