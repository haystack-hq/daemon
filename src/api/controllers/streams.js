var EventBus2 = require('node-singleton-event');
    const WebSocket = require('ws');
const url = require('url');
Route = require('route-parser');


var Streams = function(server){

    const wss = new WebSocket.Server({ server, path: '/stacks/stream' });


    EventBus2.on('haystack-change', function(data) {
        var message = {
            event: "haystack-change",
            data: data
        }


        wss.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });


    });


}


module.exports = Streams;