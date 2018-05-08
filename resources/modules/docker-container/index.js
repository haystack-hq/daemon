'use strict';

/**
 * @file
 * Docker module interface
 *
 * A module that provides the interface methods to support docker.
 */

var Interface = function(args) {
    this.config = args.config;
    this.network = args.network;
    this.logger = args.haystack.logger;
    this.shell = args.haystack.shell;
}

Interface.prototype.validate = function(done, err){

}

Interface.prototype.start = function(done, err){
    this.logger.log("info", "module-started",  {config:  this.config });


    done();
}

Interface.prototype.stop = function(done, err){

}

Interface.prototype.inspect = function(done, err){

}

Interface.prototype.terminate = function(done, err){

}

Interface.prototype.healthcheck = function(done, err){

}

Interface.prototype.ssh = function(done, err){

}


module.exports = Interface;