"use strict"

var StackManager = require("../../../src/model/stack/manager");
var Stack = require("../../../src/model/stack/stack");
var Controller = require("../../../src/model/stack/controller");
var db = require('../../../src/model/db/db-conn');
var appRoot = require('app-root-path');
var fs = require("fs-extra");
var path = require('path');
var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;

describe('stack', function() {

    var stack_manager = null;

    beforeEach(function() {
        // runs after each test in this block
        stack_manager = new StackManager(db);
        stack_manager.remove_all();
    });

    afterEach(function() {
        // cleanup
        stack_manager.remove_all();
    });

    it("should load a stack", function(done){
        var project_path = path.join(appRoot.resolve("."), "resources", "stacks", "hello-world");
        var stack = stack_manager.load_from_path(project_path, null, "docker", Stack.Modes.local);
        done();
    });


    it("should start a stack", function(done){
        var project_path = path.join(appRoot.resolve("."), "resources", "stacks", "hello-world");
        var stack = stack_manager.load_from_path(project_path, null, "docker", Stack.Modes.local);
        var controller = new Controller(stack);
        controller.start()
            .then((result) => {
                done();
            }).catch((err) => {
                done(err);
            });



    });

});