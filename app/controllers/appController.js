var ThyroidController = require('thyroidController');
var ThyroidController2 = require('thyroidController2');
var EventListener = require('eventListener');
var Touch = require('touch');
var EventEmitter = require("eventEmitter");

var appController = function() {
	this.init();
};

appController.prototype.init = function() {
	var thyroidController = new ThyroidController();
};