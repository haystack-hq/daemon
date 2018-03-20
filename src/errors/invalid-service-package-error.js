
function InvalidServicePackageError(message){
    this.name = "InvalidServicePackageError";
    this.message = (message || "");
}

InvalidServicePackageError.prototype = Error.prototype;



module.exports = InvalidServicePackageError;