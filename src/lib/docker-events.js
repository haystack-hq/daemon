var JSuck = require("jsuck");


var DockerEvents = function(options){

    options = options || {};

    this.docker = options.docker;
    this.running = false;

    this.onContainerChange = null;
    this.onConnect = null;
    this.onDisconnect = null;
}


DockerEvents.prototype.start = function() {
    var self = this;
    this.running = true;
    this.run();
}


DockerEvents.prototype.run = function start() {
    var self = this;



    this.docker.getEvents().then(function (res) {


        try
        {
            self.res = res;

            if(self.onConnect){
                self.onConnect("connected");
            }

            var parser = new JSuck();
            res.pipe(parser);




            parser.on("data", function(data) {

                console.log("resdata", data);

                /* container */
                if(data.Type == "container"){
                    if(self.onContainerChange){
                        if(data.Actor.Attributes && data.Actor.Attributes.name)
                        {
                            self.onContainerChange(data.status, data)
                        }

                    }
                }

            });


            parser.on("end", function() {

                if(self.onDisconnect){
                    self.onDisconnect("disconnected");
                }
                self.res = null;
                if (self.running) {
                    self.run();
                }
            });
        }
        catch (ex){
            //todo: handle error
            console.log("Ex", ex);
        }


    }).catch(function(err){
        //todo: handle error
        console.log("error", err);
    });




};

DockerEvents.prototype.stop = function stop() {
    this.running = false;

    if (this.res) {
        this.res.destroy();
    }

    return this;
};


module.exports = DockerEvents;