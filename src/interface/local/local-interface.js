var DockerStack = require("./docker/docker-stack");
Haystack = require("../../model/haystack");
HaystackService = require("../../model/haystack-service");
var Build = require("./../../lib/build/local-build");


var LocalInterface = function(haystack){
    this.haystack = haystack;

    //create the build.
    if(this.haystack.build == null){
        this.compileBuild();
    }


    this.docker_stack = new DockerStack(this.haystack.identifier, this.haystack.build, this.haystack.status);
}

LocalInterface.prototype.compileBuild = function(){
    var build = new Build(this.haystack.identifier, this.haystack.haystack_file);
    this.haystack.build = build.build();
}



LocalInterface.prototype.start = function(){
    var self = this;

    //recompile build
    this.compileBuild();

    self.docker_stack.start().then(function () {
        self.sync();
    });
}


LocalInterface.prototype.stop = function(){
    this.docker_stack.stop().then(function () {
        self.sync();
    });

}


LocalInterface.prototype.terminate = function(){
    var self = this;
    this.docker_stack.terminate().then(function () {
        self.sync();
    });
}


LocalInterface.prototype.sync = function(){
    var self = this;

    this.docker_stack.sync().then(function(data){
        var normalized_services = LocalInterface.normalizeServices(data.services);
        self.haystack.normalizeServices(normalized_services);
        self.haystack.normalizeStatus();
        //save the stack;
        self.haystack.save();
    }).catch(function (err) {
        console.log("LocalInterface.prototype.sync", err);
        //todo: handle error
    });


}

LocalInterface.normalizeServices = function(services)
{

    services.forEach(function(service){
        //normalize status.

        service.container_status = service.status;


        /*
        terminated:
        status == dead or service.exists == false
         */
        if(service.status == HaystackService.Statuses.dead || !service.exists){
            service.status = HaystackService.Statuses.terminated;
        }

        /*
        pending:
        exists == false
        running == false
        provisioned == false
        healthy == false
         */
        else if(service.status != HaystackService.Statuses.dead && !service.exists && !service.is_running && !service.is_provisioned && !service.is_healthy){
            service.status = HaystackService.Statuses.pending;
        }



        /*
        provisioning:
        exists == true
        running == true
        provisioned == false
        healthy == false
         */
        else if(service.exists && service.is_running && !service.is_provisioned && !service.is_healthy){
            service.status = HaystackService.Statuses.provisioning;
        }


        /*
        running, healthy:
        exists == true
        running == true
        provisioned == true
        healthy == true
         */
        else if(service.exists && service.is_running && service.is_provisioned && service.is_healthy){
            service.status = HaystackService.Statuses.running;
        }


        /*
        running, unhealthy:
        exists == true
        running == true
        provisioned == false
        healthy == false
         */
        else if(service.exists && service.is_running && !service.is_provisioned && !service.is_healthy){
            service.status = HaystackService.Statuses.running;
        }


        /*
        stopped:
        exists == true
        running == false
        provisioned == true
        healthy == false
         */
        else if(service.exists && !service.is_running && service.is_provisioned && !service.is_healthy){
            service.status = HaystackService.Statuses.stopped;
        }



        /*
        terminating:
        status == removing
         */
        else if(service.status == "removing"){
            service.status = HaystackService.Statuses.terminating;
        }




    });

    return services;


}




module.exports = LocalInterface;