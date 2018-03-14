var EventBus = require('eventbusjs');
var Docker = require('dockerode');
var DockerEvents = require('docker-events');


var docker_statuses = {
    created: "created",
    restarting: "restarting",
    running: "running",
    removing: "removing",
    paused: "paused",
    exited: "exited",
    dead: "dead"
}


var DockerStackContainer = function(docker_stack, params){
    this.docker_stack = docker_stack;
    this.docker_stack_identifier = docker_stack.identifier;
    this.name = params.name;
    this.container_name = this.docker_stack_identifier + "_" + params.name;

    this.params = params;
    this.container = null;
    this.listener = null;

    this.status = null;
    this.exists = false;
    this.is_running = false;
    this.is_healthy = false;


    //find a container with this label, or create a new container.
    this.container = DockerStackContainer.FindOrCreate(this.container_name, this.params);

    //sync
    this.sync();


    //subscribe to docker container events.
    this.subscribe();

}


DockerStackContainer.prototype.start = function(){
    var self = this;

    this.container.start().then(function () {
        self.sync();
    }).catch(function (err) {
        //todo: handle simple error, container already started.
        self.sync();
    });
}

DockerStackContainer.prototype.stop = function(){
    var self = this;
    var done = false;

    this.container.stop().then(function () {
        self.unsubscribe();
        done = true;
    }).catch(function (err) {
        //todo: handle simple error
        done = true;
    });


    require('deasync').loopWhile(function(){return !done;});

    self.sync();

}

DockerStackContainer.prototype.terminate = function(){
    var self = this;
    var done = false;

    this.container.remove().then(function () {
        done = true;
    }).catch(function (err) {
        //todo: handle simple error
        self.unsubscribe();
        done = true;
    });


    require('deasync').loopWhile(function(){return !done;});

    self.sync();
}


DockerStackContainer.prototype.subscribe = function(){
    var self = this;

    if(this.listener == null)
    {

        this.listener = new DockerEvents({ docker: new Docker() });
        this.listener.on("_message", function(message) {
            if(message.Actor.Attributes && message.Actor.Attributes.name)
            {
                if(message.Type == "container" && message.Actor.Attributes.name == self.container_name){
                    self.sync();
                }
            }
        });

        this.listener.start();
    }

}

DockerStackContainer.prototype.unsubscribe = function(){
    if(this.listener)
    {
        this.listener.stop();
    }
}

DockerStackContainer.prototype.sync = function(){
    var self = this;
    var done = false;

    this.container.inspect(function (err, data) {
        if(data)
        {
            self.status = DockerStackContainer.NormalizeDockerContainerStatus( data.State.Status );
            self.is_running = data.State.Running;
            self.exists = true;
        }
        else
        {
            self.status = docker_statuses.dead;
            self.is_running = false;
            self.exists = false;
        }


        EventBus.dispatch("docker-stack-change", self.docker_stack, self.docker_stack);
    });


}

DockerStackContainer.NormalizeDockerContainerStatus = function(status)
{
    var new_status = status;
    if(status == docker_statuses.restarting || status == docker_statuses.running){
        new_status = docker_statuses.running;
    }

    if(status == docker_statuses.exited || status == docker_statuses.dead){
        new_status = docker_statuses.dead;
    }

    return new_status;
}

DockerStackContainer.FindOrCreate = function(container_name, params) {
    try
    {
        //try to find a container with this name.
        var container = DockerStackContainer.Find(container_name);

        // if container not found, create it
        if(container == null)
        {
            container = DockerStackContainer.Create(container_name, params);
        }

        return container;

    }
    catch (ex)
    {
        throw ex;
    }



}


DockerStackContainer.Create = function(container_name, params) {
    var self = this;
    var container = null;
    var done = false;
    var error = null;
    var docker = new Docker();

    docker.createContainer({
            Image: params.image,
            name: container_name,
            ExposedPorts: DockerStackContainer.ConvertPortsToExposedPorts(params.ports),
            PortBindings: DockerStackContainer.ConvertPortsToBindingPorts(params.ports),

            //todo: not sure what is needed here.
            AttachStdin: false,
            AttachStdout: true,
            AttachStderr: true,
            Tty: true,
            OpenStdin: false,
            StdinOnce: false
        }
    ).then(
        function(c) {
            container = c;
            done = true;
        }
    ).catch(
        function(err) {
            error = err;
            done = true;
        }
    );


    require('deasync').loopWhile(function(){return !done;});


    if(error){
        throw (error)
    }



    return container;
}


DockerStackContainer.Find = function(container_name) {
    var docker = new Docker();
    var done = false;


    var container = docker.getContainer(container_name);


    //hack because getContainer() always returns something.
    container.inspect(function (err, data) {
        if(data == null || data.Name ==  null)
        {
            container = null;
        }
        done = true;
    });

    require('deasync').loopWhile(function(){return !done;});

    return container;
}




//return exposed ports
DockerStackContainer.ConvertPortsToExposedPorts = function(ports) {
    var obj = {};

    for(var p= 0; p < ports.length; p++){
        obj[ports[p]["container"]] = {};
    }

    return obj;
}



//return port bindings
DockerStackContainer.ConvertPortsToBindingPorts = function(ports) {
    var obj = {};

    for(var p= 0; p < ports.length; p++){
        var port = ports[p];
        obj[port["container"]] = [{HostPort: port["host"]}];
    }

    return obj;
}




module.exports = DockerStackContainer;