
var cp = require("child_process");
var path = require("path");
var uniqid = require('uniqid');

var Thread = function(path_to_include, args){
    var args_json = JSON.stringify(args);

    this.process = cp.fork(path.join(__dirname, "./worker.js"), [path_to_include, args_json], {detached: false});
    this.messages = [];


    //receive messages
    this.process.on("message", (data) => {
        this.receive(data);
    });

}

Thread.prototype.receive = function(m){
    //get the original message
    var msg = this.messages[m.id];
    if(m.state == "success"){
        msg.success(m.data);
    }
    else
    {
        msg.fail(m.data);
    }
}

Thread.prototype.call = function(method, data, on_success, on_fail){

    var id = uniqid();

    var message = {
        id: id,
        method: method,
        data: data
    }

    //store the message
    this.messages[id] = { message: message, success: on_success, fail: on_fail };

    //send it
    this.process.send(message);

}


module.exports = Thread;