#! /usr/bin/env node
var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);


var Haystack = require("./../../../src/model/haystack");
var LocalInterface = require("./../../../src/interface/local/local-interface");
var base64 = require("base-64");



var test_build = require("../assets/build.json");
var test_haystack_file = require("../assets/haystack_file.json");
var test_data  = {
    _id: null,
    identifier: "test",
    services: [{
        name: "abc",
        status: Haystack.Statuses.running
    }],
    haystack_file_encoded: base64.encode(JSON.stringify(test_haystack_file)),
    build_encoded: base64.encode(JSON.stringify(test_build)),
    mode: Haystack.Mode.local,
    provider: "test-provider",
    stack_file_location: "/Users/macmcclain/projects/",
    status: Haystack.Statuses.impared,
    health: Haystack.Health.healthy,
    created_by: "mac",
    do_mount: true,
    terminated_on: new Date(),
    haystack_file: test_haystack_file,
    build: test_build

};


describe('Haystack', function() {

    this.timeout(2000);


    it("has the correctly empty init properties", function(){
        var haystack = new Haystack();

        assert.isNull(haystack._id);
        assert.isNull(haystack.identifier);
        assert.isNull(haystack.services);
        assert.isNull(haystack.haystack_file_encoded);
        assert.isNull(haystack.build_encoded);
        assert.equal(haystack.mode, Haystack.Mode.local);
        assert.isNull(haystack.provider);
        assert.isNull(haystack.stack_file_location);
        assert.equal(haystack.status, Haystack.Statuses.pending);
        assert.equal(haystack.health, Haystack.Health.unhealthy);
        assert.isNull(haystack.interface);
        assert.isNull(haystack.created_by);
        assert.equal(haystack.do_mount, false);
        assert.isNull(haystack.haystack_file);
        assert.isNull(haystack.build);
        assert.isNull(haystack.terminated_on);


    });



    it("has the correctly populated init properties", function(){
        var haystack = new Haystack(test_data);
        assert.deepEqual(test_data, haystack.getData());
    });


    it("finds a matching haystack", function(){
        var haystack = new Haystack(test_data);
        haystack.save();
        var haystack2 = new Haystack().load("test");

        assert.equal(haystack.identifier, haystack2.identifier);

        //clean up
        haystack.delete();
    });


    it("throws an exception if no haystack found", function(){
        var haystack = new Haystack(test_data);
        haystack.save();

        assert.throws(function () { new Haystack().load("test1") }, "Haystack 'test1' not found.");

        //clean up
        haystack.delete();
    });


    it("connects to local interface", function(){
        var haystack = new Haystack(test_data);

        haystack.connect();

        assert.instanceOf(haystack.interface, LocalInterface);

        haystack.disconnect();

    });



    it("disconnects from local interface", function(){
        var haystack = new Haystack(test_data);
        haystack.connect();
        haystack.disconnect();
        assert.isNull(haystack.interface);
    });





});