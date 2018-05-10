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

    this.logger.log("info", "module-started",  {module: "docker-container", service: this.service });

    //pull the image.
    var pull_command = "docker pull " + config.image;
    this.logger.log("info", "pulling-docker-image",    pull_command );
    var pull_result = this.shell.exec(pull_command, {silent:true});
    if(pull_result.code !== 0) {
        err("Unable to pull the docker image [" + config.image + "].");
        return;
    }
    else
    {
        this.logger.log("info", "pulling-docker-image-complete",   pull_result.stdout );
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

    //make a volume
    var project_src =  this.service.data.path_to_src ;
    var volume = "";
    if(project_src != null)
    {
        volume = " -v " + project_src + ":/www ";
    }


    //run the container.
    this.logger.log("info", "running-docker-container",   run_command );
    var run_command = "docker run -d " + cmd_args_ports + " " + volume + " --net " + this.network.name + " --name  " + this.container_name + " " + config.image + "  ";
    var run_result = this.shell.exec(run_command, {silent:true});
    if(run_result.code !== 0) {
        err("Unable to start the docker container  [" + this.container_name + "]. " + run_result.stderr);
        return;
    }
    else
    {
        this.logger.log("info", "running-docker-container-complete", run_result.stdout );
    }



    done();
}

Interface.prototype.stop = function(done, err){

}

Interface.prototype.inspect = function(done, err){


    var inspect_command = "docker inspect " + this.container_name;
    var inspect_result = this.shell.exec(inspect_command, {silent:true});

    if(inspect_result.code === 0 )
    {
        var inspect = JSON.parse(inspect_result.stdout);
        done(inspect[0]);
    }
    else
    {
        err(inspect_result.stderr);
    }

}

Interface.prototype.terminate = function(done, err){

    /* stop and remove the container. */
    var stop_command = "docker stop " + this.container_name;
    var stop_result = this.shell.exec(stop_command, {silent:true});


    var rm_command = "docker rm " + this.container_name;
    var rm_result = this.shell.exec(rm_command, {silent:true});


    //validate that the container is removed. Expect an error.
    var check_command = "docker inspect" + this.container_name;
    var check_result = this.shell.exec(check_command, {silent:true});
    if(check_result.code === 0 )
    {
        err("Unable to terminate the docker container  [" + this.container_name + "]. " + run_result.stderr);
        return;
    }



    done();

}

Interface.prototype.healthcheck = function(done, err){

    //validate that the container is running
    var check_command = "docker inspect " + this.container_name;
    var check_result = this.shell.exec(check_command, {silent:true});

    if(check_result.code !== 0 )
    {
        err("Docker Container does not exist. " + check_result.stderr);
        return;
    }

    //can inspect, parse result
    var inspect = JSON.parse(check_result.stdout);
    var state = inspect[0].State;
    if(state.Running == false){
        err("Docker Container is not running. Docker container status [" + state.Status + "].");
        return;
    }

    done();
}

Interface.prototype.ssh = function(done, err){


}


module.exports = Interface;