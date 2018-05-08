

var Provider = function(args){
    this.shell = args.haystack.shell;

}


Provider.prototype.start = function(done, err){

    done();
}


Provider.prototype.terminate = function(done, err){
    done();
}


module.exports = Provider;