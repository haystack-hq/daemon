'use strict'

var path = require("path");
var fs = require("fs-extra");

var Manifest = {};


/* parse a json value for a file or json. returns json or throws error */
Manifest.ParseValue = function(relative_file_path, value){
    var result = null;

    try
    {

        if(typeof(value) == "object"){
            var clone = Object.assign({}, value);
            result = clone;
        }
        else
        {
            //check to see if it is a file.
            var file_path = path.resolve( relative_file_path, value);
            if(fs.pathExistsSync(file_path))
            {
                try
                {
                    result = fs.readJsonSync(file_path);
                }
                catch(err)
                {
                    throw new Error("The file [" + value + "] does not appear to be valid JSON. ");
                }

            }
            else
            {
                throw new Error("The file [" + value + "] could not be found. Please check the file path.");
            }

        }


        return result;
    }
    catch(err){
        throw new Error(err);
    }


}


module.exports = Manifest;