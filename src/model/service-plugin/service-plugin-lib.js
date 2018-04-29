const path = require("path");
var fs  = require('fs-extra');

var ServicePluginLib = {};

/* return a list of libs */
ServicePluginLib.GetLibs = function(){

    var libs = [];

    var folder = path.join(__dirname,  'service-plugin-provider/lib');

    //get all the libs.
    fs.readdirSync(folder).forEach(file => {
       libs.push({
           "name": path.basename(file, '.js'),
           "path": path.join(folder, file)
       });
    });

    return libs;

}



module.exports = ServicePluginLib;