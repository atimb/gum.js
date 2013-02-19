var sockets = require('./sockets'),
    Service = require('./gum').Service,
    mongoScripts = require('./mongo-scripts');


var conf = require('../../config/server.json');
sockets.listen(conf.port);


var Mongo = Service.extend({

    config: {
        'smallfiles': true
    },

    initialize: function() {
        console.log('Initializing');
        mongoScripts.install(this.node, function() {
            console.log('Installed');
            mongoScripts.configure(this.node, this.config, function() {
                console.log('Configured');
                mongoScripts.start(this.node, function() {
                    console.log('Started');
                }, this);
            }, this);
        }, this);
    }

});


var mongo = new Mongo();
