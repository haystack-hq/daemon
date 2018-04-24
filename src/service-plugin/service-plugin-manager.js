'use strict';

var path = require('path');
var fs  = require('fs-extra');
var path = require("path");
var Logger = require("../../src/lib/logger");
const os = require('os');

var ServicePluginManager = function() {

}


ServicePluginManager.GetPluginDirectory = function(){
    return path.join(os.homedir().toString(), ".haystack", "service-plugins");
}


module.exports = ServicePluginManager;