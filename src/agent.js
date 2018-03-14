var express = require('express');
var app = express();
var StackController = require('./api/controllers/stack-controller');
app.use('/stacks', StackController);


module.exports = app;