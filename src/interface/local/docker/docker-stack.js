var EventBus = require('eventbusjs');
var DockerStackContainer = require('./docker-stack-container');
var EventBus2 = require('node-singleton-event');



var statuses = {
    pending: "pending",
    starting: "starting",
    running: "running",
    stopping: "stopping",
    stopped: "stopped",
    terminating: "terminating",
    terminated: "terminated"
}



var DockerStack = function(identifier, build, status){
    var self = this;

    this.identifier = identifier;
    this.build = build;
    this.containers = [];
    this.status = status;
    this.error = null;


    //create or latch to an the containers for this build
    this.build.objects.containers.forEach(function (container_data) {
        var container = new DockerStackContainer(self, container_data);
        self.containers.push(container);
    });


    //subscribe to events
    EventBus2.on('docker-stack-service-change-' + this.identifier, function(data) {
        self.sync();
    });

    this.sync();

}

DockerStack.prototype.start = function(){
    var self = this;

    this.status = statuses.starting;
    this.sync();

    this.containers.forEach(function(docker_stack_container){
        docker_stack_container.start();
    });

    this.status = statuses.running;
    this.sync();


}


DockerStack.prototype.stop = function(){
    var self = this;

    this.status = statuses.stopping;
    this.sync();

    this.containers.forEach(function(docker_stack_container){
        docker_stack_container.stop();
    });

    this.status = statuses.stopped;
    this.sync();

}


DockerStack.prototype.terminate = function(){
    var self = this;

    this.status = statuses.terminating;
    this.sync();

    this.containers.forEach(function(docker_stack_container){
        docker_stack_container.stop();
        docker_stack_container.terminate();

    });

    this.status = statuses.terminated;
    this.sync();


}




DockerStack.prototype.sync = function(){

    var services = [];

    //loop containers
    this.containers.forEach(function(docker_stack_container){
        services.push({
            name:  docker_stack_container.name,
            status: docker_stack_container.status,
            exists:  docker_stack_container.exists,
            is_running:  docker_stack_container.is_running,
            is_healthy: docker_stack_container.is_healthy

        });

    });


    //todo: check for docker container errors


    EventBus2.emit('docker-stack-change',  {
        identifier: this.identifier,
        status: this.status,
        error: this.error,
        services: services
    });
}

module.exports = DockerStack;