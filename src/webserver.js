var Streams = require('./api/controllers/streams');

/* web server */
var express = require('express');
var expressApp = express();

/* web server routes */
var StackController = require('./api/controllers/stack-controller');




var WebServer = function (port, event_bus) {
    var self = this;
    this.event_bus = event_bus;
    this.port = port;

    expressApp.use('/stacks', function (req, res, next) {
        req.event_bus = self.event_bus;
        next();
    }, StackController);

}


WebServer.prototype.listen = function(){
    var port = this.port;
    var server = expressApp.listen(port, function() {
        console.log('Haystack daemon listening on port ' + port);
    });

    this.streams = new Streams(server, this.event_bus);
    this.streams.listen();
}



module.exports = WebServer;