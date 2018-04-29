"use strict";


var Provider = function(){
    this.status = "running";
}


/* required implemented methods */
Provider.prototype.init = function(done, err){


    /*
    setInterval(() => {
        console.log("********** from plugin ************", this.haystack.service.service_name);
    }, 2000);

    setTimeout(() => {
        console.log("********** timeout from plugin ************", this.haystack.service.service_name);

    }, 2000);
    */





    try{
        this.haystack.service.is_healthy = true;
        done(true);
    }
    catch(ex){
        err( ex);
    }

}




Provider.prototype.start = function(done, err){
    done(true);
}

Provider.prototype.stop = function(done, err){
    done(true);
}

Provider.prototype.terminate = function(done, err){
    done(true);
}

Provider.prototype.inspect = function(done, err){


    done({
        status: this.status,
        info: {
            ip: "123.345.342.123"
        }
    });
}

/* optionally implemented interface methods */
Provider.prototype.ssh = function(done, err){
    done(true);
}

Provider.prototype.heartbeat = function(){
    //console.log("plugin heartbeat pulse");
}

module.exports = Provider;


