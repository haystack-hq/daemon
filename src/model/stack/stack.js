'use strict';

/**
 * @file
 * Stack interprets a haystack file
 *
 * Stack a JSON object of a Haystack file. The stack is converted to objects that can be implmented.
 */

var fs = require("fs-extra");
var db = require('./../db/db-conn');
var Promise = require("bluebird");
var ProviderManager = require("../provider/manager");
var StackLogger = require("./logger");

var Stack = function(data) {

    this.stack_logger = new StackLogger(data.identifier);

    //defaults
    this._id = data._id;
    this.identifier = data.identifier;
    this.stack_file_location = data.stack_file_location;
    this.mode = data.mode;
    this.provider_id = data.provider_id;
    this.provider = ProviderManager.LoadProvider(this.provider_id);
    this.status = data.status ? data.status : Stack.Statuses.pending;
    this.error = data.error ? data.error : null;
    this.created_by = data.created_by;
    this.terminated_on = data.terminated_on;


    /* haystack*/
    if(data.haystack)
    {
        this.haystack = data.haystack;
    }
    else
    {
        //todo: support yml.
        this.haystack = fs.readJsonSync(this.stack_file_location);
    }


    /* services */
    if(data.services)
    {
        this.services = data.services
    }
    else
    {
        this.services = {};

        //no stack service datat defined yet, init it.
        Object.keys(this.haystack.services).forEach((key) => {
            var id = key;


            this.services[key] = {
                status: Stack.Statuses.pending,
                error: null
            }
        });
    }



    //validate that the mode is supported by the provider.
    if(this.provider.modes.indexOf(this.mode) === -1)
    {
        throw new Error("The mode [" + this.mode + "] is not supported by the provider [" + this.provider.id + "].");
    }

    //save
    this.save();
}


Stack.prototype.update_service = function(service_id, status, error){

    this.services[service_id].status = status;
    if(error)
    {
        this.services[service_id].error = error;
    }
    else
    {
        this.services[service_id].error = null;
    }

    this.save();
}


Stack.prototype.getData = function(){

    //create a data object to be saved.
    var data = {
        _id: this._id,
        identifier: this.identifier,
        services: this.services,
        mode: this.mode,
        provider_id: this.provider.id,
        provider: this.provider,
        stack_file_location: this.stack_file_location,
        status: this.status,
        error: this.error,
        created_by: this.created_by,
        terminated_on: this.terminated_on,
        stack_file: this.stack_file
    }

    return data;
}


Stack.prototype.update_status = function(status, error){

    this.stack_logger.log("info", "status update: " +  status);

    if(Stack.Statuses[status] == undefined){
        throw new Error("The status [" + status + "] is not a valid stack status.");
    }

    this.status = status;

    if(error)
    {
        this.error = error;
    }
    else
    {
        this.error = null;
    }

    this.save();
}




Stack.prototype.save = function(){



    var data = this.getData();

    //console.log("this.data", data);

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



Stack.Statuses = {
    pending: "pending",
    starting: "starting",
    running: "running",
    stopping: "stopping",
    stopped: "stopped",
    impaired: "impaired",
    terminating: "terminating",
    terminated: "terminated"
}


Stack.Modes = {
    local: "local"
}

Stack.Commands = {
    Required: [
        { cmd: "start", status_from: Stack.Statuses.starting, status_to: Stack.Statuses.running },
        { cmd: "stop", status_from: Stack.Statuses.stopping, status_to: Stack.Statuses.stopped },
        { cmd: "terminate", status_from: Stack.Statuses.terminating, status_to: Stack.Statuses.terminated },
        { cmd: "inspect" }
    ],

    Optional: ["ssh"]
}

Stack.Service = {
    CommandToStatus: {

    }
}


module.exports = Stack;


