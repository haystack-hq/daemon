'use strict';

const winston = require('winston');
var path = require('path');
var fs  = require('fs-extra');
var homedir = require("homedir");
const env = process.env.NODE_ENV || 'development';


var Logger = function(){

    //set the logging path.
    var log_path = path.join( homedir(), "/.haystack/log/");
    fs.ensureDirSync(log_path);

    const tsFormat = function() {
        (new Date()).toLocaleTimeString();
    }

    //return a logger object.
    return winston.createLogger({
        level: 'silly',
        format: winston.format.simple(),
        transports: [
            new (winston.transports.Console)({
                timestamp: tsFormat,
                colorize: true,
                level: env === 'development' ? 'debug' : 'info'
            }),
            new (winston.transports.File)({
                filename: path.join(log_path, 'daemon.log'),
                timestamp: true,
                level: env === 'development' ? 'debug' : 'info'
            })

        ]
    });

}


module.exports = new Logger();