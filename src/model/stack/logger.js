'use strict';
var homedir = require("homedir");
var path = require('path');
var fs  = require('fs-extra');
var moment = require("moment");
var os = require("os");


var StackLogger = function(stack_identifier, service_name){
    this.stack_identifier = stack_identifier;
    this.service_name = service_name;


    console.log("this.stack_identifier", this.stack_identifier);
    //define the service file log location.

    var log_dir = path.join( homedir(), ".haystack" , "logs", this.stack_identifier);
    fs.ensureDirSync(log_dir);
    this.log_path = path.join(log_dir, this.stack_identifier + ".log");

}

StackLogger.prototype.timestamp = function(){
    return moment().format();
}


/* appends the stack identifier to the message */
StackLogger.prototype.log = function(level, msg, meta){
    var entry = {
        timestamp: this.timestamp(),
        stack_identifier: this.stack_identifier,
        level: level,
        message: msg,
        meta: meta
    }

    //if service name is defined, add it to the log entry
    if(this.service_name){
        entry.service = this.service_name
    }

    fs.appendFileSync(this.log_path, JSON.stringify(entry) + os.EOL);
}


StackLogger.prototype.error = function(msg, meta){
    this.log("error", msg, meta);
}



module.exports = StackLogger;