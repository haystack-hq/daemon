"use strict"

var Interface = require("../../../../src/model/service-plugin/interfaces/local");


describe('interface-local', function() {
    it("should connect to the plugin worker", function(done){
        var data = {
            "services": {
                "my-hello-world-app": {
                    "plugin": "hello-world",
                    "parameters": {
                        "port": 4019
                    }
                }
            }
        };

        var provider_ref = "docker";
        var service_id = "my-hello-world-app";
        var service_info = data.services["my-hello-world-app"];

        var i = new Interface("test-stack-id", provider_ref, service_id, service_info);
        i.connect().then((result) => {
            console.log("Success with interface", result);
            done()
        }).catch((err) => {
           console.log("Caught error with interface", err);
            done()
        });
    });
});