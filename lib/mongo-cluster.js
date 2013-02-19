Gum.Node = function() {

}

Gum.Cluster = function() {

}


Mongo.Cluster = Gum.Cluster.extend({

    shards: [],
    configs: [],
    routers: [],

    initialize: function() {
        for (var i = 0; i < this.options.shardCount; i++) {
            var shard = new Mongo.Replicaset({
                name: 'rs' + i
            });
            shard.on('ready', _.bind(this.shardReady, this, shard));
            this.shards.push(shard);
        }

        for (var i = 0; i < this.options.configCount; i++) {
            var config = new Mongo.Config();
            config.on('ready', _.bind(this.configReady, this, config));
            this.configs.push(config);
        }

        for (var i = 0; i < this.options.routerCount; i++) {
            var router = new Mongo.Router();
            router.on('installed', _.bind(this.routerInstalled, this, router));
            this.routers.push(router);
        }
    },

    shardReady: function(shard) {
        mongoScripts.initShards(this, {
            shards: [shard]
        });
    },

    routerInstalled: function(router) {
        if (this.configsOnline === this.options.configCount) {
            router.configure(this.configs);
        } else {
            this.routersInstalled.push(router);
        }
    }

    configReady: function() {
        this.configsOnline += 1;
        if (this.configsOnline === this.options.configCount) {
            this.routers.
        }
    }
});


Mongo.Config = Mongo.DB.extend({

    config: {
        'smallFiles': true
        'configsvr': true
        'port': 27017
    }

});


Mongo.DB = Gum.Service.extend({

    config: {
        'smallFiles': true
    }

    events: {
        '#startup': 'startup'
    },

    initialize: function() {
        this.config.replSet = this.options.replSetName;
        this.install();
    },

    install: function() {
        mongoScripts.install(this, function() {
            mongoScripts.applyConfig(this.config), function() {
                mongoScripts.start(this, function() {
                    this.trigger('started', this);
                });
            }
            )
            ;
        });
    }

});


Mongo.Replicaset = Gum.Cluster.extend({

        nodes: [],
        nodesOnline: 0,

        initialize: function() {
            for (var i = 0; i < this.options.nodeCount; i++) {
                var db = new Mongo.DB({
                    replSetName: this.options.name;
            }
            )
            ;
            db.on('started', this.addOne, this);
            this.nodes.push();
        }
    },

    addOne
:
function(node) {
    this.nodesOnline += 1;
    if (this.nodesOnline === this.options.nodeCount) {
        mongoScripts.initReplSet(this, {
            name: this.options.name,
            nodes: this.nodes
        }, function() {
            this.trigger('started');
        });
    }
}

})
;


// Describe deployment

{
    "Mongo.Cluster"
:
    {
        "Mongo.Config"
    :
        3,
            "Mongo.Router"
    :
        1,
            "Mongo.Replicaset"
    :
        [
            { "Mongo.DB": 3 },
            { "Mongo.DB": 3 }
        ]
    }
}
