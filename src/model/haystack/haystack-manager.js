
/*
Manages all of the haystacks in memory.
 */
var Haystack = require('./haystack');
var base64 = require("base-64");
var fs  = require('fs-extra');
var path = require('path');
var moment = require('moment');
var homedir = require("homedir");
var Promise = require('bluebird');
var Logger = require("../../lib/logger");
var findup = require('findup-sync');


var HaystackManager = function(db) {


    this.db = db;
    this.haystacks = []; //store a list of stacks that have been loaded into the application.
}


HaystackManager.prototype.create_from_path = function(path, params){

    // /validate that the haystack file exists
    if(!HaystackManager.FindHaystackFilePath(params.stack_file_location)){
        throw ("Haystackfile does not exists at '" + path + "'.");
    }
    else
    {
        params.stack_file_location = HaystackManager.FindHaystackFilePath(params.stack_file_location);
    }

    if(!params.identifier){
        //generate an identifier.
        params.identifier = HaystackManager.GenerateIdentifierFromPath(path);
    }


    //check to see if this stack exists.
    var records = this.search({identifier: params.identifier});


    //remove and terminated cat be deleted.
    records.forEach( (haystack_record) => {
        if(HaystackManager.CanRemove(haystack_record)){
            this.remove(haystack_record);
        }
    });

    //check again to see if we can proceed.
    var results = this.search({identifier: params.identifier});



    if(results.length > 0){
        throw ("Cannot create stack. There is already a stack with the id '" + params.identifier + "'.");
    }


    //check to see if there is a stack with the path provided.
    var results = this.search({stack_file_location: params.stack_file_location});
    if(results.length > 0){
        throw ("Cannot create stack. There is already a stack at path '" + params.stack_file_location + "'.");
    }


    //create the new stack
    var haystack = new Haystack(params);
    haystack.save();

    this.haystacks.push(haystack);

    return haystack;

}

/* return a haystack from memory or from the db */
HaystackManager.prototype.load = function(identifier){

    var haystack = null;

    if(!identifier){
        throw("Haystack Identifier required.")
    }

    //look for the stack in memory first.
    this.haystacks.forEach((h) => {
        console.log("checking for stack", identifier);
       if(h.identifier == identifier){
           console.log("found stack", h);
           haystack = h;
       }
    });


    if(!haystack)
    {
        //lets look for one in the db.
        console.log("trying to load from the db");
        var haystack = this.load_from_db(identifier);
        if(haystack){
            return haystack;
        }
    }

    if(!haystack)
    {
        //if I am here the haystack with the identifier could not be found.
        throw("Haystack with identifier [" + identifier + "] could not be found.");
    }


    return haystack;



}


HaystackManager.prototype.load_from_db = function(identifier){

    var haystack = null;

    /* if an identifer is passed in, try load from the DB */
    try
    {
        if(identifier){
            var haystack_record = this.db.stacks.findOne({identifier : identifier});

            //load this haystack.
            var haystack = new Haystack(haystack_record);
            return haystack;

        }
        else
        {
            throw("Haystack Identifier required.");
        }
    }
    catch (ex){
        throw(ex);
    }

    return haystack;

}


HaystackManager.prototype.init = function(){

    //load stacks from db on startup.
    var haystacks = this.search();

    haystacks.forEach((haystack_data) => {
        var haystack = this.load(haystack_data.identifier);
        this.haystacks.push(haystack);
    });


    console.log("Loaded haystacks from db", this.haystacks);
}



HaystackManager.prototype.search = function(query){
    //return all stacks
    return this.db.stacks.find(query);
}



/* clean up stacks that have been terminated more than x seconds */
HaystackManager.prototype.cleanUpTerminated = function(seconds){
    //find all the stacks.
    var records = this.db.stacks.find({status : Haystack.Statuses.terminated});

    //loop all terminated and see if seconds has lapsed.
    records.forEach((haystack_record) => {
        var a = new moment(haystack_record.terminated_on);
        var b = new moment(Date.now());

        var laps = b.diff(a, 'seconds');

        //delete when enough seconds have gone by.
        if(laps >= seconds){
            this.remove(haystack_record);
        }

    });
}


HaystackManager.prototype.remove = function(haystack_record){
    this.db.stacks.remove({identifier : haystack_record.identifier}, false);

    //remove it from the memory as well.
    this.haystacks = this.haystacks.filter(function( obj ) {
        return obj.identifier !== haystack_record.identifier;
    });
}


HaystackManager.prototype.remove_all = function(){
    var haystack_records = this.search();

    haystack_records.forEach((haystack_record) => {
        this.remove(haystack_record);
    });

}



HaystackManager.FindHaystackFilePath = function(path_provided){

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


HaystackManager.GenerateIdentifierFromPath = function(path_provided){

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


HaystackManager.CanRemove = function(haystack_record){
    if(haystack_record.status == Haystack.Statuses.terminated || haystack_record.status == Haystack.Statuses.impaired){
        return true;
    }

    return false;


}


module.exports = HaystackManager;
