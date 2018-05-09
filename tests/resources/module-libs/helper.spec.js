"use strict"

var Helper = require("../../../resources/module-libs/helper");
var chai = require('chai');
var shell = require('shelljs');
var expect = chai.expect;
var assert = chai.assert;

describe('module-libs/helper', function() {

    it("should compare versions", function () {
        var helper = new Helper();

        assert.equal(helper.CompareVersions("1.13.0", "18.03.1-ce"), -1);
        assert.equal(helper.CompareVersions("18.03.1-ce", "1.13.0"), 1);
        assert.equal(helper.CompareVersions("18.03.1", "1.13.0"), 1);
        assert.equal(helper.CompareVersions("18.03.1", "18.03.1"), 0);

    });

});