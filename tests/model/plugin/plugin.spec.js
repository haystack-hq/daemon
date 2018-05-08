"use strict"

var appRoot = require('app-root-path');
var fs = require("fs-extra");
var path = require('path');
var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;

var PluginManager = require("../../../src/model/plugin/manager");




describe('model/plugin', function() {


    it("should load the plugin", function(){
        var plugin = PluginManager.LoadPlugin("hello-world");
    });


    it("should init the plugin", function(){
        var plugin = PluginManager.LoadPlugin("hello-world");
        plugin.init("dockerf", {http_port: 9009});

        //todo: more testing. module, config, etc.

        //variables replacement
        assert.deepEqual(plugin.provider_config.ports, [{9009: 80}] );
    });



});