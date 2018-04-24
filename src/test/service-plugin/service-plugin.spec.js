"use strict";

var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var should = chai.should();
const os = require('os');
const path = require("path");
var fs  = require('fs-extra');
var ServicePlugin = require("../../../src/service-plugin/service-plugin");
var ServicePluginManifest = require("../../../src/service-plugin/service-plugin-manifest");




describe('service-plugin', () => {

    var valid_service_plugin = null;
    var valid_plugin_path = path.join(__dirname, "../assets/service-plugins/valid-service-plugin");
    var invalid_service_plugin_manifest = path.join(__dirname, "../assets/service-plugins/invalid-service-plugin-manifest");


    beforeEach(() => {
        valid_service_plugin = new ServicePlugin("valid/plugin", valid_plugin_path);

    });

    it("should set the path on init", () => {
        assert.equal(valid_service_plugin.path_to_plugin, valid_plugin_path);
    });


    it("should error if the manifest file does not exist", () => {
        var fcn = function(){ new ServicePlugin("invalid/plugin", "./invalid-path") };
        assert.throws(fcn, 'Manifest file at [invalid-path/manifest.json] does not exist.');

    });

    it("should error if the manifest file is not valid", () => {
        var fcn = function(){ new ServicePlugin("invalid/plugin", invalid_service_plugin_manifest) };
        assert.throws(fcn, 'The [invalid/plugin]  manifest file error [property name is required]');
    });




});