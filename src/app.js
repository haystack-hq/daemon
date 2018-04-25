"use strict";

var Haystack = require("./model/haystack");
var DockerApi = require("./lib/docker-api");
var Tasks = require('./lib/tasks');
var WebServer = require('./webserver');
var events = require('events');
var path = require('path');
var fs = require('fs-extra');
var process = require('process');
var fp = require("find-free-port");
var ServicePluginManager = require("./service-plugin/service-plugin-manager");


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



        //load stacks from db on startup.
        var haystacks = Haystack.Search();

        haystacks.forEach(function (haystack_data) {
            var haystack = new Haystack(self.event_bus).load(haystack_data.identifier);
            if(haystack){
                console.log("haystack.identifier", haystack.identifier);
                haystack.init().then(function(result) {

                }).catch(function(err){
                    console.log("error starting up",  err);
                    //todo: get this error into the haystack entry.
                });
            }
        });


        //webserver + streams
        var webServer = new WebServer(self.config.agent_port, self.event_bus);
        webServer.listen();



        //tasks
        var tasks = new Tasks();
        tasks.start();





        //todo: we will be replacing this with a service plugin repository. But for now.
        var plugins_dir = ServicePluginManager.GetPluginDirectory();
        fs.ensureDirSync(plugins_dir);
        fs.copySync(path.join(__dirname,  "/tmp/helloworld"), path.join(plugins_dir, "helloworld") );
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