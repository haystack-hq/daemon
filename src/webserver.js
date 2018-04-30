
var Streams = require('./api/controllers/streams');

/* web server */
var express = require('express');
var expressApp = express();

/* web server routes */
var StackController = require('./api/controllers/stack-controller');





var WebServer = function (port, haystack_manager) {
    var self = this;
    this.haystack_manager = haystack_manager;
    this.port = port;

    expressApp.use('/stacks',  (req, res, next) => {
        req.haystack_manager = this.haystack_manager;
        next();
    }, StackController);

}


WebServer.prototype.listen = function(){
    var port = this.port;
    var server = expressApp.listen(port, function() {
        console.log('Haystack daemon listening on port ' + port);
    });

    this.streams = new Streams(server);
    this.streams.listen();
}



module.exports = WebServer;