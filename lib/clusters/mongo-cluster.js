/*
 * gum.js
 * https://github.com/atimb/gum.js
 *
 * Copyright (c) 2013 Attila Incze
 * Licensed under the MIT license.
 */

'use strict';

var Service = require('./../server/gum').Service,
    Group = require('./../server/gum').Group,
    mongoScripts = require('./scripts/mongo-scripts'),
    iptablesScripts = require('./scripts/iptables-scripts'),
    _ = require('underscore');


var Mongo = {};

Mongo.Cluster = Group.extend({

    shards: [],
    configs: [],
    routers: [],

    initialize: function() {
        var i;
        for (i = 0; i < this.options.shardCount; i++) {
            var shard = new Mongo.Replicaset({
                nodeCount: 2,
                name: 'rs' + i
            });
            shard.on('ready', _.bind(this.shardReady, this, shard));
            this.shards.push(shard);
        }
        for (i = 0; i < this.options.configCount; i++) {
            var config = new Mongo.Config();
            config.on('started', _.bind(this.configReady, this, config));
            this.configs.push(config);
        }
        for (i = 0; i < this.options.routerCount; i++) {
            var router = new Mongo.Router();
            router.on('installed', _.bind(this.routerInstalled, this, router));
            this.routers.push(router);
        }
    },

    shardReady: function(shard) {
        mongoScripts.addShard(this.routers[0], shard);
    },

    routerInstalled: function(router) {
        if (this.configsOnline === this.options.configCount) {
            //router.configure(this.configs);
        } else {
            //this.routersInstalled.push(router);
        }
    },

    configReady: function() {
        this.configsOnline += 1;
        if (this.configsOnline === this.options.configCount) {
            //this.routers.
        }
    }
});


Mongo.DB = Service.extend({

    config: {
        'smallfiles': true
    },

    initialize: function() {
        this.config.replSet = this.options.replSetName;
        this.bootstrap();
    },

    bootstrap: function() {
        iptablesScripts.openPort(this.node, 22017, function() {
            mongoScripts.install(this.node, function() {
                mongoScripts.configure(this.node, this.config, function() {
                    mongoScripts.start(this.node, function() {
                        this.emit('started');
                    }, this);
                }, this);
            }, this);
        }, this);
    }

});


Mongo.Router = Service.extend({

    config: {
        'smallfiles': true
    },

    initialize: function() {
        this.config.replSet = this.options.replSetName;
        this.bootstrap();
    },

    bootstrap: function() {
        mongoScripts.install(this.node, function() {
            this.emit('installed');
        }, this);
    }

});


Mongo.Config = Mongo.DB.extend({

    config: {
        'smallfiles': true,
        'configsvr': true,
        'port': 27017
    }

});


Mongo.Replicaset = Group.extend({

    dbs: [],
    dbsOnline: 0,

    initialize: function() {
        for (var i = 0; i < this.options.nodeCount; i++) {
            var db = new Mongo.DB({
                replSetName: this.options.name
            });
            db.on('started', _.bind(this.addOne, this));
            this.dbs.push(db);
        }
    },

    addOne: function() {
        this.dbsOnline += 1;
        if (this.dbsOnline === this.options.nodeCount) {
            mongoScripts.initReplicaset(this, function() {
                this.emit('ready');
            }, this);
        }
    }

});


new Mongo.Cluster({
    shardCount: 1,
    routerCount: 0,
    configCount: 0
});
