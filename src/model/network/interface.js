'use strict';


var NetworkManager = require("../network/manager");
var Network = require("../network/network");
var Stack = require("../stack/stack");
var Autoload = require("../../lib/autoload");
var StackLogger = require("../stack/logger");
var appRoot = require('app-root-path');

var Interface = function(args) {

    this.data = {
        stack: args.stack,
        path_to_interface: args.path_to_interface
    }

    this.init();

}


Interface.prototype.init = function() {

    //provide some libraries for easy access.
    var haystack = {};
    haystack.logger = new StackLogger(this.data.stack.identifier);


    /* add additional libs */
    Autoload.GetLibs().forEach((lib) => {
        console.log('debug', 'Autoloaded haystack.lib.' + lib.name );
        var D = require(lib.path);
        haystack[lib.name] = new D(this.data);
    });

    //load up the module.
    var N = require(this.data.path_to_interface);
    this.network = new N({stack: this.data.stack, haystack: haystack});


    this.implement_methods();
}


Interface.prototype.implement_methods = function() {
    Network.Commands.Required.forEach((cmd) => {
        this[cmd] = (resolve, reject) => {
            console.log("network.interface", "method called", cmd);
            this.network[cmd]((result) => {  resolve(result); }, (err) => { reject(err); });
        }
    });
}



module.exports = Interface;