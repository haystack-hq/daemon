'use strict';

/**
 * @file
 * Docker module interface
 *
 * A module that provides the interface methods to support docker.
 */

var Interface = function(args) {
    this.service = args.service;
    this.network = args.stack.network;
    this.logger = args.haystack.logger;
    this.shell = args.haystack.shell;


    this.container_name = "haystack-" + args.stack.identifier + "-" + this.service.id;
}

Interface.prototype.validate = function(done, err){

}

Interface.prototype.start = function(done, err){
    var config = this.service.config;

    this.logger.log("info", "module-started",  {module: "docker-container", service:  this.service });

    //pull the image.
    var pull_command = "docker pull " + config.image;
    this.logger.log("info", "pulling-docker-image",  {command:  pull_command });
    var pull_result = this.shell.exec(pull_command, {silent:true});
    if(pull_result.code !== 0) {
        err("Unable to pull the docker image [" + config.image + "].");
    }

    //get the ports.
    var cmd_args_ports = "";
    if(config.ports.length > 0){
        config.ports.forEach((port_pair) => {
            var host_port = Object.keys(port_pair)[0];
            var container_port = port_pair[host_port];
            cmd_args_ports += " -p " + host_port + ":" + container_port;
        });
    }

    //run the container.
    var run_command = "docker run -d " + cmd_args_ports + " --net " + this.network.name + " --name  " + this.container_name + " " + config.image + "  ";
    var run_result = this.shell.exec(run_command, {silent:true});
    if(run_result.code !== 0) {
        err("Unable to start the docker container  [" + this.container_name + "]. " + run_result.stderr);
    }

    this.logger.log("info", "running-docker-container",  {command:  run_command });

    done();
}

Interface.prototype.stop = function(done, err){

}

Interface.prototype.inspect = function(done, err){

}

Interface.prototype.terminate = function(done, err){

    /* stop and remove the container. */
    var stop_command = "docker stop " + this.container_name;
    var stop_result = this.shell.exec(stop_command, {silent:true});


    var rm_command = "docker rm " + this.container_name;
    var rm_result = this.shell.exec(rm_command, {silent:true});


    //validate that the container is removed. Expect an error.
    var check_command = "docker inspect " + this.container_name;
    var check_result = this.shell.exec(check_command, {silent:true});
    if(check_result.code === 0 )
    {
        err("Unable to terminate the docker container  [" + this.container_name + "]. " + run_result.stderr);
    }

    done();

}

Interface.prototype.healthcheck = function(done, err){

}

Interface.prototype.ssh = function(done, err){

}


module.exports = Interface;