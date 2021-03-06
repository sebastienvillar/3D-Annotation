var ThyroidController = require('thyroidController');
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
	var characteristics = ['Echostructure', 'Echogenicity', 'Border', 'Calcification', 'Vascularization', 'ADP'];
	var thyroidController = new ThyroidController(canvas, '/app/json/thyroid.json', function() {
		thyroidController.enableAnnotations();
		var ids = [];
		ids.push(thyroidController.addSphere({x: 0.525,
			y: 0.4294685990338164,
			z: 0.13015710382513662}, {'x': 0.9, 'y': 1.5, 'z': 1}, '#ff0000'));
		ids.push(thyroidController.addSphere({x: 0.525,
			y: 0.7294685990338164,
			z: 0.30015710382513662}, {'x': 0.7, 'y': 0.7, 'z': 1}, '#444444'));
		ids.push(thyroidController.addSphere({x: 0.6,
			y: 0.7391304347826086,
			z: 0.8532445355191256}, {'x': 1, 'y': 0.5, 'z': 0.5}, '#00ff00'));
		ids.push(thyroidController.addSphere({x: 0.4625,
			y: 0.300096618357488,
			z: 0.9075478142076502}, {'x': 1, 'y': 1, 'z': 1.3}, '#0000ff'));
		ids.push(thyroidController.addSphere({x: 0.6125,
			y: 0.7246376811594203,
			z: 0.5103142076502731}, {'x': 0.5, 'y': 0.5, 'z': 0.5}, '#000000'));
		for (var i in ids) {
			thyroidController.setAnnotation(ids[i], characteristics);
		}
	});

	// var div = document.createElement('div');
	// div.style.width = 800;
	// div.style.height = 300;
	// document.body.appendChild(div);
	// var positioningController = new PositioningController(div, thyroidController);
};