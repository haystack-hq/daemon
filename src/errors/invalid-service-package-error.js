
function InvalidServicePluginError(message){
    this.name = "InvalidServicePluginError";
    this.message = (message || "");
}

InvalidServicePluginError.prototype = Error.prototype;



module.exports = InvalidServicePluginError;