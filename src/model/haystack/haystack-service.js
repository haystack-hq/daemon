"use strict";

var path = require("path");
var appRoot = require('app-root-path');
var fs = require("fs-extra");
var Promise = require("bluebird");
var Logger = require("../../../src/lib/logger");
var ServicePluginWorker = require('../service-plugin/service-plugin-worker.js');
var cp = require("child_process");
var StackLogger = require("./logger");




var HaystackService = function(stack, mode, service_name, service_info){

    //set some default properties
    this.stack = stack;
    this.service_name = service_name;
    this.mode = mode;
    this.service_info = service_info;
    this.updateStatus(HaystackService.Statuses.pending);
    this.plugin = null;
    this.error = null;
    this.logger =  new StackLogger(stack.identifier,  this.service_name);


    this.provider_promises = [];


    try
    {
        this.load();
    }
    catch(ex)
    {
        throw(ex);
    }


}

HaystackService.prototype.refresh_service = (service) => {

    Logger.log('info', "Refreshing service [" + service.service_name + "] ");

    //update the stack
    service.inspect().then((res) => {
        service.stack.refresh();
    }).catch((e) => {
        //note: inspect errors are handled at the inspect level.
    });


}

HaystackService.prototype.load = function(){

    console.log("HaystackService.load");

    //load up the plugin
    var plugin_path = this.service_info.plugin;

    //check for a relative path. (used for test stacks
    if(!path.isAbsolute(plugin_path)) {
        plugin_path = path.join(appRoot.toString(), plugin_path);
        if(!fs.existsSync(plugin_path)){
            throw new Error("The service plugin for service [" + this.service_name + "] at relative path [" + plugin_path + "] could not be found, Please check file path.");
        }
    }
    else
    {
        if(!fs.existsSync(plugin_path)){
            throw new Error("The service plugin for service [" + this.service_name + "] at [" + plugin_path + "] could not be found, Please check file path.");
        }
    }



    try
    {


        const options = {
            silent: true
        };

        this.process =  cp.fork(path.resolve("model/service-plugin/service-plugin-worker.js"), [], {detached: false});


        this.process.on('exit', function () {
            console.log("Exited");
            //todo: report this service as impared?
        });

        this.process.on('message', (m) =>  {
            this.receive_provider_message(m);
        });


        //init
        this.send_provider_message("load",
            {
                stack: {identifier: this.stack.identifier},
                mode: this.mode,
                service: {service_name: this.service_name, service_info: this.service_info },
                plugin: { path:plugin_path }
            },
            (result) => {
                console.log("Load success from the thread [" + this.service_name + "]", result)
            },
            (err) => {
                console.log("Load error from the thread [" + this.service_name + "]", err)
            }
        );


    }
    catch(ex)
    {
        throw(ex);
    }




}

HaystackService.prototype.receive_provider_message = function(m){
    var action = m.action;
    var state = m.state; //error or success


    if(action == "uncaught-exception"){
        this.updateStatus(HaystackService.Statuses.impaired, m.data);
        return;
    }


    /* log to service */
    if(action == "log"){
        var data = m.data;
        this.logger.log(data.level, data.msg, data.meta);
        return;
    }


    var promise = null;

    //check all the callbacks to find a match
    this.provider_promises.forEach((p) => {
        if(p.action ==  action){
            promise = p;
        }
    });

    if(promise){

        if(m.state == "success"){
            promise.success_callback(m.data);
        }
        else
        {
            promise.error_callback(m.data);
        }
    }
    else
    {
        Logger.log("debug", "The message from the providercould not be mapped to a promise.", {message: m});
    }
}



HaystackService.prototype.send_provider_message = function(action, params, success_callback, error_callback){
    var message = {
        action: action,
        params: params
    }

    this.provider_promises.push(
        {
            action: action,
            success_callback: success_callback,
            error_callback: error_callback
        }
    );


    this.process.send(message);

}



HaystackService.prototype.getData = function(){
    return  {
        status: this.status,
        is_healthy: this.is_healthy,
        error: this.error
    }
}

