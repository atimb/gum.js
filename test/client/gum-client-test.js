/*
 * gum.js
 *
 * Copyright (c) 2013 Nokia Siemens Networks
 * Licensed under the MIT license.
 */

'use strict';


var socketio = require('socket.io'),
    gumClient = require('../../lib/client/gum-client'),
    expect = require('chai').expect;


describe('Gum client', function() {

    it('connects to the configured gum-server', function(done) {
        var io = socketio.listen(19262, function() {
            gumClient.start({
                host: 'localhost',
                id: 'abc123',
                port: 19262
            });
        });

        io.sockets.on('connection', function(socket) {
            socket.on('checkin', function(data) {
                expect(data.id).to.equal('abc123');
                done();
            });
        });
    });

});
