const WebSocket = require('ws');

var Streams = function(server, event_bus) {
    this.event_bus = event_bus;
    this.wss = new WebSocket.Server({server, path: '/stacks/stream'});

}

Streams.prototype.listen = function(){
    var self = this;

    this.wss.on('connection', function connection(ws, req) {

        self.event_bus.on('stack-update', function(data) {
            var message = {
                event: "stack-change",
                data: data
            }

            console.log("wss", message);

            ws.send(JSON.stringify(message));

        });

    });

}


module.exports = Streams;