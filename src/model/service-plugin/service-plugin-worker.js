'use strict';

var ServicePluginProvider = require('./service-plugin-provider.js');
var ServicePlugin = require('./service-plugin.js');
var Logger = require("../../../src/lib/logger");
var service_plugin_provider = null;
var plugin = null;
var service_name = null;
var stack = null;



var logger = {
    log: function(level, msg, meta){
        process.send({action: "log", state:null, data: { level: level, msg: msg, meta: meta }});
    }
}

process.on('message', function(m) {

    var params = m.params;

    if(m.action == "load"){

        console.log("loading new service provider");

        try
        {
            service_name = params.service.service_name;
            //load a plugin
            plugin = new ServicePlugin(params.service.service_name, params.plugin.path);
            var provider =  plugin.getProvider(params.service.service_info.provider, params.mode);
            service_plugin_provider = new ServicePluginProvider(params.stack, params.service, plugin, provider, logger);
            process.send({action: "load", state:"success", data: { service_name: service_name }});


        }
        catch(err)
        {
            console.log("err from service-plugin-worker", err);
            process.send({action: "load", state:"fail", data: err});
        }


    }
    else
    {
        //todo: validate that it is in the action list
        var action = m.action;

        console.log("service_plugin_provider", action, service_plugin_provider);

        service_plugin_provider[action]()
            .then((res) => {
                process.send({action: action, state:"success", data: res });
            }).catch((err) => {
                //modify the error message:
                var msg = "Error when running the service plugin's [" + action + "] method. Message: [" + err.message  + "]";
                Logger.error(msg, {err});
                process.send({action: action, state:"fail", data: msg});
            });

    }


});

process.on('uncaughtException', function(err) {
    //process.send({action: "uncaught-exception", state:"fail", data: err.message});
});


process.on('exit', function(m) {
    console.log('CHILD got disconnected:', m);
});




