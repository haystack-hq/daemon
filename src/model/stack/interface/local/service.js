var PluginManager = require("../../../plugin/manager");
var Stack = require("../../../stack/stack");
var Thread = require("../../../thread/thread");
var path = require("path");
var config = require("config");

var ServiceInterface = function(service_id, service, data, stack, event_emiiter){
    this.service_id = service_id;
    this.service = service;
    this.data = data;
    this.stack = stack;
    this.event_emitter =  event_emiiter;

    this.plugin = PluginManager.LoadPlugin(this.data);
    this.plugin.init(this.stack.provider.id, this.data.parameters);


    //create this interface to the module class, which will load and run the module.
    this.module_interface = new Thread(
        path.join(__dirname, "../../../module/interface.js"),
        {
            stack: {
                identifier: this.stack.identifier,
                network: {
                    name: this.stack.network.name
                }
            },
            service: {
                id: this.service_id
            },
            path_to_module: this.plugin.path_to_module,
            provider: {
                id: this.stack.provider.id
            },
            service_config: this.plugin.provider_config
        });


    this.implement_commands();

    this.implement_healthcheck();
}



/* implement all required commands */
ServiceInterface.prototype.implement_commands = function(){
    Stack.Commands.Required.forEach((command) => {
       var cmd = command.cmd;

       this[cmd] =  () => {
           console.log("interface.local.service", "method ran", cmd);

           /* return a promise to the stack */
           return new Promise((resolve, reject)  => {

               /* update the status */
               if(command.status_from)
               {
                   this.update_status( command.status_from );
               }

                /* calls the module thread */
               this.module_interface.call(cmd,  {},
                   (result) => {

                       /* update the status */
                       if(command.status_to)
                       {
                           this.update_status( command.status_to );
                       }

                       resolve(result);
                   },
                   (err) => {
                       this.update_status( Stack.Statuses.impaired,  err );
                       reject(err);

                   });

           });
       }
    });
}


ServiceInterface.prototype.implement_healthcheck = function(){
    console.log("this.status", this.service.status);

    //healthcheck timer
    var health_check_interval = config.get('stacks.service.health_check_interval');
    this.health_check = setInterval(() => {
        if(this.stack.status == Stack.Statuses.impaired || this.stack.status == Stack.Statuses.running) {

            //call module healthcheck
            if(this.module_interface){
                this.module_interface.call("healthcheck",  {},
                    (result) => {
                        /* update the status to running */
                        this.update_status(Stack.Statuses.running);
                    },
                    (err) => {
                        this.update_status( Stack.Statuses.impaired,  err );
                    });
            }

        }
    }, health_check_interval );
}


ServiceInterface.prototype.update_status = function(status, error){
    this.service.status = status;
    this.service.error = error ? error : null;

    this.event_emitter.emit("service-change", {service_id: this.service_id, status:status, error: error });
}






module.exports = ServiceInterface;