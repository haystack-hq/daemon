var Docker = require('docker-remote-api');
var Promise = require('bluebird');

var DockerApi = function(){
    this.docker = Docker({ host: '/var/run/docker.sock'});
}

DockerApi.prototype.getContainer = function(name){
    var self = this;
    return new Promise(function(resolve, reject) {
        self.docker.get('/containers/' + name + '/json', {json:true}, function(err, container) {
            if (err) reject( err )
            resolve(container);
        });
    });
}

DockerApi.prototype.createContainer = function(identifier, name, container){
    var self = this;

    return new Promise(function(resolve, reject) {



        var params = {
            json: true,

            Image: container.image,
            ExposedPorts: DockerApi.ConvertPortsToExposedPorts(container.ports),
            PortBindings: DockerApi.ConvertPortsToBindingPorts(container.ports),

            //todo: not sure what is needed here.
            AttachStdin: false,
            AttachStdout: true,
            AttachStderr: true,
            Tty: true,
            OpenStdin: false,
            StdinOnce: false,
            Labels: container.labels

        };

        self.docker.post('/containers/create?name=' + name, {json: params}, function(err, container) {

            if (err) {
                console.log(err);
                reject( err );

            }

            resolve(container);
        });



    });
}



DockerApi.prototype.startContainer = function(name){
    var self = this;
    return new Promise(function(resolve, reject) {
        self.docker.post('/containers/' + name + '/start', {json: {}}, function(err, container) {
            if (err) reject( err )
            resolve(container);
        });
    });
}


DockerApi.prototype.stopContainer = function(name){
    var self = this;
    return new Promise(function(resolve, reject) {
        self.docker.post('/containers/' + name + '/stop', {json: {}}, function(err, container) {
            if (err) {
                if(err.message.includes('No such container')){
                    resolve(container);
                }
                reject( err )
            }
            resolve(container);
        });
    });
}



DockerApi.prototype.removeContainer = function(name){
    var self = this;

    return new Promise(function(resolve, reject) {
        self.docker.delete('/containers/' + name, {json:true}, function(err, container) {

            if (err) {
                if (err) {
                    if(err.message.includes('No such container')){
                        resolve(container);
                    }
                    reject( err )
                }
                resolve(container);

            }
            resolve(container);
        });
    });
}



DockerApi.prototype.getEvents = function(){
    var self = this;

    return new Promise(function(resolve, reject) {
        try {
            self.docker.get('/events', { isStream: true}, function(err, events) {

                if (err){
                    reject( err )
                }


                resolve(events);
            });
        }catch (ex){
            reject(ex);
        }

    });
}




//return exposed ports
DockerApi.ConvertPortsToExposedPorts = function(ports) {
    var obj = {};

    for(var p= 0; p < ports.length; p++){
        obj[ports[p]["container"]] = {};
    }

    return obj;
}



//return port bindings
DockerApi.ConvertPortsToBindingPorts = function(ports) {
    var obj = {};

    for(var p= 0; p < ports.length; p++){
        var port = ports[p];
        obj[port["container"]] = [{HostPort: port["host"]}];
    }

    return obj;
}

module.exports = DockerApi;