
var db = require('./../db/db-conn');
var LocalInterface = require('./../interface/local/local-interface');
var HaystackService = require('./haystack-service');
var base64 = require("base-64");
var findParentDir = require('find-parent-dir');
var fs  = require('fs-extra');
var path = require('path');






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
    this.interface = null;
    this.created_by = null;
    this.do_mount = false;
    this.haystack_file = null;
    this.build = null;
    this.terminated_on = null;

    /* get / find the stack file based on the path provided. */
    if(data && data.stack_file_location && this.mode == Haystack.Mode.local){
        this.stack_file_location = data.stack_file_location;

        this.setHaystackFilePath();

        console.log("this.stack_file_location", this.stack_file_location);

        //get the contents from the path
        data.haystack_file = require(this.stack_file_location);

        console.log("this.haystack_file", this.haystack_file);
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
    this.do_mount = data.do_mount ? data.do_mount : this.do_mount;
    this.terminated_on = data.terminated_on ? data.terminated_on : this.terminated_on;
    this.haystack_file = data.haystack_file ? data.haystack_file : null;

    //services
    this.services = data.services ? data.services : this.services;

    if(data.services){
        this.services = data.services
    }
    else if(this.services == null && this.haystack_file){
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
};

Haystack.prototype.connect = function(){

    //get interface .
    if(this.mode == Haystack.Mode.local){
        this.interface = new LocalInterface(this);
    }
    else
    {
        throw ("Invalid mode '" + this.mode + "'");
    }
};


Haystack.findHaystackfileFromPath = function(path){

}

Haystack.prototype.disconnect = function(){

    if(this.interface){

    }
    this.interface = null;
};



Haystack.prototype.start = function(){
    this.updateStatus(Haystack.Statuses.starting);
    this.interface.start();
}


Haystack.prototype.stop = function(){
    this.interface.stop();
}


Haystack.prototype.terminate = function(){

    console.log("this.status", this.status);

    var bypass = true;

    //validate we are in a status that can be terminated.
    if(bypass == true || this.status == Haystack.Statuses.provisioning || this.status == Haystack.Statuses.running || this.status == Haystack.Statuses.impaired || this.status == Haystack.Statuses.stopped)
    {
        this.status = Haystack.Statuses.terminating;
        this.terminated_on = Date.now();
        this.save();

        this.interface.terminate();

    }
    else {
        throw ("Can not terminate when in status '" + this.status + "'");
    }



}


Haystack.prototype.delete = function(){
    db.stacks.remove({identifier : this.identifier}, true);
}


Haystack.prototype.getData = function(){

    //create a data object to be saved.
    var data = {
        _id: this._id,
        identifier: this.identifier,
        services: this.services,
        mode: this.mode,
        provider: this.provider,
        stack_file_location: this.stack_file_location,
        status: this.status,
        health: this.health,
        created_by: this.created_by,
        do_mount: this.do_mount,
        terminated_on: this.terminated_on,
        haystack_file: this.haystack_file,
        build: this.build
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
    impaired: "impaired",
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
    impaired
    todo: figure out an impaired stack. timeout? in provissioning too long? one stack
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
            this.interface = null;
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

Haystack.prototype.sync = function(){

    this.connect();
    this.interface.sync();
    this.disconnect();

}

Haystack.prototype.setHaystackFilePath = function(){
    var haystackfilePath = null;

    var pathProvided = this.stack_file_location;

    //get the directory of the file passed in.
    var dir = path.dirname(pathProvided);

    console.log("DIR", pathProvided, dir);


    //traverse up until a haystack file is found.
    //look for yaml.
    var parent = findParentDir.sync(dir, 'Haystackfile.yml');
    haystackfilePath = parent + "/" + 'Haystackfile.yml';

    //look for JSON
    if(parent == null)
    {
        var parent = findParentDir.sync(dir, 'Haystackfile.json');
        haystackfilePath = parent + "/" + 'Haystackfile.json';
    }

    if(parent == null){
        this.haystack_file_error = "File not found ";
    }


    this.stack_file_location = haystackfilePath;

    console.log("DIR", pathProvided, dir, parent, haystackfilePath);

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


    console.log('haystack-update', this.getStatusData());

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





Haystack.Statuses = {
    pending: "pending",
    starting: "starting",
    provisioning: "provisioning",
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