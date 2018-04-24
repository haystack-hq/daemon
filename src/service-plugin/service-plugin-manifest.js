'use strict';

var path = require('path');
var fs  = require('fs-extra');
var Logger = require("../../src/lib/logger");
var Validator = require('jsonschema').Validator;

var ServicePluginManifest = function(manifest_file_path){

    Logger.log('debug', 'Init ServicePluginManifest with file ['+ manifest_file_path + ']');

    this.manifest_file_path = manifest_file_path;

    if(!fs.pathExistsSync(this.manifest_file_path)){
        throw new Error("Manifest file at [" + manifest_file_path + "] does not exist.");
    }

    this.errors = [];


}


ServicePluginManifest.prototype.validate = function() {
    //validate the manifest file.

    this.errors = [];

    try
    {
        Logger.log('debug', 'Validating the Service Plugin Manifest', { manifest_file_path: this.manifest_file_path });

        //validate that the file exists.
        if(!fs.pathExistsSync(this.manifest_file_path)){
            var msg = "The manifest file at [" + this.manifest_file_path + "] does not exists.";
            Logger.log('info', msg);
            this.errors.push(msg);
            return;
        }
        else
        {
            Logger.log('debug', 'Service Plugin Manifest file exists');
        }


        //validate that the format is valid json.
        try{
            fs.readJsonSync(this.manifest_file_path, {throw: true});
            Logger.log('debug', 'Service Plugin Manifest file is valid JSON');
        }
        catch(ex)
        {
            var msg = "The manifest file at [" + this.manifest_file_path + "] is not valid json.";
            Logger.log('info', msg);
            this.errors.push(msg);
            return;
        }

        this.manifest = fs.readJsonSync(this.manifest_file_path);


        //validate the schema
        this.validateSchema();


    }
    catch (ex)
    {
        throw ex;
    }




    //validate the dev-interface


}

ServicePluginManifest.prototype.validateSchema = function() {

    var valid = true;


    //validate specific attributes
    var validator = new Validator();
    var schema = {
        "type": "object",
        "properties": {
            "name": {"type": "string", "required": true }
        }
    };


    var validateJsonResult = validator.validate(this.manifest, schema);


    validateJsonResult.errors.forEach((err) => {
        var stack = err.stack.replace("instance.", "");
        this.errors.push("Manifest file error [property " + stack + "]");
        valid = false;
    });


    return valid;

}



ServicePluginManifest.prototype.hasErrors = function() {
    return this.errors.length > 0 ? true : false;
}


module.exports = ServicePluginManifest;