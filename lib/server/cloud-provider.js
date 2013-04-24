/*
 * gum.js
 *
 * Copyright (c) 2013 Nokia Siemens Networks
 * Licensed under the MIT license.
 */

'use strict';

var AWS = require('aws-sdk'),
    util = require('util'),
    _ = require('underscore'),
    spawn = require('child_process').spawn,
    net = require('net'),
    logger = require('winston');

AWS.config.loadFromPath('config/aws.json');
var ec2 = new AWS.EC2();

var aws = {

    /*
     * Launch EC2 instance
     * Callback when node is running (but not yet online)
     */
    launchNode: function(cb, that) {
        logger.info('[aws::launchNode] Launching EC2 instance');
        ec2.client.runInstances({
            ImageId: 'ami-cc5af9a5',
            InstanceType: 't1.micro',
            SecurityGroups: ['permissive'],
            KeyName: 'incze',
            MinCount: 1,
            MaxCount: 1
        }, function(err, data) {
            var reservationId = data.ReservationId;
            logger.info('[aws::launchNode] Reservation id ' + reservationId);

            (function waitToComeUp() {
                ec2.client.describeInstances(function(err, data) {
                    var reservation = _.find(data.Reservations, function(reservation) {
                        return reservation.ReservationId === reservationId;
                    });
                    var instance = reservation.Instances[0];
                    logger.info('[aws::launchNode] Instance ' + instance.InstanceId + ' state: ' + instance.State.Name);
                    if (instance.State.Name === 'running') {
                        cb.call(that, null, instance.InstanceId, instance.PublicDnsName);
                    } else {
                        setTimeout(waitToComeUp, 10000);
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
            logger.info('[aws::waitForNodeOnline] Connecting on port 22 to ' + host);
            var client = net.connect({
                host: host,
                port: 22
            });
            client.on('connect', function() {
                logger.info('[aws::waitForNodeOnline] Port 22 open at ' + host);
                connected = true;
                cb && cb.call(that);
                client.end();
            });
            client.on('error', function() {
                if (!connected) {
                    logger.info('[aws::waitForNodeOnline] Port 22 closed/unreachable at ' + host);
                    setTimeout(tryConnect, 10000);
                }
            });
        })();
    },

    executeCommand: function(host, command, cb, that) {
        var tries = 1;
        (function tryRun() {
            logger.info('[aws::executeCommand] Executing command ' + command + ' on ' + host);
            var proc = spawn('ssh', ['-i', 'config/incze.pem', '-o', 'StrictHostKeyChecking no', 'root@' + host, command]);
            proc.on('exit', function(code) {
                if (tries < 3 && code === 255) {
                    logger.info('[aws::executeCommand] Connection error, retry #' + tries++);
                    setTimeout(tryRun, 5000);
                } else if (code !== 0) {
                    logger.info('[aws::executeCommand] Command failed, code: ' + code);
                    cb && cb.call(that, code);
                } else {
                    logger.info('[aws::executeCommand] Command succeeded');
                    cb && cb.call(that);
                }
            });
        })();
    },

    copyFile: function(host, file, cb, that) {
        logger.info('[aws::copyFile] Copying file ' + file + ' to ' + host);
        var proc = spawn('scp', ['-i', 'config/incze.pem', '-o', 'StrictHostKeyChecking no', file, 'root@' + host + ':~']);
        proc.on('exit', function(code) {
            logger.info('[aws::copyFile] File copy returned ' + code);
            cb && cb.call(that);
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
