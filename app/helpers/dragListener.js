var EventEmitter = require('eventEmitter');
var DragEvent = require('dragEvent');

var MIN_DRAG_DISTANCE = 10;
var MIN_TOUCH_RATIO = 0.9;

//Public
var dragListener = function(domElement) {
	EventEmitter.call(this);

	this.domElement = domElement;
	this.started;
	this.ended;
	this.dragging;

	this.lastPoint;
	this.distance;
};


dragListener.prototype = new EventEmitter();

dragListener.prototype.START_EVENT_NAME = 'dragStart';
dragListener.prototype.MOVE_EVENT_NAME = 'dragMove';
dragListener.prototype.END_EVENT_NAME = 'dragEnd';
dragListener.prototype.EVENT_NAMES = [dragListener.prototype.START_EVENT_NAME, 
									  dragListener.prototype.MOVE_EVENT_NAME,
									  dragListener.prototype.END_EVENT_NAME];

dragListener.prototype.start = function(points) {
	this.started = true;
	this.ended = false;
	this.dragging = false;
	this.lastPoint = this.centerPoint(points);
	this.distance = {'x': 0, 'y': 0};
};

dragListener.prototype.move = function(points) {
	if (this.started) {
		var centerPoint = this.centerPoint(points);
		if (this.dragging) {
			this.trigger(this.MOVE_EVENT_NAME, new DragEvent(centerPoint, points.length, this.domElement));
		}
		else {
			this.distance['x'] += centerPoint['x'] - this.lastPoint['x'];
			this.distance['y'] += centerPoint['y'] - this.lastPoint['y'];
			if (Math.abs(this.distance['x']) > MIN_DRAG_DISTANCE || Math.abs(this.distance['y']) > MIN_DRAG_DISTANCE) {
				this.trigger(this.START_EVENT_NAME, new DragEvent(centerPoint, points.length, this.domElement));
				this.dragging = true;
			}
		}
		this.lastPoint = centerPoint;
	}
	else {
		this.start(points);
	}
};

dragListener.prototype.end = function(points) {
	if (this.started && this.dragging) {
		this.started = false;
		this.ended = true;
		this.dragging = false;
		this.trigger(this.END_EVENT_NAME, new DragEvent(this.centerPoint(points), points.length, this.domElement));
	}
};

dragListener.prototype.pushHandler = function(eventName, handler) {
	if (this.EVENT_NAMES.indexOf(eventName) != -1)
		this.on(eventName, handler);
};

dragListener.prototype.removeHandler = function(eventName, handler) {
	if (this.EVENT_NAMES.indexOf(eventName) != -1)
		this.off(eventName, handler);
};

//Private

dragListener.prototype.centerPoint = function(points) {
	var sumPoint = points.reduce(function(p1, p2) {
		return {'x': p1['x'] + p2['x'], 'y': p1['y'] + p2['y']};
	});

	sumPoint['x'] /= points.length;
	sumPoint['y'] /= points.length;
	return sumPoint;
};

