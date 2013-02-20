/*
 * gum.js
 * https://github.com/atimb/gum.js
 *
 * Copyright (c) 2013 Attila Incze
 * Licensed under the MIT license.
 */

'use strict';

var _ = require('underscore'),
    Node = require('./node'),
    sockets = require('./sockets'),
    util = require("util"),
    events = require("events");


var gum = {};


gum.Service = function(options) {
    events.EventEmitter.call(this);
    this.options = options || {};
    this.node = new Node();
    this.node.launch(function() {
        this.node.bootstrap(function() {
            this.initialize();
        }, this);
    }, this);
};

util.inherits(gum.Service, events.EventEmitter);

gum.Service.prototype.initialize = function() {
};


gum.Group = function(options) {
    events.EventEmitter.call(this);
    this.options = options || {};
    this.initialize();
};

util.inherits(gum.Group, events.EventEmitter);

gum.Group.prototype.initialize = function() {
};


gum.Group.extend = gum.Service.extend = function extend(props) {
    var parent = this;
    var child = function() {
        parent.apply(this, arguments);
    };
    var Surrogate = function() {
        this.constructor = child;
    };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate();
    _.extend(child.prototype, props);
    child.__super__ = parent.prototype;
    child.extend = extend;
    return child;
};


module.exports = gum;
