var provider = require('./cloud-provider'),
    sockets = require('./sockets'),
    spawn = require('child_process').spawn,
    _ = require('underscore'),
    util = require('util');

var nodeInstallScript = 'cd /usr/local/src && wget http://nodejs.org/dist/v0.8.9/node-v0.8.9-linux-x64.tar.gz && tar xzf node-v0.8.9-linux-x64.tar.gz && cp -R node-v0.8.9-linux-x64/{bin,include,lib,share} /usr/local';
var gumStartScript = 'cd /root && tar xzf gum.tar.gz && node lib/client/gum-client.js %s &';

Node = function() {
    this.provider = provider.get('AWS');
};

Node.prototype.launch = function(cb, that) {
    this.provider.launchNode(function(err, instanceId, publicDns) {
        console.log('Node is up with ID: %s, public DNS: %s', instanceId, publicDns);
        this.id = instanceId;
        this.host = publicDns;
        this.send = _.bind(sockets.send, sockets, this.id);
        cb.apply(that);
    }, this);
};

Node.prototype.bootstrap = function(cb, that) {
    sockets.waitForConnection(this.id, cb, that);
    this.provider.waitForNodeOnline(this.host, function() {
        var self = this;
        setTimeout(function() {
            self.provider.executeCommand(self.host, nodeInstallScript, function() {
                var proc = spawn('bash', ['-c', 'tar czf gum.tar.gz *']);
                proc.on('exit', function(code) {
                    self.provider.copyFile(self.host, 'gum.tar.gz', function() {
                        self.provider.executeCommand(self.host, util.format(gumStartScript, self.id));
                    });
                });
            });
        }, 10000);
    }, this);
};

Node.prototype.exec = function(command, params, cb, that) {
    this.send('exec', {
        command: command,
        params: params
    }, function(result) {
        cb.apply(that);
    });
};

Node.prototype.createFile = function(filename, content, cb, that) {
    this.send('createFile', {
        filename: filename,
        content: content
    }, function(result) {
        cb.apply(that)
    });
};

Node.prototype.appendFile = function(filename, content, cb, that) {
    this.send('appendFile', {
        filename: filename,
        content: content
    }, function(result) {
        cb.apply(that)
    });
};


module.exports = Node;
