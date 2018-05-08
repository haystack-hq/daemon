'use strict';

var fs = require("fs-extra");
var path = require('path');


var Provider = function(path_to_provider) {
    this.provider_path = path_to_provider;

    //load the manifest file.
    this.manifest = fs.readJsonSync(path.join(this.provider_path, "manifest.json"));

    this.id = this.manifest.id;
    this.modes = this.manifest.modes;
    this.default_network = this.manifest.default_network;

}

module.exports = Provider;
