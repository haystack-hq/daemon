'use strict';

var path = require('path');
var fs  = require('fs-extra');
var path = require("path");
var Logger = require("../../../src/lib/logger");
const os = require('os');

var Manager = function() {

}


Manager.GetPluginDirectory = function(){
    return path.join(os.homedir().toString(), ".haystack", "plugins");
}


module.exports = Manager;