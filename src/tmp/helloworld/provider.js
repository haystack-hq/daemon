


var Provider = function(service, haystack){
    //console.log("service + haystack", service, haystack);
    this.port = service.params.http_port;
    this.id = service.id;
    this.shell = haystack.shell;
    this.logger = haystack.logger;

    this.service = service;

}

/* required implemented methods */
Provider.prototype.start = function(done, err){

    try{

        this.logger.log("info", "starting docker container tutum/hello-world");


        //run docker pull
        this.logger.log("info", "pulling image tutum/hello-world");
        var result = this.shell.exec("docker pull tutum/hello-world");
        if(result.code !== 0){
            throw new Error(result.stderr)
        }


        //run docker run
        this.logger.log("info", "running tutum/hello-world container", {port: this.port});
        var result = this.shell.exec("docker run -d -p " + this.port + ":80 --name=" + this.id + " tutum/hello-world");
        if(result.code !== 0){
            throw new Error(result.stderr);
        }



        done();
    }
    catch(ex){
        err(ex);
    }


}


Provider.prototype.stop = function(done, err){
    done(true);
}

Provider.prototype.terminate = function(done, err){


    try{
        //stop docker container
        this.logger.log("info", "terminating docker containers");

        //check does this container exist?
        var result = this.shell.exec("docker inspect " + this.id + "");
        if(result.code !== 0){
            //lets assume that the container has been removed.
            done();
        }


        //stop contianer
        this.logger.log("info", "running docker stop", {id: this.id});
        var result = this.shell.exec("docker stop " + this.id + "");
        if(result.code !== 0){
            throw new Error(result.stderr);
        }


        //remove docker container
        this.logger.log("info", "running docker rm", {id: this.id});
        var result = this.shell.exec("docker rm " + this.id + "");
        if(result.code !== 0){
            throw new Error(result.stderr);
        }

        done();
    }
    catch(ex){
        err(ex);
    }




}

Provider.prototype.heartbeat = function(done, err){

    //ping the container.
    


    console.log("pulse");
    done();
}

Provider.prototype.inspect = function(done, err){

    done({
        key: "value"
    });
}

/* optionally implemented interface methods
Provider.prototype.stop = function(done, err){
    done(true);
}

Provider.prototype.ssh = function(done, err){
    done(true);
}
 */

module.exports = Provider;


