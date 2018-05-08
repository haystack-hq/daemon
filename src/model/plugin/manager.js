'use strict';

/**
 * @file
 * Manages plugins
 *
 */

var fs  = require('fs-extra');
var path = require("path");
var appRoot = require('app-root-path');
var Plugin = require("./plugin");


var Manager = function() { }


Manager.LoadPlugin = function(data){
    var path_to_plugin = Manager._GetPluginPath(data.plugin);
    return new Plugin(path_to_plugin, data.plugin);
}

Manager._GetPluginPath = function(plugin_ref){
    var path_to_plugin = null;
    var plugin_name = null;

    //try to load a plugin from a path.
    if(fs.pathExistsSync(plugin_ref)){
        path_to_plugin = plugin_ref;
    }

    //try to load a plugin from core
    var p = path.join(appRoot.resolve("."), "resources", "plugins", plugin_ref);

    if(fs.pathExistsSync(p)){
        path_to_plugin = p;
    }

    if(!path_to_plugin){
        throw new Error("The Plugin [" + plugin_ref + "] does not exist.");
    }

    return path_to_plugin;
}

module.exports = Manager;



