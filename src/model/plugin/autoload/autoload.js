const path = require("path");
var fs  = require('fs-extra');

var Autoload = {};

/* return a list of libs */
Autoload.GetLibs = function(){

    var libs = [];

    var folder = path.join(__dirname,  'libs');

    //get all the libs.
    fs.readdirSync(folder).forEach(file => {
       libs.push({
           "name": path.basename(file, '.js'),
           "path": path.join(folder, file)
       });
    });

    return libs;

}



module.exports = Autoload;