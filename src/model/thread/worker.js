
var Worker = function(process){
    this.process = process;
    var args = this.process.argv;
    this.path_to_include = args[2];
    var object_args_json = args[3];

    //get the object args out of the
    var object_args = null;
    if(object_args_json != "undefined"){
        var object_args = JSON.parse(object_args_json);
    }


    /* create the object that we will be interacting with */
    var Obj = require(this.path_to_include);
    this.obj = new Obj(object_args);



    this.process.on('message', (m) => {

        //validate method is implemented
        if(!this.obj[m.method]){
            this.reply(m.id, m.method, "fail", "Method [" + m.method + "] not implemented.");
            return;
        }

        //convert the message into a method call.
        this.obj[m.method](
            (result) => {
                this.reply(m.id, m.method, "success", result);

            },
            (err) => {
                this.reply(m.id, m.method, "fail", err);
            }
        );


    });



}

Worker.prototype.reply = function(id, method, state, result){

    this.process.send({
        id: id,
        method: method,
        state: state,
        data: result
    });
}


new Worker(process);
