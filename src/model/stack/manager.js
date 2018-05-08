
/*
Manages all of the stacks in memory.
 */
var Stack = require('./stack');
var base64 = require("base-64");
var fs  = require('fs-extra');
var path = require('path');
var moment = require('moment');
var homedir = require("homedir");
var Promise = require('bluebird');
var Logger = require("../../lib/logger");
var findup = require('findup-sync');


var StackManager = function(db) {
    this.db = db;
    this.stacks = []; //store a list of stacks that have been loaded into the application.
}


StackManager.prototype.load_from_path = function(stack_file_location, identifier, provider_id, mode){

    var data = {
        stack_file_location: stack_file_location,
        identifier: identifier,
        provider_id: provider_id,
        mode: mode
    }


    // /validate that the haystack file exists
    if(!StackManager.FindStackFilePath(data.stack_file_location)){
        throw new Error("Haystackfile does not exists at '" + data.stack_file_location + "'.");
    }
    else
    {
        data.stack_file_location = StackManager.FindStackFilePath(data.stack_file_location);
    }



    if(!data.identifier){
        //generate an identifier.
        data.identifier = StackManager.GenerateIdentifierFromPath(stack_file_location);
    }


    //check to see if this stack exists.
    var records = this.search({identifier: data.identifier});


    //remove and terminated cat be deleted.
    records.forEach( (stack_record) => {
        if(StackManager.CanRemove(stack_record)){
            this.remove(stack_record);
        }
    });

    //check again to see if we can proceed.
    var results = this.search({identifier: data.identifier});



    if(results.length > 0){
        throw new Error("Cannot create stack. There is already a stack with the id '" + data.identifier + "'.");
    }


    //check to see if there is a stack with the path provided.
    var results = this.search({stack_file_location: data.stack_file_location});
    if(results.length > 0){
        throw new Error("Cannot create stack. There is already a stack at path '" + data.stack_file_location + "'.");
    }


    //create the new stack
    var stack = new Stack(data);
    this.stacks.push(stack);


    return stack;

}

/* return a haystack from memory or from the db */
StackManager.prototype.load = function(identifier){

    var stack = null;

    if(!identifier){
        throw new Error("Haystack Identifier required.")
    }

    //look for the stack in memory first.
    this.stacks.forEach((h) => {
        console.log("checking for stack", identifier);
       if(h.identifier == identifier){
           console.log("found stack", h);
           stack = h;
       }
    });


    if(!stack)
    {
        //lets look for one in the db.
        console.log("trying to load from the db");
        var stack = this.load_from_db(identifier);
        if(stack){
            return stack;
        }
    }

    if(!stack)
    {
        //if I am here the haystack with the identifier could not be found.
        throw new Error("Haystack with identifier [" + identifier + "] could not be found.");
    }


    return stack;



}


StackManager.prototype.load_from_db = function(identifier){

    var stack = null;

    /* if an identifer is passed in, try load from the DB */
    try
    {
        if(identifier){
            var stack_record = this.db.stacks.findOne({identifier : identifier});

            //load this stack.
            var stack = new Stack(stack_record);
            return stack;

        }
        else
        {
            throw new Error("Haystack Identifier required.");
        }
    }
    catch (ex){
        throw(ex);
    }

    return stack;

}


StackManager.prototype.init = function(){

    //load stacks from db on startup.
    var stacks = this.search();

    stacks.forEach((stack_data) => {
        var stack = this.load(stack_data.identifier);
        this.stacks.push(stack);
    });


    console.log("Loaded stacks from db", this.stacks);
}



StackManager.prototype.search = function(query){
    //return all stacks
    return this.db.stacks.find(query);
}



/* clean up stacks that have been terminated more than x seconds */
StackManager.prototype.cleanUpTerminated = function(seconds){
    //find all the stacks.
    var records = this.db.stacks.find({status : Stack.Statuses.terminated});

    //loop all terminated and see if seconds has lapsed.
    records.forEach((stack_record) => {
        var a = new moment(stack_record.terminated_on);
        var b = new moment(Date.now());

        var laps = b.diff(a, 'seconds');

        //delete when enough seconds have gone by.
        if(laps >= seconds){
            this.remove(stack_record);
        }

    });
}


StackManager.prototype.remove = function(stack_record){
    this.db.stacks.remove({identifier : stack_record.identifier}, false);

    //remove it from the memory as well.
    this.stacks = this.stacks.filter(function( obj ) {
        return obj.identifier !== stack_record.identifier;
    });
}


StackManager.prototype.remove_all = function(){
    var stack_records = this.search();

    stack_records.forEach((stack_record) => {
        this.remove(stack_record);
    });

}



StackManager.FindStackFilePath = function(path_provided){

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


StackManager.GenerateIdentifierFromPath = function(path_provided){

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


StackManager.CanRemove = function(stack_record){
    if(stack_record.status == Stack.Statuses.terminated || stack_record.status == Stack.Statuses.impaired){
        return true;
    }

    return false;


}


module.exports = StackManager;
