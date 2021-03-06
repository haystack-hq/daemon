
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

    if(msg)
    {
        if(m.state == "success"){
            msg.success(m.data);
            if(m.method == "terminate"){
                this.exit();
            }
        }
        else
        {
            msg.fail(m.data);
        }

        //remove the message.
        this.messages = this.messages.filter(function(value){ return value.id == m.id;})
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

Thread.prototype.exit = function(){
    this.process.kill();
}


module.exports = Thread;