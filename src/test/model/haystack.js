#! /usr/bin/env node
var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);



var Haystack = require("./../../../src/model/haystack");
var LocalInterface = require("./../../../src/interface/local/local-interface");
var base64 = require("base-64");
var events = require('events');
var Tasks = require("./../../../src/lib/tasks");



var test_build = require("../assets/build.json");
var test_haystack_file = require("../assets/haystack_file.json");
var test_data  = {
    _id: null,
    identifier: "test",
    services: [{
        name: "abc",
        status: Haystack.Statuses.running
    }],
    mode: Haystack.Mode.local,
    provider: "test-provider",
    stack_file_location: process.env.PWD + "/test/assets/haystack_file.json",
    status: Haystack.Statuses.impaired,
    health: Haystack.Health.healthy,
    created_by: "mac",
    do_mount: true,
    terminated_on: Date.now(),
    haystack_file: test_haystack_file,
    build: null

};


describe('Haystack', function() {

    this.timeout(2000);





    it("has the correctly empty init properties", function(){
        var haystack = new Haystack();

        assert.isNull(haystack._id);
        assert.isNull(haystack.identifier);
        assert.isNull(haystack.services);
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
        var haystack = new Haystack(new events.EventEmitter(), test_data);
        assert.deepEqual(test_data, haystack.getData());
    });


    it("finds a matching haystack", function(){
        var haystack = new Haystack(new events.EventEmitter(), test_data);
        haystack.save();
        var haystack2 = new Haystack(new events.EventEmitter()).load("test");

        assert.equal(haystack.identifier, haystack2.identifier);

        //clean up
        haystack.delete();
    });


    it("throws an exception if no haystack found", function(){
        var haystack = new Haystack(new events.EventEmitter(), test_data);
        haystack.save();

        assert.throws(function () { new Haystack(new events.EventEmitter()).load("test1") }, "Haystack 'test1' not found.");

        //clean up
        haystack.delete();
    });


    it("connects to local interface", function(){
        var haystack = new Haystack(new events.EventEmitter(), test_data);

        haystack.connect();

        assert.instanceOf(haystack.interface, LocalInterface);

        haystack.disconnect();

    });



    it("disconnects from local interface", function(){
        var haystack = new Haystack(new events.EventEmitter(), test_data);
        haystack.connect();
        haystack.disconnect();
        assert.isNull(haystack.interface);
    });



    it("removes a stack that has been terminated for x amount of seconds", function(done){
        this.timeout(1500);


        //remove all haystacks for a clean test
        Haystack.RemoveAll();


        var haystack = new Haystack(new events.EventEmitter(), test_data);
        haystack.terminated_on = Date.now();
        haystack.status = Haystack.Statuses.terminated;
        haystack.save();






        setTimeout(function () {
            Haystack.CleanUpTerminated(1);
            assert.equal(Haystack.Search().length, 0);
            done();
        }, 1300);




    });





});