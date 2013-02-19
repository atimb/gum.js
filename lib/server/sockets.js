var socketio = require('socket.io'),
    logger = require('winston');


var sockets = {},
    waitFor = {};


var sockets = {

    listen: function(port) {

        var io = socketio.listen(port, {
            'log level': 1
        });

        io.sockets.on('connection', function(socket) {

            socket.on('checkin', function(data) {
                var id = data.id;
                logger.info('[sockets::listen] Client check-in with id ' + id);
                sockets[id] = socket;
                if (waitFor[id]) {
                    waitFor[id].cb.apply(waitFor[id].that);
                } else {
                    logger.warn('[sockets::listen] Cannot find client id ' + id);
                }
            });

            socket.on('disconnect', function() {
                logger.warn('[sockets::listen] Client disconnected');
            });
        });
    },

    send: function(nodeId) {
        var args = [].slice.call(arguments, 0);
        args.splice(0, 1);
        var socket = sockets[nodeId];
        if (socket) {
            socket.emit.apply(socket, args);
        } else {
            logger.warn('[sockets::send] Cannot find client id ' + nodeId);
        }
    },

    waitForConnection: function(nodeId, cb, that) {
        waitFor[nodeId] = {
            cb: cb,
            that: that
        };
    }
};

module.exports = sockets;
