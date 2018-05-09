

var Provider = function(args){
    this.stack = args.stack;
    this.shell = args.haystack.shell;
    this.logger = args.haystack.logger;
    this.helper = args.haystack.helper;

}


Provider.prototype.start = function(done, err){
    var result = this._validate();
    if( result != true){
        err(result);
    }

    //create a network for the stack.
    var create_result = this.shell.exec('docker network create ' + this.stack.network.name, {silent:true});
    if(create_result.code !== 0){
        err("Unable to create the local docker network for stack [" + this.stack.identifier + "]. " + create_result.stderr);
        //todo: log error.
    }


    done();
}


Provider.prototype.terminate = function(done, err){
    var result = this._validate();
    if( result != true){
        err(result);
    }



    /* remove the network */
    var command = 'docker network rm ' + this.stack.network.name;
    this.shell.exec(command, {silent:true});


    /* check to see if the network exists */
    var output = this.shell.exec("docker network inspect " + this.stack.identifier + " --format '{{.Name}}'", {silent:true});
    if(output.code === 0){
        err("There was an issue terminating the docker network for [" + this.stack.identifier + "].  Please terminate manually from the cmd prompt. $" + command + "");
    }


    done();
}



Provider.prototype._validate = function(){
    var min_version = "1.13.0";


    if(this.shell.exec('docker -v', {silent:true}).code !== 0){
        return "Docker does not appear to be installed. Please install.";
    }

    if(this.shell.exec('docker ps', {silent:true}).code !== 0){
        return "Docker does not appear to be running. Please restart.";
    }

    var version = this.shell.exec("docker version --format '{{.Server.Version}}'", {silent:true}).stdout;
    var ok = this.helper.CompareVersions(version.trim(), min_version, {lexicographical: true , zeroExtend: true});
    if(ok !== 1)
    {
        return "The minimum version of docker is [" + min_version + "]. Your version is [" + version + "]. Please upgrade."
    }


    return true;

}




module.exports = Provider;