'use strict';

var fs = require("fs-extra");
var path = require("path");
var appRoot = require('app-root-path');
var config = require("config");
var Network = require("./network.js");
var ProviderManager = require("../provider/manager.js");


var Manager = function(){

}

Manager.LoadNetwork = function(network_ref, stack){
    var path_to_network = Manager.GetPathToNetwork(network_ref, stack.provider.id);

    return new Network(path_to_network);
}

Manager.GetPathToNetwork = function(network_ref, provider_id){

    var network = null;

    if(network_ref == null)
    {
        return Manager.GetPathToDefaultNetwork(provider_id);
    }

    var path_to_network = null;

    //try to load a module from a path.
    if(fs.pathExistsSync(network_ref)){
        path_to_network = network_ref;
    }

    if(!path_to_network) {
        //try to load the default.
        path_to_network = Manager.GetPathToDefaultNetwork(provider_id);
    }

    return path_to_network;

}


Manager.GetPathToNetworkRef = function(network_ref){
    //find the network based on refs.
    var network_path = path.join(appRoot.resolve("."), "resources", "networks", network_ref);

    if(!fs.pathExistsSync(network_path)){
        throw new Error("The network [" + network_ref + "] could not be found.");
    }

    return network_path;
}


/* load the default provider */
Manager.GetPathToDefaultNetwork = function(provider_id) {

    //try to get the path to the network based on the provider.
    var provider = ProviderManager.LoadProvider(provider_id);

    if(!provider.default_network){
        throw new Error("The provider [] is missing the default_network property.");
    }

    var path_to_network = Manager.GetPathToNetworkRef(provider.default_network);


    return path_to_network;

}

module.exports = Manager;