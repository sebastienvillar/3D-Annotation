var ThyroidController = require('thyroidController');
var ThyroidController2 = require('thyroidController2');
var PositioningController = require('positioningController');
var EventListener = require('eventListener');
var Touch = require('touch');
var EventEmitter = require("eventEmitter");

var appController = function() {
	this.init();
};

appController.prototype.init = function() {
	var canvas = document.createElement('canvas');
	document.body.appendChild(canvas);
	canvas.width = canvas.clientWidth;
	canvas.height = canvas.clientHeight;
	var thyroidController = new ThyroidController(canvas);

	var div = document.createElement('div');
	div.style.width = 800;
	div.style.height = 300;
	document.body.appendChild(div);
	var positioningController = new PositioningController(div, thyroidController);
};