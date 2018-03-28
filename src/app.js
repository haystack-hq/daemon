var Haystack = require("./model/haystack");
var DockerApi = require("./lib/docker-api");
var DockerEvents = require('./lib/docker-events');
var LocalBuild = require('./lib/build/local-build');
var Tasks = require('./lib/tasks');
var WebServer = require('./webserver');
var events = require('events');
var path = require('path');
var fs = require('fs-extra');
var process = require('process');
var fp = require("find-free-port");


var App = function(){
    this.config_path = process.env.HOME + '/.haystack/config.json';

    this.docker_events = null;
    this.docker = new DockerApi();
    this.event_bus = new events.EventEmitter();
    this.config = {};
}

App.prototype.start = function(){
    var self = this;

    //load configuration
    this.loadConfig().then(function(){

        console.log(self.config.agent_port);


        //listen for docker events.
        self.docker_events = new DockerEvents({ docker: self.docker  });
        self.docker_events.onContainerChange = function(status, data){
            //find stack and sync it.
            var identifier = data.Actor.Attributes["com.haystack.identifier"];
            var haystack = new Haystack(self.event_bus).load(identifier);



            if(haystack){
                haystack.sync();
            }
        };
        self.docker_events.start();



        //load stacks from db on startup.
        var haystacks = Haystack.Search();
        haystacks.forEach(function (haystack_data) {
            var haystack = new Haystack(self.event_bus).load(haystack_data.identifier);
            if(haystack){
                haystack.sync();
            }
        });


        //webserver + streams
        var webServer = new WebServer(self.config.agent_port, self.event_bus);
        webServer.listen();



        //tasks
        var tasks = new Tasks();
        tasks.start();



        //todo: we will be replacing this with a service plugin repository. But for now.
        var plugins_dir = LocalBuild.GetServicePackagePath();
        fs.ensureDirSync(plugins_dir);
        fs.copySync(path.resolve(__dirname) + "/tmp/docker.container", plugins_dir + "/docker.container/");
    });






}



App.prototype.stop = function(){
    this.docker_events.stop();

}


App.prototype.loadConfig = function(){
    var self = this;

    return new Promise(function(resolve, reject) {
        //check for the config file.
        if(!fs.existsSync(self.config_path)){
            self.createConfig().then(function(){
                load();

            }).catch(function(err){
                reject(err);
            });
        }
        else
        {
            try {
                load();

            } catch(ex){
                reject(ex);
            }
        }


        function load(){
            var config = fs.readJsonSync(self.config_path);

            //set values
            self.config.agent_port = config.AGENT_PORT;
            resolve(self.config);
        }
    });



    //load the config.


}

App.prototype.createConfig = function(){
    var self = this;

    return new Promise(function(resolve, reject) {

        //get a free port.
        fp(45601, 46100).then(function ([port]) {

            try {
                //get the agent port.
                var agent_port = port;

                //make a config file.
                var config = {
                    AGENT_PORT: agent_port
                }

                //write the file
                fs.writeJsonSync(self.config_path, config);

                resolve(config);
            } catch(err){
                reject(err);
            }

        }).catch(function(err){
            reject(err);
        });



    });



}



module.exports = App;