'use strict';

var fs = require("fs-extra");
var path = require("path");
var appRoot = require('app-root-path');
var config = require("config");
var Provider = require("./provider.js");


var Manager = function(){

}

Manager.LoadProvider = function(provider_id){

    var path_to_provider = null;

    //try to load a module from a path.
    if(fs.pathExistsSync(provider_id)){
        path_to_provider = provider_id;
    }

    //try to load a network from core
    var file_path = path.join(appRoot.resolve("."), "resources", "providers", provider_id);
    if(fs.pathExistsSync(file_path)){
        path_to_provider = file_path;
    }

    if(!path_to_provider){
        throw new Error("Unable to locate the provider [" + provider_id + "].");
    }


    return new Provider(path_to_provider);

}


module.exports = Manager;