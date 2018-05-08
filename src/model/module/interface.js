'use strict';

var NetworkManager = require("../network/manager");
var Stack = require("../stack/stack");
var Autoload = require("../../lib/autoload");
var StackLogger = require("../stack/logger");
var appRoot = require('app-root-path');

var Module = function(args) {

    console.log("module.interface", args);

    this.stack = args.stack;
    this.service_id = args.service.id,
    this.module_path = args.path_to_module;
    this.service_config = args.service_config;
    this.network = args.network;
    this.provider_id = args.provider.id;

    this.init();

}


Module.prototype.init = function(){

    //provide some libraries for easy access.
    var haystack = {};
    haystack.logger = new StackLogger(this.stack.identifier, this.service_id);


    /* add additional libs */
    Autoload.GetLibs().forEach((lib) => {
        console.log('debug', 'Autoloaded haystack.lib.' + lib.name );
        var D = require(lib.path);
        haystack[lib.name] = new D();
    });



    //load up the module.
    var M = require(this.module_path);
    this.module = new M({config: this.service_config, network: this.network, haystack: haystack});


    this.implement_methods();

}


/* implement methods */
Module.prototype.implement_methods = function(){
    Stack.Commands.Required.forEach((cmd) => {
        console.log("module.interface", "method created", cmd);
        this[cmd] = (resolve, reject) => {
            console.log("module.interface", "method called", cmd);
            this.module[cmd]((result) => {  resolve(result); }, (err) => { reject(err); });
        }
    });
}



module.exports = Module;