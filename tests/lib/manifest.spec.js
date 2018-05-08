"use strict"

var appRoot = require('app-root-path');
var fs = require("fs-extra");
var path = require('path');
var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;

var Manifest = require("../../src/lib/manifest");




describe('lib/manifest', function() {

    it("should parse value of json", function(){
        var original = { test: "test"};
        var plugin_path = path.join(appRoot.resolve("."), "plugins", "hello-world");
        var value = Manifest.ParseValue(plugin_path, original);

        assert.deepEqual(value, original);
    });


    it("should parse value of file", function(){
        var plugin_path = path.join(appRoot.resolve("."), "plugins", "hello-world");
        var value = Manifest.ParseValue(plugin_path, "docker/config.json");

        var original = fs.readJsonSync(path.join(appRoot.resolve("."), "plugins", "hello-world", "docker", "config.json"));

        assert.deepEqual(value, original);
    });


    it("should parse error when it is an invalid file", function(){
        var plugin_path = path.join(appRoot.resolve("."), "plugins", "hello-world");
        var fn = function() {
            Manifest.ParseValue(plugin_path, "invalid-file.json");
        }
        assert.throws(fn, "The file [invalid-file.json] could not be found. Please check the file path.");

    });
});