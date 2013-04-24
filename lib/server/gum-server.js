/*
 * gum.js
 *
 * Copyright (c) 2013 Nokia Siemens Networks
 * Licensed under the MIT license.
 */

'use strict';

var sockets = require('./sockets'),
    logger = require('winston'),
    spawn = require('child_process').spawn;


module.exports.start = function(config) {

    sockets.listen(config.port);

    var proc = spawn('bash', ['-c', 'tar czf gum.tar.gz *']);
    proc.on('exit', function(code) {
        logger.info('[gum-server] Created archive gum.tar.gz');
    });

    require('../clusters/mongo-cluster');

};
