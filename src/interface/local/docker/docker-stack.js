var Docker = require("../../../lib/docker-api");
var Promise = require('bluebird');


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
    this.docker = new Docker();
    this.identifier = identifier;
    this.build = build;
    this.containers = this.build.objects.containers;
    this.status = status;
    this.error = null;

}



DockerStack.prototype.sync = function(){
    var self = this;

    return new Promise(function(resolve, reject) {

        //sync container status
        Promise.mapSeries(self.containers, function(container){
            var container_name = self.identifier + "_" + container.name;
            return DockerStack.GetContainerData(container_name, container.name);
        }).then(function(res) {

            var services = [];
            res.forEach(function(container){

                services.push({
                    name:  container.name,
                    container_name: container.container_name,
                    status: container.status,
                    exists:  container.exists,
                    is_running:  container.is_running,
                    is_healthy: container.is_healthy

                });
            });


            resolve({
                services: services
            });

        }).catch(function (err) {
            console.log(err);
            reject(err);
        });


    });

}

DockerStack.prototype.start = function () {
    var self = this;


    return new Promise(function(resolve, reject) {
        self.createContainers().then(function () {
            return self.startContainers();
        }).then(function(){
            resolve(true);
        }).catch(function (err) {
            reject(err);
        });

    });




        /*
        var pCreate = self.createContainers();
        var pStart = self.startContainers();


        Promise.mapSeries([pCreate, pStart], function(result) {
            resolve(true);
        });
        */

        /*
        Promise.mapSeries([pCreate, pStart]).then(function(results) {
            resolve(true);
        }).catch(function (err) {
            reject(err);
        });
        */




}


DockerStack.prototype.terminate = function () {
    var self = this;

    return new Promise(function(resolve, reject) {

        //remove all of the containers. todo: decide if we should remove or latch onto
        self.removeContainers().then(function(){
            resolve(true);
        }).catch(function (err) {
            console.log("problem terminating", err);
            reject(err);
        });

    });
}


DockerStack.prototype.createContainers = function () {
    var self = this;

    return new Promise(function(resolve, reject) {
        Promise.mapSeries(self.containers, function (container) {
            var container_name = self.identifier + "_" + container.name;
            return DockerStack.CreateContainer(self.identifier, container_name, container)
        }).then(function (res) {
            resolve(true);
        }).catch(function (err) {
            console.log(err);
            reject(err);
        });
    });
    /*
    console.log("creating containers.");

    return new Promise(function(resolve, reject) {
        //start all of the containers
        var promises = [];

        self.containers.forEach(function(container){
            var container_name = self.identifier + "_" + container.name
            promises.push(DockerStack.CreateContainer(self.identifier, container_name, container));
        });


        Promise.mapSeries(promises, function(result) {
            resolve(true);
        });


        Promise.mapSeries(promises).then(function(res) {
            console.log("creating containers done.");
            resolve(true);
        }).catch(function (err) {
            console.log("creating containers err.", err);
            reject(err);
        })


    });
    */

}



DockerStack.prototype.startContainers = function () {
    var self = this;

    return new Promise(function(resolve, reject) {
        Promise.mapSeries(self.containers, function(container){
            var container_name = self.identifier + "_" + container.name;
            return DockerStack.StartContainer(container_name)
        }).then(function(res) {
            resolve(true);
        }).catch(function (err) {
            console.log(err);
            reject(err);
        });
    });




    /*

    console.log("starting containers done.");

    return new Promise(function(resolve, reject) {
        //start all of the containers
        var promises = [];

        self.containers.forEach(function(container){
            var container_name = self.identifier + "_" + container.name
            promises.push(DockerStack.StartContainer(container_name));
        });


        Promise.mapSeries(promises, function(result) {
            resolve(true);
        }).then(function(){
            console.log("XXXXXXXXXXXX");
        });


        Promise.mapSeries(promises).then(function(res) {
            console.log("starting containers done.");
            resolve(true);
        }).catch(function (err) {
            console.log("starting containers err.", err);
            reject(err);
        })


    });
    */

}




DockerStack.prototype.removeContainers = function () {
    var self = this;
    return new Promise(function(resolve, reject) {

        //remove all of the containers
        Promise.mapSeries(self.containers, function(container){
            var container_name = self.identifier + "_" + container.name;
            return DockerStack.RemoveContainer(container_name)
        }).then(function(res) {
            resolve(true);
        }).catch(function (err) {
            reject(err);
        });



    });

}




DockerStack.CreateContainer = function (identifier, container_name, container) {
    var docker = new Docker();


    //add the label
    container.labels = {
        "com.haystack.identifier": identifier
    }

    return new Promise(function(resolve, reject) {
        //stop  & remove container
        docker.createContainer(identifier, container_name, container).then(function(container_data){
            resolve(container_data);

        }).catch(function (err) {
            reject(err);
        });

    });

}



DockerStack.StartContainer = function (container_name) {
    var docker = new Docker();

    return new Promise(function(resolve, reject) {
        //stop  & remove container
        docker.startContainer(container_name).then(function(container_data){
            resolve(container_data);

        }).catch(function (err) {
            reject(err);
        });

    });

}


DockerStack.RemoveContainer = function (container_name) {
    var docker = new Docker();

    return new Promise(function(resolve, reject) {

        docker.stopContainer(container_name).then(function () {
            return docker.removeContainer(container_name);
        }).then(function(){

            resolve(true);
        }).catch(function (err) {
            if(err.message.includes('No such container')){
                resolve(true);
            }
            reject(err);
        });

    });



}



DockerStack.GetContainerData = function(container_name, service_name){
    var docker = new Docker();

    return new Promise(function(resolve, reject) {

        var data = {
            name: service_name,
            container_name: container_name,
            status: DockerStack.ContainerStatus.exited,
            is_running: false,
            exists: false,
            is_healthy: false
        }

        //inspect container
        docker.getContainer(container_name).then(function (container) {

            data.status = DockerStack.NormalizeDockerContainerStatus( container.State.Status );
            data.is_running = container.State.Running;
            data.exists = true;
            resolve(data);

        }).catch(function (err) {

            if(err.message.includes('No such container')){
                resolve(data);
            }

            resolve(data);

        });

    });


}



DockerStack.NormalizeDockerContainerStatus = function(status)
{
    var new_status = status;
    if(status === DockerStack.ContainerStatus.restarting || status === DockerStack.ContainerStatus.running){
        new_status = DockerStack.ContainerStatus.running;
    }

    if(status === DockerStack.ContainerStatus.exited || status === DockerStack.ContainerStatus.dead){
        new_status = DockerStack.ContainerStatus.dead;
    }

    return new_status;
}


DockerStack.ContainerStatus = {
    created: "created",
    restarting: "restarting",
    running: "running",
    removing: "removing",
    paused: "paused",
    exited: "exited",
    dead: "dead"
}


module.exports = DockerStack;