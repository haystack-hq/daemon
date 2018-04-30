'use strict';

var Logger = require("../../../src/lib/logger");
var ServicePluginLib = require("./service-plugin-lib");
var StackService = require("../stack/stack-service");
var Promise = require('bluebird');

var _healthcheck = null;
var _healthcheck_interval = 2000;
var _setInterval = setInterval;
var _clearInterval = clearInterval;


var ServicePluginProvider = function(stack, service, plugin, provider, logger, status_update_callback){
    Logger.log('debug', 'Init ServicePluginProvider [' + plugin.id + '] of ['+ provider.id + ']');


    this.errors = [];
    this.stack = stack;
    this.status_update_callback = status_update_callback;
    this.id = provider.id;

    //inject helpers.
    this.provider = provider.provider_class;
    this.service = service;
    this.service_logger = logger;
    this.init_provider();


}



/*
Haystack libs are all injected into the provider at runtime.
This allows us to provide some common libraries that will make it easier on the service plugin author.
 */
ServicePluginProvider.prototype.init_provider = function(){


    /* service */
    var service = {
        params: this.service.service_info,
        name: this.service.service_name,
        id: this.stack.identifier + "_" + this.service.service_name
    }

    /* haystack */
    var haystack = {};

    //libraries included
    ServicePluginLib.GetLibs().forEach((lib) => {
        Logger.log('debug', 'Injected haystack.lib.' + lib.name + ' to the provider [' + this.id  + ']');
        var D = require(lib.path);
        haystack[lib.name] = new D();
    });

    //service logger provides logging from the service plugin provider.
    haystack.logger = this.service_logger;


    /* init the provider */
    this.provider_instance = new this.provider(service, haystack);


    //handle set timeouts
    setInterval = function() {
        Logger.log('debug', 'Method [setInterval] is not supported in service plugins. Please implement the [hearbeat] method. ');
    };
    setTimeout = function() {
        Logger.log('debug', 'Method [setTimeout] is not supported in service plugins. Please implement the [hearbeat] method. ');
    };


    //add required actions.
    this.implement_provider_required_actions();

    //add optional actions.
    this.implement_provider_optional_actions();


    //add healthcheck
    this.implement_healthcheck();




}



/* adds methods for all required actions */
ServicePluginProvider.prototype.implement_provider_required_actions = function(){
    var self = this;

    //required actions.
    ServicePluginProvider.RequiredActions.forEach((method) => {
        this[method] = function(){
            return new Promise((resolve, reject)  => {
                self.provider_instance[method](function(result){
                    resolve(result);
                }, function(err){
                    reject(err);
                });
            });
        }
    });


}



/* adds not implemented results for all optional actions. provides an error when not implemented. */
ServicePluginProvider.prototype.implement_provider_optional_actions = function(){
    var self = this;

    //optional actions.
    ServicePluginProvider.OptionalActions.forEach((method) => {

        this[method] = function(){
            return new Promise((resolve, reject)  => {

                //check to see if the provider supports the method.
                if(typeof self.provider_instance[method] === "function")
                {
                    self.provider_instance[method](function(result){
                        resolve(result);
                    }, function(err){
                        reject(err);
                    })
                }
                else
                {
                    var msg = "Provider [" + this.id + "] does not implement the [" + method +  "] action.";
                    Logger.log('debug', msg);
                    reject(msg);
                }

            });
        }
    });


}

ServicePluginProvider.prototype.implement_healthcheck = function(){

    if(this.provider_instance.healthcheck){

        _healthcheck = _setInterval(() => {

            if(this.service.status == StackService.Statuses.running || this.service.status == StackService.Statuses.impaired){

                this.provider_instance.healthcheck((result) => {

                    this.status_update_callback({
                        status: StackService.Statuses.running,
                        error: null
                    })

                }, (err) => {
                    this.service.status = StackService.Statuses.impaired;
                    this.service.error = err;

                    //send this status back to the service.
                    this.status_update_callback({
                        status: this.service.status,
                        error: this.service.error
                    });
                });
            }


        }, _healthcheck_interval);


    }


}

ServicePluginProvider.prototype.validate = function(){
    var is_valid = true;

    //validate that the provider has required methods.
    ServicePluginProvider.RequiredActions.forEach((method) => {
        if (typeof this.provider_instance[method] != "function") {
            is_valid = false;
            this.errors.push("Provider [" + this.id + "] is mising required method [" + method + "].");
        }
    });

    return is_valid;

}




ServicePluginProvider.RequiredActions = ["start",  "terminate",  "inspect" ];
ServicePluginProvider.OptionalActions = ["ssh","stop"];


module.exports = ServicePluginProvider;

