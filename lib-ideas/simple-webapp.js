/*
 * gum.js
 *
 * Copyright (c) 2013 Nokia Siemens Networks
 * Licensed under the MIT license.
 */

var App = Gum.Cluster.extend({

    contains: [
        {
            name: 'App.Nginx'
        },
        {
            name: 'App.WebApp'
        },
        {
            name: 'App.Mongo'
        }
    ],

    initialize: function() {
        var mongo = this.mongo = new App.Mongo(this);
        var webapp = this.webapp = new App.WebApp(this);
        var nginx = this.nginx = new App.Nginx(this);

        mongo.on('started', function(mongo) {
            webapp.addMongo(mongo);
        });
        webapp.on('started', function(webapp) {
            nginx.addWebapp(webapp);
        });
    }


});


App.Nginx = Gum.Service.extend({

    webapps: [],

    initialize: function() {
        nginxScripts.install(this, function() {
            this.installed = true;
            this.reconfigure();
        });
    },

    reconfigure: function() {
        if (!this.installed) {
            return;
        }
        nginxScripts.configure(this, this.webapps, function() {
            nginxScripts.reload(this, function() {
                this.emit('started');
            });
        })
    },

    addWebapp: function(webapp) {
        this.webapps.push(webapp);
        this.reconfigure();
    }

});


App.WebApp = Gum.Service.extend({

    initialize: function() {
        webappScripts.install(this);
    },

    addMongo: function(mongo) {
        var self = this;
        webappScripts.configure(self, mongo, function() {
            webappScripts.start(self, function() {
                self.emit('started');
            });
        });
    }

});


App.Mongo = Gum.Service.extend({

    config: {
        'smallfiles': true
    },

    initialize: function() {
        mongoScripts.install(this, function() {
            mongoScripts.configure(this, this.config, function() {
                mongoScripts.start(this, function() {
                    this.emit('started', this);
                });
            });
        });
    }

});
