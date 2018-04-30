"use strict";

var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var should = chai.should();
const os = require('os');
const path = require("path");
var fs  = require('fs-extra');
var Haystack = require("../../../src/model/haystack");
var HaystackService = require("../../../src/model/haystack-service");
var ServicePluginProvider = require("../../../src/service-plugin/service-plugin-provider");


describe('haystack-service', () => {

    var valid_stack_service, mock_service_provider = null;
    var asset_path = path.join(__dirname, "../assets");

    var valid_service_info = {
        plugin: path.join(asset_path, "service-plugins", "valid-service-plugin"),
        http_port: 8806
    }

    beforeEach(() => {

        valid_stack_service = new HaystackService(new Haystack(), HaystackService.Modes.local, "test_service", valid_service_info);

        var mock_provider = {
            id: "mock-provider",
            provider_class: function(){}
        }
        mock_service_provider = new ServicePluginProvider("mock-plugin", mock_provider.id, mock_provider, valid_service_info) ;
    });


    it("should load a stack service", () => {
        assert.isNotNull(valid_stack_service.service_plugin_provider);
    });


    /* init method */
    it("should run the required init method on the provider", () => {
        valid_stack_service.init();
        assert.equal(valid_stack_service.status,HaystackService.Statuses.provisioning);
    });

    it("should run the required init method and set status to provisioned", (done) => {
        valid_stack_service.init().should.be.fulfilled.then(function () {
            valid_stack_service.status.should.equal(HaystackService.Statuses.provisioned);
            done();
        });
    });

    it("should run the required init method, fail and set status to impared", (done) => {
        mock_service_provider.provider.prototype.init = function(done, err){
            err("error-init");
        }

        valid_stack_service.service_plugin_provider = mock_service_provider;

        valid_stack_service.init().should.be.rejected.then(function () {
            valid_stack_service.status.should.equal(HaystackService.Statuses.impaired);
            valid_stack_service.error.should.equal("error-init");
            done();
        });
    });
    /* end init method */


    /* start method */
    it("should run the required start method on the provider", () => {
        valid_stack_service.start();
        assert.equal(valid_stack_service.status,HaystackService.Statuses.starting);
    });

    it("should run the required start method and set status to running", (done) => {
        valid_stack_service.start().should.be.fulfilled.then(function () {
            valid_stack_service.status.should.equal(HaystackService.Statuses.running);
            done();
        });
    });

    it("should run the required start method, fail and set status to impared", (done) => {
        mock_service_provider.provider.prototype.start = function(done, err){
            err("error-start");
        }

        valid_stack_service.service_plugin_provider = mock_service_provider;

        valid_stack_service.start().should.be.rejected.then(function () {
            valid_stack_service.status.should.equal(HaystackService.Statuses.impaired);
            valid_stack_service.error.should.equal("error-start");
            done();
        });
    });
    /* end start method */


    /* stop method */
    it("should run the required stop method on the provider", () => {
        valid_stack_service.stop();
        assert.equal(valid_stack_service.status,HaystackService.Statuses.stopping);
    });

    it("should run the required stop method and set status to stopped", (done) => {
        valid_stack_service.stop().should.be.fulfilled.then(function () {
            valid_stack_service.status.should.equal(HaystackService.Statuses.stopped);
            done();
        });
    });

    it("should run the required stop method, fail and set status to impared", (done) => {
        mock_service_provider.provider.prototype.stop = function(done, err){
            err("error-stop");
        }

        valid_stack_service.service_plugin_provider = mock_service_provider;

        valid_stack_service.stop().should.be.rejected.then(function () {
            valid_stack_service.status.should.equal(HaystackService.Statuses.impaired);
            valid_stack_service.error.should.equal("error-stop");
            done();
        });
    });
    /* end stop method */


    /* terminate method */
    it("should run the required terminate method on the provider", () => {
        valid_stack_service.terminate();
        assert.equal(valid_stack_service.status,HaystackService.Statuses.terminating);
    });

    it("should run the required terminate method and set status to stopped", (done) => {
        valid_stack_service.terminate().should.be.fulfilled.then(function () {
            valid_stack_service.status.should.equal(HaystackService.Statuses.terminated);
            done();
        });
    });

    it("should run the required terminate method, fail and set status to impared", (done) => {
        mock_service_provider.provider.prototype.terminate = function(done, err){
            err("error-terminate");
        }

        valid_stack_service.service_plugin_provider = mock_service_provider;

        valid_stack_service.terminate().should.be.rejected.then(function () {
            valid_stack_service.status.should.equal(HaystackService.Statuses.impaired);
            valid_stack_service.error.should.equal("error-terminate");
            done();
        });
    });
    /* end terminate  method */



    /* inspect method */

    it("should run the required inspect method", () => {
        return valid_stack_service.inspect().should.be.fulfilled;
    });

    it("should run the required inspect method and fail", (done) => {
        mock_service_provider.provider.prototype.inspect = function(done, err){
            err("error-inspect");
        }

        valid_stack_service.service_plugin_provider = mock_service_provider;

        valid_stack_service.inspect().should.be.rejected.then(function () {
            valid_stack_service.error.should.equal("error-inspect");
            done();
        });
    });
    /* end inspect method */



    /* ssh method */

    it("should run the option ssh method", () => {

        mock_service_provider.provider.prototype.ssh = function(done, err){
            done();
        }

        return valid_stack_service.ssh().should.be.fulfilled;
    });

    it("should run the optional ssh method and fail", (done) => {
        mock_service_provider.provider.prototype.ssh = function(done, err){
            err("error-ssh");
        }

        valid_stack_service.service_plugin_provider = mock_service_provider;

        valid_stack_service.ssh().should.be.rejected.then(function () {
            valid_stack_service.error.should.equal("error-ssh");
            done();
        });
    });


    it("should run the optional ssh method that does not exist and fail", (done) => {

        valid_stack_service.service_plugin_provider = mock_service_provider;

        valid_stack_service.ssh().should.be.rejected.then(function () {
            valid_stack_service.error.should.equal("Provider [mock-provider] does not implement the [ssh] action.");
            done();
        });
    });

    /* end ssh method */




});