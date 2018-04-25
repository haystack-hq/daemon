

var db = require('./../db/db-conn');
var LocalInterface = require('./../interface/local/local-interface');
var HaystackService = require('./haystack-service');
var base64 = require("base-64");
var fs  = require('fs-extra');
var path = require('path');
var moment = require('moment');
var homedir = require("homedir");
var Promise = require('bluebird');
var Logger = require("../../src/lib/logger");


var findup = require('findup-sync');


var Haystack = function(event_bus, data){
    this.event_bus = event_bus;

    //set defaults.
    this._id = null;
    this.identifier = null;
    this.services = null;
    this.mode = Haystack.Mode.local;
    this.provider = null;
    this.status = Haystack.Statuses.pending;
    this.health = Haystack.Health.unhealthy;
    this.created_by = null;
    this.haystack_file = null;
    this.terminated_on = null;
    this.stack_file_location = null;

    /* get / find the stack file based on the path provided. */
    if(data && data.stack_file_location && this.mode == Haystack.Mode.local){
        this.stack_file_location = data.stack_file_location;
        data.haystack_file = require(this.stack_file_location);
    }

    //set the data if it was passed in to a new stack.
    if(data){
        this._setData(data);
    }

    return this;
}



Haystack.prototype._setData = function(data){


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




    return this;
}


Haystack.prototype.load = function(identifier){
    var haystack_data = Haystack.FindOne(identifier);

    if(haystack_data)
    {
        this._setData(haystack_data);
    }
    else
    {
        throw new Error("Haystack [" + identifier + "] not found.");
    }

    return this;
};




Haystack.findHaystackfileFromPath = function(path){

}




Haystack.prototype.init = function(){

    this.updateStatus(Haystack.Statuses.provisioning);

    return new Promise((resolve, reject)  => {
        //all promises are complete.
        Promise.mapSeries(this.services, (service) => {
            return service.init();
        }).then((res) => {

            this.updateStatus(Haystack.Statuses.provisioned);
            return this.inspect();
        }).then((res) => {

            resolve(res);
        }).catch((err) => {
            reject(err);
        });
    });
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


Haystack.prototype.delete = function(){
    db.stacks.remove({identifier : this.identifier}, true);
}


Haystack.prototype.getServicesData = function(){
    var data = [];
    this.services.forEach((service) => {
        var d = {
            status: service.status,
            is_healthy: service.is_healthy,
            error: service.error
        }




        data.push(d);
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


Haystack.prototype.getStatusData = function(){

    //create a data object to be saved.
    var data = {
        identifier: this.identifier,
        services: this.getServicesData(),
        status: this.status,
        health: this.health,
        terminated_on: this.terminated_on
    }

    return data;
}

Haystack.prototype.updateStatus = function(status){


    if(Haystack.Statuses[status] == undefined){
        throw new Error("The status [" + status + "] is not a valid haystack status.");
    }

    this.status = status;
    this.save();
}



Haystack.prototype.findService = function(name){
    var service = null;

    for(var i = 0; i < this.services.length; i++)
    {
        if(this.services[i].name == name)
        {
            service = this.services[i];
            break;
        }
    }

    return service;
}



Haystack.prototype.canBeRemoved = function(){
    return stack.status == Haystack.Statuses.terminated;
}


Haystack.FindHaystackFilePath = function(path_provided){

    var file = null;

    try {

        var stats = fs.statSync(path_provided);
        if(stats.isFile()){
            path_provided = path.dirname(path_provided)
        }


        var file = findup('Haystackfile.*', {cwd: path_provided, nocase: true});

    }
    catch (ex){
        //nothing to do.
        //todo: log?
    }


    return file ? file : null;
}


Haystack.GenerateIdentifierFromPath = function(path_provided){

    var identifier = null;

    try {


        var stats = fs.statSync(path_provided);
        if(stats.isFile()){
            path_provided = path.dirname(path_provided)
        }


        //get the directory
        identifier = path.basename(path_provided);

    }
    catch (ex){
        throw (ex);
    }

    identifier = identifier.replace(/[^A-Z0-9]/ig, "-").replace(/(-)\1{1,}/g, '$1').replace(/-+$/, "");

    return identifier;
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

    //docker-stack-change
    this.event_bus.emit('haystack-update',  this.getStatusData());

    return this;

}




Haystack.Search = function(query){
    //return all stacks
    return db.stacks.find(query);
}

Haystack.FindOne = function(identifier){

    var stack_data = null;

    /* if an identifer is passed in, try load from the DB */
    try
    {
        if(identifier){
            var stack_data = db.stacks.findOne({identifier : identifier});
        }
        else
        {
            throw("Stack Identifier required.")
        }
    }
    catch (ex){
        throw(ex);
    }

    return stack_data;

}

Haystack.RemoveAll = function(){
    //removes all stacks
    db.stacks.remove();
    var basePath = homedir() + "/.haystack/client-agent-db";
    db.connect(basePath, ['stacks']); //todo: this is a hack and there should be a proper remove all stacks feature on DB.
}


/* clean up stacks that have been terminated more than x seconds */
Haystack.CleanUpTerminated = function(seconds){
    //find all the stacks.
    var stacks = db.stacks.find({status : Haystack.Statuses.terminated});

    //loop all terminated and see if seconds has lapsed.
    stacks.forEach(function (stack) {


        var a = new moment(stack.terminated_on);
        var b = new moment(Date.now());

        var laps = b.diff(a, 'seconds');

        //delete when enough seconds have gone by.
        if(laps >= seconds){
            db.stacks.remove({identifier : stack.identifier}, false);
        }

    });
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


Haystack.Mode = {
    local: "local"
}



module.exports = Haystack;