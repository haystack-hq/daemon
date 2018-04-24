var CronJob = require('cron').CronJob;
var Haystack = require("./../model/haystack");
var config = require("config");

var Tasks = function(){

}

Tasks.prototype.start = function(){

    //handle terminated stacks
    var seconds = config.get('stacks.terminated_remove_after');
    new CronJob('*/' + seconds + ' * * * * *', function() {
        Haystack.CleanUpTerminated(seconds);
    }, null, true);

}

module.exports = Tasks;