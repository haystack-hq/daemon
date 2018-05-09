var PluginManager = require("../../../plugin/manager");
var Stack = require("../../../stack/stack");
var Thread = require("../../../thread/thread");
var path = require("path");

var ServiceInterface = function(service_id, data, stack){
    this.service_id = service_id;
    this.data = data;
    this.stack = stack;

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
}



/* implement all required commands */
ServiceInterface.prototype.implement_commands = function(){
    Stack.Commands.Required.forEach((cmd) => {

       this[cmd] =  () => {
           console.log("interface.local.service", "method ran", cmd);

           /* return a promise to the stack */
           return new Promise((resolve, reject)  => {

                /* calls the module thread */
               this.module_interface.call(cmd, {},
                   (result) => { resolve(result); },
                   (err) => { reject(err); });

           });
       }
    });
}



module.exports = ServiceInterface;