
var Provider = function(){

}

/* required implemented methods */
Provider.prototype.init = function(done, err){
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
    done(true);
}

/* optionally implemented interface methods */
Provider.prototype.ssh = function(done, err){
    done(true);
}

module.exports = Provider;


