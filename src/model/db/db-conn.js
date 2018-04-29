#! /usr/bin/env node
var homedir = require("homedir");
const fs = require('fs-extra');
const path = require('path');

var db = require('diskdb');
var basePath = path.join(homedir() , ".haystack/client-agent-db"); //todo: change name

fs.ensureDirSync(basePath);

db.connect(basePath, ['stacks']);

module.exports = db;