

var db = require('./../db/db-conn');
var HaystackService = require('./haystack-service');
var base64 = require("base-64");
var fs  = require('fs-extra');
var path = require('path');
var moment = require('moment');
var homedir = require("homedir");
var Promise = require('bluebird');
var Logger = require("../../../src/lib/logger");
var StackLogger = require("./logger");




var Haystack = function(data){

    //set defaults.
    this._id = null;
    this.identifier = null;
    this.services = null;
    this.mode = Haystack.Modes.local;
    this.provider = null;
    this.status = Haystack.Statuses.pending;
    this.health = Haystack.Health.unhealthy;
    this.created_by = null;
    this.haystack_file = null;
    this.terminated_on = null;
    this.stack_file_location = null;


    /* get / find the stack file based on the path provided. */
    if(data && data.stack_file_location && this.mode == Haystack.Modes.local){
        this.stack_file_location = data.stack_file_location;

        //todo: this should be able to be yml or json, right now it only works for json.
        var haystack_file_contents = fs.readFileSync(this.stack_file_location, 'utf8');
        data.haystack_file = JSON.parse(haystack_file_contents);


    }

    //set the data if it was passed in to a new stack.
    if(data){
        this._id = data._id ? data._id : null;
        this.identifier = data.identifier ? data.identifier : null;
        this.mode = data.mode ? data.mode : this.mode;
        this.provider = data.provider ? data.provider : this.provider;
        this.stack_file_location = data.stack_file_location ? data.stack_file_location : this.stack_file_location;
        this.status = data.status ? data.status : this.status;
        this.health = data.health ? data.health : this.health;
        this.created_by = data.created_by ? data.created_by : this.created_by;
        this.terminated_on = data.terminated_on ? data.terminated_on : this.terminated_on;
        this.haystack_file = data.haystack_file ? data.haystack_file : null;


        //todo: resort services by dependencies.

        this.services = [];
        Object.keys(this.haystack_file.services).forEach((key) => {
            var service_info = this.haystack_file.services[key];
            var haystack_service = new HaystackService(this, HaystackService.Modes.local, key, service_info);
            this.services.push(haystack_service);
        });

        this.stack_logger = new StackLogger(this.identifier);



    }

    return this;
}



Haystack.prototype._setData = function(data){




    return this;
}




Haystack.prototype.start = function(){

    this.updateStatus(Haystack.Statuses.starting);

    return new Promise((resolve, reject)  => {
        //all promises are complete.
        Promise.mapSeries(this.services, function(service){
            return service.start();
        }).then((res) => {
            this.updateStatus(Haystack.Statuses.running);
            resolve(res);
        }).catch((err) =>{
            reject(err);
        });
    });
}


Haystack.prototype.stop = function(){

    this.updateStatus(Haystack.Statuses.stopping);

    return new Promise((resolve, reject)  => {
        //all promises are complete.
        Promise.mapSeries(this.services, function(service){
            return service.stop();
        }).then((res) => {
            this.updateStatus(Haystack.Statuses.stopped);
            resolve(res);
        }).catch((err) => {
            reject(err);
        });
    });
}


Haystack.prototype.terminate = function(){

    //validate that we can terminate.
    this.updateStatus(Haystack.Statuses.terminating);

    return new Promise((resolve, reject)  => {
        //all promises are complete.
        Promise.mapSeries(this.services, (service) => {
            return service.terminate();
        }).then((res) => {

            this.updateStatus(Haystack.Statuses.terminated);
            this.terminated_on = Date.now();
            this.save();

            resolve(res);
        }).catch( (err) => {
            reject(err);
        });
    });

}


Haystack.prototype.inspect = function(){

    return new Promise((resolve, reject)  => {
        //all promises are complete.
        Promise.mapSeries(this.services, function(service){
            return service.inspect();
        }).then((res) => {
            this.save();
            resolve(res);
        }).catch((err) => {
            reject(err);
        });
    });
}


Haystack.prototype.getServicesData = function(){
    var data = {};
    this.services.forEach((service) => {
        data[service.service_name] = service.getData();
        //data.push(service.getData());
    });
    return data;
}

Haystack.prototype.getData = function(){

    //create a data object to be saved.
    var data = {
        _id: this._id,
        identifier: this.identifier,
        services: this.getServicesData(),
        mode: this.mode,
        provider: this.provider,
        stack_file_location: this.stack_file_location,
        status: this.status,
        health: this.health,
        created_by: this.created_by,
        terminated_on: this.terminated_on,
        haystack_file: this.haystack_file
    }

    return data;
}


Haystack.prototype.updateStatus = function(status){

    this.stack_logger.log("info", "status update: " +  status);

    if(Haystack.Statuses[status] == undefined){
        throw new Error("The status [" + status + "] is not a valid haystack status.");
    }

    this.status = status;
    this.save();
}


Haystack.prototype.refresh = function(){
    Logger.log('debug', 'Refreshing stack [' + this.identifier  + ']');
    this.save();
}

Haystack.prototype.save = function(){

    var data = this.getData();


    /* save new or existing stacks */
    if(this._id){
        //save existing
        db.stacks.update({_id: this._id}, data, {multi: false, upsert: false});
    }
    else
    {
        //create new
        db.stacks.save(data);
        var stack = db.stacks.findOne({identifier : this.identifier});
        this._id = stack._id;

    }


    return this;

}





Haystack.Statuses = {
    pending: "pending",
    starting: "starting",
    provisioning: "provisioning",
    provisioned: "provisioned",
    running: "running",
    stopping: "stopping",
    stopped: "stopped",
    impaired: "impaired",
    terminating: "terminating",
    terminated: "terminated"
}



Haystack.Health = {
    healthy: "healthy",
    unhealthy: "unhealthy"
}


Haystack.Modes = {
    local: "local"
}



module.exports = Haystack;