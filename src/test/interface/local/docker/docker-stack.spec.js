#! /usr/bin/env node
var DockerStack = require("../../../../../src/interface/local/docker/docker-stack");
var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);



describe('Stack', function() {

    this.timeout(2000);

    /*
    it("should start a DockerStack.", function(){
        var identifier = "test";
        var build = require("../../../assets/build.json");

        var docker_stack = new DockerStack(identifier, build);
        docker_stack.start();

    });

    it("should init a DockerStack.", function(){
        var identifier = "test";
        var build = require("../../../assets/build.json");

        var docker_stack = new DockerStack(identifier, build);
        console.log(docker_stack);

    });


    it("should stop a DockerStack.", function(){
        var identifier = "test";
        var build = require("../../../assets/build.json");

        var docker_stack = new DockerStack(identifier, build);
        docker_stack.stop();

    });

    it("should terminate a DockerStack.", function(){
        var identifier = "test";
        var build = require("../../../assets/build.json");

        var docker_stack = new DockerStack(identifier, build);
        docker_stack.terminate();

    });

    */



});