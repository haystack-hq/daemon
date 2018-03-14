var EventBus = require('eventbusjs');
var DockerStack = require("./docker/docker-stack");
var EventBus2 = require('node-singleton-event');
Haystack = require("../../model/haystack");
HaystackService = require("../../model/haystack-service");


var LocalInterface = function(haystack){
    this.haystack = haystack;
    this.docker_stack = new DockerStack(this.haystack.identifier, this.haystack.build, this.haystack.status);


    EventBus2.on('docker-stack-change', function(data) {
        LocalInterface.OnChange(data);
    });

}


LocalInterface.prototype.start = function(){
    var self = this;
    self.docker_stack.start();

}



LocalInterface.prototype.stop = function(){
    this.docker_stack.stop();
}

LocalInterface.prototype.terminate = function(){
    this.docker_stack.terminate();
}


LocalInterface.normalizeServices = function(data)
{

    data.services.forEach(function(service){
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

    return data;


}

LocalInterface.OnChange = function(data){

    data = LocalInterface.normalizeServices(data);
    Haystack.FindAndUpdate(data.identifier, data);

}




module.exports = LocalInterface;