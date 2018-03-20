#! /usr/bin/env node
var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

var InvalidServicePackageError = require("./../../../errors/invalid-service-package-error");
var Build = require("../../../lib/build/local-build");

describe('local-build', function() {


    it("should throw an error if service package does not exists.", function() {

        var haystack_file = {
            "services": {
                "web_1": {
                    "type": "some-non-service-plugin-that-does-not-exist"
                }
            }
        };

        var build = new Build("test-build", haystack_file);

        try
        {
            build.build();
        }
        catch (ex)
        {
            assert.deepEqual(ex, new InvalidServicePackageError("Service package 'some-non-service-plugin-that-does-not-exist' not found."));
        }


    });

    it("should return the manifest file", function() {

        var path = process.env.PWD + "/test/assets/service-package/simple-docker";



        var manifest = Build.GetServicePackageManifest(path, "test");


        assert.deepEqual(manifest, require("./../../assets/service-package/simple-docker/manifest.json"));


    });

    it("should throw an error if service package manifest does not exist.", function() {

        var path = "/Users/bla/some-service-package-that-does-not-exist";

        try
        {
            Build.GetServicePackageManifest(path, "test");
        }
        catch (ex)
        {
            assert.deepEqual(ex, new InvalidServicePackageError("Missing manifest.json for Service Package '" + path + "'"));
        }

    });

    it("should create a build file using a local (absolute file path) service package", function(){


        var expected_result = {
            "identifier":"test-build",
            "objects":{
                "builds":[

                ],
                "images":[
                    "tutum/hello-world",
                    "tutum/hello-world"
                ],
                "containers":[
                    {
                        "name":"web_1",
                        "detatch":true,
                        "labels":{
                            "com.haystack.identifier":"test-build"
                        },
                        "image":"tutum/hello-world",
                        "ports":[
                            {
                                "container":"80",
                                "host":"4454"
                            }
                        ]
                    },
                    {
                        "name":"web_2",
                        "detatch":true,
                        "labels":{
                            "com.haystack.identifier":"test-build"
                        },
                        "image":"tutum/hello-world",
                        "ports":[
                            {
                                "container":"80",
                                "host":"4455"
                            }
                        ]
                    }
                ],
                "networks":[
                    null,
                    null
                ]
            }
        };



        var haystack_file = {
            "services": {
                "web_1": {
                    "type": "/Users/macmcclain/projects/haystack/haystack-service-packages/docker.container",
                    "image": "tutum/hello-world",
                    "ports": [
                        {
                            "container": "80",
                            "host": "4454"
                        }
                    ]
                },

                "web_2": {
                    "type": "/Users/macmcclain/projects/haystack/haystack-service-packages/docker.container",
                    "image": "tutum/hello-world",
                    "ports": [
                        {
                            "container": "80",
                            "host": "4455"
                        }
                    ]
                }
            }
        };


        var build = new Build("test-build", haystack_file);
        var output = build.build();


        return assert.deepEqual(output, expected_result);


    });


});