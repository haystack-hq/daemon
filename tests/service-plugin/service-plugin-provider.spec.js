#! /usr/bin/env node
var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var should = chai.should();
const os = require('os');
const path = require("path");
var fs  = require('fs-extra');
var ServicePluginProvider = require("../../../src/service-plugin/service-plugin-provider");
var ServicePluginLib = require("../../../src/service-plugin/service-plugin-lib");




describe('service-plugin-provider', () => {

    var service_plugin_provider, invalid_service_plugin_provider = null;

    beforeEach(() => {
        var ProviderValid = require(path.join(__dirname, "../assets/service-plugins/valid-service-plugin/provider.js"));
        var ProviderMissingMethods = require(path.join(__dirname, "../assets/service-plugins/invalid-service-plugin-missing-methods/provider.js"));

        service_plugin_provider = new ServicePluginProvider("test/provider", "test-provider", ProviderValid);
        invalid_service_plugin_provider = new ServicePluginProvider("test/invalid_provider", "test-provider", ProviderMissingMethods);


    });

    afterEach(() => {
        service_plugin_provider = null;
        invalid_service_plugin_provider = null;

    });

    it("should error if the provider is missing required methods", () => {
        invalid_service_plugin_provider.validate();
        expect(invalid_service_plugin_provider.errors.length).to.equal(ServicePluginProvider.RequiredActions.length);
        ServicePluginProvider.RequiredActions.forEach(function(method){
            var msg = 'Provider [test-provider] is mising required method [' + method + '].';
            expect(invalid_service_plugin_provider.errors).to.contain(msg);
        });
    });

    it("should inject haystack libs into the provider", () => {

        ServicePluginLib.GetLibs().forEach(function(lib){
            var lib_object = require(lib.path);
            expect(service_plugin_provider.provider_instance.haystack.lib[lib.name]).to.be.instanceof(lib_object);
        });
    });


    it("should inject is_healthy flag of false into the provider", () => {
        expect(service_plugin_provider.provider_instance.is_healthy).to.equal(false);
    });


    it("should return a promise for each required action", (done) => {
        var promises = [];

        ServicePluginProvider.RequiredActions.forEach(function(method){
            promises.push(service_plugin_provider[method]());
        });

        Promise.all(promises).then(function() {
            done();
        });

    });


    it("should return a promise for each optional action", (done) => {
        var promises = [];

        ServicePluginProvider.OptionalActions.forEach(function(method){
            promises.push(service_plugin_provider[method]());
        });

        Promise.all(promises).then(function() {
            done();
        });

    });


    it("should throw an action not implemented error if optional method is not implemented", () => {
        ServicePluginProvider.OptionalActions.forEach(function(method){
            var p = invalid_service_plugin_provider[method]();
            return p.should.be.rejectedWith("Provider [test-provider] does not implement the [" + method + "] action.");
        });

    });






});