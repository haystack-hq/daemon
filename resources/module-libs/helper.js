var compareVersions = require('compare-versions');


var Helper = function() {

}

Helper.prototype.CompareVersions = function(v1, v2){
    return compareVersions(v1, v2);
}

module.exports = Helper;