



var HaystackService = function(name){
    this.name = name;
    this.status = "pending";
    this.exists=  false;
    this.is_running= false;
    this.is_provisioned= false;
    this.is_healthy= false
}

HaystackService.prototype.getData = function(){
    return {
        name: this.name,
        status: this.status,

        exists:  this.exists,
        is_running: this.is_running,
        is_provisioned: this.is_provisioned,
        is_healthy: this.is_healthy
    }
}



HaystackService.Statuses = {
    pending: "pending",
    provisioning: "provisioning",
    impaired: "impaired",
    running: "running",
    stopping: "stopping",
    stopped: "stopped",
    terminating: "terminating",
    terminated: "terminated",
}



module.exports = HaystackService;