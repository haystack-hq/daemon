/*
services: {
    "web_1": {
        "type": "docker.container",
        "image": "hello-world",
        "ports": [
            "host": 4455
        ]
    },

    "web_2": {
        "type": "docker.container",
        "image": "hello-world-other-image",
        "ports": [
            "host": 4456
        ]
    }
}

 */


module.exports = function(haystack_service){

    //creates a collection of scripts to execute

    var script = "docker run " + haystack_service.image + ";"


    return {
        scripts: [script]
    };
}