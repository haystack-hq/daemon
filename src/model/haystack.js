
var db = require('./../db/db-conn');
var LocalInterface = require('./../interface/local/local-interface');
var HaystackService = require('./haystack-service');
var base64 = require("base-64");
var EventBus2 = require('node-singleton-event');

var modes = {
    local: "local"
}

var health = {
    healthy: "healthy",
    unhealthy: "unhealthy"
}

var statuses = {
    pending: "pending",
    starting: "starting",
    provisioning: "provisioning",
    impared: "impared",
    running: "running",
    paused: "paused",
    stopping: "stopping",
    stopped: "stopped",
    terminating: "terminating",
    terminated: "terminated"
}




var Haystack = function(data){

    //set defaults.
    this._id = null;
    this.identifier = null;
    this.services = null;
    this.haystack_file_encoded = null;
    this.build_encoded = null;
    this.mode = modes.local;
    this.provider = null;
    this.stack_file_location = null;
    this.status = statuses.pending;
    this.health = health.unhealthy;
    this.interface = null;
    this.created_by = null;
    this.do_mount = false;
    this.haystack_file = null;
    this.build = null;
    this.terminated_on = null;


    //set the data if it was passed in to a new stack.
    if(data){
        this._setData(data);
    }


}

Haystack.prototype._setData = function(data){

    this._id = data._id ? data._id : null;
    this.identifier = data.identifier ? data.identifier : null;
    this.haystack_file_encoded = data.haystack_file_encoded ? data.haystack_file_encoded : this.haystack_file_encoded;
    this.build_encoded = data.build_encoded ? data.build_encoded : this.build_encoded;
    this.mode = data.mode ? data.mode : this.mode;
    this.provider = data.provider ? data.provider : this.provider;
    this.stack_file_location = data.stack_file_location ? data.stack_file_location : this.stack_file_location;
    this.status = data.status ? data.status : this.status;
    this.health = data.health ? data.health : this.health;
    this.created_by = data.created_by ? data.created_by : this.created_by;
    this.mount = data.mount ? data.mount : this.mount;
    this.terminated_on = data.terminated_on ? data.terminated_on : this.terminated_on;


    //decode stack data
    this.haystack_file = JSON.parse(base64.decode(this.haystack_file_encoded));
    this.build = JSON.parse(base64.decode(this.build_encoded));

    //services
    this.services = data.services ? data.services : this.services;

    if(data.services){
        this.services = data.services
    }
    else if(this.services == null){
        this.services = [];
        for( key in this.haystack_file.services)
        {
            this.services.push(new HaystackService(key));
        }
    }




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
        throw("Haystack '" + identifier + "' not found.");
    }

    return this;
}

Haystack.prototype.connect = function(){
    //get interface .
    if(this.mode == modes.local){
        this.interface = new LocalInterface(this);
    }
    else
    {
        throw ("Invalid mode '" + this.mode + "'");
    }
}




Haystack.prototype.start = function(){
    this.updateStatus(statuses.starting);
    this.interface.start();
}


Haystack.prototype.stop = function(){
    this.interface.stop();
}


Haystack.prototype.terminate = function(){
    this.status = Haystack.Statuses.terminating;
    this.interface.terminate();
    this.terminated_on = Date.now();
    this.save();
}


Haystack.prototype.delete = function(){
    db.stacks.remove({identifier : this.identifier}, true);
}


Haystack.prototype.getData = function(){

    //create a data object to be saved.
    var data = {
        identifier: this.identifier,
        services: this.services,
        haystack_file_encoded: this.haystack_file_encoded,    //todo: determine if this should this be reencoded incase there was a change
        build_encoded: this.build_encoded,         //todo: determine if this should this be reencoded incase there was a change
        mode: this.mode,
        provider: this.provider,
        stack_file_location: this.stack_file_location,
        status: this.status,
        health: this.health,
        do_mount: this.do_mount,
        terminated_on: this.terminated_on
    }

    return data;
}


Haystack.prototype.getStatusData = function(){

    //create a data object to be saved.
    var data = {
        identifier: this.identifier,
        services: this.services,
        status: this.status,
        health: this.health,
        terminated_on: this.terminated_on
    }

    return data;
}

Haystack.prototype.updateStatus = function(status){
    this.status = status;
    this.save();
}

Haystack.prototype.normalizeServices = function(services_to_merge){
    var self = this;


    //loop all the new_data services.
    services_to_merge.forEach(function (s) {

        //find in the current services by name
        var service = self.findService(s.name);

        service.status = s.status;
        service.exists = s.exists;
        service.is_running = s.is_running;
        service.is_healthy = s.is_healthy;


        //once the services is healthy one time.. then provisioned flag is set.
        if(service.is_running && service.is_healthy)
        {
            service.is_provisioned = true;
        }

    });


    //console.log(this.services);

}


Haystack.prototype.normalizeStatus = function(){
    /*
    pending: "pending",
    starting: "starting",
    provisioning: "provisioning",
    running: "running",
    stopping: "stopping",
    stopped: "stopped",
    impared: "impared",
    terminating: "terminating",
    terminated: "terminated"
     */



    /*
    pending:
    all services are pending status.
     */

    /*
    starting
    Note: triggered by event.
     */

    /*
    provisioning:
    status == starting +
    one or more services in provisioning status
     */
    if(this.status == Haystack.Statuses.starting){
        if (this.services.filter(function(s) { return s.status === HaystackService.Statuses.provisioning; }).length > 0) {
            this.status = Haystack.Statuses.provisioning;
        }
    }

    /*
    running:
    status == starting || provisioning +
    all services are in running state.
     */

    /*
    stopping
    Note: triggered by event
     */

    /*
    stopped:
    status == stopping
    all services are stopped
     */

    /*
    impared
    todo: figure out an impared stack. timeout? in provissioning too long? one stack
     */

    /*
    terminating
    Note: triggered by event
     */

    /*
    terminated
    status == terminating
    all services are terminated.
     */
    if(this.status == Haystack.Statuses.terminating){
        if (this.services.filter(function(s) { return s.status === HaystackService.Statuses.terminated; }).length > 0) {
            this.status = Haystack.Statuses.terminated;
        }
    }


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
    EventBus2.emit('haystack-change',  this.getStatusData());





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



Haystack.FindAndUpdate = function(identifier, data){

    try
    {
        var haystack = new Haystack().load(identifier);
        //update the stack services correctly.
        haystack.normalizeServices(data.services);
        haystack.normalizeStatus();


        //save the data
        haystack.save();


        //todo: handle no stat_data
    }
    catch (ex){
        //todo: log exception
    }




}

Haystack.Statuses = {
    pending: "pending",
    starting: "starting",
    provisioning: "provisioning",
    running: "running",
    stopping: "stopping",
    stopped: "stopped",
    impared: "impared",
    terminating: "terminating",
    terminated: "terminated"
}

module.exports = Haystack;