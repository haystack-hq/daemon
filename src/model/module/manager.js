'use strict';

/**
 * @file
 * Manages plugins
 *
 */

var fs  = require('fs-extra');
var path = require("path");
var appRoot = require('app-root-path');


var Manager = function() { }


Manager.GetPathToModule = function(module_ref){
    var path_to_module = null;

    //try to load a module from a path.
    if(fs.pathExistsSync(module_ref)){
        path_to_module = module_ref;
    }

    //try to load a module from core
    var file_path = path.join(appRoot.resolve("."), "resources", "modules", module_ref);
    if(fs.pathExistsSync(file_path)){
        path_to_module = file_path;
    }


    if(!path_to_module){
        throw new Error("Unable to locate the module [" + module_ref + "].");
    }


    return path_to_module;
}


module.exports = Manager;



