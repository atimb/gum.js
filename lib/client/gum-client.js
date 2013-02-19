/*
 * gumjs
 * https://github.com/atimb/gum.js
 *
 * Copyright (c) 2013 Attila Incze
 * Licensed under the MIT license.
 */

'use strict';

var io = require('socket.io-client'),
    spawn = require('child_process').spawn,
    fs = require('fs'),
    _ = require('underscore');


var conf = require('../../config/server.json');

if (process.argv[2]) {
    conf.id = process.argv[2];
}

var socket = io.connect(conf.host, {
    port: conf.port
});

socket.emit('checkin', {
    id: conf.id
});

socket.on('connect', function() {
    console.log("Connected to gum-server");
});

socket.on('exec', function(data, cb) {
    console.log('Executing command: ', data.command, data.params);
    var proc = spawn(data.command, data.params);
    proc.on('exit', function(code) {
        console.log('Command returned ', code);
        cb(code);
    });
});

socket.on('createFile', function(data, cb) {
    console.log('Creating file: ', data.filename);
    fs.writeFile(data.filename, data.content, function(err) {
        console.log('File written, error:', err);
        cb(err);
    });
});

socket.on('appendFile', function(data, cb) {
    console.log('Appending to file: ', data.filename);
    fs.appendFile(data.filename, data.content, function(err) {
        console.log('File appended, error:', err);
        cb(err);
    });
});

socket.on('disconnect', function() {
    console.log('Disconnected from gum-server');
});
