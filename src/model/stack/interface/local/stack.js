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
    this.stack.network = {
        name: "haystack-" + this.stack.identifier
    }
    this.network = NetworkManager.LoadNetwork(network_ref, this.stack);
    this.network.init(this.stack);


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

            var counter = 0;

            Promise.mapSeries(this.services, (service) => {
                return service.start();
            }).then((res) => {
                resolve();

            }).catch((err) =>{
                reject(err);
            });


        }).catch((err) => {
            reject(err);
        })



    });
}


StackInterface.prototype.terminate = function() {

    return new Promise((resolve, reject)  => {

        var counter = 0;

        //terminate each of the services.
        Promise.mapSeries(this.services, (service) => {
            return service.terminate();
        }).then((res) => {
            //terminate the network
            this.network.terminate().then((result) => {
                resolve();
            }).catch((err) => {
                reject(err);
            });

        }).catch((err) =>{
            reject(err);
        });







    });
}



module.exports = StackInterface;