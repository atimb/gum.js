/*
 * gum.js
 *
 * Copyright (c) 2013 Nokia Siemens Networks
 * Licensed under the MIT license.
 */

'use strict';

var provider = require('./cloud-provider'),
    sockets = require('./sockets'),
    spawn = require('child_process').spawn,
    _ = require('underscore'),
    util = require('util'),
    logger = require('winston');

var nodeInstallScript = 'cd /usr/local/src && wget http://nodejs.org/dist/v0.8.9/node-v0.8.9-linux-x64.tar.gz && tar xzf node-v0.8.9-linux-x64.tar.gz && cp -R node-v0.8.9-linux-x64/{bin,include,lib,share} /usr/local';
var gumStartScript = 'cd /root && tar xzf gum.tar.gz && ./bin/gum-client <%= id %> &';

var Node = function() {
    this.provider = provider.get('AWS');
};

Node.prototype.launch = function(cb, that) {
    logger.info('[Node::launch] Launching node');
    this.provider.launchNode(function(err, instanceId, publicDns) {
        logger.info('[Node::launch] Node is up with ID: ' + instanceId + ', public DNS: ' + publicDns);
        this.id = instanceId;
        this.host = publicDns;
        this.send = _.bind(sockets.send, sockets, this.id);
        cb && cb.apply(that);
    }, this);
};

Node.prototype.bootstrap = function(cb, that) {
    logger.info('[Node::bootstrap] Wait to bootstrap node ' + this.id);
    sockets.waitForConnection(this.id, cb, that);
    this.provider.waitForNodeOnline(this.host, function() {
        var self = this;
        setTimeout(function() {
            logger.info('[Node::bootstrap] Bootstrapping node ' + self.id);
            self.provider.executeCommand(self.host, nodeInstallScript, function() {
                self.provider.copyFile(self.host, 'gum.tar.gz', function() {
                    self.provider.executeCommand(self.host, _.template(gumStartScript, self), function() {
                        logger.info('[Node::bootstrap] Gum-client started on ' + self.id);
                    });
                });
            });
        }, 5000);
    }, this);
};

Node.prototype.exec = function(command, params, cb, that) {
    logger.info('[Node::exec] Executing command ' + command + ' ' + params.join(' ') + ' on node ' + this.id);
    this.send('exec', {
        command: command,
        params: params
    }, function(code, stdout) {
        cb && cb.call(that, code, stdout);
    });
};

Node.prototype.createFile = function(filename, content, cb, that) {
    logger.info('[Node::createFile] Creating file ' + filename + ' on node ' + this.id);
    this.send('createFile', {
        filename: filename,
        content: content
    }, function(err) {
        cb && cb.call(that, err);
    });
};

Node.prototype.appendFile = function(filename, content, cb, that) {
    logger.info('[Node::appendFile] Appending to file ' + filename + ' on node ' + this.id);
    this.send('appendFile', {
        filename: filename,
        content: content
    }, function(err) {
        cb && cb.call(that, err);
    });
};


module.exports = Node;
