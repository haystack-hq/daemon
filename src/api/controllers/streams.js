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


    /*




    wss.on('connection', function connection(ws, req) {
        const location = url.parse(req.url, true);
        console.log(location);


        //handle all streams
        if(location.path == "/stacks/stream"){

            EventBus2.on('haystack-change', function(data) {
                var message = {
                    event: "haystack-change",
                    data: data
                }

                ws.send(JSON.stringify(message));
            });
        }

        //handle specific stream
        var route = new Route('/stacks/:identifier/stream');
        var match = route.match(location.path);
        if(match){
            EventBus2.on('haystack-change', function(data) {
                if(data.identifier == match.identifier)
                {
                    var message = {
                        event: "haystack-change",
                        data: data
                    }

                    ws.send(JSON.stringify(message));
                }

            });
        }


    });
    */


    /*
    app.ws('/stacks/stream', function(ws, req) {

        //hook into a stack update.
        EventBus2.on('haystack-change', function(data) {
            var message = {
                event: "haystack-change",
                data: data
            }
            ws.send(JSON.stringify(message));
        });

    });


    app.ws('/stacks/:identifier/stream', function(ws, req) {

        var identifier = req.params.identifier;

        //validate that the stack exists.


        //hook into a stack update.
        EventBus2.on('haystack-change', function(data) {
            var message = {
                event: "haystack-change",
                data: data
            }

            if(data.identifier == identifier)
            {
                ws.send(JSON.stringify(message));
            }

        });


    });
    */
}


module.exports = Streams;