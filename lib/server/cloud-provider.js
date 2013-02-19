var AWS = require('aws-sdk'),
    util = require('util'),
    _ = require('underscore'),
    spawn = require('child_process').spawn,
    net = require('net');

AWS.config.loadFromPath('config/aws.json');
var ec2 = new AWS.EC2();

var aws = {

    /*
     * Launch EC2 instance
     * Callback when node is running (but not yet online)
     */
    launchNode: function(cb, that) {
        console.log('Creating node...');
        ec2.client.runInstances({
            ImageId: 'ami-cc5af9a5',
            InstanceType: 't1.micro',
            SecurityGroups: ['permissive'],
            KeyName: 'incze',
            MinCount: 1,
            MaxCount: 1
        }, function(err, data) {
            var reservationId = data.ReservationId;

            (function waitToComeUp() {
                ec2.client.describeInstances(function(err, data) {
                    var reservation = _.find(data.Reservations, function(reservation) {
                        return reservation.ReservationId === reservationId;
                    });
                    var instance = reservation.Instances[0];
                    console.log(instance.State.Name);
                    if (instance.State.Name === 'running') {
                        cb.call(that, null, instance.InstanceId, instance.PublicDnsName);
                    } else {
                        setTimeout(waitToComeUp, 5000);
                    }
                });
            })();
        });
    },

    /*
     * Wait until port 22 (sshd) is available
     */
    waitForNodeOnline: function(host, cb, that) {
        var connected = false;
        (function tryConnect() {
            var client = net.connect({
                host: host,
                port: 22
            });
            client.on('connect', function() {
                console.log('Port 22 open');
                connected = true;
                cb && cb.apply(that);
                client.end();
            });
            client.on('error', function() {
                if (!connected) {
                    console.log('Port 22 closed/unreachable');
                    setTimeout(tryConnect, 5000);
                }
            });
        })();
    },

    executeCommand: function(host, command, cb, that) {
        console.log('Executing command: ', command);
        var proc = spawn('ssh', ['-i', 'config/incze.pem', '-o', 'StrictHostKeyChecking no', 'root@' + host, command]);
        proc.on('exit', function(code) {
            console.log('Command returned ', code);
            cb && cb.apply(that);
        });
    },

    copyFile: function(host, file, cb, that) {
        console.log('Copying file: ', file);
        var proc = spawn('scp', ['-i', 'config/incze.pem', '-o', 'StrictHostKeyChecking no', file, 'root@' + host + ':~']);
        proc.on('exit', function(code) {
            console.log('Command returned ', code);
            cb && cb.apply(that);
        });
    }

};


module.exports = {
    get: function(provider) {
        if (provider === 'AWS') {
            return aws;
        } else {
            throw new Error('Provider not available', provider);
        }
    }
};
