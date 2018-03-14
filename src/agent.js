var express = require('express');
var app = express();
var StackController = require('./api/controllers/stack-controller');
app.use('/stacks', StackController);
var expressWs = require('express-ws')(app);
var EventBus2 = require('node-singleton-event');



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




module.exports = app;