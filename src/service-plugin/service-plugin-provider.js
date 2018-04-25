'use strict';

var Logger = require("../../src/lib/logger");
var ServicePluginLib = require("../../src/service-plugin/service-plugin-lib");
var Promise = require('bluebird');

var ServicePluginProvider = function(service, plugin_id, provider_id, provider){
    Logger.log('debug', 'Init ServicePluginProvider [' + plugin_id + '] of ['+ provider_id + ']');

    this.errors = [];


    //get provider
    this.id = provider_id;

    console.log("provider", provider);

    //inject helpers.
    this.provider = provider.provider_class;
    this.service = service;
    this.provider_instance = new this.provider();
    this.inject();


    //add required actions.
    this.implement_provider_required_actions();

    //add optional actions.
    this.implement_provider_optional_actions();

    

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

    /* libs */
    this.provider_instance.haystack = { lib: {} };

    ServicePluginLib.GetLibs().forEach((lib) => {
        Logger.log('debug', 'Injected haystack.lib.' + lib.name + ' to the provider [' + this.id  + ']');
        var D = require(lib.path);
        this.provider_instance.haystack.lib[lib.name] = new D();
    });


    /* service */
    this.provider_instance.haystack.service = this.service;
    this.provider_instance.haystack.update = () => {
        this.provider_instance.haystack.service.refresh_service(this.service);
    };





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

