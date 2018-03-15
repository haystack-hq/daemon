#! /usr/bin/env node
var homedir = require("homedir");
const fs = require('fs-extra');

var db = require('diskdb');
var basePath = homedir() + "/.haystack/client-agent-db";

fs.ensureDirSync(basePath);

db.connect(basePath, ['stacks']);

module.exports = db;