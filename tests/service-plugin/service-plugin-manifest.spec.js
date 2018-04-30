#! /usr/bin/env node
var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
const os = require('os');
const path = require("path");
var fs  = require('fs-extra');

var ServicePluginManifest = require("../../../src/service-plugin/service-plugin-manifest");


describe('service-plugin-manifest', () => {

    valid_manifest_file = path.join(os.tmpdir(), 'haystack-daemon', 'valid-manifest.json');
    invalid_manifest_file = path.join(os.tmpdir(), 'haystack-daemon', 'invalid-manifest.json');
    invalid_manifest_json_file = path.join(os.tmpdir(), 'haystack-daemon', 'invalid-manifest-json.json');

    beforeEach(() => {
        fs.ensureFileSync(valid_manifest_file);
        fs.writeJsonSync(valid_manifest_file, { name: 'test-service-plugin'});

        fs.ensureFileSync(invalid_manifest_json_file);
        fs.outputFileSync(invalid_manifest_json_file, "not-valid-json");

        fs.ensureFileSync(invalid_manifest_file);
        fs.writeJsonSync(invalid_manifest_file, { names: 'test-service-plugin'});
    });


    afterEach(() => {
        fs.removeSync(valid_manifest_file);
        fs.removeSync(invalid_manifest_file);
        fs.removeSync(invalid_manifest_json_file);
    });

    it("should error if the service plugin manifest does not exists", () => {
        var fcn = function(){ new ServicePluginManifest("fake-path-to-manifest.json"); }
        assert.throws(fcn, 'Manifest file at [fake-path-to-manifest.json] does not exist.');
    });

    it("should error if the service plugin manifest is not valid JSON",  () => {
        var manifest = new ServicePluginManifest(invalid_manifest_json_file);
        manifest.validate();
        expect(manifest.hasErrors()).to.equal(true);
        expect(manifest.errors).to.contain("The manifest file at [" + invalid_manifest_json_file + "] is not valid json.");
    });

    it("should error if the service plugin manifest is not valid SCHEMA",  () => {
        var manifest = new ServicePluginManifest(invalid_manifest_file);
        manifest.validate();
        expect(manifest.hasErrors()).to.equal(true);
    });

    it("should have no errors if valid manifest is provided", () => {
        var manifest = new ServicePluginManifest(valid_manifest_file);
        manifest.validate();
        expect(manifest.hasErrors()).to.equal(false);
    });



});
