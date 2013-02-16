
var mongoScripts = {
	
	mongoYumRepo = '[10gen]\nname=10gen Repository\nbaseurl=http://downloads-distro.mongodb.org/repo/redhat/os/x86_64\ngpgcheck=0\nenabled=1',
	
	install: function(service, cb) {
		node = service.getNode();
		node.createFile('/etc/yum.repos.d/10gen.repo', this.mongoYumRepo, function() {
			node.cmd('yum install -y mongo-10gen mongo-10gen-server', cb);	
		})
	},
	
	configure: function(service, conf, cb) {
		node = service.getNode();
		var confString = _.map(conf, function(key, value) {
			return key + '=' + value + '\n';
		});
		node.appendFile('/etc/mongod.conf', confString, cb);
	},
	
	start: function(service, cb) {
		node = service.getNode();
		node.cmd('service mongodb start', cb);
	}

};

module.exports = mongoScripts;
