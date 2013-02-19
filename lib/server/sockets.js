var socketio = require('socket.io');

var sockets = {},
    waitFor = {};

module.exports.listen = function(port) {

    var io = socketio.listen(port, {
        'log level': 1
    });

    io.sockets.on('connection', function(socket) {

        socket.on('checkin', function(data) {
            var id = data.id;
            console.log('Checking in with ID ', id, waitFor);
            sockets[id] = socket;
            if (waitFor[id]) {
                console.log("calling callback", waitFor[id].cb);
                waitFor[id].cb.apply(waitFor[id].that);
            }
        });

        socket.on('disconnect', function() {
            console.log('over');
        });
    });
};

module.exports.send = function(nodeId) {
    var args = [].slice.call(arguments, 0);
    args.splice(0, 1);
    var socket = sockets[nodeId];
    if (socket) {
        socket.emit.apply(socket, args);
    } else {
        console.log('Cannot find socket with id ', nodeId);
    }
};

module.exports.waitForConnection = function(nodeId, cb, that) {
    waitFor[nodeId] = {
        cb: cb,
        that: that
    };
};
