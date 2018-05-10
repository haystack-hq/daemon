'use strict';

var NetworkManager = require("../network/manager");
var Stack = require("../stack/stack");
var Autoload = require("../../lib/autoload");
var StackLogger = require("../stack/logger");
var appRoot = require('app-root-path');
var config = require("config");

var Module = function(args) {


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
        var D = require(lib.path);
        haystack[lib.name] = new D();
    });



    //load up the module.
    var M = require(this.module_path);
    this.module = new M( {
        stack: this.stack,
        service: {
            id: this.service_id,
            config: this.service_config
        },
        network: this.network,
        haystack: haystack
    });


    this.implement_methods();



}


/* implement methods */
Module.prototype.implement_methods = function(){

    /* required methods */
    Stack.Commands.Required.forEach((command) => {
        var cmd = command.cmd;
        this[cmd] = (resolve, reject) => {
            this.module[cmd]((result) => {  resolve(result); }, (err) => { reject(err);  });
        }
    });


    /* healthcheck */
    this.healthcheck = (resolve, reject) => {
        if(this.module.healthcheck){
            this.module.healthcheck((result) => {  resolve(result); }, (err) => { reject(err);  });
        }
    }


}



module.exports = Module;