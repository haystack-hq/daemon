'use strict';

var fs = require("fs-extra");
var path = require('path');
var Thread = require("../thread/thread.js");

var Network = function(path_to_network) {

    try
    {
        this.network_path = path_to_network;

        //load the manifest file.
        this.manifest = fs.readJsonSync(path.join(this.network_path, "manifest.json"));
        this.path_to_interface = path.join(this.network_path, this.manifest.interface);
    }
    catch (ex)
    {
        throw new Error("Unable to locate the network [" + path_to_network + "]. ");
    }



}

Network.prototype.init = function(stack){
    this.stack = stack;

    this.network_interface = new Thread(
        path.join(__dirname, "../network/interface.js"),
        {
            path_to_interface: this.path_to_interface,
            stack: {
                identifier: stack.identifier,
                network: {
                    name: stack.network.name
                }
            }
        }
    );


    this.implement_methods();
}


/* implement methods */
Network.prototype.implement_methods = function(){
    Network.Commands.Required.forEach((cmd) => {

        this[cmd] = () => {
            return new Promise((resolve, reject)  => {
                console.log("network", "method called", cmd);

                this.network_interface.call(cmd, {},
                    (result) => { resolve(result); },
                    (err) => { reject(err); }
                );
            })
        }

    });
}


Network.Commands = {
    Required: ["start", "terminate", "inspect"]
}

module.exports = Network;
