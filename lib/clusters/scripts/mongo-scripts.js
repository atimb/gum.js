/*
 * gum.js
 *
 * Copyright (c) 2013 Nokia Siemens Networks
 * Licensed under the MIT license.
 */

'use strict';

var _ = require('underscore'),
    logger = require('winston');


var mongoScripts = {

    mongoYumRepo: '[10gen]\nname=10gen Repository\nbaseurl=http://downloads-distro.mongodb.org/repo/redhat/os/x86_64\ngpgcheck=0\nenabled=1',

    initReplsetCmd: 'config = { _id: "<%= options.name %>", members: [ <% _.each(dbs, function(db, key) { %> { _id: <%= key %>, host: "<%= db.node.host %>:27017" }, <% }); %> ] }; rs.initiate(config);',

    initShardCmd: 'db.adminCommand( { addShard: "<%= options.name %>/<%= dbs[0].node.host %>:27017" } );',

    install: function(node, cb, that) {
        logger.info('[mongoScripts::install] Installing mongodb on ' + node.id);
        node.createFile('/etc/yum.repos.d/10gen.repo', this.mongoYumRepo, function() {
            node.exec('yum', ['install', '-y', 'mongo-10gen', 'mongo-10gen-server'], cb, that);
        });
    },

    configure: function(node, conf, cb, that) {
        logger.info('[mongoScripts::configure] Configuring mongodb on ' + node.id);
        var confString = _.map(conf,function(value, key) {
            return key + '=' + value;
        }).join('\n');
        node.appendFile('/etc/mongod.conf', confString, cb, that);
    },

    start: function(node, cb, that) {
        logger.info('[mongoScripts::start] Starting mongodb on ' + node.id);
        node.exec('service', ['mongod', 'start'], cb, that);
    },

    initReplicaset: function(replset, cb, that) {
        var command = _.template(this.initReplsetCmd, replset);
        logger.info('[mongoScripts::initReplicaset] Initializing replicaset with command ' + command);
        var primary = replset.dbs[0].node;
        var tries = 1;
        primary.exec('mongo', ['--eval', command], function tryCheck() {
            primary.exec('mongo', ['--quiet', '--eval', 'rs.status().members[0].stateStr'], function(code, stdout) {
                if (tries < 10 && stdout !== 'PRIMARY') {
                    logger.info('[mongoScripts::initReplicaset] Not yet primary, retry #' + tries++);
                    setTimeout(tryCheck, 15000);
                } else if (stdout !== 'PRIMARY\n') {
                    logger.warn('[mongoScripts::initReplicaset] Primary failed to come up, error is ' + stdout);
                    cb && cb.call(that, 'no-primary');
                } else {
                    logger.info('[mongoScripts::initReplicaset] Primary is elected');
                    cb && cb.call(that);
                }
            });
        });
    },

    addShard: function(router, shard, cb, that) {
        var command = _.template(this.initShardCmd, shard);
        logger.info('[mongoScripts::addShard] Adding shard with command ' + command);
        router.node.exec('mongo', ['--eval', command], cb, that);
    }

};

module.exports = mongoScripts;
