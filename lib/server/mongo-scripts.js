var _ = require('underscore');


var mongoScripts = {

    mongoYumRepo: '[10gen]\nname=10gen Repository\nbaseurl=http://downloads-distro.mongodb.org/repo/redhat/os/x86_64\ngpgcheck=0\nenabled=1',

    install: function(node, cb, that) {
        node.createFile('/etc/yum.repos.d/10gen.repo', this.mongoYumRepo, function() {
            node.exec('yum', ['install', '-y', 'mongo-10gen', 'mongo-10gen-server'], cb, that);
        });
    },

    configure: function(node, conf, cb, that) {
        var confString = _.map(conf, function(value, key) {
            return key + '=' + value + '\n';
        });
        node.appendFile('/etc/mongod.conf', confString, cb, that);
    },

    start: function(node, cb, that) {
        node.exec('service', ['mongod', 'start'], cb, that);
    }

};

module.exports = mongoScripts;
