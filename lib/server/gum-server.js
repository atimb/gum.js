var sockets = require('./sockets'),
    logger = require('winston'),
    spawn = require('child_process').spawn;


var conf = require('../../config/server.json');
sockets.listen(conf.port);

var proc = spawn('bash', ['-c', 'tar czf gum.tar.gz *']);
proc.on('exit', function(code) {
    logger.info('[gum-server] Created archive gum.tar.gz');
});

require('../clusters/mongo-cluster');

//var Mongo = Service.extend({
//
//    config: {
//        'smallfiles': true
//    },
//
//    initialize: function() {
//        console.log('Initializing');
//        mongoScripts.install(this.node, function() {
//            console.log('Installed');
//            mongoScripts.configure(this.node, this.config, function() {
//                console.log('Configured');
//                mongoScripts.start(this.node, function() {
//                    console.log('Started');
//                }, this);
//            }, this);
//        }, this);
//    }
//
//});
//
//
//var mongo = new Mongo();
