var shell = require('shelljs');

var Mount = function(data){
    //this will auto load for the network too,
    if(data.service){
        this.mount = data.service.plugin.mount;
        this.plugin_src = data.service.plugin.src;
        this.src =  data.service.data.src;
        console.log(this);
    }


}

Mount.prototype.start = function(mount_type){

}


Mount.Types = {
    unison: "unison"
}

module.exports = Mount;