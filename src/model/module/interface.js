'use strict';

var NetworkManager = require("../network/manager");
var Stack = require("../stack/stack");
var Autoload = require("../../lib/autoload");
var StackLogger = require("../stack/logger");
var appRoot = require('app-root-path');
var path = require('path');
var fs = require('fs-extra');
var config = require("config");
var copydir = require("copy-dir");

var Module = function(args) {

    this.data = {
        stack: args.stack,
        service:  args.service,
        network: args.network,
        provider: args.provider

    }
    this.init();
}


Module.prototype.init = function(){

    //provide some libraries for easy access.
    var haystack = {};
    haystack.logger = new StackLogger(this.data.stack.identifier, this.data.service.id);
    this.logger = haystack.logger;
    this.logged_healthcheck = false;

    /* add additional libs */
    Autoload.GetLibs().forEach((lib) => {
        var D = require(lib.path);
        haystack[lib.name] = new D(this.data);
    });


    //load up the module.
    var M = require(this.data.service.plugin.path_to_module);
    this.module = new M( {
        stack: this.data.stack,
        service: this.data.service,
        network: this.data.network,
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

            /* special case command actions */
            this.on_command_enter(cmd);

            this.module[cmd](
                (result) => {  resolve(result); },
                (err) => {
                    this.logger.error(err);
                    reject(err);
                });

            /* special case command actions */
            this.on_command_exit(cmd);
        }
    });

    Stack.Commands.Optional.forEach((command) => {
        var cmd = command.cmd;
        if(this.module[cmd]){
            this[cmd] = (resolve, reject) => {
                this.module[cmd](
                    (result) => {  resolve(result); },
                    (err) => {
                        this.logger.error(err);
                        reject(err);
                    });
            }
        }
    });


    /* healthcheck */
    this.healthcheck = (resolve, reject) => {
        if(this.module.healthcheck){
            this.module.healthcheck(
                (result) => {
                    this.logged_healthcheck = false;
                    resolve(result);
                },
                (err) => {

                    /* only log the healthcheck once. */
                    if(this.logged_healthcheck == false){
                        this.logger.error(err);
                        this.logged_healthcheck = true;
                    }

                    reject(err);
                });
        }
    }


}

Module.prototype.on_command_enter = function(cmd){
    if(cmd == "start"){
        /* if the plugin has a src object, copy the src code from the plugin to the project */
        if(this.data.service.plugin.path_to_src && this.data.service.data.path_to_src ) {


            var plugin_src = this.data.service.plugin.path_to_src;
            var project_src =  this.data.service.data.path_to_src;

            console.log("copy paths", plugin_src, project_src);

            //list of files/folders in plugin src
            var plugin_files = [];
            fs.readdirSync(plugin_src).forEach(file => {
                console.log("plugin_src", file);
                plugin_files.push(file);
            });

            //list of files/folders in project src
            var project_files = [];
            fs.ensureDirSync(project_src);
            fs.readdirSync(project_src).forEach(file => {
                console.log("project_src", file);
                project_files.push(file);
            });

            //compare to make sure that there are no files in the projct that match.
            var found = plugin_files.some(r => project_files.indexOf(r) >= 0);

            //do the copy if nothing is found.
            var do_copy = found ? false : true;

            if(do_copy){
                console.log("do copy", plugin_src, project_src);
                copydir.sync(plugin_src, project_src);
            }


        }
    }
}


Module.prototype.on_command_exit = function(cmd){

}



module.exports = Module;