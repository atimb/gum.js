/*
 * gum.js
 * https://github.com/atimb/gum.js
 *
 * Copyright (c) 2013 Attila Incze
 * Licensed under the MIT license.
 */

'use strict';

var _ = require('underscore'),
    logger = require('winston');


var iptablesScripts = {

    openPortCmd: 'iptables -I INPUT -p tcp -m state --state NEW -m tcp --dport <%= port %> -j ACCEPT',

    openPort: function(node, port, cb, that) {
        logger.info('[iptablesScripts::openPort] Opening port ' + port + ' on ' + node.id);
        node.exec('bash', ['-c', _.template(this.openPortCmd, { port: port })], cb, that);
    }

};

module.exports = iptablesScripts;
