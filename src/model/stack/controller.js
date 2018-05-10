
/*
 * @file
 * A controller that will use a local or remote interface for updating the stack.
 *
 */

var Stack = require("./stack");
var LocalInterface = require("./interface/local/stack");
var moment = require('moment');
const EventEmitter = require('events');


var Controller = function(stack){
    this.stack = stack;
    this.event_emitter = new EventEmitter();
    if(this.stack.mode == Stack.Modes.local){
        this.interface = new LocalInterface(stack, this.event_emitter);
    }
    else
    {
        throw new Error("Stack mode [" + this.stack.mode + "] is not supported.");
    }


    //subscribe to updates
    this.event_emitter.on("service-change", (data) => {
       this.update_service(data.service_id, data.status, data.error);
    });

}


Controller.prototype.start = function(){
    this.stack.update_status(Stack.Statuses.starting);

    return new Promise((resolve, reject)  => {
        this.interface.start()
            .then((result) => {
                this.stack.update_status(Stack.Statuses.running);
                resolve(result);
            }).catch((err) => {
                this.stack.update_status(Stack.Statuses.impaired, err);
                reject(err);
            });
    });



}



Controller.prototype.terminate = function(){
    this.stack.update_status(Stack.Statuses.terminating);

    return new Promise((resolve, reject)  => {
        this.interface.terminate()
            .then((result) => {
                this.stack.terminated_on = Date.now();
                this.stack.update_status(Stack.Statuses.terminated);

                resolve(result);
            }).catch((err) => {
                this.stack.update_status(Stack.Statuses.impaired, err);
                reject(err);
            });
    });

}


Controller.prototype.update_service = function(service_id, status, error){
    this.stack.update_service(service_id, status, error);
}

module.exports = Controller;