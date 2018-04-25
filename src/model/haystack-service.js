"use strict";

var path = require("path");
var appRoot = require('app-root-path');
var fs = require("fs-extra");
var Promise = require("bluebird");
var Logger = require("../../src/lib/logger");
var ServicePlugin = require('../service-plugin/service-plugin.js');
var ServicePluginProvider = require('../service-plugin/service-plugin-provider.js');

var HaystackService = function(stack, mode, service_name, service_info){

    //set some default properties
    this.stack = stack;
    this.service_name = service_name;
    this.mode = mode;
    this.service_info = service_info;
    this.updateStatus(HaystackService.Statuses.pending);
    this._is_healthy= false;
    this.plugin = null;
    this.plugin_service_provider = null;
    this.error = null;





    //health status
    Logger.log('debug', 'Injected is_healthy === false into the provider [' + this.id  + ']');
    Object.defineProperty(this, 'is_healthy', {
        set: function(y) {
            this._is_healthy = y;
            this.refresh_service(this);
        },
        get: function() {
            return this._is_healthy;
        }
    });


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


    //validate the path;



    try
    {
        //load a plugin
        this.plugin = new ServicePlugin(this.service_name, plugin_path);

        //load the provider.
        this.provider = this.plugin.getProvider(this.service_info.provider, this.mode);
        this.service_plugin_provider = new ServicePluginProvider(this, this.plugin.id, this.provider.id, this.provider);
    }
    catch(ex)
    {
        throw(ex);
    }


}



HaystackService.prototype.getData = function(){
    return {
        service_name: this.service_name,
        status: this.status,
        is_healthy: this.is_healthy
    }
}


/*
Begin Haystack Service Actions
 */
HaystackService.prototype.init = function(){
    return new Promise((resolve, reject)  => {
        Logger.log('info', "Action [Init] called on [" + this.service_name + "]");
        this.updateStatus( HaystackService.Statuses.provisioning );
        this.service_plugin_provider.init()
            .then((result) => {
                Logger.log('info', "Action [Init] resolved on [" + this.service_name + "]");
                this.updateStatus(  HaystackService.Statuses.provisioned );
                resolve(result);
            })
            .catch((err) => {
                Logger.log('info', "Action [Init] error on [" + this.service_name + "]", {error: err});
                this.updateStatus(  HaystackService.Statuses.impaired );
                this.error = err;
                reject(err);
            });
    });

}


HaystackService.prototype.start = function(){
    return new Promise((resolve, reject)  => {
        Logger.log('info', "Action [Start] called on [" + this.service_name + "]");
        this.updateStatus(  HaystackService.Statuses.starting);
        this.service_plugin_provider.start()
            .then((result) => {
                this.updateStatus(  HaystackService.Statuses.running );
                Logger.log('info', "Action [Start] resolved on [" + this.service_name + "]");
                resolve(result);
            })
            .catch((err) => {
                Logger.log('info', "Action [Start] error on [" + this.service_name + "]", {error: err});
                this.updateStatus(  HaystackService.Statuses.impaired );
                this.error = err;
                reject(err);
            });
    });
}



HaystackService.prototype.stop = function(){
    return new Promise((resolve, reject)  => {
        Logger.log('info', "Action [Stop] called on [" + this.service_name + "]");
        this.updateStatus(  HaystackService.Statuses.stopping );
        this.service_plugin_provider.stop()
            .then((result) => {
                this.updateStatus(  HaystackService.Statuses.stopped );
                Logger.log('info', "Action [Stop] resolved on [" + this.service_name + "]");
                resolve(result);
            })
            .catch((err) => {
                Logger.log('info', "Action [Stop] error on [" + this.service_name + "]", {error: err});
                this.updateStatus(  HaystackService.Statuses.impaired );
                this.error = err;
                reject(err);
            });
    });
}




HaystackService.prototype.terminate = function(){
    return new Promise((resolve, reject)  => {
        Logger.log('info', "Action [Terminate] called on [" + this.service_name + "]");
        this.updateStatus(  HaystackService.Statuses.terminating );
        this.service_plugin_provider.terminate()
            .then((result) => {
                this.updateStatus(  HaystackService.Statuses.terminated );
                Logger.log('info', "Action [Terminate] resolved on [" + this.service_name + "]");
                resolve(result);
            })
            .catch((err) => {
                Logger.log('info', "Action [Terminate] error on [" + this.service_name + "]", {error: err});
                this.updateStatus(  HaystackService.Statuses.impaired );
                this.error = err;
                reject(err);
            });
    });
}




HaystackService.prototype.inspect = function(){
    return new Promise((resolve, reject)  => {
        Logger.log('info', "Action [Inspect] called on [" + this.service_name + "]");
        this.service_plugin_provider.inspect()
            .then((result) => {
                Logger.log('info', "Action [Inspect] resolved on [" + this.service_name + "]");

                try{
                    this.updateStatus(  result.status );
                }
                catch(ex){
                    var statuses_as_list = Object.keys(HaystackService.Statuses).map(function(k){return HaystackService.Statuses[k]}).join(",");
                    var msg = "The service plugin returned an invalid status of [" + result.status + "]. Valid service status options are [" + statuses_as_list + "]";
                    this.updateStatus(HaystackService.Statuses.impaired, msg)
                    Logger.log('debug', "Action [Inspect] error on [" + this.service_name + "] returned an invalid status", {status: result.status});
                    reject(ex);
                }


                resolve(result);
            })
            .catch((err) => {
                Logger.log('info', "Action [Inspect] error on [" + this.service_name + "]", {error: err});
                this.error = err;
                reject(err);
            });
    });
}



HaystackService.prototype.ssh = function(){
    return new Promise((resolve, reject)  => {
        Logger.log('info', "Action [Ssh] called on [" + this.service_name + "]");
        this.service_plugin_provider.ssh()
            .then((result) => {
                Logger.log('info', "Action [Ssh] resolved on [" + this.service_name + "]");
                resolve(result);
            })
            .catch((err) => {
                Logger.log('info', "Action [Ssh] error on [" + this.service_name + "]", {error: err});
                this.error = err;
                reject(err);
            });
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
}



HaystackService.Modes = {
    local: "local"
}


HaystackService.Statuses = {
    pending: "pending",
    provisioning: "provisioning",
    provisioned: "provisioned",
    starting: "starting",
    running: "running",
    stopping: "stopping",
    stopped: "stopped",
    terminating: "terminating",
    terminated: "terminated",
    impaired: "impaired"
}



module.exports = HaystackService;