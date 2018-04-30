"use strict";

var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var fs = require("fs-extra");
var path = require("path");
var homedir = require("homedir");
var Haystack = require("./../../../src/model/stack");
var events = require('events');


var valid_haystack_path = path.join( process.env.PWD , "/test/assets/haystacks/valid-haystack.json" );



describe('Haystack-Actions', function() {

    this.timeout(2000);

    var valid_haystack = null;

    beforeEach(() => {
        var data = {
            identifier: "test",
            stack_file_location: valid_haystack_path
        }

        valid_haystack = new Haystack(new events.EventEmitter(), data);
    });


    it("should run init against a stack", function(done) {
        valid_haystack.init().then(function(){
            done();
        });

    });

    it("should run start against a stack", function(done) {
        valid_haystack.start().then(function(){
            done();
        });

    });

    it("should run stop against a stack", function(done) {
        valid_haystack.stop().then(function(){
            done();
        });

    });

    it("should run terminate against a stack", function(done) {
        valid_haystack.terminate().then(function(){
            done();
        });

    });






});