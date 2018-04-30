"use strict";


var Tasks = require('./lib/tasks');
var WebServer = require('./webserver');
var events = require('events');
var path = require('path');
var fs = require('fs-extra');
var process = require('process');
var fp = require("find-free-port");
var ServicePluginManager = require("./model/service-plugin/service-plugin-manager");
var StackManager = require("./model/stack/stack-manager");
var db = require('./model/db/db-conn');





var App = function(){

    this.config_path = path.join( process.env.HOME , '.haystack/config.json');
    this.docker_events = null;
    console.log("made it4");
    this.stack_manager = new StackManager(db);
    this.config = {};


}

App.prototype.start = function(){



    //load configuration
    this.loadConfig().then(() =>{

        console.log(this.config.agent_port);


        //load all the stacks on startup.
        this.stack_manager.init();



        //webserver + streams
        var webServer = new WebServer(this.config.agent_port, this.stack_manager);
        webServer.listen();



        //tasks
        var tasks = new Tasks(this.stack_manager);
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