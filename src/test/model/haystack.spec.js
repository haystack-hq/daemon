"use strict";

var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var fs = require("fs-extra");
var path = require("path");
var homedir = require("homedir");



var Haystack = require("./../../../src/model/haystack");
var LocalInterface = require("./../../../src/interface/local/local-interface");
var base64 = require("base-64");
var events = require('events');
var Tasks = require("./../../../src/lib/tasks");

var valid_haystack_path = path.join( process.env.PWD , "/test/assets/haystacks/valid-haystack.json" );


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
    stack_file_location: path.join( process.env.PWD , "/test/assets/haystacks/valid-haystack.json" ),
    status: Haystack.Statuses.impaired,
    health: Haystack.Health.healthy,
    created_by: "mac",
    terminated_on: Date.now(),
    haystack_file: test_haystack_file

};


describe('Haystack', function() {

    this.timeout(2000);

    var valid_haystack = null;

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
        assert.isNull(haystack.created_by);
        assert.isNull(haystack.haystack_file);
        assert.isNull(haystack.terminated_on);
    });


    it("has the correctly populated init properties", function(){
        var haystack = new Haystack(new events.EventEmitter(), test_data);
        assert.deepEqual(test_data, haystack.getData());
    });

    it("errors if the stack is updated with an invalid status", function(){
        var haystack = new Haystack(new events.EventEmitter(), test_data);
        var fn = function () { haystack.updateStatus("invalid-status") };
        expect(fn).to.throw();
    });


    it("updates the haystack status", function(){
        var haystack = new Haystack(new events.EventEmitter(), test_data);
        haystack.updateStatus(Haystack.Statuses.running);
        assert.equal(haystack.status, Haystack.Statuses.running);
    });



    it("finds a matching haystack", function(){
        var haystack = new Haystack(new events.EventEmitter(), test_data);
        haystack.save();
        var haystack2 = new Haystack(new events.EventEmitter()).load("test");
        assert.equal(haystack.identifier, haystack2.identifier);
        haystack.delete();
        haystack2.delete();
    });


    it("throws an exception if no haystack found", function(){
        var haystack = new Haystack(new events.EventEmitter(), test_data);
        haystack.save();
        assert.throws(function () { new Haystack(new events.EventEmitter()).load("test1") }, "Haystack [test1] not found.");
        haystack.delete();
    });



    it("should remove all special chars when creating a stack identifier from a folder.", function(){
        var file_path = homedir() + "/tmp/path/with&**^%^#!@#$%^&*()_+?><.,more-stuff_on the end/Haystackfile.json";
        fs.ensureFileSync(file_path);
        var identifier = Haystack.GenerateIdentifierFromPath(file_path);
        assert.equal(identifier, "with-more-stuff-on-the-end");
        fs.removeSync(homedir() + "/tmp/path/");
    });



    it("removes a stack that has been terminated for x amount of seconds", function(done){
        this.timeout(1500);
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