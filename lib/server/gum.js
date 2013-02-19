/*
 * gumjs
 * https://github.com/atimb/gum.js
 *
 * Copyright (c) 2013 Attila Incze
 * Licensed under the MIT license.
 */

'use strict';

var _ = require('underscore'),
    Node = require('./node'),
    sockets = require('./sockets');


var gum = {};


gum.Service = function(options) {
    this.options = options;
    this.node = new Node();
    this.node.launch(function() {
        this.node.bootstrap(function() {
            this.initialize();
        }, this);
    }, this);
};

gum.Service.prototype.initialize = function() {
};

gum.Service.prototype.getNode = function() {
    return this.node;
};

gum.Service.extend = function(props) {
    var parent = this;
    var child = function() {
        parent.apply(this, arguments);
    }
    var Surrogate = function() {
        this.constructor = child;
    };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate();
    _.extend(child.prototype, props);
    child.__super__ = parent.prototype;
    return child;
};


module.exports = gum;
