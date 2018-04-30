var DockerStack = require("./docker/docker-stack");
Haystack = require("../../model/haystack");
HaystackService = require("../../model/haystack-service");
var DockerStack = require("./../../interface/local/docker/docker-stack");
var DockerServiceError = require("./../../errors/docker-service-error");
var Logger = require("./../../lib/logger");


var LocalInterface = function(haystack){
    this.haystack = haystack;


}



LocalInterface.prototype.start = function(){
    var self = this;




    //download all docker images: todo:
    docker.importImage();

    //start all networks: todo:


    //start all services

    /*
    1. Docker: MySql

    2. Vagrant: App
    vagrant.importImage();

    3. LXD: Something strange

     */





    /*
    self.docker_stack.start().then(function () {
        self.sync();
    }).catch(function (error_obj) {
        //set the stack status to impaired
        self.haystack.status = Haystack.Statuses.impaired;

        //set the errored service to impaired.
        var service = self.haystack.findService(error_obj.service_name);
        service.error = new DockerServiceError( error_obj.err ).message;

        //sync.
        self.sync();

    });
    */


}


LocalInterface.prototype.stop = function(){
    this.docker_stack.stop().then(function () {
        self.sync();
    });

}


LocalInterface.prototype.terminate = function(){
    var self = this;

    //terminate the stack
    this.docker_stack.terminate().then(function () {
        //set all the services to terminating.
        self.haystack.services.forEach(function(service){
            service.error = null;
            service.status = HaystackService.Statuses.terminating;
        });

        self.sync();
    });
}


LocalInterface.prototype.sync = function(){
    var self = this;

    this.docker_stack.sync().then(function(data){
        var normalized_services = self.normalizeServices(data.services);
        self.haystack.normalizeServices(normalized_services);
        self.haystack.normalizeStatus();
        //save the stack;
        self.haystack.save();
    }).catch(function (err) {
        console.log("LocalInterface.prototype.sync", err);
        //todo: handle error
    });


}

LocalInterface.prototype.normalizeServices = function(docker_stack_services)
{
    var self = this;

    var services = [];

    docker_stack_services.forEach(function(docker_stack_service){
        //normalize status.

        //find the service.
        service = self.haystack.findService(docker_stack_service.name);

        service.container_status = docker_stack_service.status;


        console.log("service.sync", service.status, docker_stack_service.status);

        /*
        impared:
        service.error != null
         */
        if(service.error){
            service.status = HaystackService.Statuses.impaired;
        }

        /*
        terminated:
        status == dead or service.exists == false
         */
        else if(service.container_status == DockerStack.ContainerStatus.dead || service.container_status == DockerStack.ContainerStatus.exited || !service.exists ){
            console.log("i got here");
            service.status = HaystackService.Statuses.terminated;
        }

        /*
        pending:
        exists == false
        running == false
        provisioned == false
        healthy == false
         */
        else if(service.container_status != DockerStack.ContainerStatus.dead && !service.exists && !service.is_running && !service.is_provisioned && !service.is_healthy){
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


        services.push(service);



    });

    return services;


}




module.exports = LocalInterface;