'use strict';

/**
 * @file
 * Manages plugins
 *
 */

var ModuleManager = require("../module/manager");
var ModuleInterface = require("../module/interface");
var Manifest = require("../../lib/manifest");
var Replacer = require('pattern-replace');
var fs  = require('fs-extra');
var path = require("path");


var Plugin = function(path_to_plugin, plugin_ref) {
    this.path_to_plugin = path_to_plugin;
    this.name = (this.plugin_ref ? this.plugin_ref : path_to_plugin);
    this.module = null;
    this.provider_config = null;

    this._validate();

    //get the manifest file.
    this.manifest = fs.readJsonSync(path.join(this.path_to_plugin, "manifest.json"));


    //set properties of manifest.
    this.name = this.manifest.name;
    this.version = this.manifest.version;
    this.providers = this.manifest.providers;
    this.parameters = this.manifest.parameters;


}

Plugin.prototype.init = function(provider_id, vars){
    //get the module for the provider reference.
    var provider_data = this.providers[provider_id];
    if(provider_data) {
        this.provider_config = Manifest.ParseValue(this.path_to_plugin, provider_data.config);
    }
    else
    {
        throw new Error("The plugin [" + this.name + "] does not support the [" + provider_id + "] provider. The supported providers for the plugin are [" + this._supported_providers().join() + "]. ");
    }

    //replace variables
    this.provider_config = this._replace_variables(vars);

    //get the path to the plugins module.
    this.path_to_module = ModuleManager.GetPathToModule(provider_data.module);


}



Plugin.prototype._replace_variables = function(vars){
    //replace variables in the config.
    var config_as_string = JSON.stringify(this.provider_config);


    //make a list of patters from list of vars
    if(vars)
    {
        var patterns = [];
        for (var k in vars) {
            var value = vars[k];
            patterns.push({
                match: k,
                replacement: value
            });
        }

        var replacer = new Replacer({ patterns: patterns });
        var result = replacer.replace(config_as_string);
        var config = JSON.parse(result);

        if(config == false)
        {
            throw new Error("Setting the plugin parameters failed for plugin [" + this.name + "].");
        }
    }
    else
    {
        var config = this.provider_config;
    }


    return config;
}


Plugin.prototype._validate = function(){
    //confirm that there is a manifest file.
    if(!fs.pathExistsSync(path.join(this.path_to_plugin, "manifest.json"))){
        throw new Error("The plugin [" + this.name + "] is missing a manifest.json file.");
    }

    //validate the manifest file
    try
    {
        //todo: do more than just confirm json.
        fs.readJsonSync(path.join(this.path_to_plugin, "manifest.json"));
    }
    catch(ex)
    {
        throw new Error("The plugin [" + this.name + "] manifest file is not valid json.")
    }
}

Plugin.prototype._supported_providers = function(){
    return Object.keys(this.providers);
}




module.exports = Plugin;
