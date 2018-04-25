"use strict";

var Provider = function(){
    this.status = "provisioning";
}

/* required implemented methods */
Provider.prototype.init = function(done, err){

    setInterval(() => {
        if(this.haystack.service.service_name == "web_1"){
            this.status = "running";
        }
        else{
            this.status = "impaired";
        }

        this.haystack.update();
    }, 1000);


    this.haystack.service.is_healthy = true;

    done(true);
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

module.exports = Provider;


