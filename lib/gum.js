

Gum.Node = function() {

}

Gum.Cluster = function() {

}


Mongo.Cluster = Gum.Cluster.extend({

	contains: [{
		name: 'Mongo.Replicaset',
		count: { min: 1 }
	}, {
		name: 'Mongo.Config',
		count: [1, 3]
	}, {
		name: 'Mongo.Router',
		count: { min: 1 }
	}],
	
	initialize: function() {
		this.replicasets = [ new Mongo.Replicaset() ];
		this.config = new Mongo.Config();
	},

	start: function() {
		this.replicasets[0].start();
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
	
	startup: function() {
		mongoScripts.install(this, function() {
			mongoScripts.applyConfig(_.extend(this.config), {
				'replSet': this.replSet
			}), function() {
				mongoScripts.start(this, function() {
					this.trigger('#configured');
				});
			});
		});
	}
	
});


Mongo.Replicaset = Gum.Cluster.extend({
	
	contains: [{
		name: 'Mongo.DB',
		count: { min: 2, max: 3 }
	}];
	
	events: {
		'Mongo.DB': {
			'#configured': 'addOne',
		}
	},
	
	addOne: function(node) {
		this.online += 1;
		if (this.online === this.size) {
			mongoScripts.initReplSet(this, function cb() {
				this.trigger('#replset-online');
			});
		}
	}
	
});





// Describe deployment

{
	"Mongo.Cluster": {
		"Mongo.Config": 3,
		"Mongo.Router": 1,
		"Mongo.Replicaset": [
			{ "Mongo.DB": 3 },
			{ "Mongo.DB": 3 }
		]
	}
}
