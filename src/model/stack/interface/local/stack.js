'use strict';

/**
 * @file
 * Controls a stack from the local machine.
 *
 */

var Promise = require("bluebird");
var ServiceInterface = require("./service");
var NetworkManager = require("../../../network/manager");
var Thread = require("../../../thread/thread");
var path = require("path");

var StackInterface = function(stack){
    this.stack = stack;


    /* network */
    var network_ref = null; //todo: get newtork from stack file. For now we are using the defaults.
    this.network = NetworkManager.LoadNetwork(network_ref, this.stack.provider.id);
    this.network.init(this.stack.identifier);

    /* services. */
    this.services = [];
    for (var service_id in this.stack.haystack.services) {
        var data = this.stack.haystack.services[service_id];
        this.services.push(new ServiceInterface(service_id, data, this.stack));
    }

}

StackInterface.prototype.start = function() {

    return new Promise((resolve, reject)  => {

        //start the network
        this.network.start().then((result) => {

            /* start each of the services */
            Promise.mapSeries(this.services, function(service){
                return service.start();
            }).then((res) => {
                resolve(res);
            }).catch((err) =>{
                reject(err);
            });

        }).catch((err) => {
            reject(err);
        });



    });
}



module.exports = StackInterface;