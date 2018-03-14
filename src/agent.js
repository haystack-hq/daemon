


/* web server */
var express = require('express');
var app = express();

/* web server routes */
var StackController = require('./api/controllers/stack-controller');
app.use('/stacks', StackController);


/* stream manager */
var streams = require('./api/controllers/streams')(app);






module.exports = app;