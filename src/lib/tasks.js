var CronJob = require('cron').CronJob;
var config = require("config");

var Tasks = function(haystack_manager){
    this.haystack_manager = haystack_manager;
}

Tasks.prototype.start = function(){

    //handle terminated stacks
    var seconds = config.get('stacks.terminated_remove_after');
    new CronJob('*/' + seconds + ' * * * * *', () => {
        this.haystack_manager.cleanUpTerminated(seconds);
    }, null, true);

}

module.exports = Tasks;