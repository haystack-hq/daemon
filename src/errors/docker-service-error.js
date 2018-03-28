
function DockerServiceError(original_message){
    this.name = "DockerServiceError";

    //todo: make friendly error messages.
    try {
        var message  = JSON.parse(original_message);
        var msg = message;
    }
    catch(ex){
        message = original_message;
    }


    this.message = (message || "");
}

DockerServiceError.prototype = Error.prototype;



module.exports = DockerServiceError;