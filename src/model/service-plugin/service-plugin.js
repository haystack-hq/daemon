'use strict';

var path = require('path');
var fs  = require('fs-extra');
var Manifest = require('./service-plugin-manifest');
var Promise = require("bluebird");
var path = require("path");
var Logger = require("../../../src/lib/logger");
var Validator = require('jsonschema').Validator;
var ServicePluginProvider = require("./service-plugin-provider");
const os = require('os');

var ServicePlugin = function(service_name, path_to_plugin){
    try
    {
        this.id = path_to_plugin;
        this.service_name = service_name;
        this.path_to_plugin = path_to_plugin;
        this.manifest_file_path = path.join(this.path_to_plugin, "manifest.json");

        //validate the manifest file
        this.validate();


        //load the plugin
        this.manifest = fs.readJsonSync(this.manifest_file_path);
        this.init();

    }
    catch(ex)
    {
        console.trace();
        throw new Error(ex);
    }

}

ServicePlugin.prototype.validate = function(){

    //validate that the manifest file exists.
    if(!fs.pathExistsSync(this.manifest_file_path)){
        var msg = "Manifest file at [" + this.manifest_file_path + "] does not exist.";
        Logger.log('info', msg);
        throw new Error(msg);
    }

    //validate that it is valid json
    try{
        fs.readJsonSync(this.manifest_file_path, {throw: true});
    }
    catch(ex)
    {
        var msg = "The plugin at [" + this.service_name + "] manifest file at [" + this.manifest_file_path + "] is not valid json.";
        Logger.log('debug', msg);
        throw new Error(msg);
    }

    //validate that it is valid scheme
    var manifest = fs.readJsonSync(this.manifest_file_path);
    var validator = new Validator();
    var schema = {
        "type": "object",
        "properties": {
            "name": {"type": "string", "required": true },
            "version": {"type": "string", "required": true },
            "providers": {"type": "object", "required": true },
            "default_provider": {"type": "string", "required": true }
        }
    };
    var validateJsonResult = validator.validate(manifest, schema);
    if(validateJsonResult.errors.length > 0){
        validateJsonResult.errors.forEach((err) => {
            var stack = err.stack.replace("instance.", "");
            var msg = "The plugin at [" + this.service_name + "]  manifest file error [property " + stack + "]";
            Logger.log('debug', msg);
            throw new Error(msg);
        });
    }

}

ServicePlugin.prototype.init = function(){
    var self = this;

    this.name = this.manifest.name;
    this.version = this.manifest.version;

    //providers
    this.providers = [];
    for (var k in self.manifest.providers){
        var provider_file_path = self.manifest.providers[k];
        var provider = path.join(this.path_to_plugin, provider_file_path);
        var p = {
            id: k,
            provider_class: require(provider)
        }
        Logger.log('debug', "provider found", {provider: p});
        this.providers.push(p);
    }



    //default provider
    this.set_default_provider();


}


ServicePlugin.prototype.get_provider_by_id = function(id){
    var providers = this.providers.filter(function (provider) { return provider.id == id });
    if(providers.length > 0){
        return providers[0];
    }
    else{
        return null;
    }
}

ServicePlugin.prototype.set_default_provider = function(){
    var provider_id = this.manifest.default_provider;

    if(!provider_id){
        throw new Error("The manifest the service plugin [" + this.service_name + "] has no parameter [default_provider] defined.")
    }

    //find this provider in the list of defaults.
    var provider = this.get_provider_by_id(provider_id);


    if(!provider){
        throw new Error("The manifest the service plugin [" + this.service_name + "] has [default_provider] of [" + provider_id + "] which can not be found in the providers list.");
    }

    this.default_provider = provider;
}


/* load provider by id, roll back to default if id not found */
ServicePlugin.prototype.getProvider = function(provider_value, mode){

    //todo: handle mode.

    var provider = null;

    if(typeof provider_value == 'undefined')
    {
        if(this.manifest.default_provider.id == provider_value){
            provider = this.default_provider;
        }
        else
        {
            throw new Error("The default provider for the plugin at [" + this.service_name + "] is not defined.");
        }
    }
    else if(typeof provider_value == "object")
    {

        Object.keys(provider_value).forEach((key) => {
            //match the mode passed.
            if(key == mode){
                var provider_id = provider_value[key];
                provider = this.get_provider_by_id(provider_id);
            }
        });

        //if we got here, no provider id.
        if(provider == null)
        {
            throw new Error("The Service Plugin for [" + this.service_name + "] does not have a provider that matches the mode [" + mode + "].");
        }

    }
    else if(typeof provider_value == "string")
    {
        provider = this.get_provider_by_id(provider_value);

        if(provider == null)
        {
            throw new Error("The Service Plugin for [" + this.service_name + "] does not have a provider that matches [" + provider_value + "].");
        }
    }
    else {

        throw new Error("The Service Plugin for [" + this.service_name + "] must have a provider value of a string or object. Or omit for to use the default provider.");
    }

    Logger.log("info", "Service Provider [" + provider.id + "] returned");

    return provider;

}




module.exports = ServicePlugin;