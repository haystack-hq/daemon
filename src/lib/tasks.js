var CronJob = require('cron').CronJob;
var config = require("config");

var Tasks = function(stack_manager){
    this.stack_manager = stack_manager;
}

Tasks.prototype.start = function(){

    //handle terminated stacks
    var seconds = config.get('stacks.terminated_remove_after');
    new CronJob('*/' + seconds + ' * * * * *', () => {
        this.stack_manager.cleanUpTerminated(seconds);
    }, null, true);

}

module.exports = Tasks;