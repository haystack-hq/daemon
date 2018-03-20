var Haystack = require("./model/haystack");
var DockerApi = require("./lib/docker-api");
var DockerEvents = require('./lib/docker-events');
var LocalBuild = require('./lib/build/local-build');
var Tasks = require('./lib/tasks');
var WebServer = require('./webserver');
var events = require('events');
var path = require('path');
var fs = require('fs-extra');


var App = function(){
    this.docker_events = null;
    this.docker = new DockerApi();
    this.event_bus = new events.EventEmitter();
}

App.prototype.start = function(){
    var self = this;


    //listen for docker events.
    this.docker_events = new DockerEvents({ docker: this.docker  });
    this.docker_events.onContainerChange = function(status, data){
        //find stack and sync it.
        var identifier = data.Actor.Attributes["com.haystack.identifier"];
        var haystack = new Haystack(self.event_bus).load(identifier);



        if(haystack){
            haystack.sync();
        }
    };
    this.docker_events.start();



    //load stacks from db on startup.
    var haystacks = Haystack.Search();
    haystacks.forEach(function (haystack_data) {
        var haystack = new Haystack(self.event_bus).load(haystack_data.identifier);
        if(haystack){
            haystack.sync();
        }
    });


    //webserver + streams
    var webServer = new WebServer(this.event_bus);
    webServer.listen();



    //tasks
    var tasks = new Tasks();
    tasks.start();



    //todo: we will be replacing this with a service plugin repository. But for now.
    var plugins_dir = LocalBuild.GetServicePackagePath();
    fs.ensureDirSync(plugins_dir);
    fs.copySync(path.resolve(__dirname) + "/tmp/docker.container", plugins_dir + "/docker.container/");


}



App.prototype.stop = function(){
    this.docker_events.stop();

}



module.exports = App;