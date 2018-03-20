/* creates local builds from haystack file */
var fs  = require('fs-extra');
var homedir = require("homedir");
var InvalidServicePluginError = require("./../../errors/invalid-service-package-error");

var LocalBuild = function(identifier, haystack_file){
    this.identifier = identifier;
    this.haystack_file = haystack_file;


    //init
    this.service_plugin_path = LocalBuild.GetServicePackagePath();
    fs.ensureDirSync(this.service_plugin_path);



}

LocalBuild.GetServicePackagePath = function(){
    return homedir() + "/.haystack/service-plugins/";
}


LocalBuild.prototype.build = function () {
    var self = this;



    var builds = [];
    var images = [];
    var networks = [];
    var containers = [];


    //loop all services and create containers
    for( service_name in this.haystack_file.services)
    {
        try
        {

            var service = self.haystack_file.services[service_name];



            //get the package for this service.
            var package = LocalBuild.GetServicePackage(service.type);


            //run the local build.
            var path_to_local =  package.path + "/" + package.manifest.local_build;
            if(!fs.pathExistsSync(path_to_local)) throw ("Manifest points to '" + package.manifest.local_build + "' that does not exists.")
            var local_build = require(path_to_local);

            //execute the exported function of the local build.
            var output = local_build(service);


            //merge labels
            var labels = {}
            if(output.labels){
                labels = output.labels;
            }
            labels["com.haystack.identifier"] = this.identifier;


            //generate the container.
            containers.push(
                {
                    name: service_name,
                    detatch: true,
                    labels: labels,

                    image: output.image,
                    ports: output.ports
                }
            );


            //pull out image.
            //todo: only add unique images. right now all images might get duplicated.
            images.push(output.image);

            //put out network.
            networks.push(output.network);

        }
        catch (ex){
            throw ex;
        }


    } //end services loop



    //create the build file output.
    var build = {
        identifier: this.identifier,
        objects: {
            builds: builds,
            images: images,
            containers: containers,
            networks: networks
        }
    }


    return build;



}



LocalBuild.GetServicePackage = function (package_name) {
    var path = null;

    var service_plugin_path = LocalBuild.GetServicePackagePath();


    //check to see if this is an absolute path.
    var pathAbsolute = fs.pathExistsSync(package_name);


    //check to see if this package is available locally.
    var pathExisting = fs.pathExistsSync(service_plugin_path + "/" + package_name);


    if(pathAbsolute)
    {
        path = package_name;
    }
    else if(pathExisting){
        path = service_plugin_path + package_name;
    }
    else{
        throw new InvalidServicePluginError( "Service package '" + package_name + "' not found.");
    }


    //validate
    var manifest = LocalBuild.GetServicePackageManifest(path, package_name);

    LocalBuild.ValidateServicePackageManifest(manifest, path, package_name);


    return {
        path: path,
        manifest: manifest
    };

}


LocalBuild.GetServicePackageManifest = function (path, name) {

    var manifestFilePath = path + "/manifest.json";

    if(!fs.pathExistsSync(manifestFilePath)){
        throw new InvalidServicePluginError("Missing manifest.json for Service Package at '" + manifestFilePath + "'");
    }

    var manifest = require(manifestFilePath);

    return manifest;

}


LocalBuild.ValidateServicePackageManifest = function (manifest, path, name) {

    if(!manifest.name) throw ("Missing parameter 'Name' in manifest. " + name);
    if(!manifest.version) throw ("Missing parameter 'Version' in manifest. " + name);
    if(!manifest.local_build) throw ("Missing parameter 'local_build' in manifest. " + name);
    if(!manifest.properties) throw ("Missing parameter 'properties' in manifest. " + name);

}

module.exports = LocalBuild;
