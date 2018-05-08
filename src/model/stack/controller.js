
/*
 * @file
 * A controller that will use a local or remote interface for updating the stack.
 *
 */

var Stack = require("./stack");
var LocalInterface = require("./interface/local/stack");


var Controller = function(stack){
    this.stack = stack;
    if(this.stack.mode == Stack.Modes.local){
        this.interface = new LocalInterface(stack);
    }
    else
    {
        throw new Error("Stack mode [" + this.stack.mode + "] is not supported.");
    }

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

module.exports = Controller;