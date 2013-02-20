/*
 * gum.js
 * https://github.com/atimb/gum.js
 *
 * Copyright (c) 2013 Attila Incze
 * Licensed under the MIT license.
 */

'use strict';

var io = require('socket.io-client'),
    spawn = require('child_process').spawn,
    fs = require('fs'),
    _ = require('underscore'),
    logger = require('winston');


module.exports.start = function(config) {

    var socket = io.connect(config.host, {
        port: config.port
    });

    socket.on('connect', function() {
        logger.info('[gum-client] Connected to gum-server');
        socket.emit('checkin', {
            id: config.id
        });
    });

    socket.on('exec', function(data, cb) {
        logger.info('[gum-client] Executing command ' + data.command + ' ' + data.params.join(' '));
        console.log('Executing command: ', data.command, data.params);
        var proc = spawn(data.command, data.params);
        var stdout = '';
        proc.stdout.on('data', function(data) {
            stdout += data;
        });
        proc.on('exit', function(code) {
            if (code !== 0) {
                logger.warn('[gum-client] Command possibly failed with code ' + code);
            } else {
                logger.info('[gum-client] Command succeeded');
            }
            cb(code, stdout);
        });
    });

    socket.on('createFile', function(data, cb) {
        fs.writeFile(data.filename, data.content, function(err) {
            if (err) {
                logger.error('[gum-client] Error creating file ' + data.filename + ', err: ' + err);
            } else {
                logger.info('[gum-client] Success creating file ' + data.filename);
            }
            cb(err);
        });
    });

    socket.on('appendFile', function(data, cb) {
        fs.appendFile(data.filename, data.content, function(err) {
            if (err) {
                logger.error('[gum-client] Error appending to file ' + data.filename + ', err: ' + err);
            } else {
                logger.info('[gum-client] Success appending to file ' + data.filename);
            }
            cb(err);
        });
    });

    socket.on('disconnect', function() {
        logger.info('[gum-client] Disconnected from gum-server');
    });

};

