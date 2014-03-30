var EventEmitter = require('eventEmitter');
var TapEvent = require('tapEvent');

//Public
var tapListener = function(domElement) {
	EventEmitter.call(this);

	this.domElement = domElement;
	this.started;
	this.ended;

	this.startPoint;
	this.distance;

	this.timeoutID;
};

tapListener.prototype = new EventEmitter();

tapListener.prototype.EVENT_NAME = 'tap';

tapListener.prototype.start = function(points) {
	if (points.length == 1) {
		this.started = true;
		this.ended = false;
		this.startPoint = {'x': points[0]['x'], 'y': points[0]['y']};
		this.distance = {'x': 0, 'y': 0};
		this.timeoutID = setTimeout(function() {
			this.timeoutActive = false;
			if (this.isValid())
				this.trigger(this.EVENT_NAME, new TapEvent(this.startPoint, this.domElement));
		}.bind(this), 250);
		this.timeoutActive = true;
	}
};

tapListener.prototype.move = function(points) {
	if (points.length == 0)
		return;

	if (this.started) {
		this.distance['x'] = points[0]['x'] - this.startPoint['x'];
		this.distance['y'] = points[0]['y'] - this.startPoint['y'];
	}
};

tapListener.prototype.end = function(points) {
	if (this.started) {
		this.started = false;
		this.ended = true;
		if (this.timeoutActive) {
			clearTimeout(this.timeoutID);
			this.timeoutActive = false;
			if (this.isValid())
				this.trigger(this.EVENT_NAME, new TapEvent(this.startPoint, this.domElement));
		}
	}
};

tapListener.prototype.pushHandler = function(eventName, handler) {
	if (eventName == this.EVENT_NAME)
		this.on(eventName, handler);
};

tapListener.prototype.removeHandler = function(eventName, handler) {
	if (eventName == this.EVENT_NAME)
		this.off(eventName, handler);
};

//Private
tapListener.prototype.isValid = function() {
	return this.ended && 
		   Math.abs(this.distance['x']) < 10 &&
		   Math.abs(this.distance['y']) < 10;
}
