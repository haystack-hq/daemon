
module.exports = function(haystack_service){

    var image = haystack_service.image;
    var ports = null;
    var network = null;


    if(haystack_service.ports){
        ports = haystack_service.ports;
    }

    //create the container def;
    var container = {
        "image": image,
        "ports": ports,
        "network": network
    };


    return container;
}