/*
Begin Haystack Service Actions
 */



HaystackService.prototype.start = function(){
    return new Promise((resolve, reject)  => {
        Logger.log('info', "Action [Start] called on [" + this.service_name + "]");
        this.updateStatus(  HaystackService.Statuses.starting);

        this.send_provider_message("start", {},
            (result) => {
                this.updateStatus(  HaystackService.Statuses.running );
                Logger.log('info', "Action [Start] resolved on [" + this.service_name + "]");
                resolve(result);
            },
            (err) => {
                Logger.log('info', "Action [Start] error on [" + this.service_name + "]", {error: err});
                this.updateStatus(  HaystackService.Statuses.impaired, err );
                reject(err);
            }
        );


    });
}



HaystackService.prototype.stop = function(){
    return new Promise((resolve, reject)  => {
        Logger.log('info', "Action [Stop] called on [" + this.service_name + "]");
        this.updateStatus(  HaystackService.Statuses.stopping );

        this.send_provider_message("stop", {},
            (result) => {
                this.updateStatus(  HaystackService.Statuses.stopped );
                Logger.log('info', "Action [Stop] resolved on [" + this.service_name + "]");
                resolve(result);
            },
            (err) => {
                Logger.log('info', "Action [Stop] error on [" + this.service_name + "]", {error: err});
                this.updateStatus(  HaystackService.Statuses.impaired, err );
                reject(err);
            }
        );


    });
}




HaystackService.prototype.terminate = function(){
    return new Promise((resolve, reject)  => {
        Logger.log('info', "Action [Terminate] called on [" + this.service_name + "]");
        this.updateStatus(  HaystackService.Statuses.terminating );



        this.send_provider_message("terminate", {},
            (result) => {
                this.updateStatus(  HaystackService.Statuses.terminated );
                Logger.log('info', "Action [Terminate] resolved on [" + this.service_name + "]");


                //terminate the thread.
                console.log("EXITING THE THREAD", this.process.pid);
                process.kill(this.process.pid);

                resolve(result);
            },
            (err) => {
                Logger.log('info', "Action [Terminate] error on [" + this.service_name + "]", {error: err});
                this.updateStatus(  HaystackService.Statuses.impaired, err);
                reject(err);
            }
        );


    });
}




HaystackService.prototype.inspect = function(){
    return new Promise((resolve, reject)  => {
        Logger.log('info', "Action [Inspect] called on [" + this.service_name + "]");


        this.send_provider_message("inspect", {},
            (result) => {
                Logger.log('info', "Action [Inspect] resolved on [" + this.service_name + "]");
                resolve(result);
            },
            (err) => {
                Logger.log('info', "Action [Inspect] error on [" + this.service_name + "]", {error: err});
                this.updateStatus(HaystackService.Statuses.impaired, err);
                reject(err);
            }
        );


    });
}



HaystackService.prototype.ssh = function(){
    return new Promise((resolve, reject)  => {
        Logger.log('info', "Action [Ssh] called on [" + this.service_name + "]");


        this.send_provider_message("ssh", {},
            (result) => {
                Logger.log('info', "Action [Ssh] resolved on [" + this.service_name + "]");
                resolve(result);
            },
            (err) => {
                Logger.log('info', "Action [Ssh] error on [" + this.service_name + "]", {error: err});
                reject(err);
            }
        );


    });
}

/*
 End Haystack Service Actions
 */



HaystackService.prototype.updateStatus = function(status, error_msg){

    if(HaystackService.Statuses[status] == undefined){
        throw new Error("The status [" + status + "] is not a valid service status.");
    }

    if(error_msg)
    {
        this.error = error_msg;
    }
    else{
        this.error = null;
    }

    this.status = status;
    this.stack.refresh();
}



HaystackService.Modes = {
    local: "local"
}


HaystackService.Statuses = {
    pending: "pending",
    starting: "starting",
    running: "running",
    stopping: "stopping",
    stopped: "stopped",
    terminating: "terminating",
    terminated: "terminated",
    impaired: "impaired"
}



module.exports = HaystackService;