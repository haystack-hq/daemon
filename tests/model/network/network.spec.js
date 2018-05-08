"use strict"

var appRoot = require('app-root-path');
var fs = require("fs-extra");
var path = require('path');
var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;

var NetworkManager = require("../../../src/model/network/manager");
var Network = require("../../../src/model/network/network");


describe('model/network', function() {

    it("should init the network", function(done){
        var network = NetworkManager.LoadDefaultNetwork("docker");
        network.init("test-stack");
        network.start().then((result) => {
            done()
        }).catch((err) => {
            done(err);
        });
    });


});