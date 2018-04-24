'use strict';

var Logger = require("../../src/lib/logger");
var ServicePluginLib = require("../../src/service-plugin/service-plugin-lib");
var Promise = require('bluebird');

var ServicePluginProvider = function(plugin_id, provider_id, provider, service_info){
    Logger.log('debug', 'Init ServicePluginProvider [' + plugin_id + '] of ['+ provider_id + ']');

    this.errors = [];


    //get provider
    this.id = provider_id;

    console.log("provider", provider);

    //inject helpers.
    this.provider = provider.provider_class;
    this.service_info = service_info;
    this.inject();
    this.provider_instance = new this.provider();
    this.provider_instance.inject_haystack();


    //add required actions.
    this.implement_provider_required_actions();

    //add optional actions.
    this.implement_provider_optional_actions();

    //add in

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
                })
            });
        }
    });


}



/* adds not implemented results for all optional actions. provides an error when not implemented. */
ServicePluginProvider.prototype.implement_provider_optional_actions = function(){
    var self = this;

    //required actions.
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

/*
Haystack libs are all injected into the provider at runtime.
This allows us to provide some common libraries that will make it easier on the service plugin author.
 */
ServicePluginProvider.prototype.inject = function(){

    this.provider.prototype.haystack = { lib: {} };



    //inject
    this.provider.prototype.inject_haystack = (provider) => {
        ServicePluginLib.GetLibs().forEach((lib) => {
            Logger.log('debug', 'Injected haystack.lib.' + lib.name + ' to the provider [' + this.id  + ']');
            var D = require(lib.path);
            this.provider_instance.haystack.lib[lib.name] = new D();
        });

        //health status
        Logger.log('debug', 'Injected is_healthy === false into the provider [' + this.id  + ']');
        Object.defineProperty(this.provider_instance, 'is_healthy', {
            set: function(y) {
                this._is_healthy = y;
            },
            get: function() {
                return this._is_healthy;
            }
        });
        this.provider_instance.is_healthy = false;
        this.provider_instance.service_info = this.service_info;


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





ServicePluginProvider.RequiredActions = ["init", "start", "stop", "terminate", "inspect"];
ServicePluginProvider.OptionalActions = ["ssh"];


module.exports = ServicePluginProvider;

